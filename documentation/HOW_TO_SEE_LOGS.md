# 📋 How to See Backend Logs

Quick guide to viewing the backend training logs.

---

## 🎯 Where to See Logs

**Backend logs appear in the TERMINAL where you run the backend server.**

---

## ✅ Step-by-Step

### **1. Open a NEW Terminal Window**
```bash
# macOS: Cmd + T (new tab) or Cmd + N (new window)
# Or open a second terminal application
```

### **2. Navigate to Backend**
```bash
cd /Users/arhaan17/Coding/Maze_Solver/backend
```

### **3. Activate Virtual Environment**
```bash
source venv/bin/activate
```

### **4. Start Backend Server**
```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

### **5. Watch for Startup Message**
You should immediately see:
```
============================================================
🚀 MAZE SOLVER BACKEND STARTED
Server: FastAPI + Uvicorn
Port: 8000
CORS Enabled: localhost:3000
Endpoints: /train, /status/{job_id}, /policy/{job_id}, /reset
Docs: http://localhost:8000/docs
============================================================
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [12345] using StatReload
INFO:     Started server process [12346]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### **6. Leave This Terminal Open**
**IMPORTANT:** Keep this terminal visible while using the app!

---

## 🎬 What You'll See During Training

When you click "Start Training" in the browser:

```
============================================================
🚀 NEW TRAINING JOB STARTED
Job ID: f8e7d6c5-4321-8765-09ba-fedcba987654
Algorithm: q_learning
Episodes: 1000
Hyperparameters: α=0.3, γ=0.99, ε=0.1
Max Steps: 200
Custom Maze: 16×17 grid provided
============================================================
[f8e7d6c5] Training thread started
[f8e7d6c5] Building custom environment (16×17)
[f8e7d6c5] Environment created: 272 states, 4 actions
[f8e7d6c5] Start: 1, Goal: 255
[f8e7d6c5] Q-Learning agent initialized
[f8e7d6c5] Starting training for 1000 episodes
[f8e7d6c5] Episode 10/1000 (1%) | Avg Reward: -45.23 | Success Rate: 0.0%
[f8e7d6c5] Episode 100/1000 (10%) | Avg Reward: -12.34 | Success Rate: 25.0%
[f8e7d6c5] Episode 200/1000 (20%) | Avg Reward: -2.45 | Success Rate: 58.5%
[f8e7d6c5] Episode 500/1000 (50%) | Avg Reward: 3.21 | Success Rate: 82.4%
[f8e7d6c5] Episode 1000/1000 (100%) | Avg Reward: 5.67 | Success Rate: 94.2%
============================================================
✅ TRAINING COMPLETED - Job f8e7d6c5
Duration: 2.34 seconds
Episodes: 1000
Final Success Rate: 94.2%
Final Avg Reward: 5.67
Training Speed: 427.4 episodes/sec
============================================================
```

---

## 🖥️ Two Terminal Setup

**Terminal 1 (Backend):**
```
/Users/arhaan17/Coding/Maze_Solver/backend
(venv) $ uvicorn app:app --reload --port 8000

← KEEP THIS OPEN AND VISIBLE
← This is where logs appear!
```

**Terminal 2 (Frontend):**
```
/Users/arhaan17/Coding/Maze_Solver/frontend
$ pnpm dev

← This shows frontend build output
← NOT where backend logs appear
```

---

## ❌ Common Mistakes

### **Mistake 1: Looking in wrong terminal**
```
❌ Frontend terminal (pnpm dev)
   - Shows Next.js compilation
   - NOT backend logs

✅ Backend terminal (uvicorn)
   - Shows training logs
   - THIS is what you want!
```

---

### **Mistake 2: Backend not running**
```
If you see in browser:
"Failed to connect to backend"

Check backend terminal:
- Is uvicorn running?
- See any errors?
- Port 8000 in use?
```

---

