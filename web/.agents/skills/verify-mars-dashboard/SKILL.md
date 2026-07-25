---
name: verify-mars-dashboard
description: Verify the Mars Rover dashboard across responsive layouts, accessibility, WebGL fallback, local autopilot, and GitHub Pages paths. Use after web changes, before Pages deployment, or when investigating browser and static-hosting regressions.
---

# Verify Mars Dashboard

## Workflow

1. Read `web/AGENTS.md` and the detailed numbered roadmap phases.
2. From `web/`, run `npm ci`, `npm run lint`, `npm test`,
   `npm run build:pages`, `npm run verify:pages`, and `npm run test:e2e`.
3. Check desktop and mobile behavior: keyboard movement, map resizing, fuel,
   obstacles, reachability, completion, reset, and deterministic autopilot.
4. Confirm controls and telemetry remain usable when WebGL is unavailable.
5. Confirm reduced-motion users receive no forced animation and automated
   accessibility checks have no serious or critical findings.
6. Reject public builds containing API calls, secrets, root-relative asset
   paths, runtime CDNs, or external font dependencies.
7. Preserve one sanitized release screenshot and report evidence precisely.

When acting as a verifier, do not edit source files. Report failures for the
implementer to resolve.
