# Legacy Notes

This folder records cleanup decisions for assets or placeholders that were present in earlier project snapshots.

- `packages/game-client/landing-page.html` was an empty placeholder and is not part of the Vite app.
- `packages/game-client/src/ui/*.js` contained empty JavaScript placeholders. The active UI primitives live in `packages/game-client/src/components/ui`.

Keeping this note makes the cleanup visible without leaving empty files in the runtime source tree.
