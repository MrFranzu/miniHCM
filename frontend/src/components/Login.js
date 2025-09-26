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
        background: "linear-gradient(to right, #e6f2ff, #ffffff)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "5vw",
        boxSizing: "border-box",
      }}
    >
      <h1
        style={{
          fontSize: "3vw",
          marginBottom: "2vw",
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
          gap: "1vw",
          alignItems: "center",
          maxWidth: "60vw",
          width: "100%",
        }}
      >
        <label style={{ fontSize: "1.2vw", color: "#003366" }}>Email</label>
        <input
          type="email"
          placeholder="you@example.com"
          onChange={(e) => setEmail(e.target.value)}
          style={{
            padding: "1vw",
            fontSize: "1.2vw",
            border: "1px solid #ccc",
            borderRadius: "0.5vw",
            width: "100%",
          }}
        />

        <label style={{ fontSize: "1.2vw", color: "#003366" }}>Password</label>
        <input
          type="password"
          placeholder="Enter your password"
          onChange={(e) => setPassword(e.target.value)}
          style={{
            padding: "1vw",
            fontSize: "1.2vw",
            border: "1px solid #ccc",
            borderRadius: "0.5vw",
            width: "100%",
          }}
        />
      </div>

      <div style={{ marginTop: "2vw" }}>
        <button
          onClick={handleLogin}
          style={{
            padding: "1vw 2vw",
            fontSize: "1.2vw",
            backgroundColor: "#007BFF",
            color: "white",
            border: "none",
            borderRadius: "0.5vw",
            cursor: "pointer",
            transition: "background 0.3s ease",
          }}
          onMouseOver={(e) => (e.target.style.backgroundColor = "#0056b3")}
          onMouseOut={(e) => (e.target.style.backgroundColor = "#007BFF")}
        >
          Log In
        </button>
      </div>
    </div>
  );
}
