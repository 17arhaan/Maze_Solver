# 🎓 Hyperparameters Guide for Q-Learning

## 📊 The Three Key Hyperparameters

### 1. **Alpha (α) - Learning Rate**

**What it does:**
- Controls how much the agent updates its Q-values from new experiences
- Range: 0.0 to 1.0

**Formula impact:**
```
Q(s,a) ← Q(s,a) + α × [reward + γ × max Q(s',a') - Q(s,a)]
                    ↑
                    Learning Rate
```

**Low α (e.g., 0.1):**
- ✅ Stable learning, smooth convergence
- ✅ Less affected by random noise
- ❌ Learns slowly
- ❌ Needs more episodes

**High α (e.g., 0.9):**
- ✅ Fast learning, quick adaptation
- ✅ Fewer episodes needed
- ❌ Unstable, jumpy Q-values
- ❌ Might not converge properly

**Optimal for this maze: 0.3 - 0.5**

---

### 2. **Gamma (γ) - Discount Factor**

**What it does:**
- Determines how much the agent values future rewards vs immediate rewards
- Range: 0.0 to 1.0

**Formula impact:**
```
Q(s,a) ← Q(s,a) + α × [reward + γ × max Q(s',a') - Q(s,a)]
                                 ↑
                                 Discount Factor
```

**Low γ (e.g., 0.5):**
- Agent is "short-sighted"
- Only cares about immediate rewards
- ❌ Won't plan long paths to goal
- ❌ Gets stuck in local optima

**High γ (e.g., 0.99):**
- Agent is "far-sighted"
- Values long-term rewards
- ✅ Plans optimal path to goal
- ✅ Better for maze navigation

**Optimal for this maze: 0.95 - 0.99**

---

### 3. **Epsilon (ε) - Exploration Rate**

**What it does:**
- Probability of taking a random action (explore) vs best known action (exploit)
- Range: 0.0 to 1.0

**Epsilon-Greedy Policy:**
```
With probability ε: Choose random action (EXPLORE)
With probability 1-ε: Choose best action (EXPLOIT)
```

**Low ε (e.g., 0.05):**
- Mostly exploitation
- ❌ Might miss better paths
- ❌ Gets stuck in suboptimal policy
- ✅ Good for final testing

**High ε (e.g., 0.5):**
- Mostly exploration
- ✅ Discovers many paths
- ❌ Doesn't exploit good knowledge
- ❌ Takes longer to converge

**Optimal for this maze: 0.1 - 0.2**

---

## 🎯 Recommended Settings for Success

### **For Fast Learning (Fewer Episodes):**
```
Episodes: 500
Alpha (α): 0.5
Gamma (γ): 0.95
Epsilon (ε): 0.15
```
- **Why:** High learning rate speeds up convergence
- **Result:** Quick but might be slightly suboptimal

---

### **For Stable, Optimal Learning:**
```
Episodes: 1000
Alpha (α): 0.3
Gamma (γ): 0.99
Epsilon (ε): 0.1
```
- **Why:** Balanced parameters for consistent optimal policy
- **Result:** Reliable, near-optimal path

---

### **For Guaranteed Success (Conservative):**
```
Episodes: 2000
Alpha (α): 0.2
Gamma (γ): 0.99
Epsilon (ε): 0.1
```
- **Why:** More episodes compensate for slower learning
- **Result:** Very stable, definitely optimal

---

### **For Quick Demo (Risky):**
```
Episodes: 200
Alpha (α): 0.7
Gamma (γ): 0.9
Epsilon (ε): 0.2
```
- **Why:** Aggressive learning for fast results
- **Result:** Might work, might fail - good for experimenting

---

## 🔬 Experiment Guide

### Test 1: **See the effect of Alpha**
- Keep γ=0.99, ε=0.1, episodes=500
- Try α = 0.1, 0.3, 0.5, 0.7, 0.9
- **Observe:** Reward curve smoothness, final success rate

### Test 2: **See the effect of Gamma**
- Keep α=0.3, ε=0.1, episodes=500
- Try γ = 0.5, 0.7, 0.9, 0.95, 0.99
- **Observe:** Path length, does agent reach goal?

### Test 3: **See the effect of Epsilon**
- Keep α=0.3, γ=0.99, episodes=500
- Try ε = 0.0, 0.1, 0.3, 0.5, 0.7
- **Observe:** Learning speed, final policy quality

