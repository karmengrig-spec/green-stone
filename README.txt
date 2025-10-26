Guesthouse Calendar — Cloud Lite (v6.1)
=======================================
What's new
- Tap start day, then tap end day -> range modal opens. No instant booking.
- Supabase Auth optional: Admin can sign in to write. Everyone else read-only.
- RLS policies below.

Supabase table
--------------
CREATE TABLE IF NOT EXISTS public.bookings (
  room  text NOT NULL,
  date  text NOT NULL,
  guest text,
  notes text,
  PRIMARY KEY (room, date)
);

Secure policies (RLS)
---------------------
-- replace with your admin email
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read"
ON public.bookings
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Only admin can insert"
ON public.bookings
FOR INSERT
TO authenticated
WITH CHECK ( auth.email() = 'YOUR_ADMIN_EMAIL_HERE' );

CREATE POLICY "Only admin can update"
ON public.bookings
FOR UPDATE
TO authenticated
USING ( auth.email() = 'YOUR_ADMIN_EMAIL_HERE' )
WITH CHECK ( auth.email() = 'YOUR_ADMIN_EMAIL_HERE' );

CREATE POLICY "Only admin can delete"
ON public.bookings
FOR DELETE
TO authenticated
USING ( auth.email() = 'YOUR_ADMIN_EMAIL_HERE' );

Auth
----
Enable Email/Password auth in Supabase. Create a user with the admin email.

Vercel env vars
---------------
REACT_APP_SUPABASE_URL=...
REACT_APP_SUPABASE_ANON_KEY=...
REACT_APP_ADMIN_EMAIL=...  (must match the admin user email)

Build
-----
npm run build  (Output folder: build)
