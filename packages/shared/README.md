# Shared Package

Shared utilities, types, dan constants yang digunakan across game-engine, game-client, dan game-server.

## Usage

### Constants
```javascript
import { DIFFICULTY_LEVELS, SCENE_KEYS } from '@cyber-game/shared/constants'

const difficulty = DIFFICULTY_LEVELS.EASY
const scene = SCENE_KEYS.BEDROOM
```

### Utils
```javascript
import { calculateLevelFromXP, formatScore, formatTime } from '@cyber-game/shared/utils'

const level = calculateLevelFromXP(2450)
const score = formatScore(1000000)
const time = formatTime(125)
```

### Types (for documentation)
```javascript
import { Types } from '@cyber-game/shared/types'

/**
 * @param {Types.Player} player
 * @returns {Types.MissionResult}
 */
function submitMission(player) {
  // ...
}
```

## Future

- Add TypeScript definitions
- Add validation schemas
- Add error types
- Add logger utility
