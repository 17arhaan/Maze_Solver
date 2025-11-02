# Monte Carlo Algorithm Implementation

## ✅ Follows Sutton & Barto's First-Visit MC Algorithm

This implementation **exactly follows** the textbook algorithm from "Reinforcement Learning: An Introduction" by Sutton & Barto.

---

## 📖 Textbook Algorithm (from your slides)

### First-Visit MC Prediction for estimating V ≈ v_π

```
Input: a policy π to be evaluated
Initialize:
    V(s) ∈ ℝ, arbitrarily, for all s ∈ S
    Returns(s) ← an empty list, for all s ∈ S

Loop forever (for each episode):
    Generate an episode following π: S₀, A₀, R₁, S₁, A₁, R₂, ..., S_{T-1}, A_{T-1}, R_T
    G ← 0
    Loop for each step of episode, t = T-1, T-2, ..., 0:
        G ← γG + R_{t+1}
        Unless S_t appears in S₀, S₁, ..., S_{t-1}:
            Append G to Returns(S_t)
            V(S_t) ← average(Returns(S_t))
```

---

## 💻 Our Implementation (Adapted for Q-Values)

### Key Difference: V-values vs Q-values

The textbook algorithm learns **V(s)** - state values.  
Our implementation learns **Q(s,a)** - action-values.

**Mapping:**
- V(s) → Q(s,a) - We track state-action pairs instead of just states
- Returns(s) → Returns(s,a) - Each (state, action) pair has its own return list

This is the standard adaptation for **Monte Carlo Control** (learning optimal policy) vs **Monte Carlo Prediction** (evaluating a given policy).

---

## 📝 Line-by-Line Mapping

### Step 1: Generate Episode

**Textbook:**
```
Generate an episode following π: S₀, A₀, R₁, S₁, A₁, R₂, ..., S_{T-1}, A_{T-1}, R_T
```

**Our Code:**
```python
def generate_episode(self, env, max_steps=200, epsilon=None, exploring_start=True):
    state = env.reset()
    episode = []
    total_reward = 0
    
    for step in range(max_steps):
        action = self.select_action(state, epsilon)
        next_state, reward, done = env.step(state, action)
        episode.append((state, action, reward))  # Store (S_t, A_t, R_t)
        total_reward += reward
        state = next_state
        if done:
            return episode, total_reward, True
    return episode, total_reward, False
```

✅ **Matches**: Generates complete episode trajectory

---

### Step 2: Calculate Returns (Backward)

**Textbook:**
```
G ← 0
Loop for each step of episode, t = T-1, T-2, ..., 0:
    G ← γG + R_{t+1}
```

**Our Code:**
```python
def calculate_returns(self, episode):
    """
    Calculate returns G_t for each step in the episode.
    Uses backward iteration: G ← γG + R_{t+1}
    """
    G = 0
    returns = []
    for t in reversed(range(len(episode))):  # t = T-1, T-2, ..., 0
        state, action, reward = episode[t]
        G = reward + self.gamma * G  # G ← γG + R_{t+1}
        returns.insert(0, G)
    return returns
```

✅ **Exactly matches**: Same backward iteration, same formula

**Example:**
```
Episode: [(s0,a0,-1), (s1,a1,-1), (s2,a2,-1), (s3,a3,+10)]
γ = 0.99

Step 3 (goal):  G = 10
Step 2:         G = -1 + 0.99*10 = 8.9
Step 1:         G = -1 + 0.99*8.9 = 7.81
Step 0:         G = -1 + 0.99*7.81 = 6.73

Returns = [6.73, 7.81, 8.9, 10]
```

---

### Step 3: Update Values (First-Visit Only)

**Textbook:**
```
Unless S_t appears in S₀, S₁, ..., S_{t-1}:
    Append G to Returns(S_t)
    V(S_t) ← average(Returns(S_t))
```

**Our Code:**
```python
def _first_visit_mc(self, episode, returns):
    visited = set()  # Track which (state, action) pairs we've seen
    
    for t, (state, action, _) in enumerate(episode):
        state_action = (state, action)
        # "Unless S_t appears in S₀, S₁, ..., S_{t-1}"
        if state_action not in visited:
            visited.add(state_action)
            # "Append G to Returns(S_t)"
            self.returns[state][action].append(returns[t])
            # "V(S_t) ← average(Returns(S_t))"
            self.Q[state, action] = np.mean(self.returns[state][action])
```

✅ **Exactly matches**: Same "first-visit" check, same averaging

---

### Step 4: Every-Visit MC (Alternative Method)

**Not in slides, but implemented for completeness**

**Our Code:**
```python
def _every_visit_mc(self, episode, returns):
    """
    Every-Visit: NO "first-visit" check.
    Updates EVERY occurrence of (state, action).
    """
    for t, (state, action, _) in enumerate(episode):
        # No visited check - update every time
        self.returns[state][action].append(returns[t])
        self.Q[state, action] = np.mean(self.returns[state][action])
```

✅ **Follows convention**: Standard Every-Visit MC implementation

---

