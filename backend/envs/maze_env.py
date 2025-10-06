import numpy as np

# Simple grid maze environment. Cells encoded as:
# 0 = empty, 1 = wall, 2 = start, 3 = goal
class MazeEnv:
    def __init__(self, grid_flat=None, rows=9, cols=13):
        self.rows = rows
        self.cols = cols
        if grid_flat is None:
            # default demo map (same shape as frontend default)
            self.grid = np.zeros(rows * cols, dtype=int)
            # border walls
            for r in range(rows):
                for c in range(cols):
                    if r == 0 or r == rows - 1 or c == 0 or c == cols - 1:
                        self.grid[r * cols + c] = 1
            walls = [
                (2, 3), (2, 4), (2, 5), (3, 5), (4, 5), (5, 5), (6, 5), (6, 6), (6, 7), (4, 9), (3, 9), (2, 9), (5, 2)
            ]
            for (r, c) in walls:
                self.grid[r * cols + c] = 1
            self.grid[1 * cols + 1] = 2
            self.grid[(rows - 2) * cols + (cols - 2)] = 3
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
        if self.grid[next_idx] == 1:
            return state, -5, False
        if self.grid[next_idx] == 3:
            return next_idx, 10, True
        return next_idx, -1, False
