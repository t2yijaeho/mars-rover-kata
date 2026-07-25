from pathlib import Path

from fastapi.testclient import TestClient

from mars_rover.app import create_app
from mars_rover.config import Settings


def client(tmp_path: Path) -> TestClient:
    return TestClient(create_app(Settings(), web_dist=tmp_path / "missing"))


def test_health(tmp_path: Path) -> None:
    response = client(tmp_path).get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_rover_endpoint(tmp_path: Path) -> None:
    response = client(tmp_path).post(
        "/api/rover",
        json={
            "width": 5,
            "height": 5,
            "position": {"x": 0, "y": 0, "direction": "N"},
            "commands": "RMM",
        },
    )

    assert response.status_code == 200
    assert response.json()["path"] == [[0, 0], [1, 0], [2, 0]]


def test_simulation_endpoint_is_local_by_default(tmp_path: Path) -> None:
    response = client(tmp_path).post(
        "/api/agent/simulate",
        json={
            "width": 2,
            "height": 2,
            "tiles": [
                ["walkable", "walkable"],
                ["obstacle", "walkable"],
            ],
            "rover": {"x": 0, "y": 0},
            "fuel": 10,
            "max_fuel": 100,
            "explored": [{"x": 0, "y": 0}],
        },
    )

    assert response.status_code == 200
    assert response.json()["source"] == "safety_fallback"
    assert response.json()["model"] is None


def test_invalid_simulation_is_rejected(tmp_path: Path) -> None:
    response = client(tmp_path).post(
        "/api/agent/simulate",
        json={
            "width": 2,
            "height": 2,
            "tiles": [["walkable"]],
            "rover": {"x": 0, "y": 0},
            "fuel": 10,
            "max_fuel": 100,
        },
    )

    assert response.status_code == 422


def test_missing_frontend_returns_guidance(tmp_path: Path) -> None:
    response = client(tmp_path).get("/")

    assert response.status_code == 503
    assert "npm ci" in response.json()["message"]
