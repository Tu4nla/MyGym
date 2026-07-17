import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "android-learning" / "data"
lesson_path = DATA / "lessons" / "d" / "d04.json"
lesson = json.loads(lesson_path.read_text())
required = ["objectives","prerequisites","terminology","mechanism","purpose","problem","when-to-use","when-not-to-use","requirement","analysis","minimal-code","upzi-case","alternatives","tradeoffs","edge-cases","mistakes","interview-basic","interview-deep","experience-answer","practice","scenario","checklist","summary","quiz-guide"]
ids = [s["id"] for s in lesson["sections"]]
assert ids == required
paragraphs = [b["content"] for s in lesson["sections"] for b in s.get("blocks",[]) if b.get("type") == "paragraph"]
code_blocks = [b for s in lesson["sections"] for b in s.get("blocks",[]) if b.get("type") == "code"]
assert len(paragraphs) >= 35 and sum(map(len, paragraphs)) >= 9000
assert len(code_blocks) >= 5
assert len(lesson["quiz"]) >= 10
for q in lesson["quiz"]:
    option_ids = {o["id"] for o in q["options"]}
    assert q["correctOptionIds"] and set(q["correctOptionIds"]) <= option_ids
    assert q["explanation"].strip()
text = lesson_path.read_text()
for label in ["confirmed:","inferred:","proposed:","needs-confirmation:"]:
    assert label in text

catalog_path = DATA / "catalog.json"
catalog = json.loads(catalog_path.read_text())
for chapter in catalog["chapters"]:
    for item in chapter["lessons"]:
        if item["id"] == "d04":
            item["status"] = "published"
            item["estimatedMinutes"] = 360
catalog_path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n")

plan_path = DATA / "book-plan.json"
plan = json.loads(plan_path.read_text())
if "d04" not in plan["completed"]:
    plan["completed"].append("d04")
plan["current"] = "d05"
plan_path.write_text(json.dumps(plan, ensure_ascii=False, indent=2) + "\n")

index_path = DATA / "search-index.json"
index = json.loads(index_path.read_text())
entry = {"id":"d04","code":"D04","title":"Side-effect APIs","chapter":"d","path":"data/lessons/d/d04.json","keywords":["LaunchedEffect","DisposableEffect","SideEffect","rememberCoroutineScope","rememberUpdatedState","produceState","snapshotFlow","effect key","cancellation","cleanup","stale capture"]}
if isinstance(index, list):
    index[:] = [x for x in index if x.get("id") != "d04"] + [entry]
elif "lessons" in index:
    index["lessons"] = [x for x in index["lessons"] if x.get("id") != "d04"] + [entry]
else:
    raise AssertionError("Unsupported search-index schema")
index_path.write_text(json.dumps(index, ensure_ascii=False, indent=2) + "\n")

report = {"id":"d04","sections":len(ids),"uniqueSectionIds":len(set(ids)),"exactSectionOrder":ids == required,"paragraphs":len(paragraphs),"paragraphCharacters":sum(map(len, paragraphs)),"codeBlocks":len(code_blocks),"quizQuestions":len(lesson["quiz"]),"quizAnswersValid":True,"truthfulnessLabelsPresent":True,"nextLesson":"d05"}
(ROOT / "validation-d04.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
print(json.dumps(report, ensure_ascii=False))
