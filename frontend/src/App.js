// frontend/src/App.js
import React, { useState, useEffect } from "react";
import Register from "./components/Register";
import Login from "./components/Login";
import PunchButtons from "./components/PunchButtons";
import Dashboard from "./components/Dashboard";
import History from "./components/History";
import AdminPanel from "./components/AdminPanel";
import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";

export default function App() {
  const [user, setUser] = useState(null);
  const [idToken, setIdToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      if (u) {
        setUser(u);
        try {
          const token = await u.getIdToken();
          setIdToken(token);
          const snap = await getDoc(doc(db, "users", u.uid));
          if (snap.exists()) {
            setRole(snap.data().role || "employee");
          } else {
            setRole("employee");
          }
        } catch (error) {
          console.error("Error fetching ID token or role:", error);
          setIdToken(null);
          setRole(null);
        }
      } else {
        setUser(null);
        setIdToken(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  async function handleSignOut() {
    try {
      await auth.signOut();
    } catch (err) {
      console.error("Error signing out:", err);
    }
  }

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          height: "100vh",
          justifyContent: "center",
          alignItems: "center",
          fontSize: "1.5rem",
          fontWeight: "500",
          color: "#0077b6",
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <div
      style={{
        background: "linear-gradient(to bottom right, #f0faff, #e9f4ff)",
        minHeight: "100vh",
        padding: "20px 30px",
        boxSizing: "border-box",
      }}
    >
      {user ? (
        <div>
          {/* HEADER */}
          <header
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "20px",
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              marginBottom: "30px",
              boxShadow: "0px 4px 12px rgba(0,0,0,0.08)",
            }}
          >
            <div style={{ fontSize: "1rem", color: "#333" }}>
              Signed in as{" "}
              <strong style={{ color: "#0077b6" }}>{user.email}</strong>
            </div>
            <button
              onClick={handleSignOut}
              style={{
                backgroundColor: "#0077b6",
                color: "#fff",
                border: "none",
                padding: "10px 20px",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "500",
              }}
            >
              Sign Out
            </button>
          </header>

          {/* MAIN CONTENT */}
          <main
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: "25px",
              width: "100%",
            }}
          >
            {/* Punch Section */}
            <section
              style={{
                backgroundColor: "#ffffff",
                padding: "25px",
                borderRadius: "12px",
                boxShadow: "0px 4px 12px rgba(0,0,0,0.08)",
                width: "100%",
              }}
            >
              <PunchButtons idToken={idToken} user={user} />
            </section>

            {/* Dashboard Section */}
            <section
              style={{
                backgroundColor: "#ffffff",
                padding: "25px",
                borderRadius: "12px",
                boxShadow: "0px 4px 12px rgba(0,0,0,0.08)",
                width: "100%",
              }}
            >
              <h2
                style={{
                  margin: "0 0 20px",
                  color: "#003366",
                  fontSize: "1.4rem",
                  fontWeight: "600",
                  borderBottom: "2px solid #e6f0ff",
                  paddingBottom: "10px",
                }}
              >
                Dashboard
              </h2>
              <Dashboard idToken={idToken} user={user} />
            </section>

            {/* History Section */}
            <section
              style={{
                backgroundColor: "#ffffff",
                padding: "25px",
                borderRadius: "12px",
                boxShadow: "0px 4px 12px rgba(0,0,0,0.08)",
                width: "100%",
              }}
            >
              <h2 style={{ margin: "0 0 15px", color: "#003366" }}>History</h2>
              <History idToken={idToken} user={user} />
            </section>

            {/* Admin Panel Section */}
            {role === "admin" && (
              <section
                style={{
                  backgroundColor: "#ffffff",
                  padding: "25px",
                  borderRadius: "12px",
                  boxShadow: "0px 4px 12px rgba(0,0,0,0.08)",
                  width: "100%",
                }}
              >
                <h2 style={{ margin: "0 0 15px", color: "#003366" }}>
                  Admin Panel
                </h2>
                <AdminPanel idToken={idToken} user={user} />
              </section>
            )}
          </main>
        </div>
      ) : (
        // LOGIN / REGISTER
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100vh",
            width: "100%",
            background: "linear-gradient(to right, #e0f2ff, #ffffff)",
            padding: "40px",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "24px",
              width: "100%",
              maxWidth: "800px",
              padding: "32px",
              borderRadius: "16px",
              backgroundColor: "#ffffff",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
            }}
          >
            <div
              style={{
                fontSize: "28px",
                fontWeight: "600",
                color: "#0077b6",
                textAlign: "center",
              }}
            >
              
            </div>

            <div style={{ width: "100%" }}>
              {showRegister ? <Register /> : <Login />}
            </div>

            <div style={{ textAlign: "center", marginTop: "12px" }}>
              {showRegister ? (
                <button
                  onClick={() => setShowRegister(false)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#0077b6",
                    cursor: "pointer",
                    fontWeight: "500",
                    fontSize: "16px",
                  }}
                >
                  Already have an account? Login here
                </button>
              ) : (
                <button
                  onClick={() => setShowRegister(true)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#0077b6",
                    cursor: "pointer",
                    fontWeight: "500",
                    fontSize: "16px",
                  }}
                >
                  Don’t have an account? Register here
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
