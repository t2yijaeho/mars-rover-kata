import json
from pathlib import Path

import pytest
from fastapi import HTTPException

from mars_rover.domain import build_safe_route, move_rover, route_is_safe
from mars_rover.models import RoverRequest, SimulationRequest

FIXTURES = Path(__file__).parent / "fixtures" / "route_cases.json"


@pytest.mark.parametrize("case", json.loads(FIXTURES.read_text(encoding="utf-8")))
def test_route_fixtures(case: dict[str, object]) -> None:
    request = SimulationRequest.model_validate(
        {
            key: value
            for key, value in case.items()
            if not key.startswith("expected_") and key != "name"
        }
    )

    commands, remaining, total = build_safe_route(request)

    assert commands == case["expected_commands"]
    assert remaining == case["expected_remaining"]
    assert total == case["expected_total"]
    assert route_is_safe(request, commands)


def test_rover_turns_and_moves() -> None:
    response = move_rover(
        RoverRequest(
            width=5,
            height=5,
            position={"x": 0, "y": 0, "direction": "N"},
            commands="RMM",
        )
    )

    assert response.model_dump() == {
        "x": 2,
        "y": 0,
        "direction": "E",
        "path": [(0, 0), (1, 0), (2, 0)],
    }


def test_rover_rejects_out_of_bounds_start() -> None:
    with pytest.raises(HTTPException, match="inside the plateau"):
        move_rover(
            RoverRequest(
                width=2,
                height=2,
                position={"x": 2, "y": 0, "direction": "N"},
            )
        )


def test_rover_rejects_move_beyond_plateau() -> None:
    with pytest.raises(HTTPException, match="leave the plateau"):
        move_rover(
            RoverRequest(
                width=2,
                height=2,
                position={"x": 0, "y": 0, "direction": "S"},
                commands="M",
            )
        )
