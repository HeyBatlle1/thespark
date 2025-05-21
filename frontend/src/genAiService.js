// frontend/src/genAiService.js

import { GoogleGenerativeAI } from '@google/generative-ai';

// Access your API key as an environment variable
const API_KEY = process.env.REACT_APP_GOOGLE_GENERATIVE_AI_API_KEY;

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Generates text content using the Google Generative AI model.
 * @param {string} prompt The input prompt for the AI model.
 * @returns {Promise<string>} A promise that resolves with the generated text content.
 */
export async function generateContent(prompt) {
  try {
    // For text-only input, use the gemini-pro model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return text;
  } catch (error) {
    console.error("Error generating content:", error);
    throw error; // Re-throw the error to be handled by the caller
  }
}
