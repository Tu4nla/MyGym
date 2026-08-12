(()=>{
  const D=window.PT_DATA||{};
  const S=window.PT_SOURCE||{};
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const round05=n=>Math.round(n*2)/2;
  const mediaMap={
    chestPress:'Machine_Bench_Press',
    inclinePress:'Leverage_Incline_Chest_Press',
    latPulldownNeutral:'Close-Grip_Front_Lat_Pulldown',
    latPulldownWide:'Wide-Grip_Lat_Pulldown',
    seatedRow:'Seated_Cable_Rows',
    shoulderPress:'Machine_Shoulder_Military_Press',
    lateralRaise:'Side_Lateral_Raise',
    rearDelt:'Reverse_Machine_Flyes',
    triceps:'Triceps_Pushdown_-_Rope_Attachment',
    biceps:'Machine_Preacher_Curls',
    legPress:'Leg_Press',
    legCurl:'Lying_Leg_Curls',
    legExtension:'Leg_Extensions',
    calfRaise:'Seated_Calf_Raise',
    cableCrunch:'Cable_Crunch'
  };
  const catalog=new Map();
  const selected=new Set(S.equipment?.confirmedFromCurrentProfile||[]);

  const day=()=>{const d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
  function local(k,f=[]){try{return JSON.parse(localStorage.getItem(`mygym.v3.${k}`)||JSON.stringify(f))}catch{return f}}
  function completedSessions(){return local('sessions').filter(x=>['complete','partial_counted'].includes(String(x.status||'').replaceAll('-','_')))}
  function currentWorkoutId(){
    const entries=local('entries'),o=entries.filter(x=>x.entry_date===day()&&x.entry_type==='schedule_change').at(-1)?.payload;
    if(o?.type==='sick_or_pain'||o?.type==='skip_workout')return null;
    const dow=new Date().getDay();if(!S.trainingPolicy?.preferredStrengthWeekdays?.includes(dow))return null;
    const q=S.trainingPolicy?.sequence||['upperA','lowerA','upperB','lowerB'];return q[completedSessions().length%q.length];
  }
  function checkin(){return local('entries').filter(x=>x.entry_date===day()&&x.entry_type==='checkin'&&x.entry_key==='daily-checkin').at(-1)?.payload||null}
  function currentRecovery(){const c=checkin();if(!c)return{score:1,label:'Chưa check-in'};if(+c.soreness>=4)return{score:0,label:'Đau bất thường'};if((+c.sleepHours||0)<6&&(+c.energy||3)<=2)return{score:.85,label:'Recovery thấp'};if((+c.sleepHours||0)<6.5||(+c.energy||3)<=2||(+c.soreness||1)>=3)return{score:.93,label:'Recovery vừa'};return{score:1,label:'Recovery tốt'}}
  function rowToExercise(row){const[key,sets,reps,rir,rest]=row;return{key,sets,reps,rir,rest,...(D.exerciseLibrary?.[key]||{})}}
  function machineFor(ex){const id=(ex.equipment||[]).find(x=>selected.has(x))||(ex.equipment||[])[0];return{id,item:catalog.get(id),matched:selected.has(id)}}
  function thumbnail(item,name){if(!item)return'';if(item.image)return item.image;const q=`${item.imageQuery||item.name||name} commercial gym equipment product`;let h=0;for(const c of item.id||q)h=((h<<5)-h+c.charCodeAt(0))|0;const host=1+Math.abs(h%4);return`https://tse${host}.mm.bing.net/th?q=${encodeURIComponent(q)}&w=640&h=640&c=7&rs=1&p=0&pid=1.7&mkt=en-US&adlt=moderate`}
  function repRange(reps){const nums=String(reps||'').match(/\d+/g)?.map(Number)||[];return{min:nums[0]||8,max:nums[1]||nums[0]||12}}
  function lastExerciseSets(key){return local('sets').filter(x=>x.exercise_key===key&&x.completed&&+x.weight_kg>0&&+x.reps>0).sort((a,b)=>String(a.created_at||'').localeCompare(String(b.created_at||'')))}
  function loadAdvice(ex){
    const rows=lastExerciseSets(ex.key),last=rows.at(-1),rec=currentRecovery(),rr=repRange(ex.reps);
    if(rec.score===0)return{value:'Không gợi ý tạ',tone:'danger',reason:'Bạn đã báo đau bất thường — dừng bài gây đau và ưu tiên an toàn.'};
    if(!last)return{value:'Set dò kỹ thuật',tone:'warn',reason:`Chưa đủ lịch sử. Chọn mức làm được ${rr.min}–${rr.max} reps với RIR khoảng 3; tăng từng nấc nhỏ sau khi kỹ thuật ổn.`};
    const w=+last.weight_kg,reps=+last.reps,rir=Number.isFinite(+last.rir)?+last.rir:2;
    if(rec.score<.9){const sug=round05(w*.9);return{value:`~${sug} kg`,tone:'warn',reason:`Set gần nhất ${w} kg × ${reps}, RIR ${rir}. Recovery thấp nên giảm khoảng 10% và giữ RIR ≥2.`}}
    if(reps>=rr.max&&rir>=2){const low=round05(w*1.025),high=round05(w*1.05);return{value:`${low}–${high} kg`,tone:'good',reason:`Set gần nhất đạt đầu trên rep range (${reps} reps) còn RIR ${rir}. Có thể tăng rất nhẹ nếu máy cho phép.`}}
    if(rir<=0.5||reps<rr.min){const sug=round05(w*.95);return{value:`${sug}–${w} kg`,tone:'warn',reason:`Set gần nhất ${w} kg × ${reps}, RIR ${rir}. Chưa nên tăng; ưu tiên đủ rep range và kỹ thuật.`}}
    return{value:`${w} kg`,tone:'good',reason:`Giữ mức gần nhất: ${w} kg × ${reps}, RIR ${rir}; tăng khi chạm đầu trên rep range với RIR còn khoảng 1–2.`}
  }
  function media(key,fallback){const id=mediaMap[key];if(!id)return fallback?`<img class="v6-machine-photo" src="${fallback}" alt="Hình máy">`:'<div class="v6-motion-empty">Chưa map animation • vẫn có setup/cues trong Hướng dẫn</div>';const base=`https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${encodeURIComponent(id).replace(/%2F/g,'/')}`;return`<div class="v6-motion" title="Animation 2 bước"><img src="${base}/0.jpg" alt="Bước đầu"><img src="${base}/1.jpg" alt="Bước cuối"><span>Động tác • 2 bước</span></div>`}
  function render(){
    const host=$('workout-list');if(!host)return;let e=$('v6-exercise-guide');if(!e){e=document.createElement('section');e.id='v6-exercise-guide';host.insertAdjacentElement('beforebegin',e)}
    const wid=currentWorkoutId(),w=wid&&D.workouts?.[wid];if(!w){e.innerHTML='';return}
    e.innerHTML=`<div class="section-head"><div><p class="eyebrow">EXERCISE INTELLIGENCE</p><h2>Tên Việt • máy • động tác • mức tạ</h2></div><span class="pill">${esc(currentRecovery().label)}</span></div><div class="v6-exercise-grid">${w.exercises.map((row,i)=>{const ex=rowToExercise(row),m=machineFor(ex),img=thumbnail(m.item,ex.name),a=loadAdvice(ex);return`<article class="v6-exercise-card"><div class="v6-exercise-media">${media(ex.key,img)}</div><div class="v6-exercise-body"><p class="eyebrow">BÀI ${i+1}/${w.exercises.length}</p><h3>${esc(ex.nameVi||ex.name||ex.key)}</h3><p class="v6-en-name">${esc(ex.name||ex.key)}</p><div class="v6-ex-meta"><span>${esc(ex.sets)} × ${esc(ex.reps)}</span><span>RIR ${esc(ex.rir)}</span><span>nghỉ ${Math.round((+ex.rest||75)/6)/10} phút</span></div><div class="v6-load ${a.tone}"><small>MỨC TẠ GỢI Ý</small><strong>${esc(a.value)}</strong><p>${esc(a.reason)}</p></div><div class="v6-machine-line">${m.item?`<img src="${img}" alt="${esc(m.item.name)}"><div><small>${m.matched?'✓ Máy có ở gym':'Máy ưu tiên'}</small><b>${esc(m.item.nameVi||m.item.name)}</b><span>${esc(m.item.name)}</span></div>`:'<div><small>Thiết bị</small><b>Chưa map máy</b></div>'}</div><button class="mini-btn v6-open-guide" data-v6-guide="${esc(ex.key)}">Mở hướng dẫn + log set</button></div></article>`}).join('')}</div><p class="v6-motion-credit">Motion demo dùng 2 ảnh đầu/cuối từ free-exercise-db (public domain) và được animate như GIF. Nếu bài chưa có mapping phù hợp, app giữ ảnh máy + setup/cues thay vì hiển thị động tác sai.</p>`;
    e.querySelectorAll('[data-v6-guide]').forEach(b=>b.onclick=()=>document.querySelector(`[data-exercise="${CSS.escape(b.dataset.v6Guide)}"]`)?.click());
  }
  async function loadCatalog(){try{const cfg=await fetch('equipment-catalog.json?v=5').then(r=>r.json()),xs=await Promise.all((cfg.dataFiles||[]).map(p=>fetch(`${p}?v=5`).then(r=>r.json())));xs.flat().forEach(x=>catalog.set(x.id,x))}catch(err){console.warn('[V6 exercise catalog]',err)}}
  async function init(){await loadCatalog();render();const host=$('workout-list');if(host){let t;new MutationObserver(()=>{clearTimeout(t);t=setTimeout(render,80)}).observe(host,{childList:true})}window.addEventListener('storage',e=>{if(e.key?.startsWith('mygym.v3.'))render()});document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')render()})}
  init();
})();