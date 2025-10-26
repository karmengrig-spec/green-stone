Guesthouse Calendar — Local Storage Version (v3.2, fixed)
=========================================================

- 7 rooms (Sauna is the 7th)
- Tap-to-select ranges per room
- Tap red day to edit (guest + notes), Save, or Cancel booking
- Persists to localStorage; CSV export included

Deploy (Vercel)
---------------
- Build Command: npm run build
- Output Directory: build
- No environment variables required

Run locally
-----------
npm install
npm start

Data storage
------------
LocalStorage key: guesthouse_bookings_local_v1
