// Data keys
const LS_SERVICES = 'heaven_services';
const LS_CART = 'heaven_cart';
const LS_SALES = 'heaven_sales';

// Default services with fixed sample images (picsum.photos IDs for stability)
const DEFAULT_SERVICES = [
  { id: cryptoId(), name: 'Hair Cut', price: 199, image: sampleFixed(1027) },
  { id: cryptoId(), name: 'Hair Treatment', price: 499, image: sampleFixed(1015) },
  { id: cryptoId(), name: 'Baby Hair Cut', price: 149, image: sampleFixed(1003) },
  { id: cryptoId(), name: 'Head Massage', price: 299, image: sampleFixed(1012) },
  { id: cryptoId(), name: 'Hair Straightening', price: 999, image: sampleFixed(1025) },
  { id: cryptoId(), name: 'Hair Coloring', price: 799, image: sampleFixed(1006) },
  { id: cryptoId(), name: 'Hair Smoothing', price: 899, image: sampleFixed(1020) },
  { id: cryptoId(), name: 'Beard Grooming', price: 149, image: sampleFixed(1011) },
  { id: cryptoId(), name: 'Bridal Facial', price: 1499, image: sampleFixed(1002) },
  { id: cryptoId(), name: 'Normal Facial', price: 399, image: sampleFixed(1016) },
  { id: cryptoId(), name: 'Tan Removal', price: 599, image: sampleFixed(1008) },
  { id: cryptoId(), name: 'Skin Glowing', price: 699, image: sampleFixed(1009) },
  { id: cryptoId(), name: 'Pedicure', price: 349, image: sampleFixed(1013) },
  { id: cryptoId(), name: 'Manicure', price: 349, image: sampleFixed(1014) }
];

// Helpers
function cryptoId() {
  return (self.crypto?.randomUUID?.() || 'id-' + Math.random().toString(36).slice(2));
}
function sampleImg() {
  return sampleFixed(1069);
}
function sampleFixed(id) {
  return `https://picsum.photos/id/${id}/600/400`;
}
function rupee(n) {
  return `₹${Number(n || 0).toFixed(2)}`;
}
function readLS(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function writeLS(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

// State
let services = readLS(LS_SERVICES, null) || DEFAULT_SERVICES;
let cart = readLS(LS_CART, []);
let sales = readLS(LS_SALES, []);
writeLS(LS_SERVICES, services);
writeLS(LS_CART, cart);
writeLS(LS_SALES, sales);

// Elements
const views = {
  services: document.getElementById('view-services'),
  billing: document.getElementById('view-billing'),
  manage: document.getElementById('view-manage'),
  reports: document.getElementById('view-reports')
};
const servicesGrid = document.getElementById('services-grid');
const serviceSearch = document.getElementById('service-search');

const cartEmpty = document.getElementById('cart-empty');
const cartTable = document.getElementById('cart-table');
const cartBody = document.getElementById('cart-body');
const clearCartBtn = document.getElementById('clear-cart');

const sumItems = document.getElementById('sum-items');
const sumSubtotal = document.getElementById('sum-subtotal');
const sumTotal = document.getElementById('sum-total');
const printBtn = document.getElementById('print-bill');
const uploadBtn = document.getElementById('upload-btn');
const uploadInput = document.getElementById('upload-proof');

const printRows = document.getElementById('print-rows');
const printSubtotal = document.getElementById('print-subtotal');
const printTotal = document.getElementById('print-total');
const printTime = document.getElementById('print-time');

const serviceForm = document.getElementById('service-form');
const serviceId = document.getElementById('service-id');
const serviceName = document.getElementById('service-name');
const servicePrice = document.getElementById('service-price');
const serviceImageFile = document.getElementById('service-image-file');
const serviceImagePreview = document.getElementById('service-image-preview');
const formResetBtn = document.getElementById('btn-reset');
let pendingImageDataUrl = '';
const manageList = document.getElementById('manage-list');

const reportFrom = document.getElementById('report-from');
const reportTo = document.getElementById('report-to');
const reportFilter = document.getElementById('report-filter');
const reportClear = document.getElementById('report-clear');
const reportBody = document.getElementById('report-body');
const reportOrders = document.getElementById('report-orders');
const reportItems = document.getElementById('report-items');
const reportAmount = document.getElementById('report-amount');
const toastEl = document.getElementById('toast');

// Navigation
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => showView(btn.dataset.view));
});
function showView(key) {
  Object.values(views).forEach(v => v.classList.remove('active'));
  views[key].classList.add('active');
  if (key === 'billing') renderCart();
  if (key === 'manage') renderManage();
  if (key === 'reports') renderReports();
}

