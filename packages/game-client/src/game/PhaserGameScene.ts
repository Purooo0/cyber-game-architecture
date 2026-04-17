/**
 * Phaser 3 Game Scene
 * Main game scene menggunakan Phaser framework untuk rendering, input, dan physics
 */

import Phaser from 'phaser'
import type { TiledMap } from '../services/mapLoader'
import { MapLoader, type ObjectLayer } from '../services/mapLoader'
import { ObjectLayerHandler, type SpawnPoint } from '../services/objectLayerHandler'
import { loadAndEmbedTilesets, loadTilesetImagesIntoPhaserScene } from '../services/tilesetLoader'
import { NPC, type NPCConfig } from './NPC'
import type { 
  Player, 
  GameState, 
  CollisionBox, 
  TriggerBox, 
  InteractiveObject 
} from './types'

export interface GameSceneConfig extends Phaser.Types.Scenes.SettingsConfig {
  mapPath: string
  playerSpeed?: number
  onTrigger?: (trigger: TriggerBox) => void
  onInteract?: (interactive: InteractiveObject) => void
  disableBarrier?: boolean  // Optional, defaults to false
}

export class GameScene extends Phaser.Scene {
  private mapPath: string
  private barrierCollisionBody: Phaser.Physics.Arcade.Body | null = null
  private map: TiledMap | null = null
  private tilemap: Phaser.Tilemaps.Tilemap | null = null
  private tileset!: Phaser.Tilemaps.Tileset
  private tileLayers: Phaser.Tilemaps.TilemapLayer[] = []
  private player!: Phaser.Physics.Arcade.Sprite
  private playerState: Player = {
    x: 0,
    y: 0,
    width: 256,  // 2x dari 128 (asli 32×32, ini 8x = 256×256)
    height: 256, // 2x dari 128 (asli 32×32, ini 8x = 256×256)
    speed: 3,
    direction: 'idle',
    isMoving: false,
  }
  private keysPressed: { [key: string]: boolean } = {}
  private gameState: GameState = {
    currentScene: '',
    playerPos: { x: 0, y: 0 },
    inventory: [],
    dialogs: new Map(),
    completedActions: new Set(),
  }
  private collisionsRef: CollisionBox[] = []
  private triggersRef: TriggerBox[] = []
  private interactivesRef: InteractiveObject[] = []
  private playerSpawnPoint: SpawnPoint = { id: 'spawn', x: 119.720651812438, y: 862.986365147988 }
  private onTriggerCallback?: (trigger: TriggerBox) => void
  private onInteractCallback?: (interactive: InteractiveObject) => void

  private collisionGroup!: Phaser.Physics.Arcade.StaticGroup
  private triggerGroup!: Phaser.Physics.Arcade.Group
  private interactiveGroup!: Phaser.Physics.Arcade.Group
  private npcGroup!: Phaser.Physics.Arcade.StaticGroup
  private npcs: Map<string, NPC> = new Map()
  
  // NEW: Track active triggers for continuous proximity detection
  private activeTriggers: Set<string> = new Set()
  // NEW: Track active interactive overlaps (for E indicator on interactive objects)
  private activeInteractiveOverlaps: Set<string> = new Set()

  constructor(config: GameSceneConfig) {
    super(config)
    this.mapPath = config.mapPath
    this.onTriggerCallback = config.onTrigger
    this.onInteractCallback = config.onInteract
  }

  preload() {
    // Preload character sprite menggunakan Phaser spritesheet
    // Sprite: blue_haired_woman_shadow.png
    // Frame size: 32 × 32 px
    // Grid: 4 kolom × 8 baris (32 frame total)
    // Layout:
    //   Row 0: Idle/idle down (frame 0-3)
    //   Row 1: Idle left (frame 4-7)
    //   Row 2: Idle right (frame 8-11)
    //   Row 3: Idle up (frame 12-15)
    //   Row 4: Walk down (frame 16-19)
    //   Row 5: Walk left (frame 20-23)
    //   Row 6: Walk right (frame 24-27)
    //   Row 7: Walk up (frame 28-31)
    this.load.spritesheet('player', '/Player/Blue Haired Woman/blue_haired_woman_shadow.png', {
      frameWidth: 32,
      frameHeight: 32,
      margin: 0,
      spacing: 0,
    })
    console.log('✓ [PHASER] Loading blue_haired_woman_shadow.png spritesheet (32×32 per frame, 4 cols × 8 rows)')

    // Preload NPC sprites
    this.load.spritesheet('blonde_man', '/Player/Blonde Man/blonde_man_shadow.png', {
      frameWidth: 32,
      frameHeight: 32,
      margin: 0,
      spacing: 0,
    })
    console.log('✓ [PHASER] Loading blonde_man_shadow.png spritesheet (32×32 per frame, 3 cols × 7 rows)')

    // Preload tilesets dari map
    if (this.mapPath) {
      this.load.tilemapTiledJSON('tilemap', this.mapPath)
    }
    
    console.log('[Phaser] Preload phase completed')
  }

