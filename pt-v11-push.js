(()=>{
  const D=window.PT_DATA||{};
  const S=window.PT_SOURCE||{};
  const F=window.PT_FOOD_VN||{meals:[]};
  const C=window.PT_CLOUD_CONFIG||null;
  if(!C)return;
  const WORKER_URL=`${C.url}/functions/v1/pt-push-worker`;
  const $=id=>document.getElementById(id);
  const q=(s,r=document)=>r.querySelector(s);
  const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const L={get:(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch{return f}},set:(k,v)=>localStorage.setItem(k,JSON.stringify(v))};
  const st={sb:null,user:null,registration:null,subscription:null,publicKey:null,syncing:false,lastHash:'',promptOpen:false};
  const labels={breakfast:'ăn sáng',lunch:'ăn trưa',snack:'bữa xế',preworkout:'pre-workout',dinner:'ăn tối'};
  const day=()=>{const d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
  const nowIso=()=>new Date().toISOString();
  const local=name=>L.get(`mygym.v3.${name}`,[]);
  const hm=n=>`${String(Math.floor(n/60)%24).padStart(2,'0')}:${String(Math.round(n)%60).padStart(2,'0')}`;
  const isoAt=min=>{const d=new Date();d.setHours(Math.floor(min/60),Math.round(min)%60,0,0);return d.toISOString()};
  const timeFromIso=x=>{if(!x)return null;const d=new Date(x);return d.getHours()*60+d.getMinutes()+d.getSeconds()/60};
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  function toast(t){const e=$('toast');if(!e)return;e.textContent=t;e.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(()=>e.classList.remove('show'),1900)}

  async function auth(){
    if(!window.supabase)return null;
    if(!st.sb)st.sb=window.supabase.createClient(C.url,C.publishableKey,{auth:{persistSession:true,autoRefreshToken:false,detectSessionInUrl:false}});
    const{data}=await st.sb.auth.getSession();st.user=data?.session?.user||null;return st.user;
  }
  function supported(){return 'serviceWorker'in navigator&&'PushManager'in window&&'Notification'in window}
  function standalone(){return window.matchMedia?.('(display-mode: standalone)')?.matches||window.navigator.standalone===true}
  function b64ToBytes(s){const pad='='.repeat((4-s.length%4)%4),base=(s+pad).replace(/-/g,'+').replace(/_/g,'/'),raw=atob(base);return Uint8Array.from([...raw].map(c=>c.charCodeAt(0)))}
  async function publicKey(){if(st.publicKey)return st.publicKey;const r=await fetch(WORKER_URL,{cache:'no-store'});if(!r.ok)throw new Error('Không lấy được push config');const j=await r.json();if(!j.publicKey)throw new Error('Push config chưa sẵn sàng');return st.publicKey=j.publicKey}
  async function serviceWorker(){if(st.registration)return st.registration;st.registration=await navigator.serviceWorker.register('./pt-sw.js',{scope:'./'});await navigator.serviceWorker.ready;return st.registration}

  async function persistSubscription(sub){
    const u=await auth();if(!u)throw new Error('Bạn cần đăng nhập để bật nhắc nền.');
    const j=sub.toJSON(),keys=j.keys||{};
    const{error}=await st.sb.from('pt_push_subscriptions').upsert({
      user_id:u.id,endpoint:j.endpoint,p256dh:keys.p256dh,auth_key:keys.auth,
      expiration_time:j.expirationTime||null,user_agent:navigator.userAgent,
      platform:standalone()?'pwa-standalone':'browser',enabled:true,last_seen_at:nowIso(),updated_at:nowIso(),last_error:null
    },{onConflict:'user_id,endpoint'});
    if(error)throw error;
  }
  async function subscribe(){
    if(!supported())throw new Error('Thiết bị/trình duyệt này chưa hỗ trợ Web Push cho web app.');
    const u=await auth();if(!u)throw new Error('Bạn cần đăng nhập một lần trước khi bật nhắc nền.');
    let permission=Notification.permission;
    if(permission==='default')permission=await Notification.requestPermission();
    if(permission!=='granted')throw new Error('Bạn chưa cho phép thông báo.');
    const reg=await serviceWorker(),key=await publicKey();
    let sub=await reg.pushManager.getSubscription();
    if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64ToBytes(key)});
    st.subscription=sub;await persistSubscription(sub);L.set('mygym.v11.pushEnabled',true);L.set('mygym.v11.pushPromptDismissed',false);await syncQueue(true);toast('Đã bật nhắc nền ✓');closePrompt();return sub;
  }
  async function restoreSubscription(){
    if(!supported()||Notification.permission!=='granted')return null;
    try{const reg=await serviceWorker(),sub=await reg.pushManager.getSubscription();if(sub){st.subscription=sub;await persistSubscription(sub);L.set('mygym.v11.pushEnabled',true)}return sub}catch(e){console.warn('[V11 push restore]',e);return null}
  }

  function taskRecord(id){return local('entries').filter(x=>x.entry_date===day()&&x.entry_type==='assistant_task'&&x.entry_key===`v10:${id}`).at(-1)?.payload||null}
  function checkinDone(){return local('entries').some(x=>x.entry_date===day()&&x.entry_type==='checkin'&&x.entry_key==='daily-checkin')}
  function mealDone(type){return local('entries').some(x=>x.entry_date===day()&&x.entry_type==='meal'&&x.payload?.mealType===type)}
  function waterTotal(){return+local('entries').filter(x=>x.entry_date===day()&&x.entry_key==='water-total').at(-1)?.payload?.ml||0}
  function workoutSession(){return local('sessions').filter(x=>x.workout_date===day()).sort((a,b)=>String(a.updated_at||a.created_at||'').localeCompare(String(b.updated_at||b.created_at||''))).at(-1)||null}
  function workoutDone(){return['complete','partial_counted','partial-counted'].includes(String(workoutSession()?.status||''))}
  function completedSessions(){return local('sessions').filter(x=>['complete','partial_counted','partial-counted'].includes(String(x.status||'')))}
  function nextWorkoutId(){const xs=S.trainingPolicy?.sequence||['upperA','lowerA','upperB','lowerB'];return xs[completedSessions().length%xs.length]}
  function strengthToday(){const o=local('entries').filter(x=>x.entry_date===day()&&x.entry_type==='schedule_change').at(-1)?.payload;if(o?.type==='sick_or_pain'||o?.type==='skip_workout')return false;return Boolean(S.trainingPolicy?.preferredStrengthWeekdays?.includes(new Date().getDay()))}
  function mealById(id){return(F.meals||[]).find(x=>x.id===id)}
  function menuMeal(type){const s=L.get(`mygym.v6.menu.${day()}`,null),m=(s?.ids||[]).map(mealById).find(x=>x?.type===type);if(m)return m;return(F.meals||[]).find(x=>x.type===type)||null}
  function doneAt(id,kind,mealType){
    const r=taskRecord(id);if(['done','skipped'].includes(r?.status))return r.completedAt||r.skippedAt||r.updatedAt||nowIso();
    if(kind==='checkin'&&checkinDone())return local('entries').filter(x=>x.entry_date===day()&&x.entry_type==='checkin').at(-1)?.updated_at||nowIso();
    if(kind==='meal'&&mealDone(mealType))return local('entries').filter(x=>x.entry_date===day()&&x.entry_type==='meal'&&x.payload?.mealType===mealType).at(-1)?.updated_at||nowIso();
    if(kind==='workout'&&workoutDone())return workoutSession()?.ended_at||workoutSession()?.updated_at||nowIso();
    return null;
  }
  function baseTasks(){
    const bf=menuMeal('breakfast'),ln=menuMeal('lunch'),sn=menuMeal('snack'),dn=menuMeal('dinner'),strength=strengthToday(),wid=nextWorkoutId(),w=D.workouts?.[wid];
    return[
      {id:'morning-water',kind:'water',start:465,end:480,priority:2,amount:300,title:'Uống 300ml nước',body:'Bắt đầu bù nước sau khi ngủ dậy.'},
      {id:'checkin',kind:'checkin',start:480,end:510,priority:5,title:'Tôi cần hỏi bạn 1 câu',body:'Mở Trợ lý — tôi chỉ hỏi một câu để điều chỉnh ngày hôm nay.'},
      {id:'breakfast',kind:'meal',mealType:'breakfast',start:570,end:600,priority:5,title:'Đến giờ ăn sáng',body:bf?`Đề xuất: ${bf.name}`:'Mở Trợ lý để xem bữa sáng.'},
      {id:'water-1015',kind:'water',start:615,end:630,priority:1,amount:300,title:'Uống nước',body:'Tôi đang giữ nhịp nước cho bạn.'},
      {id:'lunch',kind:'meal',mealType:'lunch',start:700,end:730,priority:5,title:'Đến giờ ăn trưa',body:ln?`Đề xuất: ${ln.name}`:'Mở Trợ lý để xem bữa trưa.'},
      {id:'nap',kind:'routine',start:750,end:780,priority:2,title:'Nghỉ trưa 20–30 phút',body:'Ăn xong rồi thì dành một khoảng ngắn để nghỉ.'},
      {id:'water-1310',kind:'water',start:790,end:805,priority:1,amount:350,title:'Uống nước',body:'Bù nước sau giờ nghỉ trưa.'},
      {id:'water-1445',kind:'water',start:885,end:900,priority:1,amount:350,title:'Uống nước',body:'Giữ nhịp nước đều trong giờ làm.'},
      {id:'snack',kind:'meal',mealType:'snack',start:990,end:1020,priority:4,title:'Đến giờ bữa xế',body:sn?`Đề xuất: ${sn.name}`:'Carb + protein để chuẩn bị cho buổi tối.'},
      {id:'water-1720',kind:'water',start:1040,end:1055,priority:1,amount:350,title:'Uống nước',body:'Đừng để sát giờ tập mới uống bù.'},
      {id:'water-1845',kind:'water',start:1125,end:1140,priority:1,amount:350,title:'Uống nước',body:'Hydration trước khi về nhà.'},
      {id:'water-1930',kind:'water',start:1170,end:1185,priority:2,amount:300,title:'Uống nước trước tập',body:'Một lượng vừa phải trước khi vào gym.'},
      strength?{id:'workout',kind:'workout',start:1200,end:1290,priority:6,title:`Đến giờ tập ${w?.title||wid}`,body:'Mở Trợ lý để bắt đầu hoặc báo nếu hôm nay bị trễ.'}:{id:'recovery',kind:'routine',start:1200,end:1245,priority:3,title:'Recovery nhẹ',body:'Đi bộ hoặc vận động nhẹ 30–45 phút.'},
      {id:'dinner',kind:'meal',mealType:'dinner',start:1295,end:1325,priority:5,title:'Đến giờ ăn tối',body:dn?`Đề xuất: ${dn.name}`:'Mở Trợ lý để xem bữa tối.'},
      {id:'winddown',kind:'routine',start:1395,end:1410,priority:3,title:'Chuẩn bị ngủ',body:'Giảm màn hình và ánh sáng mạnh để vào nhịp ngủ.'}
    ];
  }
  function adjustedTasks(){
    const xs=baseTasks().map(x=>({...x,baseStart:x.start,baseEnd:x.end}));
    const lunchDone=doneAt('lunch','meal','lunch'),workDone=doneAt('workout','workout'),lunchMin=timeFromIso(lunchDone),workMin=timeFromIso(workDone);
    for(const t of xs){
      const r=taskRecord(t.id),defer=timeFromIso(r?.deferUntil);if(defer!=null){const dur=t.end-t.start;t.start=Math.max(t.start,defer);t.end=t.start+dur}
      if(t.id==='nap'&&lunchMin!=null&&lunchMin+20>t.start){t.start=Math.min(lunchMin+20,785);t.end=Math.min(t.start+25,810)}
      if(t.id==='dinner'&&workMin!=null&&workMin+10>t.start){const dur=t.end-t.start;t.start=Math.min(workMin+10,1345);t.end=t.start+dur}
    }
    const target=+(D.profile?.waterTargetMl||2500),already=waterTotal(),now=new Date(),cur=now.getHours()*60+now.getMinutes(),pending=xs.filter(x=>x.kind==='water'&&!doneAt(x.id,x.kind)&&x.end>=cur),remaining=Math.max(0,target-already);
    pending.forEach((t,i)=>{const leftCount=pending.length-i,raw=remaining/Math.max(1,leftCount),amount=clamp(Math.round(raw/50)*50,200,450);t.amount=amount;t.title=`Uống ${amount}ml nước`});
    return xs;
  }
  function isDone(t){return Boolean(doneAt(t.id,t.kind,t.mealType))}
  function cumulativeWater(t,tasks){let n=0;for(const x of tasks){if(x.kind==='water')n+=x.amount||0;if(x.id===t.id)break}return n}
  function keyTime(iso){return iso.replace(/[-:]/g,'').slice(0,13)}
  function intents(){
    const tasks=adjustedTasks(),date=day(),out=[];
    for(const t of tasks){
      if(isDone(t))continue;
      const due=isoAt(t.start),payload={kind:t.kind,mealType:t.mealType||null,requiredWaterMl:t.kind==='water'?cumulativeWater(t,tasks):null,plannedStart:hm(t.start),plannedEnd:hm(t.end)};
      out.push({notification_key:`${date}:${t.id}:start:${keyTime(due)}`,task_date:date,task_id:t.id,phase:'start',due_at:due,title:t.title,body:t.body,url:'./pt.html#assistant',priority:t.priority,payload});
      if(['checkin','meal','workout'].includes(t.kind)){
        const od=isoAt(t.end+10);out.push({notification_key:`${date}:${t.id}:overdue:${keyTime(od)}`,task_date:date,task_id:t.id,phase:'overdue',due_at:od,title:`Bạn đang trễ ${t.kind==='meal'?(labels[t.mealType]||'một bữa'):t.kind==='workout'?'buổi tập':'check-in'}`,body:'Mở Trợ lý — tôi sẽ hỏi một quyết định và tự dời các việc sau.',url:'./pt.html#assistant',priority:t.priority+1,payload});
      }
    }
    return out;
  }
  function dataHash(){return['entries','sessions','sets','measurements'].map(x=>localStorage.getItem(`mygym.v3.${x}`)||'').join('|')+'|'+(localStorage.getItem(`mygym.v6.menu.${day()}`)||'')}
  async function syncQueue(force=false){
    if(st.syncing||!st.subscription)return;const h=dataHash();if(!force&&h===st.lastHash)return;st.syncing=true;
    try{
      const u=await auth();if(!u)return;const desired=intents(),keys=new Set(desired.map(x=>x.notification_key));
      const{data:existing,error}=await st.sb.from('pt_notification_queue').select('id,notification_key,status').eq('user_id',u.id).eq('task_date',day());if(error)throw error;
      const stale=(existing||[]).filter(x=>x.status==='pending'&&!keys.has(x.notification_key)).map(x=>x.id);if(stale.length)await st.sb.from('pt_notification_queue').update({status:'cancelled',updated_at:nowIso(),last_error:'superseded by assistant replan'}).in('id',stale);
      const existingMap=new Map((existing||[]).map(x=>[x.notification_key,x.status]));
      const rows=desired.filter(x=>!['sent','cancelled'].includes(existingMap.get(x.notification_key))).map(x=>({...x,user_id:u.id,status:'pending',attempts:0,updated_at:nowIso()}));
      if(rows.length){const{error:e}=await st.sb.from('pt_notification_queue').upsert(rows,{onConflict:'user_id,notification_key'});if(e)throw e}
      st.lastHash=h;L.set('mygym.v11.lastQueueSync',nowIso());
    }catch(e){console.warn('[V11 queue]',e)}finally{st.syncing=false}
  }

  function closePrompt(){q('.v11-push-overlay')?.remove();st.promptOpen=false}
  function prompt(kind='enable'){
    if(st.promptOpen)return;st.promptOpen=true;const e=document.createElement('div');e.className='v11-push-overlay';
    if(kind==='install')e.innerHTML=`<div class="v11-push-card"><p class="eyebrow">NHẮC KHI APP ĐÃ ĐÓNG</p><h2>Muốn tôi chủ động nhắc bạn?</h2><p>Trên iPhone, hãy mở trang này từ biểu tượng <b>My Assistant</b> đã thêm vào Màn hình chính. Sau đó tôi mới có thể xin quyền Web Push.</p><div class="v11-push-actions"><button class="primary" data-v11-close>Đã hiểu</button><button class="secondary" data-v11-later>Để sau</button></div></div>`;
    else if(kind==='login')e.innerHTML=`<div class="v11-push-card"><p class="eyebrow">THIẾT LẬP MỘT LẦN</p><h2>Đăng nhập để tôi nhắc trên thiết bị này?</h2><p>Subscription cần gắn với tài khoản để việc bạn đã Done trên thiết bị khác không bị nhắc lại.</p><div class="v11-push-actions"><button class="primary" data-v11-login>Mở đăng nhập</button><button class="secondary" data-v11-later>Để sau</button></div></div>`;
    else e.innerHTML=`<div class="v11-push-card"><p class="eyebrow">THIẾT LẬP MỘT LẦN</p><h2>Bật nhắc khi bạn đóng app?</h2><p>Tôi sẽ chỉ gửi việc cần xử lý theo lịch Trợ lý, tối đa một notification trong mỗi khoảng 15 phút để tránh spam.</p><div class="v11-push-actions"><button class="primary" data-v11-enable>🔔 Bật nhắc</button><button class="secondary" data-v11-later>Để sau</button></div></div>`;
    document.body.appendChild(e);
    q('[data-v11-enable]',e)?.addEventListener('click',async b=>{b.currentTarget.disabled=true;b.currentTarget.textContent='Đang bật…';try{await subscribe()}catch(err){toast(err?.message||String(err));b.currentTarget.disabled=false;b.currentTarget.textContent='🔔 Bật nhắc'}});
    q('[data-v11-close]',e)?.addEventListener('click',()=>{L.set('mygym.v11.pushPromptDismissed',true);closePrompt()});
    q('[data-v11-later]',e)?.addEventListener('click',()=>{L.set('mygym.v11.pushPromptDismissed',true);L.set('mygym.v11.pushPromptLaterAt',Date.now());closePrompt()});
    q('[data-v11-login]',e)?.addEventListener('click',()=>{closePrompt();q('[data-v10-tab="coach"]')?.click();setTimeout(()=>$('auth-box')?.scrollIntoView({behavior:'smooth',block:'center'}),120)});
  }
  function urgentNow(){const x=q('.v10-focus');return Boolean(x?.classList.contains('danger')||x?.classList.contains('active'))}
  async function maybePrompt(){
    if(!supported()){
      if(!L.get('mygym.v11.pushPromptDismissed',false)&&!standalone()&&!urgentNow())prompt('install');return;
    }
    if(Notification.permission==='denied')return;
    const u=await auth();if(!u){if(!L.get('mygym.v11.pushPromptDismissed',false)&&!urgentNow())prompt('login');return}
    const sub=await restoreSubscription();if(sub){await syncQueue(true);return}
    if(Notification.permission==='default'&&!L.get('mygym.v11.pushPromptDismissed',false)&&!urgentNow())prompt('enable');
  }
  function watch(){
    window.addEventListener('storage',e=>{if(e.key?.startsWith('mygym.v3.')||e.key?.startsWith('mygym.v6.menu.'))syncQueue()});
    window.addEventListener('mygym:v9-menu-changed',()=>syncQueue(true));
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){restoreSubscription().then(()=>syncQueue(true));maybePrompt()}});
    setInterval(()=>syncQueue(),60000);
  }
  async function init(){
    try{await auth();if(supported())await serviceWorker();watch();setTimeout(maybePrompt,1400);setTimeout(()=>syncQueue(true),2600)}catch(e){console.warn('[V11 init]',e)}
  }
  init();
})();