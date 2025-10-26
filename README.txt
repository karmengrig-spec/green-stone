Guesthouse Calendar — Cloud Lite (v5)
=================================================
Features
- Range selection: press start day and release on end day.
- Compact view toggle to fit all 7 rooms on one screen.
- Cloud Lite (Supabase): everyone sees updates in real time.
- Admin email controls who can edit (others are read-only).
- CSV export.

Enable Cloud (Supabase)
1) Create project on supabase.com
2) Create table via SQL:
   CREATE TABLE public.bookings (
     room text NOT NULL,
     date text NOT NULL,
     guest text,
     notes text,
     PRIMARY KEY (room, date)
   );
   -- (optional quick start)
   ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;
3) In Vercel (or .env.local) set:
   REACT_APP_SUPABASE_URL=YOUR_URL
   REACT_APP_SUPABASE_ANON_KEY=YOUR_ANON_KEY
   REACT_APP_ADMIN_EMAIL=you@example.com
4) Build: npm run build, Output: build

Local-only mode
- If those env vars are missing, the app falls back to localStorage.

Usage
- Enter your email in the toolbar; if it matches ADMIN_EMAIL you can Save/Cancel.
- Tap an available day to start a selection, release on the end day to create the booking days.
- Tap a red day to edit guest/notes or cancel.
