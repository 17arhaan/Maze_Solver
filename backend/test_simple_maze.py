#!/usr/bin/env python3
"""Test MC on a SIMPLE maze to verify it works"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from envs.maze_env import MazeEnv
from agents.monte_carlo import MonteCarloAgent
from agents.q_learning import QLearningAgent
import numpy as np

def create_simple_maze():
    """Create a simple 5x5 maze with direct path"""
    # 0 = wall, 1 = path, 2 = start (0,1), 3 = goal (4,3)
    maze = [
        [0, 1, 0, 0, 0],  # Start at (0,1)
        [0, 1, 1, 1, 0],
        [0, 0, 0, 1, 0],
        [0, 1, 1, 1, 0],
        [0, 1, 0, 1, 0],  # Goal at (4,3)
    ]
    # Flatten
    flat = []
    for row in maze:
        flat.extend(row)
    return flat

def test_simple_maze():
    """Test on simple maze"""
    print("🧪 Testing on SIMPLE 5x5 maze")
    print("="*60)
    
    # Create simple environment
    simple_maze = create_simple_maze()
    env = MazeEnv(grid_flat=simple_maze, rows=5, cols=5)
    
    print(f"Environment: {env.n_states} states, {env.n_actions} actions")
    print(f"Start: {env.start}, Goal: {env.goal}\n")
    
    # Q-Learning
    print("📊 Q-Learning (500 episodes)...")
    q_agent = QLearningAgent(env.n_states, env.n_actions, alpha=0.3, gamma=0.99, epsilon=0.15)
    q_success = 0
    for ep in range(500):
        reward, success = q_agent.run_episode(env, max_steps=50)
        if success:
            q_success += 1
    print(f"Success rate: {q_success/500*100:.1f}%\n")
    
    # Monte Carlo
    print("📊 Monte Carlo First-Visit (500 episodes)...")
    mc_agent = MonteCarloAgent(env.n_states, env.n_actions, gamma=0.99, epsilon=0.3, method='first_visit')
    mc_success = 0
    mc_first = None
    for ep in range(500):
        if ep > 0 and ep % 25 == 0:
            mc_agent.decay_epsilon(0.95, 0.05)
        reward, success = mc_agent.run_episode(env, max_steps=50)
        if success:
            mc_success += 1
            if mc_first is None:
                mc_first = ep + 1
                print(f"  ✓ First success at episode {mc_first}!")
        if (ep + 1) % 100 == 0:
            print(f"  Episode {ep+1}: {mc_success} successes so far (ε={mc_agent.epsilon:.3f})")
    print(f"Success rate: {mc_success/500*100:.1f}%\n")
    
    # Every-Visit MC
    print("📊 Monte Carlo Every-Visit (500 episodes)...")
    mc_ev_agent = MonteCarloAgent(env.n_states, env.n_actions, gamma=0.99, epsilon=0.3, method='every_visit')
    mc_ev_success = 0
    mc_ev_first = None
    for ep in range(500):
        if ep > 0 and ep % 25 == 0:
            mc_ev_agent.decay_epsilon(0.95, 0.05)
        reward, success = mc_ev_agent.run_episode(env, max_steps=50)
        if success:
            mc_ev_success += 1
            if mc_ev_first is None:
                mc_ev_first = ep + 1
                print(f"  ✓ First success at episode {mc_ev_first}!")
        if (ep + 1) % 100 == 0:
            print(f"  Episode {ep+1}: {mc_ev_success} successes so far (ε={mc_ev_agent.epsilon:.3f})")
    print(f"Success rate: {mc_ev_success/500*100:.1f}%\n")
    
    print("="*60)
    print("RESULTS:")
    print(f"Q-Learning:         {q_success/500*100:.1f}% success")
    print(f"MC First-Visit:     {mc_success/500*100:.1f}% success (first at ep {mc_first or 'N/A'})")
    print(f"MC Every-Visit:     {mc_ev_success/500*100:.1f}% success (first at ep {mc_ev_first or 'N/A'})")
    
    if mc_success > 0 or mc_ev_success > 0:
        print("\n✅ Monte Carlo IS WORKING!")
    else:
        print("\n❌ Monte Carlo NOT working properly")

if __name__ == "__main__":
    test_simple_maze()

