// frontend/src/components/Login.js
import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background: "linear-gradient(to right, #f0f8ff, #ffffff)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        padding: "5vw",
        boxSizing: "border-box",
      }}
    >
      <h1
        style={{
          fontSize: "3vw",
          marginBottom: "3vw",
          color: "#003366",
          fontWeight: "bold",
        }}
      >
        Welcome Back
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 2fr",
          gap: "2vw",
          alignItems: "center",
          maxWidth: "70vw",
          width: "100%",
        }}
      >
        <label style={{ fontSize: "1.3vw", color: "#003366" }}>Email</label>
        <input
          type="email"
          placeholder="you@example.com"
          onChange={(e) => setEmail(e.target.value)}
          style={{
            padding: "1vw",
            fontSize: "1.2vw",
            border: "none",
            borderBottom: "2px solid #007BFF",
            outline: "none",
            background: "transparent",
            width: "100%",
          }}
        />

        <label style={{ fontSize: "1.3vw", color: "#003366" }}>Password</label>
        <input
          type="password"
          placeholder="Enter your password"
          onChange={(e) => setPassword(e.target.value)}
          style={{
            padding: "1vw",
            fontSize: "1.2vw",
            border: "none",
            borderBottom: "2px solid #007BFF",
            outline: "none",
            background: "transparent",
            width: "100%",
          }}
        />
      </div>

      <div style={{ marginTop: "3vw" }}>
        <button
          onClick={handleLogin}
          style={{
            padding: "1vw 3vw",
            fontSize: "1.2vw",
            backgroundColor: "#007BFF",
            color: "white",
            border: "none",
            borderRadius: "2vw",
            cursor: "pointer",
            transition: "all 0.3s ease",
            boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = "#0056b3";
            e.target.style.transform = "scale(1.05)";
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = "#007BFF";
            e.target.style.transform = "scale(1)";
          }}
        >
          Log In
        </button>
      </div>
    </div>
  );
}
