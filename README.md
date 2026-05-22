# Ritual Scratch — Next.js Setup Guide

## Step 1: Install Node.js (if you don't have it)

Download from: https://nodejs.org  
Choose the **LTS** version. Install it and restart your terminal.

Verify it works by typing:
```
node --version
npm --version
```

---

## Step 2: Set Up the Project

Open a terminal, go into this folder, and run:

```
npm install
```

This downloads all the dependencies (~1-2 minutes).

---

## Step 3: Create Your Environment File

Copy the example file:
```
cp .env.local.example .env.local
```

The `.env.local` file already has your Supabase credentials pre-filled. You don't need to change anything.

---

## Step 4: Run the App Locally

```
npm run dev
```

Open your browser and go to: http://localhost:3000

---

## Step 5: Push to GitHub

1. Go to https://github.com and sign in (create a free account if needed)
2. Click the **+** button → **New repository**
3. Name it `ritual-scratch`, leave all other settings default, click **Create repository**
4. GitHub will show you commands — run them in your terminal:

```
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ritual-scratch.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

---

## Step 6: Deploy to Vercel (Free Hosting)

1. Go to https://vercel.com and click **Sign Up** → sign in with GitHub
2. Click **Add New Project**
3. Click **Import** next to your `ritual-scratch` repository
4. In the **Environment Variables** section, add these two variables:

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://thmchcazqxtbsqnfjexo.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_8rgPU20i6GPV073CYjcupw_d2HIP78Y` |

5. Click **Deploy**

Your site will be live in about 1 minute at `https://ritual-scratch.vercel.app` (or similar).

---

## After That: Automatic Deploys

Every time you make changes and push to GitHub, Vercel automatically rebuilds and deploys your site. No extra steps needed.

```
git add .
git commit -m "Updated something"
git push
```

---

## Supabase Table (already set up)

Your existing Supabase data is preserved — the app connects to the same database you were using before.

If you need to recreate the table in a new Supabase project, run this SQL in the Supabase SQL editor:

```sql
create table leaderboard (
  wallet_address text primary key,
  username text,
  total_points integer default 0,
  lifetime_points integer default 0,
  total_scratches integer default 0,
  last_claim bigint,
  created_at text
);
alter table leaderboard enable row level security;
create policy "Public read" on leaderboard for select using (true);
create policy "Public insert" on leaderboard for insert with check (true);
create policy "Public update" on leaderboard for update using (true);
```
