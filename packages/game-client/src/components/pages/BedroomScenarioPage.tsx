/**
 * Bedroom Scenario Test Page
 * Test map rendering and game mechanics for bedroom map
 */

import { useState } from 'react'
import { PhaserGameContainer } from '../PhaserGameContainer'
import type { TriggerBox, InteractiveObject } from '../../game/types'

export function BedroomScenarioPage() {
  const [debugMode, setDebugMode] = useState(false)
  const [triggeredEvents, setTriggeredEvents] = useState<string[]>([])
  const [interactedObjects, setInteractedObjects] = useState<string[]>([])

  const handleTrigger = (trigger: TriggerBox) => {
    console.log('Trigger activated:', trigger)
    setTriggeredEvents(prev => [...prev, `${trigger.name} (${trigger.action || 'unknown'})`])
  }

  const handleInteract = (interactive: InteractiveObject) => {
    console.log('Interactive object interacted:', interactive)
    setInteractedObjects(prev => [...prev, `${interactive.name} (${interactive.event || 'unknown'})`])
  }

  return (
    <div className="w-full h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 p-4 border-b-2 border-green-500">
        <h1 className="text-2xl font-press-start text-green-500 mb-2">BEDROOM SCENARIO</h1>
        <p className="text-xs text-gray-400">Scenario 1 - Bedroom Map Testing (Phaser Engine)</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Game Canvas */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <PhaserGameContainer
            mapPath="/bedroom_map.tmj"
            width={1280}
            height={960}
            onTrigger={handleTrigger}
            onInteract={handleInteract}
            debug={debugMode}
          />
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-gray-800 border-l-2 border-green-500 p-4 overflow-y-auto">
          {/* Debug Controls */}
          <div className="mb-6 p-4 border-2 border-green-500">
            <h2 className="text-lg font-press-start text-green-500 mb-3">DEBUG</h2>
            <button
              onClick={() => setDebugMode(!debugMode)}
              className={`w-full px-4 py-2 border-2 font-press-start text-xs mb-3 transition ${
                debugMode
                  ? 'bg-green-500 text-black border-green-500'
                  : 'bg-gray-900 text-green-500 border-green-500 hover:bg-green-500 hover:text-black'
              }`}
            >
              {debugMode ? 'DEBUG: ON' : 'DEBUG: OFF'}
            </button>
            <button
              onClick={() => {
                setTriggeredEvents([])
                setInteractedObjects([])
              }}
              className="w-full px-4 py-2 border-2 border-green-500 bg-gray-900 text-green-500 font-press-start text-xs hover:bg-green-500 hover:text-black transition"
            >
              CLEAR LOG
            </button>
          </div>

          {/* Events Log */}
          <div className="mb-6 p-4 border-2 border-green-500">
            <h3 className="text-sm font-press-start text-green-500 mb-3">TRIGGER EVENTS</h3>
            <div className="space-y-1 text-xs font-mono bg-black p-2 h-40 overflow-y-auto border border-green-500">
              {triggeredEvents.length === 0 ? (
                <p className="text-gray-500">No triggers activated</p>
              ) : (
                triggeredEvents.map((event, idx) => (
                  <p key={idx} className="text-green-400">
                    [{idx + 1}] {event}
                  </p>
                ))
              )}
            </div>
          </div>

          {/* Interactive Log */}
          <div className="p-4 border-2 border-green-500">
            <h3 className="text-sm font-press-start text-green-500 mb-3">INTERACTIONS</h3>
            <div className="space-y-1 text-xs font-mono bg-black p-2 h-40 overflow-y-auto border border-green-500">
              {interactedObjects.length === 0 ? (
                <p className="text-gray-500">No interactions yet</p>
              ) : (
                interactedObjects.map((obj, idx) => (
                  <p key={idx} className="text-yellow-400">
                    [{idx + 1}] {obj}
                  </p>
                ))
              )}
            </div>
          </div>

          {/* Info */}
          <div className="mt-6 p-4 border-2 border-yellow-500 bg-gray-900 text-xs text-gray-300">
            <p className="mb-2">
              <span className="text-green-500">Movement:</span> ↑↓←→ or WASD
            </p>
            <p className="mb-2">
              <span className="text-green-500">Interact:</span> E or ENTER
            </p>
            <p>
              <span className="text-green-500">Collision:</span> Red boxes in debug mode
            </p>
            <p>
              <span className="text-green-500">Triggers:</span> Blue boxes in debug mode
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
