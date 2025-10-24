import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, isSameMonth, format, startOfDay, isBefore, isAfter, parseISO
} from "date-fns";
import { db } from "./firebase";
import { collection, addDoc, onSnapshot, updateDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { isDriveConnected, ensureDriveAuth, backupJSON, loadBackupJSON } from "./drive";

const roomsSeed = [
  { id: "r1", name: "Double Room" },
  { id: "r2", name: "Double or Twin Room" },
  { id: "r3", name: "Standard Double Room" },
  { id: "r4", name: "Deluxe Double Room" },
  { id: "r5", name: "Family Room with Balcony" },
  { id: "r6", name: "Cottage in the Garden" },
  { id: "r7", name: "Sauna" },
];

const bookedCell = "relative bg-red-200 text-red-900 after:content-[''] after:absolute after:inset-0 after:bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,rgba(0,0,0,0.08)_6px,rgba(0,0,0,0.08)_12px)]";
const freeCell   = "bg-emerald-100 text-emerald-900";

function isBookedOn(day, roomId, bookings){
  return bookings.some(b => b.roomId===roomId && isBefore(new Date(b.start), addDays(day,1)) && isAfter(new Date(b.end), day));
}
function formatISODate(d){
  const y = d.getFullYear(); const m = String(d.getMonth()+1).padStart(2,'0'); const day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}

function RoomMonth({ room, month, bookings, onTapFree, onTapBooked, isAdmin }){
  const monthStart = startOfMonth(month);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(monthStart), { weekStartsOn: 1 });
  const days = React.useMemo(()=>{ const arr=[]; let d=gridStart; while(d<=gridEnd){ arr.push(d); d=addDays(d,1); } return arr; }, [month]);

  return (
    <div className="mb-6">
      <div className="grid grid-cols-7 text-[11px] text-slate-500 px-1 pb-1">{['M','T','W','T','F','S','S'].map((d)=>(<div key={d} className="text-center">{d}</div>))}</div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d, idx) => {
          const inMonth = isSameMonth(d, monthStart);
          const booked = inMonth && isBookedOn(d, room.id, bookings);
          const free = inMonth && !booked;
          const prev = addDays(d,-1), next = addDays(d,1);
          const prevIn = isSameMonth(prev, monthStart), nextIn = isSameMonth(next, monthStart);
          const prevBooked = prevIn && isBookedOn(prev, room.id, bookings);
          const nextBooked = nextIn && isBookedOn(next, room.id, bookings);
          const prevFree = prevIn && !prevBooked;
          const nextFree = nextIn && !nextBooked;

          const base = "h-7 flex items-center justify-center text-xs relative rounded-full";
          let cls = "";
          if (!inMonth) cls = "text-slate-300";
          else if (booked){ const left = !prevBooked, right = !nextBooked; cls = `${bookedCell} ${left?'rounded-l-full pl-2':''} ${right?'rounded-r-full pr-2':''}`; }
          else if (free){ const left = !prevFree, right = !nextFree; cls = `${freeCell} ${left?'rounded-l-full pl-2':''} ${right?'rounded-r-full pr-2':''}`; }

          return (
            <button
              key={idx}
              type="button"
              className={`${base} ${cls}`}
              onClick={() => {
                if (free) {
                  if (isAdmin) onTapFree(room.id, d);
                } else {
                  onTapBooked(room.id, d);
                }
              }}
            >
              {format(d,'d')}
            </button>
          );
        })}
      </div>
      <div className="mt-2 px-1 text-sm font-semibold">{room.name}</div>
    </div>
  );
}