  async create() {
    try {
      console.log(`[SCENE CREATE] Loading map from: ${this.mapPath}`)
      // Load raw map data
      const rawMapData = await MapLoader.loadMap(this.mapPath)
      if (!rawMapData) {
        console.error('Failed to load map data')
        return
      }

      // Convert external tilesets to embedded format
      console.log('Converting external tilesets to embedded format...')
      const embeddedMap = await loadAndEmbedTilesets(rawMapData)
      this.map = embeddedMap
      console.log(`✓ Map prepared with ${this.map?.tilesets.length || 0} tilesets`)

      // Load tileset images ke Phaser BEFORE creating tilemap
      if (this.map && this.map.tilesets) {
        await loadTilesetImagesIntoPhaserScene(this, this.map.tilesets as any)
      }

      // Now load the modified map data into Phaser
      const tilemap = this.createTilemapFromData(this.map)
      if (!tilemap) {
        console.error('Failed to create tilemap')
        return
      }
      
      // Store tilemap reference
      this.tilemap = tilemap

      // Extract collision/trigger/interactive/spawn dari map
      this.setupObjectLayers()

      // Render tile layers menggunakan Phaser tilemap
      this.renderTileLayersForPhaser(tilemap)
      
      // Setup collision layers BEFORE creating player
      // This ensures collision is properly configured when player is created
      this.setupCollisionLayers(tilemap)

      // Create player sprite dengan physics
      this.createPlayer()

      // Create NPCs
      this.createNPCs()

      // Setup input handling
      this.setupInputHandling()

      // Setup physics collision dan overlap
      // IMPORTANT: Must be AFTER player creation
      this.setupPhysics()

      // Setup camera untuk follow player
      console.log('[INIT] 🎬 Setting up camera...')
      this.setupCamera()
      console.log('[INIT] ✅ Camera setup complete')

      console.log('Game scene created successfully')
      console.log('[Render Debug]', {
        canvasSize: this.game.canvas ? {
          width: this.game.canvas.width,
          height: this.game.canvas.height
        } : 'NO CANVAS',
        gameSize: {
          width: this.game.config.width,
          height: this.game.config.height
        },
        tileLayers: this.tileLayers.length,
        playerCreated: !!this.player,
        tilemapLayers: this.tilemap?.layers.length || 0
      })
      
      // Set initial brightness based on map type
      const isClassroomMap = this.mapPath.includes('classroom_map')
      const isCafeMap = this.mapPath.includes('cafe_map')
      
      if (isClassroomMap || isCafeMap) {
        // Classroom & Cafe maps: full brightness from start
        this.cameras.main.setAlpha(1)
        console.log('[Brightness] Classroom/Cafe map - brightness 100% (no lamp trigger logic)')
      } else {
        // Bedroom map: start at 40%, increase to 100% with lamp_trigger
        this.cameras.main.setAlpha(0.4)
        console.log('[Brightness] Bedroom map - initial brightness set to 40% (will increase to 100% at lamp_trigger)')
      }
      
      // Enable physics debug visualization for collision boxes (DISABLED for performance)
      // NOTE: Uncomment below for debugging collision boxes, but be warned this causes SIGNIFICANT lag
      // const debugGraphics = this.add.graphics()
      // this.physics.world.drawDebug = true
      // this.physics.world.debugGraphic = debugGraphics
      console.log('[Debug] Physics debug visualization DISABLED for performance optimization')
      
      // Emit a custom event to signal that the scene is fully ready
      this.events.emit('scene-ready')
    } catch (error) {
      console.error('Error in create:', error)
    }
  }

  private createTilemapFromData(mapData: any): Phaser.Tilemaps.Tilemap | null {
    try {
      const mapTileWidth = mapData.tilewidth
      const mapTileHeight = mapData.tileheight

      // Map tileset info by firstgid
      const tilesetInfoByGid = new Map<number, { name: string; tilewidth: number; tileheight: number }>()
      for (const ts of mapData.tilesets) {
        tilesetInfoByGid.set(ts.firstgid, {
          name: ts.name,
          tilewidth: ts.tilewidth,
          tileheight: ts.tileheight,
        })
      }

      const getTilesetForGid = (gid: number) => {
        let result: { firstgid: number; name: string; tilewidth: number; tileheight: number } | null = null
        for (const [firstgid, info] of tilesetInfoByGid) {
          if (gid >= firstgid) result = { firstgid, ...info }
        }
        return result
      }

      // Create tilemap using Phaser's direct data creation
      const tilemap = this.make.tilemap({
        tileWidth: mapTileWidth,
        tileHeight: mapTileHeight,
        width: mapData.width,
        height: mapData.height,
      })

      // Add all tilesets ke tilemap
      const tilesetMap = new Map<number, Phaser.Tilemaps.Tileset>()
      const tilesetNameToObject = new Map<string, Phaser.Tilemaps.Tileset>()
      
      for (const tilesetData of mapData.tilesets) {
        const tileset = tilemap.addTilesetImage(
          tilesetData.name,
          tilesetData.name,
          tilesetData.tilewidth,
          tilesetData.tileheight,
          tilesetData.margin || 0,
          tilesetData.spacing || 0,
          tilesetData.firstgid
        )
        if (tileset) {
          tilesetMap.set(tilesetData.firstgid, tileset)
          tilesetNameToObject.set(tilesetData.name, tileset)
          
          console.log(`✓ Added tileset: ${tilesetData.name} (firstgid: ${tilesetData.firstgid})`)
        } else {
          console.warn(`Failed to add tileset image: ${tilesetData.name}`)
        }
      }

      // Collect variable-size tiles (empty now since all are standard)
      const variableSizeTiles: Array<{
        gid: number
        col: number
        row: number
        tilesetName: string
        tileWidth: number
        tileHeight: number
        layerIndex: number
      }> = []

      // Add tile layers - create with ALL tilesets, use putTileAt with global GID
      let layerIndex = 0
      for (const layer of mapData.layers) {
        if (layer.type !== 'tilelayer' || !layer.data || !Array.isArray(layer.data)) continue

        // Get all tilesets as array
        const allTilesets = Array.from(tilesetNameToObject.values())
        if (allTilesets.length === 0) continue

        // Create blank layer dengan ALL tilesets
        let tilemapLayer: Phaser.Tilemaps.TilemapLayer
        try {
          tilemapLayer = tilemap.createBlankLayer(
            layer.name,
            allTilesets as any,
            0,
            0,
            layer.width,
            layer.height
          ) as Phaser.Tilemaps.TilemapLayer
        } catch (e) {
          console.warn(`Failed to create layer ${layer.name}:`, e)
          continue
        }

        // Fill layer dengan tile data - gunakan global GID
        let tilesPlaced = 0
        let tilesFailed = 0
        
        for (let i = 0; i < layer.data.length; i++) {
          const gid = layer.data[i]
          if (gid === 0) continue

          const col = i % layer.width
          const row = Math.floor(i / layer.width)
          
          try {
            // Phaser will handle GID to tileset mapping automatically
            tilemapLayer.putTileAt(gid, col, row)
            tilesPlaced++
          } catch (e) {
            tilesFailed++
          }
        }

        this.tileLayers.push(tilemapLayer)
        tilemapLayer.setDepth(layerIndex * 10)
        console.log(`✓ Created tile layer: ${layer.name} (${tilesPlaced} tiles placed, ${tilesFailed} failed)`)
        layerIndex++
      }

      console.log(`✓ Tilemap created successfully with ${tilemap.layers.length} layers`)
      return tilemap
    } catch (error) {
      console.error('Error creating tilemap from data:', error)
      return null
    }
  }

