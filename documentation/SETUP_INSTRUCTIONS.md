# Maze Solver - Setup & Run Instructions

## 🚀 Quick Start

### Backend Setup (Python FastAPI)

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Activate virtual environment:**
   ```bash
   source venv/bin/activate
   ```

3. **Install dependencies (if not already installed):**
   ```bash
   pip install -r requirements.txt
   ```

4. **Start the backend server:**
   ```bash
   uvicorn app:app --reload --host 0.0.0.0 --port 8000
   ```

   The backend will be running at: `http://localhost:8000`
   - API docs available at: `http://localhost:8000/docs`

---

### Frontend Setup (Next.js)

1. **Open a new terminal and navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies (if not already installed):**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Start the development server:**
   ```bash
   pnpm dev
   # or
   npm run dev
   ```

   The frontend will be running at: `http://localhost:3000`

---

## 🎮 How to Use

1. **Open your browser** and go to `http://localhost:3000`

2. **Select an algorithm:**
   - Monte Carlo
   - SARSA
   - Q-Learning (default)

3. **Configure hyperparameters:**
   - **Episodes**: Number of training episodes (default: 500)
   - **Alpha (α)**: Learning rate (default: 0.1)
   - **Gamma (γ)**: Discount factor (default: 0.9)
   - **Epsilon (ε)**: Exploration rate (default: 0.1)

4. **Click "Start Training"** to begin the RL agent training

5. **Watch the progress:**
   - Real-time episode counter
   - Training status updates
   - Reward curve visualization
   - Learned policy with directional arrows (shown faintly)

6. **Simulate the learned policy:**
   - Click the green "Simulate Policy" button after training completes
   - Watch the agent (blue box) navigate through the maze
   - Yellow boxes show the trail left behind as the agent moves
   - See how many steps it took to reach the goal!

7. **Reset** to clear and start a new training session

---

## 🔧 API Endpoints

### Backend (http://localhost:8000)

- **GET /** - Welcome page
- **POST /train** - Start training with parameters
- **GET /status/{job_id}** - Get training progress and status
- **GET /policy/{job_id}** - Get learned policy and Q-table
- **POST /reset** - Clear all training jobs
- **GET /docs** - Interactive API documentation (Swagger UI)

---

## 📊 Maze Configuration

- **Grid Size**: 16 rows × 17 columns
- **Start Position**: (0, 1) - Blue cell
- **Goal Position**: (15, 15) - Red cell
- **Encoding**: 
  - 0 = Wall (black)
  - 1 = Path (white)
  - 2 = Start (blue, internally)
  - 3 = Goal (red, internally)

---

## 🐛 Troubleshooting

### Backend Issues:

**Port already in use:**
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9
```

**CORS errors:**
- Ensure frontend runs on port 3000
- Check CORS middleware in `backend/app.py`

### Frontend Issues:

**Cannot connect to backend:**
- Verify backend is running on `http://localhost:8000`
- Check browser console for error messages
- Ensure CORS is enabled in backend

**Port 3000 already in use:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

---

## 📦 Tech Stack

**Backend:**
- FastAPI - Modern Python web framework
- NumPy - Numerical computing
- Uvicorn - ASGI server

**Frontend:**
- Next.js 15 - React framework
- TypeScript - Type safety
- Tailwind CSS - Styling
- shadcn/ui - Component library

---

## 👥 Authors

- **Arhaan Girdhar** - 220962050
- **Anbar Althaf** - 220962051

*CSE 4478 – Reinforcement Learning*  
Department of Computer Science and Engineering (AI & ML)

---

## 📄 License

MIT License - Free for academic and research use

