'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Card } from './ui/card'

interface MentorDialogProps {
  isVisible: boolean
  lines: string[]
  currentLineIdx: number
  classroomLines?: string[]
  isClassroom?: boolean
  hint?: string | null
  onContinue: () => void
  onClose: () => void
}

export const MentorDialog: React.FC<MentorDialogProps> = ({
  isVisible,
  lines,
  currentLineIdx,
  classroomLines = [],
  isClassroom = false,
  hint = null,
  onContinue,
  onClose,
}) => {
  const [displayedText, setDisplayedText] = useState('')
  const [isMounted, setIsMounted] = useState(false)

  // Only set mounted on client side
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Display text directly (no typewriter)
  useEffect(() => {
    if (!isVisible || !isMounted) return
    
    const currentLines = isClassroom ? classroomLines : lines
    const fullText = hint !== null ? hint : currentLines[currentLineIdx]
    
    if (!fullText) {
      console.warn('[MentorDialog] No text to display:', { currentLineIdx, lines, classroomLines, isClassroom })
      return
    }
    
    console.log('[MentorDialog] Displaying line:', currentLineIdx, fullText)
    
    // Show full text immediately (no typewriter)
    setDisplayedText(fullText)
    
    // Auto-close if it's a hint OR last line of normal dialog
    if (hint || currentLineIdx >= (isClassroom ? classroomLines : lines).length - 1) {
      // Calculate reading time: ~30ms per character = ~20 words/sec reading speed
      // Minimum 1500ms to ensure reader has time
      const readingTimeMs = Math.max(1500, fullText.length * 30)
      console.log('[MentorDialog] Auto-closing after', readingTimeMs, 'ms (text length:', fullText.length, ')')
      const timeout = setTimeout(() => onClose(), readingTimeMs)
      return () => clearTimeout(timeout)
    }
  }, [isVisible, isMounted, currentLineIdx, isClassroom, hint, onClose, lines, classroomLines])

  const handleClick = useCallback(() => {
    if (hint) {
      // Close mentor and clear hint
      onClose()
    } else {
      // Text already displayed - move to next or close
      const currentLines = isClassroom ? classroomLines : lines
      if (currentLineIdx < currentLines.length - 1) {
        // Continue to next line
        onContinue()
      } else {
        // Last line done - close
        onClose()
      }
    }
  }, [hint, currentLineIdx, isClassroom, classroomLines, lines, onContinue, onClose])

  if (!isVisible) return null

  const currentLines = isClassroom ? classroomLines : lines
  
  return (
    <div className="fixed bottom-6 left-4 right-4 z-40">
      <Card className="bg-card border-2 border-secondary/50 p-5 relative overflow-hidden shadow-lg shadow-secondary/20">
        {/* Decorative top line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-secondary to-transparent" />
        
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center gap-2">
            <span className="font-pixel text-xs text-secondary">CYBER MENTOR</span>
            <div className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
          </div>

          {/* Dialog text */}
          <p className="text-sm text-foreground/90 leading-relaxed min-h-[3rem]">
            {displayedText}
          </p>
        </div>

        {/* Progress dots + click-to-advance */}
        <div
          className="flex items-center justify-between mt-3 pt-3 border-t border-secondary/20 cursor-pointer group"
          onClick={handleClick}
        >
          <div className="flex items-center gap-2">
            {currentLines.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentLineIdx ? 'bg-secondary' : i < currentLineIdx ? 'bg-secondary/60' : 'bg-secondary/20'
                }`}
              />
            ))}
          </div>
          <span className="font-pixel text-[9px] text-secondary/60 group-hover:text-secondary transition-colors">
            {currentLineIdx < currentLines.length - 1
              ? 'CLICK TO CONTINUE >>'
              : 'CLICK TO CLOSE >>'}
          </span>
        </div>

        {/* Decorative bottom line */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-secondary to-transparent" />
      </Card>
    </div>
  )
}

MentorDialog.displayName = 'MentorDialog'
