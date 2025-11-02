import numpy as np

class SarsaAgent:
    def __init__(self, n_states, n_actions, alpha=0.3, gamma=0.99, epsilon=0.15):
        self.n_states = n_states
        self.n_actions = n_actions
        self.alpha = alpha
        self.gamma = gamma
        self.epsilon = epsilon
        self.Q = np.zeros((n_states, n_actions), dtype=float)
        
        # Metrics tracking
        self.td_errors = []
        self.episode_lengths = []
        self.episode_returns = []
        self.discounted_returns = []
        self.training_losses = []  # Mean Squared Bellman Error per episode
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

    def run_episode(self, env, max_steps=200, epsilon=None, exploring_start=False):
        # exploring_start parameter ignored for SARSA (only used by Monte Carlo)
        state = env.reset()
        action = self.select_action(state, epsilon)  # Select first action
        total_reward = 0
        discounted_return = 0
        episode_td_errors = []
        episode_squared_errors = []
        
        for step in range(max_steps):
            # Take action and observe next state and reward
            next_state, reward, done = env.step(state, action)
            
            # Select next action using current policy (on-policy)
            next_action = self.select_action(next_state, epsilon)
            
            # SARSA update: uses Q(s', a') where a' is the actual next action
            td = reward + self.gamma * self.Q[next_state, next_action] - self.Q[state, action]
            
            # Track TD error and squared error (loss)
            episode_td_errors.append(abs(td))
            episode_squared_errors.append(td ** 2)
            
            # Update Q-value
            self.Q[state, action] += self.alpha * td
            
            total_reward += reward
            discounted_return += (self.gamma ** step) * reward
            
            # Move to next state-action pair
            state = next_state
            action = next_action
            
            if done:
                # Record episode metrics
                self.episode_lengths.append(step + 1)
                self.episode_returns.append(total_reward)
                self.discounted_returns.append(discounted_return)
                self.td_errors.extend(episode_td_errors)
                
                # Calculate mean squared error (training loss) for this episode
                episode_loss = float(np.mean(episode_squared_errors))
                self.training_losses.append(episode_loss)
                self.loss_history.append(episode_loss)
                
                self._update_q_value_stats()
                return total_reward, True
                
        # Episode didn't finish
        self.episode_lengths.append(max_steps)
        self.episode_returns.append(total_reward)
        self.discounted_returns.append(discounted_return)
        self.td_errors.extend(episode_td_errors)
        
        # Calculate mean squared error (training loss) for this episode
        episode_loss = float(np.mean(episode_squared_errors)) if len(episode_squared_errors) > 0 else 0.0
        self.training_losses.append(episode_loss)
        self.loss_history.append(episode_loss)
        
        self._update_q_value_stats()
        return total_reward, False
    
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
            'avg_td_error': float(np.mean(self.td_errors[-1000:])) if len(self.td_errors) > 0 else 0.0,
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

