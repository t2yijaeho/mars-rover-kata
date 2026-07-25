---
name: maintain-mars-rover
description: Maintain, refactor, verify, and publish the Mars Rover KATA repository. Use for cross-stack changes, Phase 1-4 behavior, dependency or security updates, release preparation, GitHub Pages publishing, and public-repository audits.
---

# Maintain Mars Rover

Preserve the numbered roadmap and treat backend, browser, tests, and publishing
as one release surface.

## Workflow

1. Read the root `AGENTS.md`, every detailed numbered phase, and the nearest
   nested `AGENTS.md`.
2. Keep movement and planning rules pure. Keep optional network integration at
   the boundary and disabled by default.
3. Update Python and JavaScript tests together. Use
   `tests/fixtures/route_cases.json` for route-planner expectations.
4. Build GitHub Pages with local autopilot. Never place a secret or required API
   request in the public build.
5. Run `scripts/check_release.py` from the repository root.
6. Fix failures without weakening checks. Request the three project review
   agents for a final cross-cutting review before release.

## Release invariants

- Preserve `/health`, `POST /api/rover`, and `POST /api/agent/simulate`.
- Deterministic execution reports `source: "safety_fallback"` and `model: null`.
- Accept an AI route only when it exactly matches the verified safe route.
- Preserve keyboard control, mobile layout, map sizing, fuel, collisions,
  reachability, completion, reduced motion, and a WebGL-independent interface.
- Commit both lockfiles and exactly one sanitized dashboard screenshot.
