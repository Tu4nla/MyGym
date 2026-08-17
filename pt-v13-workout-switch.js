(()=>{
'use strict';
const S=window.PT_SOURCE||{};
const D=window.PT_DATA||{};
if(!S.trainingPolicy)return;
const KEY_PREFIX='mygym.v138.workoutOverride.';
const BASE_KEY='__MYGYM_BASE_WORKOUT_SEQUENCE__';
const base=(window[BASE_KEY]||[...(S.trainingPolicy.sequence||['upperA','lowerA','upperB','lowerB'])]);
window[BASE_KEY]=[...base];
const today=()=>{const d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const read=(k,f)=>{try{const v=localStorage.getItem(k);return v==null?f:JSON.parse(v)}catch{return f}};
const sessions=()=>read('mygym.v3.sessions',[]);
const completed=()=>sessions().filter(x=>['complete','partial_counted'].includes(String(x.status||'').replaceAll('-','_')));
const defaultId=()=>base[completed().length%base.length];
const overrideKey=()=>`${KEY_PREFIX}${today()}`;
const getOverride=()=>read(overrideKey(),null);
const isCompletedToday=id=>sessions().some(x=>x.workout_date===today()&&x.workout_id===id&&['complete','partial_counted'].includes(String(x.status||'').replaceAll('-','_')));
function selectedId(){const o=getOverride();return base.includes(o)?o:defaultId()}
function apply(){
  let o=getOverride();
  if(o&&isCompletedToday(o)){localStorage.removeItem(overrideKey());o=null}
  const selected=o&&base.includes(o)?o:null;
  const idx=completed().length%base.length;
  const effective=[...base];
  if(selected){const j=effective.indexOf(selected);if(j>=0&&j!==idx)[effective[idx],effective[j]]=[effective[j],effective[idx]]}
  S.trainingPolicy.sequence=effective;
  window.PT_WORKOUT_SWITCH={base:[...base],selectedId:()=>selectedId(),defaultId:()=>defaultId(),clear:()=>{localStorage.removeItem(overrideKey());apply();rerenderWorkout()},select:id=>select(id)};
}
function label(id){return D.workouts?.[id]?.title||({upperA:'Upper A',lowerA:'Lower A',upperB:'Upper B',lowerB:'Lower B'})[id]||id}
function hasInProgressOther(id){return sessions().find(x=>x.workout_date===today()&&String(x.status||'').replaceAll('-','_')==='in_progress'&&x.workout_id!==id)}
function select(id){
  if(!base.includes(id))return;
  const active=hasInProgressOther(id);
  if(active&&!window.confirm(`Bạn đang có buổi ${label(active.workout_id)} đang tập. Vẫn chuyển sang ${label(id)}?`))return;
  if(id===defaultId())localStorage.removeItem(overrideKey());else localStorage.setItem(overrideKey(),JSON.stringify(id));
  apply();rerenderWorkout();
}
function rerenderWorkout(){
  const tab=document.querySelector('[data-tab="workout"]');
  if(tab){tab.click();setTimeout(inject,0)}
}
function inject(){
  const root=document.getElementById('v13-workout');
  if(!root||root.querySelector('#v138-workout-switch')||root.querySelector('.v135-detail'))return;
  const selected=selectedId(),def=defaultId(),isOverride=selected!==def;
  const box=document.createElement('section');
  box.id='v138-workout-switch';
  box.className='v138-switch';
  box.innerHTML=`<div class="v138-switch-head"><div><div class="eyebrow">ĐỔI BUỔI HÔM NAY</div><h3>${isOverride?'Đang override':'Theo rolling plan'} · ${label(selected)}</h3><p>${isOverride?'Chỉ thay buổi hiện tại; hoàn thành xong sẽ tự trở lại rolling plan.':'Bạn có thể chọn buổi khác nếu lịch hôm nay cần đổi.'}</p></div>${isOverride?'<span class="pill warn">OVERRIDE</span>':''}</div><div class="v138-switch-grid">${base.map(id=>`<button type="button" class="${id===selected?'primary':'secondary'}" data-v138-workout="${id}">${label(id)}</button>`).join('')}<button type="button" class="secondary v138-reset" data-v138-reset ${isOverride?'':'disabled'}>Theo kế hoạch</button></div>`;
  root.prepend(box);
}
apply();
document.addEventListener('click',e=>{
  const choose=e.target.closest?.('[data-v138-workout]');
  if(choose){e.preventDefault();e.stopPropagation();select(choose.dataset.v138Workout);return}
  const reset=e.target.closest?.('[data-v138-reset]');
  if(reset){e.preventDefault();e.stopPropagation();localStorage.removeItem(overrideKey());apply();rerenderWorkout();return}
  if(e.target.closest?.('[data-tab="workout"],[data-action="start-workout"]'))setTimeout(inject,0);
},true);
window.addEventListener('hashchange',()=>{if(location.hash==='#workout')setTimeout(inject,0)});
window.addEventListener('storage',e=>{if(e.key===overrideKey()){apply();if(location.hash==='#workout')rerenderWorkout()}});
function boot(){if(location.hash==='#workout')setTimeout(()=>{rerenderWorkout();inject()},0)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
