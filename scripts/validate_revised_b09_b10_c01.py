import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "android-learning" / "data"
LESSONS = ["b09", "b10", "c01"]


def lesson_path(lesson_id: str) -> Path:
    chapter = lesson_id[0]
    return DATA / "lessons" / chapter / f"{lesson_id}.json"


loaded = {}
for lesson_id in LESSONS:
    path = lesson_path(lesson_id)
    assert path.exists(), path
    lesson = json.loads(path.read_text())
    loaded[lesson_id] = lesson

    assert lesson["id"] == lesson_id
    assert len(lesson["sections"]) == 24
    section_ids = [section["id"] for section in lesson["sections"]]
    assert len(section_ids) == len(set(section_ids))

    paragraph_text = [
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

    # Prevent regression to a lesson made mostly of short bullet lists.
    assert len(paragraph_text) >= 22, (lesson_id, len(paragraph_text))
    assert sum(len(text) for text in paragraph_text) >= 9000, lesson_id
    assert len(code_blocks) >= 4, (lesson_id, len(code_blocks))

    quiz = lesson["quiz"]
    assert len(quiz) >= 10
    for question in quiz:
        assert len(question.get("options", [])) >= 2
        assert any(key in question for key in ("answerIndex", "answerIndexes", "correctOptionIds"))
        assert question.get("explanation", "").strip()

catalog_path = DATA / "catalog.json"
catalog = json.loads(catalog_path.read_text())
for lesson_id, lesson in loaded.items():
    chapter = next(ch for ch in catalog["chapters"] if ch["id"] == lesson_id[0])
    item = next(entry for entry in chapter["lessons"] if entry["id"] == lesson_id)
    assert item["status"] == "published"
    item["estimatedMinutes"] = lesson["estimatedMinutes"]

catalog_path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n")

for chapter in catalog["chapters"]:
    for item in chapter["lessons"]:
        if item["status"] == "published":
            assert (ROOT / "android-learning" / item["path"]).exists(), item["path"]

print("B09, B10 and C01 depth validation passed")
