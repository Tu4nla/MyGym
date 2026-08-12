(()=>{
  const D=window.PT_DATA||{};
  const S=window.PT_SOURCE||{};
  const C=window.PT_CLOUD_CONFIG;
  if(!C||!window.supabase)return;

  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;
  const nowIso=()=>new Date().toISOString();
  const day=()=>{const d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
  const add=(k,n)=>{const[y,m,d]=k.split('-').map(Number),x=new Date(y,m-1,d,12);x.setDate(x.getDate()+n);return`${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`};
  const sb=window.supabase.createClient(C.url,C.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});

  const st={user:null,todos:[],entries:[],sessions:[],sets:[],measurements:[],analyses:[],equipment:new Map(),channel:null,install:null};

  function toast(t){const e=$('toast');if(!e)return;e.textContent=t;e.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('show'),1800)}
  function local(name,f=[]){try{return JSON.parse(localStorage.getItem(`mygym.v3.${name}`)||JSON.stringify(f))}catch{return f}}
  function todayCheckin(){return st.entries.filter(x=>x.entry_date===day()&&x.entry_type==='checkin').at(-1)?.payload||null}
  function completedSessions(){return st.sessions.filter(x=>['complete','partial_counted'].includes(String(x.status||'').replaceAll('-','_')))}
  function nextWorkoutId(){const q=S.trainingPolicy?.sequence||['upperA','lowerA','upperB','lowerB'];return q[completedSessions().length%q.length]}
  function todayPlan(){
    const override=st.entries.filter(x=>x.entry_date===day()&&x.entry_type==='schedule_change').at(-1)?.payload;
    if(override?.type==='sick_or_pain')return{type:'rest',title:'Recovery / không cố tập',source:'override'};
    if(override?.type==='skip_workout')return{type:'rest',title:'Hôm nay nghỉ',source:'override'};
    const dow=new Date().getDay();
    if(S.trainingPolicy?.preferredStrengthWeekdays?.includes(dow)){const id=nextWorkoutId();return{type:'strength',workoutId:id,title:D.workouts?.[id]?.title||id,focus:D.workouts?.[id]?.focus||'',source:'rolling-sequence'}}
    return D.week?.[dow]||{type:'rest',title:'Recovery',source:'week'};
  }
  function readiness(){
    const c=todayCheckin();
    if(!c)return{score:58,label:'Chưa đủ dữ liệu',tone:'',why:'Check-in để cá nhân hóa hôm nay.'};
    let n=64,h=+c.sleepHours||0,e=+c.energy||3,s=+c.soreness||1;
    n+=h>=7.5?16:h>=6.5?8:h>=6?0:-18;n+=(e-3)*7;n-=Math.max(0,s-1)*8;n=clamp(Math.round(n),15,98);
    if(s>=4)return{score:Math.min(n,35),label:'Ưu tiên an toàn',tone:'danger',why:'Bạn đã báo đau bất thường.'};
    return n>=78?{score:n,label:'Sẵn sàng tốt',tone:'good',why:'Recovery đủ tốt để theo giáo án.'}:n>=58?{score:n,label:'Sẵn sàng vừa',tone:'warn',why:'Tập được nhưng nên giữ kỹ thuật và RIR.'}:{score:n,label:'Recovery thấp',tone:'danger',why:'Nên giảm volume và ưu tiên hồi phục.'};
  }
  function todoStats(k=day()){const a=st.todos.filter(x=>x.todo_date===k),d=a.filter(x=>x.completed).length;return{a,d,n:a.length,p:a.length?Math.round(d*100/a.length):0}}
  function water(){return+st.entries.filter(x=>x.entry_date===day()&&x.entry_key==='water-total').at(-1)?.payload?.ml||0}
  function weekly(){
    const s=add(day(),-6),ts=st.todos.filter(x=>x.todo_date>=s),ad=ts.length?Math.round(ts.filter(x=>x.completed).length*100/ts.length):0;
    const ss=st.sessions.filter(x=>x.workout_date>=s),wo=ss.filter(x=>['complete','partial_counted'].includes(String(x.status||'').replaceAll('-','_'))).length,sk=ss.filter(x=>x.status==='skipped').length;
    const cs=st.entries.filter(x=>x.entry_date>=s&&x.entry_type==='checkin'&&x.entry_key==='daily-checkin'),sl=cs.map(x=>+x.payload?.sleepHours).filter(Number.isFinite),en=cs.map(x=>+x.payload?.energy).filter(Number.isFinite),so=cs.map(x=>+x.payload?.soreness).filter(Number.isFinite);
    const ms=st.measurements.filter(x=>x.measured_at>=s),f=ms[0],l=ms.at(-1),dw=f?.weight_kg!=null&&l?.weight_kg!=null?+l.weight_kg-+f.weight_kg:null,de=f?.waist_cm!=null&&l?.waist_cm!=null?+l.waist_cm-+f.waist_cm:null;
    const sets=st.sets.filter(x=>x.created_at?.slice(0,10)>=s&&x.completed),ton=Math.round(sets.reduce((a,x)=>a+(+x.weight_kg||0)*(+x.reps||0),0));
    const score=clamp(Math.round(ad*.55+Math.min(100,wo/4*100)*.3+((avg(sl)||6.5)/8*15)),0,100);
    return{s,ad,wo,sk,sl:avg(sl),en:avg(en),so:avg(so),dw,de,sets:sets.length,ton,score};
  }
  function metric(a,b,c,p){return`<div class="v4-kpi"><span>${esc(a)}</span><strong>${esc(b)}</strong><small>${esc(c)}</small><i><b style="width:${clamp(p,0,100)}%"></b></i></div>`}

  async function loadEquipment(){
    try{const c=await fetch('equipment-catalog.json?v=5').then(r=>r.json()),xs=await Promise.all((c.dataFiles||[]).map(p=>fetch(`${p}?v=5`).then(r=>r.json())));xs.flat().forEach(x=>{if(!st.equipment.has(x.id))st.equipment.set(x.id,x)})}catch(e){console.warn('[V5 equipment]',e)}
  }
  function loadLocal(){st.todos=local('todos');st.entries=local('entries');st.sessions=local('sessions');st.sets=local('sets');st.measurements=local('measurements');st.analyses=local('analyses')}
  async function loadCloud(){
    if(!st.user){loadLocal();render();return}
    const s=add(day(),-35),u=st.user.id;
    const r=await Promise.all([
      sb.from('pt_todos').select('*').eq('user_id',u).gte('todo_date',s).order('todo_date'),
      sb.from('pt_daily_entries').select('*').eq('user_id',u).gte('entry_date',s).order('created_at'),
      sb.from('pt_workout_sessions').select('*').eq('user_id',u).gte('workout_date',s).order('workout_date'),
      sb.from('pt_exercise_sets').select('*').eq('user_id',u).gte('created_at',`${s}T00:00:00`).order('created_at'),
      sb.from('pt_measurements').select('*').eq('user_id',u).gte('measured_at',s).order('measured_at'),
      sb.from('pt_analysis_snapshots').select('*').eq('user_id',u).gte('analysis_date',s).order('created_at')
    ]);
    const keys=['todos','entries','sessions','sets','measurements','analyses'];
    r.forEach((x,i)=>{if(x.error)console.warn('[V5 load]',keys[i],x.error);else st[keys[i]]=x.data||[]});
    render();
  }

  function ensureDom(){
    document.documentElement.classList.add('pt-v4','pt-v5');
    document.title='MyGym Personal PT v5';
    const eb=document.querySelector('.pt-header .eyebrow');if(eb)eb.textContent='PERSONAL FITNESS OS • V5';

    if($('panel-today')&&!$('v5-home')){const e=document.createElement('section');e.id='v5-home';$('panel-today').prepend(e)}
    if($('panel-progress')&&!$('v5-week')){const e=document.createElement('section');e.id='v5-week';e.innerHTML='<div class="section-head"><div><p class="eyebrow">WEEKLY REVIEW</p><h2>Tuần của bạn</h2></div><button id="v5-copy-week" class="mini-btn">Copy cho ChatGPT</button></div><div id="v5-week-body"></div>';$('panel-progress').append(e)}
    if($('panel-workout')&&!$('v5-swap')){const e=document.createElement('section');e.id='v5-swap';e.innerHTML='<div class="section-head"><div><p class="eyebrow">SMART SWAP</p><h2>Máy bận? Đổi nhanh</h2></div></div><div id="v5-swap-body"></div>';$('panel-workout').append(e)}
    if($('panel-nutrition')&&!$('v5-meal')){const e=document.createElement('section');e.id='v5-meal';e.innerHTML='<div class="section-head"><div><p class="eyebrow">MANUAL MEAL REVIEW</p><h2>Nhờ ChatGPT ước tính bữa ăn</h2></div></div><div class="card v5-manual-card"><textarea id="v5-meal-input" rows="3" placeholder="VD: 1 chén cơm, 150g gà, 2 trứng..."></textarea><div class="v5-actions"><button id="v5-copy-meal" class="primary">Copy bữa ăn + context</button></div><p class="muted">Không gọi API. Copy xong dán vào ChatGPT; tôi sẽ phân tích và có thể ghi kết quả trở lại data.</p></div>';$('panel-nutrition').append(e)}

    if($('panel-coach')&&!$('v5-manual-coach')){
      const e=document.createElement('section');e.id='v5-manual-coach';
      e.innerHTML=`
        <div class="section-head"><div><p class="eyebrow">ZERO-COST MANUAL COACH</p><h2>ChatGPT Bridge</h2></div><span class="pill good">$0 API</span></div>
        <div class="v5-bridge-grid">
          <article class="card v5-bridge-main">
            <div class="v5-bridge-title"><div><h3>1 nút → copy dữ liệu → dán vào ChatGPT</h3><p class="muted">Packet có user id, profile, 72 thiết bị, lịch tập, todo, recovery, workout sets, số đo và trend. Không chứa password hay Supabase key bí mật.</p></div><b>↗</b></div>
            <div class="v5-actions">
              <button id="v5-copy-daily" class="primary">Copy phân tích hôm nay</button>
              <button id="v5-copy-weekly" class="secondary">Copy review 7 ngày</button>
              <button id="v5-copy-full" class="secondary">Copy full 30 ngày</button>
            </div>
            <div class="v5-flow"><span>Website</span><i>→</i><span>Copy packet</span><i>→</i><span>ChatGPT</span><i>→</i><span>Phân tích</span><i>→</i><span>Update Supabase / GitHub</span></div>
          </article>
          <article class="card v5-question-card">
            <p class="eyebrow">HỎI THEO TÌNH HUỐNG</p>
            <textarea id="v5-question" rows="5" placeholder="VD: Tối nay chỉ có 45 phút; 2 hôm nay ngủ kém. Hãy điều chỉnh buổi tập và update data nếu cần."></textarea>
            <button id="v5-copy-question" class="primary">Copy câu hỏi + dữ liệu</button>
          </article>
        </div>
        <div class="section-head"><div><p class="eyebrow">LAST MANUAL UPDATE</p><h2>Kết quả tôi đã ghi lại</h2></div><button id="v5-refresh" class="mini-btn">Refresh</button></div>
        <div id="v5-last-update" class="card"></div>`;
      $('coach-analysis')?.insertAdjacentElement('afterend',e);
    }

    if(!$('v5-install')){const b=document.createElement('button');b.id='v5-install';b.className='v4-install hidden';b.textContent='＋ Cài My PT';document.body.append(b)}
  }

  function home(){
    const e=$('v5-home');if(!e)return;
    const r=readiness(),t=todoStats(),p=todayPlan(),ec=S.equipment?.physicalEquipmentCount||S.equipment?.confirmedFromCurrentProfile?.length||0;
    const action=!todayCheckin()?['◉','Check-in 30 giây','Dữ liệu này quyết định volume hôm nay.','checkin']:(p.type==='strength'&&!t.a.find(x=>x.todo_key==='workout')?.completed)?['▶',`Buổi kế tiếp: ${p.title}`,'Giữ rolling sequence; không cần bù buổi cũ.','workout']:['✓','Tiếp tục kế hoạch','Duy trì những việc còn lại trong ngày.','todo'];
    e.innerHTML=`<div class="v4-hero"><article class="v4-ready ${r.tone}"><div class="v4-ring" style="--p:${r.score}"><div><strong>${r.score}</strong><span>readiness</span></div></div><div><p class="eyebrow">COMMAND CENTER</p><h2>${esc(r.label)}</h2><p>${esc(r.why)}</p><div class="v4-tags"><span>${esc(p.title)}</span><span>${t.p}% todo</span><span>${ec} thiết bị</span></div></div></article><article class="v4-next"><b>${action[0]}</b><div><p class="eyebrow">NEXT BEST ACTION</p><h3>${esc(action[1])}</h3><p>${esc(action[2])}</p></div><button id="v5-go" class="primary">Làm ngay</button></article></div><div class="v4-kpis">${metric('Adherence',`${t.p}%`,`${t.d}/${t.n||0} việc`,t.p)}${metric('Nước',`${(water()/1000).toFixed(1)}L`,`mục tiêu ${(D.profile?.waterTargetMl||2500)/1000}L`,Math.min(100,water()*100/(D.profile?.waterTargetMl||2500)))}${metric('Workout',p.type==='strength'?p.title:'Recovery',p.type==='strength'?'rolling sequence':'không ép tập',p.type==='strength'?68:100)}${metric('Assistant','MANUAL','$0 API',100)}</div><div class="section-head"><div><p class="eyebrow">14-DAY SIGNAL</p><h2>Nhịp gần đây</h2></div><button id="v5-home-copy" class="mini-btn">Copy cho ChatGPT</button></div><div id="v5-days" class="v4-days"></div>`;
    $('v5-go').onclick=()=>{if(action[3]==='checkin')$('checkin-form')?.scrollIntoView({behavior:'smooth',block:'center'});else if(action[3]==='workout')document.querySelector('.tab[data-tab="workout"]')?.click();else document.querySelector('[data-todo-check]:not(:checked)')?.scrollIntoView({behavior:'smooth',block:'center'})};
    $('v5-home-copy').onclick=()=>copyPacket('daily');
    timeline();
  }
  function timeline(){const e=$('v5-days');if(!e)return;e.innerHTML=Array.from({length:14},(_,i)=>add(day(),i-13)).map(k=>{const t=todoStats(k),s=st.sessions.filter(x=>x.workout_date===k).at(-1),c=st.entries.some(x=>x.entry_date===k&&x.entry_type==='checkin'),z=['complete','partial_counted'].includes(String(s?.status||'').replaceAll('-','_'))?'trained':s?.status==='skipped'?'skipped':c?'logged':'';return`<div class="v4-day ${z} ${k===day()?'today':''}"><span>${new Intl.DateTimeFormat('vi-VN',{weekday:'short'}).format(new Date(`${k}T12:00`))}</span><strong>${k.slice(-2)}</strong><i style="--p:${t.p}%"></i></div>`}).join('')}
  function week(){
    const e=$('v5-week-body');if(!e)return;const w=weekly(),sig=[];
    if(w.sl!=null&&w.sl<6.5)sig.push('Giấc ngủ đang là bottleneck đáng theo dõi.');
    if(w.ad<65)sig.push('Adherence thấp: nên giảm số việc bắt buộc và ưu tiên hành vi đòn bẩy.');
    if(w.dw!=null&&w.de!=null&&Math.abs(w.dw)<=.5&&w.de<0)sig.push('Recomp signal tích cực: cân khá ổn định trong khi eo giảm.');
    if(w.dw!=null&&w.de!=null&&w.dw>.5&&w.de>.5)sig.push('Cân và eo cùng tăng: cần theo dõi trend trước khi đổi calories.');
    if(!sig.length)sig.push('Chưa có xu hướng đủ mạnh để đổi kế hoạch.');
    e.innerHTML=`<div class="v4-week"><div class="v4-week-score"><div class="v4-ring small" style="--p:${w.score}"><div><strong>${w.score}</strong><span>consistency</span></div></div><h3>${w.score>=75?'Tuần ổn định':w.score>=55?'Tuần cần tinh chỉnh':'Xây lại nhịp'}</h3><p class="muted">${w.s} → ${day()}</p></div><div class="v4-week-kpis">${metric('Adherence',`${w.ad}%`,'todo hoàn thành',w.ad)}${metric('Strength',`${w.wo} buổi`,`${w.sk} buổi bỏ`,Math.min(100,w.wo/4*100))}${metric('Sleep',w.sl==null?'—':`${w.sl.toFixed(1)}h`,w.en==null?'chưa đủ log':`energy ${w.en.toFixed(1)}/5`,Math.min(100,(w.sl||0)/8*100))}${metric('Training',`${w.sets} sets`,`${w.ton.toLocaleString('vi-VN')} kg·reps`,Math.min(100,w.sets/45*100))}</div><div class="card v4-signals"><p class="eyebrow">SIGNALS</p>${sig.map(x=>`<p>• ${esc(x)}</p>`).join('')}<div>${w.dw==null?'':`<span>Δ cân ${w.dw>0?'+':''}${w.dw.toFixed(1)} kg</span>`}${w.de==null?'':`<span>Δ eo ${w.de>0?'+':''}${w.de.toFixed(1)} cm</span>`}</div></div></div>`;
    $('v5-copy-week').onclick=()=>copyPacket('weekly');
  }
  function swap(){
    const e=$('v5-swap-body');if(!e)return;const id=todayPlan().workoutId||nextWorkoutId(),w=D.workouts?.[id],ok=new Set(S.equipment?.confirmedFromCurrentProfile||[]);if(!w){e.innerHTML='<div class="card muted">Chưa có workout để gợi ý.</div>';return}
    e.innerHTML='<div class="v4-swaps">'+w.exercises.map(r=>{const key=r[0],x=D.exerciseLibrary?.[key];if(!x)return'';const direct=(x.equipment||[]).filter(i=>ok.has(i)),token=String(x.primary||'').split('•')[0].trim().toLowerCase(),alts=Object.entries(D.exerciseLibrary||{}).filter(([k,a])=>k!==key&&String(a.primary||'').toLowerCase().includes(token)&&(a.equipment||[]).some(i=>ok.has(i))).slice(0,3);return`<article class="card"><p class="eyebrow">${esc(x.nameVi||'')}</p><h3>${esc(x.name)}</h3><p class="muted">${direct.length?direct.map(i=>esc(st.equipment.get(i)?.name||i)).join(' · '):'Không có map máy trực tiếp'}</p>${alts.length?`<details><summary>Phương án thay bài</summary>${alts.map(([,a])=>`<div class="v4-alt"><b>${esc(a.name)}</b><span>${esc((a.equipment||[]).filter(i=>ok.has(i)).map(i=>st.equipment.get(i)?.name||i).join(' · '))}</span></div>`).join('')}</details>`:''}</article>`}).join('')+'</div>';
  }

  function exerciseProgress(since){
    const sessionById=new Map(st.sessions.map(x=>[String(x.id),x]));
    const groups=new Map();
    st.sets.filter(x=>x.completed&&x.created_at?.slice(0,10)>=since).forEach(x=>{const a=groups.get(x.exercise_key)||[];a.push(x);groups.set(x.exercise_key,a)});
    return [...groups.entries()].map(([key,rows])=>{rows.sort((a,b)=>String(a.created_at).localeCompare(String(b.created_at)));const last=rows.at(-1),prev=rows.length>1?rows.at(-2):null,session=sessionById.get(String(last?.session_id));return{exercise:key,name:D.exerciseLibrary?.[key]?.name||key,sets:rows.length,lastDate:last?.created_at?.slice(0,10)||null,lastWorkout:session?.workout_id||null,last:{kg:last?.weight_kg??null,reps:last?.reps??null,rir:last?.rir??null},previous:prev?{kg:prev.weight_kg??null,reps:prev.reps??null,rir:prev.rir??null}:null,volume:Math.round(rows.reduce((a,x)=>a+(+x.weight_kg||0)*(+x.reps||0),0))}}).sort((a,b)=>String(b.lastDate).localeCompare(String(a.lastDate))).slice(0,30);
  }
  function compactData(since){
    const sessionById=new Map(st.sessions.map(x=>[String(x.id),x]));
    return{
      todos:st.todos.filter(x=>x.todo_date>=since).map(x=>({d:x.todo_date,k:x.todo_key,c:!!x.completed,n:x.note||null})),
      entries:st.entries.filter(x=>x.entry_date>=since).slice(-100).map(x=>({d:x.entry_date,t:x.entry_type,k:x.entry_key,p:x.payload||{}})),
      sessions:st.sessions.filter(x=>x.workout_date>=since).slice(-30).map(x=>({d:x.workout_date,w:x.workout_id,s:x.status,p:x.completion_pct??null,n:x.note||null,ck:x.client_key||null})),
      sets:st.sets.filter(x=>x.created_at?.slice(0,10)>=since).slice(-160).map(x=>{const ss=sessionById.get(String(x.session_id));return{d:x.created_at?.slice(0,10)||null,w:ss?.workout_id||null,e:x.exercise_key,i:x.set_index,kg:x.weight_kg??null,r:x.reps??null,rir:x.rir??null,c:!!x.completed,n:x.note||null}}),
      measurements:st.measurements.filter(x=>x.measured_at>=since).map(x=>({d:x.measured_at,kg:x.weight_kg??null,waist:x.waist_cm??null,n:x.note||null})),
      deterministic:st.analyses.filter(x=>x.analysis_date>=since).slice(-20).map(x=>({d:x.analysis_date,tr:x.trigger_type,se:x.severity,s:x.summary,r:x.recommendations,m:x.metrics,rv:x.rule_version}))
    };
  }
  function packet(type,question=''){
    const days=type==='full'?30:type==='weekly'?21:14,since=add(day(),-(days-1)),w=weekly();
    const p={
      format:'MYGYM_PT_REVIEW_PACKET_V1',
      requestType:type,
      generatedAt:nowIso(),
      repo:'Tu4nla/MyGym',
      supabaseProjectId:'uagixzjqwmxnxriowqas',
      sourceRevision:S.sourceUpdatedAt||null,
      user:{id:st.user?.id||null,email:st.user?.email||null,cloudConnected:!!st.user},
      question:question||null,
      intent:'Analyze this fitness context as my personal trainer/product assistant and write back useful conclusions to MyGym data.',
      writeBackContract:{
        preferred:'If connected Supabase/GitHub tools are available, update data directly after analysis.',
        analysisTable:'public.pt_analysis_snapshots',
        analysisFields:{user_id:'use packet.user.id',analysis_date:day(),trigger_type:'manual_chatgpt',severity:'info|good|warn|danger',summary:'concise conclusion',recommendations:'JSON array',metrics:'JSON object with evidence',rule_version:'chatgpt-manual-v1',client_key:`manual-chatgpt:${Date.now()}`},
        canonicalFiles:['pt-source.js','pt-data.js'],
        rule:'Only change persistent targets/program when evidence is sufficient; otherwise write analysis/recommendations only. Never expose secrets or add paid API calls.'
      },
      profile:{...(S.profile||{}),calorieTarget:D.profile?.calorieTarget,proteinTarget:D.profile?.proteinTarget,waterTargetMl:D.profile?.waterTargetMl,stepsTarget:D.profile?.stepsTarget},
      goal:S.profile?.goal||D.profile?.goal||null,
      trainingPolicy:S.trainingPolicy||{},
      equipment:{physicalCount:S.equipment?.physicalEquipmentCount||S.equipment?.confirmedFromCurrentProfile?.length||0,ids:S.equipment?.confirmedFromCurrentProfile||[]},
      current:{date:day(),plan:todayPlan(),readiness:readiness(),checkin:todayCheckin(),todo:todoStats(),waterMl:water(),weekly:w},
      exerciseProgress:exerciseProgress(since),
      data:compactData(since),
      instructionsForChatGPT:[
        'Treat deterministic safety rules as hard constraints; do not override pain/recovery safeguards.',
        'Analyze trends, not single noisy measurements. Explain evidence for any plan change.',
        'If a direct write is warranted and tools are connected, update Supabase and/or GitHub now instead of only telling me what to do.',
        'For manual analysis write a new pt_analysis_snapshots row with rule_version chatgpt-manual-v1 so the website can show it.',
        'If the request is meal-related, estimate calories/protein as a range and clearly mark uncertainty.',
        'After writes, summarize exactly what changed.'
      ]
    };
    return p;
  }
  async function copyText(text){try{await navigator.clipboard.writeText(text);return true}catch{const a=document.createElement('textarea');a.value=text;a.style.position='fixed';a.style.opacity='0';document.body.append(a);a.select();const ok=document.execCommand('copy');a.remove();return ok}}
  async function copyPacket(type,question=''){
    if(!st.user)toast('Có thể copy local, nhưng đăng nhập sẽ cho packet đầy đủ và cho phép tôi update cloud chính xác.');
    const ok=await copyText(JSON.stringify(packet(type,question),null,2));
    if(ok)toast('Đã copy packet — dán thẳng vào ChatGPT.');else alert('Không copy được. Hãy cho phép clipboard.');
  }
  function latestManual(){return[...st.analyses].filter(x=>String(x.rule_version||'').startsWith('chatgpt-manual')||String(x.trigger_type||'').includes('manual_chatgpt')).sort((a,b)=>String(a.created_at||'').localeCompare(String(b.created_at||''))).at(-1)}
  function manualUpdate(){const e=$('v5-last-update');if(!e)return;const a=latestManual();if(!a){e.innerHTML='<div class="v5-empty-state"><b>Chưa có update thủ công từ ChatGPT</b><p>Copy một packet ở trên, dán vào ChatGPT. Sau khi tôi phân tích và ghi Supabase, bấm Refresh hoặc chờ Realtime.</p></div>';return}e.innerHTML=`<div class="v5-manual-result"><div><p class="eyebrow">${esc(a.analysis_date)} • ${esc(a.severity)}</p><h3>${esc(a.summary)}</h3></div>${a.recommendations?.length?`<ul>${a.recommendations.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}<small>rule: ${esc(a.rule_version)} • trigger: ${esc(a.trigger_type)}</small></div>`}
  function bind(){
    $('v5-copy-daily').onclick=()=>copyPacket('daily');
    $('v5-copy-weekly').onclick=()=>copyPacket('weekly');
    $('v5-copy-full').onclick=()=>copyPacket('full');
    $('v5-copy-question').onclick=()=>{const q=$('v5-question').value.trim();if(!q)return toast('Nhập câu hỏi/tình huống trước.');copyPacket('question',q)};
    $('v5-copy-meal').onclick=()=>{const q=$('v5-meal-input').value.trim();if(!q)return toast('Mô tả bữa ăn trước.');copyPacket('meal',`Phân tích bữa ăn này và update data nếu hợp lý: ${q}`)};
    $('v5-refresh').onclick=loadCloud;
  }
  function pwa(){if('serviceWorker'in navigator)navigator.serviceWorker.register('./pt-sw.js').catch(console.warn);window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();st.install=e;$('v5-install')?.classList.remove('hidden')});$('v5-install').onclick=async()=>{if(!st.install)return;st.install.prompt();await st.install.userChoice;st.install=null;$('v5-install').classList.add('hidden')}}
  async function realtime(){if(st.channel){await sb.removeChannel(st.channel);st.channel=null}if(!st.user)return;const f=`user_id=eq.${st.user.id}`;let ch=sb.channel(`pt-v5-${st.user.id}-${Math.random().toString(36).slice(2,7)}`);['pt_todos','pt_daily_entries','pt_workout_sessions','pt_exercise_sets','pt_measurements','pt_analysis_snapshots'].forEach(table=>{ch=ch.on('postgres_changes',{event:'*',schema:'public',table,filter:f},()=>setTimeout(loadCloud,180))});st.channel=ch.subscribe()}
  function render(){home();week();swap();manualUpdate()}
  async function init(){
    ensureDom();bind();pwa();await loadEquipment();
    const{data:{session}}=await sb.auth.getSession();st.user=session?.user||null;
    await loadCloud();await realtime();
    sb.auth.onAuthStateChange((_e,s)=>setTimeout(async()=>{st.user=s?.user||null;await loadCloud();await realtime()},0));
  }
  init();
})();