import OpenAI from "openai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Debug: Check environment variables
console.log("🔍 OpenAI Service - Environment Check:");
console.log("OPENAI_API_KEY exists:", !!process.env.OPENAI_API_KEY);
console.log("OPENAI_API_KEY length:", process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0);
console.log("OPENAI_API_KEY starts with:", process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 10) + "..." : "undefined");

// Initialize OpenAI client lazily when first needed
let client = null;

function initializeClient() {
  console.log("🔍 initializeClient called");
  console.log("Current client state:", !!client);
  console.log("OPENAI_API_KEY available:", !!process.env.OPENAI_API_KEY);
  
  if (!client && process.env.OPENAI_API_KEY) {
    try {
      client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      console.log("OpenAI client initialized successfully");
    } catch (error) {
      console.error("OpenAI client initialization failed:", error.message);
      console.error("Error details:", error);
    }
  } else if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY not found in environment variables");
  }
  return client;
}

// Keep output strictly JSON
export async function analyzeResumeWithAI(resumeText) {
  console.log("🔍 analyzeResumeWithAI called with text length:", resumeText ? resumeText.length : 0);
  
  // Initialize client when first needed
  const openaiClient = initializeClient();
  
  if (!openaiClient) {
    const error = "OpenAI client not initialized. Please check your OPENAI_API_KEY in .env file";
    console.error("❌", error);
    throw new Error(error);
  }

  try {
    const truncated = (resumeText || "").slice(0, 20000); // safety limit
    console.log("📝 Truncated text length:", truncated.length);
    
    const system = `
You are a professional resume analyst. Analyze the given resume text and return a STRICT JSON response with exactly these fields:

{
  "score": number,                 // Resume quality score from 0-100 (be realistic and detailed)
  "skills": string[],              // 8-15 technical and soft skills found in the resume
  "suggestions": string[],         // 5-8 specific improvement suggestions for the resume
  "jobSuggestions": string[]       // 5-8 job titles/roles that match the candidate's profile
}

IMPORTANT RULES:
- score must be between 0-100 with realistic assessment based on content quality
- skills must be specific and relevant (e.g., "React.js", "Project Management", "Data Analysis")
- suggestions must be actionable and specific to improve the resume
- jobSuggestions must be realistic job titles based on the skills and experience found
- Return ONLY valid JSON, no explanations or extra text
- Ensure all arrays have meaningful content, not empty arrays
- If skills are not clearly visible, infer from job titles, education, or experience mentioned
- If job suggestions are unclear, suggest general roles based on any technical skills found
`;

    console.log("🤖 Sending request to OpenAI...");
    const resp = await openaiClient.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: truncated },
      ],
      temperature: 0.2,
    });

    console.log("✅ OpenAI response received");
    const content = resp.choices?.[0]?.message?.content || "{}";
    console.log("📄 Raw response content:", content.substring(0, 100) + "...");
    
    // If model ever returns fence-wrapped JSON, strip it
    const cleaned = content.replace(/^```json|```$/g, "").trim();
    const parsed = JSON.parse(cleaned);
    console.log("✅ Successfully parsed OpenAI response");
    
    // Validate the response structure and provide fallbacks
    console.log("🔍 Validating response structure:");
    console.log("- Score:", parsed.score, "Type:", typeof parsed.score);
    console.log("- Skills count:", parsed.skills?.length || 0);
    console.log("- Suggestions count:", parsed.suggestions?.length || 0);
    console.log("- Job suggestions count:", parsed.jobSuggestions?.length || 0);
    
    // Ensure all required fields exist with meaningful defaults if missing
    const validatedResponse = {
      score: typeof parsed.score === 'number' && parsed.score >= 0 && parsed.score <= 100 ? parsed.score : 50,
      skills: Array.isArray(parsed.skills) && parsed.skills.length > 0 ? parsed.skills : ["Basic resume skills"],
      suggestions: Array.isArray(parsed.suggestions) && parsed.suggestions.length > 0 ? parsed.suggestions : ["Please provide more details in your resume"],
      jobSuggestions: Array.isArray(parsed.jobSuggestions) && parsed.jobSuggestions.length > 0 ? parsed.jobSuggestions : ["General professional positions"]
    };
    
    console.log("✅ Final validated response:", validatedResponse);
    return validatedResponse;
  } catch (error) {
    console.error("❌ Error in analyzeResumeWithAI:", error.message);
    console.error("Error type:", error.constructor.name);
    console.error("Full error:", error);
    throw error;
  }
}
