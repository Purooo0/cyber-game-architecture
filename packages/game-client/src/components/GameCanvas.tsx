import { useEffect, useRef } from 'react'
import { useGameEngine } from '../game/useGameEngine'
import type { InteractableObject, GameEngineConfig } from '../game/types'

interface GameCanvasProps {
  width?: number
  height?: number
  interactables?: InteractableObject[]
  config?: Partial<GameEngineConfig>
}

export function GameCanvas({ 
  width = 800, 
  height = 600,
  interactables = [],
  config = {}
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameEngine = useGameEngine({
    canvasWidth: width,
    canvasHeight: height,
    ...config
  })

  // Initialize game engine and setup game loop
  useEffect(() => {
    if (!canvasRef.current) return

    // Initialize engine
    gameEngine.init(interactables)

    // Setup game loop using requestAnimationFrame
    let animationFrameId: number

    const gameLoop = () => {
      const ctx = canvasRef.current?.getContext('2d')
      if (!ctx) return

      // Clear canvas
      ctx.fillStyle = '#0a0e27'
      ctx.fillRect(0, 0, width, height)

      // Update and render
      gameEngine.update(ctx, canvasRef.current!)

      animationFrameId = requestAnimationFrame(gameLoop)
    }

    animationFrameId = requestAnimationFrame(gameLoop)

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [gameEngine, interactables, width, height])

  // Handle keyboard input - already managed by useGameEngine hook
  useEffect(() => {
    return () => {
      // Cleanup if needed
    }
  }, [gameEngine])

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border-2 border-green-500 bg-black"
        style={{
          imageRendering: 'pixelated',
          boxShadow: '0 0 20px rgba(0, 255, 0, 0.3)'
        }}
      />
      <div className="mt-4 text-center text-green-500 text-xs font-press-start">
        <p>↑↓←→ or WASD to move</p>
        <p>E or ENTER to interact</p>
      </div>
    </div>
  )
}
