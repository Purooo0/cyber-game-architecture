# Project Structure

This document explains the main directories in the Cyber Game Architecture monorepo.

## Root

```text
.
├── package.json
├── package-lock.json
├── README.md
├── docs/
└── packages/
```

- `package.json` defines workspace-level scripts for the client and server.
- `package-lock.json` is committed for reproducible installs.
- `docs/` stores portfolio documentation and cleanup notes.
- `packages/` contains the runtime applications.

## Frontend: `packages/game-client`

```text
packages/game-client/
├── public/      Static game assets, tilemaps, tilesets, sprites, and objects.
├── scripts/     Asset helper scripts.
└── src/
    ├── components/  React pages, UI primitives, dialogs, and gameplay wrappers.
    ├── game/        Phaser scene classes, runtime hooks, NPC helpers, and game types.
    ├── hooks/       React data hooks for dashboard/profile/game state.
    ├── lib/         API base URL, JSON helpers, debug helpers, and utilities.
    ├── services/    API client, Tiled map loading, object-layer parsing, and tileset loading.
    └── styles/      Global, UI, landing, and game styles.
```

Important entry points:

- `src/main.tsx` mounts the React application.
- `src/App.tsx` handles top-level navigation, auth state, and scenario selection.
- `src/game/PhaserGameScene.ts` contains the Phaser map scene.
- `src/components/PhaserGameContainer.tsx` bridges React state with the Phaser scene.

## Backend: `packages/game-server`

```text
packages/game-server/
└── src/
    ├── config/       Firebase, auth, game, scoring, and feedback config.
    ├── controllers/  HTTP request handlers.
    ├── data/         Scenario seed data.
    ├── middleware/   Authentication middleware.
    ├── models/       Firebase-backed model helpers.
    ├── routes/       Express route definitions.
    ├── scripts/      Seed scripts.
    ├── services/     Auth, badges, leaderboard, scenarios, and DB init.
    └── utils/        Hashing, JWT, and scoring helpers.
```

Important entry points:

- `src/index.js` starts the server.
- `src/app.js` creates the Express app and registers API routes.
- `src/config/firebase.js` initializes Firebase Admin safely for local and serverless environments.

## Legacy Notes

`docs/legacy/` documents files that were removed from the runtime tree because they were empty placeholders or old non-runtime artifacts.
