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

module.exports = {
  generateIdeaInsights
};