  private setupObjectLayers() {
    if (!this.map) return

    // Extract collision, trigger, interactive, dan spawn points
    this.collisionsRef = ObjectLayerHandler.getCollisionBoxes(this.map)
    this.triggersRef = ObjectLayerHandler.getTriggerBoxes(this.map)
    this.interactivesRef = ObjectLayerHandler.getInteractiveObjects(this.map)

    const spawnPoint = ObjectLayerHandler.getPlayerSpawnPoint(this.map)
    if (spawnPoint) {
      this.playerSpawnPoint = spawnPoint
    }

    console.log(`Loaded objects: ${this.collisionsRef.length} collisions, ${this.triggersRef.length} triggers, ${this.interactivesRef.length} interactives`)
  }

  private setupTilesetImages(tilemap: Phaser.Tilemaps.Tilemap) {
    // Tileset images are loaded in the preload phase
    // This method is kept for compatibility
  }

  private loadTilesetImages() {
    // Load tileset images ke Phaser texture manager
    if (!this.map) return

    // In this implementation, images are loaded on-demand
    // Phaser will handle missing textures gracefully
  }

  private renderTileLayersForPhaser(tilemap: Phaser.Tilemaps.Tilemap) {
    // Tile layers are already created in createTilemapFromData
    // This method is kept for compatibility
  }

  private createPlayer() {
    let { x, y } = this.playerSpawnPoint
    const w = this.playerState.width    // Display width = 256
    const h = this.playerState.height   // Display height = 256
    
    // Center the player inside the tile
    // Spawn point from Tiled is typically at top-left of tile
    // Center it: x + tileWidth/2, y - tileHeight/2 (to account for Tiled Y-axis)
    const tileWidth = this.map?.tilewidth || 64
    const tileHeight = this.map?.tileheight || 64
    x = x + tileWidth / 2
    y = y - tileHeight / 2
    
    console.log(`Creating player at centered spawn: (${x.toFixed(2)}, ${y.toFixed(2)}) with display size ${w}×${h}`)
    console.log(`  [Spawn adjustment] Original: (${this.playerSpawnPoint.x.toFixed(2)}, ${this.playerSpawnPoint.y.toFixed(2)}) → Centered in tile`)

    // Create player sprite
    this.player = this.physics.add.sprite(x, y, 'player', 0)
    // 1. Set display size DULU, baru origin - agar rendering benar
    this.player.setDisplaySize(w, h)
    this.player.setOrigin(0.5, 1) // Pivot di kaki (bottom-center) - konsisten untuk movement
    // Allow player to move freely across entire map without boundary constraints
    this.player.setCollideWorldBounds(false)
    this.player.setBounce(0)

    // 2. Physics body - precise collision box around character
    // Make body match character frame size + small padding for precise collision
    // This gives accurate collision and trigger detection
    const frameW = 32  // Actual frame width in spritesheet
    const frameH = 32  // Actual frame height in spritesheet
    const body = this.player.body as Phaser.Physics.Arcade.Body
    
    // Body based on frame size (32×32) with small scale to match display (256×256)
    // Scale factor: display size / frame size = 256 / 32 = 8x
    // Body size: very small and precise for feet area only
    const bodyW = frameW * 0.4  // 12.8px - very narrow width
    const bodyH = frameH * 0.25  // 8px - very small height (setengah dari sebelumnya)
    body.setSize(bodyW, bodyH, false)
    
    // Offset body to center on character
    // Center horizontally, position at feet area
    const xOffset = 10  // Geser ke kanan 2x dari setengah kotak (2 * 4px)
    const yOffset = frameH * 0.8  // Move down to feet (25.6px down)
    body.setOffset(xOffset, yOffset)
    
    console.log(`✓ Player physics body: ${bodyW.toFixed(1)}×${bodyH.toFixed(1)}px (ultra small feet collision)`)
    console.log(`  Body offset: (${xOffset.toFixed(1)}, ${yOffset.toFixed(1)}) - shifted right for foot`)



    // 3. Set render order - player harus di depan semua object
    // Gunakan Y position untuk depth (classic RPG style)
    // Semakin bawah Y, semakin di depan (depth semakin tinggi)
    // Format: depth = 1000 + player.y untuk natural layering
    this.player.setDepth(1000 + Math.round(y))
    this.player.setVisible(true)  // ENSURE VISIBLE
    console.log(`✓ Player depth set to ${1000 + Math.round(y)} (render last, sorted by Y position)`)
    console.log(`✓ Player visible: ${this.player.visible}`)

    // Create animations untuk semua states
    this.createAnimations()

    // Play idle animation
    if (this.player.anims) {
      this.player.play('idle')
      console.log('✓ Player idle animation started')
    }

    // Update player state
    this.playerState.x = x
    this.playerState.y = y
  }

  private createAnimations() {
    // Create animations menggunakan frame indices dari spritesheet 32×32 (4 cols × 8 rows)
    // Frame size: 32 × 32 px
    
    // Row 0: Idle/idle down (frame 0-3)
    this.anims.create({
      key: 'idle',
      frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
      frameRate: 10,  // Increased from 8 for faster animation
      repeat: -1,
    })

    // Row 1: Idle left (frame 4-7)
    this.anims.create({
      key: 'idleLeft',
      frames: this.anims.generateFrameNumbers('player', { start: 4, end: 7 }),
      frameRate: 10,  // Increased from 8 for faster animation
      repeat: -1,
    })

    // Row 2: Idle right (frame 8-11)
    this.anims.create({
      key: 'idleRight',
      frames: this.anims.generateFrameNumbers('player', { start: 8, end: 11 }),
      frameRate: 10,  // Increased from 8 for faster animation
      repeat: -1,
    })

    // Row 3: Idle up (frame 12-15)
    this.anims.create({
      key: 'idleUp',
      frames: this.anims.generateFrameNumbers('player', { start: 12, end: 15 }),
      frameRate: 10,  // Increased from 8 for faster animation
      repeat: -1,
    })

    // Row 4: Walk down (frame 16-19)
    this.anims.create({
      key: 'walkDown',
      frames: this.anims.generateFrameNumbers('player', { start: 16, end: 19 }),
      frameRate: 12,  // Increased from 10 for faster walk animation
      repeat: -1,
    })

    // Row 5: Walk left (frame 20-23)
    this.anims.create({
      key: 'walkLeft',
      frames: this.anims.generateFrameNumbers('player', { start: 20, end: 23 }),
      frameRate: 12,  // Increased from 10 for faster walk animation
      repeat: -1,
    })

    // Row 6: Walk right (frame 24-27)
    this.anims.create({
      key: 'walkRight',
      frames: this.anims.generateFrameNumbers('player', { start: 24, end: 27 }),
      frameRate: 12,  // Increased from 10 for faster walk animation
      repeat: -1,
    })

    // Row 7: Walk up (frame 28-31)
    this.anims.create({
      key: 'walkUp',
      frames: this.anims.generateFrameNumbers('player', { start: 28, end: 31 }),
      frameRate: 10,
      repeat: -1,
    })
  }

