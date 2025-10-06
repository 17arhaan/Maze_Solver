# 📚 Maze Solver - Documentation

Comprehensive documentation for the Maze Solver reinforcement learning project.

---

## 📖 Available Documentation

### **1. [Maze Generation Algorithm](./MAZE_GENERATION_ALGORITHM.md)**
Complete guide to how random mazes are generated, including:
- Recursive Backtracking algorithm explanation
- Step-by-step visual examples
- Difficulty control mechanisms
- BFS path validation
- Code implementation details
- Mathematical analysis
- Educational applications

**Topics covered:**
- 🏗️ How the algorithm works
- 🎯 Difficulty classification (Easy/Medium/Hard)
- 🔄 Cycling system
- 📊 Path length calculation
- 🧪 Testing and validation
- 🎓 Educational use cases

---

## 🎯 Quick Links

### **Algorithm Documentation**
- [Recursive Backtracking Explained](./MAZE_GENERATION_ALGORITHM.md#algorithm-recursive-backtracking)
- [Step-by-Step Process](./MAZE_GENERATION_ALGORITHM.md#step-by-step-process)
- [Difficulty Control](./MAZE_GENERATION_ALGORITHM.md#difficulty-control)
- [Visual Examples](./MAZE_GENERATION_ALGORITHM.md#visual-examples)

### **Project Documentation**
- [Main README](../readme.md) - Project overview and RL algorithms
- [Setup Instructions](../SETUP_INSTRUCTIONS.md) - How to run the project
- [Integration Changes](../INTEGRATION_CHANGES.md) - Frontend-Backend connection

---

## 🧠 Reinforcement Learning Algorithms

The project implements three core RL algorithms:

### **1. Monte Carlo (MC)**
- Learns from complete episodes
- No bootstrapping
- High variance, unbiased

### **2. SARSA (On-Policy TD)**
- Temporal Difference learning
- Follows current policy
- Safer in stochastic environments

### **3. Q-Learning (Off-Policy TD)** ⭐
- Currently implemented
- Learns optimal policy
- Fast convergence

**For RL theory:** See [main README](../readme.md)

---

## 🎮 Features

- ✅ Real-time training visualization
- ✅ Interactive maze environment
- ✅ Random maze generation (Easy/Medium/Hard)
- ✅ Policy simulation with animations
- ✅ Success/failure detection
- ✅ Intelligent hyperparameter suggestions
- ✅ Training logs and metrics

---

## 🏗️ Architecture

```
Maze Solver/
├── frontend/          # Next.js React app
│   ├── app/
│   │   ├── page.tsx   # Main UI with maze generator
│   │   └── layout.tsx
│   └── components/    # UI components
│
├── backend/           # FastAPI Python server
│   ├── app.py         # API endpoints
│   ├── envs/
│   │   └── maze_env.py  # MDP environment
│   └── agents/
│       └── q_learning.py # Q-Learning agent
│
└── documentation/     # Project documentation
    ├── README.md      # This file
    └── MAZE_GENERATION_ALGORITHM.md
```

---

## 🔬 Technical Specifications

### **Maze Environment**
- **Grid Size:** 16 rows × 17 columns (272 states)
- **Start Position:** (0, 1) - Top-left area
- **Goal Position:** (15, 15) - Bottom-right
- **Actions:** 4 (Up, Down, Left, Right)
- **Encoding:** 0=wall, 1=path, 2=start, 3=goal

### **Rewards**
- **+10** - Reach goal
- **-1** - Each step (encourages efficiency)
- **-5** - Hit wall (discourages invalid moves)

### **Q-Learning Parameters**
- **Alpha (α):** Learning rate (0.01 - 1.0)
- **Gamma (γ):** Discount factor (0.5 - 1.0)
- **Epsilon (ε):** Exploration rate (0.0 - 1.0)
- **Episodes:** Training iterations (1 - 10,000)

---

## 🎓 For Students and Researchers

### **Experiment Ideas**

1. **Maze Complexity Study**
   - Compare learning curves across Easy/Medium/Hard mazes
   - Measure episodes needed for 90% success rate
   - Analyze optimal path discovery

2. **Hyperparameter Optimization**
   - Grid search over α, γ, ε
   - Plot success rate vs parameters
   - Find optimal settings per difficulty

3. **Algorithm Comparison**
   - Implement Monte Carlo and SARSA
   - Compare convergence speed
   - Analyze sample efficiency

4. **Generalization Testing**
   - Train on multiple random mazes
   - Test transfer learning
   - Measure policy robustness

---

## 📊 Key Metrics

**Training Metrics:**
- Episode count
- Average reward per episode
- Success rate (% reaching goal)
- Convergence speed

**Policy Metrics:**
- Path length (steps to goal)
- Optimality (vs shortest path)
- Robustness (success on new mazes)
- Exploration coverage (states visited)

---

## 🔗 Related Resources

### **External Resources**
- [Sutton & Barto - RL Book](http://incompleteideas.net/book/the-book-2nd.html)
- [OpenAI Gym](https://gymnasium.farama.org/)
- [Maze Generation Algorithms](http://weblog.jamisbuck.org/2011/2/7/maze-generation-algorithm-recap)

### **Project Files**
- `backend/agents/q_learning.py` - Q-Learning implementation
- `backend/envs/maze_env.py` - MDP environment
- `frontend/app/page.tsx` - UI with maze generator

---

## 👥 Authors

**Arhaan Girdhar** - 220962050  
**Anbar Althaf** - 220962051

*CSE 4478 – Reinforcement Learning*  
Department of Computer Science and Engineering (AI & ML)

---

## 📜 License

MIT License - Free for academic and research use

---

**Last Updated:** October 2025  
**Version:** 1.0

