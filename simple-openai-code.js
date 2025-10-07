#!/usr/bin/env node

// Simple OpenAI code generation script
// Run with: node simple-openai-code.js "your prompt here"

const { OpenAI } = require('openai');
require('dotenv').config();

async function generateCode(prompt) {
  // Check for API key
  if (!process.env.OPENAI_API_KEY) {
    console.error("Error: OPENAI_API_KEY not found in environment variables.");
    console.log("Create a .env file with your API key like this:");
    console.log("OPENAI_API_KEY=your-api-key-here");
    process.exit(1);
  }

  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  console.log(`Generating code for: "${prompt}"`);
  console.log("Please wait...");

  try {
    // Generate code with OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert programmer. Generate clean, efficient code that solves the user's request. Focus on providing working code with minimal explanation."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
    });

    // Display the generated code
    console.log("\n=== Generated Code ===\n");
    console.log(response.choices[0].message.content);
    
  } catch (error) {
    console.error("Error:", error.message);
    if (error.response) {
      console.error(error.response.data);
    }
  }
}

// Get the prompt from command line arguments
const prompt = process.argv.slice(2).join(" ");

if (!prompt) {
  console.log("Usage: node simple-openai-code.js \"your code generation prompt\"");
  console.log("Example: node simple-openai-code.js \"write a function to calculate fibonacci numbers\"");
  process.exit(1);
}

// Run the code generation
generateCode(prompt);