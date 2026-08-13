(()=>{
  const defs=[['assistant','Trợ lý'],['workout','Workout'],['plan','Kế hoạch'],['journal','Nhật ký'],['progress','Tiến độ'],['coach','PT']];
  const $=id=>document.getElementById(id);
  const qa=(s,r=document)=>[...r.querySelectorAll(s)];
  const panelMap={assistant:'panel-today',workout:'panel-workout',plan:'panel-plan',journal:'panel-journal',progress:'panel-progress',coach:'panel-coach'};
  let activeName='assistant',applying=false,navBound=false;

  function meaningful(p){return !!p&&((p.textContent||'').trim().length>20||p.children.length>1)}
  function panel(name){
    if(name==='plan'){
      const p=$('panel-plan');if(meaningful(p))return p;
      return $('panel-nutrition')||p;
    }
    return $(panelMap[name]);
  }
  function ensureJournal(){
    if($('panel-journal'))return;
    const main=document.querySelector('main');if(!main)return;
    const p=document.createElement('section');p.id='panel-journal';p.className='panel';
    p.innerHTML='<div id="v10-journal"><div class="card"><p class="eyebrow">NHẬT KÝ</p><h2>Chưa có hoạt động nào hôm nay</h2><p class="muted">Trợ lý sẽ tự ghi lại thời gian thực tế khi bạn hoàn thành việc.</p></div></div>';
    main.appendChild(p);
  }
  function rebuildNav(){
    const nav=document.querySelector('.pt-tabs');if(!nav)return;
    const ok=qa('[data-rescue-tab]',nav).length===defs.length;
    if(!ok)nav.innerHTML=defs.map(([id,label])=>`<button class="tab ${id===activeName?'active':''}" data-rescue-tab="${id}" type="button">${label}</button>`).join('');
    if(navBound)return;navBound=true;
    nav.addEventListener('click',e=>{
      const b=e.target.closest('[data-rescue-tab]');if(!b)return;
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();show(b.dataset.rescueTab);
    },true);
    new MutationObserver(()=>{if(qa('[data-rescue-tab]',nav).length!==defs.length){navBound=false;rebuildNav();apply()}}).observe(nav,{childList:true,subtree:true});
  }
  function displayFor(p){return p?.classList.contains('v9-relocated')?'grid':'block'}
  function apply(){
    if(applying)return;applying=true;
    try{
      ensureJournal();rebuildNav();
      const target=panel(activeName)||$('panel-today');
      const panels=qa('main > .panel');
      panels.forEach(p=>{
        const on=p===target;
        p.classList.toggle('active',on);
        p.style.setProperty('display',on?displayFor(p):'none','important');
        p.style.setProperty('visibility',on?'visible':'hidden','important');
        p.style.setProperty('opacity',on?'1':'0','important');
      });
      qa('.pt-tabs [data-rescue-tab]').forEach(b=>b.classList.toggle('active',b.dataset.rescueTab===activeName));
      document.documentElement.classList.toggle('v10-assistant-tab',activeName==='assistant');
    }finally{applying=false}
  }
  function show(name){activeName=defs.some(x=>x[0]===name)?name:'assistant';location.hash=activeName;apply();if(activeName==='assistant')ensureAssistantFallback()}

  function fallbackTask(){
    const d=new Date(),m=d.getHours()*60+d.getMinutes();
    const xs=[
      [465,'Uống 300ml nước'],[480,'Check-in nhanh'],[570,'Ăn sáng'],[615,'Uống nước'],[700,'Ăn trưa'],[750,'Ngủ trưa 20–30 phút'],[790,'Uống nước'],[885,'Uống nước'],[990,'Bữa xế'],[1040,'Uống nước'],[1125,'Uống nước'],[1170,'Uống nước trước tập'],[1200,'Workout / recovery'],[1295,'Ăn tối'],[1395,'Wind-down để ngủ']
    ];
    return xs.find(x=>x[0]>=m)||xs[xs.length-1];
  }
  function ensureAssistantFallback(){
    const today=$('panel-today');if(!today)return;
    let root=$('v10-assistant-root');if(!root){root=document.createElement('div');root.id='v10-assistant-root';today.prepend(root)}
    if((root.textContent||'').trim().length>30)return;
    const t=fallbackTask(),h=String(Math.floor(t[0]/60)).padStart(2,'0'),mi=String(t[0]%60).padStart(2,'0');
    root.innerHTML=`<section class="v10-clock"><div class="v10-clock-top"><span><i></i> TRỢ LÝ ĐANG HOẠT ĐỘNG</span><span>fallback an toàn</span></div><div id="v11-rescue-clock" class="v10-clock-text"></div></section><section class="v10-focus active"><div class="v10-assistant-line"><div class="v10-avatar">PT</div><div><p class="eyebrow">VIỆC TIẾP THEO</p><h2>${h}:${mi} · ${t[1]}</h2></div></div><p class="v10-note">Engine chính chưa render được, nhưng shell vẫn hoạt động. Tôi đang giữ màn hình usable thay vì để trắng.</p></section>`;
    tick();
  }
  function tick(){const e=$('v11-rescue-clock');if(!e)return;const d=new Date();e.textContent=`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`}
  function loadV12(){
    if(!document.querySelector('link[data-v12-planning]')){const l=document.createElement('link');l.rel='stylesheet';l.href='pt-v12-planning.css?v=2';l.dataset.v12Planning='1';document.head.appendChild(l)}
    if(!document.querySelector('script[data-v12-planning]')){const s=document.createElement('script');s.src='pt-v12-planning-v2.js?v=2';s.dataset.v12Planning='1';document.body.appendChild(s)}
  }
  function boot(){
    document.documentElement.classList.add('pt-v11-rescue');
    activeName=(location.hash||'').replace('#','');if(!defs.some(x=>x[0]===activeName))activeName='assistant';
    ensureJournal();rebuildNav();apply();setTimeout(()=>{apply();ensureAssistantFallback()},250);setTimeout(()=>{apply();ensureAssistantFallback()},1200);
    setInterval(tick,1000);
    const main=document.querySelector('main');if(main)new MutationObserver(()=>setTimeout(apply,0)).observe(main,{childList:true,subtree:false});
    window.addEventListener('pageshow',()=>setTimeout(()=>{apply();ensureAssistantFallback()},0));
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')setTimeout(()=>{apply();ensureAssistantFallback()},0)});
    loadV12();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();