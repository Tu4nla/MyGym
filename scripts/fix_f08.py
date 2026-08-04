import json
from pathlib import Path
ROOT=Path('android-learning/data')
cat=json.loads((ROOT/'catalog.json').read_text())
for ch in cat['chapters']:
    if ch.get('id')=='f':
        for x in ch['lessons']:
            if x['id']=='f08':
                x['status']='published'; x['estimatedMinutes']=360
(ROOT/'catalog.json').write_text(json.dumps(cat,ensure_ascii=False,indent=2)+'\n')
plan=json.loads((ROOT/'book-plan.json').read_text())
if 'f08' not in plan['completed']: plan['completed'].append('f08')
plan['current']='f09'
(ROOT/'book-plan.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2)+'\n')
lesson=json.loads((ROOT/'lessons/f/f08.json').read_text())
idx=json.loads((ROOT/'search-index.json').read_text())
entry={
 'lessonId':'f08','code':'F08','title':'Single Source of Truth',
 'keywords':['single source of truth','SSOT','Room','offline-first','outbox','consistency','socket merge','optimistic update','tombstone','source of truth'],
 'headings':[s['title'] for s in lesson['sections']]
}
idx=[x for x in idx if x.get('lessonId')!='f08']+[entry]
(ROOT/'search-index.json').write_text(json.dumps(idx,ensure_ascii=False,indent=2)+'\n')
canon=['objectives','prerequisites','terminology','mechanism','purpose','problem','when-to-use','when-not-to-use','requirement','analysis','minimal-code','upzi-case','alternatives','tradeoffs','edge-cases','mistakes','interview-basic','interview-deep','experience-answer','practice','scenario','checklist','summary','quiz-guide']
secs=lesson['sections']
paras=[b['content'] for s in secs for b in s['blocks'] if b['type']=='paragraph']
quiz=next(b for s in secs if s['id']=='quiz-guide' for b in s['blocks'] if b['type']=='quiz')['questions']
val={
 'id':'f08','sections':len(secs),'uniqueSectionIds':len(set(s['id'] for s in secs)),
 'exactSectionOrder':[s['id'] for s in secs]==canon,'paragraphs':len(paras),
 'paragraphCharacters':sum(len(x) for x in paras),
 'codeBlocks':sum(b['type']=='code' for s in secs for b in s['blocks']),
 'quizQuestions':len(quiz),
 'quizAnswersValid':all(0<=q['answerIndex']<len(q['options']) and q.get('explanation') for q in quiz),
 'truthfulnessLabelsPresent':all(k in ' '.join(paras) for k in ['confirmed:','inferred:','proposed:','needs-confirmation:']),
 'nextLesson':'f09'
}
(ROOT/'validation-f08.json').write_text(json.dumps(val,ensure_ascii=False,indent=2)+'\n')
print(val)
