# 🔁 SARSA Algorithm Guide

## Overview

**SARSA** (State-Action-Reward-State-Action) is an **on-policy** Temporal Difference (TD) learning algorithm for reinforcement learning. It learns the action-value function Q(s,a) while following the same policy it uses for acting.

---

## 🧮 Algorithm Details

### Update Rule

```
Q(s,a) ← Q(s,a) + α[r + γQ(s',a') - Q(s,a)]
                        ↑
                  Actual next action taken
```

**Key difference from Q-Learning:**
- **SARSA**: Uses `Q(s', a')` where `a'` is the actual next action selected by the current policy
- **Q-Learning**: Uses `max Q(s', a')` regardless of which action will actually be taken

---

## 🔑 Key Characteristics

### On-Policy Learning
- Learns about the policy it's currently following
- Updates based on actions it will actually take
- More conservative and safer than off-policy methods

### Temporal Difference
- Updates after each step (not after full episode like Monte Carlo)
- Bootstraps from next state's Q-value estimate
- Lower variance than Monte Carlo, biased estimates

### Exploration-Aware
- Since it uses the actual next action (which may be exploratory), SARSA learns a more realistic value function
- Accounts for exploration in its value estimates

---

## 💻 Implementation

### Core Algorithm (from `backend/agents/sarsa.py`)

```python
def run_episode(self, env, max_steps=200, epsilon=None):
    state = env.reset()
    action = self.select_action(state, epsilon)  # Select first action
    
    for step in range(max_steps):
        # Take action and observe next state and reward
        next_state, reward, done = env.step(state, action)
        
        # Select next action using current policy (on-policy)
        next_action = self.select_action(next_state, epsilon)
        
        # SARSA update: uses Q(s', a') where a' is the actual next action
        td_error = reward + self.gamma * self.Q[next_state, next_action] - self.Q[state, action]
        self.Q[state, action] += self.alpha * td_error
        
        # Move to next state-action pair
        state = next_state
        action = next_action
        
        if done:
            return total_reward, True
```

### Why "State-Action-Reward-State-Action"?

The algorithm requires a sequence of five elements for each update:
1. **State (s)**: Current state
2. **Action (a)**: Action taken in current state
3. **Reward (r)**: Reward received
4. **State' (s')**: Next state
5. **Action' (a')**: Next action (selected before update)

Hence: **S-A-R-S-A**

---

## 📊 Comparison with Q-Learning and Monte Carlo

| Aspect | SARSA | Q-Learning | Monte Carlo |
|--------|-------|------------|-------------|
| **Policy Type** | On-policy | Off-policy | On-policy |
| **Update Target** | Q(s',a') actual | max Q(s',a') | Full return G_t |
| **Learning Speed** | Medium | Fast | Slow |
| **Sample Efficiency** | Medium | High | Low |
| **Convergence** | Converges to policy being followed | Converges to optimal | Converges to true values |
| **Safety** | Safe (considers exploration) | Aggressive | Very safe |
| **Variance** | Low-Medium | Low | High |
| **Bias** | Biased | Biased | Unbiased |

---

## 🎯 When to Use SARSA

### ✅ Use SARSA When:
- **Safety matters**: SARSA learns a safer policy because it accounts for exploration
- **Stochastic environment**: On-policy learning is more stable in uncertain environments
- **You want conservative learning**: SARSA won't be as aggressive as Q-Learning
- **Exploration is risky**: SARSA learns to avoid risky exploratory actions

### ❌ Don't Use SARSA When:
- **You need fastest convergence**: Q-Learning is typically faster
- **Environment is deterministic**: Q-Learning's optimality guarantee is more valuable
- **You want the optimal policy**: SARSA learns the policy it follows, not necessarily optimal

---

## 🧪 Example Comparison

### Scenario: Cliff Walking Problem

Imagine a grid where:
- Goal is on the right
- Bottom row is a dangerous cliff
- Falling off cliff = large negative reward

**Q-Learning behavior:**
- Learns the optimal path (along the cliff edge)
- During exploration, might fall off cliff often
- Final policy is optimal but risky during training

**SARSA behavior:**
- Learns a safer path (farther from cliff)
- Accounts for exploration mistakes
- Final policy is suboptimal but safer
- Better cumulative reward during training

**In Maze Solver:**
Both algorithms work similarly because there are no "cliff" states. SARSA may be slightly more conservative in tight corridors.

---

## 🎛️ Hyperparameters

### Recommended Settings for Maze Solver

```python
# Balanced (500-1000 episodes)
alpha = 0.3      # Learning rate
gamma = 0.99     # Discount factor
epsilon = 0.15   # Exploration rate
```

### Parameter Effects

**Alpha (α) - Learning Rate:**
- Higher (0.5): Faster learning, less stable
- Lower (0.1): Slower learning, more stable
- Recommended: 0.3

**Gamma (γ) - Discount Factor:**
- Higher (0.99): Values long-term rewards, better for maze
- Lower (0.5): Short-sighted, poor maze performance
- Recommended: 0.95-0.99

**Epsilon (ε) - Exploration:**
- Higher (0.3): More exploration, finds more paths
- Lower (0.05): More exploitation, converges faster
- Recommended: 0.1-0.2

---

## 📈 Expected Performance

### Maze Solver Metrics (16×17 maze)

With recommended settings (α=0.3, γ=0.99, ε=0.15):

| Episodes | Success Rate | Avg Episode Length | Training Time |
|----------|--------------|-------------------|---------------|
| 500 | 15-25% | 150-180 | 0.3-0.5s |
| 1000 | 25-35% | 120-150 | 0.6-0.8s |
| 2000 | 35-45% | 100-130 | 1.2-1.6s |
| 5000 | 40-50% | 90-120 | 3-4s |

**Note:** Performance is typically between Q-Learning (fastest) and Monte Carlo (slowest).

---

## 🔬 Training Tips

### 1. Start with Balanced Parameters
```python
episodes = 1000
alpha = 0.3
gamma = 0.99
epsilon = 0.15
```

### 2. Monitor Training Logs
Watch for:
- ✅ Gradually increasing success rate
- ✅ Decreasing episode lengths
- ✅ Improving average rewards
- ✅ Decreasing TD error over time

### 3. Compare with Q-Learning
Run both algorithms with same parameters to see:
- Q-Learning: Usually faster convergence
- SARSA: May be more stable, especially early on

### 4. Adjust Based on Results

**If success rate is low (<20% after 1000 episodes):**
- Increase gamma to 0.99
- Increase epsilon to 0.2
- Train for more episodes (2000+)

**If training is unstable (jerky reward curve):**
- Decrease alpha to 0.2
- Increase episodes to compensate

**If agent takes very long paths:**
- Increase gamma (0.99)
- Ensure epsilon isn't too high (<0.3)

---

## 🧮 Mathematical Details

### TD Error Calculation

```python
td_error = reward + gamma * Q[next_state, next_action] - Q[state, action]
#          ↑        ↑       ↑                             ↑
#       immediate  discount  estimated future value    current estimate
#       reward     factor    (using actual next action)
```

### Q-Value Update

```python
Q[state, action] += alpha * td_error
#                   ↑        ↑
#              learning rate  correction
```

### Why It Works

1. If `td_error > 0`: Current estimate is too low → increase Q-value
2. If `td_error < 0`: Current estimate is too high → decrease Q-value
3. Over many episodes: Q-values converge to true expected returns **under the current policy**

---

## 🎓 Advanced Concepts

### On-Policy vs Off-Policy

**On-Policy (SARSA):**
- Learns about the policy it's following
- Update uses: `Q(s', a')` where `a'` is chosen by current policy
- Learns: "What return will I get if I keep acting as I am now?"

**Off-Policy (Q-Learning):**
- Learns about the optimal policy while following exploratory policy
- Update uses: `max Q(s', a')` regardless of what action is taken
- Learns: "What's the best possible return from this state?"

### Convergence Properties

**SARSA converges to:**
- The optimal Q-function for the policy being followed
- If epsilon decays to 0: converges to optimal policy
- If epsilon stays constant: converges to policy that accounts for exploration

**Q-Learning converges to:**
- The optimal Q-function regardless of policy followed
- Guaranteed to find optimal policy (under certain conditions)

---

## 💡 Code Example

### Basic Usage

```python
from agents.sarsa import SarsaAgent
from envs.maze_env import MazeEnv

# Create environment
env = MazeEnv()

# Create SARSA agent
agent = SarsaAgent(
    n_states=env.n_states,
    n_actions=env.n_actions,
    alpha=0.3,
    gamma=0.99,
    epsilon=0.15
)

# Train for 1000 episodes
for episode in range(1000):
    reward, success = agent.run_episode(env, max_steps=200)
    
    if episode % 100 == 0:
        print(f"Episode {episode}: Reward={reward:.2f}, Success={success}")

# Get learned policy
policy = agent.get_policy(env)

# Get performance metrics
metrics = agent.get_metrics_summary(last_n=100)
print(f"Average return: {metrics['avg_return']:.2f}")
print(f"Success rate: {metrics['success_rate']:.2%}")
```

---

## 🐛 Debugging Common Issues

### Issue 1: Agent Never Reaches Goal

**Symptoms:**
- Success rate stays at 0%
- Episode lengths always hit max_steps

**Solutions:**
- Increase epsilon (0.2-0.3) for more exploration
- Increase gamma (0.99) to value distant rewards
- Train longer (2000+ episodes)
- Check maze is solvable

### Issue 2: Training Loss Not Decreasing

**Symptoms:**
- Loss stays high or increases
- TD error not converging

**Solutions:**
- Decrease alpha (0.2) for more stable updates
- Check for numerical instabilities
- Ensure rewards are reasonable (-100 to +100)

### Issue 3: Poor Policy Quality

**Symptoms:**
- Agent reaches goal but takes very long path
- Loops or backtracks frequently

**Solutions:**
- Increase gamma (0.99) to encourage shorter paths
- Train for more episodes (2000+)
- Decrease epsilon after learning starts

---

## 📚 Further Reading

1. **Sutton & Barto Chapter 6.4**: SARSA: On-Policy TD Control
2. **Implementation**: `backend/agents/sarsa.py`
3. **Comparison**: `documentation/ALGORITHM_COMPARISON.md`
4. **Original Paper**: Rummery & Niranjan (1994) - "On-line Q-learning using connectionist systems"

---

## 🎯 Summary

**SARSA is:**
- ✅ On-policy TD learning algorithm
- ✅ Safer and more conservative than Q-Learning
- ✅ Good for stochastic/risky environments
- ✅ Updates after each step using actual next action
- ✅ Converges to policy being followed

**Best for:**
- Learning safe policies
- Environments where exploration is risky
- When you want stable, predictable learning

**Use Q-Learning instead if:**
- You want fastest convergence
- Environment is deterministic
- Optimality is more important than safety