// Services rendering
function renderServices() {
  const q = (serviceSearch.value || '').toLowerCase();
  const list = services.filter(s => s.name.toLowerCase().includes(q));
  servicesGrid.innerHTML = '';
  list.forEach(svc => {
    const card = document.createElement('div');
    card.className = 'service-card card';
    card.innerHTML = `
      <img src="${svc.image || sampleImg(1)}" alt="${svc.name}">
      <div class="service-body">
        <div class="service-title">${svc.name}</div>
        <div class="service-footer">
          <span class="price">${rupee(svc.price)}</span>
          <button class="btn primary" data-id="${svc.id}">Add</button>
        </div>
      </div>
    `;
    card.querySelector('button').addEventListener('click', () => addToCart(svc.id));
    card.addEventListener('click', (e) => {
      if (e.target.tagName.toLowerCase() !== 'button') addToCart(svc.id);
    });
    servicesGrid.appendChild(card);
  });
}
serviceSearch.addEventListener('input', renderServices);

// Cart logic
function addToCart(serviceId) {
  const svc = services.find(s => s.id === serviceId);
  if (!svc) return;
  const idx = cart.findIndex(c => c.serviceId === serviceId);
  if (idx >= 0) cart[idx].qty += 1; else cart.push({ serviceId, name: svc.name, price: svc.price, qty: 1 });
  writeLS(LS_CART, cart);
  renderCart();
  showToast(`${svc.name} added to cart`);
}
function updateQty(serviceId, qty) {
  const item = cart.find(c => c.serviceId === serviceId);
  if (!item) return;
  item.qty = Math.max(1, qty|0);
  writeLS(LS_CART, cart);
  renderCart();
}
function removeFromCart(serviceId) {
  cart = cart.filter(c => c.serviceId !== serviceId);
  writeLS(LS_CART, cart);
  renderCart();
}
function clearCart() {
  cart = [];
  writeLS(LS_CART, cart);
  renderCart();
}
clearCartBtn.addEventListener('click', clearCart);

function totals() {
  const items = cart.reduce((a, c) => a + c.qty, 0);
  const subtotal = cart.reduce((a, c) => a + c.qty * c.price, 0);
  const tax = 0;
  const total = +(subtotal + tax).toFixed(2);
  return { items, subtotal, tax, total };
}

function renderCart() {
  if (!cart.length) {
    cartEmpty.classList.remove('hidden');
    cartTable.classList.add('hidden');
  } else {
    cartEmpty.classList.add('hidden');
    cartTable.classList.remove('hidden');
  }
  cartBody.innerHTML = '';
  cart.forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${row.name}</td>
      <td>${rupee(row.price)}</td>
      <td>
        <input type="number" min="1" value="${row.qty}" style="width:70px;background:rgba(255,255,255,0.05);color:#ffffff;border:1px solid rgba(255,255,255,0.1);padding:6px;border-radius:8px;backdrop-filter:blur(10px);">
      </td>
      <td>${rupee(row.qty * row.price)}</td>
      <td><button class="btn danger">×</button></td>
    `;
    tr.querySelector('input').addEventListener('change', (e) => updateQty(row.serviceId, Number(e.target.value)));
    tr.querySelector('button').addEventListener('click', () => removeFromCart(row.serviceId));
    cartBody.appendChild(tr);
  });
  const t = totals();
  sumItems.textContent = t.items;
  sumSubtotal.textContent = rupee(t.subtotal);
  sumTotal.textContent = rupee(t.total);
}

// Print
printBtn.addEventListener('click', () => {
  const t = totals();
  printRows.innerHTML = '';
  cart.forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${row.name}</td><td>${rupee(row.price)}</td><td>${row.qty}</td><td>${rupee(row.qty * row.price)}</td>`;
    printRows.appendChild(tr);
  });
  printSubtotal.textContent = rupee(t.subtotal);
  printTotal.textContent = rupee(t.total);
  printTime.textContent = new Date().toLocaleString();
  window.print();
});

// Upload -> record sale immediately and open reports (daily)
if (uploadBtn) {
  uploadBtn.addEventListener('click', () => {
    if (!cart.length) { alert('Cart is empty'); return; }
    const t = totals();
    const sale = {
      id: cryptoId(),
      time: Date.now(),
      items: cart.map(c => ({ name: c.name, price: c.price, qty: c.qty })),
      totals: t
    };
    sales.push(sale);
    writeLS(LS_SALES, sales);
    clearCart();
    showToast('Upload successful: sale added to reports');
    activeReportTab = 'daily';
    showView('reports');
    renderReports();
    focusDailyBreakdownForTimestamp(sale.time);
  });
}

