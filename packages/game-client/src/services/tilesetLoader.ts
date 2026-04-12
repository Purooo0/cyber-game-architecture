/**
 * Tileset Loader Service
 * Loads external .tsx tileset files and embeds them into tilemap data
 */

export interface EmbeddedTileset {
  firstgid: number
  name: string
  tilewidth: number
  tileheight: number
  tilecount: number
  columns: number
  image: string
  imagewidth: number
  imageheight: number
  margin: number
  spacing: number
}

/**
 * Parse .tsx file (XML format) to extract tileset metadata
 */
export async function loadTilesetFromTsx(tilesetPath: string): Promise<EmbeddedTileset | null> {
  try {
    const response = await fetch(tilesetPath)

    if (!response.ok) {
      console.warn(`Failed to load tileset file: ${tilesetPath} (${response.status})`)
      return null
    }

    const contentType = response.headers.get('content-type') || ''
    const xmlText = await response.text()

    // If Vercel/SPA rewrite ever serves HTML for an .xml/.tsx request, avoid DOMParser weirdness.
    if (contentType.includes('text/html') || /^\s*<!doctype html/i.test(xmlText) || /^\s*<html/i.test(xmlText)) {
      console.warn(`Tileset request returned HTML instead of XML: ${tilesetPath}`, {
        contentType,
        preview: xmlText.substring(0, 120),
      })
      return null
    }

    if (!xmlText || xmlText.trim().length === 0) {
      console.warn(`Tileset file is empty: ${tilesetPath}`)
      return null
    }

    // Parse XML
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml')

    if (xmlDoc.documentElement.tagName === 'parsererror') {
      console.warn(`Failed to parse tileset XML: ${tilesetPath}`, {
        contentType,
        preview: xmlText.substring(0, 200),
      })
      return null
    }

    // Extract tileset data
    const tilesetElement = xmlDoc.querySelector('tileset')
    if (!tilesetElement) {
      console.warn(`No tileset element found in: ${tilesetPath}`)
      return null
    }

    const imageElement = xmlDoc.querySelector('image')
    if (!imageElement) {
      console.warn(`No image element found in: ${tilesetPath}`)
      return null
    }

    const name = tilesetElement.getAttribute('name') || 'unknown'
    const tilewidth = parseInt(tilesetElement.getAttribute('tilewidth') || '0')
    const tileheight = parseInt(tilesetElement.getAttribute('tileheight') || '0')
    const tilecount = parseInt(tilesetElement.getAttribute('tilecount') || '0')
    const columns = parseInt(tilesetElement.getAttribute('columns') || '0')
    const margin = parseInt(tilesetElement.getAttribute('margin') || '0')
    const spacing = parseInt(tilesetElement.getAttribute('spacing') || '0')

    const imageSource = imageElement.getAttribute('source') || ''
    const imagewidth = parseInt(imageElement.getAttribute('width') || '0')
    const imageheight = parseInt(imageElement.getAttribute('height') || '0')

    // Build image path relative to tileset file location
    const tilesetDir = tilesetPath.substring(0, tilesetPath.lastIndexOf('/'))
    const imagePath = `${tilesetDir}/${imageSource}`

    return {
      firstgid: 0, // Will be set when adding to map
      name,
      tilewidth,
      tileheight,
      tilecount,
      columns,
      image: imagePath,
      imagewidth,
      imageheight,
      margin,
      spacing,
    }
  } catch (error) {
    console.error(`Error loading tileset: ${tilesetPath}`, error)
    return null
  }
}

/**
 * Load all external tilesets from a Tiled map and convert to embedded format
 * Handle tileset dengan dimensi non-standar dengan logging khusus
 */
export async function loadAndEmbedTilesets(mapData: any): Promise<any> {
  const modifiedMap = JSON.parse(JSON.stringify(mapData)) // Deep clone

  const embeddedTilesets: EmbeddedTileset[] = []

  // Load each external tileset
  for (const tileset of mapData.tilesets) {
    if (tileset.source) {
      // External tileset
      const tilesetPath = '/' + tileset.source
      const embedded = await loadTilesetFromTsx(tilesetPath)
      
      if (embedded) {
        embedded.firstgid = tileset.firstgid
        embeddedTilesets.push(embedded)
        
        console.log(`✓ Loaded external tileset: ${embedded.name} (firstgid: ${tileset.firstgid})`)
      }
    } else if (tileset.image) {
      // Already embedded
      embeddedTilesets.push(tileset)
    }
  }

  // Replace tilesets in map data
  modifiedMap.tilesets = embeddedTilesets

  return modifiedMap
}

/**
 * Load tileset images into a Phaser scene's texture manager
 * @param scene Phaser scene instance
 * @param tilesets Array of tileset data with image paths
 */
export async function loadTilesetImagesIntoPhaserScene(
  scene: any,
  tilesets: EmbeddedTileset[]
): Promise<void> {
  return new Promise((resolve) => {
    let loadedCount = 0
    const totalToLoad = tilesets.length

    if (totalToLoad === 0) {
      resolve()
      return
    }

    for (const tileset of tilesets) {
      // Load image into Phaser texture manager
      scene.load.image(tileset.name, tileset.image)
    }

    // Wait for all images to load
    scene.load.once('complete', () => {
      console.log(`✓ All ${totalToLoad} tileset images loaded into texture manager`)
      resolve()
    })

    scene.load.once('loaderror', (file: any) => {
      console.warn(`Failed to load tileset image: ${file.key}`)
      loadedCount++
      if (loadedCount >= totalToLoad) {
        resolve()
      }
    })

    // Start loading
    scene.load.start()
  })
}
