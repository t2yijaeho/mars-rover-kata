"""Compatibility entry point for ``uvicorn main:app``."""

from mars_rover.app import app, create_app

__all__ = ["app", "create_app"]
