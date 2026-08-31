# The Devil's Advocate

Argue your idea against an AI that only concedes once it's genuinely convinced.

## What's in here

- `src/` — the React frontend (Vite)
- `api/advocate.js` — a serverless backend function that talks to Claude. This keeps your API key private (it never touches the browser).

## Get it running on your own domain (100% free, ~10 minutes)

**1. Get a free Groq API key**
Go to https://console.groq.com, sign up/log in, and create an API key under "API Keys". No billing/credit card required — Groq's free tier gives you a generous number of requests per day, rate-limited but free. This app uses the `llama-3.3-70b-versatile` model.

**2. Push this folder to GitHub**
```
cd devils-advocate-app
git init
git add .
git commit -m "Devil's Advocate app"
```
Create a new repo on GitHub, then follow its instructions to push (something like):
```
git remote add origin https://github.com/YOUR-USERNAME/devils-advocate.git
git push -u origin main
```

**3. Deploy on Vercel (free tier is plenty)**
- Go to https://vercel.com, sign up with GitHub
- Click "Add New Project", pick the repo you just pushed
- Vercel will auto-detect it's a Vite app — leave the defaults
- Before deploying, add an Environment Variable:
  - Name: `GROQ_API_KEY`
  - Value: the key you got in step 1
- Click Deploy

That's it — Vercel gives you a live URL (like `devils-advocate.vercel.app`) instantly, and free custom domains can be attached later in the project settings if you want your own domain name.

**Note on Groq's free tier:** it's rate-limited (requests per minute and per day) rather than metered by cost — fine for personal use or sharing with friends, but if the site gets heavy traffic you may hit the limit and see errors until it resets.

## Running it locally first (optional, to test before deploying)

You'll need Node.js installed (https://nodejs.org).

```
npm install
npm i -g vercel
vercel dev
```
`vercel dev` runs both the frontend and the `/api` serverless function together locally, which `npm run dev` alone won't do (that only runs the frontend). It'll prompt you to link/create a Vercel project on first run — that's fine, you don't need to deploy yet, just say yes to the local setup prompts. Create a `.env` file (copy `.env.example`) with your real API key first.

## Tuning the AI's behavior

Open `api/advocate.js` and edit `SYSTEM_PROMPT` — that's the entire personality and scoring logic. Things worth adjusting:
- The conviction pass threshold (currently 75+)
- How harsh/agreeable it is by default
- `MAX_ROUNDS_DEFAULT` (currently 10, also set in `src/App.jsx`)
