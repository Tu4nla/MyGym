import base64, gzip, json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "android-learning" / "data"
LESSON_PATH = DATA / "lessons" / "c" / "c11.json"
PAYLOAD_PATH = ROOT / "scripts" / "c11_payload.txt"

LESSON_PATH.parent.mkdir(parents=True, exist_ok=True)
LESSON_PATH.write_bytes(gzip.decompress(base64.b64decode(PAYLOAD_PATH.read_text().strip())))
lesson = json.loads(LESSON_PATH.read_text())
section_ids = [s["id"] for s in lesson["sections"]]
paragraphs = [b["content"] for s in lesson["sections"] for b in s.get("blocks", []) if b.get("type") == "paragraph"]
code_blocks = [b for s in lesson["sections"] for b in s.get("blocks", []) if b.get("type") == "code"]
quiz = lesson["quiz"]

quiz_valid = True
for q in quiz:
    option_ids = {str(o["id"]) for o in q.get("options", [])}
    answers = set(map(str, q.get("correctOptionIds", [])))
    quiz_valid = quiz_valid and len(option_ids) >= 2 and bool(answers) and answers.issubset(option_ids)
    quiz_valid = quiz_valid and bool(q.get("explanation", "").strip())

text = LESSON_PATH.read_text()
metrics = {
    "id": lesson["id"],
    "sections": len(lesson["sections"]),
    "uniqueSectionIds": len(set(section_ids)),
    "paragraphs": len(paragraphs),
    "paragraphCharacters": sum(len(x) for x in paragraphs),
    "codeBlocks": len(code_blocks),
    "quizQuestions": len(quiz),
    "quizAnswersValid": quiz_valid,
    "truthfulnessLabelsPresent": all(x in text for x in ("confirmed", "inferred", "proposed", "needs-confirmation")),
}
(ROOT / "validation-c11.json").write_text(json.dumps(metrics, ensure_ascii=False, indent=2) + "\n")
print(json.dumps(metrics, ensure_ascii=False, indent=2))

assert lesson["id"] == "c11"
assert metrics["sections"] == 24
assert metrics["uniqueSectionIds"] == 24
assert metrics["paragraphs"] >= 50
assert metrics["paragraphCharacters"] >= 14000
assert metrics["codeBlocks"] >= 8
assert metrics["quizQuestions"] >= 10
assert metrics["quizAnswersValid"]
assert metrics["truthfulnessLabelsPresent"]

catalog_path = DATA / "catalog.json"
catalog = json.loads(catalog_path.read_text())
chapter = next(ch for ch in catalog["chapters"] if ch["id"] == "c")
entry = next(i for i in chapter["lessons"] if i["id"] == "c11")
assert entry["status"] in ("planned", "published")
entry["status"] = "published"
entry["estimatedMinutes"] = lesson["estimatedMinutes"]
catalog_path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n")

plan_path = DATA / "book-plan.json"
plan = json.loads(plan_path.read_text())
assert plan["current"] in ("c11", "d01")
if "c11" not in plan["completed"]:
    plan["completed"].append("c11")
plan["current"] = "d01"
plan_path.write_text(json.dumps(plan, ensure_ascii=False, indent=2) + "\n")

index_path = DATA / "search-index.json"
index = json.loads(index_path.read_text())
if not any(i["lessonId"] == "c11" for i in index):
    index.append({
        "lessonId": "c11",
        "code": "C11",
        "title": "Flow Testing",
        "keywords": [
            "Flow testing", "runTest", "TestCoroutineScheduler", "virtual time",
            "StandardTestDispatcher", "UnconfinedTestDispatcher", "Turbine",
            "StateFlow test", "SharedFlow test", "debounce test", "cancellation"
        ],
        "headings": [
            "Virtual time", "Finite và infinite Flow", "StateFlow và SharedFlow",
            "Debounce", "Cancellation", "Turbine", "Upzi", "Interview"
        ]
    })
index_path.write_text(json.dumps(index, ensure_ascii=False, indent=2) + "\n")

for p in (catalog_path, plan_path, index_path, LESSON_PATH):
    json.loads(p.read_text())
for ch in catalog["chapters"]:
    for item in ch["lessons"]:
        if item["status"] == "published":
            assert (ROOT / "android-learning" / item["path"]).exists(), item["path"]
print("C11 deep publication validation passed")
