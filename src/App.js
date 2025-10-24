// src/App.js
import React, { useEffect, useState } from "react";
import Availability from "./Availability";
import { auth } from "./firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

// ✅ use the functions that actually exist in src/drive.js
import { isDriveConnected, ensureDriveAuth } from "./drive";

export default function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [driveReady, setDriveReady] = useState(false);
  const [driveSigned, setDriveSigned] = useState(false);

  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        setUser(u || null);
        setError("");
      }),
    []
  );

  const isAdmin =
    (user?.email || "").toLowerCase() ===
    (process.env.REACT_APP_ADMIN_EMAIL || "").toLowerCase();

  // GAPI is initialized in public/index.html, so we only need to check status
  useEffect(() => {
    try {
      setDriveReady(true);
      setDriveSigned(isDriveConnected());
    } catch {
      setDriveReady(false);
      setDriveSigned(false);
    }
  }, []);

  async function connectDrive() {
    try {
      await ensureDriveAuth();
      setDriveSigned(true);
      alert("✅ Google Drive connected");
    } catch (e) {
      alert("❌ Drive connection failed: " + (e?.message || e));
    }
  }

  if (!user) {
    return (
      <div className="w-full max-w-sm mx-auto safe-top safe-bottom p-4">
        <div className="bg-white border rounded-2xl shadow p-4">
          <div className="text-lg font-semibold mb-2">Green Stone — Sign In</div>
          {error && (
            <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-2 py-1 mb-2">
              {error}
            </div>
          )}
          <label className="block mb-2 text-sm">
            <span className="text-xs text-slate-500">Email</span>
            <input
              className="mt-1 w-full border rounded-lg px-2 py-2"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </label>
          <label className="block mb-3 text-sm">
            <span className="text-xs text-slate-500">Password</span>
            <input
              className="mt-1 w-full border rounded-lg px-2 py-2"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>
          <button
            className="w-full px-3 py-2 rounded-xl border bg-emerald-600 text-white"
            onClick={async () => {
              try {
                setError("");
                await signInWithEmailAndPassword(auth, email, password);
              } catch (e) {
                setError(e?.message || "Sign-in failed");
              }
            }}
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-3 safe-top safe-bottom">
      <div className="flex items-center justify-between mb-2 header-sticky">
        <div className="text-sm">
          Signed in as <span className="font-medium">{user.email}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 text-[11px] rounded-full border">
            {isAdmin ? "Admin" : "Read only"}
          </span>

          {/* Drive connect UI */}
          {driveReady && (
            driveSigned ? (
              <span className="px-2 py-1 text-xs rounded-lg border">
                Drive: Connected
              </span>
            ) : (
              <button
                className="px-2 py-1 text-xs rounded-lg border"
                onClick={connectDrive}
              >
                Connect Drive
              </button>
            )
          )}

          <button
            className="px-2 py-1 text-xs rounded-lg border"
            onClick={() => signOut(auth)}
          >
            Sign out
          </button>
        </div>
      </div>

      <Availability isAdmin={isAdmin} />
    </div>
  );
}
