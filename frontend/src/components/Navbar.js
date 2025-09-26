import React from "react";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";

export default function Navbar({ user }) {
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      alert("Signed out successfully");
    } catch (err) {
      alert("Error signing out: " + err.message);
    }
  };

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 24px",
        background: "#e6f0ff", // light blue background
        color: "#003366", // dark blue text for contrast
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: "16px",
        overflowX: "auto", // horizontal scroll if content too wide
        whiteSpace: "nowrap",
        boxSizing: "border-box",
        width: "100%",
      }}
    >
      <div style={{ flexShrink: 0 }}>
        {user ? `Welcome, ${user.displayName || user.email}` : "Not signed in"}
      </div>
      {user && (
        <button
          onClick={handleSignOut}
          style={{
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            padding: "8px 16px",
            borderRadius: "4px",
            cursor: "pointer",
            flexShrink: 0,
            transition: "background-color 0.3s ease",
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#0056b3")}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#007bff")}
          aria-label="Sign out"
        >
          Sign Out
        </button>
      )}
    </nav>
  );
}
