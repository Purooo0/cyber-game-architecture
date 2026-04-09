/**
 * Map State API Service
 * Handles communication dengan backend untuk map game state
 */

export interface PlayerPos {
  x: number
  y: number
}

export interface MapState {
  sessionId?: string
  playerPos: PlayerPos
  playerDirection: string
  triggeredZones: string[]
  interactedObjects: string[]
  inventory: string[]
  savedAt?: string
}

export interface MapEvent {
  sessionId: string
  scenarioId: string
  eventType: 'trigger' | 'interaction' | 'movement'
  eventName: string
  eventData?: Record<string, any>
}

class MapStateService {
  private apiUrl = '/api/game'
  private token: string | null = null

  constructor() {
    this.token = localStorage.getItem('authToken')
  }

  async saveMapState(scenarioId: string, mapState: MapState): Promise<any> {
    try {
      const response = await fetch(`${this.apiUrl}/map/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify({
          scenarioId,
          mapState,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to save map state: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error saving map state:', error)
      throw error
    }
  }

  async loadMapState(scenarioId: string): Promise<MapState | null> {
    try {
      const response = await fetch(`${this.apiUrl}/map/load/${scenarioId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
      })

      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        throw new Error(`Failed to load map state: ${response.status}`)
      }

      const data = await response.json()
      return data.mapState
    } catch (error) {
      console.error('Error loading map state:', error)
      throw error
    }
  }

  async logMapEvent(event: MapEvent): Promise<any> {
    try {
      const response = await fetch(`${this.apiUrl}/map/event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify(event),
      })

      if (!response.ok) {
        throw new Error(`Failed to log map event: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error logging map event:', error)
      throw error
    }
  }

  /**
   * Log trigger event
   */
  async logTriggerEvent(
    sessionId: string,
    scenarioId: string,
    triggerName: string,
    action?: string
  ): Promise<any> {
    return this.logMapEvent({
      sessionId,
      scenarioId,
      eventType: 'trigger',
      eventName: triggerName,
      eventData: { action },
    })
  }

  /**
   * Log interaction event
   */
  async logInteractionEvent(
    sessionId: string,
    scenarioId: string,
    objectName: string,
    event?: string
  ): Promise<any> {
    return this.logMapEvent({
      sessionId,
      scenarioId,
      eventType: 'interaction',
      eventName: objectName,
      eventData: { event },
    })
  }

  /**
   * Log movement event (position change)
   */
  async logMovementEvent(
    sessionId: string,
    scenarioId: string,
    position: PlayerPos
  ): Promise<any> {
    return this.logMapEvent({
      sessionId,
      scenarioId,
      eventType: 'movement',
      eventName: 'player_moved',
      eventData: { position },
    })
  }
}

export default new MapStateService()