### Test 4: **See the effect of Episodes**
- Keep α=0.3, γ=0.99, ε=0.1
- Try episodes = 100, 500, 1000, 2000
- **Observe:** Does agent learn? How long does it take?

---

## 📈 What to Look for in Training Logs

### **Good Training:**
```
✅ Success rate increases over time (0% → 80%+)
✅ Average reward improves (negative → positive)
✅ Reward curve trends upward
✅ Agent reaches goal in simulation
✅ Path is reasonably short (< 50 steps)
```

### **Bad Training:**
```
❌ Success rate stays low (< 50%)
❌ Average reward stays negative
❌ Reward curve is flat or chaotic
❌ Agent gets stuck or hits walls
❌ Path is very long or loops
```

---

## 🚨 Common Problems & Solutions

### Problem: **Agent never reaches goal**
**Cause:** Gamma too low or episodes too few
**Solution:** 
- Increase γ to 0.95+
- Increase episodes to 1000+
- Check epsilon isn't too high (> 0.3)

---

### Problem: **Training is unstable (reward jumps around)**
**Cause:** Alpha too high
**Solution:**
- Reduce α to 0.2-0.3
- Increase episodes to compensate

---

### Problem: **Agent takes very long path**
**Cause:** Not enough exploration or episodes
**Solution:**
- Increase ε to 0.15-0.2
- Train for more episodes (1000+)

---

### Problem: **Training takes forever**
**Cause:** This is normal! But can be optimized
**Solution:**
- Reduce episodes (but not below 500)
- Increase α slightly (but not above 0.5)
- Accept that RL needs time to learn

---

### Problem: **Agent gets stuck in loops during simulation**
**Cause:** Incomplete training or bad hyperparameters
**Solution:**
- Train longer (more episodes)
- Use recommended settings above
- Check success rate > 80%

---

## 🎓 Theory: Why These Numbers?

### **Why α = 0.3?**
- **Too low (0.05):** Would need 10,000+ episodes
- **Too high (0.9):** Q-values become unstable
- **Sweet spot (0.3):** Balances speed and stability

### **Why γ = 0.99?**
- Maze has long paths (20-50 steps)
- Need to value distant goal reward
- γ^20 ≈ 0.82 (still significant after 20 steps)
- γ^50 ≈ 0.61 (still motivates long paths)

### **Why ε = 0.1?**
- 90% exploitation (use learned knowledge)
- 10% exploration (discover improvements)
- Enough exploration for 500-1000 episodes
- Not so much that learning is slow

### **Why 500-1000 episodes?**
- 272 states × needs multiple visits each
- ~1000-2000 total visits needed for convergence
- With ε=0.1, takes 500-1000 episodes
- Diminishing returns after 2000 episodes

---

## 🎯 Quick Reference Table

| Goal | Episodes | α | γ | ε | Expected Success Rate |
|------|----------|---|---|---|-----------------------|
| **Quick Demo** | 200 | 0.5 | 0.9 | 0.2 | 60-80% |
| **Reliable** | 500 | 0.3 | 0.99 | 0.1 | 80-95% |
| **Optimal** | 1000 | 0.3 | 0.99 | 0.1 | 90-99% |
| **Guaranteed** | 2000 | 0.2 | 0.99 | 0.1 | 95-100% |
| **Experiment** | 500 | vary | vary | vary | varies |

---

## 🏆 Pro Tips

1. **Start with recommended settings** - Don't experiment on first run
2. **Watch the success rate** - Should reach 70%+ by end
3. **Check the simulation** - Path should be < 50 steps
4. **Use training logs** - Green terminal shows real-time progress
5. **Be patient** - Real learning takes time (even if it's fast)
6. **Experiment boldly** - Try extreme values to see what breaks
7. **Compare policies** - Train twice with different params, compare paths

---

## 📚 Further Reading

- **Sutton & Barto**: "Reinforcement Learning: An Introduction" (Chapter 6: Temporal Difference Learning)
- **DeepMind**: AlphaGo uses similar principles with neural networks
- **Your Code**: Check `backend/agents/q_learning.py` to see the actual implementation!

---

**Remember:** These are guidelines, not rules. Part of RL is experimenting! 🧪

