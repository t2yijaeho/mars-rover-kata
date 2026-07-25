from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator

MoveCommand = Literal["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]
TileType = Literal["walkable", "obstacle"]


class Position(BaseModel):
    x: int = Field(default=0, ge=0)
    y: int = Field(default=0, ge=0)
    direction: Literal["N", "E", "S", "W"] = "N"


class RoverRequest(BaseModel):
    width: int = Field(default=8, ge=1, le=100)
    height: int = Field(default=8, ge=1, le=100)
    position: Position = Field(default_factory=Position)
    commands: str = Field(default="")

    @field_validator("commands")
    @classmethod
    def validate_commands(cls, value: str) -> str:
        commands = value.upper().replace(" ", "")
        invalid = set(commands) - {"L", "R", "M"}
        if invalid:
            raise ValueError("Commands may only contain L, R, and M.")
        return commands


class RoverResponse(BaseModel):
    x: int
    y: int
    direction: Literal["N", "E", "S", "W"]
    path: list[tuple[int, int]]


class GridPosition(BaseModel):
    x: int = Field(ge=0)
    y: int = Field(ge=0)


class SimulationRequest(BaseModel):
    width: int = Field(ge=1, le=20)
    height: int = Field(ge=1, le=20)
    tiles: list[list[TileType]]
    rover: GridPosition
    fuel: int = Field(ge=0, le=1_000)
    max_fuel: int = Field(ge=1, le=1_000)
    explored: list[GridPosition] = Field(default_factory=list)

    @model_validator(mode="after")
    def validate_mission(self) -> SimulationRequest:
        if len(self.tiles) != self.height or any(len(row) != self.width for row in self.tiles):
            raise ValueError("Tile dimensions must match the map dimensions.")
        if self.rover.x >= self.width or self.rover.y >= self.height:
            raise ValueError("Rover position must be inside the map.")
        if self.tiles[self.rover.y][self.rover.x] != "walkable":
            raise ValueError("Rover must occupy a walkable tile.")
        if self.fuel > self.max_fuel:
            raise ValueError("Fuel cannot exceed maximum fuel.")
        for position in self.explored:
            if position.x >= self.width or position.y >= self.height:
                raise ValueError("Explored positions must be inside the map.")
            if self.tiles[position.y][position.x] != "walkable":
                raise ValueError("Only walkable tiles can be explored.")
        return self


class AgentRoute(BaseModel):
    commands: list[MoveCommand] = Field(default_factory=list, max_length=1_000)
    rationale: str = Field(min_length=1, max_length=280)


class SimulationResponse(BaseModel):
    commands: list[MoveCommand]
    rationale: str
    source: Literal["agent", "safety_fallback"]
    remaining_reachable: int
    total_reachable: int
    model: str | None = None
