const $ = (id) => document.getElementById(id);

const state = {
  config: null,
  items: [],
  selected: new Set(),
  query: "",
  group: "all",
  type: "all",
  onlySelected: false,
};

const imageCache = new Map();
const normalize = (v = "") => String(v).trim().toLowerCase();
const titleCase = (v = "") => String(v).replace(/\b\w/g, c => c.toUpperCase());
const itemId = item => item.id;

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

async function commonsThumbnail(item) {
  const key = item.imageQuery || item.name;
  if (imageCache.has(key)) return imageCache.get(key);

  const params = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: `${key} gym equipment filetype:bitmap`,
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

function hydrateImages() {
  const targets = [...document.querySelectorAll("[data-image-id]")];
  const observer = new IntersectionObserver(entries => {
    entries.forEach(async entry => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      const id = entry.target.dataset.imageId;
      const item = state.items.find(x => x.id === id);
      if (!item) return;
      const url = await commonsThumbnail(item);
      if (!entry.target.isConnected) return;
      if (url) {
        entry.target.innerHTML = `<img loading="lazy" src="${url}" alt="${item.name.replace(/"/g, "&quot;")}">`;
      } else {
        entry.target.innerHTML = `<div class="image-fallback">Không tìm được ảnh đại diện</div>`;
      }
    });
  }, { rootMargin: "300px" });
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
        <div class="image-wrap" data-image-id="${item.id}"><div class="image-fallback">Đang tải ảnh…</div></div>
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
    state.config = await fetch("equipment-catalog.json?v=3").then(r => {
      if (!r.ok) throw new Error(`Catalog ${r.status}`);
      return r.json();
    });
    state.items = state.config.items || [];
    loadSelection(); persistSelection(); setupFilters(); setupActions(); render();
  } catch (error) {
    console.error(error);
    $("status").textContent = "Không tải được catalog.";
    $("grid").innerHTML = `<div class="empty">${error.message}</div>`;
  }
}

init();
