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
import logging
from datetime import datetime
from envs.maze_env import MazeEnv
from agents.q_learning import QLearningAgent

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
    force=True
)
logger = logging.getLogger(__name__)

# Also log to console explicitly
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)
console_formatter = logging.Formatter(
    '%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
console_handler.setFormatter(console_formatter)
logger.addHandler(console_handler)
logger.setLevel(logging.INFO)

app = FastAPI()

# Startup logging
@app.on_event("startup")
async def startup_event():
    logger.info("="*60)
    logger.info("🚀 MAZE SOLVER BACKEND STARTED")
    logger.info("Server: FastAPI + Uvicorn")
    logger.info("Port: 8000")
    logger.info("CORS Enabled: localhost:3000")
    logger.info("Endpoints: /train, /status/{job_id}, /policy/{job_id}, /reset")
    logger.info("Docs: http://localhost:8000/docs")
    logger.info("="*60)

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
    logger.info("Root endpoint accessed")
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
    
    logger.info("="*60)
    logger.info(f"🚀 NEW TRAINING JOB STARTED")
    logger.info(f"Job ID: {job_id}")
    logger.info(f"Algorithm: {req.algorithm}")
    logger.info(f"Episodes: {req.episodes}")
    logger.info(f"Hyperparameters: α={req.alpha}, γ={req.gamma}, ε={req.epsilon}")
    logger.info(f"Max Steps: {req.max_steps}")
    
    if req.maze and req.rows and req.cols:
        logger.info(f"Custom Maze: {req.rows}×{req.cols} grid provided")
    else:
        logger.info("Using default maze configuration")
    logger.info("="*60)
    
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
        logger.info(f"[{job_id[:8]}] Training thread started")
        JOBS[job_id]['status'] = 'running'
        
        # build environment
        try:
            if req.maze and req.rows and req.cols:
                logger.info(f"[{job_id[:8]}] Building custom environment ({req.rows}×{req.cols})")
                env = MazeEnv(grid_flat=req.maze, rows=req.rows, cols=req.cols)
            else:
                logger.info(f"[{job_id[:8]}] Building default environment")
                env = MazeEnv()  # default demo map
            
            logger.info(f"[{job_id[:8]}] Environment created: {env.n_states} states, {env.n_actions} actions")
            logger.info(f"[{job_id[:8]}] Start: {env.start}, Goal: {env.goal}")
        except Exception as e:
            logger.error(f"[{job_id[:8]}] Environment creation failed: {str(e)}")
            JOBS[job_id]['status'] = 'error'
            return

        agent = QLearningAgent(env.n_states, env.n_actions, alpha=req.alpha, gamma=req.gamma, epsilon=req.epsilon)
        logger.info(f"[{job_id[:8]}] Q-Learning agent initialized")

        # training loop
        logger.info(f"[{job_id[:8]}] Starting training for {req.episodes} episodes")
        start_time = time.time()
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
                avg_reward = float(sum(rewards_window[-100:]) / min(len(rewards_window), 100))
                success_rate = float(success_count / (ep + 1))
                
                JOBS[job_id]['avg_reward'] = avg_reward
                JOBS[job_id]['success_rate'] = success_rate
                JOBS[job_id]['logs'] = rewards_window[-200:]
                
                # Log progress
                logger.info(f"[{job_id[:8]}] Episode {ep + 1}/{req.episodes} ({JOBS[job_id]['progress']}%) | "
                          f"Avg Reward: {avg_reward:.2f} | Success Rate: {success_rate*100:.1f}%")
            
            # tiny sleep to allow responsiveness
            time.sleep(0)

        # training finished
        end_time = time.time()
        training_duration = end_time - start_time
        
        JOBS[job_id]['status'] = 'finished'
        JOBS[job_id]['policy'] = agent.get_policy(env)
        JOBS[job_id]['q_table'] = agent.Q.tolist()
        
        final_success_rate = JOBS[job_id]['success_rate'] * 100 if JOBS[job_id]['success_rate'] else 0
        final_avg_reward = JOBS[job_id]['avg_reward'] if JOBS[job_id]['avg_reward'] else 0
        
        logger.info("="*60)
        logger.info(f"✅ TRAINING COMPLETED - Job {job_id[:8]}")
        logger.info(f"Duration: {training_duration:.2f} seconds")
        logger.info(f"Episodes: {req.episodes}")
        logger.info(f"Final Success Rate: {final_success_rate:.1f}%")
        logger.info(f"Final Avg Reward: {final_avg_reward:.2f}")
        logger.info(f"Training Speed: {req.episodes/training_duration:.1f} episodes/sec")
        logger.info("="*60)
        return

    thread = threading.Thread(target=_train, daemon=True)
    thread.start()
    return {"job_id": job_id}

@app.get('/status/{job_id}')
def get_status(job_id: str):
    job = JOBS.get(job_id)
    if not job:
        logger.warning(f"Status request for unknown job: {job_id[:8]}")
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
    job_count = len(JOBS)
    JOBS.clear()
    logger.info(f"🔄 RESET - Cleared {job_count} training job(s)")
    return {'status': 'reset', 'message': 'All training jobs cleared'}
