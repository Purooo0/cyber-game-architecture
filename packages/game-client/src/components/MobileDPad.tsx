'use client'

import React, { useCallback, useMemo, useRef } from 'react'

type Dir = 'up' | 'down' | 'left' | 'right'

export interface MobileDPadProps {
  disabled?: boolean
  onChange: (keys: { up: boolean; down: boolean; left: boolean; right: boolean }) => void
}

const defaultKeys = { up: false, down: false, left: false, right: false }

export function MobileDPad({ disabled = false, onChange }: MobileDPadProps) {
  const keysRef = useRef({ ...defaultKeys })

  const emit = useCallback(() => {
    onChange({ ...keysRef.current })
  }, [onChange])

  const setDir = useCallback(
    (dir: Dir, pressed: boolean) => {
      keysRef.current[dir] = pressed
      emit()
    },
    [emit]
  )

  const commonHandlers = useMemo(() => {
    const prevent = (e: React.SyntheticEvent) => {
      // Prevent scroll / safari gestures while touching controls
      e.preventDefault?.()
      e.stopPropagation?.()
    }

    return { prevent }
  }, [])

  const makeBtnProps = (dir: Dir) => {
    return {
      onPointerDown: (e: React.PointerEvent) => {
        if (disabled) return
        commonHandlers.prevent(e)
        ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
        setDir(dir, true)
      },
      onPointerUp: (e: React.PointerEvent) => {
        if (disabled) return
        commonHandlers.prevent(e)
        setDir(dir, false)
      },
      onPointerCancel: (e: React.PointerEvent) => {
        if (disabled) return
        commonHandlers.prevent(e)
        setDir(dir, false)
      },
      onPointerLeave: (e: React.PointerEvent) => {
        // If finger slides away, stop movement.
        if (disabled) return
        commonHandlers.prevent(e)
        setDir(dir, false)
      },
    }
  }

  return (
    <div
      className="absolute left-4 bottom-4 z-30 select-none"
      style={{ touchAction: 'none' }}
      aria-label="Mobile movement controls"
    >
      <div className="grid grid-cols-3 grid-rows-3 gap-2">
        <div />
        <button
          type="button"
          aria-label="Move up"
          className={`w-14 h-14 rounded-lg border-2 font-pixel text-xs bg-card/80 backdrop-blur-sm transition-colors ${
            disabled
              ? 'border-foreground/20 text-foreground/30'
              : 'border-primary/40 text-primary hover:bg-primary/10 active:bg-primary/20'
          }`}
          {...makeBtnProps('up')}
        >
          ▲
        </button>
        <div />

        <button
          type="button"
          aria-label="Move left"
          className={`w-14 h-14 rounded-lg border-2 font-pixel text-xs bg-card/80 backdrop-blur-sm transition-colors ${
            disabled
              ? 'border-foreground/20 text-foreground/30'
              : 'border-primary/40 text-primary hover:bg-primary/10 active:bg-primary/20'
          }`}
          {...makeBtnProps('left')}
        >
          ◀
        </button>

        <div
          className={`w-14 h-14 rounded-lg border-2 flex items-center justify-center bg-card/60 backdrop-blur-sm ${
            disabled ? 'border-foreground/20' : 'border-primary/20'
          }`}
          aria-hidden="true"
        >
          <span className={`font-pixel text-[10px] ${disabled ? 'text-foreground/30' : 'text-foreground/60'}`}>MOVE</span>
        </div>

        <button
          type="button"
          aria-label="Move right"
          className={`w-14 h-14 rounded-lg border-2 font-pixel text-xs bg-card/80 backdrop-blur-sm transition-colors ${
            disabled
              ? 'border-foreground/20 text-foreground/30'
              : 'border-primary/40 text-primary hover:bg-primary/10 active:bg-primary/20'
          }`}
          {...makeBtnProps('right')}
        >
          ▶
        </button>

        <div />
        <button
          type="button"
          aria-label="Move down"
          className={`w-14 h-14 rounded-lg border-2 font-pixel text-xs bg-card/80 backdrop-blur-sm transition-colors ${
            disabled
              ? 'border-foreground/20 text-foreground/30'
              : 'border-primary/40 text-primary hover:bg-primary/10 active:bg-primary/20'
          }`}
          {...makeBtnProps('down')}
        >
          ▼
        </button>
        <div />
      </div>
    </div>
  )
}