  private createNPCs() {
    const isClassroomMap = this.mapPath.includes('classroom_map')
    const isCafeMap = this.mapPath.includes('cafe_map')
    
    if (!isClassroomMap && !isCafeMap) {
      console.log('[NPC] Not classroom or cafe map, skipping NPC creation')
      return
    }

    // Create NPC group
    this.npcGroup = this.physics.add.staticGroup()

    if (isClassroomMap) {
      console.log('[NPC] Creating NPCs for classroom map...')
      
      // NPC1 - Blonde Man at speak_friend position
      // From classroom_map.tmj: speak_friend at x:520.195, y:313.570
      // Adjust Y upward (decrease value) to position NPC higher, center at top of bounding box
      // Frames 12-15 from blonde_man_shadow (row 3, all columns) = idle up animation
      const npc1Config: NPCConfig = {
        x: 520.195 + 56,  // Center in tile (add half of tile width ~56)
        y: 313.570 - 80,  // Move significantly upward for better visual alignment
        name: 'npc1',
        spriteKey: 'blonde_man',
        animationFrames: [12, 13, 14, 15],  // Row 3 all columns (idle up)
        width: 256,
        height: 256,
        dialogueId: 'npc1_dialogue',
      }
      
      const npc1 = new NPC(this, npc1Config)
      npc1.setDepth(5000)  // Set to very high depth to always appear above all other elements including player
      this.npcGroup.add(npc1)
      this.npcs.set('npc1', npc1)

      // NPC2 - Blonde Man (Teacher) at speak_teacher position
      // From classroom_map.tmj: speak_teacher at x:2102.685, y:313.443
      // Use blonde_man_shadow.png with row 0 only (frames 0-3) for idle down animation
      const npc2Config: NPCConfig = {
        x: 2102.685 + 56,  // Center in tile (add half of tile width ~56)
        y: 313.443 - 20,   // Slight adjustment downward for better positioning
        name: 'npc2',
        spriteKey: 'blonde_man',
        animationFrames: [0, 1, 2, 3],  // Row 0 only (idle down animation)
        width: 256,
        height: 256,
        dialogueId: 'npc2_dialogue',
      }
      
      const npc2 = new NPC(this, npc2Config)
      npc2.setDepth(25)  // Render behind desk layer (desk=50), but in front of furniture/shelf (20-30)
      this.npcGroup.add(npc2)
      this.npcs.set('npc2', npc2)
    }

    if (isCafeMap) {
      console.log('[NPC] Creating NPCs for cafe map...')
      
      // NPC3 - Blonde Man at npc3 position
      // From cafe_map.tmj Interactive layer: npc3 at x:206.712, y:990.175
      // Use blonde_man frames [12-15] for animation
      const npc3Config: NPCConfig = {
        x: 206.712,
        y: 990.175 - 100,  // Move upward (utara) by 100px
        name: 'npc3',
        spriteKey: 'blonde_man',
        animationFrames: [12, 13, 14, 15],  // Frames 12-15
        width: 256,
        height: 256,
        dialogueId: 'npc3_dialogue',
      }
      
      const npc3 = new NPC(this, npc3Config)
      npc3.setDepth(5000)  // High depth for visibility
      this.npcGroup.add(npc3)
      this.npcs.set('npc3', npc3)

      // NPC4 - Blonde Man at npc4 position
      // From cafe_map.tmj Interactive layer: npc4 at x:221.885, y:319.735
      // Use blonde_man frames [8-11] for animation
      const npc4Config: NPCConfig = {
        x: 221.885,
        y: 319.735 - 80,  // Move upward (utara) by 80px
        name: 'npc4',
        spriteKey: 'blonde_man',
        animationFrames: [8, 9, 10, 11],  // Frames 8-11
        width: 256,
        height: 256,
        dialogueId: 'npc4_dialogue',
      }
      
      const npc4 = new NPC(this, npc4Config)
      npc4.setDepth(5000)  // High depth for visibility
      this.npcGroup.add(npc4)
      this.npcs.set('npc4', npc4)
    }
    
    console.log(`✓ NPC system initialized with ${this.npcs.size} NPCs`)
  }

