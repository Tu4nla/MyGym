const $ = (id) => document.getElementById(id);

const MEDIA_DATA_URL = "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/data/exercises.json";
const MEDIA_IMAGE_BASE = "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/";

const state = {
  config: null,
  items: [],
  media: [],
  selected: new Set(),
  query: "",
  group: "all",
  type: "all",
  onlySelected: false,
};

const imageCache = new Map();
const normalize = (v = "") => String(v).trim().toLowerCase();
const titleCase = (v = "") => String(v).replace(/\b\w/g, c => c.toUpperCase());

function normalizeWords(value = "") {
  return normalize(value)
    .replace(/pull[ -]?down/g, "pulldown")
    .replace(/iso[ -]?lateral/g, "isolateral")
    .replace(/plate[ -]?loaded/g, "plateloaded")
    .replace(/rear[ -]?delt/g, "reardelt")
    .replace(/t[ -]?bar/g, "tbar")
    .replace(/45[ -]?degree/g, "45degree")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const STOP_WORDS = new Set([
  "machine", "gym", "equipment", "commercial", "series", "station",
  "selectorized", "plateloaded", "leverage", "strength", "trainer"
]);

function tokens(value = "") {
  return normalizeWords(value)
    .split(/\s+/)
    .filter(Boolean)
    .filter(x => !STOP_WORDS.has(x));
}

function loadSelection() {
  try {
    const saved = JSON.parse(localStorage.getItem(state.config.selectionStorageKey) || "[]");
    state.selected = new Set(Array.isArray(saved) ? saved : []);
  } catch { state.selected = new Set(); }

  const hash = location.hash.replace(/^#selected=/, "");
  if (hash) {
    try {
      const decoded = JSON.parse(decodeURIComponent(atob(hash)));
      if (Array.isArray(decoded)) state.selected = new Set(decoded);
    } catch {}
  }
}

function persistSelection() {
  localStorage.setItem(state.config.selectionStorageKey, JSON.stringify([...state.selected]));
  $("selected-count").textContent = state.selected.size;
}

function selectedItems() {
  return state.items.filter(item => state.selected.has(item.id));
}

function exportPayload() {
  return selectedItems().map(item => ({
    id: item.id,
    name: item.name,
    group: item.group,
    type: item.type
  }));
}

function filteredItems() {
  return state.items.filter(item => {
    if (state.onlySelected && !state.selected.has(item.id)) return false;
    if (state.group !== "all" && normalize(item.group) !== state.group) return false;
    if (state.type !== "all" && normalize(item.type) !== state.type) return false;
    if (state.query) {
      const haystack = normalize(`${item.name} ${item.group} ${item.type}`);
      if (!haystack.includes(state.query)) return false;
    }
    return true;
  });
}

function googleImageSearchUrl(item) {
  return `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(item.imageQuery || item.name)}`;
}

function equipmentBonus(item, exercise) {
  const eq = normalize(exercise.equipment || "");
  const type = normalize(item.type || "");
  if (type === "smith-machine" && eq === "smith machine") return 8;
  if (["selectorized", "plate-loaded"].includes(type) && eq === "leverage machine") return 5;
  if (type.includes("cable") && eq === "cable") return 5;
  if (type.includes("assisted") && eq === "assisted") return 6;
  if (type.includes("sled") && eq === "sled machine") return 6;
  if (type.includes("elliptical") && eq === "elliptical machine") return 8;
  if (type.includes("bike") && eq === "stationary bike") return 8;
  if ((type.includes("stair") || type.includes("stepmill")) && eq === "stepmill machine") return 8;
  if (type.includes("skierg") && eq === "skierg machine") return 8;
  if (type.includes("dumbbell") && eq === "dumbbell") return 4;
  if (type.includes("barbell") && eq === "barbell") return 4;
  if (type.includes("kettlebell") && eq === "kettlebell") return 4;
  return 0;
}

function groupBonus(item, exercise) {
  const group = normalize(item.group);
  const part = normalize(exercise.body_part || exercise.category || "");
  const map = {
    chest: ["chest"], back: ["back"], shoulders: ["shoulders"],
    legs: ["upper legs", "lower legs"], "glutes / hips": ["upper legs"],
    arms: ["upper arms", "lower arms"], core: ["waist"], cardio: ["cardio"]
  };
  return (map[group] || []).includes(part) ? 2 : 0;
}

function scoreExerciseImage(item, exercise) {
  const queryTokens = tokens(`${item.imageQuery || ""} ${item.name}`);
  const exerciseTokens = tokens(exercise.name || "");
  if (!queryTokens.length || !exerciseTokens.length) return -1;

  const exerciseSet = new Set(exerciseTokens);
  let overlap = 0;
  queryTokens.forEach(t => { if (exerciseSet.has(t)) overlap += 1; });

  let score = overlap * 4 + equipmentBonus(item, exercise) + groupBonus(item, exercise);
  const q = normalizeWords(item.imageQuery || item.name);
  const n = normalizeWords(exercise.name || "");

  const phrases = [
    "chest press", "shoulder press", "leg extension", "leg curl", "leg press",
    "lat pulldown", "pulldown", "seated row", "low row", "high row", "tbar row",
    "lateral raise", "calf raise", "hip abduction", "hip adduction", "hack squat",
    "preacher curl", "biceps curl", "triceps extension", "pec fly", "reardelt",
    "abdominal crunch", "back extension", "glute kickback", "pullover"
  ];
  phrases.forEach(p => {
    if (q.includes(p) && n.includes(p)) score += 10;
  });

  if (overlap === 0 && equipmentBonus(item, exercise) < 8) return -1;
  return score;
}

function representativeExerciseImage(item) {
  const key = `exercise:${item.id}`;
  if (imageCache.has(key)) return imageCache.get(key);
  if (!state.media.length) return "";

  let best = null;
  let bestScore = -1;
  for (const exercise of state.media) {
    if (!exercise.image) continue;
    const score = scoreExerciseImage(item, exercise);
    if (score > bestScore) {
      bestScore = score;
      best = exercise;
    }
  }

  // A conservative threshold avoids showing a completely unrelated exercise.
  const url = best && bestScore >= 10
    ? `${MEDIA_IMAGE_BASE}${String(best.image).replace(/^\//, "")}`
    : "";
  imageCache.set(key, url);
  return url;
}

async function commonsThumbnail(item) {
  const key = `commons:${item.id}`;
  if (imageCache.has(key)) return imageCache.get(key);

  const params = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: `${item.imageQuery || item.name} gym equipment`,
    gsrnamespace: "6",
    gsrlimit: "1",
    prop: "imageinfo",
    iiprop: "url",
    iiurlwidth: "640",
    format: "json",
    origin: "*"
  });

  try {
    const result = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`).then(r => r.json());
    const pages = result?.query?.pages ? Object.values(result.query.pages) : [];
    const url = pages[0]?.imageinfo?.[0]?.thumburl || pages[0]?.imageinfo?.[0]?.url || "";
    imageCache.set(key, url);
    return url;
  } catch {
    imageCache.set(key, "");
    return "";
  }
}

async function resolveImage(item) {
  if (item.image) return { url: item.image, source: "catalog" };

  const exerciseImage = representativeExerciseImage(item);
  if (exerciseImage) return { url: exerciseImage, source: "exercise" };

  const commons = await commonsThumbnail(item);
  if (commons) return { url: commons, source: "commons" };

  return { url: "", source: "none" };
}

function hydrateImages() {
  const targets = [...document.querySelectorAll("[data-image-id]")];
  const observer = new IntersectionObserver(entries => {
    entries.forEach(async entry => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      const id = entry.target.dataset.imageId;
      const item = state.items.find(x => x.id === id);
      if (!item) return;

      const image = await resolveImage(item);
      if (!entry.target.isConnected) return;

      if (image.url) {
        const note = image.source === "exercise" ? '<span class="image-note">Ảnh minh hoạ cách dùng</span>' : "";
        entry.target.innerHTML = `<img loading="lazy" referrerpolicy="no-referrer" src="${image.url}" alt="${item.name.replace(/"/g, "&quot;")}" onerror="this.parentElement.innerHTML='<div class=&quot;image-fallback&quot;>Ảnh lỗi · bấm Xem thêm ảnh</div>'">${note}`;
      } else {
        entry.target.innerHTML = `<div class="image-fallback">Chưa có ảnh phù hợp · bấm “Xem thêm ảnh”</div>`;
      }
    });
  }, { rootMargin: "400px" });
  targets.forEach(el => observer.observe(el));
}

