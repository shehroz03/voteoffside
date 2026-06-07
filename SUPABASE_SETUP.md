# Connect VoteOffside to Supabase (step by step)

This turns on **real voting + live percentages shared across all users**.
Until you do this, the app runs fine in **demo mode** — no crash.

## 1. Make a free Supabase project
1. Go to https://supabase.com → sign up (free).
2. Click **New project**. Pick a name and a strong database password. Choose the
   region closest to your users. Wait ~2 minutes for it to be ready.

## 2. Create the database tables
1. In your project: left sidebar → **SQL Editor** → **New query**.
2. Open the file `supabase_schema.sql` (in this project), copy **everything**,
   paste it into the editor, and click **Run**.
3. You should see "Success". That's all the tables, the voting function,
   security rules, and realtime — done.

## 3. Get your two keys
1. Left sidebar → **Project Settings** → **API**.
2. Copy the **Project URL** (looks like `https://abcd1234.supabase.co`).
3. Copy the **anon public** key (the long one labelled `anon` / `public`).

> ⚠️ NEVER copy the **service_role** / secret key into the app. Only the
> **anon public** key goes in the frontend. It's designed to be public.

## 4. Put the keys in the app
1. In this project folder, copy `.env.example` to a new file named `.env`.
2. Fill it in:
   ```
   VITE_SUPABASE_URL=https://abcd1234.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ....your anon key....
   ```
3. Save.

## 5. Run it
```bash
npm install        # first time only (installs supabase-js too)
npm run dev
```

Open the site, vote on a match, then open the same match in another browser
window — the percentages update **live** in both. 🎉

## How it works (so you understand it)
- Votes are recorded by one atomic database function (`cast_vote`) that also
  updates a small `vote_counts` table — fast, and safe from double-counting.
- Every visitor reads from `vote_counts` (tiny, public) and gets **realtime**
  updates through a **single** shared connection — so it scales.
- The raw `votes` table is locked down; nobody can read or edit it directly.

## Next steps (later)
- **Live scores:** add a Supabase Edge Function that fetches football-data.org
  every 30s into a `scores` table; the app reads that (never the API directly).
- **Leaderboard:** once results exist, mark each prediction correct/incorrect and
  rank users by their number of correct picks.