  private setupInputHandling() {
    // Keyboard input
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      this.keysPressed[key] = true
      this.keysPressed[event.code.toLowerCase()] = true
    })

    this.input.keyboard?.on('keyup', (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      this.keysPressed[key] = false
      this.keysPressed[event.code.toLowerCase()] = false
    })

    // Mouse click input
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.handleMouseClick(pointer)
    })
  }

  private setupCollisionLayers(tilemap: Phaser.Tilemaps.Tilemap) {
    // Configure collision on tilemap layers
    // Find all tile layers and set collision based on their tile properties
    console.log('[Collision] Setting up collision layers from tilemap...')
    
    for (const layer of this.tileLayers) {
      if (!layer || !layer.tileset) continue
      
      // Set collision by property: tiles with 'collides' property = true will be solid
      layer.setCollisionByProperty({ collides: true })
      
      console.log(`✓ Collision configured on layer: "${layer.name}" - tiles with collides:true are solid`)
    }
    
    console.log(`[Collision] Configured ${this.tileLayers.length} tile layers`)
  }

  private setupPhysics() {
    // Set physics world bounds to match tilemap size precisely
    if (!this.tilemap) return
    const mapWidthInPixels = this.tilemap.widthInPixels
    const mapHeightInPixels = this.tilemap.heightInPixels
    
    this.physics.world.setBounds(0, 0, mapWidthInPixels, mapHeightInPixels)
    console.log(`[Physics World] Bounds set to (0, 0, ${mapWidthInPixels}, ${mapHeightInPixels})`)

    // Create physics groups untuk collision, trigger, interactive
    this.collisionGroup = this.physics.add.staticGroup()
    this.triggerGroup = this.physics.add.group()
    this.interactiveGroup = this.physics.add.group()

    console.log('[Physics] Setting up collision, trigger, dan interactive...')

    // Add collision boxes ke physics static group
    for (const collision of this.collisionsRef) {
      // Check if this is the barrier collision object
      const isBarrier = collision.name && collision.name.toLowerCase() === 'barrier'

      const body = this.add.rectangle(
        collision.x + collision.width / 2,
        collision.y + collision.height / 2,
        collision.width,
        collision.height
      )
      body.setVisible(false)
      this.physics.add.existing(body, true)  // true = static
      this.collisionGroup.add(body)
      
      // Store reference to barrier if this is it
      if (isBarrier) {
        this.barrierCollisionBody = body.body as Phaser.Physics.Arcade.Body
        console.log(`✓ [BARRIER] Barrier collision created and tracked at (${collision.x.toFixed(2)}, ${collision.y.toFixed(2)})`)
      } else {
        console.log(`✓ Collision added at (${collision.x.toFixed(2)}, ${collision.y.toFixed(2)}) size ${collision.width.toFixed(2)}×${collision.height.toFixed(2)}`)
      }
    }

    // Add collider between player dan collision group
    this.physics.add.collider(this.player, this.collisionGroup)
    
    // Add collider between player dan tilemap collision layers
    // This handles collision with tiles that have collides:true property
    for (const layer of this.tileLayers) {
      if (layer) {
        this.physics.add.collider(this.player, layer)
        console.log(`✓ Tilemap collider created for layer: "${layer.name}"`)
      }
    }

    // Add trigger zones (invisible physics bodies untuk overlap detection)
    for (const trigger of this.triggersRef) {
      const triggerBody = this.add.rectangle(
        trigger.x + trigger.width / 2,
        trigger.y + trigger.height / 2,
        trigger.width,
        trigger.height
      )
      triggerBody.setVisible(false)
      this.physics.add.existing(triggerBody, false)  // false = dynamic (untuk overlap)
      triggerBody.setData('trigger', trigger)
      this.triggerGroup.add(triggerBody)
      console.log(`✓ Trigger "${trigger.name}" added at (${trigger.x.toFixed(2)}, ${trigger.y.toFixed(2)}) size ${trigger.width.toFixed(2)}×${trigger.height.toFixed(2)}`)
    }

    // Add interactive objects (invisible physics bodies untuk interaction)
    for (const interactive of this.interactivesRef) {
      const interactiveBody = this.add.rectangle(
        interactive.x + interactive.width / 2,
        interactive.y + interactive.height / 2,
        interactive.width,
        interactive.height
      )
      // DEBUG: Make visible with green outline (DISABLED for performance)
      // interactiveBody.setStrokeStyle(2, 0x00ff00, 0.7)
      // interactiveBody.setFillStyle(0x00ff00, 0.1)
      
      this.physics.add.existing(interactiveBody, false)  // false = dynamic (untuk overlap)
      interactiveBody.setData('interactive', interactive)
      this.interactiveGroup.add(interactiveBody)
      console.log(`✓ Interactive "${interactive.name}" added at (${interactive.x.toFixed(2)}, ${interactive.y.toFixed(2)}) size ${interactive.width.toFixed(2)}×${interactive.height.toFixed(2)}`)
      console.log(`  → Center: (${(interactive.x + interactive.width / 2).toFixed(2)}, ${(interactive.y + interactive.height / 2).toFixed(2)})`)
    }
    
    console.log(`[Physics] Total: ${this.collisionsRef.length} collisions, ${this.triggersRef.length} triggers, ${this.interactivesRef.length} interactives`)
    
    // Setup overlap callbacks
    this.physics.add.overlap(this.player, this.triggerGroup, this.onTriggerOverlap, undefined, this)
    this.physics.add.overlap(this.player, this.interactiveGroup, this.onInteractiveOverlap, undefined, this)
  }

  private onTriggerOverlap(player: any, triggerBody: any) {
    const trigger = triggerBody.getData('trigger') as TriggerBox
    // const spawnX = 119.720651812438
    // const spawnY = 862.986365147988
    // const distance = Math.sqrt(Math.pow(this.player.x - spawnX, 2) + Math.pow(this.player.y - spawnY, 2))
    // console.log(`[TRIGGER OVERLAP] Overlapping with "${trigger.name}" - distance from spawn: ~${distance.toFixed(0)}px`)
    
    // Handle berbagai trigger type
    if (trigger.name === 'lamp_trigger') {
      // console.log(`[TRIGGER] lamp_trigger activated - Brightness 100%`)
      this.cameras.main.setAlpha(1)
    } 
    else if (trigger.name === 'phone_trigger') {
      if (!trigger.triggered) {
        trigger.triggered = true
        // console.log(`[TRIGGER] phone_trigger activated (ONCE) - open_phone action`)
        this.onTriggerCallback?.(trigger)
      }
    }
    else if (trigger.name === 'next_scene_trigger') {
      if (!trigger.triggered) {
        trigger.triggered = true
        // console.log(`[TRIGGER] next_scene_trigger activated - initiating map transition`)
        this.onTriggerCallback?.(trigger)
      }
    }
    else if (trigger.name === 'wardrobe_trigger') {
      if (!trigger.triggered) {
        trigger.triggered = true
        console.log(`[TRIGGER] wardrobe_trigger activated (akan dihapus)`)
      }
    }
  }

  private onInteractiveOverlap(player: any, interactiveBody: any) {
    const interactive = interactiveBody.getData('interactive') as InteractiveObject
    
    // Handle special NPC interaction interactives (speak_friend, speak_teacher)
    // These should trigger proximity detection just like trigger objects
    if (interactive.name === 'speak_friend' || interactive.name === 'speak_teacher') {
      // Add to active set if not already there
      if (!this.activeInteractiveOverlaps.has(interactive.name)) {
        this.activeInteractiveOverlaps.add(interactive.name)
        console.log(`[INTERACTIVE OVERLAP] Entered ${interactive.name}`)
      }
      
      // Find the NPC associated with this interactive to get accurate position
      let npcPos = { x: interactive.x, y: interactive.y }
      if (interactive.name === 'speak_friend') {
        const npc1 = this.npcs.get('npc1')
        if (npc1) {
          npcPos = { x: npc1.x, y: npc1.y }
          console.log(`[INTERACTIVE OVERLAP] Using NPC1 position: (${npcPos.x}, ${npcPos.y})`)
        }
      } else if (interactive.name === 'speak_teacher') {
        const npc2 = this.npcs.get('npc2')
        if (npc2) {
          npcPos = { x: npc2.x, y: npc2.y }
          console.log(`[INTERACTIVE OVERLAP] Using NPC2 position: (${npcPos.x}, ${npcPos.y})`)
        }
      }
      
      // Create a trigger-like object to pass to callback (for proximity detection)
      // This allows the E indicator to work with interactive objects
      const triggerLike: TriggerBox = {
        name: interactive.name,
        x: npcPos.x,  // Use NPC position instead of trigger box
        y: npcPos.y,  // Use NPC position instead of trigger box
        width: interactive.width,
        height: interactive.height,
        action: '',
        triggered: false,
      }
      
      // Calculate screen coordinates for UI positioning (same as trigger)
      const camera = this.cameras.main
      const screenX = (triggerLike.x - camera.scrollX) * camera.zoom
      const screenY = (triggerLike.y - camera.scrollY) * camera.zoom
      
      triggerLike.screenX = screenX
      triggerLike.screenY = screenY
      
      // Call trigger callback continuously while overlapping
      // This makes E indicator show same way as for trigger-based NPCs
      this.onTriggerCallback?.(triggerLike)
    } else {
      // For other interactives, just log
      console.log(`[INTERACTIVE OVERLAP] Near "${interactive.name}" - press E to interact`)
    }
  }

  private setupCamera() {
    // Camera follow player with bounds to prevent black areas
    if (!this.player || !this.tilemap) {
      console.error('[Camera] No player or tilemap to follow')
      return
    }
    
    // Get tilemap dimensions
    const mapWidthInPixels = this.tilemap.widthInPixels
    const mapHeightInPixels = this.tilemap.heightInPixels
    const viewportWidth = this.scale.width  // 1280
    const viewportHeight = this.scale.height  // 960
    
    // Set camera and physics bounds to match tilemap
    this.cameras.main.setBounds(0, 0, mapWidthInPixels, mapHeightInPixels)
    this.physics.world.setBounds(0, 0, mapWidthInPixels, mapHeightInPixels)
    console.log(`[Camera] Bounds set to (0, 0, ${mapWidthInPixels}, ${mapHeightInPixels})`)
    
    // Set camera zoom based on map size
    // For maps larger than viewport, use lower zoom to see more; for smaller maps, use higher zoom
    let focusZoom = 1.0  // Default 100%
    
    // If map is close to viewport size, use zoom 1.5 to focus on player area (Scenario 1: bedroom)
    if (mapWidthInPixels <= 1400 && mapHeightInPixels <= 1000) {
      focusZoom = 1.5  // Bedroom: 1280×960, zoom 1.5 for close-up
    }
    // If map is larger, use zoom 1.0 to see full map area (Scenario 2: cafe)
    else if (mapWidthInPixels > 1400) {
      focusZoom = 1.0  // Cafe: 2048×1280, zoom 1.0 to see more area
    }
    
    this.cameras.main.setZoom(focusZoom)
    console.log(`[Camera] Zoom set to: ${focusZoom} (map: ${mapWidthInPixels}×${mapHeightInPixels}px, viewport: ${viewportWidth}×${viewportHeight})`)  
    
    // Set camera origin and background
    this.cameras.main.setOrigin(0.5, 0.5)  // Center origin for smooth follow
    // Don't set background color - canvas is transparent, container has dark navy blue bg
    console.log(`[Camera] No background color set (transparent canvas, container handles styling)`)
    
    // Start camera following player with smooth damping
    // true = smooth follow, 0.1/0.1 = tight deadzone keeps player perfectly centered
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)
    
    // Center camera on player immediately
    this.cameras.main.centerOn(this.player.x, this.player.y)
    
    console.log('[Camera] Setup complete:', {
      playerPos: { x: this.player.x.toFixed(1), y: this.player.y.toFixed(1) },
      mapSize: { width: mapWidthInPixels, height: mapHeightInPixels },
      viewportSize: { width: viewportWidth, height: viewportHeight },
      zoom: focusZoom,
      cameraPos: { x: this.cameras.main.scrollX.toFixed(1), y: this.cameras.main.scrollY.toFixed(1) },
      cameraBounds: { x: 0, y: 0, width: mapWidthInPixels, height: mapHeightInPixels }
    })
    
    // 🔍 DEBUG: Draw player position indicator (DISABLED for performance)
    // const playerDebugGraphics = this.add.graphics()
    // playerDebugGraphics.fillStyle(0x00ff00, 0.6)
    // playerDebugGraphics.fillCircle(this.player.x, this.player.y, 15)
    // playerDebugGraphics.lineStyle(2, 0xffff00, 1)
    // playerDebugGraphics.strokeCircle(this.player.x, this.player.y, 20)
    // playerDebugGraphics.setDepth(10000)
    // console.log(`[Camera Debug] Green circle at player position (${this.player.x.toFixed(0)}, ${this.player.y.toFixed(0)})`)
    
    // 🔍 DEBUG: Log camera info every frame (DISABLED for performance)
    // this.events.on('update', () => {
    //   const cameraInfo = {
    //     scrollX: this.cameras.main.scrollX.toFixed(1),
    //     scrollY: this.cameras.main.scrollY.toFixed(1),
    //     playerX: this.player.x.toFixed(1),
    //     playerY: this.player.y.toFixed(1),
    //     zoom: this.cameras.main.zoom.toFixed(2),
    //   }
    //   // Log occasionally
    //   if (Math.random() < 0.016) {
    //     console.log('[Camera Update]', cameraInfo)
    //   }
    // })
  }

  update() {
    if (!this.player) return

    // Handle movement input
    this.handleMovement()

    // Update player depth based on Y position (RPG-style layering)
    // Semakin bawah (Y besar), semakin di depan
    this.player.setDepth(1000 + Math.round(this.player.y))

    // Check triggers
    this.checkTriggers()

    // Check interactions
    this.checkInteractions()

    // Update game state
    this.gameState.playerPos = { x: this.player.x, y: this.player.y }
  }

  private handleMovement() {
    const { w, s, a, d } = this.keysPressed
    const arrowUp = this.keysPressed['arrowup']
    const arrowDown = this.keysPressed['arrowdown']
    const arrowLeft = this.keysPressed['arrowleft']
    const arrowRight = this.keysPressed['arrowright']

    const MOVEMENT_SPEED = 160  // pixels per second (proper speed untuk smooth movement)
    
    // Reset velocity setiap frame
    let vx = 0
    let vy = 0
    let newDirection = this.playerState.direction
    let isMoving = false

    // Horizontal movement (priority untuk animation)
    if (arrowLeft || a) {
      vx = -MOVEMENT_SPEED
      newDirection = 'left'
      isMoving = true
    } else if (arrowRight || d) {
      vx = MOVEMENT_SPEED
      newDirection = 'right'
      isMoving = true
    }

    // Vertical movement
    if (arrowUp || w) {
      vy = -MOVEMENT_SPEED
      if (!isMoving) newDirection = 'up'  // Only set direction jika horizontal tidak moving
      isMoving = true
    } else if (arrowDown || s) {
      vy = MOVEMENT_SPEED
      if (!isMoving) newDirection = 'down'  // Only set direction jika horizontal tidak moving
      isMoving = true
    }

    // Set velocity untuk smooth physics-based movement
    this.player.setVelocity(vx, vy)

    // Handle animation state change dengan layout 32×32 (4 cols × 8 rows)
    if (isMoving) {
      if (newDirection !== this.playerState.direction) {
        this.playerState.direction = newDirection
        const animKey = `walk${newDirection.charAt(0).toUpperCase()}${newDirection.slice(1)}`
        this.player.play(animKey, true)
      }
    } else if (!isMoving && this.playerState.direction !== 'idle') {
      // Stop moving - play idle
      this.playerState.direction = 'idle'
      this.player.play('idle', true)
    }

    this.playerState.isMoving = isMoving
    this.playerState.x = this.player.x
    this.playerState.y = this.player.y
  }

  private checkTriggers() {
    const currentActiveTriggers = new Set<string>()
    
    this.physics.overlap(this.player, this.triggerGroup, (player, triggerObj) => {
      const trigger = (triggerObj as any).getData('trigger') as TriggerBox
      
      // Track currently active triggers for proximity detection
      currentActiveTriggers.add(trigger.name)
      
      // Handle different trigger types
      if (trigger.name === 'lamp_trigger') {
        // Lamp trigger: dapat dipicu berkali-kali untuk brightness control
        // console.log(`[TRIGGER] lamp_trigger activated - Brightness 100%`)
        // Set brightness ke 100%
        this.cameras.main.setAlpha(1)
        // Note: tidak set trigger.triggered = true agar bisa triggered lagi
      } 
      else if (trigger.name === 'phone_trigger') {
        // Phone trigger: hanya bisa dipicu 1x (once = true)
        if (!trigger.triggered) {
          trigger.triggered = true
          // console.log(`[TRIGGER] phone_trigger activated (ONCE) - open_phone action`)
          this.onTriggerCallback?.(trigger)
        }
      }
      else if (trigger.name === 'next_scene_trigger') {
        // Next scene trigger: skip untuk sekarang (belum ada scene selanjutnya)
        if (!trigger.triggered) {
          trigger.triggered = true
          // console.log(`[TRIGGER] next_scene_trigger activated (TODO: implement scene transition)`)
          // this.onTriggerCallback?.(trigger)
        }
      }
      else if (trigger.name === 'wardrobe_trigger') {
        // Wardrobe trigger: akan dihapus nanti
        if (!trigger.triggered) {
          trigger.triggered = true
          // console.log(`[TRIGGER] wardrobe_trigger activated (akan dihapus)`)
        }
      }
      else if (trigger.name === 'speak_friend' || trigger.name === 'speak_teacher') {
        // NPC interaction triggers - continuous overlap for proximity detection
        // Calculate screen coordinates for UI positioning
        // Screen position = world position - camera scroll offset + zoom adjustment
        const camera = this.cameras.main
        const screenX = (trigger.x - camera.scrollX) * camera.zoom
        const screenY = (trigger.y - camera.scrollY) * camera.zoom
        
        // Add screen coordinates to trigger for React to use
        trigger.screenX = screenX
        trigger.screenY = screenY
        
        // Call callback continuously while overlapping
        this.onTriggerCallback?.(trigger)
      }
      else {
        // Default: trigger hanya bisa 1x
        if (!trigger.triggered) {
          trigger.triggered = true
          // console.log(`[TRIGGER] Triggered: "${trigger.name}" at (${trigger.x}, ${trigger.y})`)
          this.onTriggerCallback?.(trigger)
        }
      }
    })
    
    // Detect trigger exits - when we were in a trigger but no longer are
    const exitedTriggers = Array.from(this.activeTriggers).filter(
      name => !currentActiveTriggers.has(name)
    )
    
    // Notify React of exits for NPC interaction triggers
    for (const triggerName of exitedTriggers) {
      if (triggerName === 'speak_friend' || triggerName === 'speak_teacher') {
        // Create a fake trigger object for exit notification
        const exitTrigger: TriggerBox = {
          name: `${triggerName}_exit`,
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          action: '',
          triggered: false,
        }
        this.onTriggerCallback?.(exitTrigger)
        console.log(`[TRIGGER EXIT] Left ${triggerName}`)
      }
    }
    
    // Update active triggers for next frame
    this.activeTriggers = currentActiveTriggers
    
    // Also check for interactive overlap exits (for NPC E indicators)
    // Get current interactive overlaps by checking physics overlap
    const currentInteractiveOverlaps = new Set<string>()
    this.physics.overlap(this.player, this.interactiveGroup, (player, interactiveBody) => {
      const interactive = (interactiveBody as any).getData('interactive') as InteractiveObject
      if (interactive.name === 'speak_friend' || interactive.name === 'speak_teacher') {
        currentInteractiveOverlaps.add(interactive.name)
      }
      return false  // Don't process collision, just detect presence
    })
    
    // Detect interactive overlap exits
    const exitedInteractiveOverlaps = Array.from(this.activeInteractiveOverlaps).filter(
      name => !currentInteractiveOverlaps.has(name)
    )
    
    // Notify React of interactive overlap exits for NPC E indicators
    for (const overlappingName of exitedInteractiveOverlaps) {
      // Create exit trigger to hide E indicator
      const exitTrigger: TriggerBox = {
        name: `${overlappingName}_exit`,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        action: '',
        triggered: false,
      }
      this.onTriggerCallback?.(exitTrigger)
      console.log(`[INTERACTIVE OVERLAP EXIT] Left ${overlappingName}`)
    }
    
    // Update active interactive overlaps for next frame
    this.activeInteractiveOverlaps = currentInteractiveOverlaps
  }

  private handleMouseClick(pointer: Phaser.Input.Pointer) {
    // DEBUG: Draw circle at click point (DISABLED for performance)
    // const debugCircle = this.add.circle(pointer.worldX, pointer.worldY, 8, 0xff0000, 0.5)
    // this.time.delayedCall(500, () => debugCircle.destroy())
    
    // console.log(`[CLICK] Mouse at (${pointer.worldX.toFixed(2)}, ${pointer.worldY.toFixed(2)})`)
    
    // Check if mouse is pointing at any NPC
    const clickX = pointer.worldX
    const clickY = pointer.worldY
    
    // Check NPCs first
    let foundClick = false
    this.npcs.forEach((npc) => {
      const npcBody = npc.body as Phaser.Physics.Arcade.Body
      if (npcBody && npcBody.world) {
        if (Phaser.Geom.Rectangle.Contains(
          new Phaser.Geom.Rectangle(
            npcBody.position.x - npcBody.width / 2,
            npcBody.position.y - npcBody.height / 2,
            npcBody.width,
            npcBody.height
          ),
          clickX,
          clickY
        )) {
          // console.log(`[NPC INTERACT] ✓✓✓ CLICKED ON NPC: "${npc.name}"`)
          npc.interact()
          foundClick = true
        }
      }
    })

    if (foundClick) return
    
    // Then check interactive objects
    this.interactiveGroup.children.each((obj: Phaser.GameObjects.GameObject) => {
      const interactiveBody = (obj as any).body as Phaser.Physics.Arcade.Body
      if (interactiveBody && interactiveBody.world) {
        // Check if click is within the bounds of this interactive object
        if (Phaser.Geom.Rectangle.Contains(
          new Phaser.Geom.Rectangle(
            interactiveBody.position.x - interactiveBody.width / 2,
            interactiveBody.position.y - interactiveBody.height / 2,
            interactiveBody.width,
            interactiveBody.height
          ),
          clickX,
          clickY
        )) {
          const interactive = (obj as any).getData('interactive') as InteractiveObject
          // console.log(`[INTERACT] ✓✓✓ CLICKED ON: "${interactive.name}" at (${interactive.x}, ${interactive.y})`)
          this.onInteractCallback?.(interactive)
          foundClick = true
        }
      }
      return true
    })
    
    if (!foundClick) {
      console.log(`[INTERACT] ✗ Click at (${clickX.toFixed(2)}, ${clickY.toFixed(2)}) did not hit any interactive object`)
    }
  }

  private checkInteractions() {
    // Check E key atau Enter untuk interact
    if (this.keysPressed['e'] || this.keysPressed['enter']) {
      this.physics.overlap(this.player, this.interactiveGroup, (player, interactiveObj) => {
        const interactive = (interactiveObj as any).getData('interactive') as InteractiveObject
        // console.log(`[INTERACT] Interacting with: "${interactive.name}" at (${interactive.x}, ${interactive.y})`)
        this.onInteractCallback?.(interactive)
      })
    }
  }

  getGameState(): GameState {
    return this.gameState
  }

  setPlayerPosition(x: number, y: number) {
    this.player.setPosition(x, y)
    this.playerState.x = x
    this.playerState.y = y
  }

  getPlayer(): Player {
    return this.playerState
  }

  // NEW: Method to disable barrier collision dynamically
  disableBarrier(): void {
    try {
      if (this.barrierCollisionBody) {
        console.log(`🔓 [BARRIER] Disabling barrier collision...`)
        // Disable the physics body so it no longer collides
        this.barrierCollisionBody.enable = false
        // Also remove from collision group to ensure no interaction
        if (this.collisionGroup && this.barrierCollisionBody.gameObject) {
          this.collisionGroup.remove(this.barrierCollisionBody.gameObject)
        }
        console.log(`✓ [BARRIER] Barrier collision disabled successfully`)
      } else {
        console.warn(`⚠ [BARRIER] Barrier collision body not found - may not have been created`)
      }
    } catch (error) {
      console.error(`❌ [BARRIER] Error disabling barrier:`, error)
    }
  }

  /**
   * Mobile/virtual controls can call this to inject movement state.
   * This only updates the same keys already used by keyboard handling.
   */
  setVirtualKeys(keys: { up?: boolean; down?: boolean; left?: boolean; right?: boolean }) {
    this.keysPressed['arrowup'] = !!keys.up
    this.keysPressed['arrowdown'] = !!keys.down
    this.keysPressed['arrowleft'] = !!keys.left
    this.keysPressed['arrowright'] = !!keys.right

    // Keep WASD in sync (some code reads w/a/s/d directly)
    this.keysPressed['w'] = !!keys.up
    this.keysPressed['s'] = !!keys.down
    this.keysPressed['a'] = !!keys.left
    this.keysPressed['d'] = !!keys.right
  }
}
