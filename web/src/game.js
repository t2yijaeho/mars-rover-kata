export const DEFAULT_GRID_SIZE = 8;
export const MIN_GRID_SIZE = 4;
export const MAX_GRID_SIZE = 16;
export const MAX_FUEL = 100;
export const OBSTACLE_CHANCE = 0.2;

export const DIRECTIONS = Object.freeze({
  ArrowUp: Object.freeze({ x: 0, y: -1 }),
  ArrowDown: Object.freeze({ x: 0, y: 1 }),
  ArrowLeft: Object.freeze({ x: -1, y: 0 }),
  ArrowRight: Object.freeze({ x: 1, y: 0 }),
});

export const keyOf = (x, y) => `${x},${y}`;

export function startingPositionFor(width, height) {
  return { x: Math.floor(width / 2), y: Math.floor(height / 2) };
}

export function isInBounds(game, x, y) {
  return x >= 0 && x < game.width && y >= 0 && y < game.height;
}

export function isWalkable(game, x, y) {
  return isInBounds(game, x, y) && game.tiles[y][x] === "walkable";
}

export function calculateReachableTiles(game) {
  const reachable = new Set([keyOf(game.start.x, game.start.y)]);
  const queue = [game.start];

  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index];
    for (const direction of Object.values(DIRECTIONS)) {
      const next = { x: current.x + direction.x, y: current.y + direction.y };
      const nextKey = keyOf(next.x, next.y);
      if (isWalkable(game, next.x, next.y) && !reachable.has(nextKey)) {
        reachable.add(nextKey);
        queue.push(next);
      }
    }
  }
  return reachable;
}

export function setStatus(game, message, tone = "neutral") {
  game.status = message;
  game.tone = tone;
}

export function completeMission(game) {
  game.missionComplete = true;
  setStatus(game, "Mission Success: every reachable tile has been explored.", "complete");
}

export function regenerateGame(
  game,
  { width = game.width, height = game.height, random = Math.random } = {},
) {
  game.width = width;
  game.height = height;
  game.start = startingPositionFor(width, height);
  game.tiles = Array.from({ length: height }, () =>
    Array.from({ length: width }, () =>
      random() < OBSTACLE_CHANCE ? "obstacle" : "walkable",
    ),
  );
  game.tiles[game.start.y][game.start.x] = "walkable";
  game.spaceship = { ...game.start };
  game.fuel = game.maxFuel;
  game.reachableTiles = calculateReachableTiles(game);
  game.exploredTiles = new Set([keyOf(game.start.x, game.start.y)]);
  game.missionComplete = false;
  game.collisionKey = null;
  game.autoPilotRunning = false;
  game.agentState = "Autopilot standing by.";
  game.agentSource = "idle";
  setStatus(game, "Ready");

  if (game.reachableTiles.size === 1) completeMission(game);
  return game;
}

export function createGame(options = {}) {
  const width = options.width ?? DEFAULT_GRID_SIZE;
  const height = options.height ?? DEFAULT_GRID_SIZE;
  const game = {
    width,
    height,
    start: startingPositionFor(width, height),
    spaceship: { x: 0, y: 0 },
    tiles: [],
    fuel: MAX_FUEL,
    maxFuel: MAX_FUEL,
    reachableTiles: new Set(),
    exploredTiles: new Set(),
    missionComplete: false,
    status: "Ready",
    tone: "neutral",
    collisionKey: null,
    collisionToken: 0,
    autoPilotRunning: false,
    simulationToken: 0,
    agentState: "Autopilot standing by.",
    agentSource: "idle",
  };
  return regenerateGame(game, { width, height, random: options.random ?? Math.random });
}

export function attemptMove(game, command, { fromAutopilot = false } = {}) {
  if (!(command in DIRECTIONS)) return { stopped: true, reason: "unsupported" };
  if (game.missionComplete || (game.autoPilotRunning && !fromAutopilot)) {
    return { stopped: true, reason: "inactive" };
  }

  const direction = DIRECTIONS[command];
  const candidate = {
    x: game.spaceship.x + direction.x,
    y: game.spaceship.y + direction.y,
  };
  const validMove = isWalkable(game, candidate.x, candidate.y);
  const cost = validMove ? 1 : 10;

  if (game.fuel < cost) {
    setStatus(game, "Out of fuel: not enough fuel for that action.", "danger");
    return { stopped: true, reason: "fuel", candidate };
  }

  game.fuel -= cost;
  if (validMove) {
    game.spaceship = candidate;
    game.exploredTiles.add(keyOf(candidate.x, candidate.y));
    setStatus(game, "Pass: rover moved safely. 1 fuel used.", "pass");
    if (game.exploredTiles.size === game.reachableTiles.size) completeMission(game);
  } else {
    game.collisionKey = isInBounds(game, candidate.x, candidate.y)
      ? keyOf(candidate.x, candidate.y)
      : keyOf(game.spaceship.x, game.spaceship.y);
    setStatus(game, "Warning: collision detected. 10 fuel used.", "warning");
  }

  return {
    stopped: game.missionComplete || game.fuel === 0,
    moved: validMove,
    candidate,
  };
}

export function missionSnapshot(game) {
  return {
    width: game.width,
    height: game.height,
    tiles: game.tiles,
    rover: game.spaceship,
    fuel: game.fuel,
    max_fuel: game.maxFuel,
    explored: [...game.exploredTiles].map((tile) => {
      const [x, y] = tile.split(",").map(Number);
      return { x, y };
    }),
  };
}
