import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
data = root / "android-learning" / "data"
lesson_path = data / "lessons" / "b" / "b07.json"
catalog_path = data / "catalog.json"
plan_path = data / "book-plan.json"
index_path = data / "search-index.json"

lesson = json.loads(lesson_path.read_text())
assert lesson["id"] == "b07"
assert len(lesson["sections"]) >= 20
section_ids = [s["id"] for s in lesson["sections"]]
assert len(section_ids) == len(set(section_ids))
assert len(lesson["quiz"]) >= 10
for q in lesson["quiz"]:
    assert q.get("options") and len(q["options"]) >= 2
    assert "explanation" in q and q["explanation"].strip()
    assert any(k in q for k in ("answerIndex", "answerIndexes", "correctOptionIds"))

catalog = json.loads(catalog_path.read_text())
chapter = next(c for c in catalog["chapters"] if c["id"] == "b")
lessons = chapter["lessons"]
ids = [l["id"] for l in lessons]
assert ids.index("b07") == ids.index("b06") + 1
b07 = next(l for l in lessons if l["id"] == "b07")
assert b07["status"] == "planned"
b07["status"] = "published"
b07["estimatedMinutes"] = lesson["estimatedMinutes"]
catalog_path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n")

plan = json.loads(plan_path.read_text())
assert plan["current"] == "b07"
assert "b06" in plan["completed"]
if "b07" not in plan["completed"]:
    plan["completed"].append("b07")
plan["current"] = "b08"
plan_path.write_text(json.dumps(plan, ensure_ascii=False, indent=2) + "\n")

index = json.loads(index_path.read_text())
assert not any(x["lessonId"] == "b07" for x in index)
index.append({
    "lessonId": "b07",
    "code": "B07",
    "title": "Exception Handling",
    "keywords": ["exception propagation", "CoroutineExceptionHandler", "try catch", "launch", "async", "await", "CancellationException", "supervisorScope", "fail-fast", "partial success", "Result", "AppError", "retry", "backoff", "idempotency", "Upzi Job Detail"],
    "headings": ["Cơ chế exception propagation bên trong", "launch, async và suspend function xử lý lỗi khác nhau thế nào", "Ranh giới try/catch đúng và sai", "CoroutineExceptionHandler: mục đích và giới hạn", "Yêu cầu sản phẩm cụ thể", "Chuẩn hóa error model giữa các layer", "Retry, backoff và idempotency", "Case study Upzi và tính trung thực kinh nghiệm", "Edge cases", "Câu hỏi phỏng vấn"]
})
index_path.write_text(json.dumps(index, ensure_ascii=False, indent=2) + "\n")

# Final parse and path validation
for path in (lesson_path, catalog_path, plan_path, index_path):
    json.loads(path.read_text())
for ch in catalog["chapters"]:
    for item in ch["lessons"]:
        if item["status"] == "published":
            assert (root / "android-learning" / item["path"]).exists(), item["path"]
print("B07 publication validation passed")
