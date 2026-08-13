(()=>{
'use strict';
const C=window.PT_CLOUD_CONFIG||null;
if(!C||!window.supabase)return;
const OWNER_ID='3096fc88-523d-4a42-8926-cdd8927c1ce0';
const VERSION='134';
const client=window.PT_SUPABASE_CLIENT||window.supabase.createClient(C.url,C.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
window.PT_SUPABASE_CLIENT=client;
const host=()=>document.getElementById('v134-auth-host');
const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
let busy=false;
function setState(s){document.documentElement.dataset.ownerSession=s}
function renderLogin(message='',kind=''){
  const h=host();if(!h)return;
  const remembered=localStorage.getItem('mygym.owner.email')||'';
  h.hidden=false;
  h.innerHTML=`<section class="v134-login-card" aria-labelledby="v134-login-title">
    <div class="eyebrow">TÀI KHOẢN CÁ NHÂN</div>
    <h2 id="v134-login-title">Đăng nhập My Assistant</h2>
    <p class="muted">Đăng nhập một lần trên thiết bị này. Session sẽ được lưu cho những lần sau.</p>
    <form id="v134-login-form" autocomplete="on">
      <label>Email<input id="v134-email" name="email" type="email" inputmode="email" autocomplete="username" value="${esc(remembered)}" placeholder="Email" required></label>
      <label>Mật khẩu<input id="v134-password" name="password" type="password" autocomplete="current-password" placeholder="Mật khẩu" required></label>
      ${message?`<div class="v134-login-message ${kind==='error'?'error':'ok'}">${esc(message)}</div>`:''}
      <button class="primary" type="submit" ${busy?'disabled':''}>${busy?'Đang đăng nhập…':'Đăng nhập'}</button>
    </form>
  </section>`;
}
function hideLogin(){const h=host();if(h){h.innerHTML='';h.hidden=true}}
async function inspect(){
  setState('checking');
  try{
    const {data,error}=await client.auth.getSession();if(error)throw error;
    const s=data?.session||null;
    if(!s){setState('missing');renderLogin();return false}
    if(s.user?.id!==OWNER_ID){await client.auth.signOut({scope:'local'});setState('missing');renderLogin('Tài khoản này không phải tài khoản của My Assistant.','error');return false}
    setState('ready');hideLogin();return true;
  }catch(e){setState('missing');renderLogin(e?.message||'Không đọc được session.','error');return false}
}
async function login(email,password){
  if(busy)return;busy=true;renderLogin();
  try{
    const {data,error}=await client.auth.signInWithPassword({email,password});
    if(error)throw error;
    if(data?.user?.id!==OWNER_ID){await client.auth.signOut({scope:'local'});throw new Error('Không đúng tài khoản của My Assistant.')}
    localStorage.setItem('mygym.owner.email',email);
    setState('ready');hideLogin();
    location.replace(`./pt.html?v=${VERSION}#assistant`);
  }catch(e){busy=false;setState('missing');renderLogin(e?.message||'Đăng nhập thất bại.','error')}
}
document.addEventListener('submit',e=>{
  if(e.target?.id!=='v134-login-form')return;
  e.preventDefault();
  const email=document.getElementById('v134-email')?.value?.trim()||'';
  const password=document.getElementById('v134-password')?.value||'';
  if(!email||!password){renderLogin('Nhập email và mật khẩu.','error');return}
  login(email,password);
},true);
client.auth.onAuthStateChange((_event,session)=>{
  if(session?.user?.id===OWNER_ID){setState('ready');hideLogin()}
  else if(!session&&!busy){setState('missing');renderLogin()}
});
window.MyGymAuth={client,logout:async()=>{await client.auth.signOut({scope:'local'});location.replace(`./pt.html?v=${VERSION}`)}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',inspect,{once:true});else inspect();
window.addEventListener('pageshow',()=>{if(!busy)inspect()});
})();