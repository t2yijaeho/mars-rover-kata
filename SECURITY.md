# Security policy

## Supported version

Security fixes are applied to the latest commit on `main`.

## Reporting a vulnerability

Please use GitHub's private **Report a vulnerability** flow from the repository's
Security tab. Do not open a public issue for a suspected vulnerability or exposed
credential.

Include the affected endpoint or component, reproduction steps, impact, and any
suggested mitigation. You should receive an acknowledgement within seven days.

## Secrets and hosted AI

The public GitHub Pages deployment never receives an OpenAI API key. OpenAI-backed
autopilot execution is disabled unless a local operator explicitly sets
`ENABLE_OPENAI_AUTOPILOT=true` and supplies both `OPENAI_API_KEY` and `OPENAI_MODEL`.
