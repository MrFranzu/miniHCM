import React, { useEffect, useState } from "react";
import { punch } from "../services/api";
import { db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";

export default function PunchButtons({ user }) {
  const [lastPunch, setLastPunch] = useState(null);

  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().slice(0, 10);
    const ref = doc(db, "attendance", `${user.uid}_${today}`);

    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data.punches) && data.punches.length > 0) {
          setLastPunch(data.punches[data.punches.length - 1].type);
        }
      }
    });

    return () => unsub();
  }, [user]);

  const doPunch = async (type) => {
    try {
      const res = await punch(type);   // ✅ FIXED
      alert(`Punched ${type}`);
      console.log("Punch response:", res.data);
    } catch (err) {
      console.error("Punch error:", err);
      alert("Error punching: " + (err.response?.data?.error || err.message));
    }
  };

  const containerStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    padding: "20px",
    backgroundColor: "#f5fbff",
    color: "#004080",
    minHeight: "250px",
    maxHeight: "400px",
    width: "90vw",
    maxWidth: "600px",
    margin: "20px auto",
    overflowY: "auto",
    borderRadius: "10px",
    boxShadow: "0 4px 10px rgba(0, 64, 128, 0.15)",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  };

  const headerStyle = {
    fontSize: "1.8rem",
    fontWeight: "700",
    borderBottom: "2px solid #99c2ff",
    paddingBottom: "8px",
    marginBottom: "15px",
  };

  const statusStyle = {
    fontSize: "1.2rem",
    marginBottom: "20px",
    fontWeight: "600",
  };

  const buttonsContainerStyle = {
    display: "flex",
    justifyContent: "space-between",
    gap: "15px",
  };

  const buttonBase = {
    flex: 1,
    padding: "12px 0",
    fontSize: "1.1rem",
    fontWeight: "600",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    transition: "background-color 0.3s ease",
  };

  const punchInStyle = {
    ...buttonBase,
    backgroundColor: lastPunch === "in" ? "#a6c8ff" : "#007bff",
    color: "#fff",
    opacity: lastPunch === "in" ? 0.6 : 1,
  };

  const punchOutStyle = {
    ...buttonBase,
    backgroundColor: lastPunch !== "in" ? "#a6c8ff" : "#0056b3",
    color: "#fff",
    opacity: lastPunch !== "in" ? 0.6 : 1,
  };

  return (
    <div style={containerStyle}>
      <h3 style={headerStyle}>Punch</h3>
      <p style={statusStyle}>
        Status:{" "}
        {lastPunch === "in"
          ? "Currently IN"
          : lastPunch === "out"
          ? "Currently OUT"
          : "Not yet punched"}
      </p>
      <div style={buttonsContainerStyle}>
        <button
          style={punchInStyle}
          disabled={lastPunch === "in"}
          onClick={() => doPunch("in")}
        >
          Punch In
        </button>
        <button
          style={punchOutStyle}
          disabled={lastPunch !== "in"}
          onClick={() => doPunch("out")}
        >
          Punch Out
        </button>
      </div>
    </div>
  );
}
