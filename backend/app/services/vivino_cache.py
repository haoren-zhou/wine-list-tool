"""Best-effort persistent cache for Vivino's public reference mappings."""

import asyncio
import json
import logging
import os
import tempfile
from pathlib import Path

import httpx

from app.services.vivino import get_grapes, get_wine_styles

logger = logging.getLogger("backend.app")


def _read_cache(path: Path) -> dict[str, dict[int, str]]:
    try:
        payload = json.loads(path.read_text())
        if payload["version"] != 1:
            raise ValueError("Unsupported cache version")
        mappings = {}
        for key in ("grapes", "wine_styles"):
            values = payload[key]
            if not isinstance(values, dict) or any(
                not isinstance(value, str) for value in values.values()
            ):
                raise ValueError("Invalid mapping cache")
            mappings[key] = {int(k): v for k, v in values.items()}
        return mappings
    except FileNotFoundError:
        return {"grapes": {}, "wine_styles": {}}
    except (OSError, ValueError, KeyError, TypeError):
        logger.warning("Could not read Vivino mapping cache; using empty fallback")
        return {"grapes": {}, "wine_styles": {}}


def _write_cache(path: Path, mappings: dict[str, dict[int, str]]) -> None:
    temporary_path = None
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        with tempfile.NamedTemporaryFile(
            mode="w", dir=path.parent, delete=False, encoding="utf-8"
        ) as temporary:
            temporary_path = Path(temporary.name)
            json.dump({"version": 1, **mappings}, temporary)
        os.replace(temporary_path, path)
    except OSError:
        logger.warning("Could not persist Vivino mapping cache", exc_info=True)
    finally:
        if temporary_path is not None:
            try:
                temporary_path.unlink(missing_ok=True)
            except OSError:
                logger.warning("Could not remove temporary Vivino cache file")


async def load_mappings(
    client: httpx.AsyncClient, path: Path
) -> dict[str, dict[int, str]]:
    """Refresh at startup; keep last-known-good data on individual failures.

    On a cold start without a cache, unavailable mappings stay empty. Uploads
    still work, displaying N.A. for unknown grapes/styles. Cache persistence
    failure is nonfatal; only public reference data is written, never wine lists.
    """
    mappings = _read_cache(path)
    results = await asyncio.gather(
        get_grapes(client), get_wine_styles(client), return_exceptions=True
    )
    refreshed = False
    for key, result in zip(("grapes", "wine_styles"), results):
        if isinstance(result, BaseException):
            if not isinstance(result, Exception):
                raise result
            logger.warning("Using cached %s after Vivino failure: %s", key, result)
        else:
            mappings[key] = result
            refreshed = True
    if refreshed:
        _write_cache(path, mappings)
    return mappings
