from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "android-learning" / "data" / "lessons" / "c"

replacements = {
    "c02.json": {
        'println("call API")': 'println(\\"call API\\")',
        'println("flow created")': 'println(\\"flow created\\")',
    },
    "c03.json": {
        'val query: String = ""': 'val query: String = \\"\\"',
    },
    "c04.json": {
        'println("A: $it")': 'println(\\"A: $it\\")',
        'println("B: $it")': 'println(\\"B: $it\\")',
        'events.emit("hello")': 'events.emit(\\"hello\\")',
    },
}

for filename, mapping in replacements.items():
    path = BASE / filename
    text = path.read_text()
    for old, new in mapping.items():
        text = text.replace(old, new)
    path.write_text(text)

print("Applied targeted JSON string escaping repairs")
