import Resume from "../models/resume.js";
import { analyzeResumeWithAI } from "../services/openai.service.js";
import fs from "fs";
// import { fromPath } from "pdf2pic";
import pdf from "pdf-parse";
import { promises as fsp } from "fs";

export const uploadAndAnalyze = async (req, res) => {
  console.log("📥 New request received for resume upload + analysis");

  try {
    // File check
    if (!req.file) {
      console.error("No file uploaded");
      return res.status(400).json({ error: "No file uploaded" });
    }
    console.log("✅ File received:", req.file.originalname);

    // Save initial metadata
    let doc = await Resume.create({
      originalName: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype,
    });
    console.log("💾 Metadata saved to DB with _id:", doc._id);

    // Extract text from PDF using pdf2pic
    let resumeText = "";
    if (req.file && req.file.buffer) {
      try {
        const pdfData = await pdf(req.file.buffer);
        resumeText = pdfData.text;
      } catch (err) {
        console.error("❌ PDF parsing failed:", err.message);
        resumeText = `Could not extract text. File info: ${req.file.originalname}`;
      }
    } else {
      console.warn("⚠️ No file buffer found, skipping PDF parse");
      resumeText = "No resume file uploaded.";
    }
    // Send to OpenAI
    let analysis;
    try {
      console.log("🤖 Sending resume to OpenAI...");
      console.log("📝 Resume text length:", resumeText.length);
      console.log("📝 Resume text preview:", resumeText.substring(0, 300) + "...");
      
      analysis = await analyzeResumeWithAI(resumeText);
      console.log("✅ OpenAI analysis successful:", analysis);
      
      // Validate analysis structure
      if (!analysis.score || !analysis.skills || !analysis.suggestions || !analysis.jobSuggestions) {
        console.warn("⚠️ Analysis missing required fields, using fallback");
        analysis = {
          score: analysis.score || 50,
          skills: analysis.skills || ["Basic skills"],
          suggestions: analysis.suggestions || ["Please provide more details"],
          jobSuggestions: analysis.jobSuggestions || ["General positions"],
        };
      }
      
      console.log("🔍 Final analysis structure:", {
        score: analysis.score,
        skillsCount: analysis.skills?.length,
        suggestionsCount: analysis.suggestions?.length,
        jobSuggestionsCount: analysis.jobSuggestions?.length
      });
      
    } catch (err) {
      console.error("❌ OpenAI analysis failed:", err.message);
      console.error("❌ Full error details:", err);
      
      // Ensure fallback analysis has all required fields
      analysis = {
        score: 50,
        skills: ["Basic resume analysis"],
        suggestions: ["Could not analyze properly, please upload a valid PDF resume", "Check if OpenAI API key is configured"],
        jobSuggestions: ["General positions"],
      };
      
      console.log("⚠️ Using fallback analysis:", analysis);
    }

    // Save in DB
    doc.analysis = analysis;
    await doc.save();
    console.log("💾 Analysis saved in DB for _id:", doc._id);

    return res.json({ ok: true, doc });
  } catch (err) {
    console.error("❌ Unexpected error:", err.message);
    return res.status(500).json({ error: "Server error", details: err.message });
  }
};
