# Mars Rover KATA Roadmap

Implement the phases in order. Each phase builds on the completed behaviour of the previous one.

| Phase | Goal | Detailed specification |
| --- | --- | --- |
| 1 | Generate and render a randomized exploration grid | [PHASE1.md](PHASE1.md) |
| 2 | Move with arrow keys and report collisions | [PHASE2.md](PHASE2.md) |
| 3 | Add fuel accounting and fuel-aware feedback | [PHASE3.md](PHASE3.md) |
| 4 | Track reachable-tile exploration and mission success | [PHASE4.md](PHASE4.md) |

## Shared terminology

- **Walkable tile:** a grid tile that does not contain an obstacle.
- **Reachable tile:** a walkable tile that can be reached from the starting tile by moving up, down, left, or right through other walkable tiles.
- **Explored tile:** a reachable tile the spaceship has occupied at least once.
- **Collision:** an attempted movement into an obstacle or outside the grid. A collision never changes the spaceship position.
