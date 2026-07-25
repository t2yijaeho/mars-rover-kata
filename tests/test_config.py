import pytest

from mars_rover.config import Settings


def test_settings_are_network_off_by_default(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("ENABLE_OPENAI_AUTOPILOT", raising=False)
    monkeypatch.setenv("OPENAI_API_KEY", "present-but-unused")
    monkeypatch.setenv("OPENAI_MODEL", "present-but-unused")

    settings = Settings.from_env()

    assert settings.enable_openai_autopilot is False


def test_enabled_autopilot_requires_key_and_model(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("ENABLE_OPENAI_AUTOPILOT", "true")
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.delenv("OPENAI_MODEL", raising=False)

    with pytest.raises(ValueError, match="OPENAI_API_KEY, OPENAI_MODEL"):
        Settings.from_env()


def test_enabled_autopilot_accepts_complete_configuration(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("ENABLE_OPENAI_AUTOPILOT", "yes")
    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    monkeypatch.setenv("OPENAI_MODEL", "test-model")

    settings = Settings.from_env()

    assert settings.enable_openai_autopilot is True
    assert settings.openai_model == "test-model"
