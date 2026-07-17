import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/'android-learning'/'data'
lesson_path=DATA/'lessons'/'d'/'d06.json'
lesson=json.loads(lesson_path.read_text())
required=['objectives','prerequisites','terminology','mechanism','purpose','problem','when-to-use','when-not-to-use','requirement','analysis','minimal-code','upzi-case','alternatives','tradeoffs','edge-cases','mistakes','interview-basic','interview-deep','experience-answer','practice','scenario','checklist','summary','quiz-guide']
ids=[s['id'] for s in lesson['sections']]
assert ids==required and len(set(ids))==24
paragraphs=[b['content'] for s in lesson['sections'] for b in s.get('blocks',[]) if b.get('type')=='paragraph']
code_blocks=[b for s in lesson['sections'] for b in s.get('blocks',[]) if b.get('type')=='code']
assert len(paragraphs)>=40
assert sum(map(len,paragraphs))>=9000
assert len(code_blocks)>=3
assert len(lesson['quiz'])>=10
for q in lesson['quiz']:
    opts={o['id'] for o in q['options']}
    assert q['correctOptionIds'] and set(q['correctOptionIds'])<=opts and q['explanation'].strip()
text=lesson_path.read_text()
for label in ['confirmed:','inferred:','proposed:','needs-confirmation:']:
    assert label in text
catalog_path=DATA/'catalog.json'
catalog=json.loads(catalog_path.read_text())
found=False
for chapter in catalog['chapters']:
    for item in chapter['lessons']:
        if item['id']=='d06':
            assert item['status']=='planned'
            item['status']='published'; item['estimatedMinutes']=360; found=True
assert found
catalog_path.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n')
plan_path=DATA/'book-plan.json'; plan=json.loads(plan_path.read_text())
assert plan['current']=='d06'
if 'd06' not in plan['completed']: plan['completed'].append('d06')
plan['current']='d07'
plan_path.write_text(json.dumps(plan,ensure_ascii=False,indent=2)+'\n')
index_path=DATA/'search-index.json'; index=json.loads(index_path.read_text())
entry={'lessonId':'d06','code':'D06','title':'Compose và ViewModel','keywords':['Compose ViewModel','StateFlow','collectAsStateWithLifecycle','UI state','UI event','SavedStateHandle','ViewModelStoreOwner','stateIn','SharingStarted','Route Screen','cachedIn','process death'],'headings':['Ranh giới Compose và ViewModel','Luồng dữ liệu một chiều','Lifecycle-aware collection','Route và Screen','SavedStateHandle','One-time event','ViewModel scoping','Upzi case study']}
assert isinstance(index,list)
index[:]=[x for x in index if x.get('lessonId')!='d06']+[entry]
index_path.write_text(json.dumps(index,ensure_ascii=False,indent=2)+'\n')
report={'id':'d06','sections':len(ids),'uniqueSectionIds':len(set(ids)),'exactSectionOrder':ids==required,'paragraphs':len(paragraphs),'paragraphCharacters':sum(map(len,paragraphs)),'codeBlocks':len(code_blocks),'quizQuestions':len(lesson['quiz']),'quizAnswersValid':True,'truthfulnessLabelsPresent':True,'nextLesson':'d07'}
(ROOT/'validation-d06.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report,ensure_ascii=False))
