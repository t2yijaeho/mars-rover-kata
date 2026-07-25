from types import SimpleNamespace

import pytest

from mars_rover.autopilot import AutopilotService
from mars_rover.config import Settings
from mars_rover.models import AgentRoute, SimulationRequest


@pytest.fixture
def mission() -> SimulationRequest:
    return SimulationRequest(
        width=2,
        height=2,
        tiles=[
            ["walkable", "walkable"],
            ["obstacle", "walkable"],
        ],
        rover={"x": 0, "y": 0},
        fuel=10,
        max_fuel=100,
        explored=[{"x": 0, "y": 0}],
    )


def test_disabled_autopilot_never_calls_runner(
    mission: SimulationRequest,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    def fail_if_called(*_args: object, **_kwargs: object) -> None:
        raise AssertionError("Runner must not be called")

    monkeypatch.setattr("mars_rover.autopilot.Runner.run_sync", fail_if_called)
    service = AutopilotService(
        Settings(
            enable_openai_autopilot=False,
            openai_api_key="present-but-unused",
            openai_model="present-but-unused",
        )
    )

    response = service.simulate(mission)

    assert response.source == "safety_fallback"
    assert response.model is None
    assert response.commands == ["ArrowRight", "ArrowDown"]


def test_verified_agent_route_is_accepted(
    mission: SimulationRequest,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    output = AgentRoute(
        commands=["ArrowRight", "ArrowDown"],
        rationale="Verified route.",
    )
    monkeypatch.setattr(
        "mars_rover.autopilot.Runner.run_sync",
        lambda *_args, **_kwargs: SimpleNamespace(final_output=output),
    )
    service = AutopilotService(
        Settings(True, openai_api_key="test-key", openai_model="test-model")
    )

    response = service.simulate(mission)

    assert response.source == "agent"
    assert response.model == "test-model"
    assert response.rationale == "Verified route."


def test_unverified_agent_route_falls_back(
    mission: SimulationRequest,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    output = AgentRoute(commands=["ArrowLeft"], rationale="Unsafe route.")
    monkeypatch.setattr(
        "mars_rover.autopilot.Runner.run_sync",
        lambda *_args, **_kwargs: SimpleNamespace(final_output=output),
    )
    service = AutopilotService(
        Settings(True, openai_api_key="test-key", openai_model="test-model")
    )

    response = service.simulate(mission)

    assert response.source == "safety_fallback"
    assert response.model is None


def test_agent_failure_falls_back(
    mission: SimulationRequest,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    def raise_failure(*_args: object, **_kwargs: object) -> None:
        raise RuntimeError("simulated failure")

    monkeypatch.setattr("mars_rover.autopilot.Runner.run_sync", raise_failure)
    service = AutopilotService(
        Settings(True, openai_api_key="test-key", openai_model="test-model")
    )

    response = service.simulate(mission)

    assert response.source == "safety_fallback"
