import { DIRECTIONS } from "./game.js";

function validateResponse(data) {
  if (!data || !Array.isArray(data.commands)) {
    throw new Error("The autopilot returned an invalid response.");
  }
  if (data.commands.some((command) => !(command in DIRECTIONS))) {
    throw new Error("The autopilot returned an unsupported movement command.");
  }
  return data;
}

export async function requestApiMission(snapshot) {
  const response = await fetch("/api/agent/simulate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(snapshot),
  });
  const data = await response.json();
  if (!response.ok) {
    const detail = typeof data.detail === "string" ? data.detail : "Route planning failed.";
    throw new Error(detail);
  }
  return validateResponse(data);
}
