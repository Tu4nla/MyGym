(()=>{
  const defs=[['assistant','Trợ lý'],['workout','Workout'],['plan','Kế hoạch'],['journal','Nhật ký'],['progress','Tiến độ'],['coach','PT']];
  const $=id=>document.getElementById(id);
  const qa=(s,r=document)=>[...r.querySelectorAll(s)];
  const map={assistant:'panel-today',workout:'panel-workout',plan:'panel-plan',journal:'panel-journal',progress:'panel-progress',coach:'panel-coach'};
  let applying=false;

  function targetPanel(name){
    let p=$(map[name]);
    if(name==='plan'&&!p)p=$('panel-nutrition');
    return p;
  }

  function ensureJournal(){
    if($('panel-journal'))return;
    const main=document.querySelector('main');if(!main)return;
    const p=document.createElement('section');p.id='panel-journal';p.className='panel';
    p.innerHTML='<div id="v11-journal-fallback" class="card"><p class="eyebrow">NHẬT KÝ</p><h2>Chưa có dữ liệu để hiển thị</h2><p class="muted">Nhật ký sẽ tự xuất hiện sau khi Trợ lý ghi nhận hoạt động.</p></div>';
    main.appendChild(p);
  }

  function ensureNav(){
    const nav=document.querySelector('.pt-tabs');if(!nav)return;
    if(!nav.querySelector('[data-v10-tab]')){
      nav.innerHTML=defs.map(([id,label])=>`<button class="tab ${id==='assistant'?'active':''}" data-v10-tab="${id}" type="button">${label}</button>`).join('');
      nav.querySelectorAll('[data-v10-tab]').forEach(b=>b.addEventListener('click',()=>show(b.dataset.v10Tab)));
    }
    nav.addEventListener('click',e=>{
      const b=e.target.closest('[data-v10-tab]');if(!b)return;
      setTimeout(applyVisibility,0);
    },true);
  }

  function displayFor(p){return p?.classList.contains('v9-relocated')?'grid':'block'}

  function applyVisibility(){
    if(applying)return;applying=true;
    try{
      const panels=qa('main > .panel');
      let active=panels.find(p=>p.classList.contains('active'));
      if(!active){active=targetPanel('assistant');active?.classList.add('active')}
      for(const p of panels){
        if(p===active)p.style.setProperty('display',displayFor(p),'important');
        else p.style.setProperty('display','none','important');
      }
      const activeName=Object.entries(map).find(([,id])=>active?.id===id)?.[0]||(active?.id==='panel-nutrition'?'plan':'assistant');
      qa('.pt-tabs [data-v10-tab]').forEach(b=>b.classList.toggle('active',b.dataset.v10Tab===activeName));
      document.documentElement.classList.toggle('v10-assistant-tab',activeName==='assistant');
    }finally{applying=false}
  }

  function show(name){
    ensureJournal();
    const target=targetPanel(name);if(!target)return;
    qa('main > .panel').forEach(p=>p.classList.remove('active'));
    target.classList.add('active');
    qa('.pt-tabs [data-v10-tab]').forEach(b=>b.classList.toggle('active',b.dataset.v10Tab===name));
    applyVisibility();
  }

  function assistantFallback(){
    const today=$('panel-today');if(!today)return;
    let root=$('v10-assistant-root');
    if(!root){root=document.createElement('div');root.id='v10-assistant-root';today.prepend(root)}
    if(root.textContent.trim().length>10)return;
    const d=new Date(),hh=String(d.getHours()).padStart(2,'0'),mm=String(d.getMinutes()).padStart(2,'0'),ss=String(d.getSeconds()).padStart(2,'0');
    root.innerHTML=`<section class="v10-clock"><div class="v10-clock-top"><span><i></i> TRỢ LÝ</span><span>đang khôi phục</span></div><div class="v10-clock-text">${hh}:${mm}:${ss}</div></section><section class="v10-focus danger"><div class="v10-assistant-line"><div class="v10-avatar">PT</div><div><p class="eyebrow">TÔI ĐANG SỬA TRẠNG THÁI</p><h2>Không để bạn rơi vào màn hình trắng.</h2></div></div><p class="v10-note">Dữ liệu vẫn còn. Hãy tải lại trang một lần; nếu engine chính chưa render, các tab khác vẫn hoạt động bình thường.</p><div class="v10-choices"><button class="primary" id="v11-rescue-reload">Tải lại Trợ lý</button></div></section>`;
    $('v11-rescue-reload')?.addEventListener('click',()=>location.reload());
  }

  function boot(){
    document.documentElement.classList.add('pt-v11-rescue');
    ensureJournal();ensureNav();
    const main=document.querySelector('main');
    if(main)new MutationObserver(()=>setTimeout(applyVisibility,0)).observe(main,{subtree:true,attributes:true,attributeFilter:['class']});
    applyVisibility();
    setTimeout(()=>{applyVisibility();assistantFallback()},700);
    window.addEventListener('pageshow',()=>setTimeout(applyVisibility,0));
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')setTimeout(applyVisibility,0)});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();