import express from "express";
import serverless from "serverless-http";
import cors from "cors";

import punches from "../backend/routes/punch.js";
import computeSummary from "../backend/routes/computeSummary.js";
import dailyReport from "../backend/routes/admin/dailyReport.js";
import editPunch from "../backend/routes/admin/editPunch.js";
import weeklyReport from "../backend/routes/admin/weeklyReport.js";
import adminPunches from "../backend/routes/admin/punches.js";

import { setCors } from "../backend/_cors.js";

const app = express();

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use(cors());
app.use(express.json());

// ✅ Global CORS middleware
app.use((req, res, next) => {
  setCors(res);
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/punch", punches);
app.use("/computeSummary", computeSummary);
app.use("/admin/punches", adminPunches);
app.use("/admin/editPunch", editPunch);
app.use("/admin/weeklyReport", weeklyReport);
app.use("/admin/dailyReport", dailyReport);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

export default serverless(app);
