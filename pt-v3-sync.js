(() => {
  const C = window.PT_CLOUD_CONFIG;
  if (!C || !window.supabase) return;

  const STORAGE_PREFIX = 'mygym.v3.';
  const PENDING_MIGRATION_KEY = `${STORAGE_PREFIX}pendingCloudMigration`;
  const SYNC_TABLES = [
    'pt_todos',
    'pt_daily_entries',
    'pt_workout_sessions',
    'pt_exercise_sets',
    'pt_measurements'
  ];

  const client = window.supabase.createClient(C.url, C.publishableKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  let user = null;
  let channel = null;
  let localMutationAt = 0;
  let suppressRealtimeUntil = 0;
  let reloadTimer = null;

  const parse = (key, fallback = []) => {
    try { return JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}${key}`) || JSON.stringify(fallback)); }
    catch { return fallback; }
  };

  const css = document.createElement('style');
  css.textContent = `
    #sync-health-banner{margin:10px 0 14px;padding:12px 14px;border:1px solid rgba(255,255,255,.1);border-radius:16px;display:flex;gap:12px;align-items:center;justify-content:space-between;background:rgba(255,255,255,.035)}
    #sync-health-banner.local-only{border-color:rgba(255,166,0,.35);background:rgba(255,166,0,.08)}
    #sync-health-banner.live{border-color:rgba(72,210,132,.32);background:rgba(72,210,132,.07)}
    #sync-health-banner.error{border-color:rgba(255,90,90,.35);background:rgba(255,90,90,.08)}
    #sync-health-banner .sync-health-copy{min-width:0;display:flex;flex-direction:column;gap:2px}
    #sync-health-banner strong{font-size:13px}
    #sync-health-banner span{font-size:11px;opacity:.76;line-height:1.35}
    #sync-health-banner button{flex:0 0 auto}
    @media(max-width:640px){#sync-health-banner{align-items:flex-start;flex-direction:column}#sync-health-banner button{width:100%}}
  `;
  document.head.appendChild(css);

  function activateCoachAndFocusAuth() {
    const tab = document.querySelector('.tab[data-tab="coach"]');
    if (tab && !tab.classList.contains('active')) tab.click();
    setTimeout(() => document.getElementById('auth-box')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60);
  }

  function ensureBanner() {
    let el = document.getElementById('sync-health-banner');
    if (!el) {
      el = document.createElement('div');
      el.id = 'sync-health-banner';
      const cloud = document.getElementById('cloud-bar');
      if (cloud) cloud.insertAdjacentElement('afterend', el);
      else document.querySelector('.pt-tabs')?.insertAdjacentElement('afterend', el);
    }
    return el;
  }

  function renderBanner(mode = user ? 'connecting' : 'signed-out', detail = '') {
    const el = ensureBanner();
    if (!el) return;
    if (!user) {
      el.className = 'local-only';
      el.innerHTML = `<div class="sync-health-copy"><strong>⚠ LOCAL ONLY — hai trình duyệt sẽ KHÔNG tự đồng bộ</strong><span>Hiện chưa có Supabase account đăng nhập. Tick/note lúc này chỉ nằm trong localStorage của trình duyệt này.</span></div><button id="sync-health-login" class="mini-btn" type="button">Đăng nhập để sync</button>`;
      document.getElementById('sync-health-login').onclick = activateCoachAndFocusAuth;
      return;
    }
    if (mode === 'error') {
      el.className = 'error';
      el.innerHTML = `<div class="sync-health-copy"><strong>● Realtime đang lỗi</strong><span>${detail || 'Không kết nối được Realtime. Dữ liệu vẫn được lưu cloud khi request thành công.'}</span></div><button id="sync-health-retry" class="mini-btn" type="button">Kết nối lại</button>`;
      document.getElementById('sync-health-retry').onclick = subscribeRealtimeWatchdog;
      return;
    }
    el.className = mode === 'live' ? 'live' : '';
    el.innerHTML = `<div class="sync-health-copy"><strong>${mode === 'live' ? '● Realtime LIVE' : '◌ Đang nối Realtime…'}</strong><span>${user.email || user.id} • ${detail || 'Cùng account này trên thiết bị khác sẽ nhận update.'}</span></div>`;
  }

  function capturePendingLocalMigration() {
    const snapshot = {
      capturedAt: new Date().toISOString(),
      todos: parse('todos'),
      entries: parse('entries'),
      measurements: parse('measurements'),
      sessions: parse('sessions'),
      sets: parse('sets'),
      analyses: parse('analyses')
    };
    localStorage.setItem(PENDING_MIGRATION_KEY, JSON.stringify(snapshot));
  }

  async function migratePendingLocalData() {
    if (!user) return false;
    let pending;
    try { pending = JSON.parse(localStorage.getItem(PENDING_MIGRATION_KEY) || 'null'); }
    catch { pending = null; }
    if (!pending) return false;

    suppressRealtimeUntil = Date.now() + 8000;
    renderBanner('connecting', 'Đang chuyển dữ liệu local hiện có lên cloud…');

    const uid = user.id;
    const safeUpsert = async (table, rows, onConflict) => {
      if (!rows?.length) return [];
      const { data, error } = await client.from(table).upsert(rows, { onConflict }).select();
      if (error) throw error;
      return data || [];
    };

    try {
      const todoRows = (pending.todos || []).filter(x => x.todo_date && x.todo_key).map((x, i) => ({
        user_id: uid,
        todo_date: x.todo_date,
        todo_key: x.todo_key,
        title: x.title || x.todo_key,
        kind: x.kind || 'other',
        sort_order: Number.isFinite(Number(x.sort_order)) ? Number(x.sort_order) : i,
        completed: Boolean(x.completed),
        note: x.note || null,
        payload: x.payload || {}
      }));
      await safeUpsert('pt_todos', todoRows, 'user_id,todo_date,todo_key');

      const entryRows = (pending.entries || []).filter(x => x.entry_date && x.entry_type && x.entry_key).map(x => ({
        user_id: uid,
        entry_date: x.entry_date,
        entry_type: x.entry_type,
        entry_key: x.entry_key,
        payload: x.payload || {}
      }));
      await safeUpsert('pt_daily_entries', entryRows, 'user_id,entry_date,entry_type,entry_key');

      const measurementRows = (pending.measurements || []).filter(x => x.measured_at).map(x => ({
        user_id: uid,
        client_key: x.client_key || `measure:${x.measured_at}`,
        measured_at: x.measured_at,
        weight_kg: x.weight_kg ?? null,
        waist_cm: x.waist_cm ?? null,
        note: x.note || null
      }));
      await safeUpsert('pt_measurements', measurementRows, 'user_id,client_key');

      const localSessions = (pending.sessions || []).filter(x => x.workout_date && x.workout_id);
      const sessionIdMap = new Map();
      for (const x of localSessions) {
        const clientKey = x.client_key || `session:${x.workout_date}:${x.workout_id}`;
        const { data, error } = await client.from('pt_workout_sessions').upsert({
          user_id: uid,
          client_key: clientKey,
          workout_date: x.workout_date,
          workout_id: x.workout_id,
          status: (x.status || 'planned').replaceAll('-', '_'),
          completion_pct: Number(x.completion_pct || 0),
          note: x.note || null,
          started_at: x.started_at || null,
          ended_at: x.ended_at || null,
          payload: x.payload || {}
        }, { onConflict: 'user_id,client_key' }).select().single();
        if (error) throw error;
        if (x.id) sessionIdMap.set(String(x.id), data.id);
        sessionIdMap.set(clientKey, data.id);
      }

      const { data: remoteSessions, error: remoteSessionsError } = await client.from('pt_workout_sessions').select('id,client_key').eq('user_id', uid);
      if (remoteSessionsError) throw remoteSessionsError;
      (remoteSessions || []).forEach(s => sessionIdMap.set(s.client_key, s.id));

      for (const x of (pending.sets || []).filter(x => x.exercise_key)) {
        let remoteSessionId = sessionIdMap.get(String(x.session_id || ''));
        if (!remoteSessionId && x.client_key) {
          const sessionClientKey = String(x.client_key).replace(/^set:/, '').split(`:${x.exercise_key}:`)[0];
          remoteSessionId = sessionIdMap.get(sessionClientKey);
        }
        if (!remoteSessionId) continue;
        const clientKey = x.client_key || `set:${remoteSessionId}:${x.exercise_key}:${Number(x.set_index || 0)}`;
        const { error } = await client.from('pt_exercise_sets').upsert({
          user_id: uid,
          client_key: clientKey,
          session_id: remoteSessionId,
          exercise_key: x.exercise_key,
          exercise_order: Number(x.exercise_order || 0),
          set_index: Number(x.set_index || 0),
          target_reps: x.target_reps || null,
          weight_kg: x.weight_kg ?? null,
          reps: x.reps ?? null,
          rir: x.rir ?? null,
          completed: Boolean(x.completed),
          note: x.note || null
        }, { onConflict: 'user_id,client_key' });
        if (error) throw error;
      }

      const analysisRows = (pending.analyses || []).filter(x => x.analysis_date).map(x => ({
        user_id: uid,
        client_key: x.client_key || `analysis:${x.analysis_date}`,
        analysis_date: x.analysis_date,
        trigger_type: x.trigger_type || 'local-migration',
        severity: ['info','good','warn','danger'].includes(x.severity) ? x.severity : 'info',
        summary: x.summary || 'Imported local analysis',
        recommendations: x.recommendations || [],
        metrics: x.metrics || {},
        rule_version: x.rule_version || 'v3.0'
      }));
      await safeUpsert('pt_analysis_snapshots', analysisRows, 'user_id,client_key');

      localStorage.removeItem(PENDING_MIGRATION_KEY);
      localStorage.setItem(`${STORAGE_PREFIX}lastCloudMigrationAt`, new Date().toISOString());
      renderBanner('live', 'Đã chuyển dữ liệu local lên cloud. Đang reload state chuẩn…');
      setTimeout(() => location.reload(), 450);
      return true;
    } catch (err) {
      console.error('[PT sync migration]', err);
      renderBanner('error', `Không migrate được dữ liệu local: ${err?.message || err}`);
      return false;
    }
  }

  function markLocalMutation(event) {
    const t = event.target;
    if (!t) return;
    if (
      t.matches?.('[data-todo-check],[data-todo-note],[data-meal-log],#sleep-hours,#sleep-quality,#energy,#soreness,#quick-sleep,#quick-energy,#quick-water,#quick-meal,#progress-weight,#progress-waist,#change-form input,#change-form select,#change-form textarea') ||
      t.closest?.('#workout-player')
    ) localMutationAt = Date.now();
  }

  function scheduleRemoteReload(table) {
    if (Date.now() < suppressRealtimeUntil) return;
    if (Date.now() - localMutationAt < 1800) return;
    clearTimeout(reloadTimer);
    reloadTimer = setTimeout(() => {
      if (document.visibilityState === 'visible') location.reload();
      else sessionStorage.setItem('mygym.v3.reloadOnVisible', table);
    }, 180);
  }

  async function subscribeRealtimeWatchdog() {
    if (!user) return;
    if (channel) await client.removeChannel(channel);
    renderBanner('connecting');
    const filter = `user_id=eq.${user.id}`;
    let ch = client.channel(`pt-watchdog-${user.id}-${Math.random().toString(36).slice(2,7)}`);
    SYNC_TABLES.forEach(table => {
      ch = ch.on('postgres_changes', { event: '*', schema: 'public', table, filter }, () => scheduleRemoteReload(table));
    });
    channel = ch.subscribe(status => {
      if (status === 'SUBSCRIBED') renderBanner('live', 'Realtime đã kết nối. Browser khác cùng account sẽ tự refresh khi dữ liệu đổi.');
      else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') renderBanner('error', `Realtime status: ${status}`);
    });
  }

  async function applySession(session) {
    user = session?.user || null;
    if (!user) {
      if (channel) { await client.removeChannel(channel); channel = null; }
      renderBanner('signed-out');
      return;
    }
    const migrated = await migratePendingLocalData();
    if (!migrated) await subscribeRealtimeWatchdog();
  }

  document.addEventListener('click', event => {
    const target = event.target;
    if (target?.id === 'cloud-login-open' || target?.id === 'sync-health-login') {
      activateCoachAndFocusAuth();
    }
    if (target?.id === 'auth-login' || target?.id === 'auth-signup') {
      capturePendingLocalMigration();
      localMutationAt = Date.now();
    }
  }, true);
  document.addEventListener('change', markLocalMutation, true);
  document.addEventListener('input', markLocalMutation, true);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && sessionStorage.getItem('mygym.v3.reloadOnVisible')) {
      sessionStorage.removeItem('mygym.v3.reloadOnVisible');
      location.reload();
    }
  });

  (async () => {
    const { data: { session } } = await client.auth.getSession();
    await applySession(session);
    client.auth.onAuthStateChange((_event, nextSession) => {
      setTimeout(() => applySession(nextSession), 0);
    });
  })();
})();