## 🎯 First-Visit vs Every-Visit Example (from your slides)

### Scenario:
- Episode visits **State X** twice
- First time (step 5): Return from that point = +45
- Second time (step 15): Return from that point = +20

### First-Visit MC:
```python
visited = set()
# Step 5: State X, return +45
if ('X', action) not in visited:
    visited.add(('X', action))
    Returns[('X', action)].append(45)  # ✅ Records +45

# Step 15: State X again, return +20
if ('X', action) not in visited:
    # ❌ Already in visited, SKIP this occurrence
    pass

# Result: Returns[('X', action)] = [45]
# Q('X', action) = average([45]) = 45
```

### Every-Visit MC:
```python
# Step 5: State X, return +45
Returns[('X', action)].append(45)  # ✅ Records +45

# Step 15: State X again, return +20
Returns[('X', action)].append(20)  # ✅ Records +20

# Result: Returns[('X', action)] = [45, 20]
# Q('X', action) = average([45, 20]) = 32.5
```

---

## 🔄 Complete Algorithm Flow

### Main Training Loop

```python
def run_episode(self, env, max_steps=200, epsilon=None, exploring_start=True):
    # 1. Generate episode
    episode, total_reward, success = self.generate_episode(env, max_steps, epsilon, exploring_start)
    
    # 2. Calculate returns (backward)
    returns = self.calculate_returns(episode)
    
    # 3. Update Q-values (first-visit or every-visit)
    episode_squared_errors = self.update_q_values(episode, returns)
    
    # 4. Track metrics
    self.episode_lengths.append(len(episode))
    self.episode_returns.append(total_reward)
    self.discounted_returns.append(returns[0])
    
    return total_reward, success
```

---

## ✅ Verification: Implementation is Correct

### Checklist:

- [x] **Episode Generation**: Generates complete trajectories ✅
- [x] **Return Calculation**: Backward iteration with G ← γG + R_{t+1} ✅
- [x] **First-Visit Check**: Uses `visited` set to skip duplicate states ✅
- [x] **Averaging**: Q(s,a) ← average(Returns(s,a)) ✅
- [x] **Every-Visit Option**: Removes first-visit check ✅

---

## 📊 Convergence Properties

### First-Visit MC:
- **Unbiased estimate**: Each return is independent sample
- **Variance**: Medium (fewer samples per state)
- **Converges to**: True Q^π(s,a) under policy π
- **Guarantee**: Law of large numbers applies

### Every-Visit MC:
- **Biased estimate** (slightly): Returns in same episode are correlated
- **Variance**: Lower (more samples per state)
- **Converges to**: True Q^π(s,a) under policy π
- **Practical**: Often faster convergence despite bias

---

## 🎓 Theoretical Foundation

### Why This Works:

1. **Monte Carlo Property**: Learn from complete returns (no bootstrapping)
   ```
   Q^π(s,a) = E_π[G_t | S_t=s, A_t=a]
   ```

2. **Law of Large Numbers**: Average of samples converges to expectation
   ```
   Q(s,a) = average(Returns(s,a)) → E[G_t] = Q^π(s,a)
   ```

3. **Unbiased (First-Visit)**: Each episode provides independent sample of G_t

4. **On-Policy**: Learns value of the policy it's following

---

## 🧪 Testing the Implementation

### Verify First-Visit Behavior:

```python
from agents.monte_carlo import MonteCarloAgent
from envs.maze_env import MazeEnv

env = MazeEnv()
agent = MonteCarloAgent(
    env.n_states, 
    env.n_actions, 
    gamma=0.99, 
    epsilon=0.3,
    method='first_visit'  # ← Use first-visit
)

# Train
for ep in range(1000):
    agent.run_episode(env, max_steps=200)

# Check Q-values
print(f"Q-value at start state: {agent.Q[env.start]}")
print(f"Visit counts: {agent.visit_counts[env.start]}")
```

### Verify Every-Visit Behavior:

```python
agent_every = MonteCarloAgent(
    env.n_states, 
    env.n_actions, 
    gamma=0.99, 
    epsilon=0.3,
    method='every_visit'  # ← Use every-visit
)

# Should have higher visit counts for frequently revisited states
```

---

## 📚 References

1. **Sutton & Barto (2018)**: "Reinforcement Learning: An Introduction"
   - Chapter 5: Monte Carlo Methods
   - Section 5.1: Monte Carlo Prediction
   - Section 5.3: Monte Carlo Control

2. **Your Slides**: First-Visit vs Every-Visit explanation (Solitaire example)

3. **Implementation**: `backend/agents/monte_carlo.py`

---

## 🎯 Summary

✅ **Our implementation EXACTLY follows the textbook algorithm**

The only difference is:
- Textbook: Learns V(s) - state values
- Our code: Learns Q(s,a) - action-values

This is the **standard adaptation** for Monte Carlo Control (finding optimal policy) vs Monte Carlo Prediction (evaluating a policy).

The core algorithm structure—episode generation, backward return calculation, first-visit checking, and averaging—is **identical** to Sutton & Barto's pseudocode.


