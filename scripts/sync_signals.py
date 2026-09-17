#!/usr/bin/env python3
"""Regenerate assets/data/signals.json from the app repo's live-series registry + snapshot.

The site never fetches these APIs itself (no backend, static GitHub Pages, matching the
app's own "no server-side pipeline" line in CLAUDE.md) — this bakes in the same bundled
snapshot the app ships, clearly labeled "as of" its retrieval date. Only the app refreshes
live on demand. Re-run this after `python3 content/fetch_snapshot.py` in the app repo.

Usage: python3 scripts/sync_signals.py
"""
import json
from pathlib import Path

import yaml

APP_REPO = Path.home() / "coding_common/pvt/global-monetary-systems"
REGISTRY = APP_REPO / "content/series/registry.yaml"
SNAPSHOT = APP_REPO / "content/series/snapshot.json"
OUT = Path(__file__).resolve().parent.parent / "assets/data/signals.json"

PROVIDER_NAMES = {
    "ecb": "European Central Bank",
    "worldbank": "World Bank",
    "bis": "Bank for International Settlements",
    "fred": "FRED (bring your own key)",
}


def main():
    registry = yaml.safe_load(REGISTRY.read_text())
    snapshot = json.loads(SNAPSHOT.read_text())
    out = []
    for series in registry:
        sid = series["id"]
        if sid not in snapshot:
            continue
        point = snapshot[sid]
        out.append({
            "id": sid,
            "name": series["name"],
            "unit": series["unit"],
            "provider": PROVIDER_NAMES.get(series.get("provider"), series.get("provider")),
            "value": point["value"],
            "date": point["date"],
            "retrieved": point["retrieved"],
        })
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n")
    print(f"wrote {len(out)} signals to {OUT}")


if __name__ == "__main__":
    main()
