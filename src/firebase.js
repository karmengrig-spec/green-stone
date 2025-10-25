import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// --- INLINE CONFIG for troubleshooting (bypasses env var issues) ---
const firebaseConfig = {
  apiKey: "AIzaSyDyu0mh4Wk0gHHA0VbkEgsI8dgzj4JUmaM",
  authDomain: "guesthouse-calendar-f8fb6.firebaseapp.com",
  projectId: "guesthouse-calendar-f8fb6",
  storageBucket: "guesthouse-calendar-f8fb6.firebasestorage.app",
  messagingSenderId: "316596087831",
  appId: "1:316596087831:web:1d1f9f523909cdee98ecad2",
  measurementId: "G-TD2SVX3HNB",
};

let app;
try {
  app = initializeApp(firebaseConfig);
} catch (e) {
  // render a visible banner if init fails
  const msg = document.createElement('div');
  msg.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#fee;color:#b00;padding:12px;z-index:9999;font:14px/1.4 system-ui';
  msg.textContent = 'Firebase init failed: ' + (e?.message || e);
  document.body.appendChild(msg);
  throw e;
}

export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
