import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import resumeRoutes from "./routes/resumeRoutes.js";

// Load environment variables
dotenv.config();

// Debug environment variables loading (optional, but good for troubleshooting)
console.log("🔍 Main Server - Environment Variables Check:");
console.log("OPENAI_API_KEY exists:", !!process.env.OPENAI_API_KEY);
console.log("PORT:", process.env.PORT);
console.log("DB_URL exists:", !!process.env.DB_URL);

// app creation
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://resume-analyzer-p9cd.vercel.app",
      "https://resume-analyzer-lg31.vercel.app",
      "https://resume-analyzer-brown-nu.vercel.app",
      // Add your production Vercel URL here when you know it
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Database connection
try {
  connectDB();
  console.log("✅ Database connection successful");
} catch (error) {
  console.error("Database connection failed:", error.message);
  process.exit(1);
}

// Root routes for testing
app.get("/", (req, res) => {
  res.send("🚀 Resume Analyzer API is running...");
});

app.get("/api", (req, res) => {
  res.json({ status: "Backend running ✅" });
});

// Main application routes
app.use("/resume", resumeRoutes);

export default app;
