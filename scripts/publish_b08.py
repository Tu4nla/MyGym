import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
data = root / "android-learning" / "data"
lesson_path = data / "lessons" / "b" / "b08.json"
catalog_path = data / "catalog.json"
plan_path = data / "book-plan.json"
index_path = data / "search-index.json"

lesson = json.loads(lesson_path.read_text())
assert lesson["id"] == "b08"
assert len(lesson["sections"]) >= 24
section_ids = [section["id"] for section in lesson["sections"]]
assert len(section_ids) == len(set(section_ids))
assert len(lesson["quiz"]) >= 10
for question in lesson["quiz"]:
    assert question.get("options") and len(question["options"]) >= 2
    assert isinstance(question.get("answerIndex"), int)
    assert 0 <= question["answerIndex"] < len(question["options"])
    assert question.get("explanation", "").strip()

catalog = json.loads(catalog_path.read_text())
chapter = next(chapter for chapter in catalog["chapters"] if chapter["id"] == "b")
lessons = chapter["lessons"]
ids = [item["id"] for item in lessons]
assert ids.index("b08") == ids.index("b07") + 1
b08 = next(item for item in lessons if item["id"] == "b08")
assert b08["status"] == "planned"
b08["status"] = "published"
b08["estimatedMinutes"] = lesson["estimatedMinutes"]
catalog_path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n")

plan = json.loads(plan_path.read_text())
assert plan["current"] == "b08"
assert "b07" in plan["completed"]
if "b08" not in plan["completed"]:
    plan["completed"].append("b08")
plan["current"] = "b09"
plan_path.write_text(json.dumps(plan, ensure_ascii=False, indent=2) + "\n")

index = json.loads(index_path.read_text())
assert not any(item["lessonId"] == "b08" for item in index)
index.append({
    "lessonId": "b08",
    "code": "B08",
    "title": "coroutineScope và supervisorScope",
    "keywords": ["coroutineScope", "supervisorScope", "SupervisorJob", "structured concurrency", "fail-fast", "partial success", "failure isolation", "sibling cancellation", "exception ownership", "async", "await", "CancellationException", "Upzi Job Detail"],
    "headings": ["Cơ chế hoạt động bên trong", "Dấu hiệu cần dùng", "Khi không nên dùng", "Yêu cầu sản phẩm cụ thể", "Phân tích dependency, error policy, lifecycle và resource limits", "supervisorScope đúng cách", "Ví dụ thực tế Upzi", "Trade-off", "Edge cases", "Câu hỏi phỏng vấn"]
})
index_path.write_text(json.dumps(index, ensure_ascii=False, indent=2) + "\n")

for path in (lesson_path, catalog_path, plan_path, index_path):
    json.loads(path.read_text())
for chapter in catalog["chapters"]:
    for item in chapter["lessons"]:
        if item["status"] == "published":
            assert (root / "android-learning" / item["path"]).exists(), item["path"]
print("B08 publication validation passed")
