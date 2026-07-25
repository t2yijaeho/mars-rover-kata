#!/usr/bin/env python3
"""Run deterministic, cross-platform release checks for Mars Rover KATA."""

from __future__ import annotations

import argparse
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
WEB = ROOT / "web"
MAX_SCAN_BYTES = 1_000_000
SECRET_PATTERNS = {
    "OpenAI-style API key": re.compile(r"\bsk-[A-Za-z0-9_-]{20,}\b"),
    "GitHub token": re.compile(r"\b(?:gh[pousr]_[A-Za-z0-9]{20,})\b"),
    "AWS access key": re.compile(r"\bAKIA[0-9A-Z]{16}\b"),
    "private key": re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    "assigned OpenAI key": re.compile(r"OPENAI_API_KEY\s*=\s*[^\s#]{16,}"),
}


def executable(name: str) -> str:
    """Resolve an executable, including Windows command shims."""
    resolved = shutil.which(name) or shutil.which(f"{name}.cmd")
    if resolved is None:
        raise SystemExit(f"Required executable not found: {name}")
    return resolved


def run(label: str, command: list[str], cwd: Path = ROOT) -> None:
    """Run one release gate and stop on failure."""
    print(f"\n==> {label}")
    subprocess.run(command, cwd=cwd, check=True)  # noqa: S603


def tracked_files() -> list[Path]:
    """Return files eligible for publication."""
    result = subprocess.run(  # noqa: S603
        [executable("git"), "ls-files", "-z"],
        cwd=ROOT,
        check=True,
        capture_output=True,
    )
    return [
        ROOT / item.decode("utf-8")
        for item in result.stdout.split(b"\0")
        if item
    ]


def scan_tracked_files() -> None:
    """Reject common credential shapes in tracked, text-like files."""
    findings: list[str] = []
    for path in tracked_files():
        if not path.is_file() or path.stat().st_size > MAX_SCAN_BYTES:
            continue
        try:
            content = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        for label, pattern in SECRET_PATTERNS.items():
            if pattern.search(content):
                findings.append(f"{path.relative_to(ROOT)}: {label}")
    if findings:
        raise SystemExit("Potential secrets found:\n" + "\n".join(findings))
    print("\n==> tracked-file secret scan\nNo credential patterns found.")


def main() -> None:
    """Run the complete release gate."""
    parser = argparse.ArgumentParser()
    parser.add_argument("--skip-e2e", action="store_true")
    args = parser.parse_args()

    npm = executable("npm")
    python = sys.executable
    uv_path = shutil.which("uv") or shutil.which("uv.exe")
    uv = [uv_path] if uv_path else [python, "-m", "uv"]

    run("lockfile check", [*uv, "lock", "--check"])
    run("Ruff", [*uv, "run", "ruff", "check", "."])
    run("pytest and coverage", [*uv, "run", "pytest"])
    run("Bandit", [*uv, "run", "bandit", "-c", "pyproject.toml", "-r", "src"])
    run("pip-audit", [*uv, "run", "pip-audit"])
    run("npm clean install", [npm, "ci"], WEB)
    run("ESLint", [npm, "run", "lint"], WEB)
    run("Vitest", [npm, "test"], WEB)
    run("npm audit", [npm, "audit", "--audit-level=high"], WEB)
    run("Pages build", [npm, "run", "build:pages"], WEB)
    run("Pages path verification", [npm, "run", "verify:pages"], WEB)
    if not args.skip_e2e:
        run("Playwright", [npm, "run", "test:e2e"], WEB)
    scan_tracked_files()
    run("Git whitespace check", [executable("git"), "diff", "--check"])
    print("\nAll release checks passed.")


if __name__ == "__main__":
    main()
