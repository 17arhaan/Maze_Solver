import numpy as np
from collections import defaultdict

class MonteCarloAgent:
    def __init__(self, n_states, n_actions, gamma=0.99, epsilon=0.15, method='first_visit', optimistic_init=0.0):
        self.n_states = n_states
        self.n_actions = n_actions
        self.gamma = gamma
        self.epsilon = epsilon
        self.epsilon_initial = epsilon
        self.method = method
        
        self.Q = np.full((n_states, n_actions), optimistic_init, dtype=float)
        self.returns = defaultdict(lambda: defaultdict(list))
        self.visit_counts = np.zeros((n_states, n_actions), dtype=int)
        self.policy = np.zeros(n_states, dtype=int)
        self.episode_count = 0
        self.success_count = 0

    def select_action(self, state, epsilon=None):
        if epsilon is None:
            epsilon = self.epsilon
        if np.random.rand() < epsilon:
            return np.random.randint(self.n_actions)
        return int(np.argmax(self.Q[state]))

    def generate_episode(self, env, max_steps=200, epsilon=None):
        state = env.reset()
        episode = []
        total_reward = 0
        
        for step in range(max_steps):
            action = self.select_action(state, epsilon)
            next_state, reward, done = env.step(state, action)
            episode.append((state, action, reward))
            total_reward += reward
            state = next_state
            if done:
                return episode, total_reward, True
        return episode, total_reward, False

    def calculate_returns(self, episode):
        G = 0
        returns = []
        for t in reversed(range(len(episode))):
            state, action, reward = episode[t]
            G = reward + self.gamma * G
            returns.insert(0, G)
        return returns

    def update_q_values(self, episode, returns):
        if self.method == 'first_visit':
            self._first_visit_mc(episode, returns)
        else:
            self._every_visit_mc(episode, returns)

    def _first_visit_mc(self, episode, returns):
        visited = set()
        for t, (state, action, _) in enumerate(episode):
            state_action = (state, action)
            if state_action not in visited:
                visited.add(state_action)
                self.returns[state][action].append(returns[t])
                self.visit_counts[state, action] += 1
                self.Q[state, action] = np.mean(self.returns[state][action])

    def _every_visit_mc(self, episode, returns):
        for t, (state, action, _) in enumerate(episode):
            self.returns[state][action].append(returns[t])
            self.visit_counts[state, action] += 1
            self.Q[state, action] = np.mean(self.returns[state][action])

    def run_episode(self, env, max_steps=200, epsilon=None):
        episode, total_reward, success = self.generate_episode(env, max_steps, epsilon)
        returns = self.calculate_returns(episode)
        self.update_q_values(episode, returns)
        self.episode_count += 1
        if success:
            self.success_count += 1
        return total_reward, success

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

    def get_statistics(self):
        total_returns = sum(len(returns) for state_returns in self.returns.values() 
                          for returns in state_returns.values())
        return {
            'episode_count': self.episode_count,
            'total_returns': total_returns,
            'method': self.method,
            'q_table_size': self.Q.size,
            'non_zero_q_values': np.count_nonzero(self.Q)
        }

    def decay_epsilon(self, decay_rate=0.995, min_epsilon=0.01):
        self.epsilon = max(min_epsilon, self.epsilon * decay_rate)

    def reset(self):
        self.Q = np.zeros((self.n_states, self.n_actions), dtype=float)
        self.returns = defaultdict(lambda: defaultdict(list))
        self.visit_counts = np.zeros((self.n_states, self.n_actions), dtype=int)
        self.policy = np.zeros(self.n_states, dtype=int)
        self.episode_count = 0
        self.success_count = 0


class MonteCarloESAgent(MonteCarloAgent):
    def __init__(self, n_states, n_actions, gamma=0.99, epsilon=0.15, method='first_visit'):
        super().__init__(n_states, n_actions, gamma, epsilon, method)
        self.visited_state_actions = set()

    def select_action(self, state, epsilon=None):
        if epsilon is None:
            epsilon = self.epsilon
        if state not in [s for s, _ in self.visited_state_actions]:
            action = np.random.randint(self.n_actions)
            self.visited_state_actions.add((state, action))
            return action
        if np.random.rand() < epsilon:
            return np.random.randint(self.n_actions)
        return int(np.argmax(self.Q[state]))

    def reset(self):
        super().reset()
        self.visited_state_actions = set()
