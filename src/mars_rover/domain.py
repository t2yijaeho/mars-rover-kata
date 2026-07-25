from __future__ import annotations

from collections import deque

from fastapi import HTTPException

from mars_rover.models import MoveCommand, RoverRequest, RoverResponse, SimulationRequest

DIRECTIONS = ("N", "E", "S", "W")
VECTORS = {"N": (0, 1), "E": (1, 0), "S": (0, -1), "W": (-1, 0)}
MOVE_DELTAS: dict[MoveCommand, tuple[int, int]] = {
    "ArrowUp": (0, -1),
    "ArrowDown": (0, 1),
    "ArrowLeft": (-1, 0),
    "ArrowRight": (1, 0),
}


def position_key(x: int, y: int) -> str:
    return f"{x},{y}"


def is_walkable(tiles: list[list[str]], x: int, y: int) -> bool:
    return 0 <= y < len(tiles) and 0 <= x < len(tiles[0]) and tiles[y][x] == "walkable"


def reachable_tiles(tiles: list[list[str]], start: tuple[int, int]) -> set[tuple[int, int]]:
    seen = {start}
    queue = deque([start])
    while queue:
        x, y = queue.popleft()
        for dx, dy in MOVE_DELTAS.values():
            next_position = (x + dx, y + dy)
            if next_position not in seen and is_walkable(tiles, *next_position):
                seen.add(next_position)
                queue.append(next_position)
    return seen


def shortest_path_to_unexplored(
    tiles: list[list[str]],
    start: tuple[int, int],
    targets: set[tuple[int, int]],
) -> list[MoveCommand] | None:
    queue = deque([start])
    previous: dict[tuple[int, int], tuple[tuple[int, int], MoveCommand]] = {}
    seen = {start}
    destination: tuple[int, int] | None = None

    while queue:
        current = queue.popleft()
        if current in targets:
            destination = current
            break
        for command, (dx, dy) in MOVE_DELTAS.items():
            next_position = (current[0] + dx, current[1] + dy)
            if next_position not in seen and is_walkable(tiles, *next_position):
                seen.add(next_position)
                previous[next_position] = (current, command)
                queue.append(next_position)

    if destination is None:
        return None

    path: list[MoveCommand] = []
    while destination != start:
        parent, command = previous[destination]
        path.append(command)
        destination = parent
    path.reverse()
    return path


def build_safe_route(request: SimulationRequest) -> tuple[list[MoveCommand], int, int]:
    current = (request.rover.x, request.rover.y)
    reachable = reachable_tiles(request.tiles, current)
    explored = {
        (position.x, position.y)
        for position in request.explored
        if (position.x, position.y) in reachable
    }
    explored.add(current)
    commands: list[MoveCommand] = []

    while remaining := reachable - explored:
        path = shortest_path_to_unexplored(request.tiles, current, remaining)
        if path is None or len(commands) + len(path) > request.fuel:
            break
        for command in path:
            dx, dy = MOVE_DELTAS[command]
            current = (current[0] + dx, current[1] + dy)
            commands.append(command)
            explored.add(current)

    return commands, len(reachable - explored), len(reachable)


def route_is_safe(request: SimulationRequest, commands: list[MoveCommand]) -> bool:
    if len(commands) > request.fuel:
        return False
    x, y = request.rover.x, request.rover.y
    for command in commands:
        dx, dy = MOVE_DELTAS[command]
        x, y = x + dx, y + dy
        if not is_walkable(request.tiles, x, y):
            return False
    return True


def move_rover(request: RoverRequest) -> RoverResponse:
    if request.position.x >= request.width or request.position.y >= request.height:
        raise HTTPException(status_code=422, detail="Starting position must be inside the plateau.")

    x, y, direction = request.position.x, request.position.y, request.position.direction
    path = [(x, y)]

    for command in request.commands:
        current = DIRECTIONS.index(direction)
        if command == "L":
            direction = DIRECTIONS[(current - 1) % len(DIRECTIONS)]
        elif command == "R":
            direction = DIRECTIONS[(current + 1) % len(DIRECTIONS)]
        else:
            dx, dy = VECTORS[direction]
            next_x, next_y = x + dx, y + dy
            if not (0 <= next_x < request.width and 0 <= next_y < request.height):
                raise HTTPException(
                    status_code=422,
                    detail=f"Rover would leave the plateau at ({next_x}, {next_y}).",
                )
            x, y = next_x, next_y
            path.append((x, y))

    return RoverResponse(x=x, y=y, direction=direction, path=path)
