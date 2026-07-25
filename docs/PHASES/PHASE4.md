# Phase 4: Exploration Completion and Mission Success

## Objective

Track where the spaceship has travelled and declare the mission successful when every tile that can actually be reached from the start has been explored.

## Dependencies

Phase 3 must be complete. The feature relies on a stable grid model, movement/collision outcomes, and fuel-aware input handling.

## Exploration definitions

- Mark the starting tile as explored when a new map is created.
- Mark a tile as explored only after a successful movement onto it.
- Re-entering an explored tile does not increase progress.
- Obstacles are never explored.
- Tiles isolated behind obstacles are excluded from the mission total if no route from the start exists.

## Reachability calculation

Calculate the set of reachable tiles after generating each map. Use a breadth-first search or depth-first search beginning at the starting tile and traversing only orthogonally adjacent walkable tiles.

The calculation must:

1. Include the starting tile.
2. Exclude all obstacles.
3. Exclude walkable areas cut off from the start by obstacles.
4. Be performed once for each new map, not on every key press.

Store reachable tiles and explored tiles using a stable coordinate key such as `"x,y"`. This avoids comparing object references and keeps repeated visits easy to handle.

## Progress UI

- Display progress near the map as `Explored: <explored count> / <reachable count>`.
- Visually distinguish explored walkable tiles from unvisited walkable tiles, while keeping the spaceship visible above both.
- Update the count only when the player first arrives on a new tile.
- Reset the count and tile styling when `New Map` generates a new map.

## Mission-success rule

After marking a valid arrival as explored, compare the explored count to the reachable count.

- If every reachable tile is explored, display **Mission Success** prominently.
- The starting tile can complete an obstacle-surrounded one-tile map immediately after map generation; show **Mission Success** in this edge case.
- Once successful, freeze directional movement and retain the final board, fuel, and progress for the player to review.
- `New Map` is the only control that begins another mission after success.
- If fuel reaches zero before every reachable tile is explored, do not show mission success. The existing `Out of fuel` status remains the result.

## Suggested additions to game state

```javascript
const game = {
  // Existing Phase 1 to 3 fields
  reachableTiles: new Set(),
  exploredTiles: new Set(),
  missionComplete: false
};
```

## Acceptance criteria

- The start tile is counted as explored on a new map.
- The progress total counts only walkable tiles reachable from the start.
- Moving to an unvisited valid tile raises the explored count by one.
- Revisiting a tile, colliding, or failing due to insufficient fuel does not change exploration progress.
- Completing every reachable tile displays **Mission Success** and prevents further movement.
- Generating a new map resets progress, mission-complete state, and all previous-phase state.

## Manual test scenario

1. Generate a map that contains at least one obstacle and one reachable neighbour.
2. Confirm the starting tile shows as explored.
3. Visit a new reachable tile and verify progress increases by one.
4. Return to the starting tile and verify progress does not increase.
5. Continue until the count equals the reachable total.
6. Confirm **Mission Success** appears and arrow keys no longer move the spaceship.
