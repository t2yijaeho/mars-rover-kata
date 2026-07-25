from __future__ import annotations

import os
from dataclasses import dataclass

TRUE_VALUES = frozenset({"1", "true", "yes", "on"})


@dataclass(frozen=True, slots=True)
class Settings:
    """Runtime settings sourced from process environment only."""

    enable_openai_autopilot: bool = False
    openai_api_key: str | None = None
    openai_model: str | None = None

    @classmethod
    def from_env(cls) -> Settings:
        enabled = os.getenv("ENABLE_OPENAI_AUTOPILOT", "").strip().lower() in TRUE_VALUES
        settings = cls(
            enable_openai_autopilot=enabled,
            openai_api_key=os.getenv("OPENAI_API_KEY") or None,
            openai_model=os.getenv("OPENAI_MODEL") or None,
        )
        settings.validate()
        return settings

    def validate(self) -> None:
        if not self.enable_openai_autopilot:
            return
        missing = [
            name
            for name, value in (
                ("OPENAI_API_KEY", self.openai_api_key),
                ("OPENAI_MODEL", self.openai_model),
            )
            if not value
        ]
        if missing:
            names = ", ".join(missing)
            raise ValueError(f"{names} must be set when ENABLE_OPENAI_AUTOPILOT=true.")
