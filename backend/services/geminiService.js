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

  // Model priority: 2.5 Flash → 2.0 Flash → 1.5 Pro → 1.5 Flash
  const modelsToTry = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-pro",
    "gemini-1.5-flash",
  ];

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
    IMPORTANT: Even if the provided description is very short or vague, DO NOT refuse to generate steps. You MUST extrapolate and generate a full set of 5-8 logical, detailed steps that would be required to implement such an idea. DO NOT output errors or complaints about the text being too short.

    Response must be a valid JSON array of objects:
    [
      { "description": "Step description here" },
      { "description": "Another step here" }
    ]
    Return ONLY the JSON array, no other text.
  `;

  const modelsToTry = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-pro",
    "gemini-1.5-flash",
  ];
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
1. MANDATORY: You MUST fill out EVERY SINGLE FIELD provided in the structure for BOTH languages. Even if the user's description is just one word, extrapolate and flesh out highly detailed, professional content for EVERY field. NEVER return empty objects or skip fields.
2. For "select" type fields, pick the best matching valid option from the list. Keep select values in English even in the Hindi response.
3. For "textarea" type fields, write clear and expansive content (at least 2-3 sentences).
4. For "text" type fields, keep it concise but descriptive.
5. For "url" type fields, only include if a URL was explicitly mentioned, otherwise omit.
6. Do NOT add any explanation — return ONLY the raw JSON object described below.

Return a JSON object with EXACTLY two top-level keys: "en" and "hi".
- "en": all field values written in clear, professional English.
- "hi": all field values written in simple, everyday Hindi (Devanagari script) that a factory or office worker can easily read and understand. Avoid Sanskrit-heavy or overly formal words — use the Hindi people actually speak. For "select" type fields, keep the value in English (it must match the option label exactly).

Example valid response:
{
  "en": {"title": "...", "problemDescription": "...", "proposedSolution": "..."},
  "hi": {"title": "...", "problemDescription": "...", "proposedSolution": "..."}
}
`.trim();

  const modelsToTry = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-pro",
    "gemini-1.5-flash",
  ];
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

      // New shape: { en: {...}, hi: {...} }
      if (parsed.en && typeof parsed.en === 'object') {
        console.log(`[AI] Bilingual autofill successful via ${modelName}, en: ${Object.keys(parsed.en).length} fields, hi: ${Object.keys(parsed.hi || {}).length} fields`);
        return {
          en: parsed.en,
          hi: parsed.hi && typeof parsed.hi === 'object' ? parsed.hi : {}
        };
      }

      // Fallback: old flat shape returned — treat as English only
      if (typeof parsed === 'object' && !Array.isArray(parsed)) {
        console.warn(`[AI] Autofill via ${modelName} returned flat shape (legacy). Treating as English only.`);
        return { en: parsed, hi: {} };
      }

      console.error(`[AI] Unexpected autofill response shape from ${modelName}`);
    } catch (error) {
      console.error(`[AI] Autofill failed with ${modelName}:`, error.message);
      lastError = error;
    }
  }

  console.error('[AI] All models failed for form autofill:', lastError?.message);
  return null;
}

/**
 * Generates a template structure from a natural-language prompt.
 * @param {string} userPrompt - e.g. "Create a process improvement template..."
 * @param {Array}  masterFields - fields from the Master Template (global fields to exclude)
 * @returns {Promise<{template_name: string, fields: Array}>}
 */
async function generateTemplateFromPrompt(userPrompt, masterFields = []) {
  console.log(`[AI] Generating template from prompt: "${userPrompt.slice(0, 80)}..."`);

  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_api_key_here') {
    console.warn("[AI] GEMINI_API_KEY not set. Skipping template generation.");
    return null;
  }

  // Build a clear list of forbidden fields for the prompt
  const masterFieldLines = masterFields.length
    ? masterFields.map(f => `  - "${f.label}" (id: ${f.id}, type: ${f.type})`).join('\n')
    : '  (none)';

  const prompt = `
You are a form template designer. Based on the user's description below, generate a structured template for an idea submission system.

User Request: "${userPrompt}"

Supported field types: text, textarea, number, select, date, url

STRICT RULES — read carefully:
1. Generate a template name and 4-8 relevant, specific fields.
2. Each field must have: id (camelCase, unique), label (human-readable), type (from supported list), required (true/false), options (array, only for "select" type, otherwise [])
3. Do NOT include ANY of the following global fields that already exist in EVERY template. These are FORBIDDEN:
${masterFieldLines}
4. NEVER generate these field types: "file", "voice", "attachment" — these are always provided globally.
5. Do NOT generate duplicate field ids or duplicate field labels.
6. Do NOT generate fields for: title, description, category — these are handled by the system.
7. For "select" fields, provide 3-6 relevant and distinct options.
8. Keep fields focused and specific to the template's purpose — avoid generic fields.

Response must be valid JSON (no markdown, no code blocks):
{
  "template_name": "...",
  "description": "one-line description of the template",
  "fields": [
    { "id": "fieldId", "label": "Field Label", "type": "text", "required": true, "options": [] }
  ]
}
Return ONLY the JSON object, no other text.
`.trim();

  const modelsToTry = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-pro",
    "gemini-1.5-flash",
  ];
  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      console.log(`[AI] Attempting template generation with model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error(`[AI] No JSON found in template response from ${modelName}`);
        continue;
      }

      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.template_name && Array.isArray(parsed.fields)) {
        // ── Post-processing guardrail pipeline ─────────────────────────────
        const RESTRICTED_TYPES = new Set(['file', 'voice', 'attachment']);
        const VALID_TYPES = new Set(['text', 'textarea', 'number', 'select', 'date', 'url']);
        const masterLabelSet = new Set(masterFields.map(f => f.label.toLowerCase().trim()));
        const masterIdSet = new Set(masterFields.map(f => f.id.toLowerCase().trim()));
        const seenIds = new Set();
        const seenLabels = new Set();

        const cleanFields = [];
        for (const f of parsed.fields) {
          const id = (f.id || '').trim();
          const label = (f.label || '').trim();
          const type = (f.type || 'text').trim();

          if (!id || !label) continue;                                      // Step 1: must have id + label
          if (RESTRICTED_TYPES.has(type)) continue;                         // Step 3: no file/voice
          if (!VALID_TYPES.has(type)) continue;                             // Step 4: only valid types
          if (masterIdSet.has(id.toLowerCase())) continue;                  // Step 2: no master overlap (id)
          if (masterLabelSet.has(label.toLowerCase())) continue;            // Step 2: no master overlap (label)
          if (seenIds.has(id.toLowerCase())) continue;                      // Step 2: no duplicate id
          if (seenLabels.has(label.toLowerCase())) continue;                // Step 2: no duplicate label

          seenIds.add(id.toLowerCase());
          seenLabels.add(label.toLowerCase());
          cleanFields.push({
            id,
            label,
            type: VALID_TYPES.has(type) ? type : 'text',
            required: f.required === true,
            options: Array.isArray(f.options) ? f.options : [],
          });
        }

        console.log(`[AI] Template generated via ${modelName}: "${parsed.template_name}" — raw: ${parsed.fields.length} fields, clean: ${cleanFields.length} fields`);
        return { ...parsed, fields: cleanFields };
      }
    } catch (error) {
      console.error(`[AI] Template generation failed with ${modelName}:`, error.message);
      lastError = error;
    }
  }

  console.error("[AI] All models failed for template generation:", lastError?.message);
  return null;
}

module.exports = {
  generateIdeaInsights,
  generateProjectPlan,
  generateFormAutofill,
  generateTemplateFromPrompt
};
