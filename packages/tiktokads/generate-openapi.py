#!/usr/bin/env python3
"""Merges the official per-operation OpenAPI files of tiktok/tiktok-business-api-sdk (yml_files/) into document.json.

Usage: python3 generate-openapi.py <sdk checkout>/yml_files > document.json
Pinned source: https://github.com/tiktok/tiktok-business-api-sdk at commit f809c396520df2d7b201a9ccc5378d822b728ed3.

Changes from the source files, all mechanical: one info block; servers set to the v1.3 base URL; the per-operation
Access-Token query parameter removed (it is sent as a header, see openapi.ts); x-open-* extension keys dropped
(strict string enums become `enum`); dangling ./openapi.yaml#/definitions references become open objects; an operationId, tag and summary taken from the file name and info block.
"""
import json
import os
import re
import sys

import yaml

directory = sys.argv[1]
paths = {}


def camel(name):
    parts = name.split("_")
    return parts[0] + "".join(p.capitalize() for p in parts[1:])


def clean(node):
    if isinstance(node, list):
        return [clean(item) for item in node]
    if not isinstance(node, dict):
        return node
    if str(node.get("$ref", "")).startswith("./openapi.yaml#"):
        # A dangling reference in the official files (filtering objects); the target is not shipped.
        return {"type": "object", "description": node.get("description", "")}
    out = {}
    enum = node.get("x-open-enum")
    for key, value in node.items():
        if key.startswith("x-"):
            continue
        out[key] = clean(value)
    if isinstance(enum, dict) and enum.get("key_format") == "string" and enum.get("strict"):
        keys = [e["key"] for e in enum.get("enums", []) if e.get("is_valid", True)]
        if keys and node.get("type") == "string":
            out["enum"] = keys
    if out.get("nullable") is False:
        del out["nullable"]
    return out


def text(raw, fallback=""):
    try:
        return json.loads(raw).get("en") or fallback
    except Exception:
        return raw or fallback


for file in sorted(os.listdir(directory)):
    if not file.endswith(".yml"):
        continue
    doc = yaml.safe_load(open(os.path.join(directory, file)))
    info = doc.get("info", {})
    for path, item in doc["paths"].items():
        for method, op in item.items():
            op = clean(op)
            op["operationId"] = camel(file[:-4])
            op["tags"] = [path.strip("/").split("/")[0]]
            op["summary"] = text(info.get("title", ""), file[:-4]).strip()
            description = re.sub(r"\n{3,}", "\n\n", text(info.get("description", "")).strip())
            if description:
                op["description"] = description
            op["parameters"] = [p for p in op.get("parameters", []) if p.get("name") != "Access-Token"]
            if not op["parameters"]:
                del op["parameters"]
            paths.setdefault(path, {})[method] = op

document = {
    "openapi": "3.0.1",
    "info": {
        "title": "TikTok API for Business v1.3",
        "version": "1.3",
        "description": "Merged from the official tiktok/tiktok-business-api-sdk yml_files at commit f809c396520df2d7b201a9ccc5378d822b728ed3.",
    },
    "servers": [{"url": "https://business-api.tiktok.com/open_api/v1.3"}],
    "paths": paths,
}
json.dump(document, sys.stdout, ensure_ascii=False, separators=(",", ":"), sort_keys=True)
