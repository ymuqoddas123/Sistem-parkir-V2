/* ============================================================
   SIMULASI SISTEM PARKIR — Stack & Queue
   ============================================================ */

const MAX_SLOT = 10;

class Stack {
  constructor() { this.items = []; }
  push(item) {
    if (this.items.length >= MAX_SLOT) return false;
    this.items.push(item);
    return true;
  }
  pop() { return this.items.length ? this.items.pop() : null; }
  peek() { return this.items.length ? this.items[this.items.length - 1] : null; }
  isEmpty() { return this.items.length === 0; }
  isFull()  { return this.items.length >= MAX_SLOT; }
  size()    { return this.items.length; }
}

class Queue {
  constructor() { this.items = []; }
  enqueue(item) { this.items.push(item); }
  dequeue() { return this.items.length ? this.items.shift() : null; }
  front() { return this.items.length ? this.items[0] : null; }
  isEmpty() { return this.items.length === 0; }
  size()    { return this.items.length; }
}

const stackParkir  = new Stack();
const queueAntrian = new Queue();
let totalMasuk  = 0;
let totalKeluar = 0;
let tempDisplacedPlats = [];

function now() {
  const d = new Date();
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map(n => n.toString().padStart(2, '0'))
    .join(':');
}

function addLog(msg, tipe = 'info') {
  const list = document.getElementById('log-list');
  if(!list) return;
  const el   = document.createElement('div');
  el.className = 'log-item ' + tipe;
  el.innerHTML = `<span class="log-time">${now()}</span><span>${msg}</span>`;
  list.prepend(el);
  while (list.children.length > 40) list.removeChild(list.lastChild);
}

function autoPlat() {
  const huruf  = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const prefix = ['B', 'D', 'F', 'E', 'AB', 'AD', 'AG', 'DA', 'DK', 'H', 'L', 'N'];
  const p   = prefix[Math.floor(Math.random() * prefix.length)];
  const num = Math.floor(Math.random() * 8999) + 1000;
  const suf = huruf[Math.floor(Math.random() * huruf.length)] + huruf[Math.floor(Math.random() * huruf.length)];
  return `${p} ${num} ${suf}`;
}

function getIcon(jenis) {
  if (jenis === 'Motor') return '🛵';
  if (jenis === 'Truk')  return '🚛';
  return '🚗';
}

function tambahAntrian() {
  let plat  = document.getElementById('input-plat').value.trim().toUpperCase();
  const jenis = document.getElementById('input-jenis').value;
  if (!plat) plat = autoPlat();

  const semuaPlat = [
    ...stackParkir.items.map(x => x.plat),
    ...queueAntrian.items.map(x => x.plat),
  ];
  if (semuatPlat = semuaPlat.includes(plat)) {
    addLog(`⚠️ Plat ${plat} sudah ada di sistem.`, 'info');
    return;
  }

  queueAntrian.enqueue({ plat, jenis, waktu: now() });
  addLog(`🚗 [QUEUE] ${jenis} ${plat} masuk antrian. Posisi: ${queueAntrian.size()}`, 'antri');
  document.getElementById('input-plat').value = '';
  render();
}

function prosesAntrian() {
  if (queueAntrian.isEmpty()) {
    addLog('ℹ️ Tidak ada kendaraan dalam antrian.', 'info');
    return;
  }
  if (stackParkir.isFull()) {
    addLog('⚠️ Area parkir penuh! Kendaraan masih dalam antrian.', 'info');
    return;
  }

  const kendaraan = queueAntrian.dequeue();
  stackParkir.push({ ...kendaraan, slotMasuk: now() });
  totalMasuk++;
  addLog(`✅ [STACK] ${kendaraan.jenis} ${kendaraan.plat} diparkir di slot ${stackParkir.size()}.`, 'dipanggil');
  render();
}

async function keluarKendaraan(targetPlat = null) {
  if (stackParkir.isEmpty()) {
    addLog('ℹ️ Area parkir kosong.', 'info');
    return;
  }
  if (!targetPlat) {
    const topItem = stackParkir.peek();
    if (topItem) targetPlat = topItem.plat;
  }

  const indexTarget = stackParkir.items.findIndex(x => x.plat === targetPlat);
  if (indexTarget === -1) {
    addLog(`⚠️ Plat ${targetPlat} tidak ditemukan.`, 'info');
    return;
  }

  const tempStack = [];
  while (stackParkir.peek() && stackParkir.peek().plat !== targetPlat) {
    const popped = stackParkir.pop();
    tempDisplacedPlats.push(popped.plat);
    tempStack.push(popped);
    addLog(`🚨 [DISPLACE] ${popped.jenis} ${popped.plat} dipindahkan sementara.`, 'keluar');
    render();
    await new Promise(r => setTimeout(r, 400));
  }

  const kendaraanTarget = stackParkir.pop();
  totalKeluar++;
  addLog(`🚪 [STACK] Target ${kendaraanTarget.jenis} ${kendaraanTarget.plat} BERHASIL keluar.`, 'keluar');
  render();
  await new Promise(r => setTimeout(r, 400));

  while (tempStack.length > 0) {
    const itemKembali = tempStack.pop();
    stackParkir.push(itemKembali);
    tempDisplacedPlats = tempDisplacedPlats.filter(p => p !== itemKembali.plat);
    addLog(`↩️ [RESTORE] ${itemKembali.jenis} ${itemKembali.plat} dimasukkan kembali.`, 'masuk');
    render();
    await new Promise(r => setTimeout(r, 400));
  }
  render();
}

