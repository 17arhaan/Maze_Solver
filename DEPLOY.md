# How to Deploy

Simple guide to get your Maze Solver online.

---

## Easiest Way (FREE) - Vercel + Render

### Step 1: Deploy Backend (5 minutes)

1. Go to **[render.com](https://render.com)** and sign up (free)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account and select `Maze_Solver` repo
4. Configure:
   - **Name:** `maze-solver-backend`
   - **Region:** Choose closest to you
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app:app --host 0.0.0.0 --port $PORT`
5. Click **"Create Web Service"**
6. Wait 2-3 minutes for deployment
7. **Copy your backend URL** (e.g., `https://maze-solver-backend.onrender.com`)

### Step 2: Deploy Frontend (5 minutes)

1. Go to **[vercel.com](https://vercel.com)** and sign up (free)
2. Click **"Add New..."** → **"Project"**
3. Import your `Maze_Solver` repository
4. Configure:
   - **Framework:** Next.js (auto-detected)
   - **Root Directory:** `frontend`
   - **Build Command:** `pnpm build` (auto-filled)
5. Add Environment Variable:
   - **Name:** `NEXT_PUBLIC_API_URL`
   - **Value:** Your Render backend URL from Step 1
6. Click **"Deploy"**
7. Wait 1-2 minutes for deployment
8. **Copy your frontend URL** (e.g., `https://your-app.vercel.app`)

### Step 3: Update CORS (Important!)

1. Open `backend/app.py` 
2. Find line 37 (the `allow_origins` line)
3. Add your Vercel URL:

```python
allow_origins=[
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://your-app.vercel.app"  # Add your actual URL here
]
```

4. Commit and push:
```bash
git add backend/app.py
git commit -m "Add production frontend URL to CORS"
git push origin main
```

5. Render will auto-deploy the update in 1-2 minutes

### ✅ Done!

Your app is now live at your Vercel URL! 🎉

**Note:** Render's free tier sleeps after 15 min of inactivity. First request may take 30-60 seconds to wake up.

---

## Alternative: Docker (Local Testing)

Test deployment locally with Docker:

```bash
docker-compose up --build
```

Access:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000

Stop:
```bash
docker-compose down
```

---

## Alternative: Railway (No Sleep - $5/month)

### Backend
```bash
cd backend
npx @railway/cli login
npx @railway/cli init
npx @railway/cli up
```

### Frontend
```bash
cd frontend
npx @railway/cli init
npx @railway/cli up
```

Add environment variable in Railway dashboard:
- `NEXT_PUBLIC_API_URL` = your Railway backend URL

Then update CORS in `backend/app.py` with your Railway frontend URL.

---

## Troubleshooting

### "CORS error" in browser
**Fix:** Make sure you added your frontend URL to `allow_origins` in `backend/app.py`

### "Failed to fetch" error
**Fix:** Check that `NEXT_PUBLIC_API_URL` environment variable is set correctly in Vercel

### Backend sleeping (Render)
**Normal on free tier.** First request takes 30-60s. Upgrade to paid ($7/mo) for instant response.

---

## Quick Reference

| Platform | Cost | Setup Time | Best For |
|----------|------|------------|----------|
| **Vercel + Render** | FREE | 10 min | Portfolio/Demo |
| **Railway** | $5/mo | 5 min | Production |
| **Docker Local** | FREE | 2 min | Testing |

---

**Need help?** Check GitHub Actions status or visit platform docs:
- [Vercel Docs](https://vercel.com/docs)
- [Render Docs](https://render.com/docs)
- [Railway Docs](https://docs.railway.app/)

