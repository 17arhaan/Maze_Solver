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
from agents.monte_carlo import MonteCarloAgent

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
    force=True
)
logger = logging.getLogger(__name__)

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

@app.on_event("startup")
async def startup_event():
    logger.info("="*60)
    logger.info("🚀 MAZE SOLVER BACKEND STARTED")
    logger.info("Server: FastAPI + Uvicorn")
    logger.info("Port: 8000")
    logger.info("CORS Enabled: localhost:3000")
    logger.info("Endpoints: /train, /compare, /status/{job_id}, /policy/{job_id}, /reset")
    logger.info("Docs: http://localhost:8000/docs")
    logger.info("="*60)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

JOBS = {}

class TrainRequest(BaseModel):
    algorithm: str = "q_learning"
    episodes: int = 5000
    alpha: float = 0.3
    gamma: float = 0.99
    epsilon: float = 0.15
    max_steps: int = 200
    mc_method: str = "first_visit"
    epsilon_decay: float = 0.9996
    min_epsilon: float = 0.01
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
    if req.algorithm.startswith("monte_carlo"):
        logger.info(f"MC Method: {req.mc_method}, ε_decay={req.epsilon_decay}, min_ε={req.min_epsilon}")
    
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
        
        try:
            # Use distance-based reward shaping for Monte Carlo to help it learn
            use_shaping = req.algorithm == "monte_carlo"
            
            if req.maze and req.rows and req.cols:
                logger.info(f"[{job_id[:8]}] Building custom environment ({req.rows}×{req.cols})")
                env = MazeEnv(grid_flat=req.maze, rows=req.rows, cols=req.cols, use_distance_shaping=use_shaping)
            else:
                logger.info(f"[{job_id[:8]}] Building default environment")
                env = MazeEnv(use_distance_shaping=use_shaping)  # default demo map
            
            if use_shaping:
                logger.info(f"[{job_id[:8]}] Using distance-based reward shaping for Monte Carlo")
            
            logger.info(f"[{job_id[:8]}] Environment created: {env.n_states} states, {env.n_actions} actions")
            logger.info(f"[{job_id[:8]}] Start: {env.start}, Goal: {env.goal}")
        except Exception as e:
            logger.error(f"[{job_id[:8]}] Environment creation failed: {str(e)}")
            JOBS[job_id]['status'] = 'error'
            return

        if req.algorithm == "q_learning":
            agent = QLearningAgent(env.n_states, env.n_actions, alpha=req.alpha, gamma=req.gamma, epsilon=req.epsilon)
            logger.info(f"[{job_id[:8]}] Q-Learning agent initialized")
        elif req.algorithm == "monte_carlo":
            # Use higher optimistic initialization and ensure decent exploration
            optimistic_init = 100.0
            # Ensure Monte Carlo has reasonable exploration (min 0.2)
            mc_epsilon = max(req.epsilon, 0.2)
            agent = MonteCarloAgent(env.n_states, env.n_actions, gamma=req.gamma, epsilon=mc_epsilon, method=req.mc_method, optimistic_init=optimistic_init)
            logger.info(f"[{job_id[:8]}] Monte Carlo agent initialized (method: {req.mc_method}, initial_ε={mc_epsilon}, optimistic_init={optimistic_init}, exploring_starts=enabled)")
        elif req.algorithm == "sarsa":
            logger.warning(f"[{job_id[:8]}] SARSA not implemented yet, using Q-Learning instead")
            agent = QLearningAgent(env.n_states, env.n_actions, alpha=req.alpha, gamma=req.gamma, epsilon=req.epsilon)
            logger.info(f"[{job_id[:8]}] Q-Learning agent initialized (placeholder for SARSA)")
        else:
            logger.error(f"[{job_id[:8]}] Unknown algorithm: {req.algorithm}")
            JOBS[job_id]['status'] = 'error'
            return
        logger.info(f"[{job_id[:8]}] Starting training for {req.episodes} episodes")
        start_time = time.time()
        success_count = 0
        rewards_window = []
        
        for ep in range(req.episodes):
            current_epsilon = req.epsilon
            if req.algorithm.startswith("monte_carlo"):
                # Use exponential decay: epsilon = initial * (decay_rate ^ episode)
                # Apply the user-specified epsilon_decay parameter
                mc_initial = max(req.epsilon, 0.2)
                mc_min = max(req.min_epsilon, 0.05)
                # Use the passed epsilon_decay parameter for decay
                current_epsilon = max(mc_min, mc_initial * (req.epsilon_decay ** ep))
                agent.epsilon = current_epsilon
            
            # Enable exploring starts for Monte Carlo to help it learn long paths
            exploring_start = req.algorithm == "monte_carlo"
            total_reward, success = agent.run_episode(env, max_steps=req.max_steps, epsilon=current_epsilon, exploring_start=exploring_start)
            rewards_window.append(total_reward)
            if success:
                success_count += 1
            
            if (ep + 1) % max(1, req.episodes // 100) == 0 or ep == req.episodes - 1:
                JOBS[job_id]['episode'] = ep + 1
                JOBS[job_id]['progress'] = int(((ep + 1) / req.episodes) * 100)
                avg_reward = float(sum(rewards_window[-100:]) / min(len(rewards_window), 100))
                success_rate = float(success_count / (ep + 1))
                JOBS[job_id]['avg_reward'] = avg_reward
                JOBS[job_id]['success_rate'] = success_rate
                JOBS[job_id]['logs'] = rewards_window[-200:]
                logger.info(f"[{job_id[:8]}] Episode {ep + 1}/{req.episodes} ({JOBS[job_id]['progress']}%) | "
                          f"Avg Reward: {avg_reward:.2f} | Success Rate: {success_rate*100:.1f}%")
            time.sleep(0)
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

@app.post('/compare')
def compare_algorithms(req: TrainRequest):
    """
    Compare multiple algorithms on the same maze
    Returns job IDs for each algorithm to track separately
    """
    algorithms = ["q_learning", "monte_carlo", "sarsa"]
    job_ids = {}
    
    logger.info("="*60)
    logger.info(f"🔬 ALGORITHM COMPARISON STARTED")
    logger.info(f"Algorithms: {', '.join(algorithms)}")
    logger.info(f"Episodes per algorithm: {req.episodes}")
    logger.info("="*60)
    
    for algorithm in algorithms:
        # Create a copy of the request with the specific algorithm
        comparison_req = TrainRequest(
            algorithm=algorithm,
            episodes=req.episodes,
            alpha=req.alpha,
            gamma=req.gamma,
            epsilon=req.epsilon,
            max_steps=req.max_steps,
            mc_method=req.mc_method,
            epsilon_decay=req.epsilon_decay,
            min_epsilon=req.min_epsilon,
            maze=req.maze,
            rows=req.rows,
            cols=req.cols
        )
        
        # Start training for this algorithm
        result = start_train(comparison_req)
        job_ids[algorithm] = result["job_id"]
        
        logger.info(f"Started {algorithm} training with job ID: {result['job_id'][:8]}")
    
    return {
        "comparison_id": str(uuid.uuid4()),
        "algorithms": algorithms,
        "job_ids": job_ids,
        "status": "comparison_started"
    }

@app.post('/reset')
def reset_environment():
    """Reset the training environment and clear all jobs."""
    job_count = len(JOBS)
    JOBS.clear()
    logger.info(f"🔄 RESET - Cleared {job_count} training job(s)")
    return {'status': 'reset', 'message': 'All training jobs cleared'}
