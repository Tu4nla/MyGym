(()=>{
'use strict';
if(!window.supabase?.createClient||window.__MYGYM_SUPABASE_PATCHED__)return;
const original=window.supabase.createClient.bind(window.supabase);
let singleton=null;
window.supabase.createClient=(url,key,options)=>{
  if(singleton)return singleton;
  singleton=original(url,key,options);
  window.PT_SUPABASE_CLIENT=singleton;
  return singleton;
};
window.__MYGYM_SUPABASE_PATCHED__=true;
})();
