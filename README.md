# VoteOffside ⚽ — World Cup 2026 Predictions

Frontend foundation for **voteoffside.com** — predict every match, live scores,
player comparison, leaderboard. React + Vite + Tailwind. No login (anonymous
identity via localStorage). Mobile-first with a bottom tab bar + dark mode.

---

## Run it locally

You need **Node.js 18+** installed. Then in a terminal:

```bash
cd voteoffside
npm install
npm run dev
```

Open the URL it prints (usually http://localhost:5173).

To build for production:

```bash
npm run build      # output goes to dist/
npm run preview    # preview the production build
```

---

## What's included (Stage 1)

- ✅ Brand design system (FIFA blue #1a56db, gold #f59e0b, Inter, white/dark)
- ✅ Top nav + mobile bottom tab bar + dark mode toggle
- ✅ Anonymous identity (auto username like `EagleKing_2207`, browser fingerprint)
- ✅ All 10 routes wired (`/`, `/schedule`, `/live`, `/predictions`, `/teams`,
  `/teams/:code`, `/players`, `/players/:id`, `/compare`, `/leaderboard`)
- ✅ Real, accurate **48 teams + 12 groups** data
- ✅ Prediction voting with animated % bars (saved per user in localStorage)
- ✅ Schedule with group / matchday filters
- ✅ Live page with 30s auto-refresh + upset alert (demo data)
- ✅ Player database, profiles, and 2–4 player comparison
- ✅ Favourites (teams + players), leaderboard

## Not yet done (Stage 2 — needs a backend)

These currently use **demo/seed data** and are clearly marked in the UI:

- Real **live scores** → connect football-data.org or TheSportsDB
- **Shared** vote percentages across all users → Express + MongoDB + Socket.io
- Real **leaderboard** ranking
- Push notifications, World Vote Map, shareable PNG cards

---

## Project structure

```
src/
  data/        teams.json (real), players.json (sample)
  lib/         identity, teams, matches, players, community helpers
  context/     ThemeContext (dark mode), AppContext (user/votes/favorites)
  components/   Layout, TopNav, BottomNav, MatchCard, VoteBar, TeamBadge, ...
  pages/       Home, Schedule, Live, Predictions, Teams, TeamProfile,
               Players, PlayerProfile, Compare, Leaderboard, NotFound
```

---

## Real data — how to wire it (Stage 2)

1. **Schedule/fixtures:** `src/lib/matches.js` generates accurate group-stage
   *matchups*, but dates/times/venues are seed values. Replace with the official
   fixture list, or fetch from an API in your backend and serve it to the app.
2. **Live scores:** create a small Express endpoint that calls football-data.org
   (free key) every ~30s, caches the result, and returns it. The `Live` page
   already refreshes every 30s — point it at your endpoint.
3. **Votes (shared %):** the `MatchCard` reads `communityVotes()` from
   `src/lib/community.js` (demo). Swap this for a call to your backend; broadcast
   updates with Socket.io so all users see live percentages.
4. **Players:** `players.json` is a small sample. Pull full squads + photos from
   TheSportsDB.

> Keep your API keys on the **backend**, never in the React app.

---

## Deploy (when the app is ready)

Easiest (free, no server admin): **Vercel/Netlify** for the frontend,
**Render/Railway** for the backend, **MongoDB Atlas free tier** for the database.
Point your `voteoffside.com` DNS at the host. A VPS (Contabo) also works if you
prefer full control — you'd set up Nginx + PM2 + Let's Encrypt SSL.
