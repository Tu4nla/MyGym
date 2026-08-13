(()=>{
  const C=window.PT_CLOUD_CONFIG||null;if(!C)return;
  const $=id=>document.getElementById(id),q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const L={get:(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch{return f}},set:(k,v)=>localStorage.setItem(k,JSON.stringify(v))};
  const st={sb:null,user:null,mode:null,targetDate:null,weekStart:null,draft:null,rendering:false,lastMinute:-1,rootObserver:null};
  const categories={work:'Bận công việc',social:'Đi chơi / hẹn',social_drinking:'Nhậu / tiệc',travel:'Di chuyển / về quê',health:'Không khỏe',other:'Khác'};
  const blocks={morning:'Buổi sáng',noon:'Buổi trưa',afternoon:'Buổi chiều',evening:'Buổi tối',all_day:'Cả ngày'};
  const workoutLabels={normal:'Tập bình thường',earlier:'Tập sớm hơn',later:'Tập muộn hơn',short:'Chỉ 30–45 phút',skip:'Không tập',unknown:'Chưa biết'};
  const mealLabels={none:'Không bữa nào',breakfast:'Bữa sáng',lunch:'Bữa trưa',snack:'Bữa xế',dinner:'Bữa tối',multiple:'Nhiều bữa'};

  function entries(){return L.get('mygym.v3.entries',[])}
  function setEntries(v){L.set('mygym.v3.entries',v)}
  function dateKey(d=new Date()){return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
  function parseDate(s){const[a,b,c]=s.split('-').map(Number);return new Date(a,b-1,c,12)}
  function addDays(s,n){const d=parseDate(s);d.setDate(d.getDate()+n);return dateKey(d)}
  function today(){return dateKey()}
  function tomorrow(){return addDays(today(),1)}
  function nowMin(){const d=new Date();return d.getHours()*60+d.getMinutes()+d.getSeconds()/60}
  function isoFor(date,h,m=0){const d=parseDate(date);d.setHours(h,m,0,0);return d.toISOString()}
  function hmToMin(v){const x=/^(\d{1,2}):(\d{2})$/.exec(String(v||'').trim());if(!x)return null;const h=+x[1],m=+x[2];return h<=23&&m<=59?h*60+m:null}
  function minToHm(n){return`${String(Math.floor(n/60)%24).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`}
  function mondayOf(s){const d=parseDate(s),w=d.getDay()||7;d.setDate(d.getDate()-w+1);return dateKey(d)}
  function nextMonday(){const d=new Date(),w=d.getDay()||7;d.setDate(d.getDate()+8-w);return dateKey(d)}
  function pretty(s){return new Intl.DateTimeFormat('vi-VN',{weekday:'long',day:'2-digit',month:'2-digit'}).format(parseDate(s))}
  function toast(t){const e=$('toast');if(!e)return;e.textContent=t;e.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(()=>e.classList.remove('show'),1900)}
  async function auth(){if(!window.supabase)return null;if(!st.sb)st.sb=window.supabase.createClient(C.url,C.publishableKey,{auth:{persistSession:true,autoRefreshToken:false,detectSessionInUrl:false}});const{data}=await st.sb.auth.getSession();st.user=data?.session?.user||null;return st.user}

  function latest(date,type,key){return entries().filter(x=>x.entry_date===date&&x.entry_type===type&&(!key||x.entry_key===key)).sort((a,b)=>String(a.updated_at||a.created_at||'').localeCompare(String(b.updated_at||b.created_at||''))).at(-1)||null}
  function checkinDone(date=today()){return entries().some(x=>x.entry_date===date&&x.entry_type==='checkin'&&x.entry_key==='daily-checkin')}
  function dailyPlan(date){return latest(date,'planning','daily-plan')?.payload||null}
  function weeklyPlan(start){return latest(start,'planning',`week-plan:${start}`)?.payload||null}
  function weeklyException(date){return(weeklyPlan(mondayOf(date))?.exceptions||[]).find(x=>x.date===date)||null}
  function scheduleContext(date){return latest(date,'schedule_change')?.payload||null}

  async function saveEntry(date,type,key,payload){
    let rows=entries(),i=rows.findIndex(x=>x.entry_date===date&&x.entry_type===type&&x.entry_key===key),base=i>=0?rows[i]:{},now=new Date().toISOString();
    const row={...base,user_id:base.user_id||st.user?.id||null,entry_date:date,entry_type:type,entry_key:key,payload,created_at:base.created_at||now,updated_at:now};
    if(i>=0)rows[i]=row;else rows.push(row);setEntries(rows);
    const u=await auth();if(u){const{error}=await st.sb.from('pt_daily_entries').upsert({user_id:u.id,entry_date:date,entry_type:type,entry_key:key,payload},{onConflict:'user_id,entry_date,entry_type,entry_key'});if(error)console.warn('[V12 planning save]',error)}
    return row;
  }
  async function saveDraft(){if(!st.draft)return;const key=st.mode==='weekly'?`week-plan:${st.weekStart}`:'daily-plan',date=st.mode==='weekly'?st.weekStart:st.targetDate;await saveEntry(date,'planning',key,{...st.draft,status:'in_progress',updatedAt:new Date().toISOString(),source:'v12-planning-v2'})}

  function planType(p){if(p.workoutChoice==='skip')return'skip_workout';if(p.category==='health')return'sick_or_pain';if(p.special)return'schedule_shift';return'normal_plan'}
  async function applyDailyPlan(p){
    const date=p.targetDate,type=planType(p),now=new Date().toISOString();
    await saveEntry(date,'schedule_change','planning-schedule',{type,reason:p.category||'normal',source:'v12-planning-v2',planning:true,timeBlock:p.timeBlock||null,workoutChoice:p.workoutChoice||'normal',workoutStart:p.workoutStart||null,workoutBudget:p.workoutChoice==='short'?45:null,mealImpact:p.mealImpact||'none',sleepTime:p.sleepTime||'23:30',updatedAt:now});
    if(p.workoutChoice==='skip'){
      await saveEntry(date,'assistant_task','v10:workout',{status:'skipped',skippedAt:now,reason:'planned_unavailable',source:'v12-planning-v2'});
      await saveEntry(date,'assistant_task','v10:recovery',{status:'skipped',skippedAt:now,reason:'planned_unavailable',source:'v12-planning-v2'});
    }else{
      await saveEntry(date,'assistant_task','v10:recovery',{status:'planned',source:'v12-planning-v2',updatedAt:now});
      if(p.workoutChoice==='later'&&p.workoutStart){const[h,m]=p.workoutStart.split(':').map(Number);await saveEntry(date,'assistant_task','v10:workout',{status:'deferred',deferUntil:isoFor(date,h,m),deferredAt:now,source:'v12-planning-v2'})}
      else await saveEntry(date,'assistant_task','v10:workout',{status:'planned',plannedStart:p.workoutStart||null,source:'v12-planning-v2',updatedAt:now});
    }
    if(p.workoutChoice==='short'&&date===today())L.set('mygym.v8.timeBudget',45);
    if(p.workoutChoice!=='short'&&date===today())L.set('mygym.v8.timeBudget','full');
    const sleep=hmToMin(p.sleepTime);if(sleep!=null&&sleep>1410){const wind=sleep-15;await saveEntry(date,'assistant_task','v10:winddown',{status:'deferred',deferUntil:isoFor(date,Math.floor(wind/60),wind%60),deferredAt:now,source:'v12-planning-v2'})}
    else await saveEntry(date,'assistant_task','v10:winddown',{status:'planned',source:'v12-planning-v2',updatedAt:now});
    window.dispatchEvent(new CustomEvent('mygym:v12-plan-changed',{detail:{date,plan:p}}));
  }
  async function finalizeDaily(){
    const w=weeklyException(st.targetDate),p={...st.draft,status:'complete',targetDate:st.targetDate,weeklyContext:w||null,completedAt:new Date().toISOString(),source:'v12-planning-v2'};
    if(!p.special){p.category=null;p.timeBlock=null;p.workoutChoice='normal';p.mealImpact='none';p.sleepTime='23:30'}
    await saveEntry(st.targetDate,'planning','daily-plan',p);await applyDailyPlan(p);st.mode=null;st.draft=null;toast(`Đã cân lại lịch ${pretty(st.targetDate)} ✓`);release();
  }
  async function finalizeWeekly(){
    const p={...st.draft,status:'complete',weekStart:st.weekStart,completedAt:new Date().toISOString(),source:'v12-planning-v2'};await saveEntry(st.weekStart,'planning',`week-plan:${st.weekStart}`,p);
    for(const ex of p.exceptions||[]){const now=new Date().toISOString(),type=ex.workoutChoice==='skip'?'skip_workout':ex.category==='health'?'sick_or_pain':'schedule_shift';await saveEntry(ex.date,'schedule_change','planning-schedule',{type,reason:ex.category,source:'v12-weekly-planning',weekStart:st.weekStart,workoutChoice:ex.workoutChoice||'unknown',updatedAt:now});if(ex.workoutChoice==='skip'){await saveEntry(ex.date,'assistant_task','v10:workout',{status:'skipped',skippedAt:now,reason:'weekly_planned_unavailable',source:'v12-weekly-planning'});await saveEntry(ex.date,'assistant_task','v10:recovery',{status:'skipped',skippedAt:now,reason:'weekly_planned_unavailable',source:'v12-weekly-planning'})}}
    st.mode=null;st.draft=null;toast('Đã tạo khung tuần sau ✓');release();
  }

  function seedKnownContext(target,reason){
    const c=scheduleContext(target);if(!c||!['chat-assistant','v12-weekly-planning'].includes(c.source))return null;
    const cat=c.reason||c.category||null;if(!cat)return null;
    return{kind:'daily',targetDate:target,reason,step:'meal',special:true,category:cat,timeBlock:c.timeBlock||((cat==='social_drinking'||cat==='social')?'evening':'all_day'),workoutChoice:c.type==='skip_workout'?'skip':(c.workoutChoice||'normal'),createdAt:new Date().toISOString(),knownContext:true};
  }
  function startDaily(target,reason='night'){
    const old=dailyPlan(target);if(old?.status==='complete')return false;st.mode='daily';st.targetDate=target;st.weekStart=null;st.draft=old?.status==='in_progress'?{...old}:seedKnownContext(target,reason)||{kind:'daily',targetDate:target,reason,step:'intro',special:null,createdAt:new Date().toISOString()};render();return true;
  }
  function startWeekly(){const w=nextMonday(),old=weeklyPlan(w);if(old?.status==='complete')return false;st.mode='weekly';st.weekStart=w;st.targetDate=null;st.draft=old?.status==='in_progress'?{...old}:{kind:'weekly',weekStart:w,step:'intro',hasExceptions:null,exceptions:[],createdAt:new Date().toISOString()};render();return true}

  function btn(label,action,value,secondary=false){return`<button class="${secondary?'secondary':'primary'}" data-v12-action="${esc(action)}" data-v12-value="${esc(value??'')}">${esc(label)}</button>`}
  function dailyQuestion(){
    const d=st.draft,w=weeklyException(st.targetDate);
    if(d.step==='intro'){
      if(w)return{k:'KẾ HOẠCH NGÀY MAI',t:`${pretty(st.targetDate)} đang có ngoại lệ từ kế hoạch tuần: ${categories[w.category]||'khác lịch thường'}. Giữ như vậy không?`,n:`Workout: ${workoutLabels[w.workoutChoice]||'chưa chốt'}.`,c:[['Giữ kế hoạch tuần','daily-keep-week','1'],['Có thay đổi','daily-change-week','1']]};
      return{k:d.reason==='morning'?'TÔI CẦN XÁC NHẬN HÔM NAY':'TRƯỚC KHI KẾT THÚC NGÀY',t:`${d.reason==='morning'?'Hôm nay':'Ngày mai'} có gì khác lịch thường không?`,n:'Nếu không có gì khác, một câu này là xong. Nếu có, tôi mới hỏi tiếp từng câu.',c:[['Không, như thường','daily-normal','0'],['Có','daily-special','1']]};
    }
    if(d.step==='category')return{k:'1 VIỆC CẦN BIẾT',t:`Điều gì làm ${d.reason==='morning'?'hôm nay':'ngày mai'} khác lịch thường?`,n:'Chọn nguyên nhân chính.',c:Object.entries(categories).map(([v,l])=>[l,'daily-category',v])};
    if(d.step==='timeBlock')return{k:'CÂU TIẾP THEO',t:'Khoảng thời gian nào bị ảnh hưởng nhiều nhất?',n:`Đã ghi: ${categories[d.category]||d.category}.`,c:Object.entries(blocks).map(([v,l])=>[l,'daily-block',v])};
    if(d.step==='workout')return{k:'CÂU TIẾP THEO',t:'Buổi tập nên xử lý thế nào?',n:'Tôi tự đổi lịch Workout, bạn không cần vào tab khác chỉnh.',c:Object.entries(workoutLabels).filter(([v])=>v!=='unknown').map(([v,l])=>[l,'daily-workout',v])};
    if(d.step==='workoutTime')return{k:'CHỈ 1 GIỜ CỤ THỂ',t:'Bạn muốn bắt đầu tập lúc mấy giờ?',n:`Bạn chọn ${workoutLabels[d.workoutChoice]}. Nhập dạng HH:mm.`,input:{p:d.workoutChoice==='earlier'?'18:30':'21:30',a:'daily-workout-time'}};
    if(d.step==='meal')return{k:d.knownContext?'TÔI ĐÃ NHỚ VIỆC BẠN BÁO':'CÂU TIẾP THEO',t:d.knownContext&&d.category==='social_drinking'?'Tối nay đi nhậu — bữa nào sẽ bị ảnh hưởng nhiều nhất?':'Bữa nào có khả năng bị ảnh hưởng nhiều nhất?',n:d.knownContext?'Tôi không hỏi lại điều đã biết; chỉ lấy phần còn thiếu để cân lịch.':'Tôi dùng thông tin này để không nhắc ăn sai lúc.',c:Object.entries(mealLabels).map(([v,l])=>[l,'daily-meal',v])};
    if(d.step==='sleep')return{k:'CÂU CUỐI',t:'Giờ ngủ dự kiến khoảng mấy giờ?',n:'Nếu muộn hơn thường ngày, wind-down và sáng hôm sau sẽ được cân lại.',c:[['23:30','daily-sleep','23:30'],['00:00','daily-sleep','00:00'],['00:30','daily-sleep','00:30'],['01:00+','daily-sleep','01:00'],['Chưa biết','daily-sleep','unknown']]};
    return null;
  }
  function weeklyQuestion(){
    const d=st.draft;
    if(d.step==='intro')return{k:'CHỐT KHUNG TUẦN SAU',t:`Tuần bắt đầu ${pretty(st.weekStart)} có ngày nào khác lịch thường không?`,n:'Tôi chỉ hỏi ngoại lệ; ngày bình thường giữ nguyên rolling plan.',c:[['Không','weekly-none','0'],['Có','weekly-has','1']]};
    if(d.step==='pickDay')return{k:'1 NGÀY MỖI LẦN',t:'Ngày nào có ngoại lệ?',n:'Chọn một ngày trước.',c:[0,1,2,3,4,5,6].map(i=>{const x=addDays(st.weekStart,i);return[pretty(x),'weekly-day',x]})};
    if(d.step==='category')return{k:'NGÀY ĐÓ CÓ GÌ?',t:`${pretty(d.currentDate)} khác lịch vì việc gì?`,n:'Chọn nguyên nhân chính.',c:Object.entries(categories).map(([v,l])=>[l,'weekly-category',v])};
    if(d.step==='workout')return{k:'CÂN BUỔI TẬP',t:`Buổi tập ${pretty(d.currentDate)} nên xử lý thế nào?`,n:'Tối hôm trước tôi vẫn hỏi lại để tinh chỉnh.',c:[['Bình thường','weekly-workout','normal'],['Rút gọn 30–45 phút','weekly-workout','short'],['Không tập','weekly-workout','skip'],['Chưa biết','weekly-workout','unknown']]};
    if(d.step==='more')return{k:'ĐÃ GHI 1 NGOẠI LỆ',t:'Tuần sau còn ngày nào khác lịch nữa không?',n:`Hiện đã ghi ${(d.exceptions||[]).length} ngày.`,c:[['Có','weekly-more','1'],['Không, xong rồi','weekly-finish','0']]};return null;
  }
  function render(){
    if(!st.mode||st.rendering)return;const root=$('v10-assistant-root');if(!root)return;const x=st.mode==='daily'?dailyQuestion():weeklyQuestion();if(!x)return;st.rendering=true;
    try{document.documentElement.classList.add('pt-v12-planning');const label=st.mode==='daily'?`Kế hoạch ${pretty(st.targetDate)}`:`Tuần từ ${pretty(st.weekStart)}`;root.innerHTML=`<section class="v10-clock"><div class="v10-clock-top"><span><i></i> TRỢ LÝ ĐANG LÊN KẾ HOẠCH</span><span>${esc(label)}</span></div><div id="v12-clock" class="v10-clock-text"></div><div class="v10-status-row"><span>mỗi lần 1 câu hỏi</span><span class="good">planning trước</span></div></section><section class="v10-focus ask"><div class="v10-assistant-line"><div class="v10-avatar">PT</div><div><p class="eyebrow">${esc(x.k)}</p><h2>${esc(x.t)}</h2></div></div>${x.n?`<p class="v10-note">${esc(x.n)}</p>`:''}${x.c?`<div class="v10-choices">${x.c.map(c=>btn(c[0],c[1],c[2],c[1].includes('none')||c[1]==='daily-normal')).join('')}</div>`:''}${x.input?`<div class="v12-plan-answer"><label>Giờ bắt đầu</label><div class="v12-plan-answer-row"><input id="v12-plan-input" inputmode="numeric" placeholder="${esc(x.input.p)}"><button class="primary" data-v12-action="${esc(x.input.a)}">Lưu</button></div></div>`:''}<div class="v12-plan-progress">${esc(label.toUpperCase())}</div></section>`;bind();tick()}finally{st.rendering=false}
  }
  function bind(){qa('[data-v12-action]').forEach(b=>b.onclick=()=>handle(b.dataset.v12Action,b.dataset.v12Value));const i=$('v12-plan-input');if(i)i.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();q('[data-v12-action="daily-workout-time"]')?.click()}}}
  function tick(){const e=$('v12-clock');if(!e)return;const d=new Date();e.textContent=`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`}

  async function handle(a,v){
    const d=st.draft;if(!d)return;
    if(a==='daily-normal'){d.special=false;return finalizeDaily()}
    if(a==='daily-keep-week'){const w=weeklyException(st.targetDate)||{};Object.assign(d,{special:true,category:w.category||'other',timeBlock:w.timeBlock||'all_day',workoutChoice:w.workoutChoice||'normal',mealImpact:w.mealImpact||'none',sleepTime:w.sleepTime||'23:30',inheritedFromWeek:true});return finalizeDaily()}
    if(a==='daily-change-week'||a==='daily-special'){d.special=true;d.knownContext=false;d.step='category'}
    else if(a==='daily-category'){d.category=v;d.step='timeBlock'}
    else if(a==='daily-block'){d.timeBlock=v;d.step='workout'}
    else if(a==='daily-workout'){d.workoutChoice=v;d.step=(v==='earlier'||v==='later')?'workoutTime':'meal'}
    else if(a==='daily-workout-time'){const m=hmToMin($('v12-plan-input')?.value||'');if(m==null){toast('Nhập giờ dạng HH:mm');return}d.workoutStart=minToHm(m);d.step='meal'}
    else if(a==='daily-meal'){d.mealImpact=v;d.step='sleep'}
    else if(a==='daily-sleep'){d.sleepTime=v;return finalizeDaily()}
    else if(a==='weekly-none'){d.hasExceptions=false;d.exceptions=[];return finalizeWeekly()}
    else if(a==='weekly-has'){d.hasExceptions=true;d.step='pickDay'}
    else if(a==='weekly-day'){d.currentDate=v;d.step='category'}
    else if(a==='weekly-category'){d.currentCategory=v;d.step='workout'}
    else if(a==='weekly-workout'){const xs=(d.exceptions||[]).filter(x=>x.date!==d.currentDate);xs.push({date:d.currentDate,category:d.currentCategory,workoutChoice:v});d.exceptions=xs;delete d.currentDate;delete d.currentCategory;d.step='more'}
    else if(a==='weekly-more')d.step='pickDay';else if(a==='weekly-finish')return finalizeWeekly();
    await saveDraft();render();
  }
  function release(){document.documentElement.classList.remove('pt-v12-planning');setTimeout(()=>window.dispatchEvent(new Event('storage')),40)}

  function due(){const d=new Date(),m=nowMin(),dow=d.getDay();if(dow===0&&m>=1230&&m<1380&&weeklyPlan(nextMonday())?.status!=='complete')return{mode:'weekly'};if(m>=1380&&dailyPlan(tomorrow())?.status!=='complete')return{mode:'daily',target:tomorrow(),reason:'night'};if(m>=450&&m<660&&checkinDone(today())&&dailyPlan(today())?.status!=='complete')return{mode:'daily',target:today(),reason:'morning'};return null}
  function maybeStart(){if(st.mode){render();return}const x=due();if(!x)return;x.mode==='weekly'?startWeekly():startDaily(x.target,x.reason)}

  function currentPlanActions(){const p=dailyPlan(today());if(!p||p.status!=='complete')return;if(p.workoutChoice==='short')L.set('mygym.v8.timeBudget',45);if(p.workoutChoice==='earlier'&&p.workoutStart){const s=hmToMin(p.workoutStart),m=nowMin(),task=latest(today(),'assistant_task','v10:workout')?.payload;if(s!=null&&m>=s&&m<=s+45&&!['done','skipped'].includes(task?.status))earlyWorkout(s)}}
  function earlyWorkout(s){if(st.mode)return;const root=$('v10-assistant-root');if(!root)return;root.innerHTML=`<section class="v10-clock"><div class="v10-clock-top"><span><i></i> TRỢ LÝ ĐANG THEO KẾ HOẠCH</span><span>${esc(pretty(today()))}</span></div><div id="v12-clock" class="v10-clock-text"></div></section><section class="v10-focus active"><div class="v10-assistant-line"><div class="v10-avatar">PT</div><div><p class="eyebrow">LỊCH ĐÃ DỜI SỚM</p><h2>${esc(minToHm(s))} · Đến giờ tập</h2></div></div><p class="v10-note">Tôi dùng giờ bạn đã chốt, không dùng giờ mặc định 20:00.</p><div class="v10-choices"><button class="primary" id="v12-open-workout">Bắt đầu workout</button></div></section>`;tick();$('v12-open-workout')?.addEventListener('click',()=>{location.hash='workout';setTimeout(()=>($('v8-start')||$('open-today-workout'))?.click(),160)})}

  function reminderRows(){const out=[],base=today();for(let i=1;i<=8;i++){const target=addDays(base,i),rem=addDays(target,-1);out.push({notification_key:`planning:daily:${target}`,task_date:target,task_id:`planning-daily:${target}`,phase:'system',due_at:isoFor(rem,23,0),title:'Lên lịch ngày mai',body:'Tôi cần hỏi bạn 1 câu để tránh xếp lịch sai ngày mai.',url:'./pt.html#assistant',priority:8,status:'pending',payload:{kind:'planning',planningType:'daily',targetDate:target,entryKey:'daily-plan'}})}const d=parseDate(base);for(let i=0;i<14;i++){const x=new Date(d);x.setDate(x.getDate()+i);if(x.getDay()!==0)continue;const sun=dateKey(x),week=addDays(sun,1);out.push({notification_key:`planning:weekly:${week}`,task_date:week,task_id:`planning-weekly:${week}`,phase:'system',due_at:isoFor(sun,20,30),title:'Chốt khung tuần sau',body:'Tôi hỏi từng ngoại lệ để cân lại lịch tập tuần sau.',url:'./pt.html#assistant',priority:8,status:'pending',payload:{kind:'planning',planningType:'weekly',targetDate:week,entryKey:`week-plan:${week}`}})}return out}
  async function syncReminders(){const u=await auth();if(!u)return;const rows=reminderRows(),keys=rows.map(x=>x.notification_key);const{data,error}=await st.sb.from('pt_notification_queue').select('notification_key').eq('user_id',u.id).in('notification_key',keys);if(error){console.warn('[V12 planning reminders select]',error);return}const have=new Set((data||[]).map(x=>x.notification_key)),missing=rows.filter(x=>!have.has(x.notification_key)).map(x=>({...x,user_id:u.id,updated_at:new Date().toISOString()}));if(!missing.length)return;const{error:e}=await st.sb.from('pt_notification_queue').insert(missing);if(e)console.warn('[V12 planning reminders insert]',e)}

  function observeRoot(){const root=$('v10-assistant-root');if(!root||st.rootObserver)return;st.rootObserver=new MutationObserver(()=>{if(st.mode&&!st.rendering)setTimeout(render,0)});st.rootObserver.observe(root,{childList:true,subtree:false})}
  function watch(){window.addEventListener('storage',e=>{if(e.key?.startsWith('mygym.v3.')){maybeStart();currentPlanActions()}});document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){maybeStart();currentPlanActions();syncReminders()}});setInterval(()=>{const d=new Date(),m=d.getHours()*60+d.getMinutes();if(m!==st.lastMinute){st.lastMinute=m;maybeStart();currentPlanActions()}tick()},1000)}
  async function init(){document.documentElement.classList.add('pt-v12');document.title='MyGym Personal Assistant v12';const e=q('.pt-header .eyebrow');if(e)e.textContent='PERSONAL ASSISTANT • V12';try{await auth()}catch{};observeRoot();setTimeout(()=>{observeRoot();maybeStart();currentPlanActions();syncReminders()},700);watch()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();