// Manage Menu (CRUD)
function renderManage() {
  manageList.innerHTML = '';
  services.forEach(svc => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="service-card">
        <img src="${svc.image || sampleImg(1)}" alt="${svc.name}" />
        <div class="service-body">
          <div class="service-title">${svc.name}</div>
          <div class="service-footer">
            <span class="price">${rupee(svc.price)}</span>
            <span></span>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="btn" data-edit>Edit</button>
            <button class="btn danger" data-del>Delete</button>
          </div>
        </div>
      </div>
    `;
    card.querySelector('[data-edit]').addEventListener('click', () => loadForm(svc));
    card.querySelector('[data-del]').addEventListener('click', () => delService(svc.id));
    manageList.appendChild(card);
  });
}

function loadForm(svc) {
  serviceId.value = svc.id;
  serviceName.value = svc.name;
  servicePrice.value = svc.price;
  pendingImageDataUrl = '';
  if (serviceImagePreview) {
    if (svc.image) {
      serviceImagePreview.src = svc.image;
      serviceImagePreview.style.display = 'block';
    } else {
      serviceImagePreview.removeAttribute('src');
      serviceImagePreview.style.display = 'none';
    }
  }
}
function resetForm() {
  serviceId.value = '';
  serviceName.value = '';
  servicePrice.value = '';
  pendingImageDataUrl = '';
  if (serviceImageFile) serviceImageFile.value = '';
  if (serviceImagePreview) { serviceImagePreview.removeAttribute('src'); serviceImagePreview.style.display = 'none'; }
}
formResetBtn.addEventListener('click', resetForm);

// Handle image file selection -> data URL preview
if (serviceImageFile) {
  serviceImageFile.addEventListener('change', () => {
    const file = serviceImageFile.files && serviceImageFile.files[0];
    if (!file) { pendingImageDataUrl = ''; return; }
    const reader = new FileReader();
    reader.onload = () => {
      pendingImageDataUrl = String(reader.result || '');
      if (serviceImagePreview) {
        serviceImagePreview.src = pendingImageDataUrl;
        serviceImagePreview.style.display = 'block';
      }
    };
    reader.readAsDataURL(file);
  });
}

serviceForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = {
    id: serviceId.value || cryptoId(),
    name: serviceName.value.trim(),
    price: Number(servicePrice.value || 0),
    image: ''
  };
  if (!data.name || data.price < 0) { alert('Please enter valid name and price.'); return; }
  const existsIdx = services.findIndex(s => s.id === data.id);
  if (existsIdx >= 0) {
    const existing = services[existsIdx];
    data.image = pendingImageDataUrl || existing.image || '';
    services[existsIdx] = data;
  } else {
    data.image = pendingImageDataUrl || sampleImg();
    services.push(data);
  }
  writeLS(LS_SERVICES, services);
  resetForm();
  renderServices();
  renderManage();
});

function delService(id) {
  if (!confirm('Delete this service?')) return;
  services = services.filter(s => s.id !== id);
  // Also clean from cart
  cart = cart.filter(c => c.serviceId !== id);
  writeLS(LS_SERVICES, services);
  writeLS(LS_CART, cart);
  renderServices();
  renderCart();
  renderManage();
}

// Reports
let activeReportTab = 'daily'; // 'daily' | 'weekly' | 'monthly' | 'yearly'

// Keys/formatters
function saleAmount(sale) {
  return sale.items.reduce((a, c) => a + c.qty * c.price, 0);
}
function keyDay(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function keyWeek(ts) {
  const d = new Date(ts);
  // ISO week
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (date.getUTCDay() || 7);
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
  const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2,'0')}`;
}
function keyMonth(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function keyYear(ts) {
  return String(new Date(ts).getFullYear());
}
function formatMonth(key) {
  const [y, m] = key.split('-');
  const dt = new Date(Number(y), Number(m) - 1, 1);
  return dt.toLocaleString(undefined, { month: 'long', year: 'numeric' });
}
function startOfDay(ts) { const d = new Date(ts); d.setHours(0,0,0,0); return d.getTime(); }
function endOfDay(ts) { const d = new Date(ts); d.setHours(23,59,59,999); return d.getTime(); }
function renderReports() {
  let from = reportFrom.value ? startOfDay(new Date(reportFrom.value).getTime()) : -Infinity;
  let to = reportTo.value ? endOfDay(new Date(reportTo.value).getTime()) : Infinity;
  const filtered = sales.filter(s => s.time >= from && s.time <= to);
  let keyFn = keyDay, title = 'Daily Sales Report', periodHeader = 'Date';
  if (activeReportTab === 'weekly') { keyFn = keyWeek; title = 'Weekly Sales Report'; periodHeader = 'Week'; }
  if (activeReportTab === 'monthly') { keyFn = keyMonth; title = 'Monthly Sales Report'; periodHeader = 'Month'; }
  if (activeReportTab === 'yearly') { keyFn = keyYear; title = 'Yearly Sales Report'; periodHeader = 'Year'; }

  const groups = new Map();
  for (const sale of filtered) {
    const k = keyFn(sale.time);
    const cur = groups.get(k) || { orders: 0, items: 0, amount: 0, sales: [] };
    cur.orders += 1;
    cur.items += sale.items.reduce((a, c) => a + c.qty, 0);
    cur.amount += saleAmount(sale);
    cur.sales.push(sale);
    groups.set(k, cur);
  }
  const rows = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  reportBody.innerHTML = '';
  let grandOrders = 0, grandItems = 0, grandAmount = 0;
  rows.forEach(([k, v]) => {
    const tr = document.createElement('tr');
    let label = k;
    if (activeReportTab === 'monthly') label = formatMonth(k);
    tr.innerHTML = `<td>${label}</td><td>${v.orders}</td><td>${v.items}</td><td>${rupee(v.amount)}</td>`;
    if (activeReportTab === 'daily') {
      tr.style.cursor = 'pointer';
      tr.addEventListener('click', () => renderDailyBreakdown(k, v.sales));
    }
    reportBody.appendChild(tr);
    grandOrders += v.orders; grandItems += v.items; grandAmount += v.amount;
  });
  reportOrders.textContent = String(grandOrders);
  reportItems.textContent = String(grandItems);
  reportAmount.textContent = rupee(grandAmount);
  const titleEl = document.getElementById('report-title');
  const colHeader = document.getElementById('col-period');
  if (titleEl) titleEl.textContent = title;
  if (colHeader) colHeader.textContent = periodHeader;
  // Hide breakdown if not daily
  const dailyBox = document.getElementById('daily-breakdown');
  if (dailyBox) dailyBox.classList.toggle('hidden', activeReportTab !== 'daily');
}
reportFilter.addEventListener('click', renderReports);
reportClear.addEventListener('click', () => { reportFrom.value = ''; reportTo.value = ''; renderReports(); });

// Report tabs
document.querySelectorAll('.report-tabs .tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.report-tabs .tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeReportTab = btn.dataset.tab;
    renderReports();
  });
});

