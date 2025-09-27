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

app.use(cors());
app.use(express.json());
app.use(corsMiddleware);

// Routes
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
