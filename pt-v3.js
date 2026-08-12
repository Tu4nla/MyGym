(() => {
  const D = window.PT_DATA;
  const S = window.PT_SOURCE;
  const C = window.PT_CLOUD_CONFIG;
  const $ = id => document.getElementById(id);
  const $$ = (q, root = document) => [...root.querySelectorAll(q)];
  const nowIso = () => new Date().toISOString();
  const todayKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };
  const parseDate = key => { const [y,m,d] = key.split('-').map(Number); return new Date(y,m-1,d,12); };
  const addDays = (key,n) => { const d=parseDate(key); d.setDate(d.getDate()+n); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
  const fmt = key => new Intl.DateTimeFormat('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric'}).format(parseDate(key));
  const esc = v => String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const uid = p => `${p}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
  const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
  const local = {
    get(k,f){ try{return JSON.parse(localStorage.getItem(`mygym.v3.${k}`)||JSON.stringify(f))}catch{return f} },
    set(k,v){ localStorage.setItem(`mygym.v3.${k}`,JSON.stringify(v)); }
  };

  const state = {
    supabase:null,
    user:null,
    syncing:false,
    channel:null,
    todos:[],
    entries:[],
    measurements:[],
    sessions:[],
    sets:[],
    analyses:[],
    equipment:[],
    equipmentById:new Map(),
    player:{open:false,session:null,workoutId:null,exerciseIndex:0,restTimer:null,remaining:0},
    analysisTimer:null
  };

  function toast(text){ const el=$('toast'); if(!el)return; el.textContent=text; el.classList.add('show'); clearTimeout(toast._t); toast._t=setTimeout(()=>el.classList.remove('show'),1600); }
  function setSyncStatus(mode,text){ state.syncing=mode==='syncing'; const dot=$('cloud-dot'); const copy=$('cloud-status-text'); if(dot){dot.className=`cloud-dot ${mode==='online'?'online':mode==='syncing'?'syncing':''}`;} if(copy)copy.textContent=text; }
  function eventLabel(type){ return ({skip_workout:'Không tập được',partial_workout:'Tập một phần',missed_meal:'Lỡ bữa',offplan_meal:'Ăn khác kế hoạch',schedule_shift:'Lịch bị lệch',sick_or_pain:'Không khỏe / đau',other:'Khác'})[type]||type; }

  async function initSupabase(){
    if(!window.supabase || !C) return;
    state.supabase = window.supabase.createClient(C.url,C.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    const {data:{session}} = await state.supabase.auth.getSession();
    state.user = session?.user || null;
    state.supabase.auth.onAuthStateChange(async (_event,session2)=>{
      state.user=session2?.user||null;
      renderCloudBar();
      if(state.user){ await hydrateCloud(); subscribeRealtime(); await ensureTodayTodos(true); }
      else teardownRealtime();
      renderAll();
    });
    if(state.user){ await hydrateCloud(); subscribeRealtime(); }
  }

  async function loadEquipment(){
    try{
      const cfg=await fetch('equipment-catalog.json?v=4').then(r=>r.json());
      const chunks=await Promise.all((cfg.dataFiles||[]).map(p=>fetch(`${p}?v=4`).then(r=>r.json())));
      state.equipment=chunks.flat(); state.equipmentById=new Map(state.equipment.map(x=>[x.id,x]));
    }catch(e){ console.error(e); }
  }

  function renderCloudBar(){
    let bar=$('cloud-bar');
    if(!bar){
      bar=document.createElement('div'); bar.id='cloud-bar'; bar.className='cloud-bar';
      document.querySelector('.pt-tabs')?.after(bar);
    }
    if(state.user){
      bar.innerHTML=`<div class="cloud-left"><span id="cloud-dot" class="cloud-dot online"></span><div class="cloud-copy"><b>Cloud Sync bật</b><span id="cloud-status-text">${esc(state.user.email||'Đã đăng nhập')} • cập nhật realtime</span></div></div><div class="cloud-actions"><button id="cloud-refresh" class="mini-btn" type="button">Sync lại</button><button id="cloud-logout" class="mini-btn" type="button">Đăng xuất</button></div>`;
      $('cloud-refresh').onclick=async()=>{await hydrateCloud();renderAll();toast('Đã đồng bộ lại')};
      $('cloud-logout').onclick=()=>state.supabase.auth.signOut();
    }else{
      bar.innerHTML=`<div class="cloud-left"><span id="cloud-dot" class="cloud-dot"></span><div class="cloud-copy"><b>Chưa bật Cloud Sync</b><span id="cloud-status-text">Dữ liệu vẫn lưu local; đăng nhập để đồng bộ tức thời đa thiết bị.</span></div></div><div class="cloud-actions"><button id="cloud-login-open" class="mini-btn" type="button">Đăng nhập</button></div>`;
      $('cloud-login-open').onclick=()=>document.getElementById('auth-box')?.scrollIntoView({behavior:'smooth',block:'center'});
    }
  }

  function injectAuthBox(){
    if($('auth-box')) return;
    const box=document.createElement('div'); box.id='auth-box'; box.className='card auth-card';
    box.innerHTML=`<div><p class="eyebrow">CLOUD ACCOUNT</p><h3 style="margin:0 0 6px">Đồng bộ ngay khi cập nhật</h3><p class="muted">Đăng nhập cùng một email/password trên mọi thiết bị. Publishable key có thể nằm ở client; dữ liệu được bảo vệ bằng RLS theo user.</p></div><div class="auth-grid"><input id="auth-email" type="email" placeholder="Email"><input id="auth-password" type="password" minlength="6" placeholder="Password (>= 6 ký tự)"><button id="auth-login" class="primary" type="button">Đăng nhập</button><button id="auth-signup" class="secondary" type="button">Tạo tài khoản</button></div><div id="auth-message" class="muted" style="font-size:12px"></div>`;
    $('panel-coach')?.prepend(box);
    $('auth-login').onclick=()=>authPassword('login'); $('auth-signup').onclick=()=>authPassword('signup');
  }

  async function authPassword(mode){
    if(!state.supabase) return alert('Supabase client chưa tải.');
    const email=$('auth-email').value.trim(); const password=$('auth-password').value;
    if(!email||password.length<6) return alert('Nhập email và password ít nhất 6 ký tự.');
    const msg=$('auth-message'); msg.textContent='Đang xử lý…';
    const res = mode==='signup' ? await state.supabase.auth.signUp({email,password}) : await state.supabase.auth.signInWithPassword({email,password});
    if(res.error){ msg.textContent=res.error.message; return; }
    if(mode==='signup' && !res.data.session) msg.textContent='Đã tạo tài khoản. Nếu project yêu cầu xác nhận email, mở email xác nhận rồi quay lại đăng nhập.';
    else msg.textContent='Đăng nhập thành công.';
  }

  async function hydrateCloud(){
    if(!state.user) return hydrateLocal();
    setSyncStatus('syncing','Đang tải dữ liệu cloud…');
    const uidv=state.user.id; const start=addDays(todayKey(),-35);
    const [todos,entries,measures,sessions,sets,analyses]=await Promise.all([
      state.supabase.from('pt_todos').select('*').eq('user_id',uidv).gte('todo_date',start).order('todo_date'),
      state.supabase.from('pt_daily_entries').select('*').eq('user_id',uidv).gte('entry_date',start).order('entry_date'),
      state.supabase.from('pt_measurements').select('*').eq('user_id',uidv).gte('measured_at',start).order('measured_at'),
      state.supabase.from('pt_workout_sessions').select('*').eq('user_id',uidv).gte('workout_date',start).order('workout_date'),
      state.supabase.from('pt_exercise_sets').select('*').eq('user_id',uidv).gte('created_at',`${start}T00:00:00`).order('created_at'),
      state.supabase.from('pt_analysis_snapshots').select('*').eq('user_id',uidv).gte('analysis_date',start).order('created_at')
    ]);
    const errors=[todos,entries,measures,sessions,sets,analyses].map(x=>x.error).filter(Boolean);
    if(errors.length){ console.error(errors); setSyncStatus('','Cloud sync lỗi'); return hydrateLocal(); }
    state.todos=todos.data||[]; state.entries=entries.data||[]; state.measurements=measures.data||[]; state.sessions=sessions.data||[]; state.sets=sets.data||[]; state.analyses=analyses.data||[];
    persistLocalMirror(); setSyncStatus('online',`${state.user.email||'Đã đăng nhập'} • synced ${new Date().toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'})}`);
  }

  function hydrateLocal(){
    state.todos=local.get('todos',[]); state.entries=local.get('entries',[]); state.measurements=local.get('measurements',[]); state.sessions=local.get('sessions',[]); state.sets=local.get('sets',[]); state.analyses=local.get('analyses',[]);
  }
  function persistLocalMirror(){ local.set('todos',state.todos); local.set('entries',state.entries); local.set('measurements',state.measurements); local.set('sessions',state.sessions); local.set('sets',state.sets); local.set('analyses',state.analyses); }

  function teardownRealtime(){ if(state.channel&&state.supabase){state.supabase.removeChannel(state.channel);state.channel=null;} }
  function subscribeRealtime(){
    teardownRealtime(); if(!state.user||!state.supabase) return;
    const filter=`user_id=eq.${state.user.id}`;
    let ch=state.supabase.channel(`pt-live-${state.user.id}`);
    ['pt_todos','pt_daily_entries','pt_workout_sessions','pt_exercise_sets','pt_measurements','pt_analysis_snapshots'].forEach(table=>{
      ch=ch.on('postgres_changes',{event:'*',schema:'public',table,filter},()=>debouncedRemoteRefresh());
    });
    state.channel=ch.subscribe();
  }
  let refreshTimer=null;
  function debouncedRemoteRefresh(){ clearTimeout(refreshTimer); refreshTimer=setTimeout(async()=>{await hydrateCloud();renderAll();},250); }

  async function cloudUpsert(table,payload,onConflict){
    if(!state.user) return null;
    setSyncStatus('syncing','Đang sync thay đổi…');
    const row={...payload,user_id:state.user.id};
    const q=state.supabase.from(table).upsert(row,{onConflict}).select().single();
    const {data,error}=await q;
    if(error){ console.error(table,error); setSyncStatus('','Sync lỗi'); toast(`Sync lỗi: ${error.message}`); return null; }
    setSyncStatus('online',`${state.user.email||'Đã đăng nhập'} • vừa sync`); return data;
  }

  function completedSessions(){ return state.sessions.filter(s=>['complete','partial_counted'].includes((s.status||'').replace('-','_'))); }
  function nextWorkoutId(){ const seq=S.trainingPolicy.sequence; return seq[completedSessions().length%seq.length]; }
  function todayEntries(type){ return state.entries.filter(e=>e.entry_date===todayKey() && (!type||e.entry_type===type)); }
  function todayScheduleOverride(){ return todayEntries('schedule_change').at(-1)?.payload || null; }
  function todayPlan(){
    const override=todayScheduleOverride();
    if(override?.type==='sick_or_pain') return {type:'rest',title:'Recovery / không cố tập',subtitle:override.note||'Bạn đã báo không khỏe hoặc đau bất thường.',workoutId:null,source:'override'};
    if(override?.type==='skip_workout') return {type:'rest',title:'Hôm nay không tập',subtitle:`Buổi ${D.workouts[nextWorkoutId()]?.title||''} vẫn là buổi kế tiếp trong chuỗi.`,workoutId:null,source:'override'};
    const dow=new Date().getDay(); const preferred=S.trainingPolicy.preferredStrengthWeekdays.includes(dow);
    if(preferred){const id=nextWorkoutId();return{type:'strength',title:D.workouts[id].title,subtitle:D.workouts[id].focus,workoutId:id,source:'rolling-sequence'}}
    return D.week[dow];
  }

  function recovery(){
    const c=todayEntries('checkin').find(e=>e.entry_key==='daily-checkin')?.payload;
    const health=todayScheduleOverride()?.type==='sick_or_pain';
    if(health||Number(c?.soreness)>=4) return {level:'danger',label:'Cần nghỉ/đánh giá',factor:0,note:'Không cố tập xuyên đau hoặc khi không khỏe.'};
    if(!c) return {level:'unknown',label:'Chưa check-in',factor:1,note:'Điền check-in để app điều chỉnh demand.'};
    if(Number(c.sleepHours)<6 && Number(c.energy)<=2) return {level:'warn',label:'Recovery thấp',factor:.8,note:'Giảm khoảng 20% sets, giữ RIR ≥2, tránh failure.'};
    if(Number(c.sleepHours)<6.5||Number(c.energy)<=2||Number(c.soreness)>=3) return {level:'warn',label:'Recovery vừa',factor:.9,note:'Giảm nhẹ volume phụ, giữ kỹ thuật.'};
    return {level:'good',label:'Recovery tốt',factor:1,note:'Giữ giáo án, tăng tải khi đạt điều kiện.'};
  }

  function plannedTodos(){
    const p=todayPlan(); const items=[];
    items.push({key:'checkin',kind:'recovery',title:'Check-in recovery',note:'Ngủ, năng lượng, đau/mỏi.'});
    if(p.type==='strength')items.push({key:'workout',kind:'training',title:`Hoàn thành ${p.title}`,note:D.workouts[p.workoutId].focus});
    else items.push({key:'activity',kind:'activity',title:p.title,note:p.subtitle||'Recovery/đi bộ nhẹ.'});
    items.push({key:'protein',kind:'nutrition',title:`Đạt khoảng ${D.profile.proteinTarget} g protein`,note:'Ưu tiên chia đều qua các bữa.'});
    items.push({key:'water',kind:'nutrition',title:`Nước khoảng ${(D.profile.waterTargetMl/1000).toFixed(1)} L`,note:'Điều chỉnh thêm theo khát/vận động.'});
    items.push({key:'steps',kind:'activity',title:`Khoảng ${D.profile.stepsTarget.toLocaleString('vi-VN')} bước`,note:'Tránh ngồi liên tục quá lâu.'});
    items.push({key:'sleep',kind:'recovery',title:'Chuẩn bị ngủ 23:15 • ngủ 23:30',note:'Ưu tiên ít nhất 7–8 giờ.'});
    return items;
  }

  async function ensureTodayTodos(pushCloud=false){
    const day=todayKey(); const defs=plannedTodos(); let changed=false;
    defs.forEach((d,i)=>{if(!state.todos.some(t=>t.todo_date===day&&t.todo_key===d.key)){state.todos.push({id:uid('todo'),user_id:state.user?.id||null,todo_date:day,todo_key:d.key,title:d.title,kind:d.kind,sort_order:i,completed:false,note:'',payload:{defaultNote:d.note},created_at:nowIso(),updated_at:nowIso()});changed=true;}});
    persistLocalMirror();
    if(pushCloud&&state.user){ for(const t of state.todos.filter(t=>t.todo_date===day&&defs.some(d=>d.key===t.todo_key))){ await cloudUpsert('pt_todos',{todo_date:t.todo_date,todo_key:t.todo_key,title:t.title,kind:t.kind,sort_order:t.sort_order,completed:t.completed,note:t.note||null,payload:t.payload||{}},'user_id,todo_date,todo_key'); } await hydrateCloud(); }
    return changed;
  }

  async function toggleTodo(todoKey,completed){
    const t=state.todos.find(x=>x.todo_date===todayKey()&&x.todo_key===todoKey); if(!t)return;
    t.completed=completed;t.updated_at=nowIso();persistLocalMirror();renderTodos(); scheduleAnalysis('todo');
    if(state.user)await cloudUpsert('pt_todos',{todo_date:t.todo_date,todo_key:t.todo_key,title:t.title,kind:t.kind,sort_order:t.sort_order,completed:t.completed,note:t.note||null,payload:t.payload||{}},'user_id,todo_date,todo_key');
  }
  async function saveTodoNote(todoKey,note){
    const t=state.todos.find(x=>x.todo_date===todayKey()&&x.todo_key===todoKey); if(!t)return;
    t.note=note;t.updated_at=nowIso();persistLocalMirror(); scheduleAnalysis('todo-note');
    if(state.user)await cloudUpsert('pt_todos',{todo_date:t.todo_date,todo_key:t.todo_key,title:t.title,kind:t.kind,sort_order:t.sort_order,completed:t.completed,note:t.note||null,payload:t.payload||{}},'user_id,todo_date,todo_key');
  }

  async function upsertEntry(type,key,payload){
    const day=todayKey(); const existing=state.entries.find(e=>e.entry_date===day&&e.entry_type===type&&e.entry_key===key);
    if(existing){existing.payload=payload;existing.updated_at=nowIso();}else state.entries.push({id:uid('entry'),user_id:state.user?.id||null,entry_date:day,entry_type:type,entry_key:key,payload,created_at:nowIso(),updated_at:nowIso()});
    persistLocalMirror(); scheduleAnalysis(type); renderAll();
    if(state.user)await cloudUpsert('pt_daily_entries',{entry_date:day,entry_type:type,entry_key:key,payload},'user_id,entry_date,entry_type,entry_key');
  }

  async function saveMeasurement(weight,waist){
    const day=todayKey(); const key=`measure:${day}`; let m=state.measurements.find(x=>x.measured_at===day);
    if(m){m.weight_kg=weight||null;m.waist_cm=waist||null;m.updated_at=nowIso();}else state.measurements.push({id:uid('measure'),client_key:key,measured_at:day,weight_kg:weight||null,waist_cm:waist||null,created_at:nowIso(),updated_at:nowIso()});
    persistLocalMirror(); scheduleAnalysis('measurement'); renderProgress();
    if(state.user)await cloudUpsert('pt_measurements',{client_key:key,measured_at:day,weight_kg:weight||null,waist_cm:waist||null,note:null},'user_id,client_key');
  }

  function latestMeasurement(){return [...state.measurements].sort((a,b)=>a.measured_at.localeCompare(b.measured_at)).at(-1)}
  function avg(arr){return arr.length?arr.reduce((a,b)=>a+b,0)/arr.length:null}
  function currentAnalysis(){return [...state.analyses].filter(a=>a.analysis_date===todayKey()).sort((a,b)=>(a.created_at||'').localeCompare(b.created_at||'')).at(-1)}

  function buildAnalysis(trigger='auto'){
    const rec=recovery(); const todos=state.todos.filter(t=>t.todo_date===todayKey()); const done=todos.filter(t=>t.completed).length; const adherence=todos.length?Math.round(done*100/todos.length):0;
    const recentM=[...state.measurements].sort((a,b)=>a.measured_at.localeCompare(b.measured_at)).slice(-4); const first=recentM[0],last=recentM.at(-1);
    const weightDelta=first&&last&&first.weight_kg!=null&&last.weight_kg!=null?Number(last.weight_kg)-Number(first.weight_kg):null;
    const waistDelta=first&&last&&first.waist_cm!=null&&last.waist_cm!=null?Number(last.waist_cm)-Number(first.waist_cm):null;
    const recentSessions=[...state.sessions].sort((a,b)=>a.workout_date.localeCompare(b.workout_date)).slice(-8); const completed=recentSessions.filter(s=>['complete','partial_counted'].includes((s.status||'').replace('-','_'))).length; const skipped=recentSessions.filter(s=>s.status==='skipped').length;
    const todaySets=state.sets.filter(s=>s.created_at?.startsWith(todayKey())); const completedSets=todaySets.filter(s=>s.completed).length;
    const checkin=todayEntries('checkin').find(e=>e.entry_key==='daily-checkin')?.payload;
    let severity='info'; let summary='Kế hoạch đang ở trạng thái bình thường.'; const recommendations=[];
    if(rec.level==='danger'){severity='danger';summary='Ưu tiên an toàn và hồi phục hôm nay.';recommendations.push('Không cố hoàn thành volume; dừng bài gây đau bất thường.');}
    else if(rec.level==='warn'){severity='warn';summary='Recovery hôm nay thấp hơn mục tiêu.';recommendations.push(rec.note);}
    else if(rec.level==='good'){severity='good';summary='Recovery đủ tốt để theo giáo án hiện tại.';}
    if(adherence<50&&new Date().getHours()>=20){severity=severity==='danger'?'danger':'warn';recommendations.push('Adherence hôm nay đang thấp; ưu tiên 1–2 việc quan trọng còn lại thay vì cố hoàn hảo tất cả.');}
    if(weightDelta!=null&&waistDelta!=null){
      if(Math.abs(weightDelta)<=0.4&&waistDelta<-.3){summary='Dấu hiệu recomp đang đi đúng hướng: cân gần ổn định và vòng eo giảm.';recommendations.push('Giữ calories hiện tại và tiếp tục progressive overload.');severity=rec.level==='warn'?'warn':'good';}
      else if(weightDelta>.5&&waistDelta>.5){severity='warn';recommendations.push('Cân và eo cùng tăng qua các lần đo gần đây; nếu lặp lại, cân nhắc giảm 100–150 kcal/ngày.');}
      else if(weightDelta<-.8){severity='warn';recommendations.push('Cân đang giảm khá nhanh; nếu performance hoặc năng lượng giảm, cân nhắc tăng 100–150 kcal/ngày.');}
    }
    if(skipped>=2) recommendations.push('Có nhiều buổi bị bỏ gần đây; giữ rolling sequence, không ghép hai buổi để trả nợ.');
    if(checkin?.sleepHours&&Number(checkin.sleepHours)<6) recommendations.push('Tối nay ưu tiên phục hồi giấc ngủ trước khi tăng volume.');
    return {client_key:`analysis:${todayKey()}`,analysis_date:todayKey(),trigger_type:trigger,severity,summary,recommendations:[...new Set(recommendations)],metrics:{todoAdherence:adherence,todosDone:done,todosTotal:todos.length,weightDelta,waistDelta,recentWorkoutsCompleted:completed,recentWorkoutsSkipped:skipped,todayCompletedSets:completedSets,recovery:rec.label},rule_version:'v3.0',created_at:nowIso()};
  }

  function scheduleAnalysis(trigger){ clearTimeout(state.analysisTimer); state.analysisTimer=setTimeout(()=>runAnalysis(trigger),180); }
  async function runAnalysis(trigger='auto'){
    const a=buildAnalysis(trigger); const idx=state.analyses.findIndex(x=>x.client_key===a.client_key); if(idx>=0)state.analyses[idx]=a;else state.analyses.push(a); persistLocalMirror(); renderAnalysis();
    if(state.user)await cloudUpsert('pt_analysis_snapshots',{client_key:a.client_key,analysis_date:a.analysis_date,trigger_type:a.trigger_type,severity:a.severity,summary:a.summary,recommendations:a.recommendations,metrics:a.metrics,rule_version:a.rule_version},'user_id,client_key');
  }

  function renderHeader(){ const d=new Date(); $('date-badge').innerHTML=`<strong>${String(d.getDate()).padStart(2,'0')}</strong><span>${new Intl.DateTimeFormat('vi-VN',{month:'short'}).format(d)}</span>`; $('header-subtitle').textContent=`${new Intl.DateTimeFormat('vi-VN',{weekday:'long',day:'2-digit',month:'2-digit'}).format(d)} • ${todayPlan().title}`; }
  function renderTodayHero(){ const p=todayPlan();const rec=recovery();const w=p.type==='strength'?D.workouts[p.workoutId]:null;$('today-hero').innerHTML=`<div class="hero-card"><div class="hero-top"><div><p class="eyebrow">HÔM NAY • ${esc(p.source||p.type)}</p><h2>${esc(p.title)}</h2><p class="muted">${esc(p.subtitle||'')}</p></div>${w?'<button id="hero-start" class="primary" type="button">Bắt đầu tập</button>':''}</div><div class="hero-meta">${w?`<span class="pill">⏱ ${esc(w.duration)}</span><span class="pill">🎯 ${esc(w.focus)}</span>`:'<span class="pill">Không có buổi tạ bắt buộc</span>'}<span class="pill ${rec.level==='good'?'good':rec.level==='warn'?'warn':rec.level==='danger'?'danger':''}">${esc(rec.label)}</span></div></div>`; if($('hero-start'))$('hero-start').onclick=()=>startWorkoutPlayer(); }

  function injectDailyLog(){
    let host=$('daily-log-host'); if(!host){host=document.createElement('div');host.id='daily-log-host';const taskHead=$('today-tasks')?.previousElementSibling;taskHead?.before(host);}
    const c=todayEntries('checkin').find(e=>e.entry_key==='daily-checkin')?.payload||{};
    host.innerHTML=`<div class="section-head"><div><p class="eyebrow">DAILY LOGGING</p><h2>Nhật ký nhanh</h2></div></div><div class="log-grid"><div class="card quick-log-card"><label>Ngủ tối qua</label><input id="quick-sleep" type="number" step="0.1" value="${esc(c.sleepHours||'')}" placeholder="7.5 giờ"></div><div class="card quick-log-card"><label>Năng lượng</label><select id="quick-energy"><option value="1">1/5</option><option value="2">2/5</option><option value="3">3/5</option><option value="4">4/5</option><option value="5">5/5</option></select></div><div class="card quick-log-card"><label>Nước đã uống</label><input id="quick-water" type="number" step="100" placeholder="ml"></div><div class="card quick-log-card"><label>Ăn gì / note nhanh</label><input id="quick-meal" type="text" placeholder="VD: cơm + 2 trứng + thịt"></div></div>`;
    $('quick-energy').value=String(c.energy||3);
    $('quick-sleep').onchange=()=>upsertEntry('checkin','daily-checkin',{...c,sleepHours:Number($('quick-sleep').value||0),energy:Number($('quick-energy').value||3),sleepQuality:Number(c.sleepQuality||3),soreness:Number(c.soreness||1)});
    $('quick-energy').onchange=()=>upsertEntry('checkin','daily-checkin',{...c,sleepHours:Number($('quick-sleep').value||0),energy:Number($('quick-energy').value||3),sleepQuality:Number(c.sleepQuality||3),soreness:Number(c.soreness||1)});
    $('quick-water').onchange=()=>upsertEntry('activity','water-total',{ml:Number($('quick-water').value||0)});
    $('quick-meal').onchange=()=>{const v=$('quick-meal').value.trim(); if(v)upsertEntry('meal',`quick-${Date.now()}`,{text:v,estimated:false,time:nowIso()});};
  }

  function renderTodos(){ const host=$('today-tasks'); if(!host)return; const rows=state.todos.filter(t=>t.todo_date===todayKey()).sort((a,b)=>a.sort_order-b.sort_order); host.innerHTML=`<div class="todo-list">${rows.map(t=>`<div class="todo-row"><input class="todo-check" type="checkbox" data-todo-check="${esc(t.todo_key)}" ${t.completed?'checked':''}><div class="todo-main"><h3 class="${t.completed?'done':''}">${esc(t.title)}</h3><p>${esc(t.payload?.defaultNote||'')}</p><p class="todo-note"><input data-todo-note="${esc(t.todo_key)}" value="${esc(t.note||'')}" placeholder="Thêm note…"></p></div><span class="todo-kind">${esc(t.kind)}</span></div>`).join('')}</div>`; $$('[data-todo-check]').forEach(el=>el.onchange=()=>toggleTodo(el.dataset.todoCheck,el.checked)); $$('[data-todo-note]').forEach(el=>{let tm;el.oninput=()=>{clearTimeout(tm);tm=setTimeout(()=>saveTodoNote(el.dataset.todoNote,el.value),450)}}); }

  function renderNextMeal(){ const m=D.meals.find(x=>{const mm=x.time.match(/(\d{1,2}):(\d{2})/);return mm&&(Number(mm[1])*60+Number(mm[2]))>(new Date().getHours()*60+new Date().getMinutes())})||D.meals[0];$('next-meal').innerHTML=`<p class="eyebrow">${esc(m.time)}</p><h3>${esc(m.title)}</h3><p class="muted">${esc(m.target)}</p><ul class="meal-options">${m.options.slice(0,2).map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`; }
  function renderEquipment(){ const ids=S.equipment.confirmedFromCurrentProfile||[]; $('equipment-status').innerHTML=`<div class="source-badge">✓ ${ids.length} thiết bị canonical trong source</div><p class="muted" style="margin-top:10px">Workout player ưu tiên chính các máy này. Inventory lâu dài vẫn nằm trong source; log cá nhân nằm trên Supabase.</p>`; }

  function renderWorkout(){ const p=todayPlan(); const strength=p.type==='strength'; $('open-today-workout').classList.toggle('hidden',!strength); $('finish-workout').classList.add('hidden'); if(!strength){$('workout-title').textContent=p.title;$('workout-subtitle').textContent=p.subtitle||'';$('workout-list').innerHTML='';$('non-strength-workout').classList.remove('hidden');$('non-strength-workout').innerHTML=`<h3>Buổi strength kế tiếp: ${esc(D.workouts[nextWorkoutId()]?.title||'—')}</h3><p class="muted" style="margin-top:8px">Không ghép hai buổi để trả nợ.</p>`;return;} $('non-strength-workout').classList.add('hidden'); const w=D.workouts[p.workoutId];$('workout-title').textContent=`${w.title} — ${w.focus}`;$('workout-subtitle').textContent=`${w.duration} • ${recovery().note}`;$('workout-list').innerHTML=w.exercises.map((r,i)=>{const ex=exerciseFromRow(r);const machine=machineForExercise(ex);const item=machine.item;return`<article class="card exercise-card"><div class="machine-thumb"></div><div><p class="eyebrow">${i+1}/${w.exercises.length}</p><h3>${esc(ex.name)}</h3><p>${adjustedSets(ex)} × ${esc(ex.reps)} • RIR ${esc(ex.rir)}</p><p class="equipment-line">${esc(item?.name||'Cần bài thay thế')}</p></div><div class="exercise-actions"><button class="mini-btn" data-player-open="${i}">Tập bài này</button></div></article>`}).join('');$$('[data-player-open]').forEach(b=>b.onclick=()=>startWorkoutPlayer(Number(b.dataset.playerOpen)));$('open-today-workout').onclick=()=>startWorkoutPlayer(); }
  function exerciseFromRow(row){const [key,sets,reps,rir,rest]=row;return{key,sets,reps,rir,rest,...D.exerciseLibrary[key]}}
  function adjustedSets(ex){return recovery().factor<=0?0:Math.max(1,Math.round(ex.sets*recovery().factor))}
  function machineForExercise(ex){const id=(ex.equipment||[]).find(x=>(S.equipment.confirmedFromCurrentProfile||[]).includes(x))||(ex.equipment||[])[0];return{id,item:state.equipmentById.get(id)}}

  async function ensureSession(workoutId){
    const day=todayKey(); let s=state.sessions.find(x=>x.workout_date===day&&x.workout_id===workoutId&&['planned','in_progress'].includes(x.status)); if(s)return s;
    const clientKey=`session:${day}:${workoutId}`; const localS={id:uid('session'),client_key:clientKey,workout_date:day,workout_id:workoutId,status:'in_progress',completion_pct:0,note:'',started_at:nowIso(),ended_at:null,payload:{source:'player'},created_at:nowIso(),updated_at:nowIso()}; state.sessions.push(localS);persistLocalMirror();
    if(state.user){const remote=await cloudUpsert('pt_workout_sessions',{client_key:clientKey,workout_date:day,workout_id:workoutId,status:'in_progress',completion_pct:0,note:null,started_at:localS.started_at,ended_at:null,payload:{source:'player'}},'user_id,client_key');if(remote){Object.assign(localS,remote);persistLocalMirror();}}
    return localS;
  }

  function ensurePlayerDom(){
    if($('workout-player'))return;
    const p=document.createElement('div');p.id='workout-player';p.className='player';p.innerHTML=`<div class="player-shell"><div class="player-top"><button id="player-close" class="mini-btn">← Thoát</button><div><b id="player-workout-name">Workout</b><div id="player-counter" class="muted" style="font-size:11px"></div></div><button id="player-skip-ex" class="mini-btn">Bỏ bài</button></div><div class="player-progress"><div id="player-progress-bar"></div></div><div id="player-content"></div></div><div class="player-bottom"><div class="player-bottom-inner"><button id="player-prev" class="secondary">← Bài trước</button><button id="player-complete-set" class="primary">Hoàn thành set</button><button id="player-next" class="secondary">Bài tiếp →</button></div></div>`;document.body.appendChild(p);
    const rt=document.createElement('div');rt.id='rest-timer';rt.className='rest-timer';rt.innerHTML=`<span>Nghỉ</span><strong id="rest-time">0:00</strong><button id="rest-skip" class="mini-btn" style="margin-top:6px">Bỏ qua</button>`;document.body.appendChild(rt);
    $('player-close').onclick=closePlayer;$('player-prev').onclick=()=>moveExercise(-1);$('player-next').onclick=()=>moveExercise(1);$('player-skip-ex').onclick=()=>moveExercise(1);$('player-complete-set').onclick=completeCurrentSet;$('rest-skip').onclick=stopRestTimer;
  }

  async function startWorkoutPlayer(index=0){ const plan=todayPlan(); if(plan.type!=='strength')return alert('Hôm nay không có buổi strength bắt buộc.'); ensurePlayerDom(); const session=await ensureSession(plan.workoutId); state.player={...state.player,open:true,session,workoutId:plan.workoutId,exerciseIndex:index}; $('workout-player').classList.add('open');document.body.style.overflow='hidden';renderPlayer(); }
  function closePlayer(){state.player.open=false;$('workout-player').classList.remove('open');document.body.style.overflow='';stopRestTimer();renderWorkout();scheduleAnalysis('workout-player');}
  function moveExercise(delta){const w=D.workouts[state.player.workoutId];state.player.exerciseIndex=clamp(state.player.exerciseIndex+delta,0,w.exercises.length-1);renderPlayer();}
  function currentPlayerExercise(){const row=D.workouts[state.player.workoutId].exercises[state.player.exerciseIndex];return exerciseFromRow(row)}
  function sessionSets(exKey){return state.sets.filter(s=>s.session_id===state.player.session?.id&&s.exercise_key===exKey).sort((a,b)=>a.set_index-b.set_index)}
  function renderPlayer(){const w=D.workouts[state.player.workoutId],ex=currentPlayerExercise(),machine=machineForExercise(ex),sets=adjustedSets(ex),saved=sessionSets(ex.key);$('player-workout-name').textContent=w.title;$('player-counter').textContent=`Bài ${state.player.exerciseIndex+1}/${w.exercises.length}`;$('player-progress-bar').style.width=`${((state.player.exerciseIndex+1)/w.exercises.length)*100}%`;const nextSetIndex=Math.min(saved.filter(s=>s.completed).length,Math.max(0,sets-1));const existing=saved.find(s=>s.set_index===nextSetIndex);$('player-content').innerHTML=`<div class="player-machine"><div class="machine-thumb"></div><div><p class="eyebrow">${esc(ex.nameVi)}</p><h2>${esc(ex.name)}</h2><p class="muted">${esc(machine.item?.name||'Không có machine map chính xác')} • ${sets} × ${esc(ex.reps)} • nghỉ ${Math.round(ex.rest/60)} phút</p></div></div><div class="player-guide"><div class="card"><h4>SETUP</h4><p>${esc((ex.setup||[]).join(' • '))}</p></div><div class="card"><h4>CUES / THỞ</h4><p>${esc((ex.cues||[]).join(' • '))}<br>${esc(ex.breathing||'')}</p></div></div><div class="player-set"><div class="player-set-head"><b>Set ${nextSetIndex+1}/${sets}</b><span class="status-pill ${existing?.completed?'good':''}">${existing?.completed?'✓ Đã xong':'Đang tập'}</span></div><div class="player-set-grid"><label>kg<input id="player-weight" type="number" step="0.5" value="${esc(existing?.weight_kg??latestWeightForExercise(ex.key)??'')}"></label><label>reps<input id="player-reps" type="number" value="${esc(existing?.reps??'')}"></label><label>RIR<input id="player-rir" type="number" step="0.5" value="${esc(existing?.rir??2)}"></label></div><textarea id="player-set-note" rows="2" placeholder="Note set này…">${esc(existing?.note||'')}</textarea></div>`;$('player-complete-set').textContent=nextSetIndex>=sets-1?'Hoàn thành set cuối':'Hoàn thành set';}
  function latestWeightForExercise(key){return [...state.sets].filter(s=>s.exercise_key===key&&s.weight_kg!=null).sort((a,b)=>(a.created_at||'').localeCompare(b.created_at||'')).at(-1)?.weight_kg||null}
  async function completeCurrentSet(){const ex=currentPlayerExercise(),targetSets=adjustedSets(ex),saved=sessionSets(ex.key),idx=Math.min(saved.filter(s=>s.completed).length,Math.max(0,targetSets-1));const clientKey=`set:${state.player.session.client_key}:${ex.key}:${idx}`;let row=saved.find(s=>s.set_index===idx);const payload={client_key:clientKey,session_id:state.player.session.id,user_id:state.user?.id||null,exercise_key:ex.key,exercise_order:state.player.exerciseIndex,set_index:idx,target_reps:ex.reps,weight_kg:Number($('player-weight').value||0)||null,reps:Number($('player-reps').value||0)||null,rir:Number($('player-rir').value||0),completed:true,note:$('player-set-note').value.trim()||null,created_at:row?.created_at||nowIso(),updated_at:nowIso()};if(row)Object.assign(row,payload);else state.sets.push(payload);persistLocalMirror();renderPlayer();scheduleAnalysis('set-complete');if(state.user&&state.player.session.id&&!String(state.player.session.id).startsWith('session_'))await cloudUpsert('pt_exercise_sets',{client_key:clientKey,session_id:state.player.session.id,exercise_key:ex.key,exercise_order:state.player.exerciseIndex,set_index:idx,target_reps:ex.reps,weight_kg:payload.weight_kg,reps:payload.reps,rir:payload.rir,completed:true,note:payload.note},'user_id,client_key');startRestTimer(ex.rest);const totalDone=sessionCompletionPct();if(totalDone>=100)await finishPlayerSession();else if(idx>=targetSets-1&&state.player.exerciseIndex<D.workouts[state.player.workoutId].exercises.length-1){setTimeout(()=>moveExercise(1),250)}}
  function sessionCompletionPct(){const w=D.workouts[state.player.workoutId];let total=0,done=0;w.exercises.forEach(r=>{const ex=exerciseFromRow(r),n=adjustedSets(ex);total+=n;done+=state.sets.filter(s=>s.session_id===state.player.session.id&&s.exercise_key===ex.key&&s.completed).length});return total?Math.min(100,Math.round(done*100/total)):0}
  async function finishPlayerSession(){const pct=sessionCompletionPct();const status=pct>=100?'complete':pct>=S.trainingPolicy.rules.partialWorkoutThresholdPct?'partial_counted':'partial_not_counted';Object.assign(state.player.session,{status,completion_pct:pct,ended_at:nowIso(),updated_at:nowIso()});persistLocalMirror();if(state.user&&!String(state.player.session.id).startsWith('session_'))await cloudUpsert('pt_workout_sessions',{client_key:state.player.session.client_key,workout_date:state.player.session.workout_date,workout_id:state.player.session.workout_id,status,completion_pct:pct,note:state.player.session.note||null,started_at:state.player.session.started_at,ended_at:state.player.session.ended_at,payload:state.player.session.payload||{}},'user_id,client_key');const t=state.todos.find(x=>x.todo_date===todayKey()&&x.todo_key==='workout');if(t&&status!=='partial_not_counted')toggleTodo('workout',true);toast(`Buổi tập ${pct}% • ${status}`);scheduleAnalysis('workout-finish');if(pct>=100)closePlayer();}
  function startRestTimer(seconds){stopRestTimer();state.player.remaining=seconds;$('rest-timer').classList.add('show');updateRest();state.player.restTimer=setInterval(()=>{state.player.remaining--;updateRest();if(state.player.remaining<=0)stopRestTimer()},1000)}
  function updateRest(){const s=Math.max(0,state.player.remaining);$('rest-time').textContent=`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`}
  function stopRestTimer(){if(state.player.restTimer)clearInterval(state.player.restTimer);state.player.restTimer=null;$('rest-timer')?.classList.remove('show')}

  function renderNutrition(){ $('calorie-target').textContent=D.profile.calorieTarget;$('protein-target').textContent=D.profile.proteinTarget;$('water-target').textContent=(D.profile.waterTargetMl/1000).toFixed(1);$('steps-target').textContent=D.profile.stepsTarget.toLocaleString('vi-VN');const meals=todayEntries('meal');$('nutrition-adaptation').innerHTML=meals.length?`<div class="analysis-card"><h3>Đã ghi ${meals.length} meal log hôm nay</h3><p>${meals.slice(-3).map(m=>esc(m.payload?.text||m.payload?.status||'meal')).join(' • ')}</p></div>`:'';$('meal-list').innerHTML=D.meals.map(m=>`<article class="card meal-card"><p class="eyebrow">${esc(m.time)}</p><h3>${esc(m.title)}</h3><p>${esc(m.target)}</p><ul class="meal-options">${m.options.slice(0,2).map(x=>`<li>${esc(x)}</li>`).join('')}</ul><input class="inline-note" data-meal-log="${esc(m.id)}" placeholder="Ghi thực tế bạn đã ăn gì…"></article>`).join('');$$('[data-meal-log]').forEach(el=>el.onchange=()=>{const v=el.value.trim();if(v)upsertEntry('meal',`${el.dataset.mealLog}-${Date.now()}`,{mealId:el.dataset.mealLog,text:v,time:nowIso()})}); }

  function renderProgress(){const rows=[...state.measurements].sort((a,b)=>a.measured_at.localeCompare(b.measured_at));const last=rows.at(-1);$('progress-summary').innerHTML=last?`<p class="eyebrow">MỚI NHẤT • ${fmt(last.measured_at)}</p><div class="target-grid" style="margin-top:10px"><div class="metric"><span>Cân nặng</span><strong>${last.weight_kg??'—'}</strong><small>kg</small></div><div class="metric"><span>Vòng bụng</span><strong>${last.waist_cm??'—'}</strong><small>cm</small></div></div>`:`<h3>Chưa có số đo</h3><p class="muted">Nhập cân và vòng bụng để auto-analysis theo xu hướng.</p>`;$('progress-history').innerHTML=rows.slice().reverse().slice(0,10).map(r=>`<div class="card history-row"><strong>${fmt(r.measured_at)}</strong><div style="text-align:right">${r.weight_kg??'—'} kg<br><span class="muted">${r.waist_cm??'—'} cm</span></div></div>`).join('')}

  function renderAnalysis(){let host=$('coach-analysis');if(!host)return;const a=currentAnalysis()||buildAnalysis('preview');host.innerHTML=`<div class="analysis-card ${esc(a.severity)}"><p class="eyebrow">AUTO ANALYSIS • ${esc(a.rule_version)}</p><h3>${esc(a.summary)}</h3><p>Phân tích chạy lại sau mỗi lần bạn tick todo, sửa note, log bữa ăn, check-in, lưu set hoặc số đo.</p><div class="analysis-metrics"><span class="pill">Todo ${esc(a.metrics.todoAdherence)}%</span><span class="pill">Recovery ${esc(a.metrics.recovery)}</span><span class="pill">Sets hôm nay ${esc(a.metrics.todayCompletedSets)}</span>${a.metrics.weightDelta!=null?`<span class="pill">Δ cân ${Number(a.metrics.weightDelta).toFixed(1)} kg</span>`:''}${a.metrics.waistDelta!=null?`<span class="pill">Δ eo ${Number(a.metrics.waistDelta).toFixed(1)} cm</span>`:''}</div>${a.recommendations?.length?`<ul class="analysis-rec">${a.recommendations.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}<div class="sync-stamp">Trigger: ${esc(a.trigger_type)} • ${state.user?'đã lưu cloud':'local preview'}</div></div>`; }

  function renderCoachExtras(){ const old=$('copy-pt-update')?.closest('.card'); if(old)old.style.display='none'; const sync=$('copy-sync')?.closest('.card'); if(sync)sync.style.display='none'; }

  function renderChangeDynamic(){const type=$('change-type').value;let h='';if(type==='skip_workout')h=`<div class="dynamic-grid"><label>Ngày sớm nhất có thể tập lại<input id="change-resume-date" type="date" value="${addDays(todayKey(),1)}"></label></div>`;else if(type==='partial_workout')h=`<div class="dynamic-grid"><label>% hoàn thành<input id="change-completion" type="number" min="0" max="100" value="50"></label><label>Bài chính đã làm?<select id="change-main-done"><option value="yes">Có</option><option value="no">Chưa</option></select></label></div>`;else if(type==='missed_meal'||type==='offplan_meal')h=`<div class="dynamic-grid"><label>Bữa<select id="change-meal">${D.meals.map(m=>`<option value="${esc(m.id)}">${esc(m.title)}</option>`).join('')}</select></label></div>`;$('change-dynamic').innerHTML=h}
  async function saveChange(){const type=$('change-type').value;const payload={type,note:$('change-note').value.trim(),createdAt:nowIso()};if($('change-resume-date'))payload.resumeDate=$('change-resume-date').value;if($('change-completion'))payload.completionPct=Number($('change-completion').value||0);if($('change-main-done'))payload.mainExercisesDone=$('change-main-done').value==='yes';if($('change-meal'))payload.mealId=$('change-meal').value;await upsertEntry('schedule_change',`override-${Date.now()}`,payload);if(type==='skip_workout'){const p=todayPlan();const s={id:uid('session'),client_key:`skip:${todayKey()}:${nextWorkoutId()}`,workout_date:todayKey(),workout_id:p.workoutId||nextWorkoutId(),status:'skipped',completion_pct:0,note:payload.note,started_at:null,ended_at:null,payload};state.sessions.push(s);persistLocalMirror();if(state.user)await cloudUpsert('pt_workout_sessions',{client_key:s.client_key,workout_date:s.workout_date,workout_id:s.workout_id,status:'skipped',completion_pct:0,note:s.note,started_at:null,ended_at:null,payload},'user_id,client_key')}closeModal('change-modal');renderAll();scheduleAnalysis(type)}

  function openModal(id){$(id)?.classList.add('open')}function closeModal(id){$(id)?.classList.remove('open')}
  function bindBaseEvents(){
    $$('.tab').forEach(b=>b.onclick=()=>{const n=b.dataset.tab;$$('.tab').forEach(x=>x.classList.toggle('active',x===b));$$('.panel').forEach(p=>p.classList.toggle('active',p.id===`panel-${n}`));window.scrollTo({top:0,behavior:'smooth'})});
    $('checkin-form').onsubmit=e=>{e.preventDefault();const p={sleepHours:Number($('sleep-hours').value||0),sleepQuality:Number($('sleep-quality').value),energy:Number($('energy').value),soreness:Number($('soreness').value)};upsertEntry('checkin','daily-checkin',p);toggleTodo('checkin',true)};
    $('progress-form').onsubmit=e=>{e.preventDefault();const w=Number($('progress-weight').value||0)||null,wa=Number($('progress-waist').value||0)||null;if(!w&&!wa)return alert('Nhập cân nặng hoặc vòng bụng.');saveMeasurement(w,wa)};
    $('open-change').onclick=()=>{renderChangeDynamic();openModal('change-modal')};$('change-close').onclick=()=>closeModal('change-modal');$('change-type').onchange=renderChangeDynamic;$('change-form').onsubmit=e=>{e.preventDefault();saveChange()};
    $('modal-close').onclick=()=>closeModal('exercise-modal'); $('sync-close').onclick=()=>closeModal('sync-modal');
  }

  function renderAll(){renderHeader();renderCloudBar();renderTodayHero();injectDailyLog();renderTodos();renderNextMeal();renderEquipment();renderWorkout();renderNutrition();renderProgress();renderAnalysis();renderCoachExtras();const c=todayEntries('checkin').find(e=>e.entry_key==='daily-checkin')?.payload;if(c){$('sleep-hours').value=c.sleepHours??'';$('sleep-quality').value=c.sleepQuality??3;$('energy').value=c.energy??3;$('soreness').value=c.soreness??1;}const pill=$('recovery-pill');const r=recovery();pill.textContent=r.label;pill.className=`pill ${r.level==='good'?'good':r.level==='warn'?'warn':r.level==='danger'?'danger':''}`;}

  async function init(){await loadEquipment();hydrateLocal();injectAuthBox();renderCloudBar();bindBaseEvents();renderChangeDynamic();await initSupabase();await ensureTodayTodos(Boolean(state.user));renderAll();runAnalysis('app-open');}
  init();
})();