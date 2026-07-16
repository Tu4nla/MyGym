import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "android-learning" / "data"
LESSON_PATH = DATA / "lessons" / "d" / "d01.json"
lesson = json.loads(LESSON_PATH.read_text())
sections = lesson["sections"]
ids = [section["id"] for section in sections]
paragraphs = [block["content"] for section in sections for block in section.get("blocks", []) if block.get("type") == "paragraph"]
code_blocks = [block for section in sections for block in section.get("blocks", []) if block.get("type") == "code"]
quiz_blocks = [block for section in sections for block in section.get("blocks", []) if block.get("type") == "quiz"]
preflight = {
    "sections": len(sections),
    "uniqueSectionIds": len(set(ids)),
    "paragraphs": len(paragraphs),
    "paragraphCharacters": sum(map(len, paragraphs)),
    "codeBlocks": len(code_blocks),
    "quizBlocks": len(quiz_blocks),
}
print(json.dumps(preflight, ensure_ascii=False, indent=2), flush=True)
assert len(sections) == len(set(ids)) == 24
assert len(paragraphs) >= 30
assert sum(map(len, paragraphs)) >= 10000
assert len(code_blocks) >= 5
assert len(quiz_blocks) == 1
quiz = quiz_blocks[0]["questions"]
assert len(quiz) >= 10
for question in quiz:
    option_ids = {str(option["id"]) for option in question["options"]}
    answers = set(map(str, question["correctOptionIds"]))
    assert answers and answers.issubset(option_ids)
    assert question["explanation"].strip()
lesson["quiz"] = quiz
LESSON_PATH.write_text(json.dumps(lesson, ensure_ascii=False, indent=2) + "\n")
text = LESSON_PATH.read_text()
assert all(label in text for label in ("confirmed", "inferred", "proposed", "needs-confirmation"))

catalog_path = DATA / "catalog.json"
catalog = json.loads(catalog_path.read_text())
entry = next(item for ch in catalog["chapters"] if ch["id"] == "d" for item in ch["lessons"] if item["id"] == "d01")
assert entry["status"] in ("planned", "published")
entry["status"] = "published"
entry["estimatedMinutes"] = lesson["estimatedMinutes"]
catalog_path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n")

plan_path = DATA / "book-plan.json"
plan = json.loads(plan_path.read_text())
assert plan["current"] in ("d01", "d02")
if "d01" not in plan["completed"]:
    plan["completed"].append("d01")
plan["current"] = "d02"
plan_path.write_text(json.dumps(plan, ensure_ascii=False, indent=2) + "\n")

index_path = DATA / "search-index.json"
index = [item for item in json.loads(index_path.read_text()) if item["lessonId"] != "d01"]
index.append({
    "lessonId": "d01",
    "code": "D01",
    "title": "Declarative UI và Compose Runtime",
    "keywords": ["declarative UI", "Jetpack Compose", "Compose Runtime", "composition", "recomposition", "Composer", "slot table", "snapshot state", "Recomposer", "Applier", "remember", "positional memoization", "key", "stability", "skippable", "restartable"],
    "headings": ["Declarative UI và imperative UI", "Compiler transform và Composer", "Composition, recomposition và apply changes", "Snapshot state và invalidation", "Slot table và remember", "Identity, key và positional memoization", "Stability và skippability", "State ownership và side-effect boundary"]
})
index_path.write_text(json.dumps(index, ensure_ascii=False, indent=2) + "\n")

report = {
    "id": "d01",
    "sections": len(sections),
    "uniqueSectionIds": len(set(ids)),
    "paragraphs": len(paragraphs),
    "paragraphCharacters": sum(map(len, paragraphs)),
    "codeBlocks": len(code_blocks),
    "quizQuestions": len(quiz),
    "truthfulnessLabelsPresent": True,
    "nextLesson": plan["current"]
}
(ROOT / "validation-d01.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
for ch in catalog["chapters"]:
    for item in ch["lessons"]:
        if item["status"] == "published":
            assert (ROOT / "android-learning" / item["path"]).exists(), item["path"]
print(json.dumps(report, ensure_ascii=False, indent=2))
