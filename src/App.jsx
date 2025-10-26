import React, { useEffect, useState } from "react";
import Availability from "./Availability.jsx";
import { initCloud, cloudEnabled } from "./cloud.js";

export default function App(){
  const [ready, setReady] = useState(false);
  useEffect(()=>{ (async()=>{ await initCloud(); setReady(true); })(); },[]);
  if (!ready) return null;
  return <Availability cloudOn={cloudEnabled()} />;
}
