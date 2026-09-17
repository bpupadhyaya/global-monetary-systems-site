#!/usr/bin/env python3
"""Regenerate assets/data/glossary.json from the app repo's content/glossary.yaml.

Publishes only the `essentials` definition of each term (the free, in-app layer) —
Applied/Research definitions stay Pro-only and are never copied to the public site.
Run this after the app's glossary grows; it's the only step that needs re-running to
keep the site's glossary page in sync with the app's canonical data.

Usage: python3 scripts/sync_glossary.py
"""
import json
import re
from pathlib import Path

APP_REPO = Path.home() / "coding_common/pvt/global-monetary-systems"
GLOSSARY_YAML = APP_REPO / "content/glossary.yaml"
OUT = Path(__file__).resolve().parent.parent / "assets/data/glossary.json"


def parse_glossary(text):
    """Minimal hand-rolled YAML reader for this file's flat list-of-records shape.
    Avoids a PyYAML dependency for a format this constrained (see glossary.yaml's header)."""
    records = []
    current = None
    for raw in text.splitlines():
        line = raw.rstrip("\n")
        if re.match(r"^- id:\s*(.+)$", line):
            if current:
                records.append(current)
            current = {"id": re.match(r"^- id:\s*(.+)$", line).group(1).strip()}
            continue
        if current is None:
            continue
        m = re.match(r"^  (\w+):\s*(.*)$", line)
        if not m:
            continue
        key, val = m.group(1), m.group(2).strip()
        if key == "aliases":
            inner = val.strip("[]")
            current["aliases"] = [a.strip() for a in inner.split(",") if a.strip()]
        elif key in ("term", "essentials", "page"):
            current[key] = val
    if current:
        records.append(current)
    return records


def main():
    text = GLOSSARY_YAML.read_text()
    records = parse_glossary(text)
    out = []
    for r in records:
        if "term" not in r or "essentials" not in r:
            continue
        out.append({
            "id": r["id"],
            "term": r["term"],
            "aliases": r.get("aliases", []),
            "essentials": r["essentials"],
        })
    out.sort(key=lambda r: r["term"].lower())
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n")
    print(f"wrote {len(out)} terms to {OUT}")


if __name__ == "__main__":
    main()
