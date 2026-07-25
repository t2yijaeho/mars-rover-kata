from __future__ import annotations

import json
import logging
from functools import cached_property

from agents import Agent, Runner, function_tool

from mars_rover.config import Settings
from mars_rover.domain import build_safe_route, position_key, route_is_safe
from mars_rover.models import (
    AgentRoute,
    GridPosition,
    SimulationRequest,
    SimulationResponse,
)

logger = logging.getLogger(__name__)


@function_tool
def calculate_safe_exploration_route(
    grid_rows: list[str],
    rover_x: int,
    rover_y: int,
    explored_tiles: list[str],
    available_fuel: int,
) -> dict[str, object]:
    """Calculate a collision-free route through unexplored reachable Mars tiles."""
    tiles = [["walkable" if cell == "." else "obstacle" for cell in row] for row in grid_rows]
    explored = [
        GridPosition(x=int(tile.split(",")[0]), y=int(tile.split(",")[1]))
        for tile in explored_tiles
    ]
    request = SimulationRequest(
        width=len(tiles[0]),
        height=len(tiles),
        tiles=tiles,
        rover=GridPosition(x=rover_x, y=rover_y),
        fuel=available_fuel,
        max_fuel=max(available_fuel, 1),
        explored=explored,
    )
    commands, remaining, total = build_safe_route(request)
    return {
        "commands": commands,
        "remaining_reachable": remaining,
        "total_reachable": total,
    }


class AutopilotService:
    def __init__(self, settings: Settings) -> None:
        settings.validate()
        self.settings = settings

    @cached_property
    def agent(self) -> Agent:
        if not self.settings.enable_openai_autopilot or not self.settings.openai_model:
            raise RuntimeError("OpenAI autopilot is disabled.")
        return Agent(
            name="Mars Mission Autopilot",
            model=self.settings.openai_model,
            tools=[calculate_safe_exploration_route],
            output_type=AgentRoute,
            instructions=(
                "You are a precise Mars rover simulation autopilot. The user message contains a "
                "mission snapshot as JSON data. Always call "
                "calculate_safe_exploration_route exactly once using the snapshot values. Return "
                "its command list exactly, without collisions or speculative moves. Provide a "
                "concise rationale under 180 characters."
            ),
        )

    def simulate(self, request: SimulationRequest) -> SimulationResponse:
        fallback_commands, remaining, total = build_safe_route(request)
        fallback = SimulationResponse(
            commands=fallback_commands,
            rationale="A verified collision-free route was prepared from the live mission state.",
            source="safety_fallback",
            remaining_reachable=remaining,
            total_reachable=total,
            model=None,
        )

        if not self.settings.enable_openai_autopilot:
            return fallback

        mission_snapshot = {
            "grid_rows": [
                "".join("." if tile == "walkable" else "#" for tile in row)
                for row in request.tiles
            ],
            "rover_x": request.rover.x,
            "rover_y": request.rover.y,
            "explored_tiles": [
                position_key(position.x, position.y) for position in request.explored
            ],
            "available_fuel": request.fuel,
        }

        try:
            result = Runner.run_sync(self.agent, json.dumps(mission_snapshot), max_turns=3)
            route = result.final_output
            if not isinstance(route, AgentRoute):
                route = AgentRoute.model_validate(route)
            if route.commands == fallback_commands and route_is_safe(request, route.commands):
                return SimulationResponse(
                    commands=route.commands,
                    rationale=route.rationale,
                    source="agent",
                    remaining_reachable=remaining,
                    total_reachable=total,
                    model=self.settings.openai_model,
                )
        except Exception:
            logger.exception("Autopilot agent failed; serving the verified fallback route.")

        return fallback
