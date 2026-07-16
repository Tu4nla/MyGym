const $ = (selector) => document.querySelector(selector);
const catalogEl = $('#catalog');
const contentEl = $('#content');
const tocEl = $('#lesson-toc');
const sidebar = $('#sidebar');
const STORAGE_KEY = 'android-learning-progress-v1';
const THEME_KEY = 'android-learning-theme';
let catalog;
let lessonIndex = new Map();

const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const progress = loadProgress();

function loadProgress(){
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {completedLessons:[],lessons:{},lastLessonId:null}; }
  catch { return {completedLessons:[],lessons:{},lastLessonId:null}; }
}
function saveProgress(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); updateProgressUI(); }
function isDone(id){ return progress.completedLessons.includes(id); }
function setDone(id, done){
  progress.completedLessons = done ? [...new Set([...progress.completedLessons,id])] : progress.completedLessons.filter(x=>x!==id);
  progress.lessons[id] = {...(progress.lessons[id]||{}), completed:done, completedAt:done?new Date().toISOString():null};
  saveProgress(); renderCatalog($('#search-input').value); route();
}

async function init(){
  applyTheme(localStorage.getItem(THEME_KEY) || 'dark');
  const response = await fetch('data/catalog.json');
  if(!response.ok) throw new Error('Không tải được mục lục');
  catalog = await response.json();
  catalog.chapters.forEach(ch=>ch.lessons.forEach(l=>lessonIndex.set(l.id,{...l,chapter:ch})));
  renderCatalog(); updateProgressUI(); bindUI(); route();
}

function bindUI(){
  window.addEventListener('hashchange', route);
  $('#menu-button').onclick=()=>sidebar.classList.add('open');
  $('#close-menu-button').onclick=()=>sidebar.classList.remove('open');
  $('#theme-button').onclick=()=>applyTheme(document.documentElement.classList.contains('light')?'dark':'light');
  $('#search-input').addEventListener('input',e=>renderCatalog(e.target.value));
}
function applyTheme(theme){ document.documentElement.classList.toggle('light',theme==='light'); localStorage.setItem(THEME_KEY,theme); }
function allLessons(){ return catalog.chapters.flatMap(c=>c.lessons); }
function publishedLessons(){ return allLessons().filter(l=>l.status==='published'); }
function updateProgressUI(){
  if(!catalog) return;
  const total=allLessons().length, done=progress.completedLessons.length, percent=total?Math.round(done/total*100):0;
  $('#progress-count').textContent=`${done}/${total}`;
  $('#progress-label').textContent=`${percent}%`;
  $('#progress-bar').style.width=`${percent}%`;
}
function renderCatalog(query=''){
  const q=query.trim().toLowerCase();
  catalogEl.innerHTML=catalog.chapters.map(ch=>{
    const lessons=ch.lessons.filter(l=>!q || `${l.code} ${l.title}`.toLowerCase().includes(q));
    if(!lessons.length) return '';
    return `<section class="chapter"><div class="chapter-title">${ch.code} — ${escapeHtml(ch.title)}</div>${lessons.map(l=>{
      const done=isDone(l.id), planned=l.status!=='published';
      return `<a class="lesson-link ${done?'done':''} ${location.hash.includes(l.id)?'active':''}" href="${planned?'javascript:void(0)':`#/lesson/${l.id}`}" ${planned?'title="Bài đang được biên soạn"':''}>
        <span class="lesson-state">${done?'✓':planned?'·':'○'}</span><span><span class="lesson-code">${l.code}${planned?' · sắp có':''}</span><span class="lesson-name">${escapeHtml(l.title)}</span></span></a>`;
    }).join('')}</section>`;
  }).join('');
}

