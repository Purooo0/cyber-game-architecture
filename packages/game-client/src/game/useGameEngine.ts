/**
 * Game Engine Hook
 * Core game loop, input handling, dan state management
 */

import { useRef, useCallback } from 'react'
import type { 
  Player, 
  GameState, 
  KeyState,
  GameEngineConfig,
  InteractableObject 
} from './types'

const DEFAULT_CONFIG: GameEngineConfig = {
  canvasWidth: 1024,
  canvasHeight: 768,
  playerSpeed: 4,
  fps: 60,
}

export function useGameEngine(config: Partial<GameEngineConfig> = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }

  const playerRef = useRef<Player>({
    x: finalConfig.canvasWidth / 2 - 16,
    y: finalConfig.canvasHeight / 2 - 16,
    width: 32,
    height: 32,
    speed: finalConfig.playerSpeed,
    direction: 'idle',
    isMoving: false,
  })

  const keysRef = useRef<KeyState>({})
  const gameStateRef = useRef<GameState>({
    currentScene: '',
    playerPos: { x: playerRef.current.x, y: playerRef.current.y },
    inventory: [],
    dialogs: new Map(),
    completedActions: new Set(),
  })

  const interactablesRef = useRef<InteractableObject[]>([])
  const lastTimeRef = useRef<number>(Date.now())
  const deltaTimeRef = useRef<number>(0)

  /**
   * Initialize game engine
   */
  const init = useCallback((interactables: InteractableObject[] = []) => {
    interactablesRef.current = interactables

    // Key down handler
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      keysRef.current[key] = true

      // Prevent default for arrow keys
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        e.preventDefault()
      }
    }

    // Key up handler
    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      keysRef.current[key] = false
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  /**
   * Move player based on input
   */
  const movePlayer = useCallback(() => {
    const player = playerRef.current

    if (keysRef.current['arrowup'] || keysRef.current['w']) {
      player.y -= player.speed
      player.direction = 'up'
      player.isMoving = true
    } else if (keysRef.current['arrowdown'] || keysRef.current['s']) {
      player.y += player.speed
      player.direction = 'down'
      player.isMoving = true
    } else if (keysRef.current['arrowleft'] || keysRef.current['a']) {
      player.x -= player.speed
      player.direction = 'left'
      player.isMoving = true
    } else if (keysRef.current['arrowright'] || keysRef.current['d']) {
      player.x += player.speed
      player.direction = 'right'
      player.isMoving = true
    } else {
      player.isMoving = false
    }

    // Boundary check
    player.x = Math.max(0, Math.min(player.x, finalConfig.canvasWidth - player.width))
    player.y = Math.max(0, Math.min(player.y, finalConfig.canvasHeight - player.height))

    gameStateRef.current.playerPos = { x: player.x, y: player.y }
  }, [finalConfig.canvasWidth, finalConfig.canvasHeight])

  /**
   * Check interaction with objects
   */
  const checkInteraction = useCallback(() => {
    const player = playerRef.current
    const keys = keysRef.current

    if (keys['e'] || keys['enter']) {
      for (const obj of interactablesRef.current) {
        const dx = player.x - obj.x
        const dy = player.y - obj.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < obj.interactionRange) {
          obj.onInteract?.()
          break
        }
      }
    }
  }, [])

  /**
   * Draw player
   */
  const drawPlayer = useCallback((ctx: CanvasRenderingContext2D) => {
    const player = playerRef.current

    // Player shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
    ctx.beginPath()
    ctx.ellipse(player.x + player.width / 2, player.y + player.height, player.width / 2, 4, 0, 0, Math.PI * 2)
    ctx.fill()

    // Player body (simple square for now, will upgrade to sprite)
    ctx.fillStyle = '#00ff00'
    ctx.fillRect(player.x, player.y, player.width, player.height)

    // Direction indicator (arrow)
    ctx.fillStyle = '#00ccff'
    const centerX = player.x + player.width / 2
    const centerY = player.y + player.height / 2
    ctx.beginPath()

    switch (player.direction) {
      case 'up':
        ctx.moveTo(centerX, centerY - 8)
        ctx.lineTo(centerX - 4, centerY - 2)
        ctx.lineTo(centerX + 4, centerY - 2)
        break
      case 'down':
        ctx.moveTo(centerX, centerY + 8)
        ctx.lineTo(centerX - 4, centerY + 2)
        ctx.lineTo(centerX + 4, centerY + 2)
        break
      case 'left':
        ctx.moveTo(centerX - 8, centerY)
        ctx.lineTo(centerX - 2, centerY - 4)
        ctx.lineTo(centerX - 2, centerY + 4)
        break
      case 'right':
        ctx.moveTo(centerX + 8, centerY)
        ctx.lineTo(centerX + 2, centerY - 4)
        ctx.lineTo(centerX + 2, centerY + 4)
        break
    }

    ctx.closePath()
    ctx.fill()
  }, [])

  /**
   * Draw interactable objects
   */
  const drawInteractables = useCallback((ctx: CanvasRenderingContext2D) => {
    const player = playerRef.current

    for (const obj of interactablesRef.current) {
      const dx = player.x - obj.x
      const dy = player.y - obj.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      const isNear = distance < obj.interactionRange

      // Object colors by type
      let color = '#ff0099'
      switch (obj.type) {
        case 'door':
          color = '#8b4513'
          break
        case 'npc':
          color = '#ffff00'
          break
        case 'item':
          color = '#ff6600'
          break
        case 'phone':
          color = '#0099ff'
          break
        case 'computer':
          color = '#00ff99'
          break
      }

      // Draw object
      ctx.fillStyle = color
      ctx.fillRect(obj.x, obj.y, obj.width, obj.height)

      // Interaction indicator if near
      if (isNear) {
        ctx.strokeStyle = '#00ff00'
        ctx.lineWidth = 2
        ctx.strokeRect(obj.x - 2, obj.y - 2, obj.width + 4, obj.height + 4)

        // Draw "E" prompt
        ctx.fillStyle = '#00ff00'
        ctx.font = 'bold 12px Arial'
        ctx.fillText('E', obj.x + obj.width / 2 - 4, obj.y - 8)
      }

      // Draw label
      ctx.fillStyle = '#ffffff'
      ctx.font = '10px Arial'
      ctx.fillText(obj.label, obj.x, obj.y - 2)
    }
  }, [])

  /**
   * Main update loop
   */
  const update = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    // Calculate delta time
    const now = Date.now()
    deltaTimeRef.current = (now - lastTimeRef.current) / 1000
    lastTimeRef.current = now

    // Clear canvas
    ctx.fillStyle = '#0a0e27'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw grid background (optional)
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.05)'
    ctx.lineWidth = 1
    for (let x = 0; x < canvas.width; x += 32) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvas.height)
      ctx.stroke()
    }
    for (let y = 0; y < canvas.height; y += 32) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }

    // Game logic
    movePlayer()
    checkInteraction()

    // Rendering
    drawInteractables(ctx)
    drawPlayer(ctx)

    // Debug info
    ctx.fillStyle = '#00ff00'
    ctx.font = '12px monospace'
    ctx.fillText(`Position: (${Math.round(playerRef.current.x)}, ${Math.round(playerRef.current.y)})`, 10, 20)
    ctx.fillText(`Direction: ${playerRef.current.direction}`, 10, 35)
    ctx.fillText(`Objects: ${interactablesRef.current.length}`, 10, 50)
  }, [movePlayer, checkInteraction, drawPlayer, drawInteractables])

  /**
   * Set scene
   */
  const setScene = useCallback((sceneName: string) => {
    gameStateRef.current.currentScene = sceneName
  }, [])

  /**
   * Get game state
   */
  const getState = useCallback(() => gameStateRef.current, [])

  /**
   * Update interactables
   */
  const setInteractables = useCallback((objs: InteractableObject[]) => {
    interactablesRef.current = objs
  }, [])

  return {
    init,
    update,
    setScene,
    getState,
    setInteractables,
    config: finalConfig,
  }
}
