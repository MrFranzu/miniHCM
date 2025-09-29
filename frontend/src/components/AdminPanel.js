// frontend/src/components/AdminPanel.js
import React, { useState } from "react";
import {
  getAdminPunches,
  weeklyReport,
  editPunch,
  dailyReport as fetchDailyReportAPI,
} from "../services/api";

function formatTimestamp(ts) {
  if (!ts) return "N/A";
  if (typeof ts === "object" && ts._seconds) {
    return new Date(ts._seconds * 1000).toISOString();
  }
  if (typeof ts === "string") return ts;
  return JSON.stringify(ts);
}

export default function AdminPanel({ idToken }) {
  const [userName, setUserName] = useState("");
  const [weekStart, setWeekStart] = useState("");
  const [weeklyReportData, setWeeklyReportData] = useState(null);
  const [dailyDate, setDailyDate] = useState("");
  const [dailyReport, setDailyReport] = useState([]);
  const [punches, setPunches] = useState([]);

  async function fetchPunches() {
    try {
      const res = await getAdminPunches({ userName });
      setPunches(res.data.punches || []);
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  }

 async function handleEdit(punch) {
  const newType = prompt("New type (in/out)", punch.type);
  const newTs = prompt("New ISO timestamp or leave blank", formatTimestamp(punch.timestamp));
  try {
    await editPunch({
      docId: punch.docId,     // ✅ use docId
      index: punch.index,     // ✅ use index
      type: newType || punch.type,
      timestampISO: newTs || undefined,
    });
    alert("Updated");
    fetchPunches();
  } catch (err) {
    alert(err.response?.data?.error || err.message);
  }
}


  async function fetchWeekly() {
    try {
      const res = await weeklyReport({ weekStart });
      setWeeklyReportData(res.data);
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  }

  async function fetchDaily() {
    try {
      const res = await fetchDailyReportAPI({ date: dailyDate });
      setDailyReport(res.data.report || []);
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  }

  // Theme colors
  const colors = {
    bg: "#ffffff",
    lightBlue: "#e6f0fb",
    lighterBlue: "#f4faff",
    text: "#003366",
    buttonBg: "#007bff",
    inputBorder: "#a9c4f7",
    shadow: "rgba(0, 0, 0, 0.1)",
  };

  // One column layout
  const containerStyle = {
  display: "flex",
  flexDirection: "column",
  padding: "1.5rem",
  backgroundColor: colors.lighterBlue,
  color: colors.text,
  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  minHeight: "100vh",
  boxSizing: "border-box",
  overflowY: "auto",   // page scroll
  gap: "1.5rem",
};



const sectionStyle = {
  backgroundColor: colors.lightBlue,
  borderRadius: "10px",
  padding: "1.5rem 2rem",
  boxShadow: `0 2px 8px ${colors.shadow}`,
  width: "100%",
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
 
};

// For tables and lists, you can keep their overflow to horizontal only
const tableWrapperStyle = {
  overflowX: "auto",
};


  const headingStyle = {
    margin: "0 0 1rem 0",
    fontWeight: "700",
    fontSize: "1.5rem",
    borderBottom: `2px solid ${colors.buttonBg}`,
    paddingBottom: "0.3rem",
  };

  const labelStyle = {
    fontWeight: "600",
    fontSize: "0.9rem",
    marginBottom: "0.3rem",
    display: "block",
    color: colors.text,
  };

  const inputStyle = {
    padding: "0.5rem",
    marginBottom: "0.8rem",
    borderRadius: "6px",
    border: `1.5px solid ${colors.inputBorder}`,
    fontSize: "1rem",
    color: colors.text,
    outline: "none",
  };

  const buttonStyle = {
    padding: "0.6rem 1.2rem",
    backgroundColor: colors.buttonBg,
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "1rem",
    alignSelf: "flex-start",
  };

  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "1rem",
    fontSize: "0.9rem",
  };

  const thtdStyle = {
    border: `1px solid ${colors.inputBorder}`,
    padding: "0.5rem 0.8rem",
    textAlign: "left",
    backgroundColor: "#fff",
    color: colors.text,
  };

  const editButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#6c757d",
    fontSize: "0.85rem",
    padding: "0.3rem 0.6rem",
  };

  return (
    <div style={containerStyle}>
      {/* Punches */}
      <section style={sectionStyle}>
        <h3 style={headingStyle}>Punches</h3>
        <label style={labelStyle}>User Name</label>
        <input
          style={inputStyle}
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder="Enter user name"
        />
        <button style={buttonStyle} onClick={fetchPunches}>Fetch Punches</button>

        {punches.length === 0 ? (
            <p style={{ marginTop: "1rem", fontStyle: "italic" }}>No punches to show.</p>
          ) : (
            <div
              style={{
                marginTop: "1rem",
                maxHeight: "300px",    // 👈 limit height
                overflowY: "auto",     // 👈 vertical scroll
              }}
            >
              {punches.map((p) => (
                <div
                  key={p.id}
                  style={{
                    marginBottom: "0.7rem",
                    padding: "0.5rem",
                    backgroundColor: "#f9fbff",
                    borderRadius: "6px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>
                    {p.userName || p.userId} — {p.type} — {formatTimestamp(p.timestamp)}
                  </span>
                  <button
                    style={editButtonStyle}
                    onClick={() => handleEdit(p)}
                  >
                    Edit
                  </button>
                </div>
              ))}
            </div>
          )}

      </section>

      {/* Weekly Report */}
      <section style={sectionStyle}>
        <h3 style={headingStyle}>Weekly Report</h3>
        <label style={labelStyle}>Week start (Mon)</label>
        <input
          style={inputStyle}
          type="date"
          value={weekStart}
          onChange={(e) => setWeekStart(e.target.value)}
        />
        <button style={buttonStyle} onClick={fetchWeekly}>Get Weekly Report</button>

        {weeklyReportData && (
          <div style={{ marginTop: "1rem", maxHeight: "400px", overflowY: "auto" }}>
            <h4 style={{ marginBottom: "0.5rem" }}>Totals</h4>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thtdStyle}>Regular</th>
                  <th style={thtdStyle}>OT</th>
                  <th style={thtdStyle}>ND</th>
                  <th style={thtdStyle}>Late</th>
                  <th style={thtdStyle}>Undertime</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={thtdStyle}>{weeklyReportData.totals.regularHours ?? 0}</td>
                  <td style={thtdStyle}>{weeklyReportData.totals.overtimeHours ?? 0}</td>
                  <td style={thtdStyle}>{weeklyReportData.totals.nightDiffHours ?? 0}</td>
                  <td style={thtdStyle}>{weeklyReportData.totals.lateMinutes ?? 0}</td>
                  <td style={thtdStyle}>{weeklyReportData.totals.undertimeMinutes ?? 0}</td>
                </tr>
              </tbody>
            </table>

            <h4 style={{ margin: "1rem 0 0.5rem 0" }}>Per Day</h4>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thtdStyle}>Date</th>
                  <th style={thtdStyle}>User</th>
                  <th style={thtdStyle}>Regular</th>
                  <th style={thtdStyle}>OT</th>
                  <th style={thtdStyle}>ND</th>
                  <th style={thtdStyle}>Late</th>
                  <th style={thtdStyle}>Undertime</th>
                </tr>
              </thead>
              <tbody>
                {weeklyReportData.days.map((d, i) => (
                  <tr key={i}>
                    <td style={thtdStyle}>{d.date}</td>
                    <td style={thtdStyle}>{d.userName || d.userId}</td>
                    <td style={thtdStyle}>{d.regularHours ?? 0}</td>
                    <td style={thtdStyle}>{d.overtimeHours ?? 0}</td>
                    <td style={thtdStyle}>{d.nightDiffHours ?? 0}</td>
                    <td style={thtdStyle}>{d.lateMinutes ?? 0}</td>
                    <td style={thtdStyle}>{d.undertimeMinutes ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Daily Report */}
      <section style={sectionStyle}>
        <h3 style={headingStyle}>Daily Report</h3>
        <label style={labelStyle}>Date</label>
        <input
          style={inputStyle}
          type="date"
          value={dailyDate}
          onChange={(e) => setDailyDate(e.target.value)}
        />
        <button style={buttonStyle} onClick={fetchDaily}>Get Daily Report</button>

        {dailyReport.length > 0 && (
         <div style={{ marginTop: "1rem", maxHeight: "400px", overflowY: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thtdStyle}>User</th>
                  <th style={thtdStyle}>Regular</th>
                  <th style={thtdStyle}>OT</th>
                  <th style={thtdStyle}>ND</th>
                  <th style={thtdStyle}>Late</th>
                  <th style={thtdStyle}>Undertime</th>
                </tr>
              </thead>
              <tbody>
                {dailyReport.map((r, i) => (
                  <tr key={i}>
                    <td style={thtdStyle}>{r.userName || r.userId}</td>
                    <td style={thtdStyle}>{r.regularHours ?? 0}</td>
                    <td style={thtdStyle}>{r.overtimeHours ?? 0}</td>
                    <td style={thtdStyle}>{r.nightDiffHours ?? 0}</td>
                    <td style={thtdStyle}>{r.lateMinutes ?? 0}</td>
                    <td style={thtdStyle}>{r.undertimeMinutes ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
