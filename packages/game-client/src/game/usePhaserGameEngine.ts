/**
 * Phaser Game Engine Hook
 * React hook wrapper untuk Phaser 3 game engine
 * Provides compatibility dengan existing React components
 */

import { useRef, useEffect, useState } from 'react'
import Phaser from 'phaser'
import { GameScene, type GameSceneConfig } from './PhaserGameScene'
import type { GameState, TriggerBox, InteractiveObject } from './types'

export interface UsePhaserGameEngineConfig extends Omit<GameSceneConfig, 'key'> {
  containerSelector?: string
  width?: number
  height?: number
  // Note: disableBarrier will be handled dynamically via disableBarrier() method, not during init
}

export function usePhaserGameEngine(config: UsePhaserGameEngineConfig) {
  const gameRef = useRef<Phaser.Game | null>(null)
  const sceneRef = useRef<GameScene | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const sceneConfigRef = useRef<GameSceneConfig | null>(null)

  useEffect(() => {
    const initGame = async () => {
      try {
        // Create scene config dengan mapPath dan playerSpeed
        const sceneConfig: GameSceneConfig = {
          key: 'GameScene',
          mapPath: config.mapPath,
          playerSpeed: config.playerSpeed,
          onTrigger: config.onTrigger,
          onInteract: config.onInteract,
          disableBarrier: false,  // Always false initially - will be disabled dynamically via method
        }
        
        // Store config di ref untuk diakses oleh scene
        sceneConfigRef.current = sceneConfig

        // Create custom scene class dengan config yang benar
        class CustomGameScene extends GameScene {
          constructor(sceneConfig: GameSceneConfig) {
            super(sceneConfig)
          }
        }

        const gameConfig: Phaser.Types.Core.GameConfig = {
          type: Phaser.AUTO,
          width: config.width || 1600,
          height: config.height || 900,
          parent: config.containerSelector || 'phaser-game-container',
          transparent: true,  // Make canvas transparent
          physics: {
            default: 'arcade',
            arcade: {
              gravity: { x: 0, y: 0 },
              debug: false,
              useTree: true,  // Use spatial tree for faster collision detection
            },
          },
          scene: new CustomGameScene(sceneConfig),
          render: {
            pixelArt: true,
            antialias: false,
            transparent: true,  // Render transparent
            roundPixels: true,  // Round pixel coordinates for crisp rendering
          },
        }

        console.log('[Phaser Init] Game config:', {
          width: gameConfig.width,
          height: gameConfig.height,
          parent: gameConfig.parent,
          mapPath: config.mapPath
        })
        
        // Verify container exists and is visible
        const container = document.getElementById(config.containerSelector || 'phaser-game-container')
        if (container) {
          console.log('[Phaser Init] Container element FOUND')
          console.log('[Phaser Init] Container dimensions:', {
            width: container.offsetWidth,
            height: container.offsetHeight,
            display: window.getComputedStyle(container).display,
            visibility: window.getComputedStyle(container).visibility,
          })
        } else {
          console.error('[Phaser Init] Container element NOT FOUND - game will fail')
        }
        
        gameRef.current = new Phaser.Game(gameConfig)
        console.log('[Phaser Init] Phaser instance created')
        
        // Check canvas after creation
        setTimeout(() => {
          const canvas = document.querySelector('canvas')
          if (canvas) {
            console.log('[Phaser Canvas] Canvas found:', {
              width: canvas.width,
              height: canvas.height,
              displayWidth: canvas.style.width,
              displayHeight: canvas.style.height,
              parentElement: canvas.parentElement?.id,
              display: window.getComputedStyle(canvas).display,
              visibility: window.getComputedStyle(canvas).visibility,
            })
          } else {
            console.error('[Phaser Canvas] No canvas found in DOM')
          }
        }, 100)

        // Wait for scene to signal it's ready (after async create completes)
        if (gameRef.current) {
          // Try multiple ways to detect scene readiness
          const checkSceneReady = () => {
            const scene = gameRef.current?.scene.getScene('GameScene') as GameScene | undefined
            if (scene) {
              console.log('[Phaser Scene] Scene found and initialized')
              sceneRef.current = scene
              setIsReady(true)
              return true
            }
            return false
          }

          // First try: listen for the scene's custom ready signal
          const sceneReadyHandler = () => {
            console.log('[Phaser Scene] Scene fully initialized (custom event)')
            checkSceneReady()
          }

          // Setup event listeners with multiple fallbacks
          gameRef.current.events.once('ready', () => {
            console.log('[Phaser Ready] Game ready event received')
            if (!checkSceneReady()) {
              // If scene not found, wait a bit more
              setTimeout(checkSceneReady, 500)
            }
          })

          // Also listen for boot completion
          gameRef.current.events.once('resumed', () => {
            console.log('[Phaser] Game resumed')
            checkSceneReady()
          })

          // Timeout fallback - just mark as ready after 3 seconds
          const timeoutId = setTimeout(() => {
            console.log('[Phaser Scene] Using fallback ready signal (timeout)')
            if (!isReady) {
              checkSceneReady()
            }
          }, 3000)

          return () => {
            clearTimeout(timeoutId)
          }
        }
      } catch (err) {
        console.error('[Phaser Error]', err)
        setError(err instanceof Error ? err.message : 'Failed to initialize Phaser game')
      }
    }

    initGame()

    return () => {
      // Cleanup
      console.log('[Phaser Cleanup] Destroying game instance')
      if (gameRef.current) {
        gameRef.current.destroy(true)
        gameRef.current = null
      }
    }
  }, [config.mapPath, config.playerSpeed, config.containerSelector, config.width, config.height])

  const getGameState = (): GameState | null => {
    return sceneRef.current?.getGameState() || null
  }

  const setPlayerPosition = (x: number, y: number) => {
    sceneRef.current?.setPlayerPosition(x, y)
  }

  const getPlayer = () => {
    return sceneRef.current?.getPlayer() || null
  }

  const disableBarrier = () => {
    try {
      console.log('[React Hook] Calling disableBarrier on Phaser scene...')
      if (sceneRef.current) {
        console.log('[React Hook] Scene reference found, calling disableBarrier()')
        sceneRef.current.disableBarrier()
        console.log('[React Hook] disableBarrier() completed successfully')
      } else {
        console.warn('[React Hook] Scene reference not found - scene may not be ready yet')
      }
    } catch (error) {
      console.error('[React Hook] Error calling disableBarrier:', error)
    }
  }

  return {
    isReady,
    error,
    game: gameRef.current,
    scene: sceneRef.current,
    getGameState,
    setPlayerPosition,
    getPlayer,
    disableBarrier,
  }
}
