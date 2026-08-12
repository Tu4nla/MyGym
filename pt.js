(() => {
  const D = window.PT_DATA;
  const $ = (id) => document.getElementById(id);
  const $$ = (q, root = document) => [...root.querySelectorAll(q)];
  const KEYS = {
    checkins: "mygym.pt.checkins.v1",
    progress: "mygym.pt.progress.v1",
    logs: "mygym.pt.logs.v1",
    meals: "mygym.pt.meals.v1"
  };

  const state = {
    catalog: [],
    catalogById: new Map(),
    selectedEquipment: new Set(),
    equipmentStorageKey: "mygym.selectedEquipment.v2",
    selectedFromFallback: false,
    activeWorkoutId: null
  };

  function readJson(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch { return fallback; }
  }
  function writeJson(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
  function dateKey(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  function escapeHtml(v = "") {
    return String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function toast(text) {
    const el = $("toast");
    el.textContent = text;
    el.classList.add("show");
    clearTimeout(toast.t);
    toast.t = setTimeout(() => el.classList.remove("show"), 1500);
  }
  function formatDateVi(date = new Date()) {
    return new Intl.DateTimeFormat("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
  }
  function formatShortDate(s) {
    const [y, m, d] = s.split("-");
    return `${d}/${m}/${y}`;
  }
  function minutesNow() {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  }
  function firstTimeMinutes(text) {
    const m = String(text).match(/(\d{1,2}):(\d{2})/);
    return m ? Number(m[1]) * 60 + Number(m[2]) : 9999;
  }

  async function loadEquipment() {
    try {
      const config = await fetch("equipment-catalog.json?v=4").then(r => r.json());
      state.equipmentStorageKey = config.selectionStorageKey || state.equipmentStorageKey;
      const chunks = await Promise.all((config.dataFiles || []).map(path => fetch(`${path}?v=4`).then(r => r.json())));
      state.catalog = chunks.flat();
      state.catalogById = new Map(state.catalog.map(x => [x.id, x]));
      const saved = readJson(state.equipmentStorageKey, []);
      if (Array.isArray(saved) && saved.length) {
        state.selectedEquipment = new Set(saved);
        state.selectedFromFallback = false;
      } else {
        state.selectedEquipment = new Set(D.profile.knownEquipmentFallback || []);
        state.selectedFromFallback = true;
      }
    } catch (e) {
      console.error(e);
      state.selectedEquipment = new Set(D.profile.knownEquipmentFallback || []);
      state.selectedFromFallback = true;
    }
  }

  function importEquipmentShareLink(raw) {
    try {
      const url = new URL(raw, location.href);
      const hash = url.hash.replace(/^#selected=/, "");
      if (!hash) throw new Error("Link không có danh sách selected");
      const ids = JSON.parse(decodeURIComponent(atob(hash)));
      if (!Array.isArray(ids) || !ids.length) throw new Error("Danh sách máy rỗng");
      state.selectedEquipment = new Set(ids);
      state.selectedFromFallback = false;
      writeJson(state.equipmentStorageKey, ids);
      renderAll();
      toast(`Đã nhập ${ids.length} thiết bị`);
    } catch (e) {
      alert(`Không đọc được link máy: ${e.message}`);
    }
  }

  function machineForExercise(ex) {
    const matchedId = (ex.equipment || []).find(id => state.selectedEquipment.has(id));
    const preferredId = matchedId || (ex.equipment || [])[0];
    const item = state.catalogById.get(preferredId);
    return { matched: Boolean(matchedId), id: preferredId, item };
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

  function todayPlan() { return D.week[new Date().getDay()]; }

  function recoveryState() {
    const c = readJson(KEYS.checkins, {})[dateKey()];
    if (!c) return { level: "unknown", label: "Chưa check-in", note: "Điền check-in để PT điều chỉnh mức độ tập hôm nay." };
    if (Number(c.soreness) >= 4) return { level: "danger", label: "Cần thận trọng", note: "Bạn đánh dấu đau bất thường. Không cố tập xuyên đau; dừng bài gây đau và cân nhắc đánh giá y tế nếu đáng kể/kéo dài." };
    if (Number(c.sleepHours) < 6 && Number(c.energy) <= 2) return { level: "warn", label: "Recovery thấp", note: "Hôm nay giảm khoảng 20% volume, giữ RIR ≥2 và không cố failure." };
    if (Number(c.sleepHours) < 6.5 || Number(c.energy) <= 2 || Number(c.soreness) >= 3) return { level: "warn", label: "Recovery vừa", note: "Giữ mức tạ thận trọng, ưu tiên kỹ thuật; có thể bỏ 1 set phụ nếu xuống sức." };
    return { level: "good", label: "Recovery tốt", note: "Có thể giữ nguyên giáo án và progressive overload theo log trước." };
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
    const strength = plan.type === "strength";
    const w = strength ? D.workouts[plan.workoutId] : null;
    $("today-hero").innerHTML = `
      <div class="hero-card">
        <div class="hero-top">
          <div>
            <p class="eyebrow">HÔM NAY</p>
            <h2>${escapeHtml(plan.title)}</h2>
            <p class="muted">${escapeHtml(plan.subtitle)}</p>
          </div>
          ${strength ? `<button class="primary" data-go-workout="1">Bắt đầu tập</button>` : ""}
        </div>
        <div class="hero-meta">
          ${w ? `<span class="pill">⏱ ${escapeHtml(w.duration)}</span><span class="pill">🎯 ${escapeHtml(w.focus)}</span><span class="pill">${w.exercises.length} bài</span>` : `<span class="pill">Phục hồi chủ động</span>`}
          <span class="pill ${rec.level === "good" ? "good" : rec.level === "danger" ? "danger" : rec.level === "warn" ? "warn" : ""}">${escapeHtml(rec.label)}</span>
        </div>
      </div>`;
    $$('[data-go-workout="1"]').forEach(btn => btn.onclick = () => switchTab("workout"));
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
    pill.className = `pill ${rec.level === "good" ? "good" : rec.level === "danger" ? "danger" : rec.level === "warn" ? "warn" : ""}`;
  }

  function renderTasks() {
    const plan = todayPlan();
    const meals = readJson(KEYS.meals, {})[dateKey()] || {};
    const strengthTask = plan.type === "strength" ? `${plan.title} • ${D.workouts[plan.workoutId].duration}` : plan.subtitle;
    const tasks = [
      ["🏋", strengthTask],
      ["🥩", `Protein mục tiêu ${D.profile.proteinTarget} g`],
      ["💧", `Nước khoảng ${(D.profile.waterTargetMl/1000).toFixed(1)} L`],
      ["🚶", `Khoảng ${D.profile.stepsTarget.toLocaleString("vi-VN")} bước / tăng vận động trong ngày`],
      ["🌙", "Chuẩn bị ngủ 23:15 • mục tiêu ngủ 23:30"]
    ];
    $("today-tasks").innerHTML = tasks.map(([icon, text], i) => `
      <div class="card task"><div class="task-check">${icon}</div><div><h3>${escapeHtml(text)}</h3><p>${i===0 ? "Làm đúng kế hoạch; không cần tự thêm nhiều bài." : i===1 ? `${Object.values(meals).filter(Boolean).length}/${D.meals.length} bữa đã đánh dấu.` : "Tính nhất quán quan trọng hơn hoàn hảo từng ngày."}</p></div></div>`).join("");
  }

  function nextMeal() {
    const now = minutesNow();
    const upcoming = D.meals.find(m => firstTimeMinutes(m.time) > now);
    return upcoming || D.meals[0];
  }
  function renderNextMeal() {
    const m = nextMeal();
    $("next-meal").innerHTML = `<p class="eyebrow">${escapeHtml(m.time)}</p><h3>${escapeHtml(m.title)}</h3><p class="muted">${escapeHtml(m.target)}</p><ul class="meal-options">${m.options.slice(0,2).map(x=>`<li>${escapeHtml(x)}</li>`).join("")}</ul>`;
  }

  function renderEquipmentStatus() {
    const selected = [...state.selectedEquipment].filter(id => state.catalogById.has(id));
    const source = state.selectedFromFallback ? "đang dùng danh sách máy tối thiểu bạn mô tả trong hồ sơ hiện tại" : "đã đồng bộ danh sách bạn tick trong Equipment Catalog";
    $("equipment-status").innerHTML = `
      <p><b>${selected.length} thiết bị</b> • ${escapeHtml(source)}.</p>
      <p class="muted" style="margin-top:7px">Workout sẽ ưu tiên máy đã chọn và báo khi một bài không tìm thấy thiết bị phù hợp.</p>
      <div class="import-row"><input id="equipment-link-input" type="url" placeholder="Dán share link từ Equipment Catalog"><button id="equipment-import" class="secondary" type="button">Nhập link</button></div>`;
    $("equipment-import").onclick = () => {
      const v = $("equipment-link-input").value.trim();
      if (v) importEquipmentShareLink(v);
    };
  }

  function exerciseFromRow(row) {
    const [key, sets, reps, rir, rest] = row;
    return { key, sets, reps, rir, rest, ...D.exerciseLibrary[key] };
  }

  function latestExerciseLog(key) {
    const logs = readJson(KEYS.logs, []);
    return [...logs].reverse().find(x => x.exerciseKey === key) || null;
  }

  function progressionAdvice(ex) {
    const prev = latestExerciseLog(ex.key);
    const rec = recoveryState();
    if (!prev) return "Chưa có log trước. Chọn mức tạ cho phép hoàn thành rep range với khoảng RIR 2.";
    if (rec.level === "danger") return "Không ưu tiên tăng tạ hôm nay vì bạn đang báo đau bất thường.";
    if (rec.level === "warn") return `Buổi trước: ${prev.sets.map(s=>`${s.weight || "?"}kg×${s.reps || "?"}`).join(" • ")}. Hôm nay ưu tiên giữ kỹ thuật và RIR an toàn.`;
    const topMatch = String(ex.reps).match(/(\d+)\s*(?:mỗi|$)/) || String(ex.reps).match(/–(\d+)/);
    const top = topMatch ? Number(topMatch[1]) : null;
    const valid = prev.sets.filter(s => Number(s.reps) > 0);
    const allTop = top && valid.length >= ex.sets && valid.every(s => Number(s.reps) >= top);
    const avgRir = valid.length ? valid.reduce((a,s)=>a+Number(s.rir || 0),0)/valid.length : 0;
    if (allTop && avgRir >= 1) return `Buổi trước đã chạm trần rep với RIR trung bình ${avgRir.toFixed(1)} → hôm nay có thể tăng mức tạ nhỏ nhất của máy (thường ~2.5–5%) rồi quay về đầu rep range.`;
    return `Buổi trước: ${prev.sets.map(s=>`${s.weight || "?"}kg×${s.reps || "?"} (RIR ${s.rir ?? "?"})`).join(" • ")}. Giữ mức tạ và cố thêm rep sạch trước khi tăng.`;
  }

  function renderWorkout() {
    const plan = todayPlan();
    const strength = plan.type === "strength";
    $("open-today-workout").classList.toggle("hidden", !strength);
    if (!strength) {
      $("workout-title").textContent = plan.title;
      $("workout-subtitle").textContent = plan.subtitle;
      $("workout-list").innerHTML = "";
      const nextStrength = findNextStrengthDay();
      $("non-strength-workout").classList.remove("hidden");
      $("non-strength-workout").innerHTML = `<h3>${plan.type === "rest" ? "Hôm nay nghỉ tạ" : "Recovery protocol"}</h3><p class="muted" style="margin-top:8px">${escapeHtml(plan.subtitle)}</p>${plan.type === "recovery" ? `<ul class="meal-options"><li>Cardio ở mức vẫn nói chuyện được thành câu.</li><li>Mobility: hip flexor, hamstring, pec stretch, thoracic rotation.</li><li>Không biến buổi recovery thành HIIT nặng.</li></ul>` : ""}<p style="margin-top:14px"><b>Buổi tạ tiếp theo:</b> ${escapeHtml(nextStrength.title)}.</p>`;
      return;
    }
    $("non-strength-workout").classList.add("hidden");
    const w = D.workouts[plan.workoutId];
    state.activeWorkoutId = plan.workoutId;
    $("workout-title").textContent = `${w.title} — ${w.focus}`;
    $("workout-subtitle").textContent = `${w.duration} • RIR chủ yếu 1–3 • nghỉ đủ lâu để set sau vẫn có chất lượng.`;
    $("workout-list").innerHTML = w.exercises.map((row, index) => {
      const ex = exerciseFromRow(row);
      const machine = machineForExercise(ex);
      const item = machine.item;
      const img = thumbnail(item, ex.name);
      const machineLabel = item ? `${item.name} — ${item.nameVi || ""}` : "Chưa có dữ liệu máy";
      return `<article class="card exercise-card">
        ${img ? `<img class="machine-thumb" loading="lazy" referrerpolicy="no-referrer" src="${img}" alt="${escapeHtml(ex.name)}">` : `<div class="machine-thumb"></div>`}
        <div>
          <p class="eyebrow">${index+1}/${w.exercises.length}</p>
          <h3>${escapeHtml(ex.name)}</h3>
          <p>${ex.sets} × ${escapeHtml(ex.reps)} • RIR ${escapeHtml(ex.rir)} • nghỉ ${Math.round(ex.rest/60*10)/10} phút</p>
          <div class="exercise-meta"><span class="availability ${machine.matched ? "ok" : "missing"}">${machine.matched ? "● Có máy phù hợp" : "● Chưa thấy máy đã chọn"}</span></div>
          <p class="equipment-line">${escapeHtml(machineLabel)}</p>
        </div>
        <div class="exercise-actions"><button class="mini-btn" data-exercise="${escapeHtml(ex.key)}" type="button">Hướng dẫn & log</button></div>
      </article>`;
    }).join("");
    $$('[data-exercise]').forEach(btn => btn.onclick = () => openExercise(btn.dataset.exercise));
  }

  function findNextStrengthDay() {
    const current = new Date().getDay();
    for (let i=1;i<=7;i++) {
      const p = D.week[(current+i)%7];
      if (p.type === "strength") return p;
    }
    return D.week[1];
  }

  function workoutRowForKey(key) {
    for (const w of Object.values(D.workouts)) {
      const row = w.exercises.find(r => r[0] === key);
      if (row) return row;
    }
    return null;
  }

  function openExercise(key) {
    const row = workoutRowForKey(key);
    if (!row) return;
    const ex = exerciseFromRow(row);
    const machine = machineForExercise(ex);
    const item = machine.item;
    const img = thumbnail(item, ex.name);
    const prev = latestExerciseLog(key);
    const defaultWeight = prev?.sets?.[0]?.weight ?? "";
    const setRows = Array.from({length: ex.sets}, (_, i) => `<div class="set-row"><span>Set ${i+1}</span><input data-field="weight" data-set="${i}" inputmode="decimal" type="number" step="0.5" min="0" placeholder="kg" value="${escapeHtml(defaultWeight)}"><input data-field="reps" data-set="${i}" inputmode="numeric" type="number" min="0" placeholder="reps"><input data-field="rir" data-set="${i}" inputmode="numeric" type="number" min="0" max="6" placeholder="RIR"></div>`).join("");
    $("modal-content").innerHTML = `
      <div class="guide-hero">
        ${img ? `<img loading="lazy" referrerpolicy="no-referrer" src="${img}" alt="${escapeHtml(ex.name)}">` : ""}
        <div><p class="eyebrow">${escapeHtml(ex.nameVi)}</p><h2>${escapeHtml(ex.name)}</h2><p class="muted">${escapeHtml(ex.primary)}</p></div>
      </div>
      <div class="progression">${escapeHtml(progressionAdvice(ex))}</div>
      <div class="guide-section"><h3>MÁY / THIẾT BỊ</h3><p class="muted">${item ? `${escapeHtml(item.name)} — ${escapeHtml(item.nameVi || "")}` : "Chưa khớp được thiết bị từ catalog."} ${machine.matched ? "✓ Có trong danh sách đã chọn." : "⚠ Chưa thấy trong danh sách đã chọn; có thể dùng biến thể thay thế phù hợp."}</p></div>
      <div class="guide-section"><h3>SETUP</h3><ul>${ex.setup.map(x=>`<li>${escapeHtml(x)}</li>`).join("")}</ul></div>
      <div class="guide-section"><h3>CUES</h3><ul>${ex.cues.map(x=>`<li>${escapeHtml(x)}</li>`).join("")}</ul></div>
      <div class="guide-section"><h3>NHỊP & HÍT THỞ</h3><p class="muted">Tempo: <b>${escapeHtml(ex.tempo)}</b><br>${escapeHtml(ex.breathing)}</p></div>
      <div class="guide-section"><h3>TRÁNH</h3><ul>${ex.avoid.map(x=>`<li>${escapeHtml(x)}</li>`).join("")}</ul></div>
      <div class="guide-section"><h3>LOG HÔM NAY — ${ex.sets} × ${escapeHtml(ex.reps)}</h3><div class="set-table">${setRows}</div><button id="save-exercise-log" class="primary wide" style="margin-top:12px" type="button">Lưu bài này</button></div>`;
    $("save-exercise-log").onclick = () => saveExerciseLog(key, ex);
    $("exercise-modal").classList.add("open");
    $("exercise-modal").setAttribute("aria-hidden", "false");
  }

  function saveExerciseLog(key, ex) {
    const rows = $$(".set-row", $("modal-content"));
    const sets = rows.map(row => ({
      weight: Number(row.querySelector('[data-field="weight"]').value || 0),
      reps: Number(row.querySelector('[data-field="reps"]').value || 0),
      rir: Number(row.querySelector('[data-field="rir"]').value || 0)
    })).filter(s => s.weight || s.reps);
    if (!sets.length) return alert("Hãy nhập ít nhất reps hoặc mức tạ của một set.");
    const logs = readJson(KEYS.logs, []);
    logs.push({ date: dateKey(), time: new Date().toISOString(), workoutId: state.activeWorkoutId, exerciseKey: key, target: { sets: ex.sets, reps: ex.reps, rir: ex.rir }, sets });
    writeJson(KEYS.logs, logs.slice(-400));
    toast("Đã lưu bài tập");
    $("exercise-modal").classList.remove("open");
    renderCoach();
    renderWorkout();
  }

  function renderNutrition() {
    $("calorie-target").textContent = D.profile.calorieTarget;
    $("protein-target").textContent = D.profile.proteinTarget;
    $("water-target").textContent = (D.profile.waterTargetMl/1000).toFixed(1);
    $("steps-target").textContent = D.profile.stepsTarget.toLocaleString("vi-VN");
    const allMeals = readJson(KEYS.meals, {});
    const dayMeals = allMeals[dateKey()] || {};
    $("meal-list").innerHTML = D.meals.map(m => `<article class="card meal-card"><label class="meal-done"><input type="checkbox" data-meal="${escapeHtml(m.id)}" ${dayMeals[m.id] ? "checked" : ""}></label><p class="eyebrow">${escapeHtml(m.time)}</p><h3>${escapeHtml(m.title)}</h3><p>${escapeHtml(m.target)}</p><ul class="meal-options">${m.options.map(x=>`<li>${escapeHtml(x)}</li>`).join("")}</ul></article>`).join("");
    $$('[data-meal]').forEach(el => el.onchange = () => {
      const data = readJson(KEYS.meals, {});
      data[dateKey()] = data[dateKey()] || {};
      data[dateKey()][el.dataset.meal] = el.checked;
      writeJson(KEYS.meals, data);
      renderTasks();
    });
  }

  function renderProgress() {
    const rows = readJson(KEYS.progress, []);
    const sorted = [...rows].sort((a,b)=>a.date.localeCompare(b.date));
    const last = sorted.at(-1);
    const firstRecent = sorted.length > 1 ? sorted[Math.max(0, sorted.length - 4)] : null;
    if (!last) {
      $("progress-summary").innerHTML = `<h3>Chưa có số đo</h3><p class="muted" style="margin-top:8px">Bắt đầu bằng cân nặng và vòng bụng. Đo vòng bụng ngang rốn trong điều kiện tương tự mỗi tuần.</p>`;
    } else {
      const wDelta = firstRecent && Number.isFinite(firstRecent.weight) && Number.isFinite(last.weight) ? last.weight-firstRecent.weight : null;
      const waistDelta = firstRecent && Number.isFinite(firstRecent.waist) && Number.isFinite(last.waist) ? last.waist-firstRecent.waist : null;
      $("progress-summary").innerHTML = `<p class="eyebrow">MỚI NHẤT • ${formatShortDate(last.date)}</p><div class="target-grid" style="margin-top:10px"><div class="metric"><span>Cân nặng</span><strong>${last.weight || "—"}</strong><small>kg ${wDelta===null?"":`• ${wDelta>=0?"+":""}${wDelta.toFixed(1)}`}</small></div><div class="metric"><span>Vòng bụng</span><strong>${last.waist || "—"}</strong><small>cm ${waistDelta===null?"":`• ${waistDelta>=0?"+":""}${waistDelta.toFixed(1)}`}</small></div></div>`;
    }
    $("progress-history").innerHTML = [...sorted].reverse().slice(0,10).map(r => `<div class="card history-row"><div><strong>${formatShortDate(r.date)}</strong><small>Đo trong điều kiện tương tự để so sánh đúng.</small></div><div style="text-align:right"><b>${r.weight || "—"} kg</b><br><span class="muted">${r.waist || "—"} cm eo</span></div></div>`).join("");
  }

  function renderCoach() {
    const rec = recoveryState();
    const progress = readJson(KEYS.progress, []).sort((a,b)=>a.date.localeCompare(b.date));
    const logs = readJson(KEYS.logs, []);
    const notes = [];
    notes.push(`<div class="coach-item"><b>Hôm nay:</b> ${escapeHtml(rec.note)}</div>`);
    if (progress.length >= 2) {
      const a = progress[Math.max(0, progress.length-4)];
      const b = progress.at(-1);
      const dw = (Number(b.weight)||0) - (Number(a.weight)||0);
      const de = (Number(b.waist)||0) - (Number(a.waist)||0);
      if (Math.abs(dw) <= .4 && de < -.3) notes.push(`<div class="coach-item trend-good"><b>Recomp đang đúng hướng:</b> cân gần ổn định (${dw>=0?"+":""}${dw.toFixed(1)} kg) trong khi vòng eo giảm ${Math.abs(de).toFixed(1)} cm. Giữ calories hiện tại.</div>`);
      else if (dw > .5 && de > .5) notes.push(`<div class="coach-item trend-warn"><b>Cần theo dõi surplus:</b> cân +${dw.toFixed(1)} kg và eo +${de.toFixed(1)} cm trong các lần đo gần đây. Nếu xu hướng này lặp lại và sức mạnh không tăng tương ứng, giảm khoảng 100–150 kcal/ngày.</div>`);
      else if (dw < -.8) notes.push(`<div class="coach-item trend-warn"><b>Cân đang giảm khá nhanh:</b> ${dw.toFixed(1)} kg qua các lần đo gần đây. Nếu đói nhiều hoặc hiệu suất tập giảm, cân nhắc tăng 100–150 kcal/ngày.</div>`);
      else notes.push(`<div class="coach-item"><b>Dinh dưỡng:</b> chưa có tín hiệu đủ mạnh để đổi target ${D.profile.calorieTarget} kcal. Tiếp tục ghi cân + vòng eo.</div>`);
    } else {
      notes.push(`<div class="coach-item"><b>Thiếu dữ liệu tiến độ:</b> thêm ít nhất 2–4 lần đo cân + vòng eo để PT quyết định có cần đổi calories hay không.</div>`);
    }
    if (logs.length) {
      const recent = logs.slice(-6);
      notes.push(`<div class="coach-item"><b>Training log:</b> đã có ${logs.length} bài được ghi. Gần nhất: ${recent.map(x=>D.exerciseLibrary[x.exerciseKey]?.name || x.exerciseKey).join(", ")}.</div>`);
    } else notes.push(`<div class="coach-item"><b>Progressive overload:</b> chưa có workout log. Bắt đầu log kg/reps/RIR để app biết khi nào cần tăng tạ.</div>`);
    $("coach-analysis").innerHTML = `<p class="eyebrow">MỤC TIÊU</p><h3>${escapeHtml(D.profile.goal)}</h3><div class="coach-list">${notes.join("")}</div>`;
  }

  function coachContextText() {
    const plan = todayPlan();
    const checkin = readJson(KEYS.checkins, {})[dateKey()] || null;
    const progress = readJson(KEYS.progress, []).slice(-8);
    const logs = readJson(KEYS.logs, []).slice(-20);
    const machines = [...state.selectedEquipment].map(id => state.catalogById.get(id)?.name || id);
    return `MYGYM PERSONAL PT CONTEXT\nProfile: Nam, 25 tuổi, 163 cm, 59 kg, lập trình viên. Mục tiêu: giảm vòng bụng + tăng cơ, recomp.\nHôm nay: ${plan.title} — ${plan.subtitle}\nCheck-in: ${JSON.stringify(checkin)}\nTarget: ${D.profile.calorieTarget} kcal, ${D.profile.proteinTarget} g protein, ${D.profile.waterTargetMl} ml nước, ${D.profile.stepsTarget} bước.\nProgress gần đây: ${JSON.stringify(progress)}\nWorkout logs gần đây: ${JSON.stringify(logs)}\nThiết bị gym đã chọn: ${machines.join(", ")}\nHãy phân tích dựa trên dữ liệu này, ưu tiên an toàn, progression và khả năng phục hồi.`;
  }

  function switchTab(name) {
    $$(".tab").forEach(x => x.classList.toggle("active", x.dataset.tab === name));
    $$(".panel").forEach(x => x.classList.toggle("active", x.id === `panel-${name}`));
    window.scrollTo({top:0, behavior:"smooth"});
  }

  function bindEvents() {
    $$(".tab").forEach(btn => btn.onclick = () => switchTab(btn.dataset.tab));
    $("checkin-form").onsubmit = e => {
      e.preventDefault();
      const all = readJson(KEYS.checkins, {});
      all[dateKey()] = {
        sleepHours: Number($("sleep-hours").value || 0),
        sleepQuality: Number($("sleep-quality").value),
        energy: Number($("energy").value),
        soreness: Number($("soreness").value)
      };
      writeJson(KEYS.checkins, all);
      renderTodayHero(); renderCheckin(); renderWorkout(); renderCoach();
      toast("Đã cập nhật recovery");
    };
    $("progress-form").onsubmit = e => {
      e.preventDefault();
      const weightRaw = $("progress-weight").value;
      const waistRaw = $("progress-waist").value;
      if (!weightRaw && !waistRaw) return alert("Nhập cân nặng hoặc vòng bụng.");
      const rows = readJson(KEYS.progress, []);
      const entry = { date: dateKey(), weight: weightRaw ? Number(weightRaw) : null, waist: waistRaw ? Number(waistRaw) : null };
      const idx = rows.findIndex(x=>x.date===entry.date);
      idx >= 0 ? rows.splice(idx,1,entry) : rows.push(entry);
      writeJson(KEYS.progress, rows);
      renderProgress(); renderCoach();
      toast("Đã lưu số đo");
    };
    $("modal-close").onclick = () => $("exercise-modal").classList.remove("open");
    $("exercise-modal").onclick = e => { if (e.target === $("exercise-modal")) $("exercise-modal").classList.remove("open"); };
    $("open-today-workout").onclick = () => {
      const first = D.workouts[todayPlan().workoutId]?.exercises?.[0]?.[0];
      if (first) openExercise(first);
    };
    $("copy-coach-context").onclick = async e => {
      await navigator.clipboard.writeText(coachContextText());
      const old = e.currentTarget.textContent;
      e.currentTarget.textContent = "Đã copy";
      setTimeout(()=>e.currentTarget.textContent=old,1200);
    };
  }

  function renderAll() {
    renderHeader();
    renderTodayHero();
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
    await loadEquipment();
    bindEvents();
    renderAll();
  }

  init();
})();