(()=>{
  const C=window.PT_CLOUD_CONFIG||null;
  if(!C)return;
  const $=id=>document.getElementById(id);
  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const L={get:(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch{return f}},set:(k,v)=>localStorage.setItem(k,JSON.stringify(v))};
  const st={sb:null,user:null,mode:null,targetDate:null,weekStart:null,draft:null,rendering:false,lastMinute:-1};
  const categories={work:'Bận công việc',social:'Đi chơi / hẹn',social_drinking:'Nhậu / tiệc',travel:'Di chuyển / về quê',health:'Không khỏe',other:'Khác'};
  const blocks={morning:'Buổi sáng',noon:'Buổi trưa',afternoon:'Buổi chiều',evening:'Buổi tối',all_day:'Cả ngày'};
  const workoutLabels={normal:'Tập bình thường',earlier:'Tập sớm hơn',later:'Tập muộn hơn',short:'Chỉ 30–45 phút',skip:'Không tập'};
  const mealLabels={none:'Không bữa nào',breakfast:'Bữa sáng',lunch:'Bữa trưa',snack:'Bữa xế',dinner:'Bữa tối',multiple:'Nhiều bữa'};

  function localEntries(){return L.get('mygym.v3.entries',[])}
  function saveLocalEntries(rows){L.set('mygym.v3.entries',rows)}
  function dateKey(d=new Date()){return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
  function parseDate(s){const[a,b,c]=s.split('-').map(Number);return new Date(a,b-1,c,12,0,0,0)}
  function addDays(s,n){const d=parseDate(s);d.setDate(d.getDate()+n);return dateKey(d)}
  function today(){return dateKey()}
  function tomorrow(){return addDays(today(),1)}
  function nowMin(){const d=new Date();return d.getHours()*60+d.getMinutes()+d.getSeconds()/60}
  function isoFor(date,h,m=0){const d=parseDate(date);d.setHours(h,m,0,0);return d.toISOString()}
  function hmToMin(v){const m=/^(\d{1,2}):(\d{2})$/.exec(String(v||'').trim());if(!m)return null;const h=+m[1],mi=+m[2];if(h>23||mi>59)return null;return h*60+mi}
  function minToHm(n){return`${String(Math.floor(n/60)%24).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`}
  function mondayOf(date){const d=parseDate(date),day=d.getDay()||7;d.setDate(d.getDate()-day+1);return dateKey(d)}
  function nextMonday(){const d=new Date(),day=d.getDay()||7;d.setDate(d.getDate()+(8-day));return dateKey(d)}
  function prettyDate(s){return new Intl.DateTimeFormat('vi-VN',{weekday:'long',day:'2-digit',month:'2-digit'}).format(parseDate(s))}
  function toast(t){const e=$('toast');if(!e)return;e.textContent=t;e.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(()=>e.classList.remove('show'),1900)}
  async function auth(){if(!window.supabase)return null;if(!st.sb)st.sb=window.supabase.createClient(C.url,C.publishableKey,{auth:{persistSession:true,autoRefreshToken:false,detectSessionInUrl:false}});const{data}=await st.sb.auth.getSession();st.user=data?.session?.user||null;return st.user}

  function latestEntry(date,type,key){return localEntries().filter(x=>x.entry_date===date&&x.entry_type===type&&x.entry_key===key).sort((a,b)=>String(a.updated_at||'').localeCompare(String(b.updated_at||''))).at(-1)||null}
  function checkinDone(date=today()){return localEntries().some(x=>x.entry_date===date&&x.entry_type==='checkin'&&x.entry_key==='daily-checkin')}
  function dailyPlan(date){return latestEntry(date,'planning','daily-plan')?.payload||null}
  function weeklyPlan(weekStart){return latestEntry(weekStart,'planning',`week-plan:${weekStart}`)?.payload||null}
  function weeklyException(date){const w=mondayOf(date),p=weeklyPlan(w);return(p?.exceptions||[]).find(x=>x.date===date)||null}

  async function saveEntry(date,type,key,payload){
    let rows=localEntries();const i=rows.findIndex(x=>x.entry_date===date&&x.entry_type===type&&x.entry_key===key),base=i>=0?rows[i]:{};
    const now=new Date().toISOString(),row={...base,user_id:base.user_id||st.user?.id||null,entry_date:date,entry_type:type,entry_key:key,payload,created_at:base.created_at||now,updated_at:now};
    if(i>=0)rows[i]=row;else rows.push(row);saveLocalEntries(rows);
    const u=await auth();if(u){const{error}=await st.sb.from('pt_daily_entries').upsert({user_id:u.id,entry_date:date,entry_type:type,entry_key:key,payload},{onConflict:'user_id,entry_date,entry_type,entry_key'});if(error)console.warn('[V12 save]',error)}
    return row;
  }
  async function saveDraft(){if(!st.draft)return;const key=st.mode==='weekly'?`week-plan:${st.weekStart}`:'daily-plan',date=st.mode==='weekly'?st.weekStart:st.targetDate;await saveEntry(date,'planning',key,{...st.draft,status:'in_progress',updatedAt:new Date().toISOString(),source:'v12-planning'})}

  function scheduleChangeType(plan){if(plan.workoutChoice==='skip')return'skip_workout';if(plan.category==='health')return'sick_or_pain';if(plan.special)return'schedule_shift';return'normal_plan'}
  async function applyDailyPlan(plan){
    const date=plan.targetDate,type=scheduleChangeType(plan);
    await saveEntry(date,'schedule_change','daily-planning',{type,reason:plan.category||'normal',source:'v12-planning',planning:true,timeBlock:plan.timeBlock||null,workoutChoice:plan.workoutChoice||'normal',workoutStart:plan.workoutStart||null,workoutBudget:plan.workoutChoice==='short'?45:null,mealImpact:plan.mealImpact||'none',sleepTime:plan.sleepTime||'23:30',note:plan.note||null,updatedAt:new Date().toISOString()});
    if(plan.workoutChoice==='skip'){
      await saveEntry(date,'assistant_task','v10:recovery',{status:'skipped',skippedAt:new Date().toISOString(),reason:'planned_unavailable',source:'v12-planning'});
      await saveEntry(date,'assistant_task','v10:workout',{status:'skipped',skippedAt:new Date().toISOString(),reason:'planned_unavailable',source:'v12-planning'});
    }
    if(plan.workoutChoice==='later'&&plan.workoutStart){await saveEntry(date,'assistant_task','v10:workout',{status:'deferred',deferUntil:isoFor(date,...plan.workoutStart.split(':').map(Number)),deferredAt:new Date().toISOString(),source:'v12-planning'})}
    if(plan.workoutChoice==='short'&&date===today())L.set('mygym.v8.timeBudget',45);
    const sleep=hmToMin(plan.sleepTime);if(sleep!=null&&sleep>1410){const wind=Math.max(0,sleep-15);await saveEntry(date,'assistant_task','v10:winddown',{status:'deferred',deferUntil:isoFor(date,Math.floor(wind/60),wind%60),deferredAt:new Date().toISOString(),source:'v12-planning'})}
    window.dispatchEvent(new CustomEvent('mygym:v12-plan-changed',{detail:{date,plan}}));
  }

  async function finalizeDaily(){
    const weekly=weeklyException(st.targetDate),d={...st.draft,status:'complete',targetDate:st.targetDate,weeklyContext:weekly||null,completedAt:new Date().toISOString(),source:'v12-planning'};
    if(!d.special){d.category=null;d.timeBlock=null;d.workoutChoice='normal';d.mealImpact='none';d.sleepTime='23:30'}
    await saveEntry(st.targetDate,'planning','daily-plan',d);await applyDailyPlan(d);st.mode=null;st.draft=null;toast(`Đã cân lại lịch ${prettyDate(st.targetDate)} ✓`);releaseAssistant();
  }
  async function finalizeWeekly(){
    const d={...st.draft,status:'complete',weekStart:st.weekStart,completedAt:new Date().toISOString(),source:'v12-planning'};
    await saveEntry(st.weekStart,'planning',`week-plan:${st.weekStart}`,d);
    for(const ex of d.exceptions||[]){
      const type=ex.workoutChoice==='skip'?'skip_workout':ex.category==='health'?'sick_or_pain':'schedule_shift';
      await saveEntry(ex.date,'schedule_change',`weekly-planning:${st.weekStart}`,{type,reason:ex.category,source:'v12-weekly-planning',weekStart:st.weekStart,workoutChoice:ex.workoutChoice||'unknown',note:ex.note||null});
      if(ex.workoutChoice==='skip'){await saveEntry(ex.date,'assistant_task','v10:recovery',{status:'skipped',skippedAt:new Date().toISOString(),reason:'weekly_planned_unavailable',source:'v12-weekly-planning'})}
    }
    st.mode=null;st.draft=null;toast('Đã tạo khung tuần sau ✓');releaseAssistant();
  }

  function startDaily(target,reason='night'){
    const old=dailyPlan(target);if(old?.status==='complete')return false;
    st.mode='daily';st.targetDate=target;st.weekStart=null;st.draft=old&&old.status==='in_progress'?{...old}:{kind:'daily',targetDate:target,reason,step:'intro',special:null,createdAt:new Date().toISOString()};renderPlanning();return true;
  }
  function startWeekly(){
    const w=nextMonday(),old=weeklyPlan(w);if(old?.status==='complete')return false;
    st.mode='weekly';st.weekStart=w;st.targetDate=null;st.draft=old&&old.status==='in_progress'?{...old}:{kind:'weekly',weekStart:w,step:'intro',hasExceptions:null,exceptions:[],createdAt:new Date().toISOString()};renderPlanning();return true;
  }

  function button(label,action,value,secondary=false,extra=''){return`<button class="${secondary?'secondary':'primary'} ${extra}" data-v12-action="${esc(action)}" data-v12-value="${esc(value??'')}">${esc(label)}</button>`}
  function dailyQuestion(){
    const d=st.draft,w=weeklyException(st.targetDate);
    if(d.step==='intro'){
      if(w)return{kicker:'KẾ HOẠCH NGÀY MAI',title:`${prettyDate(st.targetDate)} đang có ngoại lệ từ kế hoạch tuần: ${categories[w.category]||'khác lịch thường'}. Giữ như vậy không?`,note:`Workout: ${workoutLabels[w.workoutChoice]||'chưa chốt'}. Tôi chỉ cần xác nhận trước khi xếp lịch chi tiết.`,choices:[['Giữ kế hoạch tuần','daily-keep-week','1'],['Có thay đổi','daily-change-week','1']]};
      return{kicker:d.reason==='morning'?'TÔI CẦN XÁC NHẬN HÔM NAY':'TRƯỚC KHI KẾT THÚC NGÀY',title:`${d.reason==='morning'?'Hôm nay':'Ngày mai'} có gì khác lịch thường không?`,note:'Nếu không có gì khác, chỉ một câu này là xong. Nếu có, tôi mới hỏi tiếp từng câu.',choices:[['Không, như thường','daily-normal','0'],['Có','daily-special','1']]};
    }
    if(d.step==='category')return{kicker:'1 VIỆC CẦN BIẾT',title:`Điều gì làm ${d.reason==='morning'?'hôm nay':'ngày mai'} khác lịch thường?`,note:'Chọn nguyên nhân chính. Chi tiết hơn tôi sẽ hỏi sau nếu cần.',choices:Object.entries(categories).map(([v,l])=>[l,'daily-category',v])};
    if(d.step==='timeBlock')return{kicker:'CÂU TIẾP THEO',title:'Khoảng thời gian nào bị ảnh hưởng nhiều nhất?',note:`Đã ghi: ${categories[d.category]||d.category}.`,choices:Object.entries(blocks).map(([v,l])=>[l,'daily-block',v])};
    if(d.step==='workout')return{kicker:'CÂU TIẾP THEO',title:'Buổi tập nên xử lý thế nào?',note:'Tôi sẽ tự đổi lịch Workout; bạn không cần vào tab khác để chỉnh.',choices:Object.entries(workoutLabels).map(([v,l])=>[l,'daily-workout',v])};
    if(d.step==='workoutTime')return{kicker:'CHỈ 1 GIỜ CỤ THỂ',title:`Bạn muốn bắt đầu tập lúc mấy giờ?`,note:`Bạn chọn ${workoutLabels[d.workoutChoice]}. Nhập dạng HH:mm, ví dụ 18:30.`,input:{placeholder:d.workoutChoice==='earlier'?'18:30':'21:30',action:'daily-workout-time'}};
    if(d.step==='meal')return{kicker:'CÂU TIẾP THEO',title:'Bữa nào có khả năng bị ảnh hưởng nhiều nhất?',note:'Tôi dùng thông tin này để không nhắc ăn sai lúc bạn đang bận/đi ngoài.',choices:Object.entries(mealLabels).map(([v,l])=>[l,'daily-meal',v])};
    if(d.step==='sleep')return{kicker:'CÂU CUỐI',title:'Giờ ngủ dự kiến là khoảng mấy giờ?',note:'Nếu muộn hơn thường ngày, wind-down và lịch sáng hôm sau sẽ được cân lại.',choices:[['23:30','daily-sleep','23:30'],['00:00','daily-sleep','00:00'],['00:30','daily-sleep','00:30'],['01:00+','daily-sleep','01:00'],['Chưa biết','daily-sleep','unknown']]};
    return null;
  }
  function weeklyQuestion(){
    const d=st.draft;
    if(d.step==='intro')return{kicker:'CHỐT KHUNG TUẦN SAU',title:`Tuần bắt đầu ${prettyDate(st.weekStart)} có ngày nào khác lịch thường không?`,note:'Tôi chỉ cần biết ngoại lệ. Những ngày bình thường sẽ giữ nguyên rolling plan.',choices:[['Không','weekly-none','0'],['Có','weekly-has','1']]};
    if(d.step==='pickDay')return{kicker:'1 NGÀY MỖI LẦN',title:'Ngày nào có ngoại lệ?',note:'Chọn một ngày trước. Xong ngày này tôi mới hỏi có ngày khác hay không.',choices:[0,1,2,3,4,5,6].map(i=>{const date=addDays(st.weekStart,i);return[prettyDate(date),'weekly-day',date]})};
    if(d.step==='category')return{kicker:'NGÀY ĐÓ CÓ GÌ?',title:`${prettyDate(d.currentDate)} khác lịch vì việc gì?`,note:'Chọn nguyên nhân chính.',choices:Object.entries(categories).map(([v,l])=>[l,'weekly-category',v])};
    if(d.step==='workout')return{kicker:'CÂN BUỔI TẬP',title:`Buổi tập ${prettyDate(d.currentDate)} nên xử lý thế nào?`,note:'Kế hoạch ngày 23:00 tối hôm trước vẫn có thể tinh chỉnh lại.',choices:[['Bình thường','weekly-workout','normal'],['Rút gọn 30–45 phút','weekly-workout','short'],['Không tập','weekly-workout','skip'],['Chưa biết','weekly-workout','unknown']]};
    if(d.step==='more')return{kicker:'ĐÃ GHI 1 NGOẠI LỆ',title:'Tuần sau còn ngày nào khác lịch nữa không?',note:`Hiện đã ghi ${(d.exceptions||[]).length} ngày ngoại lệ.`,choices:[['Có','weekly-more','1'],['Không, xong rồi','weekly-finish','0']]};
    return null;
  }

  function renderPlanning(){
    if(!st.mode||st.rendering)return;const root=$('v10-assistant-root');if(!root)return;st.rendering=true;
    try{
      document.documentElement.classList.add('pt-v12-planning');
      const x=st.mode==='daily'?dailyQuestion():weeklyQuestion();if(!x)return;
      const progress=st.mode==='daily'?`Kế hoạch ${prettyDate(st.targetDate)}`:`Tuần từ ${prettyDate(st.weekStart)}`;
      root.innerHTML=`<section class="v10-clock"><div class="v10-clock-top"><span><i></i> TRỢ LÝ ĐANG LÊN KẾ HOẠCH</span><span>${esc(progress)}</span></div><div id="v12-clock" class="v10-clock-text"></div><div class="v10-status-row"><span>mỗi lần 1 câu hỏi</span><span class="good">planning trước</span></div></section><section class="v10-focus ask"><div class="v10-assistant-line"><div class="v10-avatar">PT</div><div><p class="eyebrow">${esc(x.kicker)}</p><h2>${esc(x.title)}</h2></div></div>${x.note?`<p class="v10-note">${esc(x.note)}</p>`:''}${x.choices?`<div class="v10-choices">${x.choices.map(c=>button(c[0],c[1],c[2],c[1].includes('none')||c[1].includes('normal'))).join('')}</div>`:''}${x.input?`<div class="v12-plan-answer"><label>Giờ bắt đầu</label><div class="v12-plan-answer-row"><input id="v12-plan-input" inputmode="numeric" placeholder="${esc(x.input.placeholder)}"><button class="primary" data-v12-action="${esc(x.input.action)}">Lưu</button></div></div>`:''}<div class="v12-plan-progress">${esc(progress.toUpperCase())}</div></section>`;
      bindPlanning();tickClock();
    }finally{st.rendering=false}
  }
  function tickClock(){const e=$('v12-clock');if(!e)return;const d=new Date();e.textContent=`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`}
  function bindPlanning(){qa('[data-v12-action]').forEach(b=>b.onclick=()=>handle(b.dataset.v12Action,b.dataset.v12Value));const inp=$('v12-plan-input');if(inp)inp.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();q('[data-v12-action="daily-workout-time"]')?.click()}}}

  async function handle(a,v){
    if(!st.draft)return;
    if(a==='daily-normal'){st.draft.special=false;return finalizeDaily()}
    if(a==='daily-keep-week'){const w=weeklyException(st.targetDate)||{};st.draft={...st.draft,special:true,category:w.category||'other',timeBlock:w.timeBlock||'all_day',workoutChoice:w.workoutChoice||'normal',mealImpact:w.mealImpact||'none',sleepTime:w.sleepTime||'23:30',inheritedFromWeek:true};return finalizeDaily()}
    if(a==='daily-change-week'||a==='daily-special'){st.draft.special=true;st.draft.step='category'}
    else if(a==='daily-category'){st.draft.category=v;st.draft.step='timeBlock'}
    else if(a==='daily-block'){st.draft.timeBlock=v;st.draft.step='workout'}
    else if(a==='daily-workout'){st.draft.workoutChoice=v;st.draft.step=(v==='earlier'||v==='later')?'workoutTime':'meal'}
    else if(a==='daily-workout-time'){const x=$('v12-plan-input')?.value||'',m=hmToMin(x);if(m==null){toast('Nhập giờ dạng HH:mm');return}st.draft.workoutStart=minToHm(m);st.draft.step='meal'}
    else if(a==='daily-meal'){st.draft.mealImpact=v;st.draft.step='sleep'}
    else if(a==='daily-sleep'){st.draft.sleepTime=v;return finalizeDaily()}
    else if(a==='weekly-none'){st.draft.hasExceptions=false;st.draft.exceptions=[];return finalizeWeekly()}
    else if(a==='weekly-has'){st.draft.hasExceptions=true;st.draft.step='pickDay'}
    else if(a==='weekly-day'){st.draft.currentDate=v;st.draft.step='category'}
    else if(a==='weekly-category'){st.draft.currentCategory=v;st.draft.step='workout'}
    else if(a==='weekly-workout'){const xs=(st.draft.exceptions||[]).filter(x=>x.date!==st.draft.currentDate);xs.push({date:st.draft.currentDate,category:st.draft.currentCategory,workoutChoice:v});st.draft.exceptions=xs;delete st.draft.currentDate;delete st.draft.currentCategory;st.draft.step='more'}
    else if(a==='weekly-more'){st.draft.step='pickDay'}
    else if(a==='weekly-finish'){return finalizeWeekly()}
    await saveDraft();renderPlanning();
  }

  function releaseAssistant(){document.documentElement.classList.remove('pt-v12-planning');setTimeout(()=>{window.dispatchEvent(new Event('storage'));location.hash='assistant';},30)}

  function planningDue(){
    const d=new Date(),m=nowMin(),dow=d.getDay();
    if(dow===0&&m>=20*60+30&&m<23*60){const w=nextMonday();if(weeklyPlan(w)?.status!=='complete')return{mode:'weekly'}}
    if(m>=23*60){const t=tomorrow();if(dailyPlan(t)?.status!=='complete')return{mode:'daily',target:t,reason:'night'}}
    if(m>=7*60+30&&m<11*60&&checkinDone(today())&&dailyPlan(today())?.status!=='complete')return{mode:'daily',target:today(),reason:'morning'};
    return null;
  }
  function maybeStart(){if(st.mode){renderPlanning();return}const d=planningDue();if(!d)return;if(d.mode==='weekly')startWeekly();else startDaily(d.target,d.reason)}

  function currentPlanActions(){
    const p=dailyPlan(today());if(!p||p.status!=='complete')return;
    if(p.workoutChoice==='short')L.set('mygym.v8.timeBudget',45);
    if(p.workoutChoice==='earlier'&&p.workoutStart){
      const start=hmToMin(p.workoutStart),m=nowMin(),task=latestEntry(today(),'assistant_task','v10:workout')?.payload;
      if(start!=null&&m>=start&&m<=start+45&&task?.status!=='done'&&task?.status!=='skipped')renderEarlyWorkout(p,start);
    }
  }
  function renderEarlyWorkout(p,start){
    if(st.mode)return;const root=$('v10-assistant-root');if(!root)return;
    root.innerHTML=`<section class="v10-clock"><div class="v10-clock-top"><span><i></i> TRỢ LÝ ĐANG THEO KẾ HOẠCH</span><span>${esc(prettyDate(today()))}</span></div><div id="v12-clock" class="v10-clock-text"></div></section><section class="v10-focus active"><div class="v10-assistant-line"><div class="v10-avatar">PT</div><div><p class="eyebrow">LỊCH ĐÃ ĐƯỢC DỜI SỚM</p><h2>${esc(minToHm(start))} · Đến giờ tập theo kế hoạch hôm nay</h2></div></div><p class="v10-note">Tôi đang dùng kế hoạch bạn đã chốt trước, không dùng giờ mặc định 20:00.</p><div class="v10-choices"><button class="primary" id="v12-open-workout">Bắt đầu workout</button></div></section>`;
    tickClock();$('v12-open-workout')?.addEventListener('click',()=>{location.hash='workout';setTimeout(()=>($('v8-start')||$('open-today-workout'))?.click(),160)});
  }

  function planningReminderRows(){
    const rows=[],base=today();
    for(let i=1;i<=8;i++){
      const target=addDays(base,i),reminder=addDays(target,-1),due=isoFor(reminder,23,0);
      rows.push({notification_key:`planning:daily:${target}`,task_date:target,task_id:`planning-daily:${target}`,phase:'system',due_at:due,title:'Lên lịch ngày mai',body:'Tôi cần hỏi bạn 1 câu để tránh xếp lịch sai ngày mai.',url:'./pt.html#assistant',priority:8,status:'pending',payload:{kind:'planning',planningType:'daily',targetDate:target,entryKey:'daily-plan'}});
    }
    const d=parseDate(base);for(let i=0;i<14;i++){const x=new Date(d);x.setDate(x.getDate()+i);if(x.getDay()!==0)continue;const sunday=dateKey(x),week=addDays(sunday,1),due=isoFor(sunday,20,30);rows.push({notification_key:`planning:weekly:${week}`,task_date:week,task_id:`planning-weekly:${week}`,phase:'system',due_at:due,title:'Chốt khung tuần sau',body:'Cho tôi 1 phút để hỏi các ngoại lệ của tuần sau và cân lại lịch tập.',url:'./pt.html#assistant',priority:8,status:'pending',payload:{kind:'planning',planningType:'weekly',targetDate:week,entryKey:`week-plan:${week}`}})}
    return rows;
  }
  async function syncPlanningReminders(){
    const u=await auth();if(!u)return;const rows=planningReminderRows().map(x=>({...x,user_id:u.id,updated_at:new Date().toISOString()}));
    const{error}=await st.sb.from('pt_notification_queue').upsert(rows,{onConflict:'user_id,notification_key'});if(error)console.warn('[V12 planning push]',error)
  }

  function watch(){
    window.addEventListener('storage',e=>{if(e.key?.startsWith('mygym.v3.')){maybeStart();currentPlanActions()}});
    window.addEventListener('mygym:v12-plan-changed',()=>currentPlanActions());
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){maybeStart();currentPlanActions();syncPlanningReminders()}});
    const rootObserver=new MutationObserver(()=>{if(st.mode&&!st.rendering)setTimeout(renderPlanning,0)});const root=$('v10-assistant-root');if(root)rootObserver.observe(root,{childList:true,subtree:false});
    setInterval(()=>{const d=new Date(),m=d.getHours()*60+d.getMinutes();if(m!==st.lastMinute){st.lastMinute=m;maybeStart();currentPlanActions()}tickClock()},1000);
  }
  async function init(){document.documentElement.classList.add('pt-v12');try{await auth()}catch{};setTimeout(()=>{maybeStart();currentPlanActions();syncPlanningReminders()},700);watch()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
