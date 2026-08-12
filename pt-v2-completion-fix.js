(() => {
  function loadStyle(href) {
    return new Promise(resolve => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = resolve;
      link.onerror = resolve;
      document.head.appendChild(link);
    });
  }
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }
  async function bootV3() {
    try {
      await loadStyle('pt-v3.css?v=1');
      await loadScript('pt-cloud-config.js?v=1');
      if (!window.supabase) {
        await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js');
      }
      await loadScript('pt-v3.js?v=1');
    } catch (error) {
      console.error('Personal PT v3 boot failed', error);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootV3);
  else bootV3();
})();