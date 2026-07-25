from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from mars_rover.autopilot import AutopilotService
from mars_rover.config import Settings
from mars_rover.domain import move_rover
from mars_rover.models import (
    RoverRequest,
    RoverResponse,
    SimulationRequest,
    SimulationResponse,
)

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_WEB_DIST = REPO_ROOT / "web" / "dist"


def create_app(
    settings: Settings | None = None,
    web_dist: Path | None = None,
) -> FastAPI:
    runtime_settings = settings or Settings.from_env()
    application = FastAPI(
        title="Mars Rover KATA API",
        version="1.0.0",
        description="Rover command and verified mission-planning endpoints.",
    )
    application.state.autopilot = AutopilotService(runtime_settings)

    @application.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    @application.post("/api/rover", response_model=RoverResponse)
    def rover_endpoint(request: RoverRequest) -> RoverResponse:
        return move_rover(request)

    @application.post("/api/agent/simulate", response_model=SimulationResponse)
    def simulation_endpoint(request: SimulationRequest) -> SimulationResponse:
        service: AutopilotService = application.state.autopilot
        return service.simulate(request)

    static_directory = web_dist or DEFAULT_WEB_DIST
    if static_directory.is_dir():
        application.mount(
            "/",
            StaticFiles(directory=static_directory, html=True),
            name="dashboard",
        )
    else:

        @application.get("/", include_in_schema=False)
        def frontend_missing() -> JSONResponse:
            return JSONResponse(
                {
                    "message": (
                        "Dashboard build not found. Run `npm ci && npm run build` in web/."
                    )
                },
                status_code=503,
            )

    return application


app = create_app()
