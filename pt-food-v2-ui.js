(() => {
  const F = window.PT_FOOD_VN;
  if (!F || Number(F.version) < 2) return;

  const esc = v => String(v ?? "")
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");

  const priority = {
    default:["Mặc định","good"],
    good:["Dùng thường xuyên","good"],
    optional:["Tùy chọn",""],
    occasional:["Thỉnh thoảng","warn"],
    limit:["Hạn chế","danger"]
  };
  const proteinRole = {
    high:"Đạm cao",
    medium:"Bổ sung đạm",
    low:"Đạm thấp"
  };

  function injectStyles() {
    if (document.getElementById("food-v2-style")) return;
    const style = document.createElement("style");
    style.id = "food-v2-style";
    style.textContent = `
      .food-v2-wrap{margin:18px 0 8px}
      .food-v2-hero{border:1px solid rgba(159,246,180,.22);background:linear-gradient(150deg,rgba(159,246,180,.08),rgba(139,184,255,.045));border-radius:20px;padding:15px;margin-bottom:12px}
      .food-v2-hero h3{margin:4px 0 7px}.food-v2-hero p{margin:0;color:var(--muted);line-height:1.5}
      .food-v2-rule{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.food-v2-rule span{font-size:10px;border:1px solid var(--line);border-radius:999px;padding:6px 8px;background:rgba(255,255,255,.025)}
      .food-v2-section{margin-top:18px}.food-v2-section-head{display:flex;justify-content:space-between;align-items:end;gap:10px;margin-bottom:9px}.food-v2-section-head h3{margin:2px 0 0}.food-v2-section-head small{color:var(--muted);text-align:right}
      .food-v2-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
      .food-v2-item{border:1px solid var(--line);background:rgba(255,255,255,.018);border-radius:15px;padding:11px}
      .food-v2-item strong{display:block;font-size:12px;line-height:1.35;padding-right:4px}.food-v2-item small{display:block;color:var(--muted);font-size:10px;line-height:1.45;margin-top:4px}
      .food-v2-tags{display:flex;gap:5px;flex-wrap:wrap;margin-top:7px}.food-v2-tags span{font-size:9px;border-radius:999px;padding:4px 6px;border:1px solid rgba(255,255,255,.08);color:#d9e5dd}
      .food-v2-tags .good{border-color:rgba(159,246,180,.22);color:var(--accent)}.food-v2-tags .warn{border-color:rgba(255,210,124,.25);color:var(--warn)}.food-v2-tags .danger{border-color:rgba(255,120,120,.24);color:var(--danger)}
      .food-v2-muted{opacity:.68}.food-v2-note{font-size:10px;color:var(--muted);line-height:1.45;margin-top:8px}
      .food-v2-product-line{font-size:11px;margin-top:5px}.food-v2-product-line b{color:var(--accent)}
      @media(max-width:640px){.food-v2-grid{grid-template-columns:1fr}.food-v2-section-head{align-items:start;flex-direction:column}.food-v2-section-head small{text-align:left}}
    `;
    document.head.appendChild(style);
  }

  function breakfastItem(x) {
    const availability = (x.availability || []).join(" • ");
    return `<div class="food-v2-item ${x.officeFriendly ? "" : "food-v2-muted"}">
      <strong>${esc(x.name)}</strong>
      <small>${esc(x.portion)}</small>
      <div class="food-v2-product-line">~${esc(x.kcalMin)}–${esc(x.kcalMax)} kcal • <b>${esc(x.proteinMin)}–${esc(x.proteinMax)}g protein</b></div>
      <div class="food-v2-tags">
        <span class="${x.officeFriendly ? "good" : "warn"}">${x.officeFriendly ? "✓ văn phòng" : "không mặc định"}</span>
        <span>mùi ${esc(x.odor)}/3</span><span>bẩn ${esc(x.mess)}/3</span>
        ${availability ? `<span>${esc(availability)}</span>` : ""}
      </div>
    </div>`;
  }

  function productItem(x) {
    const role = proteinRole[x.proteinRole] || x.proteinRole || "";
    return `<div class="food-v2-item">
      <strong>${esc(x.brand)} — ${esc(x.name)}</strong>
      <small>${esc(x.serving)} • ${esc(x.storage || "")}</small>
      <div class="food-v2-product-line">~${esc(x.kcal)} kcal • <b>${esc(x.protein)}g protein</b></div>
      <div class="food-v2-tags"><span class="${x.proteinRole === "high" ? "good" : x.proteinRole === "low" ? "warn" : ""}">${esc(role)}</span>${(x.tags||[]).slice(0,3).map(t=>`<span>${esc(t)}</span>`).join("")}</div>
      <p class="food-v2-note">${esc(x.verified || "")}${x.macroExact ? " • Macro theo nhãn hãng." : " • Một phần macro ngoài protein là ước tính."}</p>
    </div>`;
  }

  function drinkItem(x) {
    const [label, tone] = priority[x.priority] || [x.priority || "",""];
    return `<div class="food-v2-item">
      <strong>${esc(x.name)}</strong>
      <small>${esc(x.brand || "")} • ${esc(x.serving || "")}</small>
      <div class="food-v2-tags"><span class="${tone}">${esc(label)}</span><span>${esc(x.kcal)} kcal</span></div>
      <p class="food-v2-note">${esc(x.note || "")}</p>
    </div>`;
  }

  function restaurantItem(x) {
    return `<div class="food-v2-item food-v2-muted">
      <strong>${esc(x.name)}</strong>
      <small>${esc(x.note)}</small>
      <div class="food-v2-tags"><span class="warn">Ăn tại quán / cuối tuần</span><span>không random sáng đi làm</span></div>
    </div>`;
  }

  function catalogHtml() {
    const office = (F.breakfastBases || []).filter(x => x.officeFriendly && x.portable && x.odor <= 1 && x.mess <= 1);
    const excluded = (F.breakfastBases || []).filter(x => !office.includes(x));
    const products = F.products || [];
    const drinks = F.drinks || [];
    const restaurants = F.restaurantBreakfasts || [];
    return `<section id="food-v2-catalog" class="food-v2-wrap">
      <div class="food-v2-hero">
        <p class="eyebrow">BREAKFAST CONTEXT • OFFICE COMMUTE</p>
        <h3>Bữa sáng đi làm: mua trên đường → mang lên công ty</h3>
        <p>Planner chỉ random món <b>gọn, ít mùi, ít dây bẩn</b>. Phở, bún bò, hủ tiếu, cháo và cơm tấm vẫn có trong catalog tham khảo nhưng không còn xuất hiện ở bữa sáng đi làm mặc định.</p>
        <div class="food-v2-rule">${(F.breakfastPolicy?.rules||[]).map(x=>`<span>${esc(x)}</span>`).join("")}<span>mục tiêu ${esc(F.breakfastPolicy?.targetProtein || "25–30 g")} protein</span></div>
      </div>

      <div class="food-v2-section">
        <div class="food-v2-section-head"><div><p class="eyebrow">MÓN CHÍNH MANG ĐI</p><h3>${office.length} lựa chọn phù hợp bàn làm việc</h3></div><small>Macro là khoảng ước tính theo lượng nhân/sốt.</small></div>
        <div class="food-v2-grid">${office.map(breakfastItem).join("")}</div>
      </div>

      <div class="food-v2-section">
        <div class="food-v2-section-head"><div><p class="eyebrow">SỮA & SỮA CHUA</p><h3>${products.length} sản phẩm cụ thể</h3></div><small>Ưu tiên SKU cao đạm nếu món chính thiếu protein.</small></div>
        <div class="food-v2-grid">${products.map(productItem).join("")}</div>
        <p class="food-v2-note">Tên SKU dùng để bạn nhận diện nhanh khi ghé cửa hàng; tồn kho thực tế phụ thuộc từng cửa hàng/khu vực.</p>
      </div>

      <div class="food-v2-section">
        <div class="food-v2-section-head"><div><p class="eyebrow">ĐỒ UỐNG</p><h3>${drinks.length} lựa chọn theo mức ưu tiên</h3></div><small>Nước lọc là mặc định; juice/sữa được tính vào năng lượng.</small></div>
        <div class="food-v2-grid">${drinks.map(drinkItem).join("")}</div>
      </div>

      <div class="food-v2-section">
        <div class="food-v2-section-head"><div><p class="eyebrow">KHÔNG DÙNG CHO DEFAULT VĂN PHÒNG</p><h3>Món vẫn ăn được nếu ngồi tại quán</h3></div><small>Không phải “món xấu”; chỉ sai context mang lên công ty.</small></div>
        <div class="food-v2-grid">${[...excluded.map(breakfastItem),...restaurants.map(restaurantItem)].join("")}</div>
      </div>
    </section>`;
  }

  let scheduled = false;
  function ensure() {
    scheduled = false;
    injectStyles();
    const root = document.getElementById("v6-nutrition");
    if (!root || document.getElementById("food-v2-catalog")) return;
    const libraryHead = [...root.querySelectorAll(".section-head")].find(x => x.textContent.includes("FOOD LIBRARY") || x.textContent.includes("Kho món Việt"));
    if (libraryHead) libraryHead.insertAdjacentHTML("beforebegin", catalogHtml());
    else root.insertAdjacentHTML("beforeend", catalogHtml());

    const legacy = document.getElementById("meal-list");
    if (legacy) legacy.style.display = "none";
  }
  function scheduleEnsure() {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(ensure);
  }

  const boot = () => {
    scheduleEnsure();
    const root = document.getElementById("v6-nutrition");
    if (root) new MutationObserver(scheduleEnsure).observe(root,{childList:true});
    else new MutationObserver(() => {
      const x = document.getElementById("v6-nutrition");
      if (!x) return;
      scheduleEnsure();
      new MutationObserver(scheduleEnsure).observe(x,{childList:true});
    }).observe(document.body,{childList:true,subtree:true});
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded",boot,{once:true});
  else boot();
})();