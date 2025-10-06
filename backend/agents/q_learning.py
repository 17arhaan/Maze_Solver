import numpy as np

class QLearningAgent:
    def __init__(self, n_states, n_actions, alpha=0.3, gamma=0.99, epsilon=0.15):
        self.n_states = n_states
        self.n_actions = n_actions
        self.alpha = alpha
        self.gamma = gamma
        self.epsilon = epsilon
        self.Q = np.zeros((n_states, n_actions), dtype=float)

    def select_action(self, state, epsilon=None):
        if epsilon is None:
            epsilon = self.epsilon
        if np.random.rand() < epsilon:
            return np.random.randint(self.n_actions)
        return int(np.argmax(self.Q[state]))

    def run_episode(self, env, max_steps=200, epsilon=None):
        state = env.reset()
        total_reward = 0
        for step in range(max_steps):
            action = self.select_action(state, epsilon)
            next_state, reward, done = env.step(state, action)
            best_next = np.max(self.Q[next_state])
            td = reward + self.gamma * best_next - self.Q[state, action]
            self.Q[state, action] += self.alpha * td
            total_reward += reward
            state = next_state
            if done:
                return total_reward, True
        return total_reward, False

    def get_policy(self, env):
        policy = []
        for s in range(env.n_states):
            if env.grid[s] == 0:
                policy.append(None)
            elif env.grid[s] == 3:
                policy.append(None)
            else:
                policy.append(int(np.argmax(self.Q[s])))
        return policy
