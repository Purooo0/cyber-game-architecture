'use client'

import React, { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Card } from './ui/card'

export interface NPCDialogData {
  name: string
  message: string
}

interface NPCDialogPopupProps {
  data: NPCDialogData
  onClose: () => void
}

export const NPCDialogPopup: React.FC<NPCDialogPopupProps> = React.memo(({ data, onClose }) => {
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(false) // Disabled typewriter - show all text immediately
  const [typingSpeed] = useState(11) // Typewriter speed: 11ms per character (2x faster)

  // Typewriter effect - DISABLED (show full text immediately)
  useEffect(() => {
    setDisplayedText(data.message)
    setIsTyping(false)
  }, [data.message])

  // Auto-close dialog based on character count (no typewriter waiting time)
  useEffect(() => {
    // Calculate close delay based only on reading time
    // Minimum 1.5 seconds for short messages, plus 40ms per character for reading
    const autoCloseDelay = Math.max(
      1500, // Minimum 1.5 seconds
      (40 * data.message.length) // 40ms per character for reading
    )
    const timer = setTimeout(() => {
      onClose()
    }, autoCloseDelay)
    return () => clearTimeout(timer)
  }, [onClose, data.message])

  const handleClick = () => {
    onClose()
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      {/* Semi-transparent backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog Card */}
      <Card className="relative bg-card border-4 border-primary/40 p-6 w-full max-w-2xl overflow-hidden animate-in fade-in scale-in duration-300 shadow-lg shadow-primary/20">
        {/* Decorative top glow line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" />

        {/* Corner brackets */}
        <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-primary" />
        <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-primary" />
        <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-secondary" />
        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-secondary" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-foreground/60 hover:text-foreground transition-colors z-10"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* NPC Name Header */}
        <div className="mb-4 pb-3 border-b-2 border-primary/30">
          <div className="flex items-center gap-2">
            <span className="font-pixel text-xs text-primary">{data.name}</span>
            {/* Typing indicator removed */}
          </div>
        </div>

        {/* Dialog Text */}
        <div className="mb-6 min-h-[4rem]">
          <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
            {displayedText}
          </p>
        </div>

        {/* Action hint - auto-close info */}
        <div className="flex items-center justify-end pt-3 border-t border-primary/20 text-[9px] text-primary/60">
          <span className="font-pixel">AUTO-CLOSING...</span>
        </div>

        {/* Decorative bottom line */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-secondary to-transparent" />
      </Card>
    </div>
  )
}, (prevProps, nextProps) => {
  // Only re-render if data.message actually changed
  return prevProps.data.message === nextProps.data.message && prevProps.data.name === nextProps.data.name
})