export default function Availability({ isAdmin }){
  const [rooms] = useState(roomsSeed);
  const [bookings, setBookings] = useState([]);
  const [month, setMonth] = useState(startOfMonth(new Date()));
  const [driveConnected, setDriveConnected] = useState(false);

  const CACHE_KEY = "ghc_cloud_cache_v1";

  useEffect(() => { setDriveConnected(isDriveConnected()); }, []);
  useEffect(()=>{
    const coll = collection(db, "bookings");
    const unsub = onSnapshot(coll, (snap)=>{
      const cloud = []; snap.forEach(docSnap => cloud.push({ id: docSnap.id, ...docSnap.data() }));
      setBookings(cloud);
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(cloud)); } catch {}
    });
    return () => unsub();
  }, []);

  async function handleConnectDrive() { try { await ensureDriveAuth(); setDriveConnected(true); alert("✅ Google Drive connected"); } catch (e) { alert("❌ Drive connection failed: " + (e?.message || e)); } }
  async function handleBackupNow() { try { await backupJSON(bookings); alert("✅ Backup saved to Drive"); } catch (e) { alert("❌ Backup failed: " + (e?.message || e)); } }
  async function handleRestore() { try { const data = await loadBackupJSON(); if (data && Array.isArray(data)) { setBookings(data); try{ localStorage.setItem(CACHE_KEY, JSON.stringify(data)); }catch{} alert("✅ Restore complete"); } else { alert("ℹ️ No valid backup found"); } } catch (e) { alert("❌ Restore failed: " + (e?.message || e)); } }

  function exportVisibleMonthCSV() {
    const roomNameById = Object.fromEntries(rooms.map(r => [r.id, r.name]));
    const monthStart = startOfMonth(month), monthEnd = endOfMonth(month);
    const rows = bookings.filter(b => new Date(b.start) < monthEnd && new Date(b.end) > monthStart).map(b => {
      const s = new Date(b.start), e = new Date(b.end);
      const nights = Math.max(0, Math.round((e - s) / 86400000));
      return { roomId:b.roomId, roomName:roomNameById[b.roomId]||"", guest:b.guest||"", note:b.note||"", start:format(s,"yyyy-MM-dd"), end:format(e,"yyyy-MM-dd"), nights };
    });
    const headers = ["roomId","roomName","guest","note","start","end","nights"];
    const esc = (v) => '"' + String(v ?? "").replace(/"/g, '""') + '"';
    const csv = "\uFEFF" + [headers.join(","), ...rows.map((r)=> headers.map((h)=> esc(r[h])).join(","))].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url;
    a.download = `bookings_${format(month,"yyyy_MM")}.csv`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  }

  return (
    <div className="w-full max-w-md mx-auto p-3 pb-28">
      <div className="flex items-center justify-between mb-1 header-sticky bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/70">
        <button type="button" className="px-3 py-2 rounded-xl" onClick={()=> setMonth(m=> subMonths(m,1))}>‹</button>
        <div className="text-xl font-bold">{format(month, "LLLL yyyy")}</div>
        <button type="button" className="px-3 py-2 rounded-xl" onClick={()=> setMonth(m=> addMonths(m,1))}>›</button>
      </div>

      <div className="flex flex-wrap gap-2 justify-center mb-2">
        <button className="mt-1 px-3 py-1 text-xs rounded-lg border bg-white shadow-sm" onClick={exportVisibleMonthCSV}>Export Month</button>
        <button className="mt-1 px-3 py-1 text-xs rounded-lg border bg-white shadow-sm" onClick={handleConnectDrive}>{driveConnected ? "Drive: Connected" : "Connect Drive"}</button>
        <button className="mt-1 px-3 py-1 text-xs rounded-lg border bg-white shadow-sm" onClick={handleBackupNow}>Backup to Drive</button>
        <button className="mt-1 px-3 py-1 text-xs rounded-lg border bg-white shadow-sm" onClick={handleRestore}>Load from Drive</button>
      </div>

      <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
        <div className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-emerald-500"></span> Available</div>
        <div className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-red-500"></span> Booked</div>
      </div>

      <div className="bg-white rounded-2xl shadow border p-3">
        <div className="grid grid-cols-2 gap-x-6">
          {rooms.map(room => (
            <RoomMonth key={room.id} room={room} month={month} bookings={bookings} onTapFree={()=>{}} onTapBooked={()=>{}} isAdmin={isAdmin} />
          ))}
        </div>
      </div>
    </div>
  );
}
