(()=>{
  const D=window.PT_DATA||{};
  const S=window.PT_SOURCE||{};
  const F=window.PT_FOOD_VN||{meals:[]};
  const C=window.PT_CLOUD_CONFIG||null;
  const $=id=>document.getElementById(id);
  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const nowIso=()=>new Date().toISOString();
  const day=()=>{const d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
  const L={get:(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch{return f}},set:(k,v)=>localStorage.setItem(k,JSON.stringify(v))};
  const st={sb:null,user:null,lastMinute:-1,activeTab:'today'};
  const tabDefs=[['today','Hôm nay'],['workout','Workout'],['update','Cập nhật'],['plan','Kế hoạch'],['progress','Tiến độ'],['coach','PT']];

  function local(name){return L.get(`mygym.v3.${name}`,[])}
  function saveLocal(name,rows){L.set(`mygym.v3.${name}`,rows)}
  function minutes(t){const[a,b]=String(t).split(':').map(Number);return a*60+b}
  function currentMinutes(){const d=new Date();return d.getHours()*60+d.getMinutes()+d.getSeconds()/60}
  function humanDelta(n){n=Math.max(0,Math.round(n));if(n<60)return`${n} phút`;const h=Math.floor(n/60),m=n%60;return m?`${h}h ${m}p`:`${h}h`}
  function fmtRange(e){return e.start===e.end?e.start:`${e.start}–${e.end}`}
  function toast(t){const e=$('toast');if(!e)return;e.textContent=t;e.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(()=>e.classList.remove('show'),1800)}
  function seed(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return Math.abs(h)}

  async function auth(){if(!C||!window.supabase)return null;if(!st.sb)st.sb=window.supabase.createClient(C.url,C.publishableKey,{auth:{persistSession:true,autoRefreshToken:false,detectSessionInUrl:false}});const{data}=await st.sb.auth.getSession();st.user=data?.session?.user||null;return st.user}
  async function saveEntry(type,key,payload){
    let rows=local('entries'),i=rows.findIndex(x=>x.entry_date===day()&&x.entry_type===type&&x.entry_key===key),base=i>=0?rows[i]:{};
    const row={...base,user_id:base.user_id||st.user?.id||null,entry_date:day(),entry_type:type,entry_key:key,payload,created_at:base.created_at||nowIso(),updated_at:nowIso()};
    if(i>=0)rows[i]=row;else rows.push(row);saveLocal('entries',rows);
    const u=await auth();if(u){const{error}=await st.sb.from('pt_daily_entries').upsert({user_id:u.id,entry_date:day(),entry_type:type,entry_key:key,payload},{onConflict:'user_id,entry_date,entry_type,entry_key'});if(error)console.warn('[V9 save]',error)}
    return row;
  }

  function completedSessions(){return local('sessions').filter(x=>['complete','partial_counted'].includes(String(x.status||'').replaceAll('-','_')))}
  function nextWorkoutId(){const q=S.trainingPolicy?.sequence||['upperA','lowerA','upperB','lowerB'];return q[completedSessions().length%q.length]}
  function scheduleOverride(){return local('entries').filter(x=>x.entry_date===day()&&x.entry_type==='schedule_change').at(-1)?.payload||null}
  function strengthToday(){const o=scheduleOverride();if(o?.type==='sick_or_pain'||o?.type==='skip_workout')return false;return Boolean(S.trainingPolicy?.preferredStrengthWeekdays?.includes(new Date().getDay()))}
  function workoutTitle(){const id=nextWorkoutId();return D.workouts?.[id]?.title||'Workout'}
  function mealById(id){return(F.meals||[]).find(x=>x.id===id)}
  function menuMeal(type){
    const saved=L.get(`mygym.v6.menu.${day()}`,null),fromSaved=(saved?.ids||[]).map(mealById).find(x=>x?.type===type);if(fromSaved)return fromSaved;
    let pool=(F.meals||[]).filter(x=>x.type===type);if(type==='breakfast'){const office=pool.filter(x=>x.office===true||(x.tags||[]).includes('office-friendly'));if(office.length)pool=office}
    if(!pool.length)return null;return pool[seed(`${day()}:${type}:v9`)%pool.length];
  }

  function events(){
    const bf=menuMeal('breakfast'),ln=menuMeal('lunch'),sn=menuMeal('snack'),dn=menuMeal('dinner'),strength=strengthToday();
    return[
      {id:'water-wake',start:'07:45',end:'08:00',kind:'water',waterMl:300,title:'Uống 300ml nước',note:'Bắt đầu bù nước sau khi ngủ dậy.'},
      {id:'checkin',start:'08:00',end:'08:30',kind:'checkin',title:'Check-in 30 giây',note:'Ngủ, năng lượng và đau/mỏi để điều chỉnh ngày hôm nay.'},
      {id:'breakfast',start:'09:30',end:'10:00',kind:'meal',mealType:'breakfast',food:bf,title:`Ăn sáng${bf?`: ${bf.name}`:''}`,note:bf?`≈ ${bf.kcal} kcal • ${bf.protein}g protein`:'Ưu tiên bữa gọn, đủ protein và ít mùi ở công ty.'},
      {id:'water-1015',start:'10:15',end:'10:30',kind:'water',waterMl:300,title:'Uống 300ml nước',note:'Uống rải đều thay vì dồn nhiều vào cuối ngày.'},
      {id:'lunch',start:'11:40',end:'12:10',kind:'meal',mealType:'lunch',food:ln,title:`Ăn trưa${ln?`: ${ln.name}`:''}`,note:ln?`≈ ${ln.kcal} kcal • ${ln.protein}g protein`:'Cơm vừa + nguồn protein rõ ràng + rau.'},
      {id:'nap',start:'12:30',end:'13:00',kind:'routine',title:'Ngủ trưa 20–30 phút',note:'Không cần kéo dài hơn nếu làm bạn khó ngủ tối.'},
      {id:'water-1310',start:'13:10',end:'13:25',kind:'water',waterMl:350,title:'Uống 350ml nước',note:'Bù nước sau giờ nghỉ trưa.'},
      {id:'water-1445',start:'14:45',end:'15:00',kind:'water',waterMl:350,title:'Uống 350ml nước',note:'Giữ nhịp nước đều trong giờ làm.'},
      {id:'snack',start:'16:30',end:'17:00',kind:'meal',mealType:'snack',food:sn,title:`Bữa xế${sn?`: ${sn.name}`:''}`,note:sn?`≈ ${sn.kcal} kcal • ${sn.protein}g protein`:'Ưu tiên carb + protein để chuẩn bị cho buổi tối.'},
      {id:'water-1720',start:'17:20',end:'17:35',kind:'water',waterMl:350,title:'Uống 350ml nước',note:'Tránh tới lúc tập mới uống bù quá nhiều.'},
      {id:'water-1845',start:'18:45',end:'19:00',kind:'water',waterMl:350,title:'Uống 350ml nước',note:'Hydration trước khi về nhà / trước tập.'},
      {id:'water-1930',start:'19:30',end:'19:45',kind:'water',waterMl:300,title:'Uống 300ml nước',note:'Uống vừa phải trước khi vào gym.'},
      strength?{id:'workout',start:'20:00',end:'21:30',kind:'workout',title:`Tập ${workoutTitle()}`,note:'Bấm Bắt đầu để chuyển thẳng vào Smart Workout Player.'}:{id:'recovery',start:'20:00',end:'20:45',kind:'routine',title:'Đi bộ / recovery nhẹ 30–45 phút',note:'Không cần bù buổi strength vào ngày nghỉ.'},
      {id:'dinner',start:'21:35',end:'22:05',kind:'meal',mealType:'dinner',food:dn,title:`Ăn tối${dn?`: ${dn.name}`:''}`,note:dn?`≈ ${dn.kcal} kcal • ${dn.protein}g protein`:'Bữa vừa phải, đủ protein và không cần cắt carb.'},
      {id:'winddown',start:'23:15',end:'23:30',kind:'routine',title:'Wind-down để ngủ',note:'Giảm màn hình và ánh sáng mạnh; chuẩn bị ngủ khoảng 23:30.'}
    ];
  }

  function timelineRecord(id){return local('entries').filter(x=>x.entry_date===day()&&x.entry_type==='timeline'&&x.entry_key===`schedule:${id}`).at(-1)?.payload||null}
  function waterTotal(){return+local('entries').filter(x=>x.entry_date===day()&&x.entry_key==='water-total').at(-1)?.payload?.ml||0}
  function checkinDone(){return local('entries').some(x=>x.entry_date===day()&&x.entry_type==='checkin'&&x.entry_key==='daily-checkin')}
  function mealDone(type){return local('entries').some(x=>x.entry_date===day()&&x.entry_type==='meal'&&x.payload?.mealType===type)}
  function workoutDone(){return local('sessions').some(x=>x.workout_date===day()&&['complete','partial_counted'].includes(String(x.status||'').replaceAll('-','_')))}
  function cumulativeWater(eventId,all){let n=0;for(const e of all){if(e.kind==='water')n+=e.waterMl||0;if(e.id===eventId)break}return n}
  function eventDone(e,all){const r=timelineRecord(e.id);if(['done','skipped'].includes(r?.status))return true;if(e.kind==='checkin')return checkinDone();if(e.kind==='meal')return mealDone(e.mealType);if(e.kind==='workout')return workoutDone();if(e.kind==='water')return waterTotal()>=cumulativeWater(e.id,all);return false}
  function stateOf(e){const n=currentMinutes(),s=minutes(e.start),en=minutes(e.end);if(n>en)return{mode:'overdue',label:`Quá giờ ${humanDelta(n-en)}`};if(n>=s)return{mode:'active',label:`Đang trong khung giờ • còn ${humanDelta(en-n)}`};return{mode:'future',label:`Bắt đầu sau ${humanDelta(s-n)}`}}

  async function completeEvent(e){
    if(e.kind==='checkin'){openUpdate('checkin-form');return}
    if(e.kind==='workout'){openWorkout();return}
    if(e.kind==='meal'&&e.food){await saveEntry('meal',`v9:${e.id}`,{mealId:e.food.id,name:e.food.name,mealType:e.mealType,kcal:e.food.kcal,protein:e.food.protein,carbs:e.food.carbs,fat:e.food.fat,estimated:true,source:'v9-timeline',time:nowIso()})}
    if(e.kind==='water'){const old=waterTotal();await saveEntry('activity','water-total',{ml:old+(e.waterMl||0),source:'v9-timeline',updatedAt:nowIso()})}
    await saveEntry('timeline',`schedule:${e.id}`,{status:'done',completedAt:nowIso(),title:e.title,start:e.start,end:e.end,kind:e.kind,source:'v9'});
    toast('Đã xong ✓');renderTimeline();
  }
  async function skipEvent(e){await saveEntry('timeline',`schedule:${e.id}`,{status:'skipped',skippedAt:nowIso(),title:e.title,start:e.start,end:e.end,kind:e.kind,source:'v9'});toast('Đã bỏ qua');renderTimeline()}

  function clockTick(){const d=new Date(),hh=String(d.getHours()).padStart(2,'0'),mm=String(d.getMinutes()).padStart(2,'0'),ss=String(d.getSeconds()).padStart(2,'0');const e=$('v9-clock');if(e)e.innerHTML=`${hh}:${mm}:<span class="sec">${ss}</span>`;const minute=d.getHours()*60+d.getMinutes();if(minute!==st.lastMinute){st.lastMinute=minute;renderTimeline()}}
  function renderTimeline(){
    const root=$('v9-home');if(!root)return;const all=events(),done=all.filter(e=>eventDone(e,all)),pending=all.filter(e=>!eventDone(e,all)),primary=pending[0],date=new Intl.DateTimeFormat('vi-VN',{weekday:'long',day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date());
    root.innerHTML=`<div class="v9-clock-card"><div class="v9-clock-label"><span><i class="v9-live-dot"></i>HIỆN TẠI</span><span>${done.length}/${all.length} việc đã xong</span></div><div id="v9-clock" class="v9-clock"></div><div class="v9-date">${esc(date)}</div></div><div class="v9-queue-head"><div><p class="eyebrow">TIẾP THEO</p><h2>${pending.length?'Việc cần làm':'Hôm nay đã xong'}</h2></div><span>${pending.length?`còn ${pending.length} việc`:'✓'}</span></div>${primary?primaryCard(primary):`<div class="v9-all-done"><strong>✓ Xong hết hôm nay</strong><p>Không còn việc nào trong timeline. Ngày mai app sẽ tạo lịch mới.</p></div>`}${pending.length>1?`<div class="v9-queue-head"><div><p class="eyebrow">SAU ĐÓ</p></div></div><div class="v9-after">${pending.slice(1,5).map(afterItem).join('')}</div>`:''}<p class="v9-mini-note">Việc đã tick Done hoặc đã được nhận diện từ log sẽ tự ẩn. Sự kiện quá khung giờ mà chưa xong sẽ chuyển đỏ.</p>`;
    clockTick();bindTimeline();
  }
  function primaryCard(e){const s=stateOf(e),workout=e.kind==='workout';return`<article class="v9-next ${s.mode}"><div class="v9-next-top"><time class="v9-time">${esc(fmtRange(e))}</time><span class="v9-state">${esc(s.label)}</span></div><h3>${esc(e.title)}</h3><p>${esc(e.note||'')}</p><div class="v9-next-actions">${workout?`<button class="primary v9-start-workout" data-v9-workout>▶ Bắt đầu tập</button>`:e.kind==='checkin'?`<button class="primary v9-done-btn" data-v9-checkin>Check-in ngay</button>`:`<button class="primary v9-done-btn" data-v9-done="${esc(e.id)}">✓ Done</button>`}${s.mode==='overdue'&&!workout&&e.kind!=='checkin'?`<button class="secondary v9-skip-btn" data-v9-skip="${esc(e.id)}">Bỏ qua</button>`:''}</div></article>`}
  function afterItem(e){const s=stateOf(e);return`<div class="v9-after-item ${s.mode==='overdue'?'overdue':''}"><time>${esc(e.start)}</time><strong>${esc(e.title)}</strong><small>${esc(s.mode==='overdue'?'QUÁ GIỜ':s.mode==='active'?'ĐANG TỚI GIỜ':'SẮP TỚI')}</small></div>`}
  function bindTimeline(){const all=events();qa('[data-v9-done]').forEach(b=>b.onclick=()=>{const e=all.find(x=>x.id===b.dataset.v9Done);if(e)completeEvent(e)});qa('[data-v9-skip]').forEach(b=>b.onclick=()=>{const e=all.find(x=>x.id===b.dataset.v9Skip);if(e)skipEvent(e)});q('[data-v9-checkin]')?.addEventListener('click',()=>openUpdate('checkin-form'));q('[data-v9-workout]')?.addEventListener('click',openWorkout)}

  function ensurePanel(id){let e=$(id);if(e)return e;e=document.createElement('section');e.id=id;e.className='panel';document.querySelector('main')?.appendChild(e);return e}
  function intro(target,kicker,title,text){if(q('.v9-section-intro',target))return;const e=document.createElement('div');e.className='v9-section-intro';e.innerHTML=`<p class="eyebrow">${esc(kicker)}</p><h2>${esc(title)}</h2><p>${esc(text)}</p>`;target.prepend(e)}
  function moveWithHead(el,target){if(!el||!target)return;const prev=el.previousElementSibling;if(prev?.classList.contains('section-head'))target.appendChild(prev);target.appendChild(el)}
  function moveNode(el,target){if(el&&target)target.appendChild(el)}
  function rehomeKnown(){
    const update=$('panel-update'),plan=$('panel-plan'),coach=$('panel-coach'),today=$('panel-today');if(!update||!plan)return;
    moveNode(q('.quick-change',today),update);moveNode($('adaptation-card'),update);moveWithHead($('checkin-form'),update);moveWithHead($('today-tasks'),update);moveWithHead($('progress-form'),update);
    moveWithHead($('next-meal'),plan);moveWithHead($('equipment-status'),plan);moveNode($('v6-evening'),plan);moveNode($('v7-today'),update);moveNode($('v6-today'),coach);moveNode($('today-hero'),coach);
    const nutrition=$('panel-nutrition');if(nutrition){[...nutrition.children].forEach(x=>plan.appendChild(x));nutrition.classList.add('v9-hidden-source')}
  }
  function organize(){
    document.documentElement.classList.add('pt-v9');document.title='MyGym Personal PT v9';const eb=q('.pt-header .eyebrow');if(eb)eb.textContent='PERSONAL FITNESS OS • V9';
    const nav=q('.pt-tabs');if(nav)nav.innerHTML=tabDefs.map(([id,label])=>`<button class="tab ${id==='today'?'active':''}" data-v9-tab="${id}" type="button">${label}</button>`).join('');
    const update=ensurePanel('panel-update'),plan=ensurePanel('panel-plan');update.classList.add('v9-relocated');plan.classList.add('v9-relocated');
    intro(update,'UPDATE','Cập nhật dữ liệu','Check-in, thay đổi lịch, quick log và số đo. Đây là nơi nhập dữ liệu chi tiết khi timeline chính chưa đủ.');
    intro(plan,'REFERENCE','Kế hoạch & tham khảo','Thực đơn, mục tiêu dinh dưỡng, lịch sinh hoạt và thiết bị phòng gym. Chủ yếu để xem, không phải tab thao tác hằng ngày.');
    intro($('panel-progress'),'ANALYTICS','Tiến độ','Xu hướng cơ thể, consistency, PR, volume và các tín hiệu dài hạn.');
    intro($('panel-coach'),'COACH','PT & dữ liệu','Rule engine, manual ChatGPT bridge, cloud account và các phân tích sâu.');
    const today=$('panel-today');let home=$('v9-home');if(!home){home=document.createElement('div');home.id='v9-home';home.className='v9-home';today.prepend(home)}
    rehomeKnown();bindNav();setTab('today');renderTimeline();
    const obsToday=new MutationObserver(()=>{rehomeKnown();if(today.children[0]!==home)today.prepend(home)});obsToday.observe(today,{childList:true});
    const nutrition=$('panel-nutrition');if(nutrition)new MutationObserver(()=>rehomeKnown()).observe(nutrition,{childList:true});
    [250,900,1800].forEach(ms=>setTimeout(()=>{rehomeKnown();decorateWorkout()},ms));
  }
  function bindNav(){qa('[data-v9-tab]').forEach(b=>b.onclick=()=>setTab(b.dataset.v9Tab))}
  function setTab(name){st.activeTab=name;qa('.pt-tabs .tab').forEach(x=>x.classList.toggle('active',x.dataset.v9Tab===name));qa('main > .panel').forEach(x=>x.classList.remove('active'));const p=$(`panel-${name}`);if(p)p.classList.add('active');document.documentElement.classList.toggle('v9-tab-today',name==='today');if(name==='today')renderTimeline();if(name==='workout')setTimeout(decorateWorkout,80);window.scrollTo({top:0,behavior:'instant'})}
  function openUpdate(focusId){setTab('update');setTimeout(()=>$(focusId)?.scrollIntoView({behavior:'smooth',block:'center'}),80)}
  function openWorkout(){setTab('workout');setTimeout(()=>{const start=$('v8-start')||$('open-today-workout');start?.click()},140)}

  function findExerciseByText(text){const t=String(text||'').trim().toLowerCase();return Object.entries(D.exerciseLibrary||{}).map(([key,v])=>({key,...v})).find(x=>String(x.nameVi||'').toLowerCase()===t||String(x.name||'').toLowerCase()===t)}
  function muscleText(ex){const parts=[];if(ex?.primary)parts.push(ex.primary);if(Array.isArray(ex?.secondary))parts.push(ex.secondary.join(' • '));else if(ex?.secondary)parts.push(ex.secondary);return parts.filter(Boolean).join(' • ')}
  function decorateWorkout(){
    const head=q('#v8-content .v8-exercise-head');if(head&&!q('.v9-muscle-map',head)){const ex=findExerciseByText(q('h1',head)?.textContent)||findExerciseByText(q('.v8-en',head)?.textContent),txt=muscleText(ex);if(txt){const e=document.createElement('div');e.className='v9-muscle-map';e.innerHTML=`<b>NHÓM CƠ</b><span>${esc(txt)}</span>`;(q('.v8-en',head)||q('h1',head))?.insertAdjacentElement('afterend',e)}}
    qa('#workout-list .exercise-card').forEach(card=>{if(q('.v9-muscle-map',card))return;const ex=findExerciseByText(q('h3',card)?.textContent),txt=muscleText(ex);if(!txt)return;const e=document.createElement('div');e.className='v9-muscle-map';e.innerHTML=`<b>NHÓM CƠ</b><span>${esc(txt)}</span>`;q('h3',card)?.insertAdjacentElement('afterend',e)})
  }
  function watchWorkout(){let tm;new MutationObserver(m=>{if(!m.some(x=>x.target.closest?.('#v8-player,#workout-list')||[...x.addedNodes].some(n=>n.id==='v8-player'||n.querySelector?.('#v8-content'))))return;clearTimeout(tm);tm=setTimeout(decorateWorkout,40)}).observe(document.body,{childList:true,subtree:true})}

  function watchMirror(){window.addEventListener('storage',e=>{if(e.key?.startsWith('mygym.v3.')){if(st.activeTab==='today')renderTimeline();decorateWorkout()}});document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){if(st.activeTab==='today')renderTimeline();decorateWorkout()}})}
  async function init(){await auth();organize();watchMirror();watchWorkout();clockTick();setInterval(clockTick,1000)}
  init();
})();