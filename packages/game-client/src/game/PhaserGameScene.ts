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

  // NEW: Pointer tracking for tap confirmation (mobile)
  private pointerDownForNpcTap?: { id: number; x: number; y: number; time: number }

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

    // IMPORTANT (mobile): do NOT trigger NPC interactions on pointerdown.
    // Touch devices can fire pointerdown during scroll/drag and feel too sensitive.
    // NPC taps are handled globally in handleMouseClick() on confirmed TAP.
    // (We keep NPC sprites interactive so hitTest can detect them.)
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

    // Mouse/touch input
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.pointerDownForNpcTap = {
        id: pointer.id,
        x: pointer.worldX,
        y: pointer.worldY,
        time: pointer.downTime,
      }

      // Desktop: act immediately
      // Mobile: defer to pointerup tap-confirmation (prevents over-sensitive triggers)
      const isTouchLike = pointer.wasTouch || pointer.primaryDown === false
      if (!isTouchLike) {
        this.handleMouseClick(pointer)
      }
    })

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!this.pointerDownForNpcTap || this.pointerDownForNpcTap.id !== pointer.id) return

      const dx = pointer.worldX - this.pointerDownForNpcTap.x
      const dy = pointer.worldY - this.pointerDownForNpcTap.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      const TAP_MAX_MOVE = 14
      if (dist > TAP_MAX_MOVE) return

      ;(pointer as any).__isTap = true
      this.handleMouseClick(pointer)
    })
  }

  private handleMouseClick(pointer: Phaser.Input.Pointer) {
    // Ignore if already handled as a tap
    if ((pointer as any).__isTapHandled) return
    ;(pointer as any).__isTapHandled = true

    // DEBUG: Draw circle at click point (DISABLED for performance)
    // this.add.circle(pointer.worldX, pointer.worldY, 10, 0xff0000, 1)

    const clickX = pointer.worldX
    const clickY = pointer.worldY

    const isTouchLike = !!pointer.wasTouch
    if (isTouchLike && !(pointer as any).__isTap) return

    // 1) NPCs via hit-test (sprite click)
    try {
      const hits = this.input.hitTestPointer(pointer) as Phaser.GameObjects.GameObject[]
      const hitNpc = hits?.find((go: any) => go && go instanceof NPC) as NPC | undefined
      if (hitNpc && hitNpc.isInteractable) {
        let interactiveName = hitNpc.name
        if (hitNpc.name === 'npc1') interactiveName = 'speak_friend'
        if (hitNpc.name === 'npc2') interactiveName = 'speak_teacher'

        this.onInteractCallback?.({
          x: hitNpc.x,
          y: hitNpc.y,
          width: hitNpc.displayWidth,
          height: hitNpc.displayHeight,
          name: interactiveName,
        })
        return
      }
    } catch {
      // ignore
    }

    // 2) Then check interactive objects (Tiled Interactive layer boxes)
    let foundClick = false
    this.interactiveGroup.children.each((obj: Phaser.GameObjects.GameObject) => {
      const interactiveBody = (obj as any).body as Phaser.Physics.Arcade.Body
      if (interactiveBody && interactiveBody.world) {
        if (
          Phaser.Geom.Rectangle.Contains(
            new Phaser.Geom.Rectangle(
              interactiveBody.position.x - interactiveBody.width / 2,
              interactiveBody.position.y - interactiveBody.height / 2,
              interactiveBody.width,
              interactiveBody.height
            ),
            clickX,
            clickY
          )
        ) {
          const interactive = (obj as any).getData('interactive') as InteractiveObject
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

  private setupCollisionLayers(tilemap: Phaser.Tilemaps.Tilemap) {
    // Collision group untuk semua static object (dari object layer)
    this.collisionGroup = this.physics.add.staticGroup()

    // Add collision boxes from object layer (Tiled: Object Layer -> Properties -> Collision)
    for (const collision of this.collisionsRef) {
      const { x, y, width, height } = collision
      const box = this.collisionGroup.create(x, y, 'invisible').setOrigin(0, 0)
      box.setSize(width, height)
      box.setAlpha(0) // Invisible
      box.setImmovable(true)
    }

    console.log(`✓ Collision layers setup complete: ${this.collisionsRef.length} boxes`)
  }

  private setupPhysics() {
    // Player physics
    this.physics.add.collider(this.player, this.collisionGroup)

    // NPCs with static collision
    this.npcGroup.children.iterate((npc) => {
      this.physics.add.collider(npc, this.collisionGroup)
      return true
    })
  }

  private setupCamera() {
    // Camera follow player with some offset
    this.cameras.main.startFollow(this.player, true, 0.09, 0.09, 0, 50)
  }
}