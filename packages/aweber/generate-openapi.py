#!/usr/bin/env python3
"""Bundles AWeber's official OpenAPI document (https://api.aweber.com/swagger.yaml) into document.json.

The vendor splits the document into relative $ref files. This fetches them, keeps shared schemas,
parameters and responses as local components, inlines the per-path files, and drops documentation-only
extensions. Usage: python3 generate-openapi.py > document.json
"""
import json, re, sys, urllib.request
import yaml

BASE = "https://api.aweber.com/"
cache = {}
SHARED = {"_definitions.yaml": ("definitions", "schemas"),
          "_parameters.yaml": ("parameters", "parameters"),
          "_responses.yaml": ("responses", "responses")}
DROP = {"x-code-samples", "x-tagGroups", "x-codeSamples"}


def load(name):
    if name not in cache:
        with urllib.request.urlopen(BASE + name) as r:
            cache[name] = yaml.safe_load(r.read())
    return cache[name]


def pointer(doc, ptr):
    for part in [p for p in ptr.split("/") if p]:
        doc = doc[part.replace("~1", "/").replace("~0", "~")]
    return doc


def resolve(node, cur):
    if isinstance(node, list):
        return [resolve(x, cur) for x in node]
    if not isinstance(node, dict):
        return node
    if "$ref" in node:
        file, _, ptr = node["$ref"].partition("#")
        file = file or cur
        if file in SHARED and ptr:
            key, comp = SHARED[file]
            m = re.fullmatch(rf"/{key}/(.+)", ptr)
            if m:
                return {"$ref": f"#/components/{comp}/{m.group(1)}"}
        target = pointer(load(file), ptr) if ptr else load(file)
        return resolve(target, file)
    return {k: resolve(v, cur) for k, v in node.items() if k not in DROP}


root = load("swagger.yaml")
doc = {k: v for k, v in root.items() if k not in DROP | {"tags", "paths", "components", "servers"}}
doc["servers"] = [{"url": "https://api.aweber.com/1.0", "description": "v1 API endpoints"}]
doc["paths"] = resolve(load("_paths.yaml"), "_paths.yaml")
components = {"securitySchemes": root["components"]["securitySchemes"]}
for file, (key, comp) in SHARED.items():
    components[comp] = {name: resolve(value, file) for name, value in load(file)[key].items()}
doc["components"] = components
json.dump(doc, sys.stdout, indent=1, default=str)
