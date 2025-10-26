import React, { useEffect, useMemo, useState } from "react";
import { addMonths, format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { cloudEnabled, cloudFetchAll, onCloudChanges, cloudUpsertMany, cloudDelete } from "./cloud.js";

const ROOMS = [
  "Double Room",
  "Double or Twin Room",
  "Standard Double Room",
  "Deluxe Double Room",
  "Family Room with Balcony",
  "Cottage in the Garden",
  "Sauna",
];

const STORAGE_KEY = "guesthouse_bookings_local_v1";
const ADMIN_EMAIL = process.env.REACT_APP_ADMIN_EMAIL || "";

const loadLocal = () => { try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; } };
const saveLocal = (b) => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(b)); } catch {} };
const keyOf = (d) => format(d, "yyyy-MM-dd");

export default function Availability({ cloudOn }){
  const [month, setMonth] = useState(startOfMonth(new Date()));
  const [bookings, setBookings] = useState(loadLocal());
  const [selecting, setSelecting] = useState(null);
  const [rangeHover, setRangeHover] = useState(null);
  const [modal, setModal] = useState(null);
  const [compact, setCompact] = useState(true);
  const [email, setEmail] = useState(localStorage.getItem("gh_email") || "");
  const isAdmin = email && ADMIN_EMAIL && email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  useEffect(()=>{
    let unsubscribe = () => {};
    (async () => {
      if (cloudOn){
        try{
          const data = await cloudFetchAll();
          if (Array.isArray(data)) setBookings(data);
          unsubscribe = onCloudChanges(async () => {
            const fresh = await cloudFetchAll();
            if (Array.isArray(fresh)) setBookings(fresh);
          });
        }catch(e){ console.error("cloud init failed", e); }
      }
    })();
    return () => unsubscribe();
  }, [cloudOn]);

  useEffect(() => { saveLocal(bookings); }, [bookings]);

  const days = useMemo(() => eachDayOfInterval({ start:startOfMonth(month), end:endOfMonth(month) }), [month]);
  const find = (room, dateStr) => bookings.find(b => b.room === room && b.date === dateStr);

  const startSelect = (room, date) => {
    if (!isAdmin) return;
    const dateStr = keyOf(date);
    const existing = find(room, dateStr);
    if (existing){
      setModal({ room, date: existing.date, guest: existing.guest || "", notes: existing.notes || "" });
      return;
    }
    setSelecting({ room, start: date });
  };
  const finalizeSelect = async (room, date) => {
    if (!isAdmin || !selecting) return;
    if (selecting.room !== room){ setSelecting({ room, start: date }); return; }
    const [a,b] = [selecting.start, date].sort((x,y)=> x-y);
    const newRows = eachDayOfInterval({ start:a, end:b })
      .map(d => ({ room, date: keyOf(d), guest:"", notes:"" }));
    const addRows = newRows.filter(t => !find(room, t.date));
    if (addRows.length){
      setBookings(prev => [...prev, ...addRows]);
      if (cloudOn){ try{ await cloudUpsertMany(addRows); } catch(e){ console.error(e); } }
    }
    setSelecting(null); setRangeHover(null);
  };
  const inSelectingRange = (room, date) => {
    if (!selecting || selecting.room !== room) return false;
    const [a,b] = [selecting.start, (rangeHover||selecting.start)].sort((x,y)=> x-y);
    return date >= a && date <= b;
  };

  const saveModal = async () => {
    if (!modal) return;
    if (!isAdmin){ setModal(null); return; }
    setBookings(prev =>
      prev.map(b =>
        (b.room === modal.room && b.date === modal.date)
          ? { ...b, guest: modal.guest || "", notes: modal.notes || "" }
          : b
      )
    );
    if (cloudOn){ try{ await cloudUpsertMany([{...modal}]); } catch(e){ console.error(e); } }
    setModal(null);
  };
  const cancelBooking = async () => {
    if (!modal || !isAdmin) return;
    setBookings(prev => prev.filter(b => !(b.room === modal.room && b.date === modal.date)));
    if (cloudOn){ try{ await cloudDelete(modal.room, modal.date); } catch(e){ console.error(e); } }
    setModal(null);
  };

  const exportCSV = () => {
    const header = "Room,Date,Guest,Notes\n";
    const body = bookings.map(b => `${b.room},${b.date},"${(b.guest||"").replace(/"/g,'"')}","${(b.notes||"").replace(/"/g,'"')}"`).join("\n");
    const blob = new Blob([header + body], { type:"text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob); const a=document.createElement("a");
    a.href=url; a.download=`bookings_${new Date().toISOString().slice(0,16).replace(/[:T]/g,'-')}.csv`; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 1000);
  };

  const login = () => { localStorage.setItem("gh_email", email.trim()); window.location.reload(); };
  const logout = () => { localStorage.removeItem("gh_email"); window.location.reload(); };

  return (
    <div className="container" style={{"--scale": compact ? 0.9 : 1}}>
      <div className="header">
        <div className="row">
          <button className="btn" onClick={()=> setMonth(addMonths(month,-1))} aria-label="Previous month">‹</button>
          <div style={{fontWeight:800, fontSize:20}}>{format(month, "LLLL yyyy")}</div>
          <button className="btn" onClick={()=> setMonth(addMonths(month,1))} aria-label="Next month">›</button>
        </div>
        <div className="toolbar">
          <div className="legend">
            <span><span className="dot green"></span>Available</span>
            <span><span className="dot red"></span>Booked</span>
          </div>
          <div className="switch">
            <input id="compact" type="checkbox" checked={compact} onChange={e=> setCompact(e.target.checked)} />
            <label htmlFor="compact">Compact view (fit all rooms)</label>
          </div>
          <button className="btn" onClick={exportCSV}>Export CSV</button>
          <div className="switch">
            <input className="input" style={{padding:"6px 8px"}} placeholder="your email" value={email} onChange={e=> setEmail(e.target.value)} />
            {!email ? <button className="btn" onClick={login}>Set email</button>
            : <button className="btn" onClick={logout}>Clear</button>}
          </div>
        </div>
        <div className="small" style={{marginTop:4}}>
          Mode: {cloudOn ? "Cloud Lite (shared)" : "Local only"} • Role: {isAdmin ? "Admin (can edit)" : (email ? "Viewer (read-only)" : "Guest (read-only)")}
        </div>
      </div>

      <div className="grid">
        {ROOMS.map(room => (
          <div className="room" key={room}>
            <div className="month">
              {["M","T","W","T","F","S","S"].map((d,i)=>(<div key={i} className="headcell">{d}</div>))}
              {eachDayOfInterval({start:startOfMonth(month), end:endOfMonth(month)}).map((d, idx) => {
                const dateStr = keyOf(d);
                const b = find(room, dateStr);
                const className = "day" + (b ? " booked" : "") + (inSelectingRange(room, d) ? " range" : "");
                return (
                  <div key={idx}
                    className={className}
                    onMouseEnter={()=> selecting && setRangeHover(d)}
                    onMouseLeave={()=> selecting && setRangeHover(null)}
                    onMouseDown={()=> startSelect(room, d)}
                    onMouseUp={()=> finalizeSelect(room, d)}
                    onTouchStart={()=> startSelect(room, d)}
                    onTouchEnd={()=> finalizeSelect(room, d)}
                    >
                    <span className="label">{format(d,"d")}</span>
                    {b?.guest ? <span className="guest">{b.guest}</span> : null}
                  </div>
                );
              })}
            </div>
            <h3>{room}</h3>
          </div>
        ))}
      </div>

      {modal && (
        <div className="modal-bg" onClick={()=> setModal(null)}>
          <div className="modal" onClick={e=> e.stopPropagation()}>
            <h3>Edit booking — {modal.room}</h3>
            <div className="small" style={{marginBottom:8}}>{modal.date}</div>
            <input className="input" placeholder="Guest name"
              value={modal.guest} onChange={e=> setModal(m=>({...m, guest:e.target.value}))} />
            <textarea className="input" placeholder="Notes (phone, details…)" rows={4}
              value={modal.notes} onChange={e=> setModal(m=>({...m, notes:e.target.value}))}></textarea>
            <div className="actions">
              <button className="btn warn" type="button" onClick={cancelBooking} disabled={!isAdmin}>Cancel booking</button>
              <button className="btn" type="button" onClick={saveModal} disabled={!isAdmin}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
