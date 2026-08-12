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

const normalize = (v = "") => String(v).trim().toLowerCase();
const titleCase = (v = "") => String(v).replace(/\b\w/g, (c) => c.toUpperCase());
const safe = (v = "") => String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");

const TYPE_VI = {
  "selectorized":"Máy dùng chốt tạ",
  "plate-loaded":"Máy gắn bánh tạ",
  "combo-machine":"Máy kết hợp",
  "assisted-machine":"Máy trợ lực",
  "bodyweight-station":"Khung / ghế bodyweight",
  "cable-station":"Trạm cable",
  "multi-station":"Cụm đa trạm",
  "all-in-one":"Máy đa năng all-in-one",
  "smith-machine":"Máy Smith",
  "rack":"Khung tập",
  "bench":"Ghế tập",
  "bench-station":"Ghế + giá đòn",
  "storage":"Giá để dụng cụ",
  "dumbbell":"Tạ đơn",
  "kettlebell":"Tạ ấm",
  "barbell":"Thanh đòn",
  "weight-plate":"Bánh tạ",
  "accessory":"Phụ kiện",
  "mobility":"Giãn cơ / mobility",
  "band":"Dây kháng lực",
  "suspension":"Dây treo",
  "functional":"Functional",
  "cardio-accessory":"Dụng cụ cardio",
  "ball":"Bóng tập",
  "wearable":"Phụ kiện đeo",
  "mat":"Thảm",
  "cable-attachment":"Đầu cắm cable",
  "attachment":"Phụ kiện gắn máy",
  "bodyweight-accessory":"Dụng cụ bodyweight",
  "cardio-machine":"Máy cardio"
};

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
  return state.items.filter((item) => state.selected.has(item.id));
}

function exportPayload() {
  return selectedItems().map((item) => ({
    id: item.id,
    name: item.name,
    nameVi: item.nameVi,
    group: item.group,
    type: item.type,
  }));
}

function filteredItems() {
  return state.items.filter((item) => {
    if (state.onlySelected && !state.selected.has(item.id)) return false;
    if (state.group !== "all" && normalize(item.group) !== state.group) return false;
    if (state.type !== "all" && normalize(item.type) !== state.type) return false;
    if (state.query) {
      const haystack = normalize(`${item.name} ${item.nameVi || ""} ${item.group} ${item.type} ${TYPE_VI[item.type] || ""}`);
      if (!haystack.includes(state.query)) return false;
    }
    return true;
  });
}

function imageSearchUrl(item) {
  const q = `${item.imageQuery || item.name} commercial gym equipment`;
  return `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(q)}`;
}

function bingThumbnailUrl(item) {
  if (item.image) return item.image;
  const q = `${item.imageQuery || item.name} commercial gym equipment product`;
  let hash = 0;
  for (const c of item.id) hash = ((hash << 5) - hash + c.charCodeAt(0)) | 0;
  const host = 1 + Math.abs(hash % 4);
  return `https://tse${host}.mm.bing.net/th?q=${encodeURIComponent(q)}&w=640&h=640&c=7&rs=1&p=0&pid=1.7&mkt=en-US&adlt=moderate`;
}

