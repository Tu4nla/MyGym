import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "android-learning" / "data"
LESSON_ID = "d03"
LESSON_PATH = DATA / "lessons" / "d" / "d03.json"
REPORT_PATH = ROOT / "validation-d03.json"
EXPECTED_SECTION_IDS = [
    "objectives", "prerequisites", "terminology", "mechanism", "purpose", "problem",
    "when-to-use", "when-not-to-use", "requirement", "analysis", "minimal-code",
    "upzi-case", "alternatives", "tradeoffs", "edge-cases", "mistakes",
    "interview-basic", "interview-deep", "experience-answer", "practice", "scenario",
    "checklist", "summary", "quiz-guide"
]

lesson = json.loads(LESSON_PATH.read_text())
sections = lesson["sections"]
section_ids = [section["id"] for section in sections]
paragraphs = [
    block["content"]
    for section in sections
    for block in section.get("blocks", [])
    if block.get("type") == "paragraph"
]
code_blocks = [
    block
    for section in sections
    for block in section.get("blocks", [])
    if block.get("type") == "code"
]
quiz = lesson["quiz"]
quiz_valid = True
for question in quiz:
    options = question.get("options", [])
    option_ids = {str(option.get("id")) for option in options}
    answer_ids = set(map(str, question.get("correctOptionIds", [])))
    if not options or not answer_ids or not answer_ids.issubset(option_ids):
        quiz_valid = False
    if not question.get("explanation", "").strip():
        quiz_valid = False

text = LESSON_PATH.read_text()
metrics = {
    "id": lesson["id"],
    "sections": len(sections),
    "uniqueSectionIds": len(set(section_ids)),
    "exactSectionOrder": section_ids == EXPECTED_SECTION_IDS,
    "paragraphs": len(paragraphs),
    "paragraphCharacters": sum(len(value) for value in paragraphs),
    "codeBlocks": len(code_blocks),
    "quizQuestions": len(quiz),
    "quizAnswersValid": quiz_valid,
    "truthfulnessLabelsPresent": all(
        marker in text for marker in ("confirmed", "inferred", "proposed", "needs-confirmation")
    ),
}

assert lesson["id"] == LESSON_ID
assert metrics["sections"] == 24
assert metrics["uniqueSectionIds"] == 24
assert metrics["exactSectionOrder"]
assert metrics["paragraphs"] >= 35
assert metrics["paragraphCharacters"] >= 9000
assert metrics["codeBlocks"] >= 5
assert metrics["quizQuestions"] >= 10
assert metrics["quizAnswersValid"]
assert metrics["truthfulnessLabelsPresent"]

catalog_path = DATA / "catalog.json"
catalog = json.loads(catalog_path.read_text())
chapter = next(ch for ch in catalog["chapters"] if ch["id"] == "d")
entry = next(item for item in chapter["lessons"] if item["id"] == LESSON_ID)
assert entry["status"] in ("planned", "published")
entry["status"] = "published"
entry["estimatedMinutes"] = lesson["estimatedMinutes"]
catalog_path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n")

plan_path = DATA / "book-plan.json"
plan = json.loads(plan_path.read_text())
assert plan["current"] in ("d03", "d04")
if LESSON_ID not in plan["completed"]:
    plan["completed"].append(LESSON_ID)
plan["current"] = "d04"
plan_path.write_text(json.dumps(plan, ensure_ascii=False, indent=2) + "\n")

index_path = DATA / "search-index.json"
index = json.loads(index_path.read_text())
index = [item for item in index if item["lessonId"] != LESSON_ID]
index.append({
    "lessonId": "d03",
    "code": "D03",
    "title": "remember và rememberSaveable",
    "keywords": [
        "remember", "rememberSaveable", "Saver", "listSaver", "mapSaver",
        "SaveableStateRegistry", "positional memoization", "slot table", "composition identity",
        "process death", "configuration change", "Bundle", "stable key", "LazyColumn key"
    ],
    "headings": [
        "Positional memoization", "remember key", "SaveableStateRegistry",
        "Custom Saver", "Composition lifetime", "Restoration lifetime",
        "Lazy list identity", "Bundle resource limits"
    ]
})
index_path.write_text(json.dumps(index, ensure_ascii=False, indent=2) + "\n")

metrics["nextLesson"] = plan["current"]
REPORT_PATH.write_text(json.dumps(metrics, ensure_ascii=False, indent=2) + "\n")

for path in (catalog_path, plan_path, index_path, LESSON_PATH):
    json.loads(path.read_text())
for ch in catalog["chapters"]:
    for item in ch["lessons"]:
        if item["status"] == "published":
            assert (ROOT / "android-learning" / item["path"]).exists(), item["path"]

print(json.dumps(metrics, ensure_ascii=False, indent=2))
print("D03 deep publication validation passed")
