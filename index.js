import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import resumeRoutes from "./routes/resumeRoutes.js";

// Load environment variables first
dotenv.config();

// Debug environment variables loading
console.log("🔍 Main Server - Environment Variables Check:");
console.log("OPENAI_API_KEY exists:", !!process.env.OPENAI_API_KEY);
console.log(
  "OPENAI_API_KEY length:",
  process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0
);
console.log("PORT:", process.env.PORT);
console.log("DB_URL exists:", !!process.env.DB_URL);

// app creation
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.options("*", cors());
app.use(
  cors({
   origin: [
  "http://localhost:5173",
 "https://resume-analyzer-p9cd.vercel.app",
 "https://resume-analyzer-lg31.vercel.app",
 "https://resume-analyzer-brown-nu.vercel.app"
  
  
],


    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

try {
  connectDB();
  console.log("✅ Database connection successful");
} catch (error) {
  console.error("Database connection failed:", error.message);
  process.exit(1);
}

// root route for testing
app.get("/", (req, res) => {
  res.send("🚀 Resume Analyzer API is running...");
});

app.get("/api", (req, res) => {
  res.json({ status: "Backend running ✅" });
});

// routes
app.use("/resume", resumeRoutes);

// if (process.env.NODE_ENV !== "production") {
//   app.listen(port, () => {
//     console.log(`🚀 Server running at http://localhost:${port}`);
//   });
// }

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});

export default app;
