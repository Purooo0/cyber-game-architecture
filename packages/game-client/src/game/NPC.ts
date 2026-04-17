/**
 * NPC Class
 * Represents a non-playable character in the game
 */

import Phaser from 'phaser'

export interface NPCConfig {
  x: number
  y: number
  name: string
  spriteKey: string
  animationFrames?: number[] // Frames to use for idle animation
  width?: number
  height?: number
  dialogueId?: string
}

export class NPC extends Phaser.Physics.Arcade.Sprite {
  public name: string
  public dialogueId?: string
  public isInteractable: boolean = true

  // New: optional glow effect
  private glowFx?: Phaser.FX.Glow

  constructor(scene: Phaser.Scene, config: NPCConfig) {
    const { x, y, spriteKey, width = 256, height = 256 } = config

    super(scene, x, y, spriteKey)

    // Add to scene
    scene.add.existing(this)
    scene.physics.add.existing(this)

    // Configure sprite
    this.name = config.name
    this.dialogueId = config.dialogueId
    this.setDisplaySize(width, height)

    // Make whole sprite clickable (instead of Tiled interactive box)
    // Use an explicit rectangle hit-area to match the displayed size.
    // (More reliable than default pixel-perfect / texture-based hit testing.)
    this.setInteractive(
      new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height),
      Phaser.Geom.Rectangle.Contains
    )
    // Hand cursor on hover
    if (this.input) this.input.cursor = 'pointer'

    this.on('pointerdown', () => {
      if (!this.isInteractable) return
      this.interact()
    })

    // Always-on glow to indicate this NPC is interactable (continuous pulse).
    // Safe fallback: if FX pipeline is not available, it won't break gameplay.
    try {
      const fx = (this as any).postFX?.addGlow?.(0x00ffcc, 3, 0, 0.55)
      if (fx) {
        this.glowFx = fx
        this.scene.tweens.add({
          targets: this.glowFx,
          outerStrength: { from: 2.5, to: 6 },
          yoyo: true,
          repeat: -1,
          duration: 850,
          ease: 'sine.inOut',
        })
      }
    } catch {
      // ignore (older Phaser / renderer without postFX)
    }

    // Physics setup - body may be null if not added to physics world yet
    if (this.body) {
      // Configure based on body type (Arcade Body vs StaticBody)
      const body = this.body as any
      if (body.setCollideWorldBounds) {
        body.setCollideWorldBounds(true)
        body.setImmovable(true)
      } else {
        // StaticBody properties
        body.immovable = true
      }
    }

    // Create idle animation if frames provided
    if (config.animationFrames && config.animationFrames.length > 0) {
      this.createIdleAnimation(config.name, spriteKey, config.animationFrames)
      this.play(`${config.name}_idle`)
    }

    console.log(`✓ NPC "${this.name}" created at (${x}, ${y}) with sprite "${spriteKey}"`)
  }

  private createIdleAnimation(npcName: string, spriteKey: string, frames: number[]) {
    const animKey = `${npcName}_idle`

    // Check if animation already exists
    if (!this.scene.anims.exists(animKey)) {
      this.scene.anims.create({
        key: animKey,
        frames: frames.map(frameNum => ({
          key: spriteKey,
          frame: frameNum,
        })),
        frameRate: 6,
        repeat: -1,
      })
      console.log(`  → Created animation "${animKey}" with frames [${frames.join(', ')}]`)
    }
  }

  public interact() {
    console.log(`[NPC INTERACT] "${this.name}" interacted`)
    // Emit event or callback for dialog
    this.scene.events.emit('npc-interact', {
      npcName: this.name,
      dialogueId: this.dialogueId,
    })
  }
}
