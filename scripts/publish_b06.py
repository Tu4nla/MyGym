import json
from pathlib import Path

root = Path(__file__).resolve().parents[1] / "android-learning"

catalog_path = root / "data/catalog.json"
book_path = root / "data/book-plan.json"
index_path = root / "data/search-index.json"
lesson_path = root / "data/lessons/b/b06.json"

catalog = json.loads(catalog_path.read_text())
book = json.loads(book_path.read_text())
index = json.loads(index_path.read_text())
lesson = json.loads(lesson_path.read_text())

assert lesson["id"] == "b06"
assert len(lesson.get("sections", [])) >= 20
quiz = lesson.get("quiz", [])
assert len(quiz) >= 10
for question in quiz:
    assert question.get("options")
    assert question.get("explanation")
    assert any(key in question for key in ("correctOptionIds", "answerIndex", "answerIndexes"))

b06 = None
for chapter in catalog["chapters"]:
    for item in chapter["lessons"]:
        if item["id"] == "b06":
            b06 = item
            break
assert b06 is not None
b06["status"] = "published"
b06["estimatedMinutes"] = lesson["estimatedMinutes"]

book["current"] = "b07"
book["completed"] = list(dict.fromkeys([*book.get("completed", []), "b06"]))

entry = {
    "lessonId": "b06",
    "code": "B06",
    "title": "Job và Cancellation",
    "keywords": [
        "Job", "cancellation", "CancellationException", "cooperative cancellation",
        "ensureActive", "yield", "isActive", "NonCancellable", "withTimeout",
        "timeout", "parent child", "stale result", "generation guard", "Upzi search"
    ],
    "headings": [
        "Cơ chế trạng thái của Job",
        "Cooperative cancellation hoạt động như thế nào",
        "Cancellation propagation trong cây Job",
        "Cleanup an toàn với try/finally",
        "Timeout và cancellation",
        "Yêu cầu sản phẩm cụ thể",
        "Case study Upzi và mức độ xác nhận",
        "Phương án thay thế",
        "Trade-off và edge cases",
        "Câu hỏi phỏng vấn"
    ]
}
index = [item for item in index if item.get("lessonId") != "b06"]
index.append(entry)

catalog_path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n")
book_path.write_text(json.dumps(book, ensure_ascii=False, indent=2) + "\n")
index_path.write_text(json.dumps(index, ensure_ascii=False, indent=2) + "\n")

print("B06 publication metadata updated and validated")
