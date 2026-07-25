import { DIRECTIONS } from "./game.js";

function keyOf(x, y) {
  return `${x},${y}`;
}

function isWalkable(snapshot, x, y) {
  return (
    y >= 0 &&
    y < snapshot.height &&
    x >= 0 &&
    x < snapshot.width &&
    snapshot.tiles[y][x] === "walkable"
  );
}

function reachableTiles(snapshot, start) {
  const seen = new Set([keyOf(start.x, start.y)]);
  const queue = [{ ...start }];
  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index];
    for (const direction of Object.values(DIRECTIONS)) {
      const next = { x: current.x + direction.x, y: current.y + direction.y };
      const key = keyOf(next.x, next.y);
      if (!seen.has(key) && isWalkable(snapshot, next.x, next.y)) {
        seen.add(key);
        queue.push(next);
      }
    }
  }
  return seen;
}

function shortestPath(snapshot, start, targets) {
  const queue = [{ ...start }];
  const seen = new Set([keyOf(start.x, start.y)]);
  const previous = new Map();
  let destination = null;

  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index];
    const currentKey = keyOf(current.x, current.y);
    if (targets.has(currentKey)) {
      destination = current;
      break;
    }
    for (const [command, direction] of Object.entries(DIRECTIONS)) {
      const next = { x: current.x + direction.x, y: current.y + direction.y };
      const nextKey = keyOf(next.x, next.y);
      if (!seen.has(nextKey) && isWalkable(snapshot, next.x, next.y)) {
        seen.add(nextKey);
        previous.set(nextKey, { parent: current, command });
        queue.push(next);
      }
    }
  }

  if (!destination) return null;
  const path = [];
  while (destination.x !== start.x || destination.y !== start.y) {
    const step = previous.get(keyOf(destination.x, destination.y));
    if (!step) return null;
    path.push(step.command);
    destination = step.parent;
  }
  return path.reverse();
}

export function buildSafeRoute(snapshot) {
  let current = { ...snapshot.rover };
  const reachable = reachableTiles(snapshot, current);
  const explored = new Set(
    snapshot.explored
      .map((position) => keyOf(position.x, position.y))
      .filter((key) => reachable.has(key)),
  );
  explored.add(keyOf(current.x, current.y));
  const commands = [];

  while (true) {
    const remaining = new Set([...reachable].filter((key) => !explored.has(key)));
    if (remaining.size === 0) break;
    const path = shortestPath(snapshot, current, remaining);
    if (!path || commands.length + path.length > snapshot.fuel) break;

    for (const command of path) {
      const direction = DIRECTIONS[command];
      current = { x: current.x + direction.x, y: current.y + direction.y };
      commands.push(command);
      explored.add(keyOf(current.x, current.y));
    }
  }

  return {
    commands,
    remaining_reachable: [...reachable].filter((key) => !explored.has(key)).length,
    total_reachable: reachable.size,
  };
}

export function localSimulationResponse(snapshot) {
  const route = buildSafeRoute(snapshot);
  return {
    ...route,
    rationale: "A verified collision-free route was prepared in this browser.",
    source: "safety_fallback",
    model: null,
  };
}
