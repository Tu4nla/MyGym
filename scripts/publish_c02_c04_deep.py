import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "android-learning" / "data"
LESSONS = ["c02", "c03", "c04"]

loaded = {}
for lesson_id in LESSONS:
    path = DATA / "lessons" / "c" / f"{lesson_id}.json"
    assert path.exists(), path
    lesson = json.loads(path.read_text())
    loaded[lesson_id] = lesson

    assert lesson["id"] == lesson_id
    assert len(lesson["sections"]) == 24
    section_ids = [section["id"] for section in lesson["sections"]]
    assert len(section_ids) == len(set(section_ids))

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
    assert len(paragraphs) >= 22, (lesson_id, len(paragraphs))
    assert sum(len(text) for text in paragraphs) >= 8500, lesson_id
    assert len(code_blocks) >= 4, (lesson_id, len(code_blocks))

    quiz = lesson["quiz"]
    assert len(quiz) >= 10
    for question in quiz:
        assert len(question.get("options", [])) >= 2
        assert any(key in question for key in ("answerIndex", "answerIndexes", "correctOptionIds"))
        assert question.get("explanation", "").strip()

catalog_path = DATA / "catalog.json"
catalog = json.loads(catalog_path.read_text())
chapter = next(ch for ch in catalog["chapters"] if ch["id"] == "c")
ids = [item["id"] for item in chapter["lessons"]]
assert ids.index("c03") == ids.index("c02") + 1
assert ids.index("c04") == ids.index("c03") + 1

for lesson_id in LESSONS:
    item = next(entry for entry in chapter["lessons"] if entry["id"] == lesson_id)
    assert item["status"] == "planned"
    item["status"] = "published"
    item["estimatedMinutes"] = loaded[lesson_id]["estimatedMinutes"]

catalog_path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n")

plan_path = DATA / "book-plan.json"
plan = json.loads(plan_path.read_text())
assert plan["current"] == "c02"
for lesson_id in LESSONS:
    if lesson_id not in plan["completed"]:
        plan["completed"].append(lesson_id)
plan["current"] = "c05"
plan_path.write_text(json.dumps(plan, ensure_ascii=False, indent=2) + "\n")

index_path = DATA / "search-index.json"
index = json.loads(index_path.read_text())
assert not any(entry["lessonId"] in LESSONS for entry in index)
index.extend([
    {
        "lessonId": "c02",
        "code": "C02",
        "title": "Cold Flow",
        "keywords": ["cold Flow", "lazy execution", "per collector", "flowOn", "context preservation", "exception transparency", "retryWhen", "stateIn", "multiple collectors", "cache network"],
        "headings": ["Lazy execution", "Mỗi collector tạo execution riêng", "Emit và collect tuần tự", "Context preservation và flowOn", "Exception transparency", "Cancellation propagation", "Repository observation và command", "Retry và side effect"]
    },
    {
        "lessonId": "c03",
        "code": "C03",
        "title": "StateFlow",
        "keywords": ["StateFlow", "MutableStateFlow", "stateIn", "update", "compareAndSet", "conflation", "immutable UI state", "single owner", "collectAsStateWithLifecycle", "process death"],
        "headings": ["Hot state holder", "Equality-based conflation", "Immutable state", "Atomic update", "UI state machine", "State và event", "stateIn", "Compose collection"]
    },
    {
        "lessonId": "c04",
        "code": "C04",
        "title": "SharedFlow",
        "keywords": ["SharedFlow", "MutableSharedFlow", "replay", "extraBufferCapacity", "BufferOverflow", "tryEmit", "shareIn", "broadcast", "UI effect", "socket events"],
        "headings": ["Hot broadcast stream", "Replay", "Buffer và backpressure", "emit và tryEmit", "Subscriber absence", "SharedFlow và StateFlow", "One-time effect", "shareIn"]
    }
])
index_path.write_text(json.dumps(index, ensure_ascii=False, indent=2) + "\n")

for path in (catalog_path, plan_path, index_path):
    json.loads(path.read_text())
for ch in catalog["chapters"]:
    for item in ch["lessons"]:
        if item["status"] == "published":
            assert (ROOT / "android-learning" / item["path"]).exists(), item["path"]

print("C02-C04 deep publication validation passed")
