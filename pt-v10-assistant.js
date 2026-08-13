(()=>{
  const D=window.PT_DATA||{};
  const S=window.PT_SOURCE||{};
  const F=window.PT_FOOD_VN||{meals:[]};
  const C=window.PT_CLOUD_CONFIG||null;
  const $=id=>document.getElementById(id);
  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const nowIso=()=>new Date().toISOString();
  const day=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const L={get:(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch{return f}},set:(k,v)=>localStorage.setItem(k,JSON.stringify(v))};
  const st={sb:null,user:null,activeTab:'assistant',lastMinute:-1,checkinDraft:null,pendingOtherMeal:null};
  const tabDefs=[['assistant','Trợ lý'],['workout','Workout'],['plan','Kế hoạch'],['journal','Nhật ký'],['progress','Tiến độ'],['coach','PT']];
  const labels={breakfast:'Bữa sáng',lunch:'Bữa trưa',snack:'Bữa xế',preworkout:'Pre-workout',dinner:'Bữa tối'};

  function local(name){return L.get(`mygym.v3.${name}`,[])}
  function saveLocal(name,rows){L.set(`mygym.v3.${name}`,rows)}
  function hmToMin(x){const[a,b]=String(x).split(':').map(Number);return a*60+b}
  function minToHm(n){n=Math.max(0,Math.round(n));return`${String(Math.floor(n/60)%24).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`}
  function nowMin(){const d=new Date();return d.getHours()*60+d.getMinutes()+d.getSeconds()/60}
  function timeFromIso(x){if(!x)return null;const d=new Date(x);return d.getHours()*60+d.getMinutes()+d.getSeconds()/60}
  function addMinutesIso(min){const d=new Date();d.setMinutes(d.getMinutes()+min);return d.toISOString()}
  function humanDelta(n){n=Math.max(0,Math.round(n));if(n<60)return`${n} phút`;const h=Math.floor(n/60),m=n%60;return m?`${h}h ${m}p`:`${h}h`}
  function seed(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return Math.abs(h)}
  function toast(t){const e=$('toast');if(!e)return;e.textContent=t;e.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(()=>e.classList.remove('show'),1700)}

  async function auth(){if(!C||!window.supabase)return null;if(!st.sb)st.sb=window.supabase.createClient(C.url,C.publishableKey,{auth:{persistSession:true,autoRefreshToken:false,detectSessionInUrl:false}});const{data}=await st.sb.auth.getSession();st.user=data?.session?.user||null;return st.user}
  async function saveEntry(type,key,payload){
    let rows=local('entries'),i=rows.findIndex(x=>x.entry_date===day()&&x.entry_type===type&&x.entry_key===key),base=i>=0?rows[i]:{};
    const row={...base,user_id:base.user_id||st.user?.id||null,entry_date:day(),entry_type:type,entry_key:key,payload,created_at:base.created_at||nowIso(),updated_at:nowIso()};
    if(i>=0)rows[i]=row;else rows.push(row);saveLocal('entries',rows);
    const u=await auth();if(u){const{error}=await st.sb.from('pt_daily_entries').upsert({user_id:u.id,entry_date:day(),entry_type:type,entry_key:key,payload},{onConflict:'user_id,entry_date,entry_type,entry_key'});if(error)console.warn('[V10 save]',error)}
    return row;
  }
  async function saveTask(id,patch){const old=taskRecord(id)||{};return saveEntry('assistant_task',`v10:${id}`,{...old,...patch,taskId:id,updatedAt:nowIso(),source:'v10-assistant'})}

  function taskRecord(id){return local('entries').filter(x=>x.entry_date===day()&&x.entry_type==='assistant_task'&&x.entry_key===`v10:${id}`).at(-1)?.payload||null}
  function mealById(id){return(F.meals||[]).find(x=>x.id===id)}
  function menuMeal(type){const saved=L.get(`mygym.v6.menu.${day()}`,null),m=(saved?.ids||[]).map(mealById).find(x=>x?.type===type);if(m)return m;let pool=(F.meals||[]).filter(x=>x.type===type);if(type==='breakfast'){const office=pool.filter(x=>x.office===true||(x.tags||[]).includes('office-friendly'));if(office.length)pool=office}return pool.length?pool[seed(`${day()}:${type}:v10`)%pool.length]:null}
  function completedSessions(){return local('sessions').filter(x=>['complete','partial_counted'].includes(String(x.status||'').replaceAll('-','_')))}
  function nextWorkoutId(){const seq=S.trainingPolicy?.sequence||['upperA','lowerA','upperB','lowerB'];return seq[completedSessions().length%seq.length]}
  function strengthToday(){const o=local('entries').filter(x=>x.entry_date===day()&&x.entry_type==='schedule_change').at(-1)?.payload;if(o?.type==='sick_or_pain'||o?.type==='skip_workout')return false;return Boolean(S.trainingPolicy?.preferredStrengthWeekdays?.includes(new Date().getDay()))}
  function workoutTitle(){const id=nextWorkoutId();return D.workouts?.[id]?.title||id||'Workout'}
  function workoutSession(){return local('sessions').filter(x=>x.workout_date===day()).sort((a,b)=>String(a.updated_at||a.created_at||'').localeCompare(String(b.updated_at||b.created_at||''))).at(-1)||null}
  function workoutDone(){const s=workoutSession();return Boolean(s&&['complete','partial_counted'].includes(String(s.status||'').replaceAll('-','_')))}
  function workoutStarted(){const s=workoutSession();return Boolean(s&&String(s.status||'').replaceAll('-','_')==='in_progress')}
  function checkinEntry(){return local('entries').find(x=>x.entry_date===day()&&x.entry_type==='checkin'&&x.entry_key==='daily-checkin')||null}
  function mealEntry(type){return local('entries').filter(x=>x.entry_date===day()&&x.entry_type==='meal'&&x.payload?.mealType===type).at(-1)||null}
  function waterTotal(){return+local('entries').filter(x=>x.entry_date===day()&&x.entry_key==='water-total').at(-1)?.payload?.ml||0}

  function baseTasks(){
    const strength=strengthToday(),bf=menuMeal('breakfast'),ln=menuMeal('lunch'),sn=menuMeal('snack'),dn=menuMeal('dinner');
    return[
      {id:'morning-water',kind:'water',baseStart:465,baseEnd:480,priority:2,amount:300,title:'Uống nước buổi sáng',note:'Khởi động ngày bằng một cốc nước.'},
      {id:'checkin',kind:'checkin',baseStart:480,baseEnd:510,priority:5,title:'Check-in nhanh',note:'Tôi cần 3 câu trả lời ngắn để điều chỉnh ngày hôm nay.'},
      {id:'breakfast',kind:'meal',mealType:'breakfast',food:bf,baseStart:570,baseEnd:600,priority:5,title:bf?`Ăn sáng: ${bf.name}`:'Ăn sáng',note:bf?`≈ ${bf.kcal} kcal • ${bf.protein}g protein`:'Ưu tiên một bữa gọn và đủ protein.'},
      {id:'water-1015',kind:'water',baseStart:615,baseEnd:630,priority:1,amount:300,title:'Uống nước',note:'Tôi sẽ tự tăng/giảm lượng theo phần còn thiếu trong ngày.'},
      {id:'lunch',kind:'meal',mealType:'lunch',food:ln,baseStart:700,baseEnd:730,priority:5,title:ln?`Ăn trưa: ${ln.name}`:'Ăn trưa',note:ln?`≈ ${ln.kcal} kcal • ${ln.protein}g protein`:'Cơm vừa, nguồn protein rõ ràng và rau.'},
      {id:'nap',kind:'routine',baseStart:750,baseEnd:780,priority:2,title:'Ngủ trưa 20–30 phút',note:'Nếu ăn trưa muộn tôi sẽ tự dời nap.'},
      {id:'water-1310',kind:'water',baseStart:790,baseEnd:805,priority:1,amount:350,title:'Uống nước',note:'Bù nước sau giờ nghỉ trưa.'},
      {id:'water-1445',kind:'water',baseStart:885,baseEnd:900,priority:1,amount:350,title:'Uống nước',note:'Giữ nước rải đều trong giờ làm.'},
      {id:'snack',kind:'meal',mealType:'snack',food:sn,baseStart:990,baseEnd:1020,priority:4,title:sn?`Bữa xế: ${sn.name}`:'Bữa xế',note:sn?`≈ ${sn.kcal} kcal • ${sn.protein}g protein`:'Carb + protein để chuẩn bị cho buổi tối.'},
      {id:'water-1720',kind:'water',baseStart:1040,baseEnd:1055,priority:1,amount:350,title:'Uống nước',note:'Tránh dồn quá nhiều nước sát giờ tập.'},
      {id:'water-1845',kind:'water',baseStart:1125,baseEnd:1140,priority:1,amount:350,title:'Uống nước',note:'Hydration trước khi về nhà.'},
      {id:'water-1930',kind:'water',baseStart:1170,baseEnd:1185,priority:2,amount:300,title:'Uống nước trước tập',note:'Một lượng vừa phải trước khi vào gym.'},
      strength?{id:'workout',kind:'workout',baseStart:1200,baseEnd:1290,priority:6,title:`Tập ${workoutTitle()}`,note:'Khi tới giờ, tôi sẽ đưa bạn thẳng vào Smart Workout Player.'}:{id:'recovery',kind:'routine',baseStart:1200,baseEnd:1245,priority:3,title:'Đi bộ / recovery nhẹ',note:'Ngày nghỉ không cần bù strength.'},
      {id:'dinner',kind:'meal',mealType:'dinner',food:dn,baseStart:1295,baseEnd:1325,priority:5,title:dn?`Ăn tối: ${dn.name}`:'Ăn tối',note:dn?`≈ ${dn.kcal} kcal • ${dn.protein}g protein`:'Bữa vừa phải, đủ protein sau tập.'},
      {id:'winddown',kind:'routine',baseStart:1395,baseEnd:1410,priority:3,title:'Wind-down để ngủ',note:'Giảm màn hình và ánh sáng mạnh trước giờ ngủ.'}
    ];
  }

  function nativeDone(t){
    if(t.kind==='checkin')return checkinEntry()?.updated_at||checkinEntry()?.created_at||null;
    if(t.kind==='meal')return mealEntry(t.mealType)?.updated_at||mealEntry(t.mealType)?.created_at||null;
    if(t.kind==='workout'&&workoutDone())return workoutSession()?.ended_at||workoutSession()?.updated_at||null;
    if(t.kind==='water'){let need=0;for(const x of baseTasks()){if(x.kind==='water')need+=x.amount||0;if(x.id===t.id)break}if(waterTotal()>=need)return local('entries').filter(x=>x.entry_date===day()&&x.entry_key==='water-total').at(-1)?.updated_at||nowIso()}
    return null;
  }
  function doneAt(t){const r=taskRecord(t.id);if(r?.status==='done')return r.completedAt||r.actualAt||r.updatedAt||null;return nativeDone(t)}
  function isDone(t){return Boolean(doneAt(t)||taskRecord(t.id)?.status==='skipped')}

  function adjustedTasks(){
    const xs=baseTasks().map(x=>({...x,start:x.baseStart,end:x.baseEnd,record:taskRecord(x.id)}));
    const lunchDone=doneAt(xs.find(x=>x.id==='lunch')),workDone=doneAt(xs.find(x=>x.id==='workout'));
    const lunchMin=timeFromIso(lunchDone),workMin=timeFromIso(workDone);
    for(const t of xs){
      const defer=timeFromIso(t.record?.deferUntil);if(defer!=null){const dur=t.end-t.start;t.start=Math.max(t.start,defer);t.end=t.start+dur;t.adjustReason='Bạn đã dời việc này.'}
      if(t.id==='nap'&&lunchMin!=null){const desired=lunchMin+20;if(desired>t.start){t.start=Math.min(desired,785);t.end=Math.min(t.start+25,810);t.adjustReason='Dời theo giờ ăn trưa thực tế.'}}
      if(t.id==='dinner'&&workMin!=null){const desired=workMin+10;if(desired>t.start){const dur=t.end-t.start;t.start=Math.min(desired,1345);t.end=t.start+dur;t.adjustReason='Dời theo giờ kết thúc workout thực tế.'}}
    }
    for(let i=0;i<xs.length;i++){
      const t=xs[i];if(t.kind!=='water')continue;
      const prevMeals=xs.slice(0,i).filter(x=>x.kind==='meal');const prev=prevMeals.at(-1),pm=prev&&timeFromIso(doneAt(prev));
      if(pm!=null&&t.start<pm+25){const dur=t.end-t.start;t.start=pm+25;t.end=t.start+dur;t.adjustReason='Dời 25 phút sau bữa ăn thực tế.'}
    }
    const target=+(D.profile?.waterTargetMl||2500),already=waterTotal(),pendingWater=xs.filter(x=>x.kind==='water'&&!isDone(x)&&x.end>=nowMin()),remaining=Math.max(0,target-already);
    pendingWater.forEach((t,i)=>{const raw=remaining/Math.max(1,pendingWater.length),amount=clamp(Math.round(raw/50)*50,200,450);t.amount=Math.min(amount,Math.max(0,remaining-pendingWater.slice(i+1).length*200)||amount)});
    return xs;
  }

  function autoAdjust(tasks){
    const n=nowMin(),notes=[];
    for(const t of tasks){if(isDone(t)||n<=t.end)continue;if(t.kind==='water')notes.push(`${minToHm(t.baseStart)} nước → chia vào các mốc nước còn lại`);else if(t.kind==='routine'&&t.id!=='winddown'&&n>t.end+45)notes.push(`${t.title} đã qua khung giờ; không ép làm bù`)}
    return notes;
  }

  function checkinQuestion(){
    if(checkinEntry())return null;
    const draft=st.checkinDraft||L.get(`mygym.v10.checkin.${day()}`,{});st.checkinDraft=draft;
    if(draft.sleepHours==null)return{type:'question',taskId:'checkin',tone:'ask',kicker:'TÔI CẦN BIẾT 1 THỨ',title:'Tối qua bạn ngủ bao nhiêu giờ?',note:'Chỉ câu này trước. Trả lời xong tôi mới hỏi tiếp.',choices:[5.5,6,6.5,7,7.5,8,8.5].map(x=>({label:`${x}h`,value:String(x),action:'checkin-sleep'}))};
    if(draft.energy==null)return{type:'question',taskId:'checkin',tone:'ask',kicker:'CÂU 2 / 3',title:'Năng lượng của bạn lúc này thế nào?',note:`Bạn đã ngủ ${draft.sleepHours}h.`,choices:[1,2,3,4,5].map(x=>({label:`${x}/5`,value:String(x),action:'checkin-energy'}))};
    if(draft.soreness==null)return{type:'question',taskId:'checkin',tone:'ask',kicker:'CÂU 3 / 3',title:'Mức đau/mỏi cơ hiện tại?',note:'Nếu là đau bất thường, chọn mức 4 để tôi không đẩy buổi tập.',choices:[{label:'Nhẹ',value:'1'},{label:'Vừa',value:'2'},{label:'Nhiều',value:'3'},{label:'Đau bất thường',value:'4'}].map(x=>({...x,action:'checkin-soreness'}))};
    return null;
  }
  async function answerCheckin(field,value){const d=st.checkinDraft||{};d[field]=+value;st.checkinDraft=d;L.set(`mygym.v10.checkin.${day()}`,d);if(d.sleepHours!=null&&d.energy!=null&&d.soreness!=null){await saveEntry('checkin','daily-checkin',{sleepHours:d.sleepHours,energy:d.energy,soreness:d.soreness,sleepQuality:3,source:'v10-conversation',time:nowIso()});await saveTask('checkin',{status:'done',completedAt:nowIso()});L.set(`mygym.v10.checkin.${day()}`,{});st.checkinDraft={};toast('Tôi đã điều chỉnh kế hoạch theo check-in ✓')}renderAssistant()}

  function taskState(t){const n=nowMin();if(isDone(t))return'done';if(t.record?.status==='in_progress')return'in_progress';if(n>t.end)return'overdue';if(n>=t.start)return'active';return'future'}
  function missedDecision(tasks){const n=nowMin();const overdue=tasks.filter(t=>taskState(t)==='overdue'&&!['water'].includes(t.kind));
    const meal=overdue.filter(t=>t.kind==='meal').sort((a,b)=>b.priority-a.priority)[0];if(meal&&n-meal.end<150)return{type:'decision',task:meal,tone:'danger',kicker:'BẠN ĐÃ BỎ LỠ MỘT VIỆC',title:`Bạn chưa ${labels[meal.mealType]?.toLowerCase()||'ăn'} trong khung ${minToHm(meal.start)}–${minToHm(meal.end)}. Bây giờ ăn được không?`,note:'Tôi sẽ tự dời nước/nap hoặc các việc phụ thuộc sau khi bạn chọn.',choices:[{label:'Ăn ngay',action:'meal-now',value:meal.id},{label:'Dời 20 phút',action:'defer-20',value:meal.id},{label:'Bỏ bữa',action:'skip-task',value:meal.id}]};
    const workout=overdue.find(t=>t.kind==='workout');if(workout&&!workoutDone())return{type:'decision',task:workout,tone:'danger',kicker:'BUỔI TẬP ĐANG TRỄ',title:'Bạn còn bao nhiêu thời gian để tập hôm nay?',note:'Tôi sẽ rút giáo án trực tiếp trong Workout Player, không bắt bạn tự chỉnh.',choices:[{label:'90 phút',action:'workout-budget',value:'full'},{label:'60 phút',action:'workout-budget',value:'60'},{label:'45 phút',action:'workout-budget',value:'45'},{label:'30 phút',action:'workout-budget',value:'30'},{label:'Hôm nay nghỉ',action:'skip-workout',value:'workout'}]};
    return null;
  }

  function activeOrNext(tasks){const pending=tasks.filter(t=>!isDone(t));const inProgress=pending.find(t=>taskState(t)==='in_progress'||(t.kind==='workout'&&workoutStarted()));if(inProgress)return inProgress;const active=pending.filter(t=>taskState(t)==='active').sort((a,b)=>b.priority-a.priority)[0];if(active)return active;return pending.filter(t=>taskState(t)==='future').sort((a,b)=>a.start-b.start)[0]||null}
  function promptForTask(t){if(!t)return{type:'done',tone:'good',kicker:'HÔM NAY XONG RỒI',title:'Bạn không còn việc nào cần tôi nhắc.',note:'Tôi sẽ tiếp tục theo dõi tới giờ ngủ.'};const s=taskState(t),time=`${minToHm(t.start)}–${minToHm(t.end)}`;
    if(t.kind==='water'){return{type:'task',task:t,tone:s==='active'?'active':'future',kicker:s==='active'?'LÀM VIỆC NÀY BÂY GIỜ':'VIỆC TIẾP THEO',title:`${s==='future'?minToHm(t.start)+' · ':''}Uống ${t.amount||300}ml nước`,note:t.adjustReason||`Hiện đã ghi ${waterTotal()}ml. Tôi đang chia phần còn lại để không phải uống dồn.`,choices:s==='active'?[{label:`Đã uống ${t.amount||300}ml`,action:'water-done',value:t.id}]:[]};}
    if(t.kind==='meal'){return{type:'task',task:t,tone:s==='active'?'active':'future',kicker:s==='active'?'ĐẾN GIỜ ĂN':'VIỆC TIẾP THEO',title:`${s==='future'?minToHm(t.start)+' · ':''}${t.title}`,note:t.adjustReason||t.note,choices:s==='active'?[{label:'Đã ăn món này',action:'meal-done',value:t.id},{label:'Tôi ăn món khác',action:'meal-other',value:t.id}]:[]};}
    if(t.kind==='workout'){return{type:'task',task:t,tone:s==='active'?'active':'future',kicker:s==='active'?'ĐẾN GIỜ TẬP':'VIỆC TIẾP THEO',title:`${s==='future'?minToHm(t.start)+' · ':''}${t.title}`,note:workoutStarted()?'Buổi tập đang diễn ra. Quay lại player để tiếp tục.':t.note,choices:s==='active'?[{label:workoutStarted()?'Tiếp tục workout':'Bắt đầu workout',action:'open-workout',value:t.id}]:[]};}
    if(t.kind==='routine'){return{type:'task',task:t,tone:s==='active'?'active':'future',kicker:s==='active'?'LÀM VIỆC NÀY BÂY GIỜ':'VIỆC TIẾP THEO',title:`${s==='future'?minToHm(t.start)+' · ':''}${t.title}`,note:t.adjustReason||t.note,choices:s==='active'?[{label:'Done',action:'task-done',value:t.id},{label:'Dời 15 phút',action:'defer-15',value:t.id}]:[]};}
    return{type:'task',task:t,tone:'future',kicker:'VIỆC TIẾP THEO',title:`${time} · ${t.title}`,note:t.note};
  }

  function currentPrompt(){const tasks=adjustedTasks(),n=nowMin(),notes=autoAdjust(tasks);const missed=missedDecision(tasks);if(missed)return{prompt:missed,tasks,notes};const critical=tasks.filter(t=>!isDone(t)&&taskState(t)==='active'&&['meal','workout'].includes(t.kind)).sort((a,b)=>b.priority-a.priority)[0];if(critical)return{prompt:promptForTask(critical),tasks,notes};const cq=checkinQuestion();if(cq&&n>=480&&n<720)return{prompt:cq,tasks,notes};return{prompt:promptForTask(activeOrNext(tasks)),tasks,notes}}

  async function markWater(id){const tasks=adjustedTasks(),t=tasks.find(x=>x.id===id);if(!t)return;const amount=t.amount||300;await saveEntry('activity','water-total',{ml:waterTotal()+amount,source:'v10-assistant',lastAmount:amount,lastAt:nowIso()});await saveTask(id,{status:'done',completedAt:nowIso(),actualAmount:amount,plannedStart:minToHm(t.start)});toast(`Đã ghi ${amount}ml ✓`);renderAssistant()}
  async function logRecommendedMeal(id){const t=adjustedTasks().find(x=>x.id===id);if(!t?.food)return;await saveEntry('meal',`v10:${id}`,{mealId:t.food.id,name:t.food.name,mealType:t.mealType,kcal:t.food.kcal,protein:t.food.protein,carbs:t.food.carbs,fat:t.food.fat,estimated:true,source:'v10-assistant',time:nowIso()});await saveTask(id,{status:'done',completedAt:nowIso(),plannedStart:minToHm(t.start),plannedEnd:minToHm(t.end),mealId:t.food.id});toast('Đã lưu bữa ăn và giờ thực tế ✓');renderAssistant()}
  function askOtherMeal(id){st.pendingOtherMeal=id;renderAssistant()}
  async function submitOtherMeal(name){const id=st.pendingOtherMeal,t=adjustedTasks().find(x=>x.id===id);if(!t||!name.trim())return;const text=name.trim().toLowerCase(),match=(F.meals||[]).find(x=>x.type===t.mealType&&(x.name.toLowerCase().includes(text)||text.includes(x.name.toLowerCase())));await saveEntry('meal',`v10:${id}`,{mealId:match?.id||null,name:name.trim(),mealType:t.mealType,kcal:match?.kcal||0,protein:match?.protein||0,carbs:match?.carbs||0,fat:match?.fat||0,estimated:Boolean(match),source:'v10-assistant-other',time:nowIso()});await saveTask(id,{status:'done',completedAt:nowIso(),actualMeal:name.trim(),matchedMealId:match?.id||null});st.pendingOtherMeal=null;toast(match?'Tôi đã nhận diện món và lưu macro ✓':'Đã lưu món; macro để trống vì chưa nhận diện chắc chắn');renderAssistant()}
  async function deferTask(id,min){await saveTask(id,{status:'deferred',deferUntil:addMinutesIso(min),deferredAt:nowIso()});toast(`Đã dời ${min} phút`);renderAssistant()}
  async function skipTask(id){await saveTask(id,{status:'skipped',skippedAt:nowIso()});toast('Đã bỏ qua; tôi sẽ tính lại phần còn lại');renderAssistant()}
  async function doneRoutine(id){await saveTask(id,{status:'done',completedAt:nowIso()});toast('Đã xong ✓');renderAssistant()}
  async function mealNow(id){const t=adjustedTasks().find(x=>x.id===id);if(!t)return;await saveTask(id,{status:'deferred',deferUntil:nowIso(),recoveryDecision:'eat_now',decisionAt:nowIso()});renderAssistant()}
  async function workoutBudget(v){L.set('mygym.v8.timeBudget',v==='full'?'full':+v);await saveTask('workout',{status:'in_progress',startedAt:nowIso(),selectedBudget:v});openWorkout()}
  async function skipWorkout(){await saveEntry('schedule_change','assistant-skip-workout',{type:'skip_workout',note:'Bỏ buổi theo quyết định tại Trợ lý V10',source:'v10-assistant',time:nowIso()});await saveTask('workout',{status:'skipped',skippedAt:nowIso()});toast('Đã nghỉ buổi hôm nay; rolling sequence được giữ nguyên');renderAssistant()}

  function nextAfter(tasks,current){const pending=tasks.filter(t=>!isDone(t)&&t.id!==current?.id&&t.start>=nowMin()).sort((a,b)=>a.start-b.start);return pending[0]||null}
  function missedCount(tasks){return tasks.filter(t=>taskState(t)==='overdue'&&!isDone(t)).length}
  function doneCount(tasks){return tasks.filter(isDone).length}
  function statusText(tasks,prompt){const missed=missedCount(tasks),done=doneCount(tasks);if(prompt?.task&&taskState(prompt.task)==='in_progress')return'Đang làm';if(missed)return`${missed} việc trễ đang được tôi xử lý`;return`${done}/${tasks.length} việc đã xử lý`}

  function choiceHtml(c){return`<button class="${c.action==='skip-task'||c.action==='skip-workout'?'secondary':'primary'}" data-v10-action="${esc(c.action)}" data-v10-value="${esc(c.value??'')}">${esc(c.label)}</button>`}
  function renderPrompt(p,tasks,notes){
    const next=nextAfter(tasks,p.task),root=$('v10-assistant-root');if(!root)return;
    const now=new Date(),date=new Intl.DateTimeFormat('vi-VN',{weekday:'long',day:'2-digit',month:'2-digit'}).format(now);
    const missed=missedCount(tasks),note=notes[0]||'';
    root.innerHTML=`<section class="v10-clock"><div class="v10-clock-top"><span><i></i> TRỢ LÝ ĐANG THEO DÕI</span><span>${esc(date)}</span></div><div id="v10-clock-text" class="v10-clock-text"></div><div class="v10-status-row"><span>${esc(statusText(tasks,p))}</span>${missed?`<span class="danger">${missed} trễ</span>`:'<span class="good">đang đúng nhịp</span>'}</div></section><section class="v10-focus ${esc(p.tone||'')}"><div class="v10-assistant-line"><div class="v10-avatar">PT</div><div><p class="eyebrow">${esc(p.kicker||'TRỢ LÝ')}</p><h2>${esc(p.title||'')}</h2></div></div>${p.note?`<p class="v10-note">${esc(p.note)}</p>`:''}${st.pendingOtherMeal?`<div class="v10-answer"><label>Bạn vừa ăn gì?</label><div class="v10-answer-row"><input id="v10-other-meal" placeholder="Ví dụ: cơm gà xối mỡ"><button id="v10-other-submit" class="primary">Lưu</button></div><small>Chỉ cần tên món. Nếu khớp catalog tôi tự lấy macro; không khớp thì tôi lưu tên trước.</small></div>`:''}${!st.pendingOtherMeal&&(p.choices||[]).length?`<div class="v10-choices">${p.choices.map(choiceHtml).join('')}</div>`:''}${!st.pendingOtherMeal&&p.type==='task'&&!(p.choices||[]).length&&p.task?`<div class="v10-countdown">${taskState(p.task)==='future'?`Còn ${humanDelta(p.task.start-nowMin())}`:'Đang trong khung giờ'}</div>`:''}</section><section class="v10-glance"><div><span>ĐANG LÀM</span><strong>${p.task&&taskState(p.task)==='in_progress'?esc(p.task.title):p.tone==='active'?esc(p.title):'Chưa có việc đang chạy'}</strong></div><div><span>SAU ĐÓ</span><strong>${next?`${minToHm(next.start)} · ${esc(next.title)}`:'Không còn việc nào'}</strong></div><div><span>ĐIỀU CHỈNH</span><strong>${note?esc(note):'Không cần làm bù gì lúc này'}</strong></div></section>`;
    tickClock();bindPrompt();
  }
  function renderAssistant(){if(st.activeTab!=='assistant')return;const{prompt,tasks,notes}=currentPrompt();renderPrompt(prompt,tasks,notes);renderJournal()}
  function bindPrompt(){qa('[data-v10-action]').forEach(b=>b.onclick=()=>handleAction(b.dataset.v10Action,b.dataset.v10Value));const s=$('v10-other-submit');if(s)s.onclick=()=>submitOtherMeal($('v10-other-meal')?.value||'')}
  function handleAction(a,v){if(a==='checkin-sleep')return answerCheckin('sleepHours',v);if(a==='checkin-energy')return answerCheckin('energy',v);if(a==='checkin-soreness')return answerCheckin('soreness',v);if(a==='water-done')return markWater(v);if(a==='meal-done')return logRecommendedMeal(v);if(a==='meal-other')return askOtherMeal(v);if(a==='defer-20')return deferTask(v,20);if(a==='defer-15')return deferTask(v,15);if(a==='skip-task')return skipTask(v);if(a==='task-done')return doneRoutine(v);if(a==='meal-now')return mealNow(v);if(a==='workout-budget')return workoutBudget(v);if(a==='skip-workout')return skipWorkout();if(a==='open-workout')return workoutBudget(L.get('mygym.v8.timeBudget','full'))}

  function tickClock(){const d=new Date(),e=$('v10-clock-text');if(e)e.textContent=`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;const m=d.getHours()*60+d.getMinutes();if(m!==st.lastMinute){st.lastMinute=m;renderAssistant()}}

  function renderJournal(){const root=$('v10-journal');if(!root)return;const tasks=adjustedTasks(),rows=tasks.map(t=>{const r=taskRecord(t.id),at=doneAt(t),state=isDone(t)?(r?.status==='skipped'?'skipped':'done'):taskState(t);return{t,r,at,state}}).filter(x=>x.at||x.r?.status==='skipped'||x.state==='overdue');root.innerHTML=`<div class="v10-journal-head"><p class="eyebrow">NHẬT KÝ TRỢ LÝ</p><h2>Thực tế hôm nay</h2><p>Đây là lịch sử để xem lại; bạn không cần vào đây để cập nhật.</p></div><div class="v10-journal-list">${rows.length?rows.map(x=>`<div class="v10-journal-row ${x.state}"><time>${x.at?new Date(x.at).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'}):minToHm(x.t.end)}</time><div><strong>${esc(x.t.title)}</strong><small>${x.state==='done'?'Đã hoàn thành':x.state==='skipped'?'Đã bỏ qua':'Chưa xử lý / quá giờ'}${x.t.adjustReason?` • ${esc(x.t.adjustReason)}`:''}</small></div></div>`).join(''):'<p class="muted">Chưa có hoạt động nào được ghi hôm nay.</p>'}</div>`}

  function ensureUi(){
    document.documentElement.classList.add('pt-v10');document.title='MyGym Personal PT v10';const eb=q('.pt-header .eyebrow');if(eb)eb.textContent='PERSONAL ASSISTANT • V10';const h=q('.pt-header h1');if(h)h.textContent='My Assistant';
    const nav=q('.pt-tabs');if(nav)nav.innerHTML=tabDefs.map(([id,label])=>`<button class="tab ${id==='assistant'?'active':''}" data-v10-tab="${id}" type="button">${label}</button>`).join('');
    const today=$('panel-today');let root=$('v10-assistant-root');if(!root){root=document.createElement('div');root.id='v10-assistant-root';today.prepend(root)}
    qa('#panel-today > :not(#v10-assistant-root)').forEach(x=>x.classList.add('v10-hide-on-assistant'));
    let journal=$('panel-journal');if(!journal){journal=document.createElement('section');journal.id='panel-journal';journal.className='panel';journal.innerHTML='<div id="v10-journal"></div>';q('main')?.appendChild(journal)}
    bindTabs();setTab('assistant');renderJournal();
  }
  function bindTabs(){qa('[data-v10-tab]').forEach(b=>b.onclick=()=>setTab(b.dataset.v10Tab))}
  function panelFor(name){if(name==='assistant')return$('panel-today');if(name==='journal')return$('panel-journal');return $(`panel-${name}`)}
  function setTab(name){st.activeTab=name;qa('.pt-tabs .tab').forEach(x=>x.classList.toggle('active',x.dataset.v10Tab===name));qa('main > .panel').forEach(x=>x.classList.remove('active'));panelFor(name)?.classList.add('active');document.documentElement.classList.toggle('v10-assistant-tab',name==='assistant');if(name==='assistant')renderAssistant();if(name==='journal')renderJournal();if(name==='workout')setTimeout(()=>window.scrollTo({top:0,behavior:'instant'}),30)}
  function openWorkout(){setTab('workout');setTimeout(()=>{const b=$('v8-start')||$('open-today-workout');b?.click()},120)}

  function watchData(){window.addEventListener('storage',e=>{if(e.key?.startsWith('mygym.v3.')||e.key?.startsWith('mygym.v6.menu.')){renderAssistant();renderJournal()}});window.addEventListener('mygym:v9-menu-changed',()=>renderAssistant());document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){renderAssistant();renderJournal()}})}
  async function init(){await auth();ensureUi();watchData();tickClock();setInterval(tickClock,1000)}
  init();
})();