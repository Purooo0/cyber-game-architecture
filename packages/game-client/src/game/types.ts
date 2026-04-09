/**
 * Core Game Engine Types
 * Defines all types untuk game engine
 */

export interface Position {
  x: number
  y: number
}

export interface Dimensions {
  width: number
  height: number
}

export interface Player extends Position, Dimensions {
  speed: number
  direction: 'up' | 'down' | 'left' | 'right' | 'idle'
  isMoving: boolean
}

export interface InteractableObject extends Position, Dimensions {
  id: string
  type: 'door' | 'npc' | 'item' | 'phone' | 'computer'
  label: string
  interactionRange: number
  onInteract?: () => void
}

export interface GameScene {
  id: string
  name: string
  width: number
  height: number
  backgroundColor: string
  objects: InteractableObject[]
  onEnter?: () => void
  onExit?: () => void
}

export interface GameState {
  currentScene: string
  playerPos: Position
  inventory: string[]
  dialogs: Map<string, string>
  completedActions: Set<string>
}

export interface KeyState {
  [key: string]: boolean
}

export interface CanvasRenderContext {
  ctx: CanvasRenderingContext2D
  canvas: HTMLCanvasElement
  deltaTime: number
}

export interface GameEngineConfig {
  canvasWidth: number
  canvasHeight: number
  playerSpeed: number
  fps: number
}

// Map and Tilemap related types
export interface CollisionBox {
  x: number
  y: number
  width: number
  height: number
  name: string
}

export interface TriggerBox {
  x: number
  y: number
  width: number
  height: number
  name: string
  action?: string
  once?: boolean
  triggered?: boolean
  screenX?: number  // Optional: screen-relative X coordinate for UI positioning
  screenY?: number  // Optional: screen-relative Y coordinate for UI positioning
}

export interface InteractiveObject {
  x: number
  y: number
  width: number
  height: number
  name: string
  event?: string
  ui?: string
}

export interface MapConfig {
  mapPath: string
  canvasWidth: number
  canvasHeight: number
  playerSpawnX?: number
  playerSpawnY?: number
}

