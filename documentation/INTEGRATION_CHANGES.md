# Frontend-Backend Integration Changes

## Summary

This document outlines all the changes made to connect the frontend (Next.js) and backend (FastAPI) of the Maze Solver project.

---

## Backend Changes (`backend/app.py`)

### 1. **Added CORS Middleware**
- Enables cross-origin requests from the frontend running on `localhost:3000`
- Allows all HTTP methods and headers for development

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 2. **Added Root Endpoint**
- Provides a friendly landing page at `http://localhost:8000/`
- Links to the Swagger UI documentation

```python
@app.get("/", response_class=HTMLResponse)
def index():
    return "<h2>Maze Solver Backend</h2><p>Use <a href='/docs'>/docs</a> to access the API.</p>"
```

### 3. **Added Favicon Handler**
- Handles `/favicon.ico` requests gracefully
- Returns 204 (No Content) if favicon doesn't exist

```python
@app.get("/favicon.ico")
def favicon():
    path = os.path.join(os.path.dirname(__file__), "static", "favicon.ico")
    if os.path.exists(path):
        return FileResponse(path)
    return "", 204
```

### 4. **Added Reset Endpoint**
- Clears all training jobs from memory
- Allows frontend to reset the environment

```python
@app.post('/reset')
def reset_environment():
    """Reset the training environment and clear all jobs."""
    JOBS.clear()
    return {'status': 'reset', 'message': 'All training jobs cleared'}
```

---

## Backend Environment Changes (`backend/envs/maze_env.py`)

### 1. **Updated Maze Encoding**
- Changed from: `1 = wall, 0 = empty` 
- Changed to: `0 = wall, 1 = empty path, 2 = start, 3 = goal`
- This matches the frontend's maze representation

### 2. **Updated Default Maze**
- Changed to 16×17 grid (from 9×13)
- Set start position at (0, 1) - top row, second column
- Set goal position at (15, 15) - bottom right area
- Matches the exact maze layout in the frontend

### 3. **Fixed Wall Detection**
- Updated `step()` method to check for walls using `== 0` instead of `== 1`

---

## Backend Agent Changes (`backend/agents/q_learning.py`)

### 1. **Fixed Policy Generation**
- Updated `get_policy()` to recognize walls as `0` instead of `1`
- Ensures policy arrows don't appear on walls

---

## Frontend Changes (`frontend/app/page.tsx`)

### 1. **Added Backend Response Interface**
```typescript
interface BackendStatus {
  status: "queued" | "running" | "finished" | "error"
  progress: number
  episode: number
  episodes: number
  avg_reward: number | null
  success_rate: number | null
  policy: (number | null)[] | null
  q_table: number[][] | null
  logs: number[]
}
```

### 2. **Added Job ID State Management**
- Stores the `job_id` returned from `/train` endpoint
- Uses it for polling status updates

```typescript
const [jobId, setJobId] = useState<string | null>(null)
```

### 3. **Updated Training Start Function**
- Captures `job_id` from response
- Includes `max_steps: 200` parameter

### 4. **Fixed Status Polling**
- Polls correct endpoint: `/status/{job_id}`
- Converts backend status format to frontend format
- Converts flattened policy array (272 elements) to 2D grid (16×17)

### 5. **Updated Arrow Mapping**
- Backend actions: `0=up, 1=down, 2=left, 3=right`
- Frontend arrows: `["↑", "↓", "←", "→"]`

### 6. **Added Null Policy Handling**
- Checks for `null` values in policy before rendering arrows
- Prevents errors when displaying walls and goals

### 7. **Fixed Reset Function**
- Clears `jobId` when resetting
- Properly resets all state

---

## Frontend Layout Changes (`frontend/app/layout.tsx`)

### 1. **Added Favicon Metadata**
```typescript
export const metadata: Metadata = {
  title: 'Maze Solver',
  description: 'A Maze Solving Simulation With the Help of Reinforcement Learning Algorithms.',
  icons: {
    icon: '/favicon.png',
  },
}
```

---

## New Files Created

### 1. **SETUP_INSTRUCTIONS.md**
- Complete setup and run instructions
- Backend and frontend configuration
- API endpoint documentation
- Troubleshooting guide

### 2. **backend/test_backend.py**
- Automated test script for backend verification
- Tests all major endpoints
- Verifies training workflow

### 3. **INTEGRATION_CHANGES.md** (this file)
- Documents all integration changes

---

## API Flow

### Training Workflow:

1. **Frontend → Backend**: `POST /train` with parameters
   - Returns: `{ "job_id": "uuid-string" }`

2. **Frontend polls Backend**: `GET /status/{job_id}` every 1 second
   - Returns: Current training progress, rewards, status

3. **When training completes**: Backend includes policy in status response
   - Frontend converts flattened policy to 2D grid
   - Displays directional arrows on maze

4. **Reset**: `POST /reset` clears all jobs

---

## How to Test

### 1. Start Backend:
```bash
cd backend
source venv/bin/activate
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

### 2. Test Backend (optional):
```bash
cd backend
python test_backend.py
```

### 3. Start Frontend:
```bash
cd frontend
pnpm dev
```

### 4. Open Browser:
- Go to `http://localhost:3000`
- Click "Start Training"
- Watch real-time progress
- View learned policy with arrows

---

## Key Technical Details

### Maze Encoding:
- **Frontend Display**: 0=wall (black), 1=path (white)
- **Backend Internal**: 0=wall, 1=path, 2=start, 3=goal
- **Start**: Row 0, Column 1 (blue)
- **Goal**: Row 15, Column 15 (red)

### Action Mapping:
- **0**: Move Up (↑)
- **1**: Move Down (↓)
- **2**: Move Left (←)
- **3**: Move Right (→)

### Rewards:
- **+10**: Reach goal
- **-1**: Each step
- **-5**: Hit wall

### Policy Format:
- **Backend**: Flattened 1D array of 272 elements (16×17)
- **Frontend**: Converted to 2D array for display
- **Values**: 0-3 (action index) or `null` (wall/goal)

---

## Dependencies Added

### Backend (`requirements.txt`):
- `requests` - For testing script

### Frontend:
- No new dependencies (all were already present)

---

## Testing Checklist

- ✅ Backend starts without errors on port 8000
- ✅ Frontend starts without errors on port 3000
- ✅ CORS allows cross-origin requests
- ✅ Training starts and returns job_id
- ✅ Status polling works with job_id
- ✅ Progress updates in real-time
- ✅ Reward curve displays correctly
- ✅ Policy arrows display on completion
- ✅ Reset clears state properly
- ✅ No console errors in browser
- ✅ Swagger UI accessible at localhost:8000/docs

---

## Common Issues & Solutions

### Issue: CORS Error
**Solution**: Verify CORS middleware is enabled in `backend/app.py` and frontend runs on port 3000

### Issue: Job ID Not Found
**Solution**: Ensure backend is polling with the correct job_id from the `/train` response

### Issue: Policy Not Displaying
**Solution**: Check that policy array is being converted from 1D (272) to 2D (16×17) correctly

### Issue: Wrong Arrow Directions
**Solution**: Verify action mapping: 0=up, 1=down, 2=left, 3=right

---

## Future Enhancements

- [ ] Add support for Monte Carlo and SARSA algorithms
- [ ] Implement custom maze editor
- [ ] Add policy comparison visualization
- [ ] Store training history in database
- [ ] Add user authentication
- [ ] Deploy to production server

---

**Integration completed successfully! 🎉**

