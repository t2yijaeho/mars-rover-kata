import { planMission } from "./api.js";
import {
  DIRECTIONS,
  MAX_GRID_SIZE,
  MIN_GRID_SIZE,
  attemptMove,
  createGame,
  keyOf,
  missionSnapshot,
  regenerateGame,
  setStatus,
} from "./game.js";

const FUEL_SEGMENTS = 20;
const KEY_CELLS = {
  ArrowUp: ".key-up",
  ArrowDown: ".key-down",
  ArrowLeft: ".key-left",
  ArrowRight: ".key-right",
};
const wait = (milliseconds) =>
  new Promise((resolve) => window.setTimeout(resolve, milliseconds));

function queryElements() {
  return {
    board: document.querySelector("#map-board"),
    coordinates: document.querySelector("#coordinates"),
    fuelValue: document.querySelector("#fuel-value"),
    fuelMeter: document.querySelector("#fuel-meter"),
    exploredValue: document.querySelector("#explored-value"),
    statusCard: document.querySelector("#status-card"),
    statusMessage: document.querySelector("#status-message"),
    completeNote: document.querySelector("#complete-note"),
    newMap: document.querySelector("#new-map"),
    autopilot: document.querySelector("#autopilot"),
    autopilotLabel: document.querySelector("#autopilot-label"),
    agentState: document.querySelector("#agent-state"),
    agentStateText: document.querySelector("#agent-state .agent-state__text"),
    gridWidth: document.querySelector("#grid-width"),
    gridHeight: document.querySelector("#grid-height"),
    applyGrid: document.querySelector("#apply-grid"),
  };
}

function buildFuelGauge(elements) {
  const fragment = document.createDocumentFragment();
  for (let index = 0; index < FUEL_SEGMENTS; index += 1) {
    const segment = document.createElement("span");
    segment.className = "fuel-meter__seg";
    fragment.append(segment);
  }
  elements.fuelMeter.replaceChildren(fragment);
}

function flashKey(command) {
  const element = document.querySelector(KEY_CELLS[command]);
  if (!element) return;
  element.classList.add("is-active");
  window.clearTimeout(element.flashTimer);
  element.flashTimer = window.setTimeout(() => element.classList.remove("is-active"), 170);
}

function renderBoard(game, elements) {
  const fragment = document.createDocumentFragment();
  const spaceshipKey = keyOf(game.spaceship.x, game.spaceship.y);
  elements.board.style.gridTemplateColumns = `repeat(${game.width}, minmax(0, 1fr))`;
  elements.board.classList.toggle("is-collision", game.collisionKey !== null);

  for (let y = 0; y < game.height; y += 1) {
    const row = document.createElement("div");
    row.className = "map-row";
    row.setAttribute("role", "row");
    for (let x = 0; x < game.width; x += 1) {
      const cellKey = keyOf(x, y);
      const obstacle = game.tiles[y][x] === "obstacle";
      const spaceship = cellKey === spaceshipKey;
      const cell = document.createElement("div");
      cell.className = "map-cell";
      cell.classList.toggle("is-obstacle", obstacle);
      cell.classList.toggle("is-explored", game.exploredTiles.has(cellKey));
      cell.classList.toggle("is-start", cellKey === keyOf(game.start.x, game.start.y));
      cell.classList.toggle("is-collision", cellKey === game.collisionKey);
      cell.setAttribute("role", "gridcell");
      const state = spaceship
        ? "rover"
        : obstacle
          ? "obstacle"
          : game.exploredTiles.has(cellKey)
            ? "explored"
            : "unexplored";
      cell.setAttribute("aria-label", `Tile ${x}, ${y}: ${state}`);

      const coordinate = document.createElement("span");
      coordinate.className = "map-cell__coord";
      coordinate.textContent = `${String(x).padStart(2, "0")},${String(y).padStart(2, "0")}`;
      coordinate.setAttribute("aria-hidden", "true");
      cell.append(coordinate);

      if (spaceship) {
        const rover = document.createElement("span");
        rover.className = "map-cell__ship";
        rover.setAttribute("aria-hidden", "true");
        cell.append(rover);
      }
      row.append(cell);
    }
    fragment.append(row);
  }

  elements.board.replaceChildren(fragment);
  const mapState = {
    width: game.width,
    height: game.height,
    tiles: game.tiles,
    start: game.start,
    spaceship: game.spaceship,
    exploredTiles: [...game.exploredTiles],
    collisionKey: game.collisionKey,
  };
  window.missionMap = mapState;
  window.dispatchEvent(new CustomEvent("mission-map-update", { detail: mapState }));
}