function renderDailyBreakdown(dayKey, salesList) {
  const byService = new Map();
  let total = 0;
  for (const sale of salesList) {
    for (const it of sale.items) {
      const cur = byService.get(it.name) || { qty: 0, subtotal: 0 };
      cur.qty += it.qty;
      cur.subtotal += it.qty * it.price;
      byService.set(it.name, cur);
      total += it.qty * it.price;
    }
  }
  const body = document.getElementById('breakdown-body');
  const totalEl = document.getElementById('breakdown-total');
  const dateEl = document.getElementById('breakdown-date');
  const box = document.getElementById('daily-breakdown');
  if (!body || !totalEl || !dateEl || !box) return;
  body.innerHTML = '';
  [...byService.entries()].sort(([a],[b]) => a.localeCompare(b)).forEach(([name, v]) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${name}</td><td>${v.qty}</td><td>${rupee(v.subtotal)}</td>`;
    body.appendChild(tr);
  });
  totalEl.textContent = rupee(total);
  // Show human date
  const [y,m,d] = dayKey.split('-');
  const dt = new Date(Number(y), Number(m)-1, Number(d));
  dateEl.textContent = dt.toDateString();
  box.classList.remove('hidden');
}

function focusDailyBreakdownForTimestamp(ts) {
  const dk = keyDay(ts);
  // Find all sales that match the day key
  const list = sales.filter(s => keyDay(s.time) === dk);
  renderDailyBreakdown(dk, list);
}

// Toast
let toastTimer = null;
function showToast(message) {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.remove('hidden');
  // Force reflow to ensure transition plays when toggling classes quickly
  void toastEl.offsetWidth;
  toastEl.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.classList.remove('show');
    // Re-hide after transition ends
    setTimeout(() => toastEl.classList.add('hidden'), 260);
  }, 1800);
}

// Init
document.getElementById('year').textContent = new Date().getFullYear();
renderServices();
renderCart();


