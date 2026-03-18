const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const SERVICE_VERSION = "1.2";

/**
 * Generates a concise summary and relevant keyword tags for an idea.
 * @param {Object} ideaData - { title, description, proposedSolution }
 * @returns {Promise<{summary: string, tags: string[]}>}
 */
async function generateIdeaInsights(ideaData) {
  console.log(`[AI-v${SERVICE_VERSION}] Starting insights generation for: "${ideaData.title}"`);
  
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_api_key_here') {
    console.warn("[AI] GEMINI_API_KEY not set or is placeholder. Skipping AI processing.");
    return null;
  }

  const prompt = `
    Summarize the following idea into one clear single-line description. 
    Also extract 5-8 relevant keyword tags. 
    Keep output concise and professional.
    
    Idea Title: ${ideaData.title}
    Full Description: ${ideaData.description}
    
    Response must be a valid JSON object with exactly these keys:
    {
      "summary": "one line summary here",
      "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
    }
  `;

  const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      console.log(`[AI] Attempting with model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      console.log(`[AI] Received response from ${modelName}`);
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error(`[AI] Could not find JSON block in ${modelName} response.`);
        continue; // Try next model
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      console.log(`[AI] Successfully parsed insights using ${modelName}`);
      
      return {
        summary: parsed.summary || "",
        tags: Array.isArray(parsed.tags) ? parsed.tags : []
      };
    } catch (error) {
      console.error(`[AI] Model ${modelName} failed:`, error.message);
      lastError = error;
    }
  }

  console.error("[AI] All models failed. Last error:", lastError?.message);
  return null;
}

/**
 * Generates a structured action plan (list of steps) for a project.
 * @param {Object} projectData - { title, problemDescription, proposedSolution }
 * @returns {Promise<Array<{description: string}>>}
 */
async function generateProjectPlan(projectData) {
  console.log(`[AI] Generating project plan for: "${projectData.title}"`);

  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_api_key_here') {
    console.warn("[AI] GEMINI_API_KEY not set. Skipping project plan generation.");
    return null;
  }

  const prompt = `
    You are a project planning assistant. Based on the following project details, generate a structured action plan with clear, actionable steps that a team can follow to implement this idea.

    Project Title: ${projectData.title}
    Problem Description: ${projectData.problemDescription || 'Not provided'}
    Proposed Solution: ${projectData.proposedSolution || 'Not provided'}

    Generate 5-8 specific, practical action steps.
    Each step should be a concrete task, not vague advice.

    Response must be a valid JSON array of objects:
    [
      { "description": "Step description here" },
      { "description": "Another step here" }
    ]
    Return ONLY the JSON array, no other text.
  `;

  const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      console.log(`[AI] Attempting project plan with model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.error(`[AI] Could not find JSON array in ${modelName} response.`);
        continue;
      }

      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed)) {
        console.log(`[AI] Successfully generated ${parsed.length} steps using ${modelName}`);
        return parsed;
      }
    } catch (error) {
      console.error(`[AI] Model ${modelName} failed for project plan:`, error.message);
      lastError = error;
    }
  }

  console.error("[AI] All models failed for project plan. Last error:", lastError?.message);
  return null;
}

/**
 * Fills form fields from a free-text idea description.
 * @param {Object} params - { description, fields: [{id, label, type, options}] }
 * @returns {Promise<Object>} - { fieldId: value, ... }
 */
async function generateFormAutofill({ description, fields }) {
  console.log(`[AI] Generating form autofill for ${fields.length} fields`);

  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_api_key_here') {
    console.warn("[AI] GEMINI_API_KEY not set. Skipping form autofill.");
    return null;
  }

  const fieldDescriptions = fields
    .filter(f => !['file', 'voice', 'attachment'].includes(f.type))
    .map(f => {
      let desc = `  - "${f.id}" (${f.type}): ${f.label}`;
      if (f.type === 'select' && f.options?.length) {
        desc += ` [valid options: ${f.options.join(', ')}]`;
      }
      return desc;
    })
    .join('\n');

  const prompt = `
You are a form-filling assistant. A user has described their idea below. Extract relevant information and fill in as many form fields as possible.

User's Idea Description:
"""
${description}
"""

Form Fields Structure:
${fieldDescriptions}

Rules:
1. Return a valid JSON object where keys are field IDs and values are the extracted content
2. Only include fields you can confidently fill from the description
3. For "select" type fields, only use one of the valid options listed — if unsure, omit
4. For "textarea" type fields, write clear, professional content
5. For "text" type fields, keep it concise
6. For "url" type fields, only include if a URL was explicitly mentioned
7. Leave fields empty (omit them) if the description doesn't provide enough info — do NOT guess
8. Do NOT add any explanation — return ONLY the raw JSON object

Example valid response:
{"title": "...", "problemDescription": "...", "proposedSolution": "..."}
`.trim();

  const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      console.log(`[AI] Attempting form autofill with model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error(`[AI] No JSON found in autofill response from ${modelName}`);
        continue;
      }

      const parsed = JSON.parse(jsonMatch[0]);
      console.log(`[AI] Autofill successful via ${modelName}, filled ${Object.keys(parsed).length} fields`);
      return parsed;
    } catch (error) {
      console.error(`[AI] Autofill failed with ${modelName}:`, error.message);
      lastError = error;
    }
  }

  console.error("[AI] All models failed for form autofill:", lastError?.message);
  return null;
}

module.exports = {
  generateIdeaInsights,
  generateProjectPlan,
  generateFormAutofill
};
