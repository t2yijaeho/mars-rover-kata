# Phase 2: Arrow-Key Movement and Collision Checks

## Objective

Allow the player to steer the spaceship around the Phase 1 map with the keyboard and report the outcome of every movement attempt.

## Dependencies

Phase 1 must be complete. This phase uses its map model, coordinate convention, rendering mechanism, and `New Map` reset behaviour.

## Input behaviour

Listen for `ArrowUp`, `ArrowDown`, `ArrowLeft`, and `ArrowRight` while the game is active.

| Key | Candidate position |
| --- | --- |
| ArrowUp | `x, y - 1` |
| ArrowDown | `x, y + 1` |
| ArrowLeft | `x - 1, y` |
| ArrowRight | `x + 1, y` |

- Call `event.preventDefault()` for supported arrow keys so the page does not scroll while playing.
- Ignore all other keys.
- A key press represents one movement attempt. Holding a key may produce browser key-repeat attempts; each received keydown may be handled independently.
- The game needs no focusable canvas requirement, but controls and text inputs must keep their normal keyboard behaviour if they are added later.

## Movement and collision rules

1. Calculate the adjacent candidate tile from the input key.
2. If the candidate is inside the grid and walkable, move the spaceship to it and display **Pass**.
3. If the candidate is outside the grid or is an obstacle, leave the spaceship where it is and display **Warning**.
4. Replace the previous result after every movement attempt; do not accumulate a log in the primary status area.
5. Use a visual style in addition to the text so **Pass** and **Warning** are distinguishable at a glance.

## Rendering and accessibility

- Re-render only the cells that need to change, or re-render the board consistently from state; do not make the DOM the source of position truth.
- Expose the result through an `aria-live="polite"` status element so screen-reader users receive the movement result.
- A collision should give brief visual feedback on the spaceship or blocked tile, but it must not alter the map layout.

## Reset behaviour

Selecting `New Map` must remove the prior result, place the spaceship on the new map's start tile, and display `Ready` until the player makes another movement attempt.

## Acceptance criteria

- Each arrow key attempts to move exactly one adjacent tile in the expected direction.
- A valid move changes the spaceship's tile and shows **Pass**.
- Moving into an obstacle leaves the spaceship in place and shows **Warning**.
- Moving beyond every map edge leaves the spaceship in place and shows **Warning**.
- Supported arrow keys do not scroll the page while the game is active.
- `New Map` resets both position and result state.

## Out of scope

- Fuel deductions or a fuel display (Phase 3).
- Tracking explored cells or declaring the mission complete (Phase 4).
