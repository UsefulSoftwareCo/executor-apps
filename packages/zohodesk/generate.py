#!/usr/bin/env python3
"""Merges Zoho Desk's per-resource OpenAPI files into document.json.

Zoho publishes one OpenAPI 3.1 file per resource, with cross-file $refs into Common.json, and no
combined file: https://github.com/zoho/zohodesk-oas (v1.0/).

Usage: python3 generate.py <path to zohodesk-oas/v1.0> document.json
Components are prefixed with the file they come from so identically named ones cannot collide, then
unreferenced components are dropped. Security is replaced by one Zoho_Auth header scheme, orgId is
declared as the header Zoho Desk actually reads, and the example $refs into ./examples are removed.
"""
import json, re, sys, pathlib

src, out = pathlib.Path(sys.argv[1]), sys.argv[2]
KINDS = ("schemas", "parameters", "responses", "requestBodies", "headers")
doc = {
    "openapi": "3.1.0",
    "info": {"title": "Zoho Desk API", "version": "1.0.0"},
    "servers": [{"url": "https://desk.zoho.com"}],
    "paths": {},
    "components": {k: {} for k in KINDS} | {"securitySchemes": {"Zoho_Auth": {"type": "apiKey", "in": "header", "name": "Authorization"}}},
}


def strip_examples(node):
    if isinstance(node, dict):
        ex = node.get("examples")
        if isinstance(ex, dict) and any(isinstance(v, dict) and "$ref" in v for v in ex.values()):
            del node["examples"]
        for v in node.values():
            strip_examples(v)
    elif isinstance(node, list):
        for v in node:
            strip_examples(v)


def rewrite(text, mod):
    text = re.sub(r'"#/components/(\w+)/', lambda m: f'"#/components/{m.group(1)}/{mod}__', text)
    text = re.sub(
        r'"\./([A-Za-z0-9_]+)\.json#/components/(\w+)/',
        lambda m: f'"#/components/{m.group(2)}/{m.group(1)}__',
        text,
    )
    return text


op_ids = {}
for f in sorted(src.glob("*.json")):
    mod = re.sub(r"[^A-Za-z0-9]+", "_", f.stem)
    raw = json.loads(f.read_text())
    strip_examples(raw)
    raw = json.loads(rewrite(json.dumps(raw), mod))
    for kind in KINDS:
        for name, value in (raw.get("components", {}).get(kind) or {}).items():
            doc["components"][kind][f"{mod}__{name}"] = value
    for path, item in raw["paths"].items():
        for method, op in item.items():
            if not isinstance(op, dict) or "operationId" not in op:
                continue
            if method in doc["paths"].get(path, {}):
                print("duplicate", path, method, f.name, file=sys.stderr)
                continue
            oid = op["operationId"]
            if oid in op_ids:
                op["operationId"] = f"{mod}_{oid}"
                print("renamed", oid, "->", op["operationId"], file=sys.stderr)
            op_ids[op["operationId"]] = (path, method)
            op["security"] = [{"Zoho_Auth": []}]
            doc["paths"].setdefault(path, {})[method] = op
        if "parameters" in item and path in doc["paths"]:
            doc["paths"][path].setdefault("parameters", item["parameters"])

# Zoho Desk reads the organization from the orgId header; the published definition says query.
for name, p in doc["components"]["parameters"].items():
    if p.get("name") == "orgId":
        p["in"] = "header"
        p.pop("style", None)
        p.pop("explode", None)

# Drop components nothing reaches.
seen = set()
queue = [doc["paths"]]


def walk(node):
    if isinstance(node, dict):
        ref = node.get("$ref")
        if isinstance(ref, str) and ref.startswith("#/components/"):
            _, _, kind, name = ref.split("/", 3)
            if (kind, name) not in seen:
                seen.add((kind, name))
                target = doc["components"].get(kind, {}).get(name)
                if target is not None:
                    walk(target)
                else:
                    print("dangling", ref, file=sys.stderr)
        for v in node.values():
            walk(v)
    elif isinstance(node, list):
        for v in node:
            walk(v)


walk(doc["paths"])
for kind in KINDS:
    doc["components"][kind] = {n: v for n, v in doc["components"][kind].items() if (kind, n) in seen}
json.dump(doc, open(out, "w"), separators=(",", ":"))
print(len(op_ids), "operations", file=sys.stderr)
