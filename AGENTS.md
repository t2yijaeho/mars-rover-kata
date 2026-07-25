# Mars Rover KATA guidance

## Source of truth

Consult `docs/PHASES/` before changing rover behavior. Read `PHASE1.md` first and
implement the numbered phases in order. `PHASE1~4.md` is an index only; each
`PHASEx.md` file is authoritative.

## Repository map

- `src/mars_rover/`: domain rules, settings, optional AI integration, and FastAPI.
- `web/`: Vite dashboard, browser planner, renderers, and browser tests.
- `tests/`: Python tests and shared planner fixtures.
- `.agents/skills/`: repository maintenance and release workflow.
- `.codex/agents/`: bounded review agents.

Read the nearest nested `AGENTS.md` before changing files in a subdirectory.

## Setup and verification

```powershell
uv sync --locked
Push-Location web
npm ci
Pop-Location
python .agents/skills/maintain-mars-rover/scripts/check_release.py
```

Do not weaken a test, coverage threshold, lint rule, security check, or browser
assertion to make a change pass.

## Security rules

- Never commit `.env`, credentials, tokens, logs, caches, or generated browser output.
- Do not load `.env` during module import. Local startup may pass `--env-file .env`.
- OpenAI autopilot is opt-in through `ENABLE_OPENAI_AUTOPILOT=true`; a key alone
  must never enable a model call.
- Never expose an OpenAI key to Vite or browser code.
- Pin third-party GitHub Actions to immutable commit SHAs.

## Definition of done

A cross-stack or release change is done only after the release checker passes
and the `roadmap_auditor`, `security_reviewer`, and `ui_verifier` perform explicit
final reviews. Preserve the documented dashboard appearance, public static
playability, and all Phase 1-4 behavior.
