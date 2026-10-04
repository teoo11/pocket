"""Deep-merges a JSON fragment {"en": {...}, "ro": {...}} into messages/en.json and messages/ro.json.
Usage: python scripts/merge-messages.py fragment.json   (dev helper; existing keys are overwritten)."""
import json, sys

def merge(a, b):
    for k, v in b.items():
        if isinstance(v, dict) and isinstance(a.get(k), dict):
            merge(a[k], v)
        else:
            a[k] = v
    return a

frag = json.load(open(sys.argv[1], encoding="utf-8"))
for loc in ("en", "ro"):
    path = f"messages/{loc}.json"
    data = json.load(open(path, encoding="utf-8"))
    merge(data, frag[loc])
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
print("merged")
