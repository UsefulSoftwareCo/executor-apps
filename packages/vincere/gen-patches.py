# Regenerates patches.json from the official document (python3 gen-patches.py vapi.yaml > patches.json).
# The executor OpenAPI compiler only follows $refs of the form #/components/schemas/<name>; Vincere's document
# also points at single properties (#/components/schemas/<name>/properties/<prop>). Each such reference is
# replaced by the property schema it names.
import copy, json, re, sys, yaml

doc = yaml.safe_load(open(sys.argv[1]))
ok = re.compile(r"^#/components/schemas/[^/]+$")

def lookup(ref):
    node = doc
    for part in ref[2:].split("/"):
        part = part.replace("~1", "/").replace("~0", "~")
        if isinstance(node, list):
            node = node[int(part)]
        elif part in node:
            node = node[part]
        else:
            node = node[int(part)]
    return node

def inline(node, seen):
    if isinstance(node, dict):
        ref = node.get("$ref")
        if isinstance(ref, str) and ref.startswith("#/") and not ok.match(ref):
            if ref in seen:
                return {}
            target = inline(copy.deepcopy(lookup(ref)), seen | {ref})
            rest = {k: inline(v, seen) for k, v in node.items() if k != "$ref"}
            return {**target, **rest}
        return {k: inline(v, seen) for k, v in node.items()}
    if isinstance(node, list):
        return [inline(v, seen) for v in node]
    return node

def is_holder(v):
    return isinstance(v, dict) and isinstance(v.get("$ref"), str) and v["$ref"].startswith("#/components/schemas/") and not ok.match(v["$ref"])

def has_holder(node):
    if is_holder(node):
        return True
    if isinstance(node, dict):
        return any(has_holder(v) for v in node.values())
    if isinstance(node, list):
        return any(has_holder(v) for v in node)
    return False

patches = []
def walk(node, path):
    if isinstance(node, dict):
        ref = node.get("$ref")
        if isinstance(ref, str) and ref.startswith("#/") and not ok.match(ref) and ref.startswith("#/components/schemas/"):
            patches.append({"op": "replace", "path": path, "value": inline(node, set())})
            return
        for k, v in node.items():
            walk(v, path + "/" + str(k).replace("~", "~0").replace("/", "~1"))
    elif isinstance(node, list):
        # The patcher cannot step through arrays; replace the outermost array holding a reference.
        if has_holder(node):
            patches.append({"op": "replace", "path": path, "value": inline(node, set())})
walk(doc, "")
print(json.dumps(patches, separators=(",", ":")))
