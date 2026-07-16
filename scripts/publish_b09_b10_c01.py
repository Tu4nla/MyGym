import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
data = root / "android-learning" / "data"
lesson_ids = ["b09", "b10", "c01"]
lesson_paths = {
    "b09": data / "lessons" / "b" / "b09.json",
    "b10": data / "lessons" / "b" / "b10.json",
    "c01": data / "lessons" / "c" / "c01.json",
}

for lesson_id in lesson_ids:
    lesson = json.loads(lesson_paths[lesson_id].read_text())
    assert lesson["id"] == lesson_id
    assert len(lesson["sections"]) >= 24
    ids = [section["id"] for section in lesson["sections"]]
    assert len(ids) == len(set(ids))
    assert len(lesson["quiz"]) >= 10
    for q in lesson["quiz"]:
        assert q.get("options") and len(q["options"]) >= 2
        assert q.get("explanation", "").strip()
        assert any(k in q for k in ("answerIndex", "answerIndexes", "correctOptionIds"))

catalog_path = data / "catalog.json"
plan_path = data / "book-plan.json"
index_path = data / "search-index.json"
catalog = json.loads(catalog_path.read_text())

ordered = []
for chapter_code in catalog["course"]["recommendedOrder"]:
    chapter = next(c for c in catalog["chapters"] if c["code"] == chapter_code)
    ordered.extend(chapter["lessons"])
first_planned = next(item["id"] for item in ordered if item["status"] == "planned")
assert first_planned == "b09"
assert [item["id"] for item in ordered if item["id"] in lesson_ids] == lesson_ids

for lesson_id in lesson_ids:
    lesson = json.loads(lesson_paths[lesson_id].read_text())
    item = next(item for item in ordered if item["id"] == lesson_id)
    assert item["status"] == "planned"
    item["status"] = "published"
    item["estimatedMinutes"] = lesson["estimatedMinutes"]

catalog_path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n")

plan = json.loads(plan_path.read_text())
assert plan["current"] == "b09"
for lesson_id in lesson_ids:
    if lesson_id not in plan["completed"]:
        plan["completed"].append(lesson_id)
plan["current"] = "c02"
plan_path.write_text(json.dumps(plan, ensure_ascii=False, indent=2) + "\n")

index = json.loads(index_path.read_text())
assert not any(entry["lessonId"] in lesson_ids for entry in index)
index.extend([
    {
        "lessonId": "b09",
        "code": "B09",
        "title": "Race condition và Thread Safety",
        "keywords": ["race condition", "data race", "thread safety", "atomicity", "visibility", "ordering", "Mutex", "AtomicReference", "confinement", "actor", "Room transaction", "idempotency", "Upzi chat"],
        "headings": ["Cơ chế race condition", "Atomicity, visibility và ordering", "Mutex và critical section", "Immutable state và confinement", "Actor và transaction", "Yêu cầu chat acknowledgement", "Case study Upzi", "Trade-off và edge cases", "Câu hỏi phỏng vấn"]
    },
    {
        "lessonId": "b10",
        "code": "B10",
        "title": "Coroutine Testing",
        "keywords": ["runTest", "TestScope", "TestCoroutineScheduler", "StandardTestDispatcher", "UnconfinedTestDispatcher", "virtual time", "advanceUntilIdle", "runCurrent", "MainDispatcherRule", "dispatcher injection", "cancellation testing", "Upzi search"],
        "headings": ["Cơ chế virtual time", "StandardTestDispatcher và UnconfinedTestDispatcher", "Dispatcher injection", "MainDispatcherRule", "Test cancellation và latest-only", "Case study Upzi", "Trade-off và edge cases", "Câu hỏi phỏng vấn"]
    },
    {
        "lessonId": "c01",
        "code": "C01",
        "title": "Reactive Programming và Data Stream",
        "keywords": ["reactive programming", "data stream", "producer", "collector", "cold stream", "hot stream", "backpressure", "buffer", "conflate", "state", "event", "callbackFlow", "Upzi search", "SSE", "Socket.IO"],
        "headings": ["Reactive programming và data stream", "Producer, collector và operator", "Cold và hot stream", "Backpressure, buffer và conflate", "State và event", "Reactive search", "Case study Upzi", "Trade-off và edge cases", "Câu hỏi phỏng vấn"]
    }
])
index_path.write_text(json.dumps(index, ensure_ascii=False, indent=2) + "\n")

# Final validation after mutation.
for path in (catalog_path, plan_path, index_path, *lesson_paths.values()):
    json.loads(path.read_text())
for chapter in catalog["chapters"]:
    for item in chapter["lessons"]:
        if item["status"] == "published":
            assert (root / "android-learning" / item["path"]).exists(), item["path"]
assert next(item["id"] for item in ordered if item["status"] == "planned") == "c02"
print("B09, B10 and C01 publication validation passed")
