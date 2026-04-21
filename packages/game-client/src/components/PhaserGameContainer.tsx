/**
 * Phaser Game Container Component
 * React component yang render Phaser 3 game
 */

import { useEffect, useRef, useState } from 'react'
import type { TriggerBox, InteractiveObject } from '../game/types'
import { usePhaserGameEngine } from '../game/usePhaserGameEngine'
import { MobileDPad } from './MobileDPad'

interface PhaserGameContainerProps {
  mapPath: string
  width?: number
  height?: number
  playerSpeed?: number
  onTrigger?: (trigger: TriggerBox) => void
  onInteract?: (interactive: InteractiveObject) => void
  debug?: boolean
  disabled?: boolean
  onMapLoadComplete?: () => void
  disableBarrier?: boolean
}

export function PhaserGameContainer({
  mapPath,
  width = 1280,
  height = 960,
  playerSpeed = 3,
  onTrigger,
  onInteract,
  debug = false,
  disabled = false,
  onMapLoadComplete,
  disableBarrier = false,
}: PhaserGameContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { isReady, error: gameError, disableBarrier: disableBarrierMethod, setVirtualKeys } = usePhaserGameEngine({
    mapPath,
    width,
    height,
    playerSpeed,
    containerSelector: 'phaser-game-container',
    onTrigger,
    onInteract,
  })

  // Show D-pad only on touch devices (mobile/tablet)
  const [showMobileControls, setShowMobileControls] = useState(false)

  useEffect(() => {
    // Prefer pointer:coarse + touch capability check
    const compute = () => {
      const coarse = typeof window !== 'undefined' && window.matchMedia
        ? window.matchMedia('(pointer: coarse)').matches
        : false
      const touchCapable = typeof window !== 'undefined'
        ? (('ontouchstart' in window) || (navigator.maxTouchPoints > 0))
        : false
      setShowMobileControls(coarse || touchCapable)
    }

    compute()
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [])

  // Safety: stop movement when input becomes disabled
  useEffect(() => {
    if (disabled) {
      setVirtualKeys?.({ up: false, down: false, left: false, right: false })
    }
  }, [disabled, setVirtualKeys])

  useEffect(() => {
    if (isReady) {
      console.log('[PhaserGameContainer] Game is ready - calling onMapLoadComplete')
      setIsLoading(false)
      onMapLoadComplete?.()

      // Scale the Phaser canvas to always fill the responsive container.
      // This does not change game logic/render resolution; it only affects CSS layout.
      try {
        const container = document.getElementById('phaser-game-container')
        const canvas = container?.querySelector('canvas') as HTMLCanvasElement | null
        if (canvas) {
          canvas.style.width = '100%'
          canvas.style.height = '100%'
          canvas.style.display = 'block'
        }
      } catch {
        // ignore
      }
    }
  }, [isReady, onMapLoadComplete])

  useEffect(() => {
    if (gameError) {
      setError(gameError)
      setIsLoading(false)
    }
  }, [gameError])

  // NEW: Handle barrier disable when prop changes
  useEffect(() => {
    if (disableBarrier && isReady && disableBarrierMethod) {
      console.log('[PhaserGameContainer] disableBarrier prop changed to true, calling method...')
      disableBarrierMethod()
    }
  }, [disableBarrier, isReady, disableBarrierMethod])

  if (error) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-background text-white rounded">
        <div className="text-center space-y-4">
          <p className="font-pixel text-sm text-red-500">ERROR</p>
          <p className="text-xs text-gray-400">{error}</p>
        </div>
      </div>
    )
  }

  // Container HARUS di-render sejak awal agar Phaser punya parent saat init
  // Responsive layout: keep game internal resolution fixed, but scale the container to fit viewport.
  // Requirement: border/frame flexes with page size; game render code not modified.
  return (
    <div className="flex flex-col items-center justify-center w-full" style={{ minHeight: '1000px' }}>
      {/* This wrapper defines the responsive size (cropping allowed). */}
      <div
        className="relative w-[min(100vw,1280px)] h-[min(calc(100vw*0.75),960px)] sm:w-[min(100vw,1280px)] sm:h-[min(calc(100vw*0.75),960px)]"
        style={{
          maxWidth: '100vw',
          // Keep the overall frame in a 4:3 box. Height driven by width.
          // Tailwind calc above is the primary; this is a safe fallback.
          aspectRatio: `${width} / ${height}`,
        }}
      >
        <div
          ref={containerRef}
          id="phaser-game-container"
          className="border-4 border-green-500 w-full h-full"
          style={{
            position: 'relative',
            display: 'block',
            overflow: 'hidden', // crop is allowed
            backgroundColor: '#0a0e27', // Dark navy blue matching theme
          }}
        >
          {/* Phaser canvas akan di-render di sini */}
        </div>
        
        {/* Mobile controls overlay (only on touch devices) */}
        {showMobileControls && (
          <MobileDPad
            disabled={disabled || isLoading || !isReady}
            onChange={(keys) => setVirtualKeys?.(keys)}
          />
        )}
        
        {/* Disabled overlay - blocks input during mentor dialogue */}
        {disabled && (
          <div
            className="absolute inset-0 bg-black/20 z-20"
            style={{ pointerEvents: 'auto' }}
          />
        )}
        
        {/* Loading overlay - di atas container saat game belum ready */}
        {isLoading && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-background/90 text-white rounded z-10"
            style={{ pointerEvents: 'none' }}
          >
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="font-pixel text-sm">LOADING PHASER GAME...</p>
            </div>
          </div>
        )}
      </div>
      <div className="mt-4 text-center text-green-500 text-xs font-press-start space-y-1">
        <p>↑↓←→ or WASD to move</p>
        <p>Click to interact</p>
        {debug && <p className="text-[9px] text-yellow-500">DEBUG MODE ON</p>}
      </div>
    </div>
  )
}
