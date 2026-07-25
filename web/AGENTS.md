# Dashboard guidance

- Preserve the visual identity and Phase 1-4 behavior in `docs/PHASES/`.
- Keep game and route-planning rules in pure modules; renderers may consume state but must not own it.
- The GitHub Pages build must use local autopilot mode and must never require a backend or secret.
- Preserve keyboard behavior, the accessible grid fallback, reduced-motion support, and narrow mobile layouts.
- Run `npm run lint`, `npm test`, `npm run build:pages`, `npm run verify:pages`, and `npm run test:e2e` after dashboard changes.