function render() {
  const items = filteredItems();
  $("status").textContent = `${items.length} thiết bị · ${state.items.length} tổng cộng · ${state.selected.size} đã chọn`;
  $("selected-count").textContent = state.selected.size;

  if (!items.length) {
    $("grid").innerHTML = '<div class="empty">Không có thiết bị phù hợp bộ lọc hiện tại.</div>';
    return;
  }

  $("grid").innerHTML = items.map((item) => {
    const selected = state.selected.has(item.id);
    const typeLabel = TYPE_VI[item.type] || titleCase(item.type.replaceAll("-", " "));
    return `
      <article class="card ${selected ? "selected" : ""}" data-id="${safe(item.id)}">
        <div class="image-wrap">
          <img loading="lazy" referrerpolicy="no-referrer" src="${bingThumbnailUrl(item)}" alt="${safe(item.name)}" onerror="this.outerHTML='<div class=&quot;image-fallback&quot;>Không tải được ảnh · mở Xem thêm ảnh</div>'">
          <span class="image-note">Ảnh tham khảo theo tên thiết bị</span>
        </div>
        <label class="tick" title="Chọn thiết bị này">
          <input type="checkbox" ${selected ? "checked" : ""} aria-label="Chọn ${safe(item.name)}">
        </label>
        <button class="card-button" type="button" aria-label="Toggle ${safe(item.name)}"></button>
        <div class="card-body">
          <h2 class="name">${safe(item.name)}</h2>
          <div class="vi-name">${safe(item.nameVi || "")}</div>
          <div class="meta">
            <span class="pill">${safe(item.group)}</span>
            <span class="pill">${safe(typeLabel)}</span>
          </div>
          <a class="image-search" href="${imageSearchUrl(item)}" target="_blank" rel="noopener">Xem thêm ảnh ↗</a>
        </div>
      </article>`;
  }).join("");

  $("grid").querySelectorAll(".card").forEach((card) => {
    const id = card.dataset.id;
    const toggle = () => {
      state.selected.has(id) ? state.selected.delete(id) : state.selected.add(id);
      persistSelection();
      render();
    };
    card.querySelector(".card-button").addEventListener("click", toggle);
    card.querySelector("input").addEventListener("change", (e) => {
      e.stopPropagation();
      e.target.checked ? state.selected.add(id) : state.selected.delete(id);
      persistSelection();
      render();
    });
  });
}

function setupFilters() {
  const group = $("group-filter");
  state.config.groups.forEach((g) => {
    const option = document.createElement("option");
    option.value = normalize(g.label);
    option.textContent = g.label;
    group.appendChild(option);
  });

  const typeSelect = $("body-filter");
  typeSelect.innerHTML = '<option value="all">Tất cả loại thiết bị</option>';
  [...new Set(state.items.map((x) => normalize(x.type)))].sort().forEach((type) => {
    const option = document.createElement("option");
    option.value = type;
    option.textContent = TYPE_VI[type] || titleCase(type.replaceAll("-", " "));
    typeSelect.appendChild(option);
  });

  $("search").addEventListener("input", (e) => { state.query = normalize(e.target.value); render(); });
  group.addEventListener("change", (e) => { state.group = e.target.value; render(); });
  typeSelect.addEventListener("change", (e) => { state.type = e.target.value; render(); });
  $("only-selected").addEventListener("change", (e) => { state.onlySelected = e.target.checked; render(); });
}

async function copyText(text, button, successLabel) {
  await navigator.clipboard.writeText(text);
  const old = button.textContent;
  button.textContent = successLabel;
  setTimeout(() => { button.textContent = old; }, 1200);
}

function setupActions() {
  $("copy-names").addEventListener("click", (e) => {
    const text = selectedItems().map((x) => `${x.name} — ${x.nameVi}`).join("\n");
    copyText(text, e.currentTarget, "Đã copy tên");
  });
  $("copy-json").addEventListener("click", (e) => {
    copyText(JSON.stringify(exportPayload(), null, 2), e.currentTarget, "Đã copy JSON");
  });
  $("copy-link").addEventListener("click", (e) => {
    const encoded = btoa(encodeURIComponent(JSON.stringify([...state.selected])));
    copyText(`${location.origin}${location.pathname}#selected=${encoded}`, e.currentTarget, "Đã copy link");
  });
  $("clear").addEventListener("click", () => {
    if (!state.selected.size || !confirm("Bỏ chọn toàn bộ thiết bị?")) return;
    state.selected.clear();
    persistSelection();
    render();
  });
}

async function init() {
  try {
    state.config = await fetch("equipment-catalog.json?v=4").then((r) => {
      if (!r.ok) throw new Error(`Catalog ${r.status}`);
      return r.json();
    });

    const chunks = await Promise.all((state.config.dataFiles || []).map((path) =>
      fetch(`${path}?v=4`).then((r) => {
        if (!r.ok) throw new Error(`${path} ${r.status}`);
        return r.json();
      })
    ));

    const byId = new Map();
    chunks.flat().forEach((item) => {
      if (!byId.has(item.id)) byId.set(item.id, item);
    });
    state.items = [...byId.values()];

    loadSelection();
    persistSelection();
    setupFilters();
    setupActions();
    render();
  } catch (error) {
    console.error(error);
    $("status").textContent = "Không tải được catalog.";
    $("grid").innerHTML = `<div class="empty">${safe(error.message)}</div>`;
  }
}

init();
