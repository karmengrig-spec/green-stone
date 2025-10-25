import React, { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const cfg = {
  apiKey: "AIzaSyDyu0mh4Wk0gHHA0VbkEgsI8dgzj4JUmaM",
  authDomain: "guesthouse-calendar-f8fb6.firebaseapp.com",
  projectId: "guesthouse-calendar-f8fb6",
  storageBucket: "guesthouse-calendar-f8fb6.firebasestorage.app",
  messagingSenderId: "316596087831",
  appId: "1:316596087831:web:1d1f9f523909cdee98ecad2",
  measurementId: "G-TD2SVX3HNB",
};

export default function App(){
  const [state, setState] = useState({ ok:false, msg:"Connecting..." });

  useEffect(()=>{
    try{
      const app = initializeApp(cfg);
      getAuth(app);
      getFirestore(app);
      setState({ ok:true, msg:"Firebase connected. This scaffold is working. Now we can plug in your calendar UI." });
    }catch(e){
      setState({ ok:false, msg: "Firebase init error: " + (e?.message || e) });
    }
  },[]);

  return (
    <div className="container">
      <div className="card">
        <h1>Guesthouse Bookings</h1>
        <p className="small">Scaffold page to verify deploy & Firebase configuration.</p>
        <p className={state.ok ? "ok" : "err"}>{state.msg}</p>
        <p className="small">If you see the green message above, Vercel is deploying correctly. Next step: replace this scaffold with your full calendar UI files.</p>
      </div>
    </div>
  );
}
