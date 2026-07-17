import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/'android-learning'/'data'
lesson_path=DATA/'lessons'/'d'/'d09.json'
lesson=json.loads(lesson_path.read_text())
required=['objectives','prerequisites','terminology','mechanism','purpose','problem','when-to-use','when-not-to-use','requirement','analysis','minimal-code','upzi-case','alternatives','tradeoffs','edge-cases','mistakes','interview-basic','interview-deep','experience-answer','practice','scenario','checklist','summary','quiz-guide']
ids=[s['id'] for s in lesson['sections']]
assert ids==required and len(set(ids))==24
paragraphs=[b['content'] for s in lesson['sections'] for b in s.get('blocks',[]) if b.get('type')=='paragraph']
code_blocks=[b for s in lesson['sections'] for b in s.get('blocks',[]) if b.get('type')=='code']
assert len(paragraphs)>=40 and sum(map(len,paragraphs))>=9000 and len(code_blocks)>=3
assert len(lesson['quiz'])>=10
for q in lesson['quiz']:
    opts={o['id'] for o in q['options']}
    assert q['correctOptionIds'] and set(q['correctOptionIds'])<=opts and q['explanation'].strip()
text=lesson_path.read_text()
for label in ['confirmed:','inferred:','proposed:','needs-confirmation:']:
    assert label in text
catalog_path=DATA/'catalog.json'; catalog=json.loads(catalog_path.read_text())
found=False
for chapter in catalog['chapters']:
    for item in chapter['lessons']:
        if item['id']=='d09':
            assert item['status']=='planned'; item['status']='published'; item['estimatedMinutes']=360; found=True
assert found
catalog_path.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n')
plan_path=DATA/'book-plan.json'; plan=json.loads(plan_path.read_text())
assert plan['current']=='d09'
if 'd09' not in plan['completed']: plan['completed'].append('d09')
plan['current']='d10'
plan_path.write_text(json.dumps(plan,ensure_ascii=False,indent=2)+'\n')
index_path=DATA/'search-index.json'; index=json.loads(index_path.read_text())
entry={'lessonId':'d09','code':'D09','title':'Navigation Compose','keywords':['Navigation Compose','NavController','NavHost','NavGraph','NavBackStackEntry','popUpTo','launchSingleTop','saveState','restoreState','nested graph','ViewModel scope','SavedStateHandle'],'headings':['Back stack và lifecycle','Route contract','Nested graph','Auth flow','Bottom navigation','ViewModel scoping','State restoration','Upzi case study']}
assert isinstance(index,list)
index[:]=[x for x in index if x.get('lessonId')!='d09']+[entry]
index_path.write_text(json.dumps(index,ensure_ascii=False,indent=2)+'\n')
report={'id':'d09','sections':len(ids),'uniqueSectionIds':len(set(ids)),'exactSectionOrder':ids==required,'paragraphs':len(paragraphs),'paragraphCharacters':sum(map(len,paragraphs)),'codeBlocks':len(code_blocks),'quizQuestions':len(lesson['quiz']),'quizAnswersValid':True,'truthfulnessLabelsPresent':True,'nextLesson':'d10'}
(ROOT/'validation-d09.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report,ensure_ascii=False))