async function route(){
  sidebar.classList.remove('open');
  const match=location.hash.match(/^#\/lesson\/([^/]+)/);
  if(match) return showLesson(match[1]);
  showHome();
}
function showHome(){
  progress.lastLessonId && lessonIndex.has(progress.lastLessonId);
  const next=publishedLessons().find(l=>!isDone(l.id)) || publishedLessons()[0];
  contentEl.innerHTML=`<article class="hero-card"><span class="eyebrow">LỘ TRÌNH ANDROID MIDDLE</span><h1>${escapeHtml(catalog.course.title)}</h1><p>${escapeHtml(catalog.course.description)}</p><div class="meta"><span>${allLessons().length} bài trong lộ trình</span><span>${publishedLessons().length} bài đã xuất bản</span></div><div class="lesson-actions">${next?`<a class="button primary" href="#/lesson/${next.id}">Tiếp tục với ${next.code}</a>`:''}</div></article>
  <section class="lesson-section"><h2>Cách học</h2><div class="callout purpose"><div class="callout-title">Cấu trúc cố định</div>Mỗi bài gồm lý thuyết, mục đích, dấu hiệu cần dùng, yêu cầu sản phẩm, phân tích quyết định, ví dụ Upzi, trade-off, edge case, câu hỏi phỏng vấn, quiz và bài tập.</div></section>`;
  tocEl.innerHTML=''; contentEl.focus(); renderCatalog($('#search-input').value);
}

async function showLesson(id){
  const meta=lessonIndex.get(id);
  if(!meta || meta.status!=='published'){ contentEl.innerHTML='<div class="error-state">Bài học chưa được xuất bản.</div>'; return; }
  contentEl.innerHTML='<div class="loading">Đang tải bài học…</div>';
  try{
    const res=await fetch(meta.path); if(!res.ok) throw new Error('Không tải được bài học');
    const lesson=await res.json(); progress.lastLessonId=id; saveProgress();
    contentEl.innerHTML=renderLesson(lesson); renderLessonToc(lesson); bindLessonEvents(lesson); contentEl.focus(); window.scrollTo(0,0); renderCatalog($('#search-input').value);
  }catch(error){ contentEl.innerHTML=`<div class="error-state">${escapeHtml(error.message)}</div>`; }
}
function renderLesson(lesson){
  const blocks=lesson.sections.map(section=>`<section id="${section.id}" class="lesson-section"><h2>${escapeHtml(section.title)}</h2>${section.blocks.map(renderBlock).join('')}</section>`).join('');
  const quiz=lesson.quiz?.length?renderQuiz(lesson):'';
  return `<article><header class="hero-card"><span class="eyebrow">${lesson.code}</span><h1>${escapeHtml(lesson.title)}</h1><p>${escapeHtml(lesson.summary)}</p><div class="meta"><span>⏱ ${lesson.estimatedMinutes} phút</span><span>🧠 ${lesson.quiz?.length||0} câu quiz</span><span>${isDone(lesson.id)?'✓ Đã hoàn thành':'○ Đang học'}</span></div></header>${blocks}${quiz}<div class="done-banner"><div><strong>${isDone(lesson.id)?'Bạn đã hoàn thành bài này':'Hoàn tất việc đọc?'}</strong><div>${isDone(lesson.id)?'Bạn có thể bỏ đánh dấu để học lại.':'Đánh dấu hoàn thành để cập nhật tiến độ.'}</div></div><button id="done-button" class="button ${isDone(lesson.id)?'secondary':'primary'}">${isDone(lesson.id)?'Bỏ đánh dấu':'Mark as Done'}</button></div></article>`;
}
function renderBlock(block){
  switch(block.type){
    case 'paragraph': return `<p>${block.html||escapeHtml(block.content)}</p>`;
    case 'heading': return `<h3>${escapeHtml(block.content)}</h3>`;
    case 'list': return `<${block.ordered?'ol':'ul'}>${block.items.map(i=>`<li>${i}</li>`).join('')}</${block.ordered?'ol':'ul'}>`;
    case 'code': return `<div class="code-wrap"><div class="code-head"><span>${escapeHtml(block.language||'text')}${block.label?` · ${escapeHtml(block.label)}`:''}</span><button class="copy-button" data-copy="${encodeURIComponent(block.content)}">Copy</button></div><pre><code>${escapeHtml(block.content)}</code></pre></div>`;
    case 'callout': return `<div class="callout ${block.variant||''}"><div class="callout-title">${escapeHtml(block.title||block.variant||'Ghi chú')}</div>${block.html||escapeHtml(block.content)}</div>`;
    case 'table': return `<table class="data-table"><thead><tr>${block.headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${block.rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    default:return '';
  }
}
function renderLessonToc(lesson){ tocEl.innerHTML=`<h3>Trong bài này</h3>${lesson.sections.map(s=>`<a href="#${s.id}">${escapeHtml(s.title)}</a>`).join('')} ${lesson.quiz?.length?'<a href="#quiz">Quiz cuối bài</a>':''}`; }

function normalizeQuizQuestion(q){
  const options=(q.options||[]).map((option,index)=>typeof option==='string'?{id:String(index),text:option}:{id:String(option.id??index),text:option.text??String(option)});
  let correctOptionIds=[];
  if(Array.isArray(q.correctOptionIds)) correctOptionIds=q.correctOptionIds.map(String);
  else if(Array.isArray(q.answerIndexes)) correctOptionIds=q.answerIndexes.map(String);
  else if(Number.isInteger(q.answerIndex)) correctOptionIds=[String(q.answerIndex)];
  return {...q,options,correctOptionIds,type:q.type==='multiple'||correctOptionIds.length>1?'multiple':'single'};
}
function normalizedQuiz(lesson){ return (lesson.quiz||[]).map(normalizeQuizQuestion); }
function renderQuiz(lesson){
  const quiz=normalizedQuiz(lesson);
  return `<section id="quiz" class="lesson-section"><h2>Quiz cuối bài</h2><p>Chọn đáp án rồi nhấn “Chấm điểm”. Mỗi câu đều có giải thích.</p><form id="quiz-form">${quiz.map((q,index)=>`<div class="quiz-card" data-question="${q.id}"><strong>${index+1}. ${escapeHtml(q.question)}</strong>${q.options.map(o=>`<label class="quiz-option"><input type="${q.type==='multiple'?'checkbox':'radio'}" name="${q.id}" value="${escapeHtml(o.id)}"> ${escapeHtml(o.text)}</label>`).join('')}<div class="quiz-result" id="result-${q.id}"></div></div>`).join('')}<div class="quiz-actions"><button type="submit" class="button primary">Chấm điểm</button><button type="reset" class="button secondary">Làm lại</button></div><div id="quiz-summary" class="callout purpose" hidden></div></form></section>`;
}
function bindLessonEvents(lesson){
  document.querySelectorAll('[data-copy]').forEach(btn=>btn.onclick=async()=>{ await navigator.clipboard.writeText(decodeURIComponent(btn.dataset.copy)); const old=btn.textContent; btn.textContent='Đã copy'; setTimeout(()=>btn.textContent=old,1200); });
  $('#done-button').onclick=()=>setDone(lesson.id,!isDone(lesson.id));
  const form=$('#quiz-form'); if(form){ form.addEventListener('submit',e=>{e.preventDefault();gradeQuiz(lesson);}); form.addEventListener('reset',()=>setTimeout(()=>{normalizedQuiz(lesson).forEach(q=>$('#result-'+q.id).textContent='');$('#quiz-summary').hidden=true;},0)); }
}
function gradeQuiz(lesson){
  const quiz=normalizedQuiz(lesson);
  let score=0;
  quiz.forEach(q=>{
    const selected=[...document.querySelectorAll(`input[name="${q.id}"]:checked`)].map(i=>i.value).sort();
    const expected=[...q.correctOptionIds].sort();
    const correct=JSON.stringify(selected)===JSON.stringify(expected); if(correct)score++;
    const result=$('#result-'+q.id); result.textContent=`${correct?'✓ Đúng':'✗ Chưa đúng'} — ${q.explanation}`; result.style.color=correct?'var(--accent2)':'var(--danger)';
  });
  const percent=Math.round(score/quiz.length*100); const previous=progress.lessons[lesson.id]?.bestQuizScore||0;
  progress.lessons[lesson.id]={...(progress.lessons[lesson.id]||{}),bestQuizScore:Math.max(previous,percent),quizAttempts:(progress.lessons[lesson.id]?.quizAttempts||0)+1}; saveProgress();
  const summary=$('#quiz-summary'); summary.hidden=false; summary.innerHTML=`<div class="callout-title">Kết quả</div>Bạn đúng <strong>${score}/${quiz.length}</strong> câu (${percent}%). Điểm cao nhất: ${Math.max(previous,percent)}%.`;
  summary.scrollIntoView({behavior:'smooth',block:'center'});
}

init().catch(error=>contentEl.innerHTML=`<div class="error-state">${escapeHtml(error.message)}</div>`);