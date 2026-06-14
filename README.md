# Cyber Game Architecture

Educational cybersecurity game built as a monorepo with a React/Vite client and an Express/Firebase backend.

The game teaches practical security decisions through scenario-based missions, including phishing response and unsafe public Wi-Fi recognition. The client renders interactive 2D maps with Phaser and Tiled assets, while the server stores users, sessions, scoring, badges, endings, and feedback analytics in Firebase Realtime Database.

## Project Highlights

- Scenario-driven cybersecurity learning game.
- React frontend with Phaser-powered map gameplay.
- Express API with JWT authentication and Firebase persistence.
- Scoring, XP, badge, leaderboard, and ending tracking flows.
- Admin feedback analytics for reviewing player answers.
- Monorepo layout prepared for portfolio review.

## Tech Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, Phaser 3.
- Backend: Node.js, Express, Firebase Admin SDK, JWT.
- Tooling: npm workspaces, Vercel configs, Tiled `.tmj` maps.

## Repository Structure

```text
packages/
  game-client/   React + Phaser frontend and public game assets.
  game-server/   Express API, Firebase services, routes, scoring, and models.
docs/
  legacy/        Notes about removed placeholders or old non-runtime files.
```

For a more detailed map of the folders, see [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md).

## Local Setup

1. Install dependencies from the repository root:

```bash
npm install
```

2. Configure backend environment:

```bash
cp packages/game-server/.env.example packages/game-server/.env
```

Fill the Firebase Admin and JWT values in `packages/game-server/.env`.

3. Configure frontend environment:

```bash
cp packages/game-client/.env.example packages/game-client/.env
```

4. Run the backend:

```bash
npm run server
```

5. In another terminal, run the frontend:

```bash
npm run dev
```

Frontend default URL: `http://localhost:5173`

Backend default URL: `http://localhost:3000`

## Useful Scripts

```bash
npm run dev         # Run the Vite client.
npm run dev:all     # Run the client and server together.
npm run server      # Run the Express backend.
npm run build       # Build workspaces.
npm run type-check  # Type-check workspaces.
npm run lint        # Run workspace lint commands.
```

## Environment Notes

- `VITE_API_URL` should point to the deployed backend URL in production.
- `INIT_TEST_USERS=true` can seed development-only test users.
- Keep real Firebase service account values in `.env`, never in committed files.

## Portfolio Notes

The runtime source code is separated from documentation and legacy notes. Generated folders such as `node_modules`, `dist`, local `.env`, and OS metadata are ignored so the repository stays reviewable and reproducible.
