import React, { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

export default function History({ user }) {
  const [summaries, setSummaries] = useState([]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "dailySummary"),
      where("userId", "==", user.uid),
      orderBy("date", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setSummaries(rows);
      },
      (err) => {
        console.error(err);
        alert("Failed to load history: " + err.message);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return (
    <div
      style={{
        backgroundColor: "#f9fcff",
        minHeight: "80vh",
        padding: 24,
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        color: "#1a3e72",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        maxWidth: 1200,
        margin: "auto",
      }}
    >
      

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          backgroundColor: "#ffffff",
          borderRadius: 8,
          boxShadow:
            "0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)",
          padding: 16,
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "separate",
            borderSpacing: "0 8px",
            tableLayout: "fixed",
          }}
        >
          <thead>
            <tr style={{ textAlign: "left", color: "#0d274c" }}>
              {["Date", "Regular", "OT", "ND", "Late", "Undertime"].map((head) => (
                <th
                  key={head}
                  style={{
                    padding: "12px 10px",
                    backgroundColor: "#d6e6fb",
                    fontWeight: "600",
                    borderRadius: "6px",
                    userSelect: "none",
                    whiteSpace: "nowrap",
                    fontSize: 14,
                  }}
                >
                  {head}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {summaries.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    textAlign: "center",
                    padding: "20px 0",
                    color: "#7a8ba6",
                    fontStyle: "italic",
                    fontSize: 14,
                  }}
                >
                  No history data available.
                </td>
              </tr>
            ) : (
              summaries.map((s) => (
                <tr
                  key={s.id}
                  style={{
                    backgroundColor: "#f3f9ff",
                    borderRadius: 6,
                    boxShadow:
                      "inset 0 0 5px rgba(13,39,76,0.05)",
                    fontSize: 13,
                    color: "#17427a",
                    userSelect: "text",
                    transition: "background-color 0.2s ease",
                    cursor: "default",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#d6e6fb")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "#f3f9ff")
                  }
                >
                  <td style={{ padding: "10px", whiteSpace: "nowrap" }}>
                    {s.date}
                  </td>
                  <td style={{ padding: "10px", textAlign: "right" }}>
                    {s.regularHours}
                  </td>
                  <td style={{ padding: "10px", textAlign: "right" }}>
                    {s.overtimeHours}
                  </td>
                  <td style={{ padding: "10px", textAlign: "right" }}>
                    {s.nightDiffHours}
                  </td>
                  <td style={{ padding: "10px", textAlign: "right" }}>
                    {s.lateMinutes}
                  </td>
                  <td style={{ padding: "10px", textAlign: "right" }}>
                    {s.undertimeMinutes}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
