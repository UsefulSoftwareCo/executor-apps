#!/usr/bin/env python3
"""Merges Zoho Books's per-module OpenAPI files into document.json.

Zoho publishes one OpenAPI 3.0 file per module and no combined file:
https://www.zoho.com/books/api/v3/openapi-all.zip

Usage: python3 generate.py <dir with the extracted *.yml> document.json
Schemas and parameters are prefixed with the module name so identically named
components from different modules cannot collide.
"""
import json, re, sys, pathlib
import yaml

src, out = pathlib.Path(sys.argv[1]), sys.argv[2]
doc = {
    "openapi": "3.0.0",
    "info": {"title": "Zoho Books API", "version": "1.0.0"},
    "servers": [{"url": "https://www.zohoapis.com/books/v3"}],
    "paths": {},
    "components": {"schemas": {}, "parameters": {}, "securitySchemes": {"Zoho_Auth": {"type": "apiKey", "in": "header", "name": "Authorization"}}},
}
op_ids = {}
for f in sorted(src.glob("*.yml")):
    mod = re.sub(r"[^A-Za-z0-9]+", "_", f.stem)
    raw = yaml.safe_load(f.read_text())
    text = json.dumps(raw, default=str)
    text = re.sub(r"#/components/(schemas|parameters)/", lambda m: f"#/components/{m.group(1)}/{mod}__", text)
    raw = json.loads(text)
    for kind in ("schemas", "parameters"):
        for name, value in (raw.get("components", {}).get(kind) or {}).items():
            doc["components"][kind][f"{mod}__{name}"] = value
    for path, item in raw["paths"].items():
        item = {k: v for k, v in item.items() if not k.startswith("x-")}
        for method, op in item.items():
            if not isinstance(op, dict) or "operationId" not in op:
                continue
            key = (path, method)
            if path in doc["paths"] and method in doc["paths"][path]:
                print("duplicate", path, method, f.name, file=sys.stderr)
                continue
            oid = op["operationId"]
            if oid in op_ids:
                op["operationId"] = f"{mod}_{oid}"
                print("renamed", oid, "->", op["operationId"], file=sys.stderr)
            op_ids[op["operationId"]] = key
            op["tags"] = [mod]
            op["security"] = [{"Zoho_Auth": []}]
            doc["paths"].setdefault(path, {})
            doc["paths"][path][method] = op
        # path-level parameters
        if "parameters" in item and path in doc["paths"]:
            doc["paths"][path].setdefault("parameters", item["parameters"])
json.dump(doc, open(out, "w"), separators=(",", ":"), default=str)
print(len(op_ids), "operations", file=sys.stderr)
