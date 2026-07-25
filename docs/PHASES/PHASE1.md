# Phase 1: Grid Map Generation and Rendering

## Objective

Create the visual foundation of the exploration game: a usable screen, a randomized map, and a clearly visible spaceship. No keyboard movement, fuel, or completion logic is required in this phase.

## Scope

### UI layout

Build a single-page game screen with these regions:

1. A title and a short instruction that tells the player a randomized map was generated.
2. A square grid-map area that remains visible without horizontal scrolling on typical desktop and mobile screens.
3. A status area reserved for later phases. In this phase it may show `Ready`.
4. A `New Map` control that generates a fresh map and resets the game state.
5. Width and height controls so the player can generate a different-sized sector.

The presentation should make the spaceship, walkable ground, and obstacles visually distinct without relying on colour alone. Use labels, icons, or patterns where useful.

### Map model

- Start with an 8 by 8 grid by default.
- Allow the player to set width and height independently from 4 to 16 before generating a new sector.
- Represent every cell as either `walkable` or `obstacle`.
- Randomly place obstacles with an initial target density of 20 percent. A different percentage is acceptable if it keeps maps playable and visually clear.
- Reserve one walkable start tile for the spaceship. The recommended start is the centre tile, but another documented fixed position is valid.
- Never place an obstacle on the starting tile.
- Generate all random values in JavaScript so the UI can refresh the map immediately. Keep the state in a small, explicit game-state object rather than deriving it from the DOM.

### Rendering rules

- Render one element per map cell, using a CSS Grid layout.
- Render the spaceship on exactly one walkable cell at the start position.
- Give obstacles a persistent visual treatment and ensure the spaceship is drawn above its tile.
- `New Map` must replace the old map, restore the spaceship to the new start tile, and clear any status left by a previous map.
- Keep the layout responsive. Cells may shrink on smaller screens but must remain large enough to identify.

## Suggested state shape

```javascript
const game = {
  width: 8,
  height: 8,
  start: { x: 4, y: 4 },
  spaceship: { x: 4, y: 4 },
  tiles: [] // Each item records x, y, and type: 'walkable' or 'obstacle'.
};
```

Coordinate convention: `x` increases from left to right; `y` increases from top to bottom. This convention must be retained through all later phases.

## Acceptance criteria

- Loading the page displays a randomized grid, one spaceship, walkable tiles, and visible obstacles.
- The spaceship starts on a walkable tile.
- No obstacle is rendered on the spaceship's starting tile.
- Selecting `New Map` visibly changes the map and restores the initial status and spaceship position.
- A newly loaded mission defaults to 8 by 8, and applying a valid width and height regenerates the board at those dimensions.
- The map is usable at a narrow mobile width and a normal desktop width.

## Out of scope

- Arrow-key movement and collision messages (Phase 2).
- Fuel display and deduction (Phase 3).
- Exploration totals and mission-success checks (Phase 4).
