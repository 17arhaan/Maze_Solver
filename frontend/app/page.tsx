"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Loader2, Play, RotateCcw, TrendingUp } from "lucide-react"

type Algorithm = "monte_carlo" | "sarsa" | "q_learning"

interface BackendStatus {
  status: "queued" | "running" | "finished" | "error"
  progress: number
  episode: number
  episodes: number
  avg_reward: number | null
  success_rate: number | null
  policy: (number | null)[] | null
  q_table: number[][] | null
  logs: number[]
}

interface TrainingStatus {
  status: "idle" | "training" | "completed" | "error"
  episode?: number
  total_episodes?: number
  message?: string
  policy?: (number | null)[][]
  rewards?: number[]
}

export default function MazeSolver() {
  const [algorithm, setAlgorithm] = useState<Algorithm>("q_learning")
  const [episodes, setEpisodes] = useState(500)
  const [alpha, setAlpha] = useState(0.1)
  const [gamma, setGamma] = useState(0.9)
  const [epsilon, setEpsilon] = useState(0.1)
  const [trainingStatus, setTrainingStatus] = useState<TrainingStatus>({ status: "idle" })
  const [isPolling, setIsPolling] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)
  const [maze, setMaze] = useState<number[][]>([])
  const [agentPath, setAgentPath] = useState<[number, number][]>([])
  const [agentPosition, setAgentPosition] = useState<[number, number] | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [goalReached, setGoalReached] = useState(false)
  const [simulationFailed, setSimulationFailed] = useState(false)
  const [failureReason, setFailureReason] = useState<string>("")
  const [trainingLogs, setTrainingLogs] = useState<string[]>([])
  const [validationErrors, setValidationErrors] = useState({
    episodes: false,
    alpha: false,
    gamma: false,
    epsilon: false
  })

  useEffect(() => {
    const initialMaze = [
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
    ]

    setMaze(initialMaze)
  }, [])

  const startTraining = async () => {
    // Validate inputs
    const errors = {
      episodes: episodes < 1 || episodes > 10000,
      alpha: alpha < 0.01 || alpha > 1.0,
      gamma: gamma < 0.5 || gamma > 1.0,
      epsilon: epsilon < 0.0 || epsilon > 1.0
    }
    
    setValidationErrors(errors)
    
    // If any validation error, don't start training
    if (errors.episodes || errors.alpha || errors.gamma || errors.epsilon) {
      setTrainingLogs(prev => [...prev, `❌ Invalid hyperparameters - please check highlighted fields`])
      return
    }
    
    try {
      setTrainingStatus({ status: "training" })
      setIsPolling(true)
      setTrainingLogs([])
      
      // Add initial log
      setTrainingLogs(prev => [...prev, `🚀 Starting training with ${algorithm}...`])
      setTrainingLogs(prev => [...prev, `📊 Episodes: ${episodes}, α: ${alpha}, γ: ${gamma}, ε: ${epsilon}`])

      const response = await fetch("http://localhost:8000/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          algorithm,
          episodes,
          alpha,
          gamma,
          epsilon,
          max_steps: 200,
        }),
      })

      if (!response.ok) throw new Error("Training failed to start")
      
      const data = await response.json()
      setJobId(data.job_id)
      setTrainingLogs(prev => [...prev, `✅ Training job started (ID: ${data.job_id.substring(0, 8)}...)`])
    } catch (error) {
      setTrainingStatus({ status: "error", message: "Failed to connect to backend" })
      setIsPolling(false)
      setTrainingLogs(prev => [...prev, `❌ Error: Failed to connect to backend`])
    }
  }

  const checkStatus = async () => {
    if (!jobId) return
    
    try {
      const response = await fetch(`http://localhost:8000/status/${jobId}`)
      const data: BackendStatus = await response.json()
      
      // Add training logs at milestones
      const progress = data.progress
      if (progress === 25 || progress === 50 || progress === 75) {
        setTrainingLogs(prev => {
          const lastLog = prev[prev.length - 1]
          if (!lastLog?.includes(`${progress}%`)) {
            return [...prev, `⏳ Progress: ${progress}% (Episode ${data.episode}/${data.episodes})`]
          }
          return prev
        })
      }
      
      if (data.avg_reward !== null && data.episode % 100 === 0) {
        setTrainingLogs(prev => {
          const lastLog = prev[prev.length - 1]
          if (!lastLog?.includes(`Episode ${data.episode}`)) {
            const successRate = data.success_rate !== null ? (data.success_rate * 100).toFixed(1) : '0.0'
            const avgReward = data.avg_reward !== null ? data.avg_reward.toFixed(2) : '0.00'
            return [...prev, `📈 Episode ${data.episode}: Avg Reward = ${avgReward}, Success Rate = ${successRate}%`]
          }
          return prev
        })
      }
      
      // Convert backend status to frontend format
      const frontendStatus: TrainingStatus = {
        status: data.status === "finished" ? "completed" : 
                data.status === "running" || data.status === "queued" ? "training" : 
                data.status === "error" ? "error" : "idle",
        episode: data.episode,
        total_episodes: data.episodes,
        rewards: data.logs,
      }
      
      // Convert flattened policy to 2D grid
      if (data.policy && data.status === "finished") {
        const policy2D: (number | null)[][] = []
        for (let r = 0; r < 16; r++) {
          const row: (number | null)[] = []
          for (let c = 0; c < 17; c++) {
            row.push(data.policy[r * 17 + c])
          }
          policy2D.push(row)
        }
        frontendStatus.policy = policy2D
        
        // Add completion log
        const finalSuccessRate = data.success_rate !== null ? (data.success_rate * 100).toFixed(1) : '0.0'
        setTrainingLogs(prev => [...prev, `🎉 Training completed! Final success rate: ${finalSuccessRate}%`])
        setTrainingLogs(prev => [...prev, `✨ Policy learned and ready for simulation!`])
      }
      
      setTrainingStatus(frontendStatus)

      if (data.status === "finished" || data.status === "error") {
        setIsPolling(false)
      }
    } catch (error) {
      console.error("Failed to check status:", error)
    }
  }

  const resetEnvironment = async () => {
    try {
      await fetch("http://localhost:8000/reset", { method: "POST" })
      setTrainingStatus({ status: "idle" })
      setAgentPath([])
      setJobId(null)
      setAgentPosition(null)
      setIsAnimating(false)
      setGoalReached(false)
      setSimulationFailed(false)
      setFailureReason("")
      setTrainingLogs([])
    } catch (error) {
      console.error("Failed to reset:", error)
    }
  }

  const simulatePolicy = async () => {
    if (!trainingStatus.policy || isAnimating) return
    
    // Reset state before starting
    setIsAnimating(true)
    setAgentPath([])
    setAgentPosition(null)
    setGoalReached(false)
    setSimulationFailed(false)
    setFailureReason("")
    
    // Small delay to ensure state is cleared
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const start: [number, number] = [0, 1]
    const goal: [number, number] = [15, 15]
    
    let currentPos = start
    const path: [number, number][] = []
    let steps = 0
    const maxSteps = 200
    
    // Set initial position
    setAgentPosition(start)
    path.push(start)
    setAgentPath([...path])
    
    await new Promise(resolve => setTimeout(resolve, 300))
    
    while (steps < maxSteps) {
      const [row, col] = currentPos
      
      // Check if reached goal
      if (row === goal[0] && col === goal[1]) {
        setGoalReached(true)
        // Wait for celebration animation
        await new Promise(resolve => setTimeout(resolve, 2000))
        setIsAnimating(false)
        return
      }
      
      // Get action from policy
      const action = trainingStatus.policy[row]?.[col]
      if (action === null || action === undefined) {
        console.log("No valid action at position:", row, col)
        setSimulationFailed(true)
        setFailureReason("Policy has no action for this position. Try increasing episodes to 1000+ or gamma to 0.99 for better coverage.")
        await new Promise(resolve => setTimeout(resolve, 2000))
        setIsAnimating(false)
        return
      }
      
      // Calculate next position based on action
      // Actions: 0=up, 1=down, 2=left, 3=right
      let newRow = row
      let newCol = col
      
      if (action === 0) newRow -= 1      // up
      else if (action === 1) newRow += 1  // down
      else if (action === 2) newCol -= 1  // left
      else if (action === 3) newCol += 1  // right
      
      // Check bounds
      if (newRow < 0 || newRow >= 16 || newCol < 0 || newCol >= 17) {
        console.log("Out of bounds:", newRow, newCol)
        setSimulationFailed(true)
        setFailureReason("Agent tried to move outside the maze. Policy is broken - try alpha=0.3, gamma=0.99, and 1000+ episodes.")
        setTrainingLogs(prev => [...prev, `⚠️ Simulation failed: Agent tried to move out of bounds`])
        setTrainingLogs(prev => [...prev, `💡 Policy is broken - retrain with better hyperparameters`])
        await new Promise(resolve => setTimeout(resolve, 2000))
        setIsAnimating(false)
        return
      }
      
      // Check wall
      if (maze[newRow]?.[newCol] === 0) {
        console.log("Hit wall at:", newRow, newCol)
        setSimulationFailed(true)
        if (gamma < 0.9) {
          setFailureReason(`Gamma (${gamma}) is too low - agent can't plan ahead. Increase gamma to 0.95-0.99 for better pathfinding.`)
        } else if (episodes < 500) {
          setFailureReason(`Only ${episodes} episodes - not enough training. Increase to 1000+ episodes for complete policy learning.`)
        } else {
          setFailureReason("Agent hit a wall - policy needs more exploration. Try increasing epsilon to 0.15 or training longer.")
        }
        setTrainingLogs(prev => [...prev, `⚠️ Simulation failed: Agent hit a wall at (${newRow}, ${newCol})`])
        setTrainingLogs(prev => [...prev, `💡 Policy is incomplete - needs more training`])
        await new Promise(resolve => setTimeout(resolve, 2000))
        setIsAnimating(false)
        return
      }
      
      // Check for loops (visiting same cell twice)
      if (path.some(([r, c]) => r === newRow && c === newCol)) {
        console.log("Loop detected at:", newRow, newCol)
        setSimulationFailed(true)
        if (alpha > 0.7) {
          setFailureReason(`Alpha (${alpha}) is too high - learning is unstable. Reduce alpha to 0.2-0.3 for stable convergence.`)
        } else if (gamma < 0.9) {
          setFailureReason(`Gamma (${gamma}) is too low - agent keeps looping. Increase gamma to 0.99 to value long-term rewards.`)
        } else if (episodes < 500) {
          setFailureReason(`Only ${episodes} episodes - agent didn't learn to escape loops. Train for 1000+ episodes.`)
        } else {
          setFailureReason("Agent stuck in a loop - policy is suboptimal. Try alpha=0.3, gamma=0.99, epsilon=0.1, episodes=1000.")
        }
        setTrainingLogs(prev => [...prev, `⚠️ Simulation failed: Agent got stuck in a loop (poor policy)`])
        setTrainingLogs(prev => [...prev, `💡 Try training with more episodes or better hyperparameters`])
        await new Promise(resolve => setTimeout(resolve, 2000))
        setIsAnimating(false)
        return
      }
      
      currentPos = [newRow, newCol]
      path.push(currentPos)
      
      // Update position and trail
      setAgentPosition([newRow, newCol])
      setAgentPath([...path])
      
      await new Promise(resolve => setTimeout(resolve, 250)) // Slightly slower for smoother animation
      steps++
    }
    
    console.log("Max steps reached")
    setSimulationFailed(true)
    if (epsilon > 0.3) {
      setFailureReason(`Epsilon (${epsilon}) is too high - too much exploration during training. Reduce epsilon to 0.1-0.15 for better exploitation.`)
    } else if (gamma < 0.9) {
      setFailureReason(`Gamma (${gamma}) is too low - agent takes inefficient paths. Increase gamma to 0.99 for optimal long-term planning.`)
    } else if (episodes < 500) {
      setFailureReason(`Only ${episodes} episodes - path is inefficient. Train for 1000+ episodes for optimal policy.`)
    } else {
      setFailureReason("Path is too long - policy is suboptimal. Try alpha=0.3, gamma=0.99, epsilon=0.1, episodes=1000+.")
    }
    setTrainingLogs(prev => [...prev, `⚠️ Simulation failed: Agent couldn't reach goal in 200 steps`])
    setTrainingLogs(prev => [...prev, `💡 Policy is suboptimal - consider retraining with better hyperparameters`])
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsAnimating(false)
  }

  useEffect(() => {
    if (isPolling && jobId) {
      const interval = setInterval(checkStatus, 1000)
      return () => clearInterval(interval)
    }
  }, [isPolling, jobId])

  const getArrowForAction = (action: number | null) => {
    if (action === null) return ""
    // Backend actions: 0=up, 1=down, 2=left, 3=right
    const arrows = ["↑", "↓", "←", "→"]
    return arrows[action] || ""
  }

  const getCellColor = (row: number, col: number) => {
    // FAILURE ANIMATIONS
    if (simulationFailed) {
      // Agent stuck position - red pulsing
      if (agentPosition && agentPosition[0] === row && agentPosition[1] === col) {
        return "bg-red-600 shadow-2xl shadow-red-600/50 animate-ping scale-110"
      }
      
      // Failed trail - orange with warning colors
      if (agentPath.some(([r, c]) => r === row && c === col) && 
          !(agentPosition && agentPosition[0] === row && agentPosition[1] === col)) {
        return "bg-gradient-to-r from-orange-300 to-red-400 shadow-lg animate-pulse"
      }
      
      // Goal becomes angry red when failed
      if (row === 15 && col === 15) {
        return "bg-gradient-to-r from-red-500 via-orange-500 to-red-600 shadow-2xl shadow-red-500/50 animate-pulse"
      }
    }
    
    // SUCCESS ANIMATIONS
    // Check if agent is currently on this cell
    if (agentPosition && agentPosition[0] === row && agentPosition[1] === col) {
      // Special celebration when goal is reached
      if (goalReached && row === 15 && col === 15) {
        return "bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 shadow-2xl shadow-green-500/50 animate-pulse scale-125"
      }
      return "bg-blue-500 shadow-lg shadow-blue-500/50 scale-110"
    }
    
    // Check if this is the goal
    if (row === 15 && col === 15) {
      // Animate goal when reached
      if (goalReached) {
        return "bg-gradient-to-r from-yellow-400 via-red-500 to-pink-600 shadow-2xl shadow-yellow-500/50 animate-bounce"
      }
      return "bg-red-500 shadow-lg shadow-red-500/50"
    }
    
    // Check if this is part of the trail (but not current position)
    if (agentPath.some(([r, c]) => r === row && c === col) && 
        !(agentPosition && agentPosition[0] === row && agentPosition[1] === col)) {
      // Animate trail when goal is reached
      if (goalReached) {
        return "bg-gradient-to-r from-yellow-200 to-yellow-400 shadow-lg animate-pulse"
      }
      return "bg-yellow-300 shadow-md"
    }
    
    // Check if this is the start (and agent hasn't started animating)
    if (row === 0 && col === 1 && !agentPosition && !isAnimating) {
      return "bg-blue-500 shadow-lg shadow-blue-500/50"
    }
    
    // Wall
    if (maze[row]?.[col] === 0) return "bg-black shadow-md"
    
    // Empty path
    return "bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
  }

  const SimpleRewardChart = ({ rewards, totalEpisodes }: { rewards: number[], totalEpisodes?: number }) => {
    if (!rewards || rewards.length === 0) return null

    const maxReward = Math.max(...rewards)
    const minReward = Math.min(...rewards)
    const range = maxReward - minReward || 1
    const actualTotal = totalEpisodes || rewards.length

    // Calculate start episode (if showing last 200 of more episodes)
    const startEpisode = actualTotal > rewards.length ? actualTotal - rewards.length + 1 : 1

    return (
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-gray-600">
          <span>Episode {startEpisode}</span>
          <span>Episode {actualTotal}</span>
        </div>
        <div className="h-32 bg-gray-50 rounded-lg p-2 flex items-end gap-px">
          {rewards.map((reward, index) => {
            const height = ((reward - minReward) / range) * 100
            const actualEpisode = startEpisode + index
            return (
              <div
                key={index}
                className="flex-1 bg-black rounded-t transition-all"
                style={{ height: `${Math.max(height, 2)}%` }}
                title={`Episode ${actualEpisode}: ${reward.toFixed(2)}`}
              />
            )
          })}
        </div>
        <div className="flex justify-between text-xs text-gray-600">
          <span>Min: {minReward.toFixed(2)}</span>
          <span>Max: {maxReward.toFixed(2)}</span>
        </div>
        {actualTotal > rewards.length && (
          <p className="text-xs text-gray-500 italic text-center">
            Showing last {rewards.length} of {actualTotal} episodes
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-black p-3">
      <div className="max-w-7xl mx-auto space-y-3">
        <div className="text-center space-y-1">
          <h1 className="font-bold text-black text-xl underline font-sans tracking-widest leading-9">
            RL MAZE SOLVER{" "}
          </h1>
          <p className="text-xs text-gray-600 italic">Arhaan Girdhar - 220962050 | Anbar Althaf - 220962051 </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            <Card className="p-3 bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300 shadow-md">
              <h2 className="text-sm font-semibold mb-2 text-black underline">Readme</h2>
              <p className="text-xs text-gray-700 leading-relaxed mb-[-2px] mt-[-15px] italic">
                This project demonstrates Reinforcement Learning algorithms (Monte Carlo, SARSA, Q-Learning) solving a
                16×17 maze. The agent learns to navigate from the start (blue) to the goal (red) by exploring the
                environment and optimizing its policy through trial and error.
              </p>
              <div className="space-y-2 pt-2 border-t border-gray-300">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-blue-500 rounded shadow-md shadow-blue-500/50" />
                  <span className="text-xs text-gray-700">Start Position</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-red-500 rounded shadow-md shadow-red-500/50" />
                  <span className="text-xs text-gray-700">Goal Position</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-black rounded shadow-md" />
                  <span className="text-xs text-gray-700">Wall</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-yellow-200 rounded shadow-md" />
                  <span className="text-xs text-gray-700">Agent Path</span>
                </div>
              </div>
            </Card>

            <Card className="p-3 bg-white border-gray-300">
              <h2 className="text-sm font-semibold mb-2 text-black underline">Algorithm Selection</h2>
              <div className="grid grid-cols-3 gap-2">
                {(["monte_carlo", "sarsa", "q_learning"] as Algorithm[]).map((algo) => (
                  <Button
                    key={algo}
                    onClick={() => setAlgorithm(algo)}
                    variant={algorithm === algo ? "default" : "outline"}
                    size="sm"
                    className={
                      algorithm === algo
                        ? "bg-black text-white hover:bg-gray-800 text-xs"
                        : "border-gray-300 hover:bg-gray-100 text-black text-xs"
                    }
                  >
                    {algo === "monte_carlo" ? "Monte Carlo" : algo === "sarsa" ? "SARSA" : "Q-Learning"}
                  </Button>
                ))}
              </div>
            </Card>

            <Card className="p-3 bg-white border-gray-300">
              <h2 className="text-sm font-semibold mb-2 text-black underline">Hyperparameters</h2>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">
                    Episodes <span className="text-gray-400">(1-10000)</span>
                  </label>
                  <Input
                    type="number"
                    value={episodes}
                    onChange={(e) => {
                      setEpisodes(Number(e.target.value))
                      // Clear validation error when user types
                      if (validationErrors.episodes) {
                        setValidationErrors(prev => ({ ...prev, episodes: false }))
                      }
                    }}
                    className={`bg-white h-8 text-sm transition-colors ${
                      validationErrors.episodes 
                        ? 'border-red-500 border-2 focus:border-red-500 focus:ring-red-500' 
                        : 'border-gray-300'
                    }`}
                    disabled={trainingStatus.status === "training"}
                  />
                  {validationErrors.episodes && (
                    <p className="text-xs text-red-500 mt-1">Must be between 1 and 10000</p>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">
                      Alpha (α) <span className="text-gray-400 text-[10px]">Learning Rate</span>
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={alpha}
                      onChange={(e) => {
                        setAlpha(Number(e.target.value))
                        if (validationErrors.alpha) {
                          setValidationErrors(prev => ({ ...prev, alpha: false }))
                        }
                      }}
                      className={`bg-white h-8 text-sm transition-colors ${
                        validationErrors.alpha 
                          ? 'border-red-500 border-2 focus:border-red-500 focus:ring-red-500' 
                          : 'border-gray-300'
                      }`}
                      disabled={trainingStatus.status === "training"}
                    />
                    {validationErrors.alpha && (
                      <p className="text-xs text-red-500 mt-1">0.01-1.0</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">
                      Gamma (γ) <span className="text-gray-400 text-[10px]">Discount</span>
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={gamma}
                      onChange={(e) => {
                        setGamma(Number(e.target.value))
                        if (validationErrors.gamma) {
                          setValidationErrors(prev => ({ ...prev, gamma: false }))
                        }
                      }}
                      className={`bg-white h-8 text-sm transition-colors ${
                        validationErrors.gamma 
                          ? 'border-red-500 border-2 focus:border-red-500 focus:ring-red-500' 
                          : 'border-gray-300'
                      }`}
                      disabled={trainingStatus.status === "training"}
                    />
                    {validationErrors.gamma && (
                      <p className="text-xs text-red-500 mt-1">0.5-1.0</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">
                      Epsilon (ε) <span className="text-gray-400 text-[10px]">Greedy Value</span>
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={epsilon}
                      onChange={(e) => {
                        setEpsilon(Number(e.target.value))
                        if (validationErrors.epsilon) {
                          setValidationErrors(prev => ({ ...prev, epsilon: false }))
                        }
                      }}
                      className={`bg-white h-8 text-sm transition-colors ${
                        validationErrors.epsilon 
                          ? 'border-red-500 border-2 focus:border-red-500 focus:ring-red-500' 
                          : 'border-gray-300'
                      }`}
                      disabled={trainingStatus.status === "training"}
                    />
                    {validationErrors.epsilon && (
                      <p className="text-xs text-red-500 mt-1">0.0-1.0</p>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-3 bg-white border-gray-300">
              <div className="flex gap-2">
                <Button
                  onClick={startTraining}
                  disabled={trainingStatus.status === "training"}
                  size="sm"
                  className="flex-1 bg-black text-white hover:bg-gray-800 text-xs"
                >
                  {trainingStatus.status === "training" ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Training...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-3 w-3" />
                      Start Training
                    </>
                  )}
                </Button>
                <Button
                  onClick={resetEnvironment}
                  variant="outline"
                  size="sm"
                  className="border-gray-300 hover:bg-gray-100 bg-white text-black"
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              </div>
              
              {trainingStatus.policy && (
                <div className="mt-2">
                  <Button
                    onClick={simulatePolicy}
                    disabled={isAnimating}
                    size="sm"
                    className="w-full bg-green-600 text-white hover:bg-green-700 text-xs"
                  >
                    {isAnimating ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        Simulating...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-3 w-3" />
                        Simulate Policy
                      </>
                    )}
                  </Button>
                </div>
              )}

              {trainingStatus.status !== "idle" && (
                <div className="mt-2 p-2 bg-gray-100 rounded-lg">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Status:</span>
                    <span
                      className={
                        trainingStatus.status === "completed"
                          ? "text-green-600"
                          : trainingStatus.status === "error"
                            ? "text-red-600"
                            : "text-blue-600"
                      }
                    >
                      {trainingStatus.status}
                    </span>
                  </div>
                  {trainingStatus.episode && (
                    <div className="flex items-center justify-between text-xs mt-1">
                      <span className="text-gray-600">Progress:</span>
                      <span className="text-black">
                        {trainingStatus.episode} / {trainingStatus.total_episodes}
                      </span>
                    </div>
                  )}
                  {trainingStatus.message && <p className="text-xs text-gray-600 mt-1">{trainingStatus.message}</p>}
                </div>
              )}
            </Card>

            {trainingLogs.length > 0 && (
              <Card className="p-3 bg-white border-gray-300">
                <h2 className="text-sm font-semibold mb-2 text-black">Training Logs</h2>
                <div className="bg-gray-900 rounded-lg p-2 h-40 overflow-y-auto font-mono text-xs">
                  {trainingLogs.map((log, index) => (
                    <div key={index} className="text-green-400 mb-1">
                      {log}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {trainingStatus.rewards && trainingStatus.rewards.length > 0 && (
              <Card className="p-3 bg-white border-gray-300">
                <h2 className="text-sm font-semibold mb-2 text-black flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Reward Curve
                </h2>
                <SimpleRewardChart 
                  rewards={trainingStatus.rewards} 
                  totalEpisodes={trainingStatus.total_episodes}
                />
              </Card>
            )}
          </div>

          <div className="space-y-3">
            <Card className="p-3 bg-white border-gray-300">
              <h2 className="text-center text-xl font-semibold font-sans text-black leading-7 mb-2 bg-gradient-to-br from-gray-50 to-gray-100 py-2 px-3 rounded-lg shadow-sm">
                Agent&#39;s Environment [ 16 * 17 ]
              </h2>

              <div className="grid grid-cols-17 gap-1 bg-gradient-to-br from-gray-100 to-gray-200 p-3 rounded-xl shadow-inner">
                {maze.map((row, rowIndex) =>
                  row.map((_, colIndex) => {
                    const cellColor = getCellColor(rowIndex, colIndex)
                    const showArrow = !isAnimating &&
                      trainingStatus.policy?.[rowIndex]?.[colIndex] !== undefined &&
                      trainingStatus.policy[rowIndex][colIndex] !== null &&
                      maze[rowIndex][colIndex] === 1
                    
                    return (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        className={`aspect-square ${cellColor} rounded flex items-center justify-center text-xs font-bold transition-all duration-200 ease-in-out`}
                      >
                        {/* Show arrows only when not animating */}
                        {showArrow && trainingStatus.policy && (
                          <span className="text-black drop-shadow-sm opacity-30">
                            {getArrowForAction(trainingStatus.policy[rowIndex][colIndex])}
                          </span>
                        )}
                      </div>
                    )
                  }),
                )}
              </div>
            </Card>

            {trainingStatus.policy && (
              <Card className={`p-3 border-gray-300 transition-all duration-500 ${
                goalReached ? 'bg-gradient-to-r from-green-50 to-blue-50 border-green-300 shadow-lg' : 
                simulationFailed ? 'bg-gradient-to-r from-red-50 to-orange-50 border-red-300 shadow-lg' :
                'bg-white'
              }`}>
                <h2 className={`text-sm font-semibold mb-1 ${
                  goalReached ? 'text-green-600 animate-pulse' : 
                  simulationFailed ? 'text-red-600 animate-pulse' :
                  'text-black'
                }`}>
                  {goalReached ? '🎉 Goal Reached! 🎉' : 
                   simulationFailed ? '❌ Simulation Failed' :
                   'Learned Policy'}
                </h2>
                <p className="text-xs text-gray-600">
                  {goalReached
                    ? "Amazing! The agent successfully navigated to the goal!"
                    : simulationFailed
                    ? "The agent got stuck and couldn't reach the goal."
                    : isAnimating 
                    ? "Watch the agent (blue) navigate through the maze, leaving trails behind!"
                    : "Click 'Simulate Policy' to see the agent navigate from start to goal using the learned policy."}
                </p>
                {simulationFailed && failureReason && (
                  <p className="text-xs text-orange-700 mt-2 italic bg-orange-50 p-2 rounded border border-orange-200">
                    💡 {failureReason}
                  </p>
                )}
                {agentPath.length > 0 && !isAnimating && (
                  <p className={`text-xs mt-1 font-semibold ${
                    goalReached ? 'text-green-600 text-base' : 
                    simulationFailed ? 'text-red-600' :
                    'text-green-600'
                  }`}>
                    {goalReached ? '✨ ' : simulationFailed ? '⚠️ ' : ''}
                    {simulationFailed ? 'Failed after' : 'Path completed in'} {agentPath.length} steps
                    {goalReached ? ' ✨' : simulationFailed ? ' - retrain recommended' : ''}
                  </p>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
