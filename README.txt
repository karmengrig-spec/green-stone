Guesthouse Calendar — Cloud Lite (v6)
=================================================
Fixes
- Date range is confirmed via modal (no instant red).
- Month header spans full width.
- Compact view to fit all rooms at once.
- Notes field auto-expands while typing.
- Admin-only edits; optional Supabase sync for shared data.

Supabase quick start
1) Create project on supabase.com
2) SQL:
   CREATE TABLE public.bookings (
     room text NOT NULL,
     date text NOT NULL,
     guest text,
     notes text,
     PRIMARY KEY (room, date)
   );
   ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;
3) Vercel envs:
   REACT_APP_SUPABASE_URL=YOUR_URL
   REACT_APP_SUPABASE_ANON_KEY=YOUR_ANON_KEY
   REACT_APP_ADMIN_EMAIL=you@example.com
4) Build: npm run build  | Output: build
