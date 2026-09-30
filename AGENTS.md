# Base44 Dev Environment

## Project Overview
Yousi (玉里叫車) — a Vite + React taxi-hailing app for Yuli, Taiwan. Uses Leaflet
maps and integrates LINE Pay / JKOPay for payments.

## Architecture
- **Frontend**: Vite 4 + React 18 dev server on port 5173 (mapped to host 3000)
- **API**: Vercel-style serverless functions in `api/` — served in dev by a custom
  Vite plugin (`vite-plugin-vercel-api.js`) that loads handler files and executes
  them as connect middleware. No separate backend process needed.
- **No database**: Rides and user state are stored in localStorage on the client.

## Setup
```
docker compose -f docker-compose.base44.yml up -d --build
```
The compose service runs `npm install` then `npx vite` with live reload. Source is
bind-mounted, so edits appear without rebuilds.

## External Credentials (optional)
LINE Pay credentials are **optional** — the app boots and runs in mock mode
without them. To enable real payments, set via the Base44 dashboard:
- `LINE_PAY_CHANNEL_ID`
- `LINE_PAY_CHANNEL_SECRET`
- `LINE_PAY_SANDBOX` (set to `true` for sandbox/testing)

## Verification
- App loads at `/` showing a login screen (姓名/手機)
- Passenger mode shows a Leaflet map with pickup/dropoff markers and driver icons
- POST `/api/linepay` returns a mock JSON response when credentials are absent
- Admin mode shows ride history table
