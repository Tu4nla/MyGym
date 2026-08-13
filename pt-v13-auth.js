(()=>{
'use strict';
const C=window.PT_CLOUD_CONFIG||null;
if(!C||!window.supabase)return;
const OWNER_ID='3096fc88-523d-4a42-8926-cdd8927c1ce0';
const VERSION='133';
const SENT_KEY='mygym.v133.ownerLinkSentAt';
const client=window.supabase.createClient(C.url,C.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const state={session:null,sending:false,mode:'idle',detail:'',lastRenderKey:''};
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
function root(){return $('v13-assistant')}
function cleanAuthUrl(){const u=new URL(location.href);u.searchParams.set('v',VERSION);u.hash='assistant';return u.toString()}
function hasAuthPayload(){return /access_token=|refresh_token=|type=|code=/.test(location.hash)||new URL(location.href).searchParams.has('code')}
function removeCard(){document.getElementById('v132-owner-auth')?.remove()}
function sentAt(){const n=Number(localStorage.getItem(SENT_KEY)||localStorage.getItem('mygym.v132.ownerLinkSentAt')||0);return Number.isFinite(n)&&n>0?n:0}
function sentRecently(){const t=sentAt();return t>0&&Date.now()-t<15*60*1000}
function sentTime(){const t=sentAt();return t?new Date(t).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'}):''}
function setMode(mode,detail=''){state.mode=mode;state.detail=detail;state.lastRenderKey='';renderCard()}
function renderCard(){
  if(state.session?.user?.id===OWNER_ID){removeCard();return}
  const r=root();if(!r)return;
  let card=$('v132-owner-auth');
  if(!card){card=document.createElement('div');card.id='v132-owner-auth';card.className='v132-owner-auth';r.prepend(card)}
  const mode=state.mode,detail=state.detail,key=`${mode}:${detail}:${sentAt()}`;
  if(state.lastRenderKey===key&&card.innerHTML)return;state.lastRenderKey=key;
  if(mode==='sending')card.innerHTML='<div class="eyebrow">KẾT NỐI DỮ LIỆU CÁ NHÂN</div><h2>Đang gửi link xác nhận…</h2><p>Đang gọi Supabase Auth. Thường mất vài giây.</p><button class="secondary" type="button" disabled>Đang gửi…</button>';
  else if(mode==='sent')card.innerHTML=`<div class="eyebrow">ĐÃ GỬI LINK${sentTime()?` · ${esc(sentTime())}`:''}</div><h2>Link đăng nhập đã được gửi</h2><p>Kiểm tra Gmail và Spam. Mở email mới nhất từ Supabase rồi bấm link; thiết bị này sẽ tự giữ session sau lần đó.</p><div class="v132-auth-actions"><button class="secondary" data-v132-auth-action="resend" type="button">Gửi lại link</button><button class="secondary" data-v132-auth-action="check" type="button">Tôi đã bấm link</button></div>`;
  else if(mode==='error')card.innerHTML=`<div class="eyebrow">CHƯA KẾT NỐI CLOUD</div><h2>Không gửi được link xác nhận</h2><p>${esc(detail||'Thử lại sau.')}</p><button class="primary" data-v132-auth-action="send" type="button">Thử lại</button>`;
  else if(mode==='wrong-user')card.innerHTML='<div class="eyebrow">SAI TÀI KHOẢN</div><h2>Session hiện tại không phải tài khoản chủ</h2><p>App đã bỏ session đó. Hãy liên kết lại tài khoản cá nhân duy nhất.</p><button class="primary" data-v132-auth-action="send" type="button">Gửi link xác nhận</button>';
  else card.innerHTML='<div class="eyebrow">THIẾT BỊ CHƯA LIÊN KẾT</div><h2>Liên kết thiết bị này với dữ liệu của bạn?</h2><p>Chỉ cần xác nhận một lần. Không có form email/password.</p><button class="primary" data-v132-auth-action="send" type="button">Gửi link xác nhận</button>';
}
async function requestOwnerLink(){
  if(state.sending)return;state.sending=true;setMode('sending');
  try{
    const {data,error}=await client.functions.invoke('pt-owner-login',{body:{source:'mygym-v13.3'}});
    if(error)throw error;if(!data?.ok)throw new Error(data?.error||'Không gửi được magic link');
    localStorage.setItem(SENT_KEY,String(Date.now()));
    setMode('sent');
  }catch(e){console.error('[V13.3 owner auth]',e);setMode('error',e?.message||String(e))}
  finally{state.sending=false}
}
async function inspectSession({preserveSent=true}={}){
  try{
    const {data,error}=await client.auth.getSession();if(error)throw error;
    const s=data?.session||null;
    if(s&&s.user?.id!==OWNER_ID){await client.auth.signOut({scope:'local'});state.session=null;setMode('wrong-user');return false}
    state.session=s;
    if(s){removeCard();document.documentElement.dataset.ownerSession='ready';localStorage.removeItem(SENT_KEY);localStorage.removeItem('mygym.v132.ownerLinkSentAt');if(hasAuthPayload())location.replace(cleanAuthUrl());return true}
    document.documentElement.dataset.ownerSession='missing';
    if(preserveSent&&sentRecently())setMode('sent');else setMode('idle');
    return false;
  }catch(e){console.error('[V13.3 session]',e);setMode('error',e?.message||String(e));return false}
}
function patchCloudStatus(){document.querySelectorAll('.metric').forEach(m=>{const s=m.querySelector('span');if(s?.textContent?.trim()==='Cloud'){const b=m.querySelector('b');if(b)b.textContent=state.session?.user?.id===OWNER_ID?'Tài khoản cá nhân':'Chưa liên kết'}})}
document.addEventListener('click',async e=>{
  const b=e.target.closest('[data-v132-auth-action]');if(!b)return;e.preventDefault();e.stopPropagation();const a=b.dataset.v132AuthAction;
  if(a==='send'||a==='resend')return requestOwnerLink();
  if(a==='check'){const ok=await inspectSession({preserveSent:true});if(!ok)setMode('sent','Chưa thấy session trên thiết bị này. Nếu vừa bấm email ở tab khác, quay lại đây sau vài giây.');}
},true);
client.auth.onAuthStateChange((event,session)=>{
  if(session?.user?.id&&session.user.id!==OWNER_ID){client.auth.signOut({scope:'local'}).catch(()=>{});state.session=null;setMode('wrong-user');return}
  const had=!!state.session;state.session=session||null;
  if(state.session){removeCard();document.documentElement.dataset.ownerSession='ready';localStorage.removeItem(SENT_KEY);localStorage.removeItem('mygym.v132.ownerLinkSentAt');if(!had&&event==='SIGNED_IN')location.replace(cleanAuthUrl())}
  else{document.documentElement.dataset.ownerSession='missing';if(sentRecently())setMode('sent');else setMode('idle')}
  setTimeout(patchCloudStatus,0);
});
const observer=new MutationObserver(()=>{if(!state.session)setTimeout(renderCard,0);setTimeout(patchCloudStatus,0)});
function boot(){observer.observe(document.body,{childList:true,subtree:true});if(sentRecently())state.mode='sent';inspectSession({preserveSent:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.addEventListener('pageshow',()=>inspectSession({preserveSent:true}));
})();