function clearLog() {
  document.getElementById('log-list').innerHTML = `<div class="log-item info"><span class="log-time">${now()}</span><span>Log dibersihkan.</span></div>`;
}

function render() {
  renderSlotGrid();
  renderStackVisual();
  renderQueueVisual();
  renderStats();
}

function renderSlotGrid() {
  const grid = document.getElementById('slot-grid');
  if(!grid) return;
  const topItem = stackParkir.peek();
  grid.innerHTML = '';

  for (let i = 1; i <= MAX_SLOT; i++) {
    const el = document.createElement('div');
    const item = stackParkir.items[i - 1];

    if (item) {
      const isTop = item === topItem;
      const isDisplaced = tempDisplacedPlats.includes(item.plat);
      let slotClass = 'slot occupied';
      if (isDisplaced) slotClass += ' displaced';
      else if (isTop) slotClass += ' top-stack';

      el.className = slotClass;
      el.setAttribute('onclick', `keluarKendaraan('${item.plat}')`);
      el.style.cursor = 'pointer';
      el.innerHTML = `<div>${getIcon(item.jenis)}</div><div style="font-size:9px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%;">${item.plat}</div><div class="slot-num">S${i}</div>`;
    } else {
      el.className = 'slot empty';
      el.innerHTML = `<div style="font-size:16px;opacity:0.3;">P</div><div class="slot-num">S${i}</div>`;
    }
    grid.appendChild(el);
  }
}

function renderStackVisual() {
  const el = document.getElementById('stack-visual');
  if(!el) return;
  const items = [...stackParkir.items].reverse();
  if (!items.length) { el.innerHTML = '<div class="empty-state">Stack kosong</div>'; return; }
  el.innerHTML = '';
  items.forEach((item, idx) => {
    const div = document.createElement('div');
    const isDisplaced = tempDisplacedPlats.includes(item.plat);
    let itemClass = 'struct-item';
    if (isDisplaced) itemClass += ' displaced';
    else if (idx === 0) itemClass += ' top';

    div.className = itemClass;
    div.setAttribute('onclick', `keluarKendaraan('${item.plat}')`);
    div.style.cursor = 'pointer';

    let tag = '';
    if (isDisplaced) tag = '<span class="struct-item-tag tag-displaced">DISP</span>';
    else if (idx === 0) tag = '<span class="struct-item-tag tag-top">TOP</span>';
    else if (idx === items.length - 1) tag = '<span class="struct-item-tag tag-bottom">BOT</span>';

    div.innerHTML = `<span>${getIcon(item.jenis)} ${item.plat}</span><span style="font-size:11px;color:var(--text3);margin-left:4px;">${item.jenis}</span>\${tag}`;
    el.appendChild(div);

    if (idx < items.length - 1) {
      const arr = document.createElement('div');
      arr.className = 'arrow-down'; arr.textContent = '↓'; el.appendChild(arr);
    }
  });
}

function renderQueueVisual() {
  const el = document.getElementById('queue-visual');
  if(!el) return;
  const items = queueAntrian.items;
  if (!items.length) { el.innerHTML = '<div class="empty-state">Antrian kosong</div>'; return; }
  el.innerHTML = '';
  items.forEach((item, idx) => {
    const div = document.createElement('div');
    div.className = 'struct-item' + (idx === 0 ? ' front' : '');
    let tag = '';
    if (idx === 0) tag = '<span class="struct-item-tag tag-front">FRONT</span>';
    else if (idx === items.length - 1) tag = '<span class="struct-item-tag tag-rear">REAR</span>';

    div.innerHTML = `<span>${getIcon(item.jenis)} ${item.plat}</span><span style="font-size:11px;color:var(--text3);margin-left:4px;">${item.jenis}</span>\${tag}`;
    el.appendChild(div);

    if (idx < items.length - 1) {
      const arr = document.createElement('div');
      arr.className = 'arrow-down'; arr.textContent = '↓'; el.appendChild(arr);
    }
  });
}

function renderStats() {
  document.getElementById('stat-slot').textContent = `\${stackParkir.size()}/\${MAX_SLOT}`;
  document.getElementById('stat-antrian').textContent = queueAntrian.size();
  document.getElementById('stat-masuk').textContent = totalMasuk;
  document.getElementById('stat-keluar').textContent = totalKeluar;
}

let demoRunning = false;
async function demoOtomatis() {
  if (demoRunning) return;
  demoRunning = true;
  addLog('▶ Demo otomatis dimulai...', 'info');
  const jenisArr = ['Motor', 'Mobil', 'Mobil', 'Truk', 'Mobil'];
  const acak = () => jenisArr[Math.floor(Math.random() * jenisArr.length)];
  const setInput = (jenis) => {
    document.getElementById('input-plat').value = autoPlat();
    document.getElementById('input-jenis').value = jenis;
  };

  const steps = [
    () => { setInput(acak()); tambahAntrian(); },
    () => { setInput(acak()); tambahAntrian(); },
    () => { setInput('Motor'); tambahAntrian(); },
    prosesAntrian,
    prosesAntrian,
    () => { setInput('Mobil'); tambahAntrian(); },
    prosesAntrian,
    () => keluarKendaraan(),
    () => { setInput('Truk'); tambahAntrian(); },
    prosesAntrian,
    prosesAntrian,
    () => keluarKendaraan(),
  ];

  for (const step of steps) {
    step();
    await new Promise(r => setTimeout(r, 500));
  }
  addLog('⏹ Demo otomatis selesai.', 'info');
  demoRunning = false;
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('input-plat').addEventListener('keydown', e => {
    if (e.key === 'Enter') tambahAntrian();
  });
  render();
});
