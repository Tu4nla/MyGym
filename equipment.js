const $ = (id) => document.getElementById(id);

const state = {
  config: null,
  items: [],
  selected: new Set(),
  query: "",
  group: "all",
  body: "all",
  onlySelected: false,
};

function normalize(value = "") {
  return String(value).trim().toLowerCase();
}

function titleCase(value = "") {
  return value.replace(/\b\w/g, (c) => c.toUpperCase());
}

function machineLabel(item) {
  return item.name || "Unnamed variation";
}

function itemId(item) {
  return `${item.equipment}:${item.id}`;
}

function loadSelection() {
  try {
    const key = state.config.selectionStorageKey;
    const saved = JSON.parse(localStorage.getItem(key) || "[]");
    state.selected = new Set(Array.isArray(saved) ? saved : []);
  } catch {
    state.selected = new Set();
  }

  const hash = location.hash.replace(/^#selected=/, "");
  if (hash) {
    try {
      const decoded = JSON.parse(decodeURIComponent(atob(hash)));
      if (Array.isArray(decoded)) state.selected = new Set(decoded);
    } catch {}
  }
}

function persistSelection() {
  localStorage.setItem(
    state.config.selectionStorageKey,
    JSON.stringify([...state.selected])
  );
  $("selected-count").textContent = state.selected.size;
}

function getImageUrl(item) {
  const image = item.image || item.thumbnail || "";
  if (!image) return "";
  if (/^https?:\/\//i.test(image)) return image;
  return `${state.config.source.imageBaseUrl}${image.replace(/^\//, "")}`;
}

function bodyPart(item) {
  return item.body_part || item.category || "other";
}

function selectedItems() {
  return state.items.filter((item) => state.selected.has(itemId(item)));
}

function exportPayload() {
  return selectedItems().map((item) => ({
    id: item.id,
    name: item.name,
    equipment: item.equipment,
    bodyPart: bodyPart(item),
    target: item.target || null,
    image: getImageUrl(item),
  }));
}

function filteredItems() {
  return state.items.filter((item) => {
    const id = itemId(item);
    if (state.onlySelected && !state.selected.has(id)) return false;
    if (state.group !== "all" && normalize(item.equipment) !== state.group) return false;
    if (state.body !== "all" && normalize(bodyPart(item)) !== state.body) return false;
    if (state.query) {
      const haystack = normalize([
        item.name,
        item.equipment,
        bodyPart(item),
        item.target,
        ...(item.secondary_muscles || []),
      ].join(" "));
      if (!haystack.includes(state.query)) return false;
    }
    return true;
  });
}

function render() {
  const grid = $("grid");
  const items = filteredItems();
  $("status").textContent = `${items.length} option · ${state.items.length} tổng cộng · ${state.selected.size} đã chọn`;
  $("selected-count").textContent = state.selected.size;

  if (!items.length) {
    grid.innerHTML = '<div class="empty">Không có máy phù hợp bộ lọc hiện tại.</div>';
    return;
  }

  grid.innerHTML = items.map((item) => {
    const id = itemId(item);
    const selected = state.selected.has(id);
    const img = getImageUrl(item);
    const safeName = machineLabel(item).replace(/"/g, "&quot;");
    return `
      <article class="card ${selected ? "selected" : ""}" data-id="${id}">
        <div class="image-wrap">
          ${img ? `<img loading="lazy" src="${img}" alt="${safeName}" onerror="this.outerHTML='<div class=&quot;image-fallback&quot;>Không tải được ảnh</div>'">` : '<div class="image-fallback">Không có ảnh</div>'}
        </div>
        <label class="tick" title="Chọn máy này">
          <input type="checkbox" ${selected ? "checked" : ""} aria-label="Chọn ${safeName}">
        </label>
        <button class="card-button" type="button" aria-label="Toggle ${safeName}"></button>
        <div class="card-body">
          <h2 class="name">${machineLabel(item)}</h2>
          <div class="meta">
            <span class="pill">${titleCase(item.equipment)}</span>
            <span class="pill">${titleCase(bodyPart(item))}</span>
            ${item.target ? `<span class="pill">${titleCase(item.target)}</span>` : ""}
          </div>
        </div>
      </article>`;
  }).join("");

  grid.querySelectorAll(".card").forEach((card) => {
    const id = card.dataset.id;
    const toggle = () => {
      if (state.selected.has(id)) state.selected.delete(id);
      else state.selected.add(id);
      persistSelection();
      render();
    };
    card.querySelector(".card-button").addEventListener("click", toggle);
    card.querySelector("input").addEventListener("change", (event) => {
      event.stopPropagation();
      if (event.target.checked) state.selected.add(id);
      else state.selected.delete(id);
      persistSelection();
      render();
    });
  });
}

function setupFilters() {
  const group = $("group-filter");
  state.config.groups.forEach((g) => {
    const option = document.createElement("option");
    option.value = normalize(g.equipment);
    option.textContent = g.label;
    group.appendChild(option);
  });

  const bodies = [...new Set(state.items.map((x) => normalize(bodyPart(x))))].sort();
  const bodySelect = $("body-filter");
  bodies.forEach((name) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = titleCase(name);
    bodySelect.appendChild(option);
  });

  $("search").addEventListener("input", (e) => {
    state.query = normalize(e.target.value);
    render();
  });
  group.addEventListener("change", (e) => {
    state.group = e.target.value;
    render();
  });
  bodySelect.addEventListener("change", (e) => {
    state.body = e.target.value;
    render();
  });
  $("only-selected").addEventListener("change", (e) => {
    state.onlySelected = e.target.checked;
    render();
  });
}

async function copyText(text, button, successLabel) {
  await navigator.clipboard.writeText(text);
  const old = button.textContent;
  button.textContent = successLabel;
  setTimeout(() => { button.textContent = old; }, 1200);
}

function setupActions() {
  $("copy-names").addEventListener("click", (e) => {
    const text = selectedItems().map((x) => x.name).join("\n");
    copyText(text, e.currentTarget, "Đã copy tên");
  });
  $("copy-json").addEventListener("click", (e) => {
    copyText(JSON.stringify(exportPayload(), null, 2), e.currentTarget, "Đã copy JSON");
  });
  $("copy-link").addEventListener("click", (e) => {
    const encoded = btoa(encodeURIComponent(JSON.stringify([...state.selected])));
    const url = `${location.origin}${location.pathname}#selected=${encoded}`;
    copyText(url, e.currentTarget, "Đã copy link");
  });
  $("clear").addEventListener("click", () => {
    if (!state.selected.size) return;
    if (!confirm("Bỏ chọn toàn bộ máy?")) return;
    state.selected.clear();
    persistSelection();
    render();
  });
}

async function init() {
  try {
    state.config = await fetch("equipment-catalog.json?v=1").then((r) => {
      if (!r.ok) throw new Error(`Config ${r.status}`);
      return r.json();
    });

    const data = await fetch(state.config.source.url).then((r) => {
      if (!r.ok) throw new Error(`Dataset ${r.status}`);
      return r.json();
    });

    const allowed = new Set(state.config.includedEquipment.map(normalize));
    state.items = data
      .filter((item) => allowed.has(normalize(item.equipment)))
      .sort((a, b) => {
        const equipmentOrder = state.config.includedEquipment.map(normalize);
        const ea = equipmentOrder.indexOf(normalize(a.equipment));
        const eb = equipmentOrder.indexOf(normalize(b.equipment));
        if (ea !== eb) return ea - eb;
        return machineLabel(a).localeCompare(machineLabel(b));
      });

    loadSelection();
    persistSelection();
    setupFilters();
    setupActions();
    render();
  } catch (error) {
    console.error(error);
    $("status").textContent = "Không tải được catalog. Hãy reload trang hoặc kiểm tra kết nối mạng.";
    $("grid").innerHTML = `<div class="empty">${error.message}</div>`;
  }
}

init();
