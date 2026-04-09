'use client'

import React, { useEffect, useState } from 'react'
import { Card } from './ui/card'

export interface DialogChoice {
  id: string
  text: string
  nextDialogId?: string // If no nextDialogId, closes dialog after selection
}

export interface DialogNode {
  id: string
  speaker: string
  text: string
  choices?: DialogChoice[]
  autoAdvanceDelay?: number // ms before auto-advancing to next dialog
}

interface NPCDialogSystemProps {
  dialogNodes: DialogNode[]
  startDialogId: string
  playerName?: string
  onClose: (currentDialogId: string) => void
  onDialogChange?: (dialogId: string) => void
}

export const NPCDialogSystem: React.FC<NPCDialogSystemProps> = React.memo(({
  dialogNodes,
  startDialogId,
  playerName = 'Player',
  onClose,
  onDialogChange,
}) => {
  const [currentDialogId, setCurrentDialogId] = useState(startDialogId)
  const [displayedText, setDisplayedText] = useState('')

  // Get current dialog node
  const currentDialog = dialogNodes.find(node => node.id === currentDialogId)

  // Display text immediately (no typewriter effect)
  useEffect(() => {
    if (!currentDialog) return
    setDisplayedText(currentDialog.text)
    onDialogChange?.(currentDialogId)
  }, [currentDialogId, currentDialog, onDialogChange])

  // Auto-close dialog when no choices available
  useEffect(() => {
    if (currentDialog && (!currentDialog.choices || currentDialog.choices.length === 0)) {
      // Use autoAdvanceDelay if specified, otherwise default to 800ms
      const delay = currentDialog.autoAdvanceDelay || 800
      console.log(`[NPC Dialog] Auto-closing dialog '${currentDialogId}' with delay ${delay}ms`)
      const timer = setTimeout(() => {
        console.log(`[NPC Dialog] ✅ Closing dialog '${currentDialogId}'`)
        onClose(currentDialogId)
      }, delay)
      return () => clearTimeout(timer)
    }
  }, [currentDialog, onClose, currentDialogId])

  const handleTextClick = () => {
    if (!currentDialog) return

    // If no choices and text is displayed, close or auto-advance
    if (!currentDialog.choices || currentDialog.choices.length === 0) {
      if (currentDialog.autoAdvanceDelay) {
        setTimeout(() => onClose(currentDialogId), currentDialog.autoAdvanceDelay)
      } else {
        onClose(currentDialogId)
      }
    }
  }

  const handleChoiceSelect = (choice: DialogChoice) => {
    if (choice.nextDialogId) {
      // Go to next dialog
      setCurrentDialogId(choice.nextDialogId)
    } else {
      // Close dialog
      onClose(currentDialogId)
    }
  }

  if (!currentDialog) {
    return null
  }

  return (
    <>
      {/* Semi-transparent backdrop - only when dialog is shown */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 pointer-events-auto"
        onClick={() => onClose(currentDialogId)}
      />

      {/* Dialog Card - positioned at bottom like cyber mentor dialog */}
      <div className="absolute bottom-4 left-4 right-4 z-40">
        <Card className="bg-card border-4 border-secondary/40 p-4 relative overflow-hidden shadow-lg shadow-secondary/20">
          {/* Decorative top glow line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-secondary to-transparent animate-pulse" />
          {/* Corner brackets */}
          <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-secondary" />
          <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-secondary" />

          <div className="flex gap-4 items-start">
            {/* Dialog content */}
            <div className="flex-1 space-y-2">
              {/* Speaker name header */}
              <div className="flex items-center gap-2">
                <span className="font-pixel text-xs text-secondary">{currentDialog.speaker.toUpperCase()}</span>
                {currentDialog.choices && currentDialog.choices.length === 0 && (
                  <div className="w-2 h-2 bg-secondary rounded-full" />
                )}
              </div>
              
              {/* Dialog text */}
              <p className="text-sm text-foreground/90 leading-relaxed min-h-[3rem]">
                {displayedText}
              </p>
            </div>
          </div>

          {/* Choices or Click to continue */}
          {currentDialog.choices && currentDialog.choices.length > 0 ? (
            <div className="space-y-2 mt-3 pt-3 border-t border-secondary/20">
              {currentDialog.choices.map((choice, idx) => (
                <button
                  key={choice.id}
                  onClick={() => handleChoiceSelect(choice)}
                  className="w-full text-left px-4 py-2 bg-secondary/10 hover:bg-secondary/20 border border-secondary/30 rounded text-xs text-foreground/80 hover:text-foreground transition-colors font-pixel group"
                >
                  <span className="text-secondary/60 group-hover:text-secondary">[{idx + 1}]</span> {choice.text}
                </button>
              ))}
            </div>
          ) : (
            <div
              className="flex items-center justify-end mt-3 pt-3 border-t border-secondary/20 cursor-pointer group"
              onClick={handleTextClick}
            >
              <span className="font-pixel text-[9px] text-secondary/60 group-hover:text-secondary transition-colors">
                CLICK TO CONTINUE &gt;&gt;
              </span>
            </div>
          )}

          {/* Decorative bottom line */}
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-secondary to-transparent" />
        </Card>
      </div>
    </>
  )
}, (prevProps, nextProps) => {
  // Deep comparison of critical props
  return JSON.stringify(prevProps.dialogNodes) === JSON.stringify(nextProps.dialogNodes) &&
         prevProps.startDialogId === nextProps.startDialogId &&
         prevProps.playerName === nextProps.playerName
})
