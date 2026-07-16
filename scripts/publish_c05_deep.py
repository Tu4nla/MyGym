import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "android-learning" / "data"
LESSON_ID = "c05"
LESSON_PATH = DATA / "lessons" / "c" / "c05.json"
REPORT_PATH = ROOT / "validation-c05.json"

lesson = json.loads(LESSON_PATH.read_text())
section_ids = [section["id"] for section in lesson["sections"]]
paragraphs = [
    block["content"]
    for section in lesson["sections"]
    for block in section.get("blocks", [])
    if block.get("type") == "paragraph"
]
code_blocks = [
    block
    for section in lesson["sections"]
    for block in section.get("blocks", [])
    if block.get("type") == "code"
]
quiz = lesson["quiz"]

quiz_valid = True
for question in quiz:
    options = question.get("options", [])
    option_ids = {
        str(option.get("id")) if isinstance(option, dict) else str(index)
        for index, option in enumerate(options)
    }
    answer_ids = set(map(str, question.get("correctOptionIds", [])))
    if not options or not answer_ids or not answer_ids.issubset(option_ids):
        quiz_valid = False
    if not question.get("explanation", "").strip():
        quiz_valid = False

metrics = {
    "id": lesson["id"],
    "sections": len(lesson["sections"]),
    "uniqueSectionIds": len(set(section_ids)),
    "paragraphs": len(paragraphs),
    "paragraphCharacters": sum(len(text) for text in paragraphs),
    "codeBlocks": len(code_blocks),
    "quizQuestions": len(quiz),
    "quizAnswersValid": quiz_valid,
    "truthfulnessLabelsPresent": all(
        marker in LESSON_PATH.read_text()
        for marker in ("confirmed", "inferred", "proposed", "needs-confirmation")
    ),
}
REPORT_PATH.write_text(json.dumps(metrics, ensure_ascii=False, indent=2) + "\n")
print(json.dumps(metrics, ensure_ascii=False, indent=2))

assert lesson["id"] == LESSON_ID
assert metrics["sections"] == 24
assert metrics["uniqueSectionIds"] == 24
assert metrics["paragraphs"] >= 24
assert metrics["paragraphCharacters"] >= 8500
assert metrics["codeBlocks"] >= 6
assert metrics["quizQuestions"] >= 10
assert metrics["quizAnswersValid"]
assert metrics["truthfulnessLabelsPresent"]

catalog_path = DATA / "catalog.json"
catalog = json.loads(catalog_path.read_text())
chapter = next(ch for ch in catalog["chapters"] if ch["id"] == "c")
entry = next(item for item in chapter["lessons"] if item["id"] == LESSON_ID)
assert entry["status"] in ("planned", "published")
entry["status"] = "published"
entry["estimatedMinutes"] = lesson["estimatedMinutes"]
catalog_path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n")

plan_path = DATA / "book-plan.json"
plan = json.loads(plan_path.read_text())
assert plan["current"] in ("c05", "c06")
if LESSON_ID not in plan["completed"]:
    plan["completed"].append(LESSON_ID)
plan["current"] = "c06"
plan_path.write_text(json.dumps(plan, ensure_ascii=False, indent=2) + "\n")

index_path = DATA / "search-index.json"
index = json.loads(index_path.read_text())
if not any(item["lessonId"] == LESSON_ID for item in index):
    index.append({
        "lessonId": "c05",
        "code": "C05",
        "title": "Channel",
        "keywords": [
            "Channel", "SendChannel", "ReceiveChannel", "rendezvous", "buffered channel",
            "backpressure", "close", "cancel", "fan-in", "fan-out", "actor", "work queue",
            "onUndeliveredElement", "trySend", "durable queue"
        ],
        "headings": [
            "Send và receive", "Capacity và backpressure", "Close và cancel",
            "Undelivered element", "Fan-in và fan-out", "Actor ownership",
            "Channel và Flow", "Durability và idempotency"
        ]
    })
index_path.write_text(json.dumps(index, ensure_ascii=False, indent=2) + "\n")

for path in (catalog_path, plan_path, index_path, LESSON_PATH):
    json.loads(path.read_text())
for ch in catalog["chapters"]:
    for item in ch["lessons"]:
        if item["status"] == "published":
            referenced = ROOT / "android-learning" / item["path"]
            assert referenced.exists(), item["path"]

print("C05 deep publication validation passed")
