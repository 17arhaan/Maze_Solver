# Performance Metrics Documentation

## Overview

This document describes all performance quantifiers used in the Maze Solver project to showcase agent efficiency and learning progress. These metrics are divided into **Quantitative** (objective, numerical) and **Qualitative** (subjective, visual) categories.

---

## 🔢 Quantitative Metrics

### Core Metrics (Existing)

#### 1. **Success Rate (%)**
- **Formula:** `(Episodes reaching goal / Total episodes) × 100`
- **Type:** Quantitative
- **Range:** 0-100%
- **Tracked:** Real-time during training, final value stored

**Justification:**
- Primary measure of learning effectiveness
- Binary outcome (success/failure) provides clear performance indicator
- Enables direct comparison between Q-Learning, Monte Carlo, and SARSA
- Rising success rate demonstrates convergence
- Industry-standard metric in RL benchmarks

**Usage in Project:**
```python
success_rate = float(success_count / total_episodes)
```

**Interpretation:**
- **0-30%:** Agent is struggling, poor learning
- **30-70%:** Partial learning, needs tuning
- **70-90%:** Good learning, reasonable policy
- **90-100%:** Excellent learning, optimal/near-optimal policy

---

#### 2. **Average Reward (over last 100 episodes)**
- **Formula:** `Σ(total rewards per episode) / 100`
- **Type:** Quantitative
- **Range:** -∞ to +∞ (depends on reward structure)
- **Tracked:** Rolling window average

**Justification:**
- Measures solution quality, not just success
- Detects inefficient paths (high success rate but low reward)
- Smoothed metric for tracking improvement trends
- Validates reward structure design
- Accounts for step penalties and efficiency

**Usage in Project:**
```python
avg_reward = sum(rewards_window[-100:]) / min(len(rewards_window), 100)
```

**Interpretation:**
- Negative values: Agent taking too many steps or hitting walls
- Increasing trend: Agent finding more efficient paths
- Plateau: Convergence to stable policy

---

#### 3. **Training Time (seconds)**
- **Formula:** `End time - Start time`
- **Type:** Quantitative
- **Range:** 0 to ∞ seconds
- **Tracked:** Total training duration

**Justification:**
- Computational efficiency comparison
- Scalability assessment for larger problems
- Algorithm selection criterion (speed vs accuracy trade-off)
- Resource planning for production deployment

**Usage in Project:**
```python
training_duration = end_time - start_time
episodes_per_sec = total_episodes / training_duration
```

**Typical Values:**
- Q-Learning: ~100-300 episodes/sec (fast updates)
- Monte Carlo: ~50-150 episodes/sec (episode-based updates)

---

### New Advanced Metrics (Implemented)

#### 4. **Return (Cumulative Discounted Reward)** ⭐ NEW
- **Formula:** `G_t = Σ(γ^k × r_{t+k})` where γ is discount factor
- **Type:** Quantitative
- **Range:** -∞ to +∞
- **Tracked:** Both discounted and undiscounted returns

**Justification:**
- Standard RL metric from Sutton & Barto textbook
- Measures long-term value of policy
- Discounting emphasizes recent rewards (more relevant)
- Used in policy evaluation and comparison
- Foundation of value-based RL algorithms

**Implementation:**
```python
# Undiscounted
total_return = sum(rewards)

# Discounted
discounted_return = sum([gamma**t * r for t, r in enumerate(rewards)])
```

**Why Both?**
- **Undiscounted:** Easy to interpret, shows raw performance
- **Discounted:** Theoretically correct, matches Q-value calculations

**Tracked Metrics:**
- `avg_return`: Mean undiscounted return (last 100 episodes)
- `avg_discounted_return`: Mean discounted return
- `std_return`: Standard deviation of returns (variance measure)

---

#### 5. **TD Error (Temporal Difference Error)** ⭐ NEW
- **Formula:** `δ_t = r + γ × max(Q(s',a')) - Q(s,a)`
- **Type:** Quantitative  
- **Range:** -∞ to +∞
- **Tracked:** Average absolute TD error

**Justification:**
- **Core of Q-Learning algorithm** - measures prediction accuracy
- Shows how surprised the agent is by outcomes
- Large TD errors indicate poor Q-value estimates
- Used in prioritized experience replay (advanced DQN)
- Convergence indicator: decreasing TD error = learning

**Implementation:**
```python
td_error = reward + gamma * max(Q[next_state]) - Q[state, action]
avg_td_error = mean(abs(td_errors[-1000:]))
```

**Interpretation:**
- **High TD error (>10):** Q-values are inaccurate, still learning
- **Decreasing trend:** Agent improving predictions
- **Low TD error (<1):** Q-values converged, accurate predictions

