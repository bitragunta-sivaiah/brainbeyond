// This helper function handles API calls with exponential backoff for retries.
const fetchWithRetry = async (url, options, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        return response.json();
      } else {
        const errorBody = await response.text();
        // Throw an error with details from the API response
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
      }
    } catch (error) {
      console.warn(`Fetch error for ${url}, retrying in ${delay / 1000}s...`, error.message);
      // If this is the last retry, re-throw the error to be caught by the calling function
      if (i === retries - 1) {
        console.error(`Fetch failed after ${retries} retries for ${url}.`);
        throw error;
      }
      // Wait for the specified delay before the next retry
      await new Promise(res => setTimeout(res, delay));
      delay *= 2; // Double the delay for the next attempt (exponential backoff)
    }
  }
};

// --- API Configuration ---
// It's crucial to keep your API key in environment variables for security.
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_TEXT_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;


/**
 * Generates roadmap content by calling the Gemini AI API.
 * @param {object} params - The parameters for generating the roadmap.
 * @param {string} params.skill - The skill to learn (e.g., "React").
 * @param {string} params.skillLevel - The user's current level ('beginner', 'intermediate', 'advanced').
 * @param {number} params.totalDurationDays - The total number of days for the roadmap.
 * @returns {Promise<object>} A promise that resolves to the structured AI-generated roadmap data.
 */
export const generateRoadmapFromAI = async ({ skill, skillLevel, totalDurationDays }) => {
  // --- AI Prompt Engineering ---
  // This is the detailed instruction set for the AI model.
  const textPrompt = `Generate a learning roadmap for a ${skillLevel} in ${skill} for ${totalDurationDays} days.
  The response MUST be a valid JSON object that adheres to the provided schema.
  The roadmap should include:
  1. A concise "title" for the roadmap.
  2. A detailed "description" of what the user will learn.
  3. A comprehensive "dailyPlan" array covering all ${totalDurationDays} days. Each day's plan should list specific activities.
  4. Each activity must have:
     - A clear "title".
     - A "description" (can include simple HTML like <strong> or <em>).
     - An array of "resources" with real-world links (documentation, tutorials, articles).
     - If a diagram is relevant for an activity, include a resource string prefixed with 'DIAGRAM_PROMPT: ' followed by a descriptive prompt for an image (e.g., 'DIAGRAM_PROMPT: Flowchart of the React component lifecycle.').
     - "isCompleted" must be set to false.
  5. Exactly 5 relevant "tags" as an array of strings (e.g., ["webdev", "frontend", "javascript"]).
  6. "isPublic" must be set to true.
  7. "status" must be set to 'published'.`;

  // --- API Payload ---
  // This defines the structure we send to the Gemini API.
  const textPayload = {
    contents: [{ role: "user", parts: [{ text: textPrompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          "title": { "type": "STRING" },
          "description": { "type": "STRING" },
          "dailyPlan": {
            "type": "ARRAY",
            "items": {
              "type": "OBJECT",
              "properties": {
                "day": { "type": "NUMBER" },
                "activities": {
                  "type": "ARRAY",
                  "items": {
                    "type": "OBJECT",
                    "properties": {
                      "title": { "type": "STRING" },
                      "description": { "type": "STRING" },
                      "resources": { "type": "ARRAY", "items": { "type": "STRING" } },
                      "isCompleted": { "type": "BOOLEAN" }
                    },
                    "required": ["title", "description", "resources", "isCompleted"]
                  }
                }
              },
              "required": ["day", "activities"]
            }
          },
          "tags": { "type": "ARRAY", "items": { "type": "STRING" } },
          "isPublic": { "type": "BOOLEAN" },
          "status": { "type": "STRING" }
        },
        "required": ["title", "description", "dailyPlan", "tags", "isPublic", "status"]
      }
    }
  };

  const textApiOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(textPayload)
  };

  // --- API Call and Response Handling ---
  const textResult = await fetchWithRetry(GEMINI_TEXT_API_URL, textApiOptions);

  // Validate the structure of the AI's response
  if (!textResult.candidates?.[0]?.content?.parts?.[0]?.text) {
    console.error('Gemini API response structure is unexpected:', JSON.stringify(textResult, null, 2));
    throw new Error('Failed to generate roadmap content due to an unexpected AI response.');
  }

  let aiData;
  try {
    aiData = JSON.parse(textResult.candidates[0].content.parts[0].text);
  } catch (parseError) {
    console.error('Failed to parse AI-generated JSON:', parseError);
    throw new Error('Failed to parse the AI-generated JSON content.');
  }

  // --- Process Diagram Prompts ---
  // This loop finds diagram prompts and replaces them with a user-friendly placeholder
  // instead of attempting to call the paid Imagen API.
  for (const dayPlan of aiData.dailyPlan) {
    for (const activity of dayPlan.activities) {
      const updatedResources = [];
      for (const resource of activity.resources) {
        if (resource.startsWith('DIAGRAM_PROMPT: ')) {
          const imagePrompt = resource.substring('DIAGRAM_PROMPT: '.length).trim();
          console.log(`Diagram prompt found: "${imagePrompt}". Inserting a placeholder.`);
          
          // Replace the prompt with an HTML placeholder to be rendered on the frontend.
          updatedResources.push(
            `<div style="border: 1px dashed #ccc; padding: 10px; border-radius: 8px; margin: 10px 0; background-color: #f9f9f9;">
                <p><strong>🎨 Diagram Placeholder:</strong></p>
                <p><em>${imagePrompt}</em></p>
                <small>(Automatic image generation is disabled. This visual can be created manually.)</small>
             </div>`
          );
        } else {
          updatedResources.push(resource);
        }
      }
      activity.resources = updatedResources;
    }
  }

  return aiData;
};