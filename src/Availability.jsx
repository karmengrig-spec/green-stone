import React, { useEffect, useMemo, useState } from "react";
import { addMonths, format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";

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
const load = () => { try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; } };
const save = (b) => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(b)); } catch {} };
const keyOf = (d) => format(d, "yyyy-MM-dd");

export default function Availability(){
  const [month, setMonth] = useState(startOfMonth(new Date()));
  const [bookings, setBookings] = useState(load());
  const [selecting, setSelecting] = useState(null); // {room, start: Date}
  const [modal, setModal] = useState(null);         // {room, date, guest, notes}

  useEffect(() => { save(bookings); }, [bookings]);

  const days = useMemo(() => eachDayOfInterval({ start:startOfMonth(month), end:endOfMonth(month) }), [month]);

  const find = (room, date) => bookings.find(b => b.room === room && b.date === keyOf(date));

  const toggle = (room, date) => {
    const existing = find(room, date);
    if (existing){
      setModal({ room, date: existing.date, guest: existing.guest || "", notes: existing.notes || "" });
      return;
    }
    if (!selecting) { setSelecting({ room, start: date }); return; }
    if (selecting.room === room){
      const [a,b] = [selecting.start, date].sort((x,y)=> x-y);
      const range = eachDayOfInterval({ start:a, end:b }).map(d => ({ room, date:keyOf(d), guest:"" }));
      setBookings(prev => [
        ...prev,
        ...range.filter(t => !prev.some(p => p.room===room && p.date===t.date))
      ]);
      setSelecting(null);
    } else {
      setSelecting({ room, start: date });
    }
  };

  const saveModal = () => {
    if (!modal) return;
    setBookings(prev =>
      prev.map(b =>
        (b.room === modal.room && b.date === modal.date)
          ? { ...b, guest: modal.guest || "", notes: modal.notes || "" }
          : b
      )
    );
    setModal(null);
  };

  const cancelBooking = () => {
    if (!modal) return;
    setBookings(prev => prev.filter(b => !(b.room === modal.room && b.date === modal.date)));
    setModal(null);
  };

  const exportCSV = () => {
    const header = "Room,Date,Guest,Notes\n";
    const body = bookings
      .map(b => `${b.room},${b.date},"${(b.guest||"").replace(/"/g,'"')}","${(b.notes||"").replace(/"/g,'"')}"`)
      .join("\n");
    const blob = new Blob([header + body], { type:"text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `bookings_${new Date().toISOString().slice(0,16).replace(/[:T]/g,'-')}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="container">
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
          <button className="btn" onClick={exportCSV}>Export CSV</button>
        </div>
      </div>

      <div className="grid">
        {ROOMS.map(room => (
          <div className="room" key={room}>
            <div className="month">
              {["M","T","W","T","F","S","S"].map((d,i)=>(<div key={i} className="small" style={{textAlign:'center'}}>{d}</div>))}
              {days.map((d, idx) => {
                const b = find(room, d);
                return (
                  <div key={idx} className={"day" + (b ? " booked" : "")} onClick={()=> toggle(room, d)}>
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
              <button className="btn warn" type="button" onClick={cancelBooking}>Cancel booking</button>
              <button className="btn" type="button" onClick={saveModal}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
