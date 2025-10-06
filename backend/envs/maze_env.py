import numpy as np

# Simple grid maze environment. Cells encoded as:
# 0 = wall, 1 = empty path, 2 = start, 3 = goal
class MazeEnv:
    def __init__(self, grid_flat=None, rows=16, cols=17):
        self.rows = rows
        self.cols = cols
        if grid_flat is None:
            # default 16x17 maze matching frontend
            # Frontend encoding: 0=wall, 1=path
            # Backend internal: 0=wall, 1=path, 2=start, 3=goal
            self.grid = np.array([
                [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0],
                [0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0],
                [0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0],
                [0, 1, 1, 1, 0, 1, 0, 0, 0, 1, 1, 1, 0, 1, 1, 1, 0],
                [0, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0],
                [0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 1, 1, 1, 1, 0, 1, 0],
                [0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 0],
                [0, 1, 1, 1, 0, 1, 0, 0, 0, 1, 0, 1, 1, 1, 1, 1, 0],
                [0, 0, 0, 0, 0, 1, 1, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0],
                [0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0],
                [0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0],
                [0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0],
                [0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0],
                [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
            ], dtype=int).flatten()
            
            # Set start at (0, 1) and goal at (15, 15)
            self.grid[0 * cols + 1] = 2  # start
            self.grid[15 * cols + 15] = 3  # goal
        else:
            assert len(grid_flat) == rows * cols, "grid_flat length mismatch"
            self.grid = np.array(grid_flat, dtype=int)
        # find start and goal
        starts = np.where(self.grid == 2)[0]
        goals = np.where(self.grid == 3)[0]
        if len(starts) == 0 or len(goals) == 0:
            raise ValueError('grid must contain start (2) and goal (3)')
        self.start = int(starts[0])
        self.goal = int(goals[0])
        self.n_states = rows * cols
        self.n_actions = 4

    def reset(self):
        self.agent_pos = int(self.start)
        return int(self.agent_pos)

    def step(self, state, action):
        r = state // self.cols
        c = state % self.cols
        nr, nc = r, c
        # actions: 0 up, 1 down, 2 left, 3 right
        if action == 0:
            nr -= 1
        elif action == 1:
            nr += 1
        elif action == 2:
            nc -= 1
        else:
            nc += 1
        # bounds check
        if nr < 0 or nr >= self.rows or nc < 0 or nc >= self.cols:
            return state, -5, False
        next_idx = nr * self.cols + nc
        # Check if it's a wall (0)
        if self.grid[next_idx] == 0:
            return state, -5, False
        # Check if it's the goal (3)
        if self.grid[next_idx] == 3:
            return next_idx, 10, True
        # Otherwise it's a valid path (1 or 2)
        return next_idx, -1, False
