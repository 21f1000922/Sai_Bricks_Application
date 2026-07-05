# Sai Bricks

A free-to-run, Android-first PWA for managing a brick factory: production, batti loading,
leader ledgers with settlements and alert thresholds, sales with partial payments, purchases
on credit, inventory, employees and salaries, daily procurements, monthly reports, and CSV
export. English + Telugu. Multi-factory-ready database.

## Run it locally (demo mode — no account needed)

```bash
npm install
npm run dev
```

Open the printed URL on your phone or in a browser (narrow window ≈ phone). With no `.env`
file the app runs in **demo mode**: sample data, stored only in that browser's localStorage.
This is perfect for trying the app and training before going online.

## Go online (free Supabase + Vercel)

### 1. Create the database (~5 minutes, free)

1. Sign up at [supabase.com](https://supabase.com) → **New project** (Free plan).
   Pick a region in India (Mumbai) for speed.
2. In the project: **SQL Editor → New query**, paste the whole contents of
   [`supabase/schema.sql`](supabase/schema.sql), press **Run**. This creates every table,
   the security rules, and the "owner" bootstrap.
3. **Authentication → Providers → Email**: turn **off** "Confirm email"
   (simplest for a small internal app), or leave it on if you prefer.
4. **Project Settings → API**: copy the **Project URL** and the **anon public** key.

### 2. Connect the app

```bash
copy .env.example .env
# edit .env and paste the two values
npm run dev
```

The app now shows a sign-in screen. Tap **Create account** with the owner's email +
password — the first account automatically becomes the factory **owner** and the factory
row is created with default rates (₹0.90 manufacturing, ₹0.52 batti loading — change them
in Settings).

### 3. Deploy free on Vercel

1. Push this folder to a GitHub repository.
2. [vercel.com](https://vercel.com) → **Add New → Project** → import the repo
   (framework auto-detected: Vite).
3. In the project's **Environment Variables**, add `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY` with the same values as `.env`.
4. Deploy. You get a free `https://….vercel.app` URL.

### 4. Install on the phone

Open the URL in Chrome on Android → menu (⋮) → **Add to Home screen / Install app**.
It opens full-screen with its own icon, like a native app.

## Notes

- **Free-tier pause:** Supabase pauses free projects after ~7 days of zero API traffic.
  Daily use prevents this. If paused, restore with one click in the Supabase dashboard.
- **Rates are snapshotted** on every entry: changing a rate in Settings affects only new
  entries, never history.
- **Master data is never deleted** — deactivate instead (Masters screen). History stays intact.
- **Adding managers later:** create their account in Supabase (Authentication → Users →
  Add user), then link them in SQL:
  `insert into profiles (user_id, factory_id, role) values ('<their-user-id>', '<factory-id>', 'manager');`
  (An in-app invite screen is a planned v2 feature.)

## Development

```bash
npm test        # unit tests for the money/stock math
npm run build   # type-check + production build (dist/)
npm run preview # serve the production build
```

Key layout: `src/data` (types, repos, Supabase client, seed), `src/lib` (calculations,
formatting, CSV), `src/pages` (screens), `src/i18n` (English + Telugu),
`supabase/schema.sql` (full database).