### **Mistake 3: Logs not appearing**
```
Backend running but no training logs?

Check:
1. Did you click "Start Training" in browser?
2. Is CORS working? (should see POST /train)
3. Any Python errors in terminal?
```

---

## 🎯 Quick Test

**To verify logs are working:**

1. Start backend in terminal
2. You should see startup message:
   ```
   ============================================================
   🚀 MAZE SOLVER BACKEND STARTED
   ...
   ============================================================
   ```
3. If you see this → Logging is working! ✅
4. If not → Check Python logging configuration

---

## 💡 Pro Tips

### **Tip 1: Use tmux or split terminal**
```bash
# Install tmux
brew install tmux

# Start tmux
tmux

# Split horizontally
Ctrl+B then "

# Now you see both terminals at once!
# Top: Backend logs
# Bottom: Frontend
```

---

### **Tip 2: Increase terminal buffer**
```
Terminal → Preferences → Profiles → Window → Scrollback: Unlimited

Now you can scroll back to see all training logs
```

---

### **Tip 3: Save logs to file**
```bash
# Run backend and save logs
uvicorn app:app --reload --port 8000 2>&1 | tee training_session.log

# Now logs go to both:
# - Your terminal (you can see them)
# - training_session.log (saved for later)
```

---

### **Tip 4: Filter logs**
```bash
# Only show training logs (grep)
uvicorn app:app --reload --port 8000 2>&1 | grep -E "Episode|TRAINING|COMPLETED"

# Shows only important milestones
```

---

## 🔍 What Each Log Tells You

### **Job ID: `f8e7d6c5`**
- First 8 chars of UUID
- Identifies this specific training session
- Useful when running multiple trainings

### **Avg Reward: `-12.34` → `5.67`**
- Shows learning progress
- Negative = hitting walls
- Positive = reaching goal
- Higher = better

### **Success Rate: `25.0%` → `94.2%`**
- Percentage of successful episodes
- 0% = never reaches goal
- 100% = always reaches goal
- 80%+ = good policy

### **Training Speed: `427.4 eps/sec`**
- How fast training runs
- 200-600 = normal
- < 100 = slow (check CPU)
- > 1000 = very fast

---

## 🎓 Understanding the Flow

```
You click "Start Training" in browser
    ↓
Frontend sends POST to /train
    ↓
Backend logs: "NEW TRAINING JOB STARTED"
    ↓
Backend creates environment
    ↓
Backend logs: "Environment created: 272 states"
    ↓
Training loop begins
    ↓
Backend logs progress every 1%
    ↓
Training completes
    ↓
Backend logs: "TRAINING COMPLETED" with summary
    ↓
Frontend polls /status and displays results
```

---

## 🚨 Troubleshooting

### **No startup message?**
```bash
# Check if backend is actually running
lsof -i :8000

# Should show:
COMMAND   PID   USER
Python  12345  arhaan17

# If empty, backend isn't running
```

---

### **Logs appear but then stop?**
```
Possible causes:
1. Training completed (check for "COMPLETED" message)
2. Python error (scroll up to see traceback)
3. Thread crashed (rare, check for exceptions)
```

---

### **Backend starts but crashes on training?**
```
Look for Python exceptions:
- ImportError (missing package)
- ValueError (invalid maze)
- MemoryError (too large)

Check error message and fix accordingly
```

---

## ✅ Verification Checklist

Before training:
- [ ] Backend terminal open and visible
- [ ] See "MAZE SOLVER BACKEND STARTED" message
- [ ] Uvicorn running on port 8000
- [ ] No error messages in terminal

During training:
- [ ] See "NEW TRAINING JOB STARTED"
- [ ] See progress logs (Episode X/Y)
- [ ] Avg reward improving
- [ ] Success rate increasing

After training:
- [ ] See "TRAINING COMPLETED"
- [ ] Final metrics displayed
- [ ] Training speed reasonable
- [ ] No error messages

---

**Now you know exactly where to look for backend logs!** 📋✅

