(() => {
  const D = window.PT_DATA;
  const S = window.PT_SOURCE;
  const $ = (id) => document.getElementById(id);
  const $$ = (q, root = document) => [...root.querySelectorAll(q)];

  const KEYS = {
    checkins: "mygym.pt.checkins.v2",
    progress: "mygym.pt.progress.v2",
    logs: "mygym.pt.logs.v2",
    meals: "mygym.pt.meals.v2",
    events: "mygym.pt.events.v2",
    sessions: "mygym.pt.sessions.v2"
  };

  const state = {
    catalog: [],
    catalogById: new Map(),
    selectedEquipment: new Set(S.equipment.confirmedFromCurrentProfile || []),
    activeWorkoutId: null
  };

  const EVENT_LABELS = {
    skip_workout: "Không tập được",
    partial_workout: "Tập một phần",
    missed_meal: "Lỡ bữa",
    offplan_meal: "Ăn khác kế hoạch",
    schedule_shift: "Lịch bị lệch",
    sick_or_pain: "Không khỏe / đau",
    other: "Thay đổi khác"
  };

  function readJson(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch { return fallback; }
  }
  function writeJson(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
  function uid(prefix = "evt") { return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`; }
  function dateKey(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  function parseDateKey(key) {
    const [y,m,d] = key.split("-").map(Number);
    return new Date(y, m-1, d, 12, 0, 0);
  }
  function addDays(key, days) {
    const d = parseDateKey(key);
    d.setDate(d.getDate()+days);
    return dateKey(d);
  }
  function formatDateVi(date = new Date()) {
    return new Intl.DateTimeFormat("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
  }
  function formatShortDate(key) {
    const [y,m,d] = key.split("-");
    return `${d}/${m}/${y}`;
  }
  function escapeHtml(v = "") {
    return String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }
  function toast(text) {
    const el = $("toast");
    el.textContent = text;
    el.classList.add("show");
    clearTimeout(toast.t);
    toast.t = setTimeout(() => el.classList.remove("show"), 1600);
  }
  function minutesNow() {
    const d = new Date();
    return d.getHours()*60+d.getMinutes();
  }
  function firstTimeMinutes(text) {
    const m = String(text).match(/(\d{1,2}):(\d{2})/);
    return m ? Number(m[1])*60+Number(m[2]) : 9999;
  }
  function dedupeById(items) {
    const map = new Map();
    items.forEach(x => { if (x && x.id) map.set(x.id, x); });
    return [...map.values()];
  }

  function localEvents() { return readJson(KEYS.events, []); }
  function allEvents() { return dedupeById([...(S.syncedEvents || []), ...localEvents()]).sort((a,b)=>(a.createdAt||"").localeCompare(b.createdAt||"")); }
  function eventsForDate(key) { return allEvents().filter(e => e.date === key); }
  function localSessions() { return readJson(KEYS.sessions, []); }
  function allSessions() { return dedupeById([...(S.syncedWorkoutSessions || []), ...localSessions()]).sort((a,b)=>(a.date||"").localeCompare(b.date||"")); }
  function allMeasurements() { return [...(S.syncedMeasurements || []), ...readJson(KEYS.progress, [])].sort((a,b)=>a.date.localeCompare(b.date)); }

  async function loadEquipmentCatalog() {
    try {
      const config = await fetch("equipment-catalog.json?v=4").then(r => r.json());
      const chunks = await Promise.all((config.dataFiles || []).map(path => fetch(`${path}?v=4`).then(r => r.json())));
      state.catalog = chunks.flat();
      state.catalogById = new Map(state.catalog.map(x => [x.id, x]));
    } catch (e) {
      console.error("Equipment catalog load failed", e);
    }
  }

  function completedSessionCount() {
    return allSessions().filter(s => s.countsTowardSequence !== false && (s.status === "complete" || s.status === "partial-counted")).length;
  }
  function nextWorkoutId() {
    const seq = S.trainingPolicy.sequence;
    return seq[completedSessionCount() % seq.length];
  }
  function currentSequenceInfo() {
    const count = completedSessionCount();
    const seq = S.trainingPolicy.sequence;
    return { count, index: count % seq.length, nextWorkoutId: seq[count % seq.length] };
  }

  function basePlanForDate(key) {
    const d = parseDateKey(key);
    const dow = d.getDay();
    const base = D.week[dow];
    return { ...base, date: key, source: "weekly" };
  }

  function effectivePlanForDate(key) {
    const base = basePlanForDate(key);
    const dayEvents = eventsForDate(key);
    const skip = dayEvents.find(e => e.type === "skip_workout");
    const sick = dayEvents.find(e => e.type === "sick_or_pain");
    const makeup = allEvents().find(e => e.type === "skip_workout" && e.resumeDate === key);
    const preferred = (S.trainingPolicy.preferredStrengthWeekdays || []).includes(parseDateKey(key).getDay());
    const shouldStrength = preferred || Boolean(makeup);

    if (sick) {
      return { type: "rest", title: "Recovery / không cố tập", subtitle: sick.note || "Bạn đã báo không khỏe hoặc đau bất thường.", workoutId: null, date:key, source:"override", reason:"sick_or_pain" };
    }
    if (skip) {
      return { type: "rest", title: "Hôm nay đã báo không tập", subtitle: skip.note || "Buổi tạ chưa mất: nó vẫn là buổi kế tiếp trong chuỗi.", workoutId: null, date:key, source:"override", reason:"skip_workout", resumeDate: skip.resumeDate || null };
    }
    if (shouldStrength) {
      const id = nextWorkoutId();
      const w = D.workouts[id];
      return {
        type: "strength",
        title: makeup ? `Bù ${w.title}` : w.title,
        subtitle: makeup ? `Buổi bị lỡ được chuyển sang hôm nay; không ghép thêm buổi khác.` : w.focus,
        workoutId: id,
        date: key,
        source: makeup ? "makeup" : "rolling-sequence"
      };
    }
    return base;
  }

  function todayPlan() { return effectivePlanForDate(dateKey()); }

  function recoveryState() {
    const c = readJson(KEYS.checkins, {})[dateKey()];
    const painEvent = eventsForDate(dateKey()).find(e=>e.type==="sick_or_pain");
    if (painEvent) return { level:"danger", label:"Không khỏe / đau", note:"Không cố hoàn thành giáo án. Dừng bài gây đau; app không tự chẩn đoán chấn thương.", volumeFactor:0 };
    if (!c) return { level:"unknown", label:"Chưa check-in", note:"Điền check-in để PT điều chỉnh mức độ tập hôm nay.", volumeFactor:1 };
    if (Number(c.soreness) >= 4) return { level:"danger", label:"Cần thận trọng", note:"Bạn đánh dấu đau bất thường. Không tập xuyên đau.", volumeFactor:0 };
    if (Number(c.sleepHours) < 6 && Number(c.energy) <= 2) return { level:"warn", label:"Recovery thấp", note:"Giảm khoảng 20% planned sets, giữ RIR ≥2 và không cố failure.", volumeFactor:.8 };
    if (Number(c.sleepHours) < 6.5 || Number(c.energy) <= 2 || Number(c.soreness) >= 3) return { level:"warn", label:"Recovery vừa", note:"Giữ mức tạ thận trọng; có thể bỏ một set accessory nếu xuống sức.", volumeFactor:.9 };
    return { level:"good", label:"Recovery tốt", note:"Có thể giữ nguyên giáo án và progressive overload theo log trước.", volumeFactor:1 };
  }

  function renderHeader() {
    const d = new Date();
    $("date-badge").innerHTML = `<strong>${String(d.getDate()).padStart(2,"0")}</strong><span>${new Intl.DateTimeFormat("vi-VN",{month:"short"}).format(d)}</span>`;
    const plan = todayPlan();
    $("header-subtitle").textContent = `${formatDateVi(d)} • ${plan.title}`;
  }

  function renderTodayHero() {
    const plan = todayPlan();
    const rec = recoveryState();
    const w = plan.type === "strength" ? D.workouts[plan.workoutId] : null;
    $("today-hero").innerHTML = `<div class="hero-card"><div class="hero-top"><div><p class="eyebrow">HÔM NAY • ${escapeHtml(plan.source)}</p><h2>${escapeHtml(plan.title)}</h2><p class="muted">${escapeHtml(plan.subtitle)}</p></div>${w ? `<button class="primary" data-go-workout>Workout</button>` : ""}</div><div class="hero-meta">${w ? `<span class="pill">⏱ ${escapeHtml(w.duration)}</span><span class="pill">🎯 ${escapeHtml(w.focus)}</span><span class="pill">${w.exercises.length} bài</span>` : `<span class="pill">Không có buổi tạ bắt buộc</span>`}<span class="pill ${rec.level === "good" ? "good" : rec.level === "warn" ? "warn" : rec.level === "danger" ? "danger" : ""}">${escapeHtml(rec.label)}</span></div></div>`;
    $$('[data-go-workout]').forEach(btn=>btn.onclick=()=>switchTab("workout"));
  }

  function renderAdaptation() {
    const events = eventsForDate(dateKey());
    if (!events.length) { $("adaptation-card").innerHTML = ""; return; }
    const plan = todayPlan();
    let cls = events.some(e=>e.type==="sick_or_pain") ? "danger" : events.some(e=>e.type==="skip_workout") ? "" : "good";
    const chips = events.map(e=>`<span class="event-chip">${escapeHtml(EVENT_LABELS[e.type] || e.type)}</span>`).join("");
    const explanation = adaptationText(events, plan);
    $("adaptation-card").innerHTML = `<div class="adapt-card ${cls}"><h3>PT đã điều chỉnh</h3><p>${escapeHtml(explanation)}</p><div class="event-chips">${chips}</div></div>`;
  }

  function adaptationText(events, plan) {
    if (events.some(e=>e.type==="sick_or_pain")) return "Hôm nay ưu tiên hồi phục và an toàn. Không cần cố bù volume đã bỏ.";
    const skip = events.find(e=>e.type==="skip_workout");
    if (skip) return skip.resumeDate ? `Buổi tạ vẫn giữ nguyên trong chuỗi và được ưu tiên lại từ ${formatShortDate(skip.resumeDate)}. Không ghép hai buổi vào cùng ngày.` : "Buổi tạ chưa hoàn thành vẫn là buổi kế tiếp; app sẽ đưa nó vào ngày strength khả dụng tiếp theo.";
    const partial = events.find(e=>e.type==="partial_workout");
    if (partial) return Number(partial.completionPct)>=S.trainingPolicy.rules.partialWorkoutThresholdPct ? "Buổi một phần đã đạt ngưỡng để tính là hoàn thành. Không cần truy đuổi toàn bộ accessory bị bỏ." : "Buổi mới hoàn thành ít phần chính nên chưa advance chuỗi; lần strength tới app vẫn ưu tiên buổi này.";
    if (events.some(e=>e.type==="missed_meal")) return "Không ăn bù gấp đôi. Quay lại bữa tiếp theo và ưu tiên nguồn protein rõ ràng.";
    if (events.some(e=>e.type==="offplan_meal")) return "Không nhịn ăn hay cardio phạt. Ghi nhận và quay lại cấu trúc bữa tiếp theo.";
    return `Kế hoạch hôm nay đã ghi nhận thay đổi. Hiện tại: ${plan.title}.`;
  }

  function renderCheckin() {
    const all = readJson(KEYS.checkins, {});
    const c = all[dateKey()];
    if (c) {
      $("sleep-hours").value = c.sleepHours;
      $("sleep-quality").value = c.sleepQuality;
      $("energy").value = c.energy;
      $("soreness").value = c.soreness;
    }
    const rec = recoveryState();
    const pill = $("recovery-pill");
    pill.textContent = rec.label;
    pill.className = `pill ${rec.level === "good" ? "good" : rec.level === "warn" ? "warn" : rec.level === "danger" ? "danger" : ""}`;
  }

  function renderTasks() {
    const plan = todayPlan();
    const seq = currentSequenceInfo();
    const strengthText = plan.type === "strength" ? `${plan.title} • ${D.workouts[plan.workoutId].duration}` : plan.subtitle;
    const tasks = [
      ["🏋", strengthText, plan.type === "strength" ? `Buổi #${seq.count+1} trong rolling sequence.` : "Không cần tạo workout bù ngẫu nhiên."],
      ["🥩", `Protein mục tiêu ${D.profile.proteinTarget} g`, "Nếu lỡ một bữa, ưu tiên protein ở các bữa còn lại thay vì ăn bù gấp đôi."],
      ["💧", `Nước khoảng ${(D.profile.waterTargetMl/1000).toFixed(1)} L`, "Điều chỉnh thêm theo khát, thời tiết và lượng vận động."],
      ["🚶", `Khoảng ${D.profile.stepsTarget.toLocaleString("vi-VN")} bước / vận động trong ngày`, "Đứng dậy đi lại sau các khoảng ngồi dài."],
      ["🌙", "Chuẩn bị ngủ 23:15 • mục tiêu ngủ 23:30", "Giấc ngủ kém sẽ làm app giảm training demand hôm sau."]
    ];
    $("today-tasks").innerHTML = tasks.map(([icon,title,note])=>`<div class="card task"><div class="task-check">${icon}</div><div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(note)}</p></div></div>`).join("");
  }

  function nextMeal() {
    const now = minutesNow();
    return D.meals.find(m=>firstTimeMinutes(m.time)>now) || D.meals[0];
  }
  function renderNextMeal() {
    const m = nextMeal();
    const mealEvents = eventsForDate(dateKey()).filter(e=>["missed_meal","offplan_meal"].includes(e.type));
    let advice = "";
    if (mealEvents.some(e=>e.type==="missed_meal")) advice = `<div class="notice" style="margin-top:12px;margin-bottom:0">Đã có bữa bị lỡ: không ăn bù gấp đôi; bữa tiếp theo trở lại cấu trúc bình thường và ưu tiên protein.</div>`;
    if (mealEvents.some(e=>e.type==="offplan_meal")) advice = `<div class="notice" style="margin-top:12px;margin-bottom:0">Đã có bữa ăn khác kế hoạch: không cần “phạt”. Bữa tiếp theo quay lại cấu trúc bình thường.</div>`;
    $("next-meal").innerHTML = `<p class="eyebrow">${escapeHtml(m.time)}</p><h3>${escapeHtml(m.title)}</h3><p class="muted">${escapeHtml(m.target)}</p><ul class="meal-options">${m.options.slice(0,2).map(x=>`<li>${escapeHtml(x)}</li>`).join("")}</ul>${advice}`;
  }

  function renderEquipmentStatus() {
    const ids = [...state.selectedEquipment];
    const resolved = ids.map(id=>state.catalogById.get(id)).filter(Boolean);
    const unresolved = S.equipment.unresolvedEquipment || [];
    $("equipment-status").innerHTML = `<div class="source-badge">✓ Source-controlled • ${resolved.length} thiết bị canonical</div><p class="muted" style="margin-top:12px">Personal PT không dùng localStorage để quyết định gym có máy nào. Inventory nằm trong <b>pt-source.js</b>, nên mọi thiết bị đều đọc cùng một danh sách.</p>${unresolved.length ? `<ul class="source-list">${unresolved.map(x=>`<li>${escapeHtml(x.labelVi)} — ${escapeHtml(x.reason)}</li>`).join("")}</ul>` : ""}<p class="sync-meta">Source updated: ${escapeHtml(S.sourceUpdatedAt)}</p>`;
  }

  function machineForExercise(ex) {
    const matchedId = (ex.equipment || []).find(id=>state.selectedEquipment.has(id));
    const id = matchedId || (ex.equipment || [])[0];
    return { matched:Boolean(matchedId), id, item:state.catalogById.get(id) };
  }
  function thumbnail(item, fallbackName) {
    if (!item) return "";
    if (item.image) return item.image;
    const q = `${item.imageQuery || item.name || fallbackName} commercial gym equipment product`;
    let hash = 0;
    for (const c of item.id || q) hash = ((hash << 5) - hash + c.charCodeAt(0)) | 0;
    const host = 1 + Math.abs(hash % 4);
    return `https://tse${host}.mm.bing.net/th?q=${encodeURIComponent(q)}&w=640&h=640&c=7&rs=1&p=0&pid=1.7&mkt=en-US&adlt=moderate`;
  }
  function exerciseFromRow(row) {
    const [key, sets, reps, rir, rest] = row;
    return { key, sets, reps, rir, rest, ...D.exerciseLibrary[key] };
  }
  function latestExerciseLog(key) {
    return [...readJson(KEYS.logs, [])].reverse().find(x=>x.exerciseKey===key) || null;
  }
  function adjustedSets(ex) {
    const factor = recoveryState().volumeFactor;
    if (factor >= .99) return ex.sets;
    if (factor <= 0) return 0;
    return Math.max(1, Math.round(ex.sets*factor));
  }
  function upperRepTarget(text) {
    const nums = String(text).match(/\d+/g)?.map(Number) || [];
    return nums.length ? Math.max(...nums.slice(0,2)) : null;
  }
  function progressionAdvice(ex) {
    const prev = latestExerciseLog(ex.key);
    const rec = recoveryState();
    if (!prev) return "Chưa có log trước. Chọn mức tạ cho phép hoàn thành rep range với khoảng RIR 2.";
    if (rec.level === "danger") return "Không ưu tiên progression hôm nay vì recovery/an toàn đang là vấn đề chính.";
    if (rec.level === "warn") return `Buổi trước: ${prev.sets.map(s=>`${s.weight||"?"}kg×${s.reps||"?"}`).join(" • ")}. Hôm nay ưu tiên kỹ thuật và RIR an toàn.`;
    const top = upperRepTarget(ex.reps);
    const valid = prev.sets.filter(s=>Number(s.reps)>0);
    const allTop = top && valid.length >= ex.sets && valid.slice(0,ex.sets).every(s=>Number(s.reps)>=top);
    const avgRir = valid.length ? valid.reduce((a,s)=>a+Number(s.rir||0),0)/valid.length : 0;
    if (allTop && avgRir >= 1) return `Đã chạm trần rep với RIR trung bình ${avgRir.toFixed(1)} → có thể tăng mức tạ nhỏ nhất rồi quay về đầu rep range.`;
    return `Giữ mức tạ và cố thêm rep sạch trước khi tăng. Buổi trước: ${prev.sets.map(s=>`${s.weight||"?"}kg×${s.reps||"?"} (RIR ${s.rir ?? "?"})`).join(" • ")}.`;
  }

  function renderWorkout() {
    const plan = todayPlan();
    const strength = plan.type === "strength";
    $("open-today-workout").classList.toggle("hidden", !strength);
    $("finish-workout").classList.toggle("hidden", !strength);
    if (!strength) {
      $("workout-title").textContent = plan.title;
      $("workout-subtitle").textContent = plan.subtitle;
      $("workout-list").innerHTML = "";
      $("workout-adjustment").classList.add("hidden");
      $("non-strength-workout").classList.remove("hidden");
      const next = D.workouts[nextWorkoutId()];
      $("non-strength-workout").innerHTML = `<h3>${plan.type === "rest" ? "Không cần tập tạ hôm nay" : "Recovery protocol"}</h3><p class="muted" style="margin-top:8px">${escapeHtml(plan.subtitle)}</p><p style="margin-top:14px"><b>Buổi tạ kế tiếp trong chuỗi:</b> ${escapeHtml(next.title)} — ${escapeHtml(next.focus)}.</p>`;
      return;
    }
    $("non-strength-workout").classList.add("hidden");
    const w = D.workouts[plan.workoutId];
    state.activeWorkoutId = plan.workoutId;
    const rec = recoveryState();
    $("workout-title").textContent = `${plan.title} — ${w.focus}`;
    $("workout-subtitle").textContent = `${w.duration} • rolling sequence • không cần bù volume của ngày đã lỡ.`;
    if (rec.volumeFactor < 1) {
      $("workout-adjustment").classList.remove("hidden");
      $("workout-adjustment").textContent = rec.note;
    } else $("workout-adjustment").classList.add("hidden");
    $("workout-list").innerHTML = w.exercises.map((row,index)=>{
      const ex = exerciseFromRow(row);
      const machine = machineForExercise(ex);
      const item = machine.item;
      const img = thumbnail(item, ex.name);
      const sets = adjustedSets(ex);
      const machineLabel = item ? `${item.name} — ${item.nameVi||""}` : "Chưa map được thiết bị trong catalog";
      return `<article class="card exercise-card">${img ? `<img class="machine-thumb" loading="lazy" referrerpolicy="no-referrer" src="${img}" alt="${escapeHtml(ex.name)}">` : `<div class="machine-thumb"></div>`}<div><p class="eyebrow">${index+1}/${w.exercises.length}</p><h3>${escapeHtml(ex.name)}</h3><p>${sets} × ${escapeHtml(ex.reps)} • RIR ${escapeHtml(ex.rir)} • nghỉ ${Math.round(ex.rest/6)/10} phút</p><div class="exercise-meta"><span class="availability ${machine.matched ? "ok" : "missing"}">${machine.matched ? "● Có máy canonical" : "● Cần bài thay thế / map thêm máy"}</span></div><p class="equipment-line">${escapeHtml(machineLabel)}</p></div><div class="exercise-actions"><button class="mini-btn" data-exercise="${escapeHtml(ex.key)}" type="button">Hướng dẫn & log</button></div></article>`;
    }).join("");
    $$('[data-exercise]').forEach(btn=>btn.onclick=()=>openExercise(btn.dataset.exercise));
  }

  function workoutRowForKey(key) {
    const plan = todayPlan();
    if (plan.type === "strength") return D.workouts[plan.workoutId].exercises.find(r=>r[0]===key) || null;
    for (const w of Object.values(D.workouts)) {
      const row = w.exercises.find(r=>r[0]===key);
      if (row) return row;
    }
    return null;
  }

  function openExercise(key) {
    const row = workoutRowForKey(key);
    if (!row) return;
    const ex = exerciseFromRow(row);
    ex.sets = adjustedSets(ex);
    const machine = machineForExercise(ex);
    const item = machine.item;
    const img = thumbnail(item, ex.name);
    const prev = latestExerciseLog(key);
    const defaultWeight = prev?.sets?.[0]?.weight ?? "";
    const setRows = Array.from({length:ex.sets},(_,i)=>`<div class="set-row"><span>Set ${i+1}</span><input data-field="weight" data-set="${i}" inputmode="decimal" type="number" step="0.5" min="0" placeholder="kg" value="${escapeHtml(defaultWeight)}"><input data-field="reps" data-set="${i}" inputmode="numeric" type="number" min="0" placeholder="reps"><input data-field="rir" data-set="${i}" inputmode="numeric" type="number" min="0" max="6" placeholder="RIR"></div>`).join("");
    $("modal-content").innerHTML = `<div class="guide-hero">${img ? `<img loading="lazy" referrerpolicy="no-referrer" src="${img}" alt="${escapeHtml(ex.name)}">` : ""}<div><p class="eyebrow">${escapeHtml(ex.nameVi)}</p><h2>${escapeHtml(ex.name)}</h2><p class="muted">${escapeHtml(ex.primary)}</p></div></div><div class="progression">${escapeHtml(progressionAdvice(ex))}</div><div class="guide-section"><h3>MÁY / THIẾT BỊ</h3><p class="muted">${item ? `${escapeHtml(item.name)} — ${escapeHtml(item.nameVi||"")}` : "Chưa khớp được thiết bị."} ${machine.matched ? "✓ Có trong source inventory." : "⚠ Chưa có trong source inventory; chọn bài thay thế cùng pattern nếu cần."}</p></div><div class="guide-section"><h3>SETUP</h3><ul>${ex.setup.map(x=>`<li>${escapeHtml(x)}</li>`).join("")}</ul></div><div class="guide-section"><h3>CUES</h3><ul>${ex.cues.map(x=>`<li>${escapeHtml(x)}</li>`).join("")}</ul></div><div class="guide-section"><h3>NHỊP & HÍT THỞ</h3><p class="muted">Tempo: <b>${escapeHtml(ex.tempo)}</b><br>${escapeHtml(ex.breathing)}</p></div><div class="guide-section"><h3>TRÁNH</h3><ul>${ex.avoid.map(x=>`<li>${escapeHtml(x)}</li>`).join("")}</ul></div><div class="guide-section"><h3>LOG HÔM NAY — ${ex.sets} × ${escapeHtml(ex.reps)}</h3><div class="set-table">${setRows}</div><button id="save-exercise-log" class="primary wide" style="margin-top:12px" type="button">Lưu bài này</button></div>`;
    $("save-exercise-log").onclick=()=>saveExerciseLog(key,ex);
    openModal("exercise-modal");
  }

  function saveExerciseLog(key, ex) {
    const rows = $$(".set-row", $("modal-content"));
    const sets = rows.map(row=>({ weight:Number(row.querySelector('[data-field="weight"]').value||0), reps:Number(row.querySelector('[data-field="reps"]').value||0), rir:Number(row.querySelector('[data-field="rir"]').value||0) })).filter(s=>s.weight||s.reps);
    if (!sets.length) return alert("Hãy nhập ít nhất reps hoặc mức tạ của một set.");
    const logs = readJson(KEYS.logs, []);
    logs.push({ id:uid("log"), date:dateKey(), time:new Date().toISOString(), workoutId:state.activeWorkoutId, exerciseKey:key, target:{sets:ex.sets,reps:ex.reps,rir:ex.rir}, sets });
    writeJson(KEYS.logs, logs.slice(-500));
    closeModal("exercise-modal");
    toast("Đã lưu bài tập");
    renderCoach();
  }

  function finishWorkout() {
    const plan = todayPlan();
    if (plan.type !== "strength") return;
    const sessions = localSessions();
    const already = sessions.find(s=>s.date===dateKey() && ["complete","partial-counted"].includes(s.status));
    if (already) return alert("Buổi hôm nay đã được ghi hoàn tất.");
    sessions.push({ id:uid("session"), date:dateKey(), createdAt:new Date().toISOString(), workoutId:plan.workoutId, status:"complete", countsTowardSequence:true });
    writeJson(KEYS.sessions, sessions);
    toast("Đã hoàn tất buổi • chuỗi đã advance");
    renderAll();
  }

  function renderNutrition() {
    $("calorie-target").textContent = D.profile.calorieTarget;
    $("protein-target").textContent = D.profile.proteinTarget;
    $("water-target").textContent = (D.profile.waterTargetMl/1000).toFixed(1);
    $("steps-target").textContent = D.profile.stepsTarget.toLocaleString("vi-VN");
    const events = eventsForDate(dateKey());
    const mealEvents = events.filter(e=>["missed_meal","offplan_meal"].includes(e.type));
    $("nutrition-adaptation").innerHTML = mealEvents.length ? `<div class="nutrition-alert">${mealEvents.map(e=>`<div class="adapt-card"><h3>${escapeHtml(EVENT_LABELS[e.type])}</h3><p>${escapeHtml(e.type==="missed_meal" ? "Không ăn bù gấp đôi. Quay lại bữa tiếp theo; ưu tiên nguồn protein rõ ràng." : "Không nhịn ăn/cardio phạt. Quay lại cấu trúc bữa kế tiếp.")} ${e.note ? `Ghi chú: ${escapeHtml(e.note)}` : ""}</p></div>`).join("")}</div>` : "";
    const allMeals = readJson(KEYS.meals, {});
    const dayMeals = allMeals[dateKey()] || {};
    $("meal-list").innerHTML = D.meals.map(m=>{
      const missed = mealEvents.find(e=>e.type==="missed_meal" && e.mealId===m.id);
      return `<article class="card meal-card"><label class="meal-done"><input type="checkbox" data-meal="${escapeHtml(m.id)}" ${dayMeals[m.id] ? "checked" : ""}></label><p class="eyebrow">${escapeHtml(m.time)}</p><h3>${escapeHtml(m.title)}</h3><p>${escapeHtml(m.target)}</p>${missed ? `<div class="meal-status">Đã báo lỡ bữa này</div>` : ""}<ul class="meal-options">${m.options.map(x=>`<li>${escapeHtml(x)}</li>`).join("")}</ul></article>`;
    }).join("");
    $$('[data-meal]').forEach(el=>el.onchange=()=>{
      const data = readJson(KEYS.meals, {});
      data[dateKey()] = data[dateKey()] || {};
      data[dateKey()][el.dataset.meal] = el.checked;
      writeJson(KEYS.meals, data);
    });
  }

  function renderProgress() {
    const rows = allMeasurements();
    const last = rows.at(-1);
    const firstRecent = rows.length > 1 ? rows[Math.max(0, rows.length-4)] : null;
    if (!last) $("progress-summary").innerHTML = `<h3>Chưa có số đo</h3><p class="muted" style="margin-top:8px">Bắt đầu bằng cân nặng và vòng bụng. Đo trong điều kiện tương tự để so sánh.</p>`;
    else {
      const wd = firstRecent && Number.isFinite(firstRecent.weight) && Number.isFinite(last.weight) ? last.weight-firstRecent.weight : null;
      const ed = firstRecent && Number.isFinite(firstRecent.waist) && Number.isFinite(last.waist) ? last.waist-firstRecent.waist : null;
      $("progress-summary").innerHTML = `<p class="eyebrow">MỚI NHẤT • ${formatShortDate(last.date)}</p><div class="target-grid" style="margin-top:10px"><div class="metric"><span>Cân nặng</span><strong>${last.weight ?? "—"}</strong><small>kg ${wd===null?"":`• ${wd>=0?"+":""}${wd.toFixed(1)}`}</small></div><div class="metric"><span>Vòng bụng</span><strong>${last.waist ?? "—"}</strong><small>cm ${ed===null?"":`• ${ed>=0?"+":""}${ed.toFixed(1)}`}</small></div></div>`;
    }
    $("progress-history").innerHTML = [...rows].reverse().slice(0,10).map(r=>`<div class="card history-row"><div><strong>${formatShortDate(r.date)}</strong><small>${r.source === "source" ? "Canonical source" : "Local/browser"}</small></div><div style="text-align:right"><b>${r.weight ?? "—"} kg</b><br><span class="muted">${r.waist ?? "—"} cm eo</span></div></div>`).join("");
  }

  function renderCoach() {
    const rec = recoveryState();
    const rows = allMeasurements();
    const events = allEvents();
    const sessions = allSessions();
    const notes = [];
    notes.push(`<div class="coach-item"><b>Hôm nay:</b> ${escapeHtml(rec.note)}</div>`);
    const seq = currentSequenceInfo();
    const next = D.workouts[seq.nextWorkoutId];
    notes.push(`<div class="coach-item"><b>Rolling sequence:</b> đã ghi ${seq.count} buổi hoàn thành. Buổi strength kế tiếp là <b>${escapeHtml(next.title)}</b>. Nếu bỏ một ngày, thứ tự không nhảy qua buổi này.</div>`);
    const recentEvents = events.slice(-5);
    if (recentEvents.length) notes.push(`<div class="coach-item"><b>Thay đổi gần đây:</b> ${recentEvents.map(e=>`${formatShortDate(e.date)} ${EVENT_LABELS[e.type]||e.type}`).join(" • ")}.</div>`);
    if (rows.length >= 2) {
      const a = rows[Math.max(0,rows.length-4)], b = rows.at(-1);
      const dw = Number(b.weight||0)-Number(a.weight||0);
      const de = Number(b.waist||0)-Number(a.waist||0);
      if (Math.abs(dw)<=.4 && de<-.3) notes.push(`<div class="coach-item trend-good"><b>Recomp đúng hướng:</b> cân gần ổn định (${dw>=0?"+":""}${dw.toFixed(1)} kg), eo giảm ${Math.abs(de).toFixed(1)} cm → chưa cần giảm calories.</div>`);
      else if (dw>.5 && de>.5) notes.push(`<div class="coach-item trend-warn"><b>Theo dõi surplus:</b> cân +${dw.toFixed(1)} kg và eo +${de.toFixed(1)} cm. Nếu xu hướng lặp lại và performance không tăng tương ứng, cân nhắc giảm 100–150 kcal/ngày.</div>`);
      else notes.push(`<div class="coach-item"><b>Dinh dưỡng:</b> chưa có tín hiệu đủ mạnh để đổi target ${D.profile.calorieTarget} kcal.</div>`);
    } else notes.push(`<div class="coach-item"><b>Tiến độ:</b> cần thêm số đo cân + vòng eo để đánh giá recomp thay vì chỉ nhìn một ngày.</div>`);
    $("coach-analysis").innerHTML = `<p class="eyebrow">MỤC TIÊU</p><h3>${escapeHtml(D.profile.goal)}</h3><div class="coach-list">${notes.join("")}</div><p class="sync-meta">Canonical events: ${(S.syncedEvents||[]).length} • Local events: ${localEvents().length} • Sessions: ${sessions.length}</p>`;
  }

  function renderChangeDynamic() {
    const type = $("change-type").value;
    let html = "";
    if (type === "skip_workout") {
      html = `<div class="dynamic-grid"><label>Ngày sớm nhất có thể tập lại<input id="change-resume-date" type="date" value="${addDays(dateKey(),1)}"></label><label>Lý do<select id="change-reason"><option>OT / công việc</option><option>Đi ra ngoài / có việc</option><option>Di chuyển</option><option>Mệt / thiếu ngủ</option><option>Khác</option></select></label></div>`;
    } else if (type === "partial_workout") {
      html = `<div class="dynamic-grid"><label>Ước tính đã hoàn thành<input id="change-completion" type="number" min="0" max="100" step="5" value="50"></label><label>% planned sets<select id="change-main-done"><option value="yes">Đã làm các bài chính</option><option value="no">Chưa làm đủ bài chính</option></select></label></div>`;
    } else if (type === "missed_meal") {
      html = `<div class="dynamic-grid"><label>Bữa bị lỡ<select id="change-meal">${D.meals.map(m=>`<option value="${escapeHtml(m.id)}">${escapeHtml(m.title)} • ${escapeHtml(m.time)}</option>`).join("")}</select></label><label>Do<select id="change-reason"><option>Không có thời gian</option><option>Không đói</option><option>Không có đồ ăn phù hợp</option><option>Khác</option></select></label></div>`;
    } else if (type === "offplan_meal") {
      html = `<div class="dynamic-grid"><label>Bữa nào?<select id="change-meal">${D.meals.map(m=>`<option value="${escapeHtml(m.id)}">${escapeHtml(m.title)}</option>`).join("")}</select></label><label>Mức lệch<select id="change-size"><option value="small">Nhẹ</option><option value="medium">Vừa</option><option value="large">Nhiều</option></select></label></div>`;
    } else if (type === "schedule_shift") {
      html = `<div class="dynamic-grid"><label>Phần lịch bị lệch<select id="change-schedule"><option value="late_work">Tan làm muộn</option><option value="late_sleep">Ngủ muộn</option><option value="late_wake">Dậy muộn</option><option value="travel">Di chuyển nhiều</option><option value="other">Khác</option></select></label><label>Số giờ lệch (ước tính)<input id="change-hours" type="number" min="0" max="12" step="0.5" value="1"></label></div>`;
    } else if (type === "sick_or_pain") {
      html = `<div class="dynamic-grid"><label>Tình trạng<select id="change-health"><option value="pain">Đau bất thường</option><option value="sick">Không khỏe</option><option value="very_fatigued">Mệt bất thường</option></select></label><label>Mức độ<select id="change-severity"><option value="mild">Nhẹ</option><option value="moderate">Vừa</option><option value="high">Nhiều</option></select></label></div>`;
    }
    $("change-dynamic").innerHTML = html;
  }

  function saveChangeEvent() {
    const type = $("change-type").value;
    const event = { id:uid("evt"), date:dateKey(), createdAt:new Date().toISOString(), type, note:$("change-note").value.trim() };
    if (type === "skip_workout") {
      event.resumeDate = $("change-resume-date")?.value || null;
      event.reason = $("change-reason")?.value || "";
      event.missedWorkoutId = todayPlan().workoutId || nextWorkoutId();
    }
    if (type === "partial_workout") {
      event.completionPct = Number($("change-completion")?.value || 0);
      event.mainExercisesDone = $("change-main-done")?.value === "yes";
      const threshold = S.trainingPolicy.rules.partialWorkoutThresholdPct;
      if (event.completionPct >= threshold && event.mainExercisesDone) {
        const sessions = localSessions();
        sessions.push({ id:uid("session"), date:dateKey(), createdAt:event.createdAt, workoutId:todayPlan().workoutId || nextWorkoutId(), status:"partial-counted", countsTowardSequence:true, completionPct:event.completionPct });
        writeJson(KEYS.sessions, sessions);
      }
    }
    if (type === "missed_meal") { event.mealId = $("change-meal")?.value || null; event.reason = $("change-reason")?.value || ""; }
    if (type === "offplan_meal") { event.mealId = $("change-meal")?.value || null; event.size = $("change-size")?.value || "medium"; }
    if (type === "schedule_shift") { event.schedulePart = $("change-schedule")?.value || "other"; event.hoursShifted = Number($("change-hours")?.value || 0); }
    if (type === "sick_or_pain") { event.healthType = $("change-health")?.value || "pain"; event.severity = $("change-severity")?.value || "mild"; }
    const events = localEvents();
    events.push(event);
    writeJson(KEYS.events, events);
    closeModal("change-modal");
    $("change-note").value = "";
    toast("Đã ghi thay đổi & tính lại kế hoạch");
    renderAll();
  }

  function ptUpdatePayload() {
    return {
      format: "MYGYM_PT_UPDATE_V2",
      sourceUpdatedAt: S.sourceUpdatedAt,
      generatedAt: new Date().toISOString(),
      profile: S.profile,
      today: dateKey(),
      effectivePlan: todayPlan(),
      checkin: readJson(KEYS.checkins,{})[dateKey()] || null,
      recentEvents: localEvents().slice(-10),
      recentSessions: localSessions().slice(-8),
      recentMeasurements: readJson(KEYS.progress,[]).slice(-8),
      recentWorkoutLogs: readJson(KEYS.logs,[]).slice(-20),
      instruction: "Merge relevant durable events/measurements/sessions into pt-source.js, then re-evaluate the next workout, nutrition and recovery plan. Do not double-count items already present by id."
    };
  }
  function ptUpdateText() {
    return `MYGYM_PT_UPDATE_V2\n${JSON.stringify(ptUpdatePayload(), null, 2)}`;
  }

  function syncSnapshotText() {
    const payload = {
      format:"MYGYM_SYNC_V2",
      exportedAt:new Date().toISOString(),
      data:{
        checkins:readJson(KEYS.checkins,{}),
        progress:readJson(KEYS.progress,[]),
        logs:readJson(KEYS.logs,[]).slice(-300),
        meals:readJson(KEYS.meals,{}),
        events:localEvents(),
        sessions:localSessions()
      }
    };
    return `MYGYM_SYNC_V2:${btoa(unescape(encodeURIComponent(JSON.stringify(payload))))}`;
  }
  function importSnapshot(text) {
    const raw = text.trim().replace(/^MYGYM_SYNC_V2:/,"");
    const payload = JSON.parse(decodeURIComponent(escape(atob(raw))));
    if (payload.format !== "MYGYM_SYNC_V2" || !payload.data) throw new Error("Snapshot không đúng định dạng");
    const d = payload.data;
    writeJson(KEYS.checkins,{...readJson(KEYS.checkins,{}),...(d.checkins||{})});
    writeJson(KEYS.progress,dedupeById([...(readJson(KEYS.progress,[]).map(x=>({...x,id:x.id||`measure_${x.date}`}))),...((d.progress||[]).map(x=>({...x,id:x.id||`measure_${x.date}`})))]).map(({id,...x})=>x));
    writeJson(KEYS.logs,dedupeById([...(readJson(KEYS.logs,[])),...(d.logs||[])]));
    writeJson(KEYS.meals,{...readJson(KEYS.meals,{}),...(d.meals||{})});
    writeJson(KEYS.events,dedupeById([...(localEvents()),...(d.events||[])]));
    writeJson(KEYS.sessions,dedupeById([...(localSessions()),...(d.sessions||[])]));
  }

  function openModal(id) { $(id).classList.add("open"); $(id).setAttribute("aria-hidden","false"); }
  function closeModal(id) { $(id).classList.remove("open"); $(id).setAttribute("aria-hidden","true"); }
  function switchTab(name) {
    $$(".tab").forEach(x=>x.classList.toggle("active",x.dataset.tab===name));
    $$(".panel").forEach(x=>x.classList.toggle("active",x.id===`panel-${name}`));
    window.scrollTo({top:0,behavior:"smooth"});
  }

  function bindEvents() {
    $$(".tab").forEach(btn=>btn.onclick=()=>switchTab(btn.dataset.tab));
    $("checkin-form").onsubmit=e=>{
      e.preventDefault();
      const all = readJson(KEYS.checkins,{});
      all[dateKey()] = { sleepHours:Number($("sleep-hours").value||0), sleepQuality:Number($("sleep-quality").value), energy:Number($("energy").value), soreness:Number($("soreness").value) };
      writeJson(KEYS.checkins,all);
      toast("Đã cập nhật recovery");
      renderAll();
    };
    $("progress-form").onsubmit=e=>{
      e.preventDefault();
      const wr=$("progress-weight").value, er=$("progress-waist").value;
      if (!wr && !er) return alert("Nhập cân nặng hoặc vòng bụng.");
      const rows = readJson(KEYS.progress,[]);
      const entry={date:dateKey(),weight:wr?Number(wr):null,waist:er?Number(er):null,source:"local"};
      const idx=rows.findIndex(x=>x.date===entry.date);
      idx>=0?rows.splice(idx,1,entry):rows.push(entry);
      writeJson(KEYS.progress,rows);
      toast("Đã lưu số đo");
      renderProgress(); renderCoach();
    };
    $("open-today-workout").onclick=()=>{
      const plan=todayPlan();
      const first=plan.type==="strength"?D.workouts[plan.workoutId]?.exercises?.[0]?.[0]:null;
      if(first) openExercise(first);
    };
    $("finish-workout").onclick=finishWorkout;
    $("modal-close").onclick=()=>closeModal("exercise-modal");
    $("exercise-modal").onclick=e=>{if(e.target===$("exercise-modal"))closeModal("exercise-modal")};
    $("open-change").onclick=()=>{renderChangeDynamic();openModal("change-modal")};
    $("change-close").onclick=()=>closeModal("change-modal");
    $("change-modal").onclick=e=>{if(e.target===$("change-modal"))closeModal("change-modal")};
    $("change-type").onchange=renderChangeDynamic;
    $("change-form").onsubmit=e=>{e.preventDefault();saveChangeEvent()};
    $("copy-pt-update").onclick=async()=>{await navigator.clipboard.writeText(ptUpdateText());toast("Đã copy PT update")};
    $("share-pt-update").onclick=async()=>{
      const text=ptUpdateText();
      if(navigator.share){try{await navigator.share({title:"MyGym PT update",text});return}catch(e){if(e.name==="AbortError")return}}
      await navigator.clipboard.writeText(text);toast("Không share trực tiếp được • đã copy")
    };
    $("copy-sync").onclick=async()=>{await navigator.clipboard.writeText(syncSnapshotText());toast("Đã copy sync snapshot")};
    $("open-sync-import").onclick=()=>openModal("sync-modal");
    $("sync-close").onclick=()=>closeModal("sync-modal");
    $("sync-modal").onclick=e=>{if(e.target===$("sync-modal"))closeModal("sync-modal")};
    $("sync-import").onclick=()=>{
      try{importSnapshot($("sync-input").value);closeModal("sync-modal");$("sync-input").value="";toast("Đã merge snapshot");renderAll()}
      catch(e){alert(`Không import được: ${e.message}`)}
    };
  }

  function renderAll() {
    renderHeader();
    renderTodayHero();
    renderAdaptation();
    renderCheckin();
    renderTasks();
    renderNextMeal();
    renderEquipmentStatus();
    renderWorkout();
    renderNutrition();
    renderProgress();
    renderCoach();
  }

  async function init() {
    await loadEquipmentCatalog();
    bindEvents();
    renderChangeDynamic();
    renderAll();
  }

  init();
})();