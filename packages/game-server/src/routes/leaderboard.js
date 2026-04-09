/**
 * Leaderboard Routes
 */

import express from 'express'
import PlayerService from '../services/player.js'

const router = express.Router()

/**
 * Get top players
 */
router.get('/', async (req, res) => {
  try {
    const limit = req.query.limit || 100
    const players = await PlayerService.getAllPlayers(parseInt(limit))
    
    // Add rank
    const ranked = players.map((p, index) => ({
      rank: index + 1,
      ...p
    }))

    res.json(ranked)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * Get player rank
 */
router.get('/player/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params
    const allPlayers = await PlayerService.getAllPlayers(1000)
    
    const playerRank = allPlayers.findIndex(p => p.id === playerId)
    
    if (playerRank === -1) {
      return res.status(404).json({ error: 'Player not found' })
    }

    res.json({
      rank: playerRank + 1,
      totalPlayers: allPlayers.length,
      player: allPlayers[playerRank]
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
