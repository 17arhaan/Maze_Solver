"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Loader2, Play, RotateCcw, TrendingUp, Shuffle } from "lucide-react"

type Algorithm = "q_learning" | "monte_carlo" | "sarsa"

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
  // Monte Carlo specific parameters
  const [mcMethod, setMcMethod] = useState<"first_visit" | "every_visit">("first_visit")
  const [epsilonDecay, setEpsilonDecay] = useState(0.995)
  const [minEpsilon, setMinEpsilon] = useState(0.05)
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
  const [mazeComplexity, setMazeComplexity] = useState<"easy" | "medium" | "hard">("medium")
  const [pathLength, setPathLength] = useState<number>(0)
  const [nextDifficulty, setNextDifficulty] = useState<"easy" | "medium" | "hard">("hard")

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
    setMazeComplexity("medium")
    setPathLength(estimatePathLength(initialMaze))
  }, [])

  const estimatePathLength = (mazeGrid: number[][]) => {
    // Simple BFS to find shortest path length
    const queue: Array<[number, number, number]> = [[0, 1, 0]]
    const visited = new Set<string>()
    visited.add("0,1")
    
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]
    
    while (queue.length > 0) {
      const [row, col, dist] = queue.shift()!
      
      if (row === 15 && col === 15) {
        return dist
      }
      
      for (const [dr, dc] of directions) {
        const newRow = row + dr
        const newCol = col + dc
        const key = `${newRow},${newCol}`
        
        if (newRow >= 0 && newRow < 16 && newCol >= 0 && newCol < 17 &&
            !visited.has(key) && mazeGrid[newRow]?.[newCol] === 1) {
          visited.add(key)
          queue.push([newRow, newCol, dist + 1])
        }
      }
    }
    
    return 0 // No path found
  }

  const generateRandomMaze = () => {
    // Cycle through difficulties: medium → hard → easy → medium → hard → ...
    const targetComplexity = nextDifficulty
    
    let attempts = 0
    let maxAttempts = 100  // Increased attempts
    let generatedMaze: number[][] = []
    let pathLen = 0
    
    // Keep generating until we get the target complexity
    while (attempts < maxAttempts) {
      const rows = 16
      const cols = 17
      const newMaze: number[][] = Array(rows).fill(0).map(() => Array(cols).fill(0))
      
      // Start with all walls
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          newMaze[r][c] = 0
        }
      }
      
      // Use DIFFERENT generation strategy based on attempt number for MORE variety
      const strategy = attempts % 3
      
      if (strategy === 0) {
        // Strategy 1: Classic recursive backtracking DFS
        const visited = new Set<string>()
        
        const carve = (row: number, col: number) => {
          const key = `${row},${col}`
          visited.add(key)
          newMaze[row][col] = 1
          
          // Get random direction order
          const directions = [[-2, 0], [2, 0], [0, -2], [0, 2]]
          for (let i = directions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            ;[directions[i], directions[j]] = [directions[j], directions[i]]
          }
          
          for (const [dr, dc] of directions) {
            const newRow = row + dr
            const newCol = col + dc
            const newKey = `${newRow},${newCol}`
            
            if (newRow > 0 && newRow < rows - 1 && newCol > 0 && newCol < cols - 1 && !visited.has(newKey)) {
              // Carve through the wall between
              newMaze[row + dr / 2][col + dc / 2] = 1
              carve(newRow, newCol)
            }
          }
        }
        
        // Start carving from RANDOM position
        const startRow = Math.floor(Math.random() * 6) * 2 + 1
        const startCol = Math.floor(Math.random() * 6) * 2 + 1
        carve(startRow, startCol)
        
      } else if (strategy === 1) {
        // Strategy 2: Random walk from multiple starting points
        const numStarts = Math.floor(Math.random() * 3) + 2  // 2-4 starting points
        for (let s = 0; s < numStarts; s++) {
          let r = Math.floor(Math.random() * (rows - 2)) + 1
          let c = Math.floor(Math.random() * (cols - 2)) + 1
          
          // Random walk from each starting point
          const walkLength = Math.floor(Math.random() * 40) + 20
          for (let step = 0; step < walkLength; step++) {
            newMaze[r][c] = 1
            
            // Move in random direction
            const direction = Math.floor(Math.random() * 4)
            if (direction === 0 && r > 1) r--
            else if (direction === 1 && r < rows - 2) r++
            else if (direction === 2 && c > 1) c--
            else if (direction === 3 && c < cols - 2) c++
          }
        }
        
      } else {
        // Strategy 3: Grid-based with random walls removed
        // Create a grid pattern
        for (let r = 1; r < rows - 1; r += 2) {
          for (let c = 1; c < cols - 1; c += 2) {
            newMaze[r][c] = 1
            // Randomly connect to neighbors
            if (c < cols - 2 && Math.random() < 0.5) {
              newMaze[r][c + 1] = 1
            }
            if (r < rows - 2 && Math.random() < 0.5) {
              newMaze[r + 1][c] = 1
            }
          }
        }
      }
      
      // Ensure start and goal are accessible
      newMaze[0][1] = 1
      newMaze[15][15] = 1
      
      // Connect start and goal to the main maze first
      // Connect start (0,1) downward
      if (newMaze[1][1] === 0 && newMaze[2][1] === 1) {
        newMaze[1][1] = 1
      }
      // Connect goal (15,15) - try multiple directions
      const goalConnections = [
        [14, 15], [15, 14], [14, 14]
      ]
      for (const [r, c] of goalConnections) {
        if (newMaze[r][c] === 1) {
          // Already connected
          break
        }
      }
      // Force connection if needed
      if (newMaze[14][15] === 0 && newMaze[15][14] === 0) {
        newMaze[14][15] = 1
      }
      
      // Add additional paths based on target difficulty - EXTREME differences
      if (targetComplexity === "easy") {
        // Easy: CREATE DIRECT PATHS - literally fill most of the maze
        // Add horizontal corridors
        for (let r = 1; r < rows - 1; r++) {
          for (let c = 1; c < cols - 1; c++) {
            // Fill about 70% of the maze with paths
            if (Math.random() < 0.7) {
              newMaze[r][c] = 1
            }
          }
        }
        
        // Ensure diagonal shortcuts exist
        for (let i = 0; i < Math.min(rows, cols); i++) {
          if (i < rows - 1 && i < cols - 1) {
            newMaze[i][i] = 1
            if (i + 1 < rows && i + 1 < cols) {
              newMaze[i + 1][i] = 1
              newMaze[i][i + 1] = 1
            }
          }
        }
      } else if (targetComplexity === "medium") {
        // Medium: moderate paths
        const additionalPathsCount = Math.floor(Math.random() * 20) + 15
        for (let pass = 0; pass < 4; pass++) {
          for (let i = 0; i < additionalPathsCount / 4; i++) {
            const r = Math.floor(Math.random() * (rows - 2)) + 1
            const c = Math.floor(Math.random() * (cols - 2)) + 1
            if (newMaze[r][c] === 0) {
              const neighbors = [
                newMaze[r-1]?.[c],
                newMaze[r+1]?.[c],
                newMaze[r]?.[c-1],
                newMaze[r]?.[c+1]
              ].filter(n => n === 1).length
              
              if (neighbors >= 1 && neighbors <= 2 && Math.random() < 0.7) {
                newMaze[r][c] = 1
              }
            }
          }
        }
      }
      // Hard: NO additional paths at all - use only base generation
      
      // Calculate path length
      pathLen = estimatePathLength(newMaze)
      
      // Check if this maze matches our target complexity
      let achievedComplexity: "easy" | "medium" | "hard"
      if (pathLen < 30) achievedComplexity = "easy"      // Easy: short paths (increased threshold)
      else if (pathLen > 55) achievedComplexity = "hard" // Hard: long paths
      else achievedComplexity = "medium"                  // Medium: everything else
      
      // Make sure path exists (pathLen > 0)
      if (pathLen === 0) {
        attempts++
        continue
      }
      
      // Strict matching - we want the TARGET difficulty
      const isMatch = achievedComplexity === targetComplexity
      
      // Also accept close matches for specific cases
      const isCloseMatch = (
        (targetComplexity === "easy" && pathLen < 35) ||  // Very lenient for easy
        (targetComplexity === "medium" && pathLen >= 30 && pathLen <= 55) ||
        (targetComplexity === "hard" && pathLen > 50)
      )
      
      // If we hit the target or close match, use this maze
      // Give up after 50 attempts
      if (isMatch || (isCloseMatch && attempts > 20) || attempts > 50) {
        generatedMaze = newMaze
        break
      }
      
      attempts++
    }
    
    // If we couldn't generate exact complexity, create a guaranteed valid maze
    if (generatedMaze.length === 0) {
      const rows = 16
      const cols = 17
      generatedMaze = Array(rows).fill(0).map(() => Array(cols).fill(0))
      
      // Create random path pattern (not always L-shaped)
      const pathType = Math.floor(Math.random() * 3)
      
      if (pathType === 0) {
        // L-shaped: Vertical then horizontal
        for (let r = 0; r < rows; r++) {
          generatedMaze[r][1] = 1
        }
        for (let c = 1; c <= 15; c++) {
          generatedMaze[15][c] = 1
        }
      } else if (pathType === 1) {
        // Snake pattern: zigzag from top to bottom
        let currentCol = 1
        for (let r = 0; r < rows; r++) {
          generatedMaze[r][currentCol] = 1
          if (r < rows - 1 && r % 3 === 2) {
            // Move horizontally
            const direction = currentCol < 8 ? 1 : -1
            for (let c = currentCol; c >= 1 && c <= 15; c += direction) {
              generatedMaze[r][c] = 1
              if (Math.random() < 0.3) break
            }
            currentCol = Math.min(15, Math.max(1, currentCol + direction * (Math.floor(Math.random() * 6) + 3)))
          }
        }
        // Ensure path to goal
        for (let c = Math.min(currentCol, 15); c <= 15; c++) {
          generatedMaze[15][c] = 1
        }
      } else {
        // Diagonal-ish pattern
        for (let step = 0; step <= 15; step++) {
          const r = Math.min(15, Math.floor(step * 15 / 15))
          const c = Math.min(15, Math.max(1, step))
          generatedMaze[r][c] = 1
          if (r > 0) generatedMaze[r-1][c] = 1
          if (c > 1) generatedMaze[r][c-1] = 1
        }
      }
      
      // Add complexity based on target with MORE randomization
      const densityMultiplier = Math.random() * 0.3 + 0.85  // 0.85-1.15 random variation
      
      if (targetComplexity === "easy") {
        // Add many random corridors
        const corridorCount = Math.floor((Math.random() * 4) + 6)  // 6-10 corridors
        for (let i = 0; i < corridorCount; i++) {
          const isHorizontal = Math.random() < 0.5
          const startPos = Math.floor(Math.random() * (rows - 2)) + 1
          const length = Math.floor(Math.random() * 8) + 5
          
          if (isHorizontal) {
            const row = startPos
            const startCol = Math.floor(Math.random() * (cols - length - 2)) + 1
            for (let c = startCol; c < Math.min(cols - 1, startCol + length); c++) {
              if (Math.random() < 0.7 * densityMultiplier) generatedMaze[row][c] = 1
            }
          } else {
            const col = startPos
            const startRow = Math.floor(Math.random() * (rows - length - 2)) + 1
            for (let r = startRow; r < Math.min(rows - 1, startRow + length); r++) {
              if (Math.random() < 0.7 * densityMultiplier) generatedMaze[r][col] = 1
            }
          }
        }
      } else if (targetComplexity === "medium") {
        // Add some corridors with medium density
        const corridorCount = Math.floor((Math.random() * 3) + 3)  // 3-6 corridors
        for (let i = 0; i < corridorCount; i++) {
          const isHorizontal = Math.random() < 0.5
          const startPos = Math.floor(Math.random() * (rows - 2)) + 1
          const length = Math.floor(Math.random() * 6) + 3
          
          if (isHorizontal) {
            const row = startPos
            const startCol = Math.floor(Math.random() * (cols - length - 2)) + 1
            for (let c = startCol; c < Math.min(cols - 1, startCol + length); c++) {
              if (Math.random() < 0.5 * densityMultiplier) generatedMaze[row][c] = 1
            }
          } else {
            const col = startPos
            const startRow = Math.floor(Math.random() * (rows - length - 2)) + 1
            for (let r = startRow; r < Math.min(rows - 1, startRow + length); r++) {
              if (Math.random() < 0.5 * densityMultiplier) generatedMaze[r][col] = 1
            }
          }
        }
      } else {
        // Hard: VERY minimal extra paths - create a narrow, winding path
        // Only add a few strategic connections, not random corridors
        const strategicSpots = Math.floor(Math.random() * 3) + 2  // 2-5 spots only
        for (let i = 0; i < strategicSpots; i++) {
          const r = Math.floor(Math.random() * (rows - 2)) + 1
          const c = Math.floor(Math.random() * (cols - 2)) + 1
          // Only add if exactly 1 neighbor (creates narrow passages)
          const neighbors = [
            generatedMaze[r-1]?.[c],
            generatedMaze[r+1]?.[c],
            generatedMaze[r]?.[c-1],
            generatedMaze[r]?.[c+1]
          ].filter(n => n === 1).length
          
          if (neighbors === 1 && Math.random() < 0.25 * densityMultiplier) {
            generatedMaze[r][c] = 1
          }
        }
      }
      
      // Ensure start and goal
      generatedMaze[0][1] = 1
      generatedMaze[15][15] = 1
      
      pathLen = estimatePathLength(generatedMaze)
    }
    
    // Determine actual complexity (match the generation thresholds)
    let actualComplexity: "easy" | "medium" | "hard"
    if (pathLen < 30) actualComplexity = "easy"
    else if (pathLen > 55) actualComplexity = "hard"
    else actualComplexity = "medium"
    
    setMaze(generatedMaze)
    setMazeComplexity(actualComplexity)
    setPathLength(pathLen)
    
    // Cycle to next difficulty based on what was ACTUALLY generated (not target)
    if (actualComplexity === "easy") setNextDifficulty("medium")
    else if (actualComplexity === "medium") setNextDifficulty("hard")
    else setNextDifficulty("easy")
    
    // Reset simulation state
    setAgentPath([])
    setAgentPosition(null)
    setGoalReached(false)
    setSimulationFailed(false)
    setFailureReason("")
    
    // Add log with cycle info
    if (pathLen > 0) {
      setTrainingLogs(prev => [...prev, `🎲 Generated ${actualComplexity.toUpperCase()} maze (path: ${pathLen} steps) • Next: ${nextDifficulty === "easy" ? "EASY" : nextDifficulty === "medium" ? "MEDIUM" : "HARD"}`])
    } else {
      setTrainingLogs(prev => [...prev, `⚠️ Failed to generate ${targetComplexity.toUpperCase()} maze - using fallback`])
    }
  }

  const startComparison = async () => {
    // Validate inputs
    const errors = {
      episodes: episodes < 1 || episodes > 10000,
      alpha: alpha < 0.01 || alpha > 1.0,
      gamma: gamma < 0.5 || gamma > 1.0,
      epsilon: epsilon < 0.0 || epsilon > 1.0
    }
    
    setValidationErrors(errors)
    
    // If any validation error, don't start comparison
    if (errors.episodes || errors.alpha || errors.gamma || errors.epsilon) {
      setTrainingLogs(prev => [...prev, `❌ Invalid hyperparameters - please check highlighted fields`])
      return
    }
    
    try {
      setTrainingStatus({ status: "training" })
      setIsPolling(true)
      setTrainingLogs([])
      
      // Add initial log
      setTrainingLogs(prev => [...prev, `🔬 Starting algorithm comparison...`])
      setTrainingLogs(prev => [...prev, `📊 Comparing Q-Learning, Monte Carlo, and SARSA`])
      setTrainingLogs(prev => [...prev, `📈 Episodes per algorithm: ${episodes}`])

      // Flatten maze for backend (convert 2D to 1D array)
      const flatMaze = maze.flat()
      
      const response = await fetch("http://localhost:8000/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          algorithm: "q_learning", // This will be overridden by the comparison endpoint
          episodes,
          alpha,
          gamma,
          epsilon,
          max_steps: 200,
          mc_method: mcMethod,
          epsilon_decay: epsilonDecay,
          min_epsilon: minEpsilon,
          maze: flatMaze,
          rows: 16,
          cols: 17
        }),
      })

      if (!response.ok) throw new Error("Comparison failed to start")
      
      const data = await response.json()
      setTrainingLogs(prev => [...prev, `✅ Comparison started with ID: ${data.comparison_id.substring(0, 8)}...`])
      setTrainingLogs(prev => [...prev, `🚀 All three algorithms are now training in parallel`])
      
      // For comparison, we'll track the first job ID (Q-Learning)
      if (data.job_ids && data.job_ids.q_learning) {
        setJobId(data.job_ids.q_learning)
      }
    } catch (error) {
      setTrainingStatus({ status: "error", message: "Failed to connect to backend" })
      setIsPolling(false)
      setTrainingLogs(prev => [...prev, `❌ Error: Failed to connect to backend`])
    }
  }

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

      // Flatten maze for backend (convert 2D to 1D array)
      const flatMaze = maze.flat()
      
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
          mc_method: mcMethod,
          epsilon_decay: epsilonDecay,
          min_epsilon: minEpsilon,
          maze: flatMaze,
          rows: 16,
          cols: 17
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
        
        // Environment-aware suggestions
        const minEpisodes = mazeComplexity === "hard" ? 2000 : mazeComplexity === "medium" ? 1000 : 500
        const suggestedGamma = mazeComplexity === "hard" ? 0.99 : 0.95
        
        if (gamma < 0.9) {
          setFailureReason(`Gamma (${gamma}) is too low for this ${mazeComplexity} maze (path: ${pathLength} steps). Increase to ${suggestedGamma} for better long-term planning.`)
        } else if (episodes < minEpisodes) {
          setFailureReason(`Only ${episodes} episodes for ${mazeComplexity} maze - not enough training. This maze needs ${minEpisodes}+ episodes for complete learning.`)
        } else {
          setFailureReason(`Agent hit a wall in ${mazeComplexity} maze. Try epsilon=0.15, gamma=${suggestedGamma}, and ${minEpisodes}+ episodes.`)
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
        
        // Environment-aware suggestions
        const minEpisodes = mazeComplexity === "hard" ? 2000 : mazeComplexity === "medium" ? 1000 : 500
        
        if (alpha > 0.7) {
          setFailureReason(`Alpha (${alpha}) is too high - learning is unstable. Reduce to 0.2-0.3 and train for ${minEpisodes}+ episodes on this ${mazeComplexity} maze.`)
        } else if (gamma < 0.9) {
          setFailureReason(`Gamma (${gamma}) is too low for ${mazeComplexity} maze - agent can't plan ${pathLength}-step path. Increase gamma to 0.99.`)
        } else if (episodes < minEpisodes) {
          setFailureReason(`${episodes} episodes insufficient for ${mazeComplexity} maze (${pathLength}-step solution). Train for ${minEpisodes}+ episodes.`)
        } else {
          setFailureReason(`Loop in ${mazeComplexity} maze - try alpha=0.3, gamma=0.99, epsilon=0.1, episodes=${minEpisodes}.`)
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
    
    // Environment-aware suggestions
    const minEpisodes = mazeComplexity === "hard" ? 2000 : mazeComplexity === "medium" ? 1000 : 500
    const pathEfficiency = (pathLength / 200) * 100
    
    if (epsilon > 0.3) {
      setFailureReason(`Epsilon (${epsilon}) too high for ${mazeComplexity} maze. Reduce to 0.1 and train ${minEpisodes}+ episodes.`)
    } else if (gamma < 0.9) {
      setFailureReason(`Gamma (${gamma}) too low for ${pathLength}-step solution. Increase to 0.99 for this ${mazeComplexity} maze.`)
    } else if (episodes < minEpisodes) {
      setFailureReason(`${episodes} episodes not enough for ${mazeComplexity} maze. This ${pathLength}-step path needs ${minEpisodes}+ episodes.`)
    } else {
      setFailureReason(`Inefficient path in ${mazeComplexity} maze (optimal: ${pathLength} steps). Try alpha=0.3, gamma=0.99, episodes=${minEpisodes}.`)
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
                This project demonstrates Reinforcement Learning algorithms (Q-Learning, Monte Carlo, SARSA) solving a
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
                {(["q_learning", "monte_carlo", "sarsa"] as Algorithm[]).map((algo) => (
                  <Button
                    key={algo}
                    onClick={() => {
                      setAlgorithm(algo)
                      // Auto-set optimal parameters for Monte Carlo
                      if (algo === "monte_carlo") {
                        setEpisodes(5000)
                        setGamma(0.99)
                        setEpsilon(0.3)
                        setEpsilonDecay(0.995)
                        setMinEpsilon(0.05)
                        setMcMethod("first_visit")
                        setTrainingLogs(prev => [...prev, `⚙️ Auto-configured optimal Monte Carlo parameters: episodes=5000, γ=0.99, ε=0.3`])
                      } else if (algo === "q_learning") {
                        // Reset to Q-Learning defaults
                        setEpisodes(1000)
                        setAlpha(0.3)
                        setGamma(0.99)
                        setEpsilon(0.15)
                      }
                    }}
                    variant={algorithm === algo ? "default" : "outline"}
                    size="sm"
                    className={
                      algorithm === algo
                        ? "bg-black text-white hover:bg-gray-800 text-xs"
                        : "border-gray-300 hover:bg-gray-100 text-black text-xs"
                    }
                  >
                    {algo === "q_learning" ? "Q-Learning" : 
                     algo === "monte_carlo" ? "Monte Carlo" : 
                     "SARSA"}
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
                      {algorithm.startsWith("monte_carlo") && (
                        <span className="text-orange-600 text-[10px] ml-1">⚠️ MC needs 3-5x more episodes</span>
                      )}
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
                
                {/* Monte Carlo specific parameters */}
                {algorithm.startsWith("monte_carlo") && (
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-2">
                      <p className="text-[10px] text-blue-700 mb-1">
                        💡 <strong>Monte Carlo Optimal Parameters:</strong>
                      </p>
                      <ul className="text-[9px] text-blue-600 space-y-0.5 ml-3">
                        <li>• <strong>Episodes:</strong> 3000-10000 (needs 3-5x more than Q-Learning)</li>
                        <li>• <strong>Gamma:</strong> 0.99 (high discount for long-term planning)</li>
                        <li>• <strong>Epsilon:</strong> 0.3 (higher initial exploration)</li>
                        <li>• <strong>Method:</strong> First-Visit (more stable)</li>
                        <li>• <strong>ε Decay:</strong> 0.995 (slow decay to maintain exploration)</li>
                        <li>• <strong>Min ε:</strong> 0.05 (keep some exploration)</li>
                      </ul>
                      <p className="text-[9px] text-blue-600 mt-1 italic">
                        Uses exploring starts (85% from random states near goal). Expected success: 60-70% on hard mazes, 95%+ on easy mazes.
                      </p>
                    </div>
                    <h3 className="text-xs font-semibold text-gray-700 mb-2">Monte Carlo Parameters</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-600 mb-1 block">
                          Method <span className="text-green-600 text-[10px]">✓ Optimal: First-Visit</span>
                        </label>
                        <select
                          value={mcMethod}
                          onChange={(e) => setMcMethod(e.target.value as "first_visit" | "every_visit")}
                          className="w-full h-8 text-sm border border-gray-300 rounded bg-white px-2"
                          disabled={trainingStatus.status === "training"}
                        >
                          <option value="first_visit">First-Visit (Recommended)</option>
                          <option value="every_visit">Every-Visit</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-600 mb-1 block">
                          ε Decay <span className="text-gray-400 text-[10px]">(Optimal: 0.995)</span>
                        </label>
                        <Input
                          type="number"
                          step="0.001"
                          value={epsilonDecay}
                          onChange={(e) => setEpsilonDecay(Number(e.target.value))}
                          className="bg-white h-8 text-sm border-gray-300"
                          disabled={trainingStatus.status === "training"}
                        />
                      </div>
                    </div>
                    <div className="mt-2">
                      <label className="text-xs text-gray-600 mb-1 block">
                        Min ε <span className="text-gray-400 text-[10px]">(Optimal: 0.05)</span>
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        value={minEpsilon}
                        onChange={(e) => setMinEpsilon(Number(e.target.value))}
                        className="bg-white h-8 text-sm border-gray-300"
                        disabled={trainingStatus.status === "training"}
                      />
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-3 bg-white border-gray-300">
              <div className="space-y-2">
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
                
                <Button
                  onClick={startComparison}
                  disabled={trainingStatus.status === "training"}
                  size="sm"
                  className="w-full bg-purple-600 text-white hover:bg-purple-700 text-xs"
                >
                  <TrendingUp className="mr-2 h-3 w-3" />
                  Compare All Algorithms
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
                <h2 className="text-sm font-semibold mb-2 text-black">Live Logs</h2>
                <div className="bg-gray-900 rounded-lg p-2 h-40 overflow-y-auto font-mono text-xs">
                  {trainingLogs.map((log, index) => (
                    <div key={index} className="text-green-400 mb-1">
                      {log}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          <div className="space-y-3">
            <Card className="p-3 bg-white border-gray-300">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold font-sans text-black leading-7 bg-gradient-to-br from-gray-50 to-gray-100 py-2 px-3 rounded-lg shadow-sm flex-1 text-center">
                  Agent&#39;s Environment [ 16 * 17 ]
                </h2>
                <Button
                  onClick={generateRandomMaze}
                  variant="outline"
                  size="sm"
                  className="ml-2 border-purple-300 hover:bg-purple-50 text-purple-700 hover:text-purple-800"
                  disabled={isAnimating || trainingStatus.status === "training"}
                  title={`Generate ${nextDifficulty.toUpperCase()} maze`}
                >
                  <Shuffle className="h-4 w-4" />
                </Button>
              </div>
              
              {pathLength > 0 && (
                <div className="mb-2 text-center">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    mazeComplexity === "easy" ? "bg-green-100 text-green-700" :
                    mazeComplexity === "medium" ? "bg-yellow-100 text-yellow-700" :
                    "bg-red-100 text-red-700"
                  }`}>
                    {mazeComplexity.toUpperCase()} • Shortest Path: {pathLength} steps
                  </span>
                </div>
              )}

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
        </div>
      </div>
    </div>
  )
}
