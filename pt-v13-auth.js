(()=>{
'use strict';
const C=window.PT_CLOUD_CONFIG||null;
if(!C||!window.supabase)return;
const OWNER_ID='3096fc88-523d-4a42-8926-cdd8927c1ce0';
const client=window.supabase.createClient(C.url,C.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const state={session:null,sending:false,lastRenderKey:''};
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

function root(){return $('v13-assistant')}
function cleanAuthUrl(){
  const u=new URL(location.href);
  u.searchParams.set('v','132');
  u.hash='assistant';
  return u.toString();
}
function hasAuthPayload(){return /access_token=|refresh_token=|type=|code=/.test(location.hash)||new URL(location.href).searchParams.has('code')}
function removeCard(){document.getElementById('v132-owner-auth')?.remove()}
function renderCard(mode='idle',detail=''){
  if(state.session?.user?.id===OWNER_ID){removeCard();return}
  const r=root();if(!r)return;
  let card=$('v132-owner-auth');
  if(!card){card=document.createElement('div');card.id='v132-owner-auth';card.className='v132-owner-auth';r.prepend(card)}
  const key=`${mode}:${detail}`;if(state.lastRenderKey===key&&card.innerHTML)return;state.lastRenderKey=key;
  if(mode==='sending'){
    card.innerHTML='<div class="eyebrow">KẾT NỐI DỮ LIỆU CÁ NHÂN</div><h2>Đang gửi link xác nhận…</h2><p>Không cần nhập email hay mật khẩu.</p>';
  }else if(mode==='sent'){
    card.innerHTML='<div class="eyebrow">ĐÃ GỬI LINK</div><h2>Mở email của bạn và bấm link đăng nhập</h2><p>Sau lần này, session được lưu trên thiết bị và app sẽ tự dùng tài khoản của bạn. Không còn màn hình login.</p><button class="secondary" data-v132-auth-action="resend" type="button">Gửi lại link</button>';
  }else if(mode==='error'){
    card.innerHTML=`<div class="eyebrow">CHƯA KẾT NỐI CLOUD</div><h2>Không gửi được link xác nhận</h2><p>${esc(detail||'Thử lại sau.')}</p><button class="primary" data-v132-auth-action="send" type="button">Thử lại</button>`;
  }else if(mode==='wrong-user'){
    card.innerHTML='<div class="eyebrow">SAI TÀI KHOẢN</div><h2>Session hiện tại không phải tài khoản chủ</h2><p>App đã bỏ session đó. Hãy liên kết lại tài khoản cá nhân duy nhất.</p><button class="primary" data-v132-auth-action="send" type="button">Gửi link xác nhận</button>';
  }else{
    card.innerHTML='<div class="eyebrow">THIẾT BỊ CHƯA LIÊN KẾT</div><h2>Liên kết thiết bị này với dữ liệu của bạn?</h2><p>Chỉ cần xác nhận một lần. Không có form email/password.</p><button class="primary" data-v132-auth-action="send" type="button">Gửi link xác nhận</button>';
  }
}
async function requestOwnerLink(){
  if(state.sending)return;state.sending=true;renderCard('sending');
  try{
    const {data,error}=await client.functions.invoke('pt-owner-login',{body:{source:'mygym-v13.2'}});
    if(error)throw error;if(!data?.ok)throw new Error(data?.error||'Không gửi được magic link');
    localStorage.setItem('mygym.v132.ownerLinkSentAt',String(Date.now()));
    renderCard('sent');
  }catch(e){console.error('[V13.2 owner auth]',e);renderCard('error',e?.message||String(e))}
  finally{state.sending=false}
}
async function inspectSession(){
  try{
    const {data,error}=await client.auth.getSession();if(error)throw error;
    const s=data?.session||null;
    if(s&&s.user?.id!==OWNER_ID){await client.auth.signOut({scope:'local'});state.session=null;renderCard('wrong-user');return}
    state.session=s;
    if(s){removeCard();
      document.documentElement.dataset.ownerSession='ready';
      if(hasAuthPayload())location.replace(cleanAuthUrl());
    }else{document.documentElement.dataset.ownerSession='missing';renderCard('idle')}
  }catch(e){console.error('[V13.2 session]',e);renderCard('error',e?.message||String(e))}
}
function patchCloudStatus(){
  document.querySelectorAll('.metric').forEach(m=>{const s=m.querySelector('span');if(s?.textContent?.trim()==='Cloud'){const b=m.querySelector('b');if(b)b.textContent=state.session?.user?.id===OWNER_ID?'Tài khoản cá nhân':'Chưa liên kết'}})
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-v132-auth-action]');if(!b)return;e.preventDefault();e.stopPropagation();requestOwnerLink()},true);
client.auth.onAuthStateChange((event,session)=>{
  if(session?.user?.id&&session.user.id!==OWNER_ID){client.auth.signOut({scope:'local'}).catch(()=>{});state.session=null;renderCard('wrong-user');return}
  const had=!!state.session;state.session=session||null;
  if(state.session){removeCard();document.documentElement.dataset.ownerSession='ready';if(!had&&event==='SIGNED_IN')location.replace(cleanAuthUrl())}
  else{document.documentElement.dataset.ownerSession='missing';renderCard('idle')}
  setTimeout(patchCloudStatus,0);
});
const observer=new MutationObserver(()=>{if(!state.session)setTimeout(()=>renderCard('idle'),0);setTimeout(patchCloudStatus,0)});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{observer.observe(document.body,{childList:true,subtree:true});inspectSession()},{once:true});
else{observer.observe(document.body,{childList:true,subtree:true});inspectSession()}
window.addEventListener('pageshow',inspectSession);
})();