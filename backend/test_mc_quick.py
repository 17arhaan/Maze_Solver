#!/usr/bin/env python3
"""Quick test to debug Monte Carlo issues"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from envs.maze_env import MazeEnv
from agents.monte_carlo import MonteCarloAgent
from agents.q_learning import QLearningAgent
import numpy as np

def test_mc_vs_qlearning():
    """Compare MC vs Q-Learning on simple training"""
    print("🧪 Testing Monte Carlo vs Q-Learning...")
    
    env = MazeEnv()
    print(f"Environment: {env.n_states} states, {env.n_actions} actions")
    print(f"Start: {env.start}, Goal: {env.goal}")
    
    # Test Q-Learning (known to work)
    print("\n📊 Q-Learning (100 episodes):")
    q_agent = QLearningAgent(env.n_states, env.n_actions, alpha=0.3, gamma=0.99, epsilon=0.15)
    q_success = 0
    for ep in range(100):
        reward, success = q_agent.run_episode(env, max_steps=200)
        if success:
            q_success += 1
    print(f"Success rate: {q_success/100*100:.1f}%")
    
    # Test Monte Carlo with HIGHER initial exploration
    print("\n📊 Monte Carlo (1000 episodes with epsilon decay):")
    mc_agent = MonteCarloAgent(env.n_states, env.n_actions, gamma=0.99, epsilon=0.5, method='first_visit')
    mc_success = 0
    for ep in range(1000):
        # Decay epsilon gradually
        if ep > 0 and ep % 50 == 0:
            mc_agent.decay_epsilon(decay_rate=0.95, min_epsilon=0.05)
        
        reward, success = mc_agent.run_episode(env, max_steps=200)
        if success:
            mc_success += 1
        if ep < 5 or ep % 200 == 0:
            print(f"  Episode {ep+1}: Reward={reward:.1f}, Success={success}, ε={mc_agent.epsilon:.3f}")
    print(f"Success rate: {mc_success/1000*100:.1f}%")
    
    # Check Q-table updates
    print(f"\nQ-Learning Q-table non-zero values: {np.count_nonzero(q_agent.Q)}")
    print(f"Monte Carlo Q-table non-zero values: {np.count_nonzero(mc_agent.Q)}")
    
    # Check specific start state Q-values
    print(f"\nQ-values at start state ({env.start}):")
    print(f"  Q-Learning: {q_agent.Q[env.start]}")
    print(f"  Monte Carlo: {mc_agent.Q[env.start]}")
    
    # Check statistics
    stats = mc_agent.get_statistics()
    print(f"\nMC Stats: {stats}")

if __name__ == "__main__":
    test_mc_vs_qlearning()

