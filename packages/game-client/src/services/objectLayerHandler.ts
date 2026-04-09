/**
 * Object Layer Handler
 * Manages collision, trigger, interactive, and spawn layers from Tiled maps
 */

import type { TiledMap, MapObject } from './mapLoader'
import { MapLoader } from './mapLoader'
import type { CollisionBox, TriggerBox, InteractiveObject } from '../game/types'

export interface SpawnPoint {
  id: string
  x: number
  y: number
}

export class ObjectLayerHandler {
  /**
   * Extract all collision boxes from Collision layer
   */
  static getCollisionBoxes(map: TiledMap): CollisionBox[] {
    const collisionLayer = MapLoader.getCollisionLayer(map)
    if (!collisionLayer) return []

    return collisionLayer.objects.map(obj => ({
      x: obj.x,
      y: obj.y,
      width: obj.width,
      height: obj.height,
      name: obj.name || '',
    }))
  }

  /**
   * Extract all trigger zones from Trigger layer
   */
  static getTriggerBoxes(map: TiledMap): TriggerBox[] {
    const triggerLayer = MapLoader.getTriggerLayer(map)
    if (!triggerLayer) return []

    return triggerLayer.objects.map(obj => ({
      x: obj.x,
      y: obj.y,
      width: obj.width,
      height: obj.height,
      name: obj.name || '',
      action: MapLoader.getObjectProperty(obj, 'action'),
      once: MapLoader.getObjectProperty(obj, 'once') ?? false,
      triggered: false,
    }))
  }

  /**
   * Extract all interactive objects from Interactive layer AND phone tile layer
   */
  static getInteractiveObjects(map: TiledMap): InteractiveObject[] {
    const interactives: InteractiveObject[] = []

    // Get interactive objects from Interactive layer
    const interactiveLayer = MapLoader.getInteractiveLayer(map)
    if (interactiveLayer) {
      interactives.push(...interactiveLayer.objects.map(obj => ({
        x: obj.x,
        y: obj.y,
        width: obj.width,
        height: obj.height,
        name: obj.name || '',
        event: MapLoader.getObjectProperty(obj, 'event'),
        ui: MapLoader.getObjectProperty(obj, 'ui'),
      })))
    }

    // Get phone tiles from phone tile layer and add as interactives
    const phoneTiles = MapLoader.getPhoneTilesAsInteractives(map)
    if (phoneTiles.length > 0) {
      console.log(`Found ${phoneTiles.length} phone tiles in phone layer`)
      interactives.push(...phoneTiles.map(tile => ({
        x: tile.x,
        y: tile.y,
        width: tile.width,
        height: tile.height,
        name: tile.name,
        event: 'phone_menu',
        ui: 'phone_popup',
      })))
    }

    return interactives
  }

  /**
   * Get player spawn point
   */
  static getPlayerSpawnPoint(map: TiledMap): SpawnPoint | null {
    const spawnLayer = MapLoader.getSpawnLayer(map)
    if (!spawnLayer) return null

    // Try multiple spawn point names for different maps
    // - Bedroom map uses "player_spawn"
    // - Classroom map uses "player_spawn_class"
    // - Cafe map uses "spawn_player3"
    let playerSpawn = spawnLayer.objects.find(obj => obj.name === 'player_spawn')
    if (!playerSpawn) {
      playerSpawn = spawnLayer.objects.find(obj => obj.name === 'player_spawn_class')
    }
    if (!playerSpawn) {
      playerSpawn = spawnLayer.objects.find(obj => obj.name === 'spawn_player3')
    }
    if (!playerSpawn) return null

    return {
      id: MapLoader.getObjectProperty(playerSpawn, 'id') || 'player',
      x: playerSpawn.x,
      y: playerSpawn.y,
    }
  }

  /**
   * Get all spawn points from Spawn layer
   */
  static getAllSpawnPoints(map: TiledMap): SpawnPoint[] {
    const spawnLayer = MapLoader.getSpawnLayer(map)
    if (!spawnLayer) return []

    return spawnLayer.objects.map(obj => ({
      id: MapLoader.getObjectProperty(obj, 'id') || obj.name || `spawn_${obj.id}`,
      x: obj.x,
      y: obj.y,
    }))
  }

  /**
   * Check if a point collides with any collision box
   */
  static checkPointCollision(
    x: number,
    y: number,
    width: number,
    height: number,
    collisions: CollisionBox[]
  ): boolean {
    const bounds = {
      left: x,
      right: x + width,
      top: y,
      bottom: y + height,
    }

    for (const collision of collisions) {
      const collisionBounds = {
        left: collision.x,
        right: collision.x + collision.width,
        top: collision.y,
        bottom: collision.y + collision.height,
      }

      // AABB collision detection
      if (
        bounds.left < collisionBounds.right &&
        bounds.right > collisionBounds.left &&
        bounds.top < collisionBounds.bottom &&
        bounds.bottom > collisionBounds.top
      ) {
        return true
      }
    }

    return false
  }

  /**
   * Check which triggers a point is in
   */
  static checkTriggers(
    x: number,
    y: number,
    width: number,
    height: number,
    triggers: TriggerBox[]
  ): TriggerBox[] {
    const bounds = {
      left: x,
      right: x + width,
      top: y,
      bottom: y + height,
    }

    const activetriggers: TriggerBox[] = []

    for (const trigger of triggers) {
      if (trigger.once && trigger.triggered) continue

      const triggerBounds = {
        left: trigger.x,
        right: trigger.x + trigger.width,
        top: trigger.y,
        bottom: trigger.y + trigger.height,
      }

      if (
        bounds.left < triggerBounds.right &&
        bounds.right > triggerBounds.left &&
        bounds.top < triggerBounds.bottom &&
        bounds.bottom > triggerBounds.top
      ) {
        activetriggers.push(trigger)
      }
    }

    return activetriggers
  }

  /**
   * Check if point is near any interactive object
   */
  static checkNearbyInteractives(
    x: number,
    y: number,
    width: number,
    height: number,
    interactives: InteractiveObject[],
    range: number = 50
  ): InteractiveObject[] {
    const centerX = x + width / 2
    const centerY = y + height / 2

    const nearby: InteractiveObject[] = []

    for (const interactive of interactives) {
      const interactiveCenterX = interactive.x + interactive.width / 2
      const interactiveCenterY = interactive.y + interactive.height / 2

      const dx = centerX - interactiveCenterX
      const dy = centerY - interactiveCenterY
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < range + Math.max(interactive.width, interactive.height) / 2) {
        nearby.push(interactive)
      }
    }

    return nearby
  }
}
