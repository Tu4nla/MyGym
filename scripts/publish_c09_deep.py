import base64
import gzip
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "android-learning" / "data"
LESSON_PATH = DATA / "lessons" / "c" / "c09.json"
PAYLOAD_PATH = ROOT / "scripts" / "c09_payload.txt"

LESSON_PATH.parent.mkdir(parents=True, exist_ok=True)
LESSON_PATH.write_bytes(gzip.decompress(base64.b64decode(PAYLOAD_PATH.read_text().strip())))
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
    option_ids = {str(option["id"]) for option in question.get("options", [])}
    answers = set(map(str, question.get("correctOptionIds", [])))
    quiz_valid = quiz_valid and len(option_ids) >= 2 and bool(answers) and answers.issubset(option_ids)
    quiz_valid = quiz_valid and bool(question.get("explanation", "").strip())

text = LESSON_PATH.read_text()
metrics = {
    "id": lesson["id"],
    "sections": len(lesson["sections"]),
    "uniqueSectionIds": len(set(section_ids)),
    "paragraphs": len(paragraphs),
    "paragraphCharacters": sum(len(value) for value in paragraphs),
    "codeBlocks": len(code_blocks),
    "quizQuestions": len(quiz),
    "quizAnswersValid": quiz_valid,
    "truthfulnessLabelsPresent": all(
        marker in text for marker in ("confirmed", "inferred", "proposed", "needs-confirmation")
    ),
}
(ROOT / "validation-c09.json").write_text(json.dumps(metrics, ensure_ascii=False, indent=2) + "\n")
print(json.dumps(metrics, ensure_ascii=False, indent=2))

assert lesson["id"] == "c09"
assert metrics["sections"] == 24
assert metrics["uniqueSectionIds"] == 24
assert metrics["paragraphs"] >= 40
assert metrics["paragraphCharacters"] >= 14000
assert metrics["codeBlocks"] >= 8
assert metrics["quizQuestions"] >= 10
assert metrics["quizAnswersValid"]
assert metrics["truthfulnessLabelsPresent"]

catalog_path = DATA / "catalog.json"
catalog = json.loads(catalog_path.read_text())
chapter = next(ch for ch in catalog["chapters"] if ch["id"] == "c")
entry = next(item for item in chapter["lessons"] if item["id"] == "c09")
assert entry["status"] in ("planned", "published")
entry["status"] = "published"
entry["estimatedMinutes"] = lesson["estimatedMinutes"]
catalog_path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n")

plan_path = DATA / "book-plan.json"
plan = json.loads(plan_path.read_text())
assert plan["current"] in ("c09", "c10")
if "c09" not in plan["completed"]:
    plan["completed"].append("c09")
plan["current"] = "c10"
plan_path.write_text(json.dumps(plan, ensure_ascii=False, indent=2) + "\n")

index_path = DATA / "search-index.json"
index = json.loads(index_path.read_text())
if not any(item["lessonId"] == "c09" for item in index):
    index.append({
        "lessonId": "c09",
        "code": "C09",
        "title": "Context và Lifecycle của Flow",
        "keywords": [
            "CoroutineContext", "flowOn", "context preservation", "repeatOnLifecycle",
            "collectAsStateWithLifecycle", "stateIn", "shareIn", "SharingStarted",
            "WhileSubscribed", "viewModelScope", "lifecycleScope", "callbackFlow",
            "awaitClose", "process death", "scope ownership"
        ],
        "headings": [
            "Context preservation", "flowOn boundary", "Collector và producer lifecycle",
            "repeatOnLifecycle", "collectAsStateWithLifecycle", "stateIn và shareIn",
            "SharingStarted", "Scope ownership", "Callback cleanup", "Process death"
        ]
    })
index_path.write_text(json.dumps(index, ensure_ascii=False, indent=2) + "\n")

for path in (catalog_path, plan_path, index_path, LESSON_PATH):
    json.loads(path.read_text())
for ch in catalog["chapters"]:
    for item in ch["lessons"]:
        if item["status"] == "published":
            assert (ROOT / "android-learning" / item["path"]).exists(), item["path"]

print("C09 deep publication validation passed")
