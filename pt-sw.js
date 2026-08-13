const CACHE='mygym-pt-v11-20260813';
const CORE=['./pt.html','./pt.css','./pt-v2.css','./pt-v3.css','./pt-v4.css','./pt-v6.css','./pt-v7.css','./pt-v8-workout.css','./pt-v9.css','./pt-v9-fix.css','./pt-v10.css','./pt-v11-push.css','./pt-source.js','./pt-data.js','./pt-food-vn.js','./pt-food-vn-v2.js','./pt-food-v2-breakfast.js','./pt-food-v2-products.js','./pt-food-v2-apply.js','./pt-food-v2-ui.js','./pt-cloud-config.js','./pt-v3.js','./pt-v6.js','./pt-v6-exercise.js','./pt-v6-lifestyle.js','./pt-v7.js','./pt-v8-workout.js','./pt-v9.js','./pt-v9-menu.js','./pt-v10-assistant.js','./pt-v11-push.js','./equipment-catalog.json'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).catch(()=>null));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE&&k.startsWith('mygym-pt-')).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;const u=new URL(e.request.url);if(u.origin!==self.location.origin)return;e.respondWith(fetch(e.request).then(r=>{const x=r.clone();caches.open(CACHE).then(c=>c.put(e.request,x)).catch(()=>null);return r}).catch(()=>caches.match(e.request).then(x=>x||caches.match('./pt.html'))))});
self.addEventListener('push',event=>{
  let data={};try{data=event.data?.json()||{}}catch{data={body:event.data?.text()||''}}
  const title=data.title||'My Assistant';
  const options={body:data.body||'Bạn có một việc cần xử lý.',tag:data.tag||'mygym-assistant',renotify:false,data:{url:data.url||'./pt.html#assistant',taskId:data.taskId||null,phase:data.phase||null},silent:false};
  event.waitUntil((async()=>{try{if(self.navigator&&'setAppBadge'in self.navigator)await self.navigator.setAppBadge(1)}catch{}await self.registration.showNotification(title,options)})());
});
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  event.waitUntil((async()=>{
    try{if(self.navigator&&'clearAppBadge'in self.navigator)await self.navigator.clearAppBadge()}catch{}
    const target=new URL(event.notification.data?.url||'./pt.html#assistant',self.registration.scope).href;
    const list=await clients.matchAll({type:'window',includeUncontrolled:true});
    for(const c of list){if(c.url.includes('/MyGym/pt.html')){try{await c.navigate(target)}catch{}return c.focus()}}
    return clients.openWindow(target);
  })());
});