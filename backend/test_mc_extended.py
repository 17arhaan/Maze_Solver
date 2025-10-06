#!/usr/bin/env python3
"""Extended test to compare MC vs Q-Learning with many episodes"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from envs.maze_env import MazeEnv
from agents.monte_carlo import MonteCarloAgent
from agents.q_learning import QLearningAgent
import numpy as np

def test_extended():
    """Test with 5000 episodes like the UI does"""
    print("🧪 Extended Test: 5000 episodes each")
    
    env = MazeEnv()
    print(f"Environment: {env.n_states} states, {env.n_actions} actions")
    print(f"Start: {env.start}, Goal: {env.goal}\n")
    
    # Q-Learning
    print("📊 Training Q-Learning (5000 episodes)...")
    q_agent = QLearningAgent(env.n_states, env.n_actions, alpha=0.3, gamma=0.99, epsilon=0.15)
    q_success = 0
    q_first_success = None
    for ep in range(5000):
        reward, success = q_agent.run_episode(env, max_steps=200, epsilon=0.15)
        if success:
            q_success += 1
            if q_first_success is None:
                q_first_success = ep + 1
        if (ep + 1) % 1000 == 0:
            print(f"  Episode {ep+1}: Success rate = {q_success/(ep+1)*100:.1f}%")
    print(f"Final success rate: {q_success/5000*100:.1f}%")
    print(f"First success at episode: {q_first_success if q_first_success else 'Never'}\n")
    
    # Monte Carlo with higher exploration
    print("📊 Training Monte Carlo (5000 episodes)...")
    mc_agent = MonteCarloAgent(env.n_states, env.n_actions, gamma=0.99, epsilon=0.5, method='first_visit')
    mc_success = 0
    mc_first_success = None
    for ep in range(5000):
        # Gradual epsilon decay
        if ep > 0 and ep % 50 == 0:
            mc_agent.decay_epsilon(decay_rate=0.98, min_epsilon=0.05)
        
        reward, success = mc_agent.run_episode(env, max_steps=200)
        if success:
            mc_success += 1
            if mc_first_success is None:
                mc_first_success = ep + 1
        if (ep + 1) % 1000 == 0:
            print(f"  Episode {ep+1}: Success rate = {mc_success/(ep+1)*100:.1f}%, ε={mc_agent.epsilon:.3f}")
    print(f"Final success rate: {mc_success/5000*100:.1f}%")
    print(f"First success at episode: {mc_first_success if mc_first_success else 'Never'}\n")
    
    # Every-Visit MC
    print("📊 Training Monte Carlo Every-Visit (5000 episodes)...")
    mc_ev_agent = MonteCarloAgent(env.n_states, env.n_actions, gamma=0.99, epsilon=0.5, method='every_visit')
    mc_ev_success = 0
    mc_ev_first_success = None
    for ep in range(5000):
        # Gradual epsilon decay
        if ep > 0 and ep % 50 == 0:
            mc_ev_agent.decay_epsilon(decay_rate=0.98, min_epsilon=0.05)
        
        reward, success = mc_ev_agent.run_episode(env, max_steps=200)
        if success:
            mc_ev_success += 1
            if mc_ev_first_success is None:
                mc_ev_first_success = ep + 1
        if (ep + 1) % 1000 == 0:
            print(f"  Episode {ep+1}: Success rate = {mc_ev_success/(ep+1)*100:.1f}%, ε={mc_ev_agent.epsilon:.3f}")
    print(f"Final success rate: {mc_ev_success/5000*100:.1f}%")
    print(f"First success at episode: {mc_ev_first_success if mc_ev_first_success else 'Never'}\n")
    
    # Summary
    print("="*60)
    print("SUMMARY")
    print("="*60)
    print(f"Q-Learning:            {q_success/5000*100:.1f}% success rate")
    print(f"Monte Carlo (FV):      {mc_success/5000*100:.1f}% success rate")
    print(f"Monte Carlo (EV):      {mc_ev_success/5000*100:.1f}% success rate")
    print(f"\nFirst Success:")
    print(f"Q-Learning:            Episode {q_first_success if q_first_success else 'Never'}")
    print(f"Monte Carlo (FV):      Episode {mc_first_success if mc_first_success else 'Never'}")
    print(f"Monte Carlo (EV):      Episode {mc_ev_first_success if mc_ev_first_success else 'Never'}")

if __name__ == "__main__":
    test_extended()

