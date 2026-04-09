/**
 * Example: How to Use Phaser Game Engine
 * This file shows how to integrate PhaserGameContainer with your React app
 */

import { useState } from 'react'
import type { TriggerBox, InteractiveObject } from '../game/types'
import { PhaserGameContainer } from '../components/PhaserGameContainer'

/**
 * Example 1: Basic Game Container
 */
export function BasicGameExample() {
  return (
    <PhaserGameContainer
      mapPath="/bedroom_map.tmj"
      width={1280}
      height={960}
      playerSpeed={3}
    />
  )
}

/**
 * Example 2: With Callbacks
 */
export function GameWithCallbacks() {
  const handleTrigger = (trigger: TriggerBox) => {
    console.log('Trigger hit:', trigger)
    // Handle trigger event
    // e.g., start dialog, open door, etc.
  }

  const handleInteract = (interactive: InteractiveObject) => {
    console.log('Interacted with:', interactive)
    // Handle interaction
    // e.g., pick up item, use computer, etc.
  }

  return (
    <PhaserGameContainer
      mapPath="/bedroom_map.tmj"
      onTrigger={handleTrigger}
      onInteract={handleInteract}
      debug={false}
    />
  )
}

/**
 * Example 3: With Backend Integration
 */
export function GameWithBackend() {
  const [playerState, setPlayerState] = useState(null)

  const handleTrigger = async (trigger: TriggerBox) => {
    console.log('Trigger event:', trigger.action)
    // TODO: Connect to backend API
    // Log action ke backend
  }

  const handleInteract = async (interactive: InteractiveObject) => {
    console.log('Interactive event:', interactive.name)
    // TODO: Connect to backend API
    // Log interaction ke backend
  }

  return (
    <PhaserGameContainer
      mapPath="/bedroom_map.tmj"
      onTrigger={handleTrigger}
      onInteract={handleInteract}
    />
  )
}

/**
 * Example 4: With State Management
 */
export function GameWithStateManagement() {
  const [gameActive, setGameActive] = useState(true)
  const [triggeredEvents, setTriggeredEvents] = useState<string[]>([])
  const [interactions, setInteractions] = useState<string[]>([])

  const handleTrigger = (trigger: TriggerBox) => {
    if (!triggeredEvents.includes(trigger.name)) {
      setTriggeredEvents([...triggeredEvents, trigger.name])
      console.log('New trigger:', trigger.name)
    }
  }

  const handleInteract = (interactive: InteractiveObject) => {
    setInteractions([...interactions, interactive.name])
    console.log('Interacted with:', interactive.name)
  }

  return (
    <div className="flex gap-4">
      {/* Game on the left */}
      <div className="flex-1">
        {gameActive && (
          <PhaserGameContainer
            mapPath="/bedroom_map.tmj"
            onTrigger={handleTrigger}
            onInteract={handleInteract}
          />
        )}
      </div>

      {/* UI on the right */}
      <div className="w-64 p-4 bg-gray-800 text-white rounded">
        <h3 className="font-bold mb-4">Game State</h3>

        <div className="mb-4">
          <p className="text-sm text-gray-400">Triggered Events: {triggeredEvents.length}</p>
          <ul className="text-xs mt-2 space-y-1">
            {triggeredEvents.map(event => (
              <li key={event} className="text-green-400">✓ {event}</li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm text-gray-400">Interactions: {interactions.length}</p>
          <ul className="text-xs mt-2 space-y-1">
            {interactions.map(interaction => (
              <li key={interaction} className="text-blue-400">→ {interaction}</li>
            ))}
          </ul>
        </div>

        <button
          onClick={() => setGameActive(!gameActive)}
          className="w-full mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
        >
          {gameActive ? 'Stop Game' : 'Start Game'}
        </button>
      </div>
    </div>
  )
}

/**
 * Example 5: Full Featured Page
 */
export function GamePageFull() {
  const [score, setScore] = useState(0)
  const [levelComplete, setLevelComplete] = useState(false)
  const [currentScene, setCurrentScene] = useState('bedroom')

  const handleTrigger = async (trigger: TriggerBox) => {
    console.log('Trigger:', trigger.name)

    // Handle specific triggers
    switch (trigger.action) {
      case 'complete_level':
        setScore(prev => prev + 100)
        setLevelComplete(true)
        break
      case 'area_explored':
        setScore(prev => prev + 10)
        break
      case 'solve_puzzle':
        setScore(prev => prev + 50)
        break
      default:
        break
    }

    // TODO: Log to backend
  }

  const handleInteract = async (interactive: InteractiveObject) => {
    console.log('Interacted with:', interactive.name)
    // TODO: Log interaction to backend
  }

  if (levelComplete) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Level Complete! 🎉</h1>
          <p className="text-2xl text-green-400 mb-8">Score: {score}</p>
          <button
            onClick={() => {
              setLevelComplete(false)
              setScore(0)
            }}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold"
          >
            Play Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-gray-800 border-b border-green-500">
        <div>
          <h1 className="text-2xl font-bold text-white">Cyber Edu Game</h1>
          <p className="text-sm text-gray-400">Scene: {currentScene}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-400">Score</p>
          <p className="text-2xl font-bold text-green-400">{score}</p>
        </div>
      </div>

      {/* Game Container */}
      <div className="flex justify-center py-8">
        <PhaserGameContainer
          mapPath="/bedroom_map.tmj"
          width={1280}
          height={960}
          playerSpeed={3}
          onTrigger={handleTrigger}
          onInteract={handleInteract}
          debug={false}
        />
      </div>

      {/* Footer */}
      <div className="flex justify-center gap-4 p-4 bg-gray-800 border-t border-green-500">
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-2">Controls</p>
          <p className="text-sm text-white">WASD or ↑↓←→ to move</p>
          <p className="text-sm text-white">E to interact</p>
        </div>
      </div>
    </div>
  )
}

/**
 * Export Default: Can be used in your App.tsx
 */
export default GameWithStateManagement
