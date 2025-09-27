// api/index.js
import express from "express";
import serverless from "serverless-http";
import cors from "cors";

// Import routes from backend
import punches from "../backend/routes/punch.js";
import computeSummary from "../backend/routes/computeSummary.js";
import dailyReport from "../backend/routes/admin/dailyReport.js";
import editPunch from "../backend/routes/admin/editPunch.js";
import weeklyReport from "../backend/routes/admin/weeklyReport.js";
import adminPunches from "../backend/routes/admin/punches.js";

// Import CORS middleware
import corsMiddleware from "../backend/_cors.js";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(corsMiddleware);

// Health check
app.get("/health", (req, res) => res.json({ status: "ok" }));

// Routes
app.use("/punch", punches);
app.use("/computeSummary", computeSummary);
app.use("/admin/punches", adminPunches);
app.use("/admin/editPunch", editPunch);
app.use("/admin/weeklyReport", weeklyReport);
app.use("/admin/dailyReport", dailyReport);

// Fallback 404
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

export default serverless(app);
