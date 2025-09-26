import React, { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tz, setTz] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
  );

  const handleRegister = async () => {
    try {
      if (!email || !password)
        return alert("Email and password are required.");
      if (password.length < 6)
        return alert("Password must be at least 6 characters.");

      const userCred = await createUserWithEmailAndPassword(auth, email, password);

      if (name) {
        await updateProfile(userCred.user, { displayName: name });
      }

      await setDoc(doc(db, "users", userCred.user.uid), {
        name,
        email,
        role: "employee",
        schedule: { start: "09:00", end: "18:00" },
        timezone: tz,
      });

      alert("Registered successfully. You can now log in.");
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#f0f8ff", // Light blue background
        minHeight: "100vh",
        padding: "40px",
        boxSizing: "border-box",
        fontFamily: "sans-serif",
      }}
    >
      <h1 style={{ color: "#003366", marginBottom: "40px" }}>
        Create an Account
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "30px",
          maxWidth: "100%",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label htmlFor="name" style={labelStyle}>
            Full Name
          </label>
          <input
            id="name"
            placeholder="Jane Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            style={inputStyle}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <label htmlFor="email" style={labelStyle}>
            Email
          </label>
          <input
            id="email"
            placeholder="you@example.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            style={inputStyle}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <label htmlFor="password" style={labelStyle}>
            Password
          </label>
          <input
            id="password"
            placeholder="Minimum 6 characters"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            style={inputStyle}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <label htmlFor="timezone" style={labelStyle}>
            Timezone
          </label>
          <input
            id="timezone"
            placeholder="e.g. Asia/Manila"
            value={tz}
            onChange={(e) => setTz(e.target.value)}
            style={inputStyle}
          />
          <small style={{ marginTop: "6px", color: "#555" }}>
            (Use IANA format — e.g. Asia/Manila)
          </small>
        </div>

        <div style={{ gridColumn: "1 / -1", textAlign: "left" }}>
          <button
            type="button"
            onClick={handleRegister}
            style={{
              padding: "12px 24px",
              fontSize: "16px",
              backgroundColor: "#007BFF",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              marginTop: "20px",
            }}
          >
            Register
          </button>
        </div>
      </div>
    </div>
  );
}

// Shared styles
const inputStyle = {
  padding: "10px",
  fontSize: "16px",
  border: "1px solid #ccc",
  borderRadius: "4px",
  marginTop: "6px",
};

const labelStyle = {
  fontWeight: "bold",
  color: "#003366",
};
