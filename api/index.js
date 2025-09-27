// api/index.js
import express from "express";
import serverless from "serverless-http";
import cors from "cors";
import punches from "./punch.js";
import computeSummary from "./computeSummary.js";
import dailyReport from "./admin/dailyReport.js";
import editPunch from "./admin/editPunch.js";
import weeklyReport from "./admin/weeklyReport.js";
import adminPunches from "./admin/punches.js";
import corsMiddleware from "./_cors.js";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(corsMiddleware);

// Routes
app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/punch", punches);
app.use("/api/computeSummary", computeSummary);
app.use("/api/admin/punches", adminPunches);
app.use("/api/admin/editPunch", editPunch);
app.use("/api/admin/weeklyReport", weeklyReport);
app.use("/api/admin/dailyReport", dailyReport);

// Fallback 404
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Wrap Express into a serverless handler
export default serverless(app);
