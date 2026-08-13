self.addEventListener('install',event=>{self.skipWaiting()});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k.startsWith('mygym-pt-')).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});
// V13.2 intentionally does not intercept fetch. HTML/JS/CSS always use the network/browser cache rules.
// The service worker is kept only for background Web Push.
self.addEventListener('push',event=>{
  let data={};try{data=event.data?.json()||{}}catch{data={body:event.data?.text()||''}}
  const title=data.title||'My Assistant';
  const options={body:data.body||'Bạn có một việc cần xử lý.',tag:data.tag||'mygym-assistant',renotify:false,data:{url:data.url||'./pt.html?v=132#assistant',taskId:data.taskId||null,phase:data.phase||null},silent:false};
  event.waitUntil((async()=>{try{if(self.navigator&&'setAppBadge'in self.navigator)await self.navigator.setAppBadge(1)}catch{}await self.registration.showNotification(title,options)})());
});
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  event.waitUntil((async()=>{
    try{if(self.navigator&&'clearAppBadge'in self.navigator)await self.navigator.clearAppBadge()}catch{}
    const target=new URL(event.notification.data?.url||'./pt.html?v=132#assistant',self.registration.scope).href;
    const list=await clients.matchAll({type:'window',includeUncontrolled:true});
    for(const c of list){if(c.url.includes('/MyGym/pt.html')){try{await c.navigate(target)}catch{}return c.focus()}}
    return clients.openWindow(target);
  })());
});