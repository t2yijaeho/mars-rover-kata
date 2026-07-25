# Backend guidance

- Keep domain rules pure and independent from FastAPI and the OpenAI Agents SDK.
- Never load `.env` files during module import. Tests must use explicit `Settings` values and must not make network calls.
- Preserve validation limits and the `/health`, `/api/rover`, and `/api/agent/simulate` contracts.
- Accept an agent route only when it exactly matches the deterministic route and passes the safety check.
- Run `uv run ruff check .`, `uv run pytest`, and `uv run bandit -c pyproject.toml -r src` after backend changes.
