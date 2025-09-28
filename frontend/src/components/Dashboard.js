import React, { useState } from "react";
import { computeSummary } from "../services/api";

export default function Dashboard({ user }) {
  const [summary, setSummary] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const handleCompute = async () => {
    try {
      const res = await computeSummary(date);   // ✅ FIXED
      setSummary(res.data);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || err.message);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 25 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
        <label htmlFor="date" style={{ fontWeight: "600", fontSize: 16, minWidth: 50 }}>
          Date:
        </label>
        <input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{
            padding: "8px 12px",
            fontSize: 16,
            borderRadius: 6,
            border: "1.5px solid #a0c4ff",
            backgroundColor: "white",
            color: "#003366",
            maxWidth: 220,
            outlineColor: "#4a90e2",
            transition: "border-color 0.3s",
          }}
        />
        <button
          onClick={handleCompute}
          style={{
            padding: "10px 20px",
            fontSize: 16,
            fontWeight: "600",
            backgroundColor: "#4a90e2",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          Compute Summary
        </button>
      </div>

      {summary && (
        <div
          style={{
            backgroundColor: "white",
            padding: 20,
            borderRadius: 10,
            boxShadow: "0 4px 12px rgba(0, 51, 102, 0.1)",
            color: "#003366",
            lineHeight: 1.6,
            fontSize: 15,
          }}
        >
          <p style={{ margin: "6px 0", fontWeight: "600", fontSize: 18 }}>
            Total Worked: <span>{summary.totalWorkedHours} hrs</span>
          </p>
          <p>Regular: {summary.regularHours} hrs</p>
          <p>Overtime: {summary.overtimeHours} hrs</p>
          <p>Night Diff: {summary.nightDiffHours} hrs</p>
          <p>Late: {summary.lateMinutes} mins</p>
          <p>Undertime: {summary.undertimeMinutes} mins</p>
        </div>
      )}
    </div>
  );
}
