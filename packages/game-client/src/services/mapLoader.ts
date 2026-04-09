/**
 * Map Loader Service
 * Loads and parses Tiled TMJ map files
 */

export interface TileLayer {
  id: number
  name: string
  type: 'tilelayer'
  data: number[]
  width: number
  height: number
  visible: boolean
  opacity: number
}

export interface MapObject {
  id: number
  name: string
  x: number
  y: number
  width: number
  height: number
  visible: boolean
  rotation: number
  type: string
  properties?: Array<{
    name: string
    type: string
    value: any
  }>
  point?: boolean
}

export interface ObjectLayer {
  id: number
  name: string
  type: 'objectgroup'
  objects: MapObject[]
  visible: boolean
  opacity: number
}

export interface Tileset {
  firstgid: number
  source?: string
  // For embedded tilesets
  image?: string
  tilewidth?: number
  tileheight?: number
  tilecount?: number
  columns?: number
  name?: string
}

export interface TiledMap {
  version: string
  tiledversion: string
  orientation: string
  renderorder: string
  width: number
  height: number
  tilewidth: number
  tileheight: number
  layers: (TileLayer | ObjectLayer)[]
  tilesets: Tileset[]
}

export class MapLoader {
  static async loadMap(mapPath: string): Promise<TiledMap> {
    try {
      let path = mapPath
      if (!path.startsWith('/')) {
        path = '/' + path
      }

      console.log('Loading map from:', path)
      const response = await fetch(path)
      
      if (!response.ok) {
        throw new Error(`Failed to load map: ${response.status} ${response.statusText}`)
      }
      
      const text = await response.text()
      console.log('Map response received, length:', text.length, 'first 100 chars:', text.substring(0, 100))
      
      // Try to parse as JSON
      try {
        const mapData: TiledMap = JSON.parse(text)
        console.log('Map loaded successfully:', { width: mapData.width, height: mapData.height, layers: mapData.layers.length })
        return mapData
      } catch (parseError) {
        console.error('Failed to parse map JSON. Full response:', text)
        throw new Error(`Failed to parse map JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error loading map:', error)
      throw error
    }
  }

  static getLayerByName(map: TiledMap, name: string): TileLayer | ObjectLayer | null {
    return map.layers.find(layer => layer.name === name) || null
  }

  static getCollisionLayer(map: TiledMap): ObjectLayer | null {
    return this.getLayerByName(map, 'Collision') as ObjectLayer | null
  }

  static getTriggerLayer(map: TiledMap): ObjectLayer | null {
    return this.getLayerByName(map, 'Trigger') as ObjectLayer | null
  }

  static getInteractiveLayer(map: TiledMap): ObjectLayer | null {
    return this.getLayerByName(map, 'Interactive') as ObjectLayer | null
  }

  static getSpawnLayer(map: TiledMap): ObjectLayer | null {
    return this.getLayerByName(map, 'Spawn') as ObjectLayer | null
  }

  static getPlayerSpawn(map: TiledMap): MapObject | null {
    const spawnLayer = this.getSpawnLayer(map)
    if (!spawnLayer) return null
    return spawnLayer.objects.find(obj => obj.name === 'player_spawn') || null
  }

  static getTileLayers(map: TiledMap): TileLayer[] {
    return map.layers.filter(layer => layer.type === 'tilelayer') as TileLayer[]
  }

  static getTileGid(layer: TileLayer, x: number, y: number, width: number): number {
    return layer.data[y * width + x] || 0
  }

  static getObjectProperty(obj: MapObject, propertyName: string): any {
    if (!obj.properties) return null
    const prop = obj.properties.find(p => p.name === propertyName)
    return prop ? prop.value : null
  }

  /**
   * Extract phone tiles from "phone" tile layer and convert to interactive-like objects
   * Returns array of objects with x, y, width, height from each phone tile
   */
  static getPhoneTilesAsInteractives(map: TiledMap): Array<{
    x: number
    y: number
    width: number
    height: number
    name: string
  }> {
    const phoneLayer = this.getLayerByName(map, 'phone') as TileLayer | null
    if (!phoneLayer || phoneLayer.type !== 'tilelayer') return []

    const tileWidth = map.tilewidth
    const tileHeight = map.tileheight
    const layerWidth = phoneLayer.width
    const interactives: Array<{x: number; y: number; width: number; height: number; name: string}> = []

    // Iterate through tile data to find non-zero tiles (tiles that exist)
    for (let i = 0; i < phoneLayer.data.length; i++) {
      const tileGid = phoneLayer.data[i]
      if (tileGid !== 0) {
        // Calculate grid position
        const gridX = i % layerWidth
        const gridY = Math.floor(i / layerWidth)
        
        // Convert to pixel coordinates
        const x = gridX * tileWidth
        const y = gridY * tileHeight

        // Check if we already have this tile as an interactive (avoid duplicates)
        const exists = interactives.some(
          inter => inter.x === x && inter.y === y
        )
        if (!exists) {
          interactives.push({
            x,
            y,
            width: tileWidth,
            height: tileHeight,
            name: 'phone',
          })
        }
      }
    }

    return interactives
  }
}
