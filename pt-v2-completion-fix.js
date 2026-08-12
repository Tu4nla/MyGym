(() => {
  const $ = id => document.getElementById(id);
  const KEY = "mygym.pt.sessions.v2";
  const dateKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  };
  const read = () => {
    try { return JSON.parse(localStorage.getItem(KEY) || "[]"); }
    catch { return []; }
  };
  function sourceSessions(){ return window.PT_SOURCE?.syncedWorkoutSessions || []; }
  function todaySession(){
    return [...sourceSessions(), ...read()].find(s => s.date === dateKey() && ["complete","partial-counted"].includes(s.status));
  }
  function apply(){
    const s = todaySession();
    if (!s || !window.PT_DATA) return;
    const w = window.PT_DATA.workouts?.[s.workoutId];
    if (!w) return;
    const seq = window.PT_SOURCE?.trainingPolicy?.sequence || ["upperA","lowerA","upperB","lowerB"];
    const counted = [...sourceSessions(), ...read()].filter(x => x.countsTowardSequence !== false && ["complete","partial-counted"].includes(x.status)).length;
    const nextId = seq[counted % seq.length];
    const next = window.PT_DATA.workouts?.[nextId];
    const hero = $("today-hero");
    if (hero && hero.dataset.completedApplied !== s.id) {
      hero.dataset.completedApplied = s.id;
      hero.innerHTML = `<div class="hero-card"><div class="hero-top"><div><p class="eyebrow">HÔM NAY • COMPLETED</p><h2>${s.status === "partial-counted" ? "Đã tính buổi một phần là hoàn thành" : "Đã hoàn tất " + w.title}</h2><p class="muted">Không tập thêm một buổi strength thứ hai để trả nợ. Buổi kế tiếp: <b>${next?.title || "—"}</b>.</p></div></div><div class="hero-meta"><span class="pill good">✓ Đã ghi session</span><span class="pill">Tiếp theo: ${next?.title || "—"}</span></div></div>`;
    }
    const start = $("open-today-workout");
    const finish = $("finish-workout");
    if (start) start.classList.add("hidden");
    if (finish) finish.classList.add("hidden");
    const title = $("workout-title");
    const subtitle = $("workout-subtitle");
    const list = $("workout-list");
    const non = $("non-strength-workout");
    if (title) title.textContent = `Đã hoàn tất ${w.title}`;
    if (subtitle) subtitle.textContent = `Hôm nay không cần thêm buổi tạ. Tiếp theo: ${next?.title || "—"}.`;
    if (list) list.innerHTML = "";
    if (non) {
      non.classList.remove("hidden");
      non.innerHTML = `<h3>Session đã được ghi</h3><p class="muted" style="margin-top:8px">${s.status === "partial-counted" ? `Buổi một phần ${s.completionPct || ""}% đã đạt điều kiện để advance chuỗi.` : "Bạn đã hoàn tất buổi strength hôm nay."}</p><p style="margin-top:14px"><b>Buổi tiếp theo:</b> ${next?.title || "—"} — ${next?.focus || ""}</p>`;
    }
  }
  document.addEventListener("DOMContentLoaded", () => {
    apply();
    const hero = $("today-hero");
    if (hero) new MutationObserver(() => apply()).observe(hero,{childList:true,subtree:true});
    window.addEventListener("storage", apply);
    setInterval(apply, 1500);
  });
})();