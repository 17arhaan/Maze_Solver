### File: app.py
from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, FileResponse
from pydantic import BaseModel
from typing import List, Optional
import threading
import time
import uuid
import json
import os
from envs.maze_env import MazeEnv
from agents.q_learning import QLearningAgent

app = FastAPI()

# Enable CORS for frontend (Next.js default port is 3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple in-memory job store. For demo purposes only.
JOBS = {}

class TrainRequest(BaseModel):
    algorithm: str = "q_learning"
    episodes: int = 5000
    alpha: float = 0.3
    gamma: float = 0.99
    epsilon: float = 0.15
    max_steps: int = 200
    # optional maze: flattened list of ints with rows and cols
    maze: Optional[List[int]] = None
    rows: Optional[int] = None
    cols: Optional[int] = None

@app.get("/", response_class=HTMLResponse)
def index():
    return "<h2>Maze Solver Backend</h2><p>Use <a href='/docs'>/docs</a> to access the API.</p>"

@app.get("/favicon.ico")
def favicon():
    path = os.path.join(os.path.dirname(__file__), "static", "favicon.ico")
    if os.path.exists(path):
        return FileResponse(path)
    return "", 204

@app.post('/train')
def start_train(req: TrainRequest):
    job_id = str(uuid.uuid4())
    JOBS[job_id] = {
        'status': 'queued',
        'progress': 0,
        'episode': 0,
        'episodes': req.episodes,
        'avg_reward': None,
        'success_rate': None,
        'policy': None,
        'q_table': None,
        'logs': []
    }

    def _train():
        JOBS[job_id]['status'] = 'running'
        # build environment
        if req.maze and req.rows and req.cols:
            env = MazeEnv(grid_flat=req.maze, rows=req.rows, cols=req.cols)
        else:
            env = MazeEnv()  # default demo map

        agent = QLearningAgent(env.n_states, env.n_actions, alpha=req.alpha, gamma=req.gamma, epsilon=req.epsilon)

        # training loop
        success_count = 0
        rewards_window = []
        for ep in range(req.episodes):
            total_reward, success = agent.run_episode(env, max_steps=req.max_steps, epsilon=req.epsilon)
            rewards_window.append(total_reward)
            if success:
                success_count += 1
            # update job status periodically
            if (ep + 1) % max(1, req.episodes // 100) == 0 or ep == req.episodes - 1:
                JOBS[job_id]['episode'] = ep + 1
                JOBS[job_id]['progress'] = int(((ep + 1) / req.episodes) * 100)
                JOBS[job_id]['avg_reward'] = float(sum(rewards_window[-100:]) / min(len(rewards_window), 100))
                JOBS[job_id]['success_rate'] = float(success_count / (ep + 1))
                # keep last 200 logs
                JOBS[job_id]['logs'] = rewards_window[-200:]
            # tiny sleep to allow responsiveness
            time.sleep(0)

        # training finished
        JOBS[job_id]['status'] = 'finished'
        JOBS[job_id]['policy'] = agent.get_policy(env)
        JOBS[job_id]['q_table'] = agent.Q.tolist()
        return

    thread = threading.Thread(target=_train, daemon=True)
    thread.start()
    return {"job_id": job_id}

@app.get('/status/{job_id}')
def get_status(job_id: str):
    job = JOBS.get(job_id)
    if not job:
        return {'error': 'job not found'}
    return job

@app.get('/policy/{job_id}')
def get_policy(job_id: str):
    job = JOBS.get(job_id)
    if not job:
        return {'error': 'job not found'}
    return {
        'policy': job.get('policy'),
        'q_table': job.get('q_table'),
        'status': job.get('status')
    }

@app.post('/reset')
def reset_environment():
    """Reset the training environment and clear all jobs."""
    JOBS.clear()
    return {'status': 'reset', 'message': 'All training jobs cleared'}
