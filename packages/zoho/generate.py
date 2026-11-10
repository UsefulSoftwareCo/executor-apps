#!/usr/bin/env python3
"""Merges Zoho CRM's per-resource OpenAPI files into document.json.

Zoho publishes one OpenAPI 3.1 file per resource in https://github.com/zoho/crm-oas (v8.0/<resource>/<resource>.yaml)
and no combined file.

Usage: python3 generate.py <clone of zoho/crm-oas> document.json
Schemas, parameters, responses and request bodies are prefixed with the resource name so identically named
components from different files cannot collide. Operations are otherwise untouched, except that each gets the
Zoho_Auth security scheme and its server override is removed (index.ts pins the account's own data center).
"""
import json, re, sys, pathlib
import yaml

src, out = pathlib.Path(sys.argv[1]) / "v8.0", sys.argv[2]
kinds = ("schemas", "parameters", "responses", "requestBodies", "headers", "examples")
doc = {
    "openapi": "3.1.0",
    "info": {"title": "Zoho CRM API", "version": "8"},
    "servers": [{"url": "https://www.zohoapis.com/crm/v8"}],
    "paths": {},
    "components": {k: {} for k in kinds},
}
doc["components"]["securitySchemes"] = {"Zoho_Auth": {"type": "apiKey", "in": "header", "name": "Authorization"}}
op_ids = {}
for f in sorted(src.glob("*/*.yaml")):
    mod = re.sub(r"[^A-Za-z0-9]+", "_", f.stem)
    raw = yaml.safe_load(f.read_text())
    text = json.dumps(raw, default=str)
    text = re.sub(r"#/components/(%s)/" % "|".join(kinds), lambda m: f"#/components/{m.group(1)}/{mod}__", text)
    raw = json.loads(text)
    for kind in kinds:
        for name, value in (raw.get("components", {}).get(kind) or {}).items():
            doc["components"][kind][f"{mod}__{name}"] = value
    for path, item in raw["paths"].items():
        for method, op in item.items():
            if not isinstance(op, dict) or "operationId" not in op:
                continue
            if method not in ("get", "post", "put", "patch", "delete"):
                continue
            if method in doc["paths"].get(path, {}):
                print("duplicate", path, method, f.name, file=sys.stderr)
                continue
            oid = op["operationId"]
            if oid in op_ids:
                op["operationId"] = f"{mod}_{oid}"
                print("renamed", oid, "->", op["operationId"], file=sys.stderr)
            op_ids[op["operationId"]] = (path, method)
            op["tags"] = [mod]
            op["security"] = [{"Zoho_Auth": []}]
            op.pop("servers", None)
            doc["paths"].setdefault(path, {})
            doc["paths"][path][method] = op
        if "parameters" in item and path in doc["paths"]:
            doc["paths"][path].setdefault("parameters", [])
            doc["paths"][path]["parameters"] += [p for p in item["parameters"] if p not in doc["paths"][path]["parameters"]]
doc["components"] = {k: v for k, v in doc["components"].items() if v}
json.dump(doc, open(out, "w"), separators=(",", ":"), default=str)
import subprocess
sha = subprocess.run(["git", "-C", str(src.parent), "rev-parse", "HEAD"], capture_output=True, text=True).stdout.strip()
print(len(op_ids), "operations from zoho/crm-oas commit", sha or "unknown", file=sys.stderr)
