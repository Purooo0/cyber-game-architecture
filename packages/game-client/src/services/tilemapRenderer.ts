/**
 * Tilemap Renderer
 * Renders Tiled maps on canvas
 */

import type { TiledMap, TileLayer, Tileset } from './mapLoader'

export interface TilesetImage {
  image: HTMLImageElement
  firstgid: number
  tileWidth: number
  tileHeight: number
  columns: number
}

export class TilemapRenderer {
  private loadedTilesets: Map<number, TilesetImage> = new Map()
  private tileCache: Map<string, HTMLCanvasElement> = new Map()
  private assetsPath: string

  constructor(assetsPath: string = '/') {
    this.assetsPath = assetsPath
  }

  async loadTileset(tileset: Tileset, tileWidth: number, tileHeight: number): Promise<TilesetImage> {
    // For embedded tilesets (has image property)
    if (tileset.image) {
      let imagePath = tileset.image
      // Normalize path - remove ../ and extra slashes
      imagePath = imagePath.replace(/\.\.\//g, '').replace(/\\/g, '/')
      if (!imagePath.startsWith('/')) {
        imagePath = '/' + imagePath
      }
      
      const image = await this.loadImage(imagePath)
      const columns = tileset.columns || Math.floor(image.width / (tileset.tilewidth || tileWidth))

      return {
        image,
        firstgid: tileset.firstgid,
        tileWidth: tileset.tilewidth || tileWidth,
        tileHeight: tileset.tileheight || tileHeight,
        columns,
      }
    }
    
    // For external tilesets (has source property)
    if (tileset.source) {
      const imagePath = tileset.source.replace(/\.tsx$/, '.png')
      const fullPath = `${this.assetsPath}${imagePath}`
      const image = await this.loadImage(fullPath)
      
      // Try to load tileset metadata from .tsx file
      let finalTileWidth = tileset.tilewidth || tileWidth
      let finalTileHeight = tileset.tileheight || tileHeight
      let finalColumns = tileset.columns || Math.floor(image.width / finalTileWidth)

      // If tilewidth/tileheight not in tileset object, try to parse from .tsx file
      if (!tileset.tilewidth || !tileset.tileheight) {
        try {
          const tsxPath = `${this.assetsPath}${tileset.source}`
          const tsxData = await this.loadTsxMetadata(tsxPath)
          if (tsxData) {
            finalTileWidth = tsxData.tilewidth || finalTileWidth
            finalTileHeight = tsxData.tileheight || finalTileHeight
            finalColumns = tsxData.columns || Math.floor(image.width / finalTileWidth)
          }
        } catch (error) {
          // Fall back to default if parsing fails
          console.warn(`Failed to parse .tsx metadata for ${tileset.source}`)
        }
      }

      return {
        image,
        firstgid: tileset.firstgid,
        tileWidth: finalTileWidth,
        tileHeight: finalTileHeight,
        columns: finalColumns,
      }
    }

    throw new Error(`Tileset has neither 'source' nor 'image' property`)
  }

  private async loadTsxMetadata(tsxPath: string): Promise<{ tilewidth: number; tileheight: number; columns: number } | null> {
    try {
      const response = await fetch(tsxPath)
      if (!response.ok) return null

      const text = await response.text()
      
      // Parse XML to extract tilewidth, tileheight, columns
      const tilewidthMatch = text.match(/tilewidth="(\d+)"/)
      const tileheightMatch = text.match(/tileheight="(\d+)"/)
      const columnsMatch = text.match(/columns="(\d+)"/)

      if (tilewidthMatch && tileheightMatch) {
        return {
          tilewidth: parseInt(tilewidthMatch[1]),
          tileheight: parseInt(tileheightMatch[1]),
          columns: columnsMatch ? parseInt(columnsMatch[1]) : 1,
        }
      }

      return null
    } catch (error) {
      console.warn(`Error loading .tsx metadata from ${tsxPath}:`, error)
      return null
    }
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.src = src
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
    })
  }

  async prepareTilesets(map: TiledMap): Promise<void> {
    for (const tileset of map.tilesets) {
      try {
        const tilesetData = await this.loadTileset(tileset, map.tilewidth, map.tileheight)
        this.loadedTilesets.set(tileset.firstgid, tilesetData)
      } catch (error) {
        // Log error but continue loading other tilesets
        const tilesetName = tileset.name || tileset.source || tileset.image || `tileset #${tileset.firstgid}`
        console.warn(`Skipping tileset '${tilesetName}': ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }

  getTilesetForGid(gid: number): TilesetImage | null {
    let result: TilesetImage | null = null
    for (const [firstgid, tileset] of this.loadedTilesets) {
      if (gid >= firstgid) {
        result = tileset
      } else {
        break
      }
    }
    return result
  }

  renderTileLayer(
    ctx: CanvasRenderingContext2D,
    layer: TileLayer,
    map: TiledMap,
    opacity: number = 1,
    cameraX: number = 0,
    cameraY: number = 0,
    viewportWidth: number = 1024,
    viewportHeight: number = 768
  ): void {
    ctx.globalAlpha = layer.opacity * opacity

    // Calculate visible tile range (viewport culling optimization)
    const startX = Math.max(0, Math.floor(cameraX / map.tilewidth))
    const startY = Math.max(0, Math.floor(cameraY / map.tileheight))
    const endX = Math.min(layer.width, Math.ceil((cameraX + viewportWidth) / map.tilewidth) + 1)
    const endY = Math.min(layer.height, Math.ceil((cameraY + viewportHeight) / map.tileheight) + 1)

    // Only render visible tiles (massive performance boost)
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const gid = layer.data[y * layer.width + x]
        if (gid === 0) continue

        const tileset = this.getTilesetForGid(gid)
        if (!tileset) continue

        const localGid = gid - tileset.firstgid
        const sourceX = (localGid % tileset.columns) * tileset.tileWidth
        const sourceY = Math.floor(localGid / tileset.columns) * tileset.tileHeight

        // Grid position is always based on map's base tile size
        const gridX = x * map.tilewidth
        const gridY = y * map.tileheight

        // For larger tiles, render them at grid position (bottom-left anchor)
        // Custom-sized tiles like wardrobe (312x286) and plant (144x156) are placed
        // at their grid coordinates but render with their actual dimensions
        const destX = gridX
        const destY = gridY + (map.tileheight - tileset.tileHeight)

        ctx.drawImage(
          tileset.image,
          sourceX,
          sourceY,
          tileset.tileWidth,
          tileset.tileHeight,
          destX,
          destY,
          tileset.tileWidth,
          tileset.tileHeight
        )
      }
    }

    ctx.globalAlpha = 1
  }

  renderMap(
    ctx: CanvasRenderingContext2D,
    map: TiledMap,
    opacity: number = 1,
    cameraX: number = 0,
    cameraY: number = 0,
    viewportWidth: number = 1024,
    viewportHeight: number = 768
  ): void {
    const tileLayers = map.layers.filter(layer => layer.type === 'tilelayer')

    for (const layer of tileLayers) {
      if (layer.visible) {
        this.renderTileLayer(ctx, layer, map, opacity, cameraX, cameraY, viewportWidth, viewportHeight)
      }
    }
  }

  getMapPixelWidth(map: TiledMap): number {
    return map.width * map.tilewidth
  }

  getMapPixelHeight(map: TiledMap): number {
    return map.height * map.tileheight
  }

  getTileAtPixelCoord(x: number, y: number, tileWidth: number, tileHeight: number): { x: number; y: number } {
    return {
      x: Math.floor(x / tileWidth),
      y: Math.floor(y / tileHeight),
    }
  }

  getPixelCoordFromTile(tileX: number, tileY: number, tileWidth: number, tileHeight: number): { x: number; y: number } {
    return {
      x: tileX * tileWidth,
      y: tileY * tileHeight,
    }
  }

  clear(): void {
    this.loadedTilesets.clear()
    this.tileCache.clear()
  }
}