function render() {
  const items = filteredItems();
  $("status").textContent = `${items.length} thiết bị · ${state.items.length} tổng cộng · ${state.selected.size} đã chọn`;
  $("selected-count").textContent = state.selected.size;

  if (!items.length) {
    $("grid").innerHTML = '<div class="empty">Không có thiết bị phù hợp bộ lọc hiện tại.</div>';
    return;
  }

  $("grid").innerHTML = items.map(item => {
    const selected = state.selected.has(item.id);
    const safeName = item.name.replace(/"/g, "&quot;");
    return `
      <article class="card ${selected ? "selected" : ""}" data-id="${item.id}">
        <div class="image-wrap" data-image-id="${item.id}"><div class="image-fallback">Đang tìm ảnh phù hợp…</div></div>
        <label class="tick" title="Chọn thiết bị này">
          <input type="checkbox" ${selected ? "checked" : ""} aria-label="Chọn ${safeName}">
        </label>
        <button class="card-button" type="button" aria-label="Toggle ${safeName}"></button>
        <div class="card-body">
          <h2 class="name">${item.name}</h2>
          <div class="meta">
            <span class="pill">${item.group}</span>
            <span class="pill">${titleCase(item.type.replaceAll("-", " "))}</span>
          </div>
          <a class="image-search" href="${googleImageSearchUrl(item)}" target="_blank" rel="noopener">Xem thêm ảnh ↗</a>
        </div>
      </article>`;
  }).join("");

  $("grid").querySelectorAll(".card").forEach(card => {
    const id = card.dataset.id;
    const toggle = () => {
      state.selected.has(id) ? state.selected.delete(id) : state.selected.add(id);
      persistSelection(); render();
    };
    card.querySelector(".card-button").addEventListener("click", toggle);
    card.querySelector("input").addEventListener("change", e => {
      e.stopPropagation();
      e.target.checked ? state.selected.add(id) : state.selected.delete(id);
      persistSelection(); render();
    });
  });
  hydrateImages();
}

function setupFilters() {
  const group = $("group-filter");
  state.config.groups.forEach(g => {
    const option = document.createElement("option");
    option.value = normalize(g.label);
    option.textContent = g.label;
    group.appendChild(option);
  });

  const typeSelect = $("body-filter");
  typeSelect.innerHTML = '<option value="all">Tất cả loại thiết bị</option>';
  [...new Set(state.items.map(x => normalize(x.type)))].sort().forEach(type => {
    const option = document.createElement("option");
    option.value = type;
    option.textContent = titleCase(type.replaceAll("-", " "));
    typeSelect.appendChild(option);
  });

  $("search").addEventListener("input", e => { state.query = normalize(e.target.value); render(); });
  group.addEventListener("change", e => { state.group = e.target.value; render(); });
  typeSelect.addEventListener("change", e => { state.type = e.target.value; render(); });
  $("only-selected").addEventListener("change", e => { state.onlySelected = e.target.checked; render(); });
}

async function copyText(text, button, successLabel) {
  await navigator.clipboard.writeText(text);
  const old = button.textContent;
  button.textContent = successLabel;
  setTimeout(() => button.textContent = old, 1200);
}

function setupActions() {
  $("copy-names").addEventListener("click", e => copyText(selectedItems().map(x => x.name).join("\n"), e.currentTarget, "Đã copy tên"));
  $("copy-json").addEventListener("click", e => copyText(JSON.stringify(exportPayload(), null, 2), e.currentTarget, "Đã copy JSON"));
  $("copy-link").addEventListener("click", e => {
    const encoded = btoa(encodeURIComponent(JSON.stringify([...state.selected])));
    copyText(`${location.origin}${location.pathname}#selected=${encoded}`, e.currentTarget, "Đã copy link");
  });
  $("clear").addEventListener("click", () => {
    if (!state.selected.size || !confirm("Bỏ chọn toàn bộ thiết bị?")) return;
    state.selected.clear(); persistSelection(); render();
  });
}

async function init() {
  try {
    const [config, media] = await Promise.all([
      fetch("equipment-catalog.json?v=3").then(r => {
        if (!r.ok) throw new Error(`Catalog ${r.status}`);
        return r.json();
      }),
      fetch(MEDIA_DATA_URL).then(r => r.ok ? r.json() : []).catch(() => [])
    ]);

    state.config = config;
    state.items = state.config.items || [];
    state.media = Array.isArray(media) ? media : [];
    loadSelection(); persistSelection(); setupFilters(); setupActions(); render();
  } catch (error) {
    console.error(error);
    $("status").textContent = "Không tải được catalog.";
    $("grid").innerHTML = `<div class="empty">${error.message}</div>`;
  }
}

init();