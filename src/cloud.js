let supa = null;
let enabled = false;

export function cloudEnabled(){ return enabled; }
export function client(){ return supa; }

export async function initCloud(){
  const url = process.env.REACT_APP_SUPABASE_URL;
  const key = process.env.REACT_APP_SUPABASE_ANON_KEY;
  if (!url || !key) { enabled = false; return false; }
  const { createClient } = await import("@supabase/supabase-js");
  supa = createClient(url, key);
  enabled = true;
  return true;
}

export async function cloudFetchAll(){
  if (!enabled) return null;
  const { data, error } = await supa.from("bookings").select("*");
  if (error) throw error;
  return data || [];
}

export function onCloudChanges(cb){
  if (!enabled) return () => {};
  const sub = supa.channel("bookings-all")
    .on("postgres_changes", {event:"*", schema:"public", table:"bookings"}, () => cb())
    .subscribe();
  return () => supa.removeChannel(sub);
}

export async function cloudUpsertMany(rows){
  if (!enabled) return;
  const { error } = await supa.from("bookings").upsert(rows, { onConflict:"room,date" });
  if (error) throw error;
}
export async function cloudDelete(room, date){
  if (!enabled) return;
  const { error } = await supa.from("bookings").delete().match({ room, date });
  if (error) throw error;
}
