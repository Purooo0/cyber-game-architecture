/**
 * Character Sprite Loader - SIMPLIFIED VERSION
 * Untuk Canvas rendering - gunakan scaling bukan cropping
 * Untuk Phaser - gunakan spritesheet frame system (tidak perlu loader ini)
 */

export interface CharacterFrames {
  idle: HTMLImageElement[]
  walkDown: HTMLImageElement[]
  walkUp: HTMLImageElement[]
  walkLeft: HTMLImageElement[]
  walkRight: HTMLImageElement[]
}

export interface CharacterSpriteConfig {
  basePath: string
  characterName: string
  useAsSingleImage?: boolean
  isTileset?: boolean
  tilesetLayout?: {
    rows?: number
    columns?: number
    frameWidth?: number
    frameHeight?: number
  }
  stateNames?: {
    idle?: string
    walkDown?: string
    walkUp?: string
    walkLeft?: string
    walkRight?: string
  }
  frameCount?: {
    idle?: number
    walkDown?: number
    walkUp?: number
    walkLeft?: number
    walkRight?: number
  }
}

export class CharacterSpriteLoader {
  private frames: Partial<CharacterFrames> = {}
  private frameDimensions: Partial<Record<keyof CharacterFrames, { width: number; height: number }>> = {}
  private currentFrame: number = 0
  private animationSpeed: number = 80  // Reduced from 100 for faster animation (~12.5 FPS)
  private lastFrameTime: number = 0
  private singleImage: HTMLImageElement | null = null

  /**
   * Load character menggunakan SIMPLE approach
   * Gunakan scaling canvas, bukan cropping
   * Ini menghindarkan pixel-perfect issues dengan cropping
   */
  async loadCharacter(config: CharacterSpriteConfig): Promise<CharacterFrames> {
    const defaultFrameCounts = {
      idle: 4,
      walkDown: 4,
      walkUp: 4,
      walkLeft: 4,
      walkRight: 4,
    }

    const frameCounts = { ...defaultFrameCounts, ...config.frameCount }

    // Load spritesheet image
    const spritesheet = await this.loadImage(config.basePath)

    if (!config.isTileset || !config.tilesetLayout) {
      throw new Error('isTileset and tilesetLayout are required')
    }

    const { columns = 4, frameWidth = 32, frameHeight = 51 } = config.tilesetLayout

    // Frame extraction configuration - UPDATED untuk layout 4 cols × 8 rows
    // Row 0-3: Idle states, Row 4-7: Walk states
    const frameConfig = {
      idle: { row: 0, count: 4 },        // Row 0: Idle/idle down
      walkDown: { row: 4, count: 4 },    // Row 4: Walk down
      walkUp: { row: 7, count: 4 },      // Row 7: Walk up
      walkLeft: { row: 5, count: 4 },    // Row 5: Walk left
      walkRight: { row: 6, count: 4 },   // Row 6: Walk right
    }

    // Extract frames untuk setiap state
    for (const [state, { row, count }] of Object.entries(frameConfig)) {
      const frames: HTMLImageElement[] = []

      for (let col = 0; col < count; col++) {
        // Create canvas dengan exact size - NO PADDING
        const canvas = document.createElement('canvas')
        canvas.width = frameWidth
        canvas.height = frameHeight

        const ctx = canvas.getContext('2d', { willReadFrequently: false })
        if (!ctx) continue

        // CRITICAL: Disable image smoothing for pixel-perfect rendering
        ctx.imageSmoothingEnabled = false
        ctx.clearRect(0, 0, frameWidth, frameHeight)

        // Calculate exact source position dari spritesheet
        const sourceX = col * frameWidth
        const sourceY = row * frameHeight

        // Draw frame dengan exact coordinates (NO subpixel rendering)
        ctx.drawImage(
          spritesheet,
          Math.floor(sourceX),
          Math.floor(sourceY),
          frameWidth,
          frameHeight,
          0,
          0,
          frameWidth,
          frameHeight
        )

        // Convert canvas ke blob, then ke image (lebih reliable)
        const img = new Image()
        img.width = frameWidth
        img.height = frameHeight
        img.src = canvas.toDataURL('image/png')
        frames.push(img)
      }

      this.frames[state as keyof CharacterFrames] = frames
      this.frameDimensions[state as keyof CharacterFrames] = {
        width: frameWidth,
        height: frameHeight,
      }
    }

    console.log(`✓ [SPRITE LOADED] blue_haired_woman_shadow.png - ${frameWidth}×${frameHeight} frames, 5 states (idle + 4 walk directions), 4 frames per state`)
    return this.frames as CharacterFrames
  }

  private async loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
      img.src = src
    })
  }

  getFrame(state: keyof CharacterFrames): HTMLImageElement | null {
    const stateFrames = this.frames[state]
    if (!stateFrames || stateFrames.length === 0) return null
    return stateFrames[this.currentFrame % stateFrames.length]
  }

  updateAnimation(deltaTime: number): void {
    this.lastFrameTime += deltaTime
    if (this.lastFrameTime >= this.animationSpeed) {
      this.currentFrame++
      this.lastFrameTime = 0
    }
  }

  resetAnimation(): void {
    this.currentFrame = 0
    this.lastFrameTime = 0
  }

  setAnimationSpeed(speed: number): void {
    this.animationSpeed = speed
  }

  drawCharacter(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    state: keyof CharacterFrames,
    scale: number = 1
  ): void {
    const frame = this.getFrame(state)
    if (!frame) return

    const dimensions = this.frameDimensions[state]
    const baseWidth = dimensions?.width || 32
    const baseHeight = dimensions?.height || 32

    const width = baseWidth * scale
    const height = baseHeight * scale

    // Save context state for proper clipping and rendering
    ctx.save()
    
    // Enable pixel-perfect rendering
    ctx.imageSmoothingEnabled = false
    
    // CRITICAL FIX: Normalize anchor point
    // x, y adalah bottom-center anchor point dari character (kaki)
    // Jadi kita harus hitung top-left corner untuk drawing
    const drawX = Math.round(x - width / 2)
    const drawY = Math.round(y - height)
    
    // Draw shadow at ground level (fixed to bottom of character)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
    ctx.beginPath()
    // Shadow position should be at the bottom center of the character
    ctx.ellipse(
      Math.round(x), 
      Math.round(y) + 2, 
      width / 2, 
      3, 
      0, 
      0, 
      Math.PI * 2
    )
    ctx.fill()

    // Draw character sprite - use integer coordinates for pixel-perfect rendering
    // drawX, drawY adalah top-left corner untuk consistency
    ctx.drawImage(
      frame, 
      drawX, 
      drawY, 
      width, 
      height
    )
    
    // Restore context state
    ctx.restore()
  }

  getFrameWidth(state: keyof CharacterFrames): number {
    const dimensions = this.frameDimensions[state]
    return dimensions?.width || 32
  }

  getFrameHeight(state: keyof CharacterFrames): number {
    const dimensions = this.frameDimensions[state]
    return dimensions?.height || 32
  }
}

export async function createBlueHairedWomanCharacter(): Promise<CharacterSpriteLoader> {
  const loader = new CharacterSpriteLoader()

  await loader.loadCharacter({
    basePath: '/Player/Blue Haired Woman/blue_haired_woman_shadow.png',
    characterName: 'Blue Haired Woman',
    isTileset: true,
    tilesetLayout: {
      columns: 4,
      frameWidth: 32,
      frameHeight: 32,
    },
    frameCount: {
      idle: 4,
      walkDown: 4,
      walkUp: 4,
      walkLeft: 4,
      walkRight: 4,
    },
  })

  return loader
}