**Note:** Only applicable to Q-Learning (not Monte Carlo, which doesn't use bootstrapping)

---

#### 6. **Episode Length / Steps to Goal** ⭐ NEW
- **Formula:** `Number of actions taken per episode`
- **Type:** Quantitative
- **Range:** 1 to max_steps
- **Tracked:** Average, minimum per 100 episodes

**Justification:**
- Default metric in OpenAI Gym benchmarks
- Direct measure of path efficiency
- Lower is better (shorter path to goal)
- Independent of reward structure
- Easy to interpret for non-experts

**Implementation:**
```python
episode_length = step_count
avg_episode_length = mean(episode_lengths[-100:])
min_episode_length = min(episode_lengths[-100:])
```

**Interpretation:**
- Decreasing trend: Agent finding shorter paths
- Min value approaching optimal path length: Near-optimal policy
- High values (close to max_steps): Agent wandering/stuck

**Optimal Path:** Can be computed with BFS/Dijkstra for comparison

---

#### 7. **Q-Value Statistics (Mean, Max, Min, Std)** ⭐ NEW
- **Formula:** Statistical measures of Q-table
- **Type:** Quantitative
- **Tracked:** After each episode

**Justification:**
- Used in DQN Nature paper and Rainbow DQN
- Detects Q-value overestimation (common problem)
- Shows value propagation from goal
- Validates learning progress
- Identifies dead states (all zeros) or exploding values

**Implementation:**
```python
q_value_mean = np.mean(Q)
q_value_max = np.max(Q)
q_value_min = np.min(Q)
q_value_std = np.std(Q)
```

**Expected Patterns:**
- **Max Q-value:** Should be at/near goal state
- **Mean increasing:** Values propagating backward from goal
- **Std decreasing:** Values stabilizing/converging
- **Min negative:** States leading away from goal (with penalties)

**Debugging Uses:**
- All zeros: Agent not exploring
- Extreme values (>1000): Numerical instability
- No variance: Poor initialization or learning

---

#### 8. **Return Distribution Percentiles (25th, 50th, 75th)** ⭐ NEW
- **Formula:** Percentile statistics of return distribution
- **Type:** Quantitative
- **Range:** Same as returns
- **Tracked:** Last 100 episodes

**Justification:**
- Used in distributional RL (C51, Rainbow)
- Shows variance in agent performance
- Median (50th) more robust than mean to outliers
- Detects if agent is consistently good or just lucky
- Identifies performance stability

**Implementation:**
```python
return_p25 = np.percentile(returns[-100:], 25)  # 1st quartile
return_p50 = np.percentile(returns[-100:], 50)  # Median
return_p75 = np.percentile(returns[-100:], 75)  # 3rd quartile
```

**Interpretation:**
- **Narrow range (p75-p25 small):** Consistent performance
- **Wide range:** High variance, unstable policy
- **p50 >> p25:** Some bad episodes dragging down average
- **p50 ≈ mean:** Roughly normal distribution

---

## 📊 Qualitative Metrics

### Visual & Interpretive Assessments

#### 1. **Policy Visualization** ✅ Existing
- **Type:** Qualitative
- **Format:** Arrow/direction grid overlay on maze

**Justification:**
- Human-interpretable representation of learned strategy
- Debug tool for detecting irrational behaviors
- Stakeholder communication (non-technical audiences)
- Trust building - see agent's "thinking"
- Failure diagnosis - identify confusion zones

**What to Look For:**
- **Good:** Arrows pointing toward goal, coherent flow
- **Bad:** Contradictory arrows, pointing into walls
- **Stuck:** Circular patterns, no progress toward goal

**Example Interpretation:**
```
→ → ↓       Clear path to goal
↑ ■ ↓       Avoids obstacle
↑ ← ← ↓     May indicate sub-optimal detour
```

---

#### 2. **Learning Curve Visualization** ✅ Existing
- **Type:** Qualitative
- **Format:** Line chart of rewards/success rate over episodes

**Justification:**
- Visual assessment of learning stability
- Convergence detection (plateau indicates done)
- Overfitting detection (sudden drops)
- Hyperparameter tuning guide
- Algorithm characteristic comparison

**Patterns to Identify:**

**Good Learning:**
```
Reward
  |     ___/‾‾‾‾‾‾
  |   _/
  |__/____________ Episodes
```
- Steady improvement, smooth convergence

**Unstable Learning:**
```
Reward
  |  /\/\/\/\/\
  | /  \/  \/
  |/_____________ Episodes
```
- High variance, possibly epsilon too high

**No Learning:**
```
Reward
  |_____________
  |_____________ Episodes
```
- Flat line, check reward structure/exploration

**Overfitting:**
```
Reward
  |    /\
  |   /  \___
  |  /
  |_/____________ Episodes
```
- Peak then decline, too much exploitation

---

#### 3. **Q-Value Heat Map** 🆕 Recommended
- **Type:** Qualitative
- **Format:** Color-coded value function overlay on maze

**Justification:**
- Shows learned value landscape
- Validates value propagation from goal
- Identifies dead zones (unexplored states)
- Beautiful visualization for presentations
- Debugging Q-value issues

**Implementation Approach:**
```python
V = np.max(Q, axis=1)  # State values
V_grid = V.reshape(rows, cols)
plt.imshow(V_grid, cmap='hot')
```

**Expected Pattern:**
- Highest values at goal (red)
- Gradient decreasing with distance (yellow → green → blue)
- Walls should have neutral/negative values
- Dead ends: lower values than main path

---

#### 4. **TD Error Over Time** 🆕 NEW
- **Type:** Qualitative (when visualized)
- **Format:** Line chart of TD error magnitude

**Justification:**
- Visual convergence indicator
- Shows learning rate effectiveness
- Identifies when to stop training (flat TD error)
- Detects destabilization events

**Expected Pattern:**
```
TD Error
  ||\
  || \___
  ||     ‾‾‾‾‾‾  
  ||____________ Episodes
```
- High initially (random Q-values)
- Decreasing trend (learning)
- Stabilizes near zero (convergence)

---

## 📈 Summary Table: All Metrics

| Metric | Type | Category | Tracked | Justification |
|--------|------|----------|---------|---------------|
| Success Rate | Quant | Core | ✅ Yes | Primary learning measure |
| Avg Reward | Quant | Core | ✅ Yes | Solution quality |
| Training Time | Quant | Core | ✅ Yes | Computational efficiency |
| Return (Discounted) | Quant | Advanced | ✅ NEW | RL standard measure |
| TD Error | Quant | Advanced | ✅ NEW | Q-Learning accuracy |
| Episode Length | Quant | Advanced | ✅ NEW | Path efficiency |
| Q-Value Stats | Quant | Advanced | ✅ NEW | Value convergence |
| Return Percentiles | Quant | Advanced | ✅ NEW | Performance stability |
| Policy Visualization | Qual | Core | ✅ Yes | Interpretability |
| Learning Curves | Qual | Core | ✅ Yes | Convergence assessment |
| Q-Value Heat Map | Qual | Advanced | 🔄 Recommended | Value landscape |
| TD Error Plot | Qual | Advanced | ✅ NEW | Convergence tracking |

---

## 🎯 Usage Guidelines

### For Algorithm Comparison (Q-Learning vs Monte Carlo vs SARSA)

**Primary Metrics:**
1. Success Rate - Which succeeds most?
2. Episode Length - Which finds shortest path?
3. Training Time - Which learns fastest?
4. Sample Efficiency (episodes to 90% success) - Which is most data-efficient?

**Secondary Metrics:**
- Return distribution - Which is most stable?
- Q-value statistics - How do value estimates differ?
- Learning curves - Which converges smoother?

---

### For Hyperparameter Tuning

**To Increase Success Rate:**
- Monitor: Success rate, episode length
- Tune: epsilon, alpha, gamma

**To Stabilize Learning:**
- Monitor: Return std, TD error, learning curve smoothness  
- Tune: alpha (learning rate), epsilon decay

**To Speed Up Learning:**
- Monitor: Training time, convergence episode
- Tune: alpha (higher), batch updates, parallel episodes

---

### For Debugging

**Problem: Low Success Rate**
- Check: Policy visualization (irrational actions?)
- Check: Q-value heat map (values propagating?)
- Check: Episode lengths (getting stuck at max?)

**Problem: High Variance**
- Check: Return distribution (wide percentiles?)
- Check: Learning curve (erratic?)
- Fix: Increase averaging window, adjust epsilon

**Problem: Slow Learning**
- Check: Training time, episodes/sec
- Check: TD error (still high after many episodes?)
- Fix: Increase alpha, ensure adequate exploration

---

## 📚 References & Standards

These metrics are based on:

1. **Sutton & Barto (2018)** - "Reinforcement Learning: An Introduction"
   - Return, TD Error, Value Functions

2. **DeepMind DQN Paper (2015)** - Nature 518
   - Q-value statistics, loss tracking

3. **OpenAI Gym Benchmarks**
   - Episode length, success rate, training time

4. **Rainbow DQN (2017)**
   - Distributional metrics, percentiles

5. **Industry Best Practices**
   - Policy visualization, learning curves

---

## 🔮 Future Enhancements

**Potential Additional Metrics:**

1. **Regret:** `Σ(V_optimal - V_policy)` - Requires computing optimal policy
2. **State Coverage:** Percentage of states visited
3. **Action Entropy:** Measure of exploration
4. **Bellman Error:** How well Q satisfies Bellman equation
5. **AUC (Area Under Curve):** Sample efficiency measure

---

## 💡 Conclusion

This metrics suite provides:

✅ **Comprehensive Coverage** - Quantitative proves it works, qualitative explains why  
✅ **Scientific Rigor** - Based on academic and industry standards  
✅ **Practical Utility** - Debugging, tuning, comparison, communication  
✅ **Scalability** - Applies to more complex RL problems  

The combination of 8 quantitative metrics and 4 qualitative visualizations ensures thorough evaluation of agent performance from multiple perspectives.

---

**Last Updated:** October 2025  
**Project:** Maze Solver - Reinforcement Learning Algorithms  
**Algorithms Covered:** Q-Learning, Monte Carlo, SARSA