function renderTelemetry(game, elements) {
  const lowFuel = game.fuel <= 20;
  const filledSegments = Math.round((game.fuel / game.maxFuel) * FUEL_SEGMENTS);
  elements.coordinates.textContent = `X: ${game.spaceship.x} / Y: ${game.spaceship.y}`;
  elements.fuelValue.textContent = `${game.fuel} / ${game.maxFuel}`;
  elements.fuelValue.classList.toggle("is-low", lowFuel);
  elements.fuelMeter.classList.toggle("is-low", lowFuel);
  for (let index = 0; index < elements.fuelMeter.children.length; index += 1) {
    elements.fuelMeter.children[index].classList.toggle("is-filled", index < filledSegments);
  }
  elements.exploredValue.textContent = `${game.exploredTiles.size} / ${game.reachableTiles.size}`;
  elements.statusCard.dataset.tone = game.tone;
  elements.statusMessage.textContent = game.status;
  elements.completeNote.hidden = !game.missionComplete;
  elements.autopilot.disabled = game.autoPilotRunning || game.missionComplete;
  elements.autopilotLabel.textContent = game.autoPilotRunning
    ? "Autopilot navigating..."
    : "Run Autopilot";
  elements.autopilot.setAttribute("aria-busy", String(game.autoPilotRunning));

  const existingScan = elements.autopilot.querySelector(".btn__scan");
  if (game.autoPilotRunning && !existingScan) {
    const scan = document.createElement("span");
    scan.className = "btn__scan";
    scan.setAttribute("aria-hidden", "true");
    elements.autopilot.append(scan);
  } else if (!game.autoPilotRunning && existingScan) {
    existingScan.remove();
  }

  elements.agentState.dataset.state = game.agentSource;
  elements.agentStateText.textContent = game.agentState;
  const telemetry = {
    x: game.spaceship.x,
    y: game.spaceship.y,
    fuel: game.fuel,
    maxFuel: game.maxFuel,
    width: game.width,
    height: game.height,
    missionComplete: game.missionComplete,
    autopilot: game.autoPilotRunning,
  };
  window.missionTelemetry = telemetry;
  window.dispatchEvent(new CustomEvent("mission-update", { detail: telemetry }));
}

export function initializeDashboard() {
  const elements = queryElements();
  buildFuelGauge(elements);
  const game = createGame();

  const render = () => {
    renderBoard(game, elements);
    renderTelemetry(game, elements);
  };

  const showCollision = () => {
    const token = ++game.collisionToken;
    window.setTimeout(() => {
      if (token === game.collisionToken) {
        game.collisionKey = null;
        render();
      }
    }, 360);
  };

  const move = (command, fromAutopilot = false) => {
    flashKey(command);
    const outcome = attemptMove(game, command, { fromAutopilot });
    if (outcome.moved === false) showCollision();
    render();
    return outcome;
  };

  const newMap = () => {
    game.simulationToken += 1;
    game.collisionToken += 1;
    regenerateGame(game);
    elements.gridWidth.value = game.width;
    elements.gridHeight.value = game.height;
    render();
  };

  const applyGridDimensions = () => {
    const width = Number.parseInt(elements.gridWidth.value, 10);
    const height = Number.parseInt(elements.gridHeight.value, 10);
    const valid =
      Number.isInteger(width) &&
      Number.isInteger(height) &&
      width >= MIN_GRID_SIZE &&
      width <= MAX_GRID_SIZE &&
      height >= MIN_GRID_SIZE &&
      height <= MAX_GRID_SIZE;
    if (!valid) {
      setStatus(
        game,
        `Grid size must be between ${MIN_GRID_SIZE} and ${MAX_GRID_SIZE}.`,
        "warning",
      );
      render();
      return;
    }
    game.simulationToken += 1;
    game.collisionToken += 1;
    regenerateGame(game, { width, height });
    elements.gridWidth.value = width;
    elements.gridHeight.value = height;
    render();
  };

  const runAutoSimulation = async () => {
    if (game.autoPilotRunning || game.missionComplete) return;

    const token = ++game.simulationToken;
    game.autoPilotRunning = true;
    game.agentSource = "thinking";
    game.agentState = "Autopilot is mapping safe routes through this sector.";
    setStatus(game, "Autopilot is analyzing the live mission state.");
    render();

    try {
      const data = await planMission(missionSnapshot(game));
      if (token !== game.simulationToken) return;

      game.agentSource = data.source === "agent" ? "agent" : "fallback";
      game.agentState =
        data.source === "agent"
          ? `Agent route verified on ${data.model}.`
          : "Verified in-browser safety route loaded.";
      setStatus(game, `Autopilot accepted ${data.commands.length} safe command(s).`, "pass");
      render();

      for (const command of data.commands) {
        if (token !== game.simulationToken || game.missionComplete || game.fuel === 0) break;
        const outcome = move(command, true);
        if (outcome.stopped) break;
        await wait(135);
      }

      if (token === game.simulationToken && !game.missionComplete && game.fuel > 0) {
        setStatus(
          game,
          "Autopilot route complete. Continue manually or run another simulation.",
        );
      }
    } catch (error) {
      if (token === game.simulationToken) {
        game.agentSource = "error";
        game.agentState = "Autopilot could not prepare a route.";
        setStatus(game, `Autopilot unavailable: ${error.message}`, "danger");
      }
    } finally {
      if (token === game.simulationToken) {
        game.autoPilotRunning = false;
        render();
      }
    }
  };

  document.addEventListener("keydown", (event) => {
    if (!(event.key in DIRECTIONS)) return;
    if (
      event.target instanceof Element &&
      event.target.closest("button, input, textarea, select")
    ) {
      return;
    }
    event.preventDefault();
    if (!game.autoPilotRunning) move(event.key);
  });
  elements.newMap.addEventListener("click", newMap);
  elements.applyGrid.addEventListener("click", applyGridDimensions);
  elements.autopilot.addEventListener("click", runAutoSimulation);
  window.marsMissionMove = (command) => move(command);

  elements.gridWidth.value = game.width;
  elements.gridHeight.value = game.height;
  render();
  return game;
}
