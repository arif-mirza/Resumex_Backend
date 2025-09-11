import mongoose from "mongoose";

const ResumeSchema = new mongoose.Schema(
  {
    originalName: String,
    path: String,
    size: Number,
    mimeType: String,
    analysis: {
      score: { type: Number, default: 0 },
      skills: [String],
      suggestions: [String],
      jobSuggestions: [String]
    }
  },
  { timestamps: true }
);

export default mongoose.model("Resume", ResumeSchema);
