/**
 * Enhanced Game Engine Hook with   const playerRef = useRef<Player>({
    x: 0, // Will be set from map spawn point
    y: 0, // Will be set from map spawn point
    width: 32, // Base sprite width (32×32 frame)
    height: 32, // Base sprite height (32×32 frame)
    speed: finalConfig.playerSpeed,
    direction: 'idle',
    isMoving: false,
  })rt
 * Core game loop with collision, trigger, interactive, and map rendering
 */

import { useRef, useCallback } from 'react'
import type { 
  Player, 
  GameState, 
  KeyState,
  GameEngineConfig,
  CollisionBox,
  TriggerBox,
  InteractiveObject,
} from './types'
import { TilemapRenderer } from '../services/tilemapRenderer'
import { MapLoader, type TiledMap, type MapObject } from '../services/mapLoader'
import { ObjectLayerHandler } from '../services/objectLayerHandler'
import { CharacterSpriteLoader, type CharacterFrames } from '../services/characterSpriteLoader'

const DEFAULT_CONFIG: GameEngineConfig = {
  canvasWidth: 1024,
  canvasHeight: 768,
  playerSpeed: 12,  // Increased from 6 for larger character (3x bigger = 2x faster)
  fps: 60,
}

export interface MapGameEngineConfig extends Partial<GameEngineConfig> {
  mapPath?: string
  playerWidth?: number
  playerHeight?: number
  onTrigger?: (trigger: TriggerBox) => void
  onInteract?: (interactive: InteractiveObject) => void
}

