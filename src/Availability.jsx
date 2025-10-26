import React, { useEffect, useMemo, useRef, useState } from "react";
import { addMonths, format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { cloudFetchAll, onCloudChanges, cloudUpsertMany, cloudDelete } from "./cloud.js";

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
  const [selecting, setSelecting] = useState(null); // {room, start: Date}
  const [hover, setHover] = useState(null); // Date for preview
  const [editModal, setEditModal] = useState(null);   // single-day edit
  const [rangeModal, setRangeModal] = useState(null); // {room, startDateStr, endDateStr, guest, notes}
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
      setEditModal({ room, date: existing.date, guest: existing.guest || "", notes: existing.notes || "" });
      return;
    }
    setSelecting({ room, start: date });
    setHover(date);
  };
  const updateHover = (date) => { if (selecting) setHover(date); };
  const endSelect = (room, date) => {
    if (!isAdmin || !selecting) return;
    if (selecting.room !== room){ setSelecting(null); setHover(null); return; }
    const [a,b] = [selecting.start, date].sort((x,y)=> x-y);
    const startStr = keyOf(a), endStr = keyOf(b);
    setRangeModal({ room, startDateStr:startStr, endDateStr:endStr, guest:"", notes:"" });
    setSelecting(null); setHover(null);
  };
  const inPreview = (room, date) => {
    if (!selecting || selecting.room !== room) return false;
    const [a,b] = [selecting.start, hover || selecting.start].sort((x,y)=> x-y);
    return date >= a && date <= b;
  };

  const saveSingle = async () => {
    if (!editModal || !isAdmin) return;
    setBookings(prev =>
      prev.map(b =>
        (b.room === editModal.room && b.date === editModal.date)
          ? { ...b, guest: editModal.guest || "", notes: editModal.notes || "" }
          : b
      )
    );
    if (cloudOn){ try{ await cloudUpsertMany([{...editModal}]); } catch(e){ console.error(e); } }
    setEditModal(null);
  };
  const cancelSingle = async () => {
    if (!editModal || !isAdmin) return;
    setBookings(prev => prev.filter(b => !(b.room === editModal.room && b.date === editModal.date)));
    if (cloudOn){ try{ await cloudDelete(editModal.room, editModal.date); } catch(e){ console.error(e); } }
    setEditModal(null);
  };

  const saveRange = async () => {
    if (!rangeModal || !isAdmin) return;
    const { room, startDateStr, endDateStr, guest, notes } = rangeModal;
    const [a,b] = [new Date(startDateStr), new Date(endDateStr)].sort((x,y)=> x-y);
    const range = eachDayOfInterval({ start:a, end:b }).map(d => ({
      room, date: keyOf(d), guest: guest || "", notes: notes || ""
    }));
    const addRows = range.filter(t => !find(room, t.date));
    if (addRows.length){
      setBookings(prev => [...prev, ...addRows]);
      if (cloudOn){ try{ await cloudUpsertMany(addRows); } catch(e){ console.error(e); } }
    }
    setRangeModal(null);
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
      <div className="header-bleed">
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
        <div className="small" style={{marginTop:4, maxWidth:980, marginLeft:'auto', marginRight:'auto'}}>
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
                const booked = !!find(room, dateStr);
                const className = "day" + (booked ? " booked" : "") + (inPreview(room, d) ? " range-preview" : "");
                return (
                  <div key={idx}
                    className={className}
                    onMouseDown={()=> startSelect(room, d)}
                    onMouseEnter={()=> updateHover(d)}
                    onMouseUp={()=> endSelect(room, d)}
                    onTouchStart={()=> startSelect(room, d)}
                    onTouchMove={()=> updateHover(d)}
                    onTouchEnd={()=> endSelect(room, d)}
                  >
                    <span className="label">{format(d,"d")}</span>
                    {booked && find(room, dateStr)?.guest ? <span className="guest">{find(room, dateStr)?.guest}</span> : null}
                  </div>
                );
              })}
            </div>
            <h3>{room}</h3>
          </div>
        ))}
      </div>

      {editModal && (
        <div className="modal-bg" onClick={()=> setEditModal(null)}>
          <div className="modal" onClick={e=> e.stopPropagation()}>
            <h3>Edit booking — {editModal.room}</h3>
            <div className="small" style={{marginBottom:8}}>{editModal.date}</div>
            <input className="input" placeholder="Guest name"
              value={editModal.guest} onChange={e=> setEditModal(m=>({...m, guest:e.target.value}))} />
            <AutoGrow value={editModal.notes} onChange={v=> setEditModal(m=>({...m, notes:v}))} placeholder="Notes (phone, details…)" />
            <div className="actions">
              <button className="btn warn" type="button" onClick={cancelSingle} disabled={!isAdmin}>Cancel booking</button>
              <button className="btn" type="button" onClick={saveSingle} disabled={!isAdmin}>Save</button>
            </div>
          </div>
        </div>
      )}

      {rangeModal && (
        <div className="modal-bg" onClick={()=> setRangeModal(null)}>
          <div className="modal" onClick={e=> e.stopPropagation()}>
            <h3>New booking — {rangeModal.room}</h3>
            <div className="small" style={{marginBottom:8}}>{rangeModal.startDateStr} → {rangeModal.endDateStr}</div>
            <input className="input" placeholder="Guest name"
              value={rangeModal.guest} onChange={e=> setRangeModal(m=>({...m, guest:e.target.value}))} />
            <AutoGrow value={rangeModal.notes} onChange={v=> setRangeModal(m=>({...m, notes:v}))} placeholder="Notes (phone, details…)" />
            <div className="actions">
              <button className="btn" type="button" onClick={()=> setRangeModal(null)}>Close</button>
              <button className="btn" type="button" onClick={saveRange} disabled={!isAdmin}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AutoGrow({ value, onChange, placeholder }){
  const ref = React.useRef(null);
  React.useEffect(()=>{
    if (ref.current){ ref.current.style.height='auto'; ref.current.style.height = (ref.current.scrollHeight+2)+'px'; }
  }, [value]);
  return (
    <textarea ref={ref} className="input" rows={3} placeholder={placeholder}
      value={value} onChange={e=> onChange(e.target.value)} />
  );
}
