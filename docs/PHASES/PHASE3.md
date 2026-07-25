# Phase 3: Fuel Management System

## Objective

Add a visible fuel resource to Phase 2 movement. Fuel makes successful navigation and collisions meaningful while preserving the existing movement rules.

## Dependencies

Phase 2 must be complete. Arrow-key input, valid movement, collision detection, and the result status are prerequisites.

## Fuel model

- Start each new map with **100 fuel**.
- Display the current fuel value near the grid at all times, for example `Fuel: 73 / 100`.
- A successful movement costs **1 fuel**.
- A collision costs **10 fuel**.
- A collision does not move the spaceship. It still costs fuel because the movement attempt struck an obstacle or boundary.
- Fuel must never fall below zero.

## Insufficient-fuel rule

Before applying an action, confirm the player has enough fuel for that action:

- A valid move requires at least 1 fuel.
- A collision requires at least 10 fuel.
- If there is insufficient fuel, do not move the spaceship and do not reduce fuel. Show `Out of fuel` in the status area.
- At 0 fuel, ignore all later directional input except for updating the status to `Out of fuel`; the player may still use `New Map`.

This rule preserves the requested cost values without allowing negative fuel.

## Processing order

For every arrow-key attempt:

1. Determine whether the candidate tile is a valid walkable destination or a collision.
2. Determine the required cost: 1 for a valid move, 10 for a collision.
3. If enough fuel remains, apply the cost.
4. If the move was valid, update the spaceship position and show **Pass**.
5. If it was a collision, retain position and show **Warning**.
6. If insufficient fuel remained, retain position, retain fuel, and show `Out of fuel`.

## UI behaviour

- Update the fuel indicator in the same visible update as the movement result.
- Add a low-fuel visual state when fuel is 20 or lower. Do not use colour as the only indicator; the numeric value must remain visible.
- Ensure the status message remains an `aria-live="polite"` region.
- `New Map` resets fuel to 100 as well as resetting all Phase 1 and 2 state.

## Suggested additions to game state

```javascript
const game = {
  // Existing Phase 1 and 2 fields
  fuel: 100,
  maxFuel: 100
};
```

## Acceptance criteria

- A new map begins with `Fuel: 100 / 100`.
- A successful move costs exactly 1 fuel and displays **Pass**.
- A collision costs exactly 10 fuel, leaves the position unchanged, and displays **Warning**.
- Fuel never becomes negative.
- An attempted action that costs more fuel than remains leaves both position and fuel unchanged and displays `Out of fuel`.
- A new map restores fuel to 100 and clears the low-fuel state.

## Out of scope

- Counting explored tiles or finishing the mission (Phase 4).