export function useMapGameEngine(config: MapGameEngineConfig = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }

  const playerRef = useRef<Player>({
    x: 0, // Will be set from map spawn point
    y: 0, // Will be set from map spawn point
    width: config.playerWidth || 32, // Base sprite width (before scaling)
    height: config.playerHeight || 51, // Base sprite height (before scaling) - FIXED: was 48, should be 51
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

  const mapRef = useRef<TiledMap | null>(null)
  const rendererRef = useRef<TilemapRenderer | null>(null)
  const collisionsRef = useRef<CollisionBox[]>([])
  const triggersRef = useRef<TriggerBox[]>([])
  const interactivesRef = useRef<InteractiveObject[]>([])
  const characterSpriteRef = useRef<CharacterSpriteLoader | null>(null)

  const lastTimeRef = useRef<number>(Date.now())
  const deltaTimeRef = useRef<number>(0)
  const frameAccumulatorRef = useRef<number>(0)
  const lastRenderTimeRef = useRef<number>(0)
  const targetFrameTimeRef = useRef<number>(16.67) // 60fps by default (16.67ms)

  /**
   * Load map and setup collisions, triggers, interactives
   */
  const loadMap = useCallback(async (mapPath: string) => {
    try {
      const map = await MapLoader.loadMap(mapPath)
      mapRef.current = map

      // Initialize renderer
      const renderer = new TilemapRenderer('/')
      await renderer.prepareTilesets(map)
      rendererRef.current = renderer

      // Extract collision boxes using ObjectLayerHandler
      collisionsRef.current = ObjectLayerHandler.getCollisionBoxes(map)

      // Extract trigger zones using ObjectLayerHandler
      triggersRef.current = ObjectLayerHandler.getTriggerBoxes(map)

      // Extract interactive objects using ObjectLayerHandler
      interactivesRef.current = ObjectLayerHandler.getInteractiveObjects(map)

      // *** CRITICAL: Set player spawn position from TMJ file ***
      const spawnPoint = ObjectLayerHandler.getPlayerSpawnPoint(map)
      if (spawnPoint) {
        playerRef.current.x = spawnPoint.x
        playerRef.current.y = spawnPoint.y
        gameStateRef.current.playerPos = { x: playerRef.current.x, y: playerRef.current.y }
        console.log(`✓ [SPAWN LOADED] Player spawned at map spawn_player: (${Math.round(spawnPoint.x)}, ${Math.round(spawnPoint.y)})`)
      } else {
        console.warn('⚠ [NO SPAWN] No spawn_player found in map, using default position (0,0)')
      }

      console.log('Map loaded:', {
        dimensions: `${map.width}x${map.height}`,
        tilesize: `${map.tilewidth}x${map.tileheight}`,
        collisions: collisionsRef.current.length,
        triggers: triggersRef.current.length,
        interactives: interactivesRef.current.length,
        spawn: spawnPoint,
      })
    } catch (error) {
      console.error('Error loading map:', error)
      throw error
    }
  }, [])

  /**
   * Load character sprite
   */
  const loadCharacterSprite = useCallback(async (spriteLoader: CharacterSpriteLoader) => {
    characterSpriteRef.current = spriteLoader
  }, [])

  /**
   * Initialize game engine
   */
  const init = useCallback(async () => {
    // Key down handler
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      keysRef.current[key] = true

      // Prevent default for arrow keys and WASD
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(key)) {
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

    // Load map if path provided
    if (config.mapPath) {
      await loadMap(config.mapPath)
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [config.mapPath, loadMap])

  /**
   * Check collision
   */
  const checkCollision = useCallback((x: number, y: number, width: number, height: number): boolean => {
    return ObjectLayerHandler.checkPointCollision(x, y, width, height, collisionsRef.current)
  }, [])

  /**
   * Move player based on input with collision
   */
  const movePlayer = useCallback(() => {
    const player = playerRef.current
    let nextX = player.x
    let nextY = player.y
    let vx = 0
    let vy = 0
    let isMoving = false

    // FIXED: Support 4-directional movement (tidak use else if)
    // Vertical movement
    if (keysRef.current['arrowup'] || keysRef.current['w']) {
      vy = -player.speed
      player.direction = 'up'
      isMoving = true
    }
    if (keysRef.current['arrowdown'] || keysRef.current['s']) {
      vy = player.speed
      player.direction = 'down'
      isMoving = true
    }

    // Horizontal movement
    if (keysRef.current['arrowleft'] || keysRef.current['a']) {
      vx = -player.speed
      player.direction = 'left'
      isMoving = true
    }
    if (keysRef.current['arrowright'] || keysRef.current['d']) {
      vx = player.speed
      player.direction = 'right'
      isMoving = true
    }

    // Priority: Horizontal > Vertical untuk animation
    if (isMoving) {
      if (vx !== 0) {
        player.direction = vx > 0 ? 'right' : 'left'
      } else if (vy !== 0) {
        player.direction = vy > 0 ? 'down' : 'up'
      }
    } else {
      player.direction = 'idle'
    }

    player.isMoving = isMoving
    nextX = player.x + vx
    nextY = player.y + vy

    // Check collision
    const hasCollision = checkCollision(nextX, nextY, player.width, player.height)
    // TEMP TEST: Disable collision to check if character can move
    // if (!hasCollision) {
    //   player.x = nextX
    //   player.y = nextY
    // }
    // Always allow movement for testing
    player.x = nextX
    player.y = nextY

    // Boundary check - clamp to map bounds with padding
    // CRITICAL FIX: Ensure player stays within bounds consistently
    if (mapRef.current && rendererRef.current) {
      const mapWidth = rendererRef.current.getMapPixelWidth(mapRef.current)
      const mapHeight = rendererRef.current.getMapPixelHeight(mapRef.current)
      // Add padding to prevent character from going outside map
      // Use proper min to ensure non-negative values
      player.x = Math.max(player.width / 2, Math.min(player.x, mapWidth - player.width / 2))
      player.y = Math.max(player.height, Math.min(player.y, mapHeight))
    } else {
      player.x = Math.max(player.width / 2, Math.min(player.x, finalConfig.canvasWidth - player.width / 2))
      player.y = Math.max(player.height, Math.min(player.y, finalConfig.canvasHeight))
    }

    gameStateRef.current.playerPos = { x: player.x, y: player.y }
  }, [checkCollision, finalConfig.canvasWidth, finalConfig.canvasHeight])

  /**
   * Check triggers
   */
  const checkTriggers = useCallback(() => {
    const player = playerRef.current
    
    const activeTriggers = ObjectLayerHandler.checkTriggers(
      player.x,
      player.y,
      player.width,
      player.height,
      triggersRef.current
    )

    for (const trigger of activeTriggers) {
      if (!trigger.triggered) {
        trigger.triggered = true
        config.onTrigger?.(trigger)
      }
    }
  }, [config])

  /**
   * Check interaction with objects (E key)
   */
  const checkInteraction = useCallback(() => {
    const player = playerRef.current
    const keys = keysRef.current

    if (!(keys['e'] || keys['enter'])) return

    const interactionRange = 50
    const nearbyInteractives = ObjectLayerHandler.checkNearbyInteractives(
      player.x,
      player.y,
      player.width,
      player.height,
      interactivesRef.current,
      interactionRange
    )

    // Interact with the first nearby interactive
    if (nearbyInteractives.length > 0) {
      config.onInteract?.(nearbyInteractives[0])
    }
  }, [config])

  /**
   * Handle canvas click to interact with objects
   * Converts mouse coordinates to world coordinates and checks for interactive objects
   */
  const handleCanvasClick = useCallback(
    (event: MouseEvent, canvas: HTMLCanvasElement) => {
      const rect = canvas.getBoundingClientRect()
      const mouseX = event.clientX - rect.left
      const mouseY = event.clientY - rect.top

      // Convert screen coordinates to world coordinates using camera
      const cameraX = playerRef.current.x - finalConfig.canvasWidth / 2
      const cameraY = playerRef.current.y - finalConfig.canvasHeight / 2
      const worldX = mouseX + cameraX
      const worldY = mouseY + cameraY

      console.log(`[INTERACT] Click at (${worldX.toFixed(2)}, ${worldY.toFixed(2)}) in world coords`)

      // Check which interactive object was clicked
      // Use a small radius for click detection (not as large as proximity range)
      const clickRadius = 30
      const clickX = worldX
      const clickY = worldY

      let hitInteractive: InteractiveObject | null = null

      for (const interactive of interactivesRef.current) {
        const interactiveBounds = {
          left: interactive.x,
          right: interactive.x + interactive.width,
          top: interactive.y,
          bottom: interactive.y + interactive.height,
        }

        // Check if click point is inside interactive bounds
        if (
          clickX >= interactiveBounds.left &&
          clickX <= interactiveBounds.right &&
          clickY >= interactiveBounds.top &&
          clickY <= interactiveBounds.bottom
        ) {
          hitInteractive = interactive
          break
        }
      }

      if (hitInteractive) {
        console.log(`[INTERACT] ✓ Click at (${worldX.toFixed(2)}, ${worldY.toFixed(2)}) hit interactive: "${hitInteractive.name}"`)
        config.onInteract?.(hitInteractive)
      } else {
        console.log(`[INTERACT] ✗ Click at (${worldX.toFixed(2)}, ${worldY.toFixed(2)}) did not hit any interactive object`)
      }
    },
    [finalConfig.canvasWidth, finalConfig.canvasHeight, config]
  )

  /**
   * Get canvas reference for click handler setup
   */
  const setupCanvasClickHandler = useCallback(
    (canvas: HTMLCanvasElement) => {
      const handleClick = (event: MouseEvent) => {
        handleCanvasClick(event, canvas)
      }

      canvas.addEventListener('click', handleClick)

      return () => {
        canvas.removeEventListener('click', handleClick)
      }
    },
    [handleCanvasClick]
  )

  // Track previous state to detect state changes
  const previousStateRef = useRef<keyof CharacterFrames>('idle')
  const hasDrawnPlayerRef = useRef<boolean>(false)

  /**
   * Draw player with sprite or fallback
   * CRITICAL: ONLY ONE INSTANCE PER FRAME!
   */
  const drawPlayer = useCallback((ctx: CanvasRenderingContext2D) => {
    // Prevent double-rendering by checking flag
    if (hasDrawnPlayerRef.current) {
      console.warn('⚠ [DUPLICATE RENDER] drawPlayer called multiple times in same frame!')
      return
    }
    hasDrawnPlayerRef.current = true

    const player = playerRef.current

    // CRITICAL: Only draw if player is actually loaded
    if (!characterSpriteRef.current) {
      console.log('⚠ [NO SPRITE] Character sprite not loaded yet')
      return
    }

    // Use character sprite
    let state: keyof CharacterFrames = 'idle'
    if (player.isMoving) {
      if (player.direction === 'up') state = 'walkUp'
      else if (player.direction === 'down') state = 'walkDown'
      else if (player.direction === 'left') state = 'walkLeft'
      else if (player.direction === 'right') state = 'walkRight'
    }

    // Reset animation when state changes
    if (previousStateRef.current !== state) {
      characterSpriteRef.current.resetAnimation()
      previousStateRef.current = state
    }

    // DEBUG: Log character render
    if (player.x % 10 === 0 && player.y % 10 === 0) {
      console.log(`[DRAW] Character at (${Math.round(player.x)}, ${Math.round(player.y)}) state=${state}`)
    }

    // Draw character sprite at player position
    // player.x and player.y adalah position dari spawn_player di TMJ
    characterSpriteRef.current.drawCharacter(ctx, player.x, player.y, state, 3)
  }, [])

  /**
   * Draw interactive objects with indicator
   */
  const drawInteractives = useCallback((ctx: CanvasRenderingContext2D) => {
    const player = playerRef.current
    const interactionRange = 50

    const nearbyInteractives = ObjectLayerHandler.checkNearbyInteractives(
      player.x,
      player.y,
      player.width,
      player.height,
      interactivesRef.current,
      interactionRange
    )

    for (const interactive of interactivesRef.current) {
      const isNear = nearbyInteractives.includes(interactive)

      // Draw interaction indicator
      ctx.strokeStyle = isNear ? '#00ff00' : 'rgba(255, 255, 0, 0.5)'
      ctx.lineWidth = 2
      ctx.strokeRect(interactive.x, interactive.y, interactive.width, interactive.height)

      // Draw "E" prompt if near
      if (isNear) {
        ctx.fillStyle = '#00ff00'
        ctx.font = 'bold 14px Arial'
        ctx.fillText('E', interactive.x + interactive.width / 2 - 6, interactive.y - 10)
      }

      // Draw label
      ctx.fillStyle = '#ffff00'
      ctx.font = '12px Arial'
      ctx.fillText(interactive.name, interactive.x, interactive.y - 22)
    }
  }, [])

  /**
   * Draw collision boxes (debug)
   */
  const drawDebugCollisions = useCallback((ctx: CanvasRenderingContext2D, debug: boolean = false) => {
    if (!debug) return

    // Draw collision boxes
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)'
    ctx.lineWidth = 1
    for (const collision of collisionsRef.current) {
      ctx.strokeRect(collision.x, collision.y, collision.width, collision.height)
    }

    // Draw trigger zones
    ctx.strokeStyle = 'rgba(0, 0, 255, 0.5)'
    for (const trigger of triggersRef.current) {
      ctx.strokeRect(trigger.x, trigger.y, trigger.width, trigger.height)
    }
  }, [])

  /**
   * Main update and render loop with FPS throttling optimization
   */
  const update = useCallback(
    (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, debug: boolean = false) => {
      // Reset player draw flag at start of frame
      hasDrawnPlayerRef.current = false

      // Calculate delta time
      const now = Date.now()
      const timeSinceLastRender = now - lastRenderTimeRef.current
      
      // FPS throttling: Skip render if not enough time has passed
      if (timeSinceLastRender < targetFrameTimeRef.current) {
        return // Skip this frame, let requestAnimationFrame call us again
      }
      
      lastRenderTimeRef.current = now
      deltaTimeRef.current = (now - lastTimeRef.current) / 1000
      lastTimeRef.current = now

      // Clear canvas
      ctx.fillStyle = '#0a0e27'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // *** CRITICAL: Set clipping region untuk canvas agar character tidak overflow ***
      ctx.save()
      ctx.beginPath()
      ctx.rect(0, 0, canvas.width, canvas.height)
      ctx.clip()
      ctx.restore()

      // Update character animation BEFORE rendering
      if (characterSpriteRef.current) {
        characterSpriteRef.current.updateAnimation(deltaTimeRef.current * 1000)
      }

      // Game logic (MUST be before rendering)
      movePlayer()
      checkTriggers()
      checkInteraction()

      // Save canvas state for viewport transformation
      ctx.save()

      // Setup viewport/camera - center on player
      let cameraX = 0
      let cameraY = 0
      
      if (mapRef.current && rendererRef.current) {
        const player = playerRef.current
        const mapWidth = rendererRef.current.getMapPixelWidth(mapRef.current)
        const mapHeight = rendererRef.current.getMapPixelHeight(mapRef.current)

        // Calculate camera position (center on player)
        // CRITICAL FIX: Use consistent anchor point (bottom-center = x, y)
        cameraX = player.x - canvas.width / 2
        cameraY = player.y - player.height / 2 - canvas.height / 2

        // Clamp camera to map bounds
        cameraX = Math.max(0, Math.min(cameraX, Math.max(0, mapWidth - canvas.width)))
        cameraY = Math.max(0, Math.min(cameraY, Math.max(0, mapHeight - canvas.height)))

        // Apply camera transform (move world in opposite direction)
        ctx.translate(-cameraX, -cameraY)

        // Render map with viewport culling (only visible tiles)
        rendererRef.current.renderMap(ctx, mapRef.current, 1, cameraX, cameraY, canvas.width, canvas.height)
      }

      // Rendering (after map, so player appears on top)
      // *** THIS IS THE ONLY PLACE drawPlayer IS CALLED ***
      drawPlayer(ctx)
      drawInteractives(ctx)
      drawDebugCollisions(ctx, debug)

      // Restore canvas state (remove viewport transform)
      ctx.restore()

      // Debug info (drawn without viewport transform, always visible)
      if (debug) {
        ctx.fillStyle = '#00ff00'
        ctx.font = 'bold 12px monospace'
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'
        ctx.shadowBlur = 4
        ctx.fillText(
          `Position: (${Math.round(playerRef.current.x)}, ${Math.round(playerRef.current.y)})`,
          10,
          20
        )
        ctx.fillText(`Direction: ${playerRef.current.direction}`, 10, 35)
        ctx.fillText(`Moving: ${playerRef.current.isMoving}`, 10, 50)
        ctx.fillText(`Collisions: ${collisionsRef.current.length}`, 10, 65)
        ctx.fillText(`Triggers: ${triggersRef.current.length}`, 10, 80)
        ctx.fillText(`Interactives: ${interactivesRef.current.length}`, 10, 95)
        ctx.fillText(`Camera: (${Math.round(cameraX)}, ${Math.round(cameraY)})`, 10, 110)
        ctx.fillText(`Frame Time: ${timeSinceLastRender.toFixed(1)}ms`, 10, 125)
        ctx.fillText(`Target FPS: ${(1000 / targetFrameTimeRef.current).toFixed(0)}`, 10, 140)
        ctx.shadowColor = 'transparent'
      }
    },
    [movePlayer, checkTriggers, checkInteraction, drawPlayer, drawInteractives, drawDebugCollisions]
  )

  /**
   * Set target FPS for throttling (useful for Chrome optimization)
   */
  const setTargetFPS = useCallback((fps: number) => {
    targetFrameTimeRef.current = 1000 / Math.max(1, fps)
    console.log(`[FPS Throttling] Target FPS set to: ${fps} (${targetFrameTimeRef.current.toFixed(2)}ms per frame)`)
  }, [])

  /**
   * Get game state
   */
  const getState = useCallback(() => gameStateRef.current, [])

  /**
   * Set player position (for testing/spawn)
   */
  const setPlayerPosition = useCallback((x: number, y: number) => {
    playerRef.current.x = x
    playerRef.current.y = y
    gameStateRef.current.playerPos = { x, y }
  }, [])

  return {
    init,
    update,
    loadMap,
    loadCharacterSprite,
    getState,
    setPlayerPosition,
    setTargetFPS,
    config: finalConfig,
    handleCanvasClick, // Expose canvas click handler
    setupCanvasClickHandler, // Expose canvas click handler setup
  }
}
