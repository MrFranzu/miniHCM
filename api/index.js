// api/index.js
import express from "express";
import serverless from "serverless-http";
import bodyParser from "body-parser";
import path from "path";

// import existing handlers (they export default async function handler(req,res) {...})
import punchHandler from "./punch.js";
import computeSummaryHandler from "./computeSummary.js";
import adminPunchesHandler from "./admin/punches.js";
import adminEditPunchHandler from "./admin/editPunch.js";
import adminWeeklyReportHandler from "./admin/weeklyReport.js";
import adminDailyReportHandler from "./admin/dailyReport.js";

// optional: cors helper used by existing handlers (they call setCors inside)
// ensure _cors import path resolves correctly if you moved files
import { setCors } from "../backend/api/_cors.js"; // fallback; we won't use this directly

const app = express();

// Body parser
app.use(bodyParser.json({ limit: "1mb" }));
app.use(bodyParser.urlencoded({ extended: true }));

// Simple CORS middleware (your existing handlers call setCors as well)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, Authorization"
  );
  if (req.method === "OPTIONS") return res.status(200).end();
  next();
});

// Route mapping
// NOTE: your original files expect to be called as serverless functions with same signatures.
// We call them directly and return their result.
app.post("/api/punch", async (req, res) => punchHandler(req, res));
app.post("/api/computeSummary", async (req, res) => computeSummaryHandler(req, res));

// Admin group
app.get("/api/admin/punches", async (req, res) => adminPunchesHandler(req, res));
app.post("/api/admin/editPunch", async (req, res) => adminEditPunchHandler(req, res));
app.post("/api/admin/weeklyReport", async (req, res) => adminWeeklyReportHandler(req, res));
app.post("/api/admin/dailyReport", async (req, res) => adminDailyReportHandler(req, res));

// If you have any other /api/*.js handlers, add them here similarly.
// You can also mount the folder dynamically if you prefer.

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Export for Vercel (serverless)
export const handler = serverless(app);
export default handler;
