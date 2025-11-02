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
        
        # Metrics tracking
        self.episode_lengths = []
        self.episode_returns = []
        self.discounted_returns = []
        self.training_losses = []  # Mean Squared Prediction Error per episode
        self.q_value_history = {
            'mean': [],
            'max': [],
            'min': [],
            'std': []
        }
        self.loss_history = []  # Track loss over episodes

    def select_action(self, state, epsilon=None):
        if epsilon is None:
            epsilon = self.epsilon
        if np.random.rand() < epsilon:
            return np.random.randint(self.n_actions)
        return int(np.argmax(self.Q[state]))

    def generate_episode(self, env, max_steps=200, epsilon=None, exploring_start=True):
        # Use exploring starts: randomly initialize from valid states
        # Bias towards states closer to goal for better exploration
        if exploring_start and np.random.rand() < 0.85:  # 85% chance of exploring start
            # Find valid non-wall states
            valid_states = [s for s in range(env.n_states) if env.grid[s] != 0]
            if len(valid_states) > 0:
                # Calculate distances to goal for weighted sampling
                goal_r, goal_c = env.goal // env.cols, env.goal % env.cols
                distances = []
                for s in valid_states:
                    r, c = s // env.cols, s % env.cols
                    dist = abs(r - goal_r) + abs(c - goal_c)
                    distances.append(dist)
                
                # Use inverse distance as weight (closer = higher prob)
                max_dist = max(distances) + 1
                weights = [max_dist - d for d in distances]
                total_weight = sum(weights)
                probs = [w / total_weight for w in weights]
                
                state = np.random.choice(valid_states, p=probs)
            else:
                state = env.reset()
        else:
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
            return self._first_visit_mc(episode, returns)
        else:
            return self._every_visit_mc(episode, returns)

    def _first_visit_mc(self, episode, returns):
        visited = set()
        episode_squared_errors = []
        for t, (state, action, _) in enumerate(episode):
            state_action = (state, action)
            if state_action not in visited:
                visited.add(state_action)
                old_q = self.Q[state, action]
                self.returns[state][action].append(returns[t])
                self.visit_counts[state, action] += 1
                self.Q[state, action] = np.mean(self.returns[state][action])
                # Calculate squared error (loss) between old and new Q-value
                prediction_error = returns[t] - old_q
                episode_squared_errors.append(prediction_error ** 2)
        return episode_squared_errors

    def _every_visit_mc(self, episode, returns):
        episode_squared_errors = []
        for t, (state, action, _) in enumerate(episode):
            old_q = self.Q[state, action]
            self.returns[state][action].append(returns[t])
            self.visit_counts[state, action] += 1
            self.Q[state, action] = np.mean(self.returns[state][action])
            # Calculate squared error (loss) between old and new Q-value
            prediction_error = returns[t] - old_q
            episode_squared_errors.append(prediction_error ** 2)
        return episode_squared_errors

    def run_episode(self, env, max_steps=200, epsilon=None, exploring_start=True):
        episode, total_reward, success = self.generate_episode(env, max_steps, epsilon, exploring_start)
        returns = self.calculate_returns(episode)
        episode_squared_errors = self.update_q_values(episode, returns)
        
        # Track metrics
        episode_length = len(episode)
        discounted_return = returns[0] if len(returns) > 0 else 0
        
        self.episode_lengths.append(episode_length)
        self.episode_returns.append(total_reward)
        self.discounted_returns.append(discounted_return)
        
        # Calculate mean squared error (training loss) for this episode
        episode_loss = float(np.mean(episode_squared_errors)) if len(episode_squared_errors) > 0 else 0.0
        self.training_losses.append(episode_loss)
        self.loss_history.append(episode_loss)
        
        self._update_q_value_stats()
        
        self.episode_count += 1
        if success:
            self.success_count += 1
        return total_reward, success
    
    def _update_q_value_stats(self):
        """Update Q-value statistics"""
        self.q_value_history['mean'].append(float(np.mean(self.Q)))
        self.q_value_history['max'].append(float(np.max(self.Q)))
        self.q_value_history['min'].append(float(np.min(self.Q)))
        self.q_value_history['std'].append(float(np.std(self.Q)))
    
    def get_metrics_summary(self, last_n=100):
        """Get summary of tracked metrics"""
        if len(self.episode_returns) == 0:
            return {}
        
        return {
            'avg_return': float(np.mean(self.episode_returns[-last_n:])),
            'std_return': float(np.std(self.episode_returns[-last_n:])),
            'avg_discounted_return': float(np.mean(self.discounted_returns[-last_n:])),
            'avg_episode_length': float(np.mean(self.episode_lengths[-last_n:])),
            'min_episode_length': float(np.min(self.episode_lengths[-last_n:])),
            'avg_td_error': 0.0,  # Not applicable for Monte Carlo
            'training_loss': float(np.mean(self.training_losses[-last_n:])) if len(self.training_losses) > 0 else 0.0,
            'final_loss': self.training_losses[-1] if len(self.training_losses) > 0 else 0.0,
            'q_value_mean': self.q_value_history['mean'][-1] if self.q_value_history['mean'] else 0.0,
            'q_value_max': self.q_value_history['max'][-1] if self.q_value_history['max'] else 0.0,
            'q_value_min': self.q_value_history['min'][-1] if self.q_value_history['min'] else 0.0,
            'q_value_std': self.q_value_history['std'][-1] if self.q_value_history['std'] else 0.0,
            'return_p25': float(np.percentile(self.episode_returns[-last_n:], 25)),
            'return_p50': float(np.percentile(self.episode_returns[-last_n:], 50)),
            'return_p75': float(np.percentile(self.episode_returns[-last_n:], 75)),
        }

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
        
        # Reset metrics
        self.episode_lengths = []
        self.episode_returns = []
        self.discounted_returns = []
        self.training_losses = []
        self.q_value_history = {
            'mean': [],
            'max': [],
            'min': [],
            'std': []
        }
        self.loss_history = []


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
