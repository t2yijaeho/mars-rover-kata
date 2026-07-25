import { localSimulationResponse } from "./planner.js";

export const AUTOPILOT_MODE = import.meta.env.VITE_AUTOPILOT_MODE ?? "local";

export async function planMission(snapshot) {
  if (AUTOPILOT_MODE === "local") return localSimulationResponse(snapshot);
  if (AUTOPILOT_MODE === "api") {
    const { requestApiMission } = await import("./api-client.js");
    return requestApiMission(snapshot);
  }
  throw new Error(`Unsupported autopilot mode: ${AUTOPILOT_MODE}`);
}
