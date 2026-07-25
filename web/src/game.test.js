import { describe, expect, it } from "vitest";

import {
  attemptMove,
  calculateReachableTiles,
  createGame,
  keyOf,
  regenerateGame,
} from "./game.js";

const alwaysWalkable = () => 1;

describe("mission game", () => {
  it("creates the default map with a walkable, explored start", () => {
    const game = createGame({ random: alwaysWalkable });

    expect(game.width).toBe(8);
    expect(game.height).toBe(8);
    expect(game.tiles[game.start.y][game.start.x]).toBe("walkable");
    expect(game.exploredTiles.has(keyOf(game.start.x, game.start.y))).toBe(true);
    expect(game.fuel).toBe(100);
  });

  it("charges one fuel for a valid move", () => {
    const game = createGame({ width: 4, height: 4, random: alwaysWalkable });

    const outcome = attemptMove(game, "ArrowRight");

    expect(outcome.moved).toBe(true);
    expect(game.fuel).toBe(99);
    expect(game.status).toContain("Pass");
  });

  it("charges ten fuel for a collision without moving", () => {
    const game = createGame({ width: 4, height: 4, random: alwaysWalkable });
    const before = { ...game.spaceship };
    game.tiles[before.y][before.x + 1] = "obstacle";

    const outcome = attemptMove(game, "ArrowRight");

    expect(outcome.moved).toBe(false);
    expect(game.spaceship).toEqual(before);
    expect(game.fuel).toBe(90);
    expect(game.status).toContain("Warning");
  });

  it("does not spend fuel when an action is unaffordable", () => {
    const game = createGame({ width: 4, height: 4, random: alwaysWalkable });
    game.fuel = 0;

    const outcome = attemptMove(game, "ArrowRight");

    expect(outcome.reason).toBe("fuel");
    expect(game.fuel).toBe(0);
    expect(game.status).toContain("Out of fuel");
  });

  it("treats a map boundary as a ten-fuel collision", () => {
    const game = createGame({ width: 4, height: 4, random: alwaysWalkable });
    attemptMove(game, "ArrowRight");

    const outcome = attemptMove(game, "ArrowRight");

    expect(outcome.moved).toBe(false);
    expect(game.spaceship).toEqual({ x: 3, y: 2 });
    expect(game.fuel).toBe(89);
  });

  it("enforces the exact one- and ten-fuel affordability thresholds", () => {
    const clearGame = createGame({ width: 4, height: 4, random: alwaysWalkable });
    clearGame.fuel = 1;
    expect(attemptMove(clearGame, "ArrowRight").moved).toBe(true);
    expect(clearGame.fuel).toBe(0);

    const blockedGame = createGame({
      width: 4,
      height: 4,
      random: alwaysWalkable,
    });
    blockedGame.tiles[blockedGame.start.y][blockedGame.start.x + 1] = "obstacle";
    blockedGame.fuel = 9;
    expect(attemptMove(blockedGame, "ArrowRight").reason).toBe("fuel");
    blockedGame.fuel = 10;
    expect(attemptMove(blockedGame, "ArrowRight").moved).toBe(false);
    expect(blockedGame.fuel).toBe(0);
  });

  it("does not count revisited tiles twice", () => {
    const game = createGame({ width: 4, height: 4, random: alwaysWalkable });

    attemptMove(game, "ArrowRight");
    attemptMove(game, "ArrowLeft");

    expect(game.exploredTiles.size).toBe(2);
  });

  it("excludes disconnected walkable tiles from the reachable total", () => {
    const game = createGame({ width: 4, height: 4, random: () => 0 });
    game.tiles[game.start.y][game.start.x + 1] = "walkable";
    game.tiles[0][0] = "walkable";

    expect(calculateReachableTiles(game).size).toBe(2);
  });

  it("completes after the last reachable move and freezes movement", () => {
    const game = createGame({ width: 2, height: 1, random: alwaysWalkable });

    const completion = attemptMove(game, "ArrowLeft");
    const fuelAtCompletion = game.fuel;
    const frozen = attemptMove(game, "ArrowRight");

    expect(completion.stopped).toBe(true);
    expect(game.missionComplete).toBe(true);
    expect(game.status).toContain("Mission Success");
    expect(frozen.reason).toBe("inactive");
    expect(game.fuel).toBe(fuelAtCompletion);
  });

  it("regenerates at independent dimensions", () => {
    const game = createGame({ random: alwaysWalkable });

    regenerateGame(game, { width: 12, height: 6, random: alwaysWalkable });

    expect(game.width).toBe(12);
    expect(game.height).toBe(6);
    expect(game.spaceship).toEqual({ x: 6, y: 3 });
  });

  it("fully resets transient mission state", () => {
    const game = createGame({ width: 4, height: 4, random: alwaysWalkable });
    game.fuel = 7;
    game.collisionKey = "1,1";
    game.autoPilotRunning = true;
    game.agentState = "stale";
    game.agentSource = "agent";
    game.exploredTiles.add("0,0");

    regenerateGame(game, { random: alwaysWalkable });

    expect(game.fuel).toBe(100);
    expect(game.collisionKey).toBeNull();
    expect(game.autoPilotRunning).toBe(false);
    expect(game.agentState).toBe("Autopilot standing by.");
    expect(game.agentSource).toBe("idle");
    expect(game.exploredTiles).toEqual(new Set([keyOf(game.start.x, game.start.y)]));
  });

  it("completes an isolated start immediately", () => {
    const game = createGame({ width: 4, height: 4, random: () => 0 });

    expect(game.reachableTiles.size).toBe(1);
    expect(game.missionComplete).toBe(true);
    expect(game.status).toContain("Mission Success");
  });
});
