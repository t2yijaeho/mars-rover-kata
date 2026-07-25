import "./styles.css";

import { initializeDashboard } from "./dashboard.js";
import { initializeHologram } from "./renderers/hologram.js";
import { initializeTerrain } from "./renderers/terrain.js";

initializeDashboard();
initializeHologram();
initializeTerrain();
