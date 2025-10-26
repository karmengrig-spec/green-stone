Guesthouse Calendar — Local Storage Version (v3.3, no-cloud, no-firebase)
=======================================================================
- 7 rooms (Sauna included)
- Tap-to-select ranges per room
- Tap red day to edit (guest + notes), Save, or Cancel booking
- Persists to localStorage; CSV export included

Deploy (Vercel):
- Build Command: npm run build
- Output Directory: build
- No environment variables required
- Prebuild guard fails the deploy if any 'firebase' import is present in src/

Run locally:
- npm install
- npm start

Data storage:
- LocalStorage key: guesthouse_bookings_local_v1
