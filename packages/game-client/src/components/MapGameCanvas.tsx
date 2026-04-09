/**
 * Map Game Canvas Component
 * Renders Tiled maps with collision, trigger, and interactive support
 */

import { useEffect, useRef, useState, useMemo } from 'react'
import { useMapGameEngine, type MapGameEngineConfig } from '../game/useMapGameEngine'
import type { TriggerBox, InteractiveObject } from '../game/types'
import { createBlueHairedWomanCharacter } from '../services/characterSpriteLoader'

interface MapGameCanvasProps {
  mapPath: string
  width?: number
  height?: number
  onTrigger?: (trigger: TriggerBox) => void
  onInteract?: (interactive: InteractiveObject) => void
  debug?: boolean
  showDebug?: boolean
}

export function MapGameCanvas({
  mapPath,
  width = 1280,
  height = 960,
  onTrigger,
  onInteract,
  debug = false,
  showDebug = false,
}: MapGameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Memoize engine config to prevent useMapGameEngine from being recreated every render
  const engineConfig: MapGameEngineConfig = useMemo(
    () => ({
      canvasWidth: width,
      canvasHeight: height,
      mapPath,
      playerSpeed: 3,
      playerWidth: 96, // 32 * 3 scale
      playerHeight: 150, // ~51 * 3 scale (frame height varies 51-52, so ~153 average)
      onTrigger,
      onInteract,
    }),
    [width, height, mapPath, onTrigger, onInteract]
  )

  const gameEngine = useMapGameEngine(engineConfig)

  useEffect(() => {
    const setupGame = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Detect if running in Chrome and throttle FPS for performance
        const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor)
        if (isChrome) {
          console.log('[🔧 Optimization] Chrome detected - throttling FPS to 30 for better performance')
          gameEngine.setTargetFPS(30)
        }

        // Initialize engine - this will load the map
        await gameEngine.init()

        // Load character sprite
        const characterLoader = await createBlueHairedWomanCharacter()
        gameEngine.loadCharacterSprite(characterLoader)

        setIsLoading(false)
      } catch (err) {
        console.error('Error setting up game:', err)
        setError(err instanceof Error ? err.message : 'Failed to load game')
        setIsLoading(false)
      }
    }

    setupGame()
  }, [gameEngine])

  useEffect(() => {
    if (!canvasRef.current || isLoading) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      setError('Failed to get canvas context')
      return
    }

    let animationFrameId: number

    const gameLoop = () => {
      try {
        gameEngine.update(ctx, canvas, showDebug || debug)
      } catch (err) {
        console.error('Error in game loop:', err)
      }
      animationFrameId = requestAnimationFrame(gameLoop)
    }

    animationFrameId = requestAnimationFrame(gameLoop)

    // Setup canvas click handler for interactive object interaction
    const cleanup = gameEngine.setupCanvasClickHandler(canvas)

    return () => {
      cancelAnimationFrame(animationFrameId)
      cleanup()
    }
  }, [gameEngine, isLoading, debug, showDebug])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-gray-900 text-white rounded">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-pixel text-sm">LOADING MAP...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-gray-900 text-white rounded">
        <div className="text-center space-y-4">
          <p className="font-pixel text-sm text-red-500">ERROR</p>
          <p className="text-xs text-gray-400">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border-2 border-green-500 bg-black"
        style={{
          imageRendering: 'pixelated',
          boxShadow: '0 0 20px rgba(0, 255, 0, 0.3)',
        }}
      />
      <div className="mt-4 text-center text-green-500 text-xs font-press-start space-y-1">
        <p>↑↓←→ or WASD to move</p>
        <p>E or ENTER to interact</p>
        {debug && <p className="text-[9px] text-yellow-500">DEBUG MODE ON</p>}
      </div>
    </div>
  )
}
