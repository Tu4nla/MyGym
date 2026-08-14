(()=>{
'use strict';
const D=window.PT_DATA||{};
const S=window.PT_SOURCE||{};
const C=window.PT_CLOUD_CONFIG||null;
const root=()=>document.getElementById('v13-workout');
const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const today=()=>{const d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const local=(k,f=[])=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch{return f}};
const setLocal=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const mediaMap={chestPress:'Machine_Bench_Press',inclinePress:'Leverage_Incline_Chest_Press',latPulldownNeutral:'Close-Grip_Front_Lat_Pulldown',latPulldownWide:'Wide-Grip_Lat_Pulldown',seatedRow:'Seated_Cable_Rows',shoulderPress:'Machine_Shoulder_Military_Press',lateralRaise:'Side_Lateral_Raise',rearDelt:'Reverse_Machine_Flyes',triceps:'Triceps_Pushdown_-_Rope_Attachment',biceps:'Machine_Preacher_Curls',legPress:'Leg_Press',legCurl:'Lying_Leg_Curls',legExtension:'Leg_Extensions',calfRaise:'Seated_Calf_Raise',cableCrunch:'Cable_Crunch'};
const equipmentAliases={
  chestPress:['vertical-chest-press','converging-chest-press']
};
const state={savedMarkup:'',key:null,catalog:new Map(),catalogReady:false};

function sessions(){return local('mygym.v3.sessions',[])}
function sets(){return local('mygym.v3.sets',[])}
function entries(){return local('mygym.v3.entries',[])}
function completedSessions(){return sessions().filter(x=>['complete','partial_counted'].includes(String(x.status||'').replaceAll('-','_')))}
function workoutData(){const q=S.trainingPolicy?.sequence||['upperA','lowerA','upperB','lowerB'];const id=q[completedSessions().length%q.length];return{id,w:D.workouts?.[id]||null}}
function exerciseRow(key){return workoutData().w?.exercises?.find(x=>x[0]===key)||null}
function exFromRow(row){if(!row)return null;const[key,plannedSets,reps,rir,rest]=row;return{key,plannedSets,reps,rir,rest,...(D.exerciseLibrary?.[key]||{})}}
function selectedEquipment(){const saved=local('mygym.selectedEquipment.v2',[]);return new Set(saved.length?saved:(D.profile?.knownEquipmentFallback||[]))}
function equipmentIds(ex){return[...new Set([...(equipmentAliases[ex.key]||[]),...(ex.equipment||[])])]}
function machineFor(ex){const sel=selectedEquipment(),ids=equipmentIds(ex),id=ids.find(x=>sel.has(x))||ids[0];return{id,item:state.catalog.get(id),matched:!!id&&sel.has(id)}}
function thumbnail(item,ex){
  if(item?.image)return item.image;
  const q=`${item?.imageQuery||item?.name||ex.name||ex.key} commercial gym equipment product`;
  let h=0;
  for(const c of item?.id||q)h=((h<<5)-h+c.charCodeAt(0))|0;
  return`https://tse${1+Math.abs(h%4)}.mm.bing.net/th?q=${encodeURIComponent(q)}&w=720&h=720&c=7&rs=1&p=0&pid=1.7&mkt=en-US&adlt=moderate`
}
function media(ex,fallback){
  const id=mediaMap[ex.key];
  if(!id)return fallback?`<img class="v135-machine-hero" src="${fallback}" alt="${esc(ex.nameVi||ex.name)}">`:'';
  const base=`https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${encodeURIComponent(id).replace(/%2F/g,'/')}`;
  return`<div class="v135-motion"><img src="${base}/0.jpg" alt="Vị trí bắt đầu"><img src="${base}/1.jpg" alt="Vị trí kết thúc"><span>Động tác · đầu → cuối</span></div>`
}
function equipmentHtml(ex){
  const sel=selectedEquipment();
  const variants=equipmentIds(ex).map((id,index)=>({id,index,item:state.catalog.get(id),matched:sel.has(id)}));
  variants.sort((a,b)=>Number(b.matched)-Number(a.matched)||a.index-b.index);
  if(!variants.length)return'<p class="muted">Chưa map thiết bị cho bài này.</p>';
  return`<p class="v137-equipment-help">Các máy dưới đây đều phù hợp với bài này. Ưu tiên máy có dấu ✓; ảnh dùng để nhận diện đúng loại máy tại gym.</p><div class="v137-equipment-grid">${variants.map(v=>{
    const item=v.item;
    const nameVi=item?.nameVi||item?.name||v.id;
    const nameEn=item?.name||v.id;
    const img=thumbnail(item,ex);
    const chestVertical=ex.key==='chestPress'&&v.id==='vertical-chest-press';
    return`<article class="v137-equipment-card${v.matched?' is-matched':''}">
      <div class="v137-equipment-image"><img loading="lazy" src="${img}" alt="${esc(nameEn)}"></div>
      <div class="v137-equipment-copy">
        <div class="v137-equipment-tags">${v.matched?'<span class="v137-badge matched">✓ Có ở gym</span>':'<span class="v137-badge">Dùng được</span>'}${chestVertical?'<span class="v137-badge direct">Đúng loại trong ảnh</span>':''}</div>
        <b>${esc(nameVi)}</b>
        <small>${esc(nameEn)}</small>
      </div>
    </article>`
  }).join('')}</div>`
}
function latestCompletedSets(key){return sets().filter(x=>x.exercise_key===key&&x.completed&&Number(x.reps)>0).sort((a,b)=>String(b.updated_at||b.created_at||'').localeCompare(String(a.updated_at||a.created_at||'')))}
function checkin(){return entries().filter(x=>x.entry_date===today()&&x.entry_type==='checkin'&&x.entry_key==='daily-checkin').sort((a,b)=>String(b.updated_at||'').localeCompare(String(a.updated_at||'')))[0]?.payload||null}
function repRange(s){const n=String(s||'').match(/\d+/g)?.map(Number)||[];return{min:n[0]||8,max:n[1]||n[0]||12}}
function loadAdvice(ex){
  const prev=latestCompletedSets(ex.key)[0],c=checkin(),rr=repRange(ex.reps);
  if(Number(c?.soreness)>=4)return{tone:'warn',title:'Không gợi ý tăng tạ',text:'Bạn đã báo đau bất thường. Dừng bài gây đau và ưu tiên biên độ không đau.'};
  if(!prev)return{tone:'neutral',title:'Set dò kỹ thuật',text:`Chưa có lịch sử đủ tốt. Chọn mức làm được ${rr.min}–${rr.max} reps với RIR khoảng 2–3.`};
  const w=Number(prev.weight_kg||0),r=Number(prev.reps||0),rir=Number(prev.rir??2);
  if((Number(c?.sleepHours||8)<6.5)||(Number(c?.energy||3)<=2)||(Number(c?.soreness||1)>=3))return{tone:'warn',title:`Giữ hoặc giảm nhẹ từ ${w||'mức gần nhất'} kg`,text:`Set gần nhất ${w} kg × ${r}, RIR ${rir}. Recovery hôm nay chưa tốt; ưu tiên kỹ thuật và RIR ≥2.`};
  if(r>=rr.max&&rir>=1.5)return{tone:'good',title:`Có thể tăng nhẹ từ ${w} kg`,text:'Bạn đã chạm đầu trên rep range mà vẫn còn dự trữ. Chỉ tăng nấc nhỏ nhất của máy nếu form vẫn sạch.'};
  return{tone:'good',title:`Gợi ý giữ ${w} kg`,text:`Set gần nhất ${w} kg × ${r}, RIR ${rir}. Tăng rep sạch trước khi tăng tạ.`}
}
function activeSession(){const{id}=workoutData();return sessions().filter(x=>x.workout_date===today()&&x.workout_id===id&&String(x.status||'').replaceAll('-','_')==='in_progress').sort((a,b)=>String(b.updated_at||b.created_at||'').localeCompare(String(a.updated_at||a.created_at||'')))[0]||null}
function formatTime(x){const d=new Date(x);return Number.isNaN(d.getTime())?'—':d.toLocaleString('vi-VN',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}
function historyHtml(ex){const rows=latestCompletedSets(ex.key).slice(0,6);if(!rows.length)return'<p class="muted">Chưa có set đã hoàn thành.</p>';return`<div class="v135-history">${rows.map(x=>`<div><span>${esc(formatTime(x.updated_at||x.created_at))}</span><b>${x.weight_kg??'—'} kg × ${x.reps??'—'}</b><small>RIR ${x.rir??'—'}</small></div>`).join('')}</div>`}
function logHtml(ex){
  const s=activeSession();
  if(!s?.id)return`<div class="v135-log-locked"><b>Chưa bắt đầu workout</b><p>Quay lại danh sách và bấm <b>Bắt đầu</b>. Sau đó mở bài này lại để log từng set.</p></div>`;
  const prev=latestCompletedSets(ex.key)[0],defaultWeight=prev?.weight_kg??'';
  return`<div class="v135-set-table">${Array.from({length:Number(ex.plannedSets)||3},(_,i)=>`<div class="v135-set-row" data-set-row="${i}"><b>Set ${i+1}</b><label>kg<input data-field="weight" inputmode="decimal" type="number" step="0.5" min="0" value="${esc(defaultWeight)}"></label><label>reps<input data-field="reps" inputmode="numeric" type="number" min="0" placeholder="${esc(ex.reps)}"></label><label>RIR<input data-field="rir" inputmode="decimal" type="number" step="0.5" min="0" max="6" placeholder="${esc(ex.rir)}"></label></div>`).join('')}</div><label class="v135-note">Ghi chú bài<input id="v135-ex-note" type="text" placeholder="Ví dụ: ghế nấc 4, vai trái hơi căng"></label><button class="primary wide" data-v135-action="save-sets" type="button">Lưu các set đã nhập</button>`
}
function listItems(xs){return Array.isArray(xs)&&xs.length?`<ul>${xs.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:'<p class="muted">Chưa có dữ liệu.</p>'}
function renderDetail(key){
  const row=exerciseRow(key),ex=exFromRow(row),r=root();
  if(!r||!ex)return;
  state.key=key;
  if(!state.savedMarkup)state.savedMarkup=r.innerHTML;
  const m=machineFor(ex),img=thumbnail(m.item,ex),a=loadAdvice(ex);
  r.innerHTML=`<div class="v135-detail">
    <button class="v135-back" data-v135-action="back" type="button">← Workout</button>
    <div class="v135-hero">${media(ex,img)}<div><div class="eyebrow">CHI TIẾT BÀI TẬP</div><h2>${esc(ex.nameVi||ex.name||ex.key)}</h2><p class="en">${esc(ex.name||ex.key)}</p><p class="muscle">${esc(ex.primary||'—')}</p><div class="target-row"><span>${esc(ex.plannedSets)} sets</span><span>${esc(ex.reps)} reps</span><span>RIR ${esc(ex.rir)}</span><span>nghỉ ${Math.round(Number(ex.rest||75)/6)/10}p</span></div></div></div>
    <div class="v135-advice ${a.tone}"><small>MỨC TẠ / PROGRESSION</small><b>${esc(a.title)}</b><p>${esc(a.text)}</p></div>
    <section class="v135-section"><h3>Máy phù hợp</h3>${equipmentHtml(ex)}</section>
    <section class="v135-section"><h3>Setup</h3>${listItems(ex.setup)}</section>
    <section class="v135-section"><h3>Cues khi thực hiện</h3>${listItems(ex.cues)}</section>
    <section class="v135-section v135-two"><div><h3>Tempo</h3><p>${esc(ex.tempo||'—')}</p></div><div><h3>Hít thở</h3><p>${esc(ex.breathing||'—')}</p></div></section>
    <section class="v135-section"><h3>Tránh</h3>${listItems(ex.avoid)}</section>
    <section class="v135-section"><h3>Lịch sử gần nhất</h3>${historyHtml(ex)}</section>
    <section class="v135-section"><h3>Log hôm nay · ${esc(ex.plannedSets)} × ${esc(ex.reps)}</h3>${logHtml(ex)}</section>
  </div>`;
  r.scrollIntoView({behavior:'auto',block:'start'})
}
function restore(){const r=root();if(!r)return;if(state.savedMarkup)r.innerHTML=state.savedMarkup;state.savedMarkup='';state.key=null;decorate()}
function decorate(){const r=root();if(!r||r.querySelector('.v135-detail'))return;const cards=[...r.querySelectorAll('.exercise-card')];const w=workoutData().w;if(!w)return;cards.forEach((card,i)=>{const key=w.exercises?.[i]?.[0];if(!key)return;card.dataset.v135Exercise=key;card.classList.add('v135-clickable');card.setAttribute('role','button');card.setAttribute('tabindex','0');card.setAttribute('aria-label',`Xem chi tiết ${D.exerciseLibrary?.[key]?.nameVi||D.exerciseLibrary?.[key]?.name||key}`)})}
async function saveSets(){
  const key=state.key,row=exerciseRow(key),ex=exFromRow(row),s=activeSession();
  if(!key||!ex||!s?.id)return;
  const client=window.PT_SUPABASE_CLIENT||(C&&window.supabase?.createClient?window.supabase.createClient(C.url,C.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null);
  if(!client)return;
  const{data:{session}}=await client.auth.getSession();
  if(!session?.user)return;
  const note=document.getElementById('v135-ex-note')?.value?.trim()||null;
  const order=workoutData().w.exercises.findIndex(x=>x[0]===key);
  const inputRows=[...document.querySelectorAll('.v135-set-row')].map((el,i)=>{
    const weight=Number(el.querySelector('[data-field="weight"]')?.value||0),reps=Number(el.querySelector('[data-field="reps"]')?.value||0),rirRaw=el.querySelector('[data-field="rir"]')?.value;
    return{user_id:session.user.id,session_id:s.id,exercise_key:key,exercise_order:Math.max(0,order),set_index:i,target_reps:String(ex.reps||''),weight_kg:weight||null,reps:reps||null,rir:rirRaw===''?null:Number(rirRaw),completed:reps>0,note,client_key:`set:${s.id}:${key}:${i}`,updated_at:new Date().toISOString()}
  }).filter(x=>x.completed||x.weight_kg);
  if(!inputRows.length){alert('Hãy nhập ít nhất reps hoặc mức tạ cho một set.');return}
  const btn=document.querySelector('[data-v135-action="save-sets"]');
  if(btn){btn.disabled=true;btn.textContent='Đang lưu…'}
  const{data,error}=await client.from('pt_exercise_sets').upsert(inputRows,{onConflict:'session_id,exercise_key,set_index'}).select();
  if(error){if(btn){btn.disabled=false;btn.textContent='Lưu các set đã nhập'}alert(`Không lưu được set: ${error.message}`);return}
  let all=sets();
  for(const x of data||[]){const i=all.findIndex(y=>y.id===x.id||(y.session_id===x.session_id&&y.exercise_key===x.exercise_key&&y.set_index===x.set_index));if(i>=0)all[i]=x;else all.push(x)}
  setLocal('mygym.v3.sets',all);
  renderDetail(key)
}
async function loadCatalog(){
  try{
    const cfg=await fetch('equipment-catalog.json?v=6').then(r=>r.json());
    const xs=await Promise.all((cfg.dataFiles||[]).map(p=>fetch(`${p}?v=6`).then(r=>r.json())));
    xs.flat().forEach(x=>state.catalog.set(x.id,x));
    state.catalogReady=true;
    if(state.key)renderDetail(state.key)
  }catch(e){console.warn('[V13.7 exercise catalog]',e)}
}
document.addEventListener('click',e=>{
  const own=e.target.closest('[data-v135-action]');
  if(own){
    e.preventDefault();e.stopPropagation();
    if(own.dataset.v135Action==='back')return restore();
    if(own.dataset.v135Action==='save-sets')return saveSets();
    return
  }
  const card=e.target.closest('.exercise-card[data-v135-exercise]');
  if(card){e.preventDefault();renderDetail(card.dataset.v135Exercise)}
},true);
document.addEventListener('keydown',e=>{const card=e.target.closest?.('.exercise-card[data-v135-exercise]');if(card&&(e.key==='Enter'||e.key===' ')){e.preventDefault();renderDetail(card.dataset.v135Exercise)}});
const observer=new MutationObserver(()=>requestAnimationFrame(decorate));
function boot(){const r=root();if(!r)return;observer.observe(r,{childList:true,subtree:true});decorate();loadCatalog()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();