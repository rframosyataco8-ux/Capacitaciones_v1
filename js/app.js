/**
 * CapaciHub — aplicación principal (datos reales + UI)
 */
import * as db from './db.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

let state = {
  view: 'vault',
  currentNoteId: null,
  notes: [],
  events: [],
  files: [],
  exams: [],
  year: new Date().getFullYear(),
  fileFolder: 'General'
};

async function boot() {
  await db.seedIfEmpty();
  await refreshAll();
  bindUI();
  showView('vault');
  if (state.notes.length) openNote(state.notes[0].id);
  renderTree();
  renderCronograma();
  renderFiles();
  renderExams();
  renderAudit();
}

async function refreshAll() {
  state.notes = await db.listNotes();
  state.events = await db.listEvents(state.year);
  state.files = await db.listFiles();
  state.exams = await db.listExams();
}

function showView(name) {
  state.view = name;
  $$('.panel').forEach(p => p.classList.remove('on'));
  $$('.rib').forEach(r => r.classList.remove('on'));
  const map = {
    vault: ['p-vault', 'r-files'],
    graph: ['p-graph', 'r-graph'],
    cronograma: ['p-cronograma', 'r-cal'],
    files: ['p-files', 'r-files2'],
    examenes: ['p-examenes', 'r-exam'],
    auditoria: ['p-auditoria', 'r-audit']
  };
  const [panel, rib] = map[name] || map.vault;
  const p = document.getElementById(panel);
  if (p) p.classList.add('on');
  const r = document.getElementById(rib);
  if (r) r.classList.add('on');
  $('#rightPane')?.classList.toggle('hide', name !== 'vault');
  if (name === 'graph') setTimeout(initGraph, 50);
  if (name === 'cronograma') renderCronograma();
  if (name === 'files') renderFiles();
  if (name === 'examenes') renderExams();
  if (name === 'auditoria') renderAudit();
}

function renderTree() {
  const tree = $('#tree');
  if (!tree) return;
  const structure = {};
  state.notes.forEach(n => {
    const parts = (n.path || n.title + '.md').split('/');
    let cur = structure;
    parts.forEach((part, i) => {
      if (i === parts.length - 1) {
        cur[part] = { __note: n };
      } else {
        cur[part] = cur[part] || {};
        cur = cur[part];
      }
    });
  });
  function walk(obj, depth) {
    let html = '';
    const keys = Object.keys(obj).sort((a, b) => {
      const af = !obj[a].__note, bf = !obj[b].__note;
      if (af !== bf) return af ? -1 : 1;
      return a.localeCompare(b);
    });
    keys.forEach(key => {
      const val = obj[key];
      if (val.__note) {
        const n = val.__note;
        const on = state.currentNoteId === n.id ? ' on' : '';
        html += `<div class="ti file${on}" data-id="${n.id}" style="padding-left:${8 + depth * 14}px">
          <span class="ch" style="visibility:hidden">▶</span>
          <span class="ic">📝</span><span class="nm">${esc(key)}</span>
        </div>`;
      } else {
        html += `<div class="ti folder" data-folder="${esc(key)}" style="padding-left:${8 + depth * 14}px">
          <span class="ch open">▶</span><span class="ic">📁</span><span class="nm">${esc(key)}</span>
        </div>
        <div class="tc open">${walk(val, depth + 1)}</div>`;
      }
    });
    return html;
  }
  tree.innerHTML = walk(structure, 0);
  tree.querySelectorAll('.ti.file').forEach(el => {
    el.onclick = () => openNote(el.dataset.id);
  });
  tree.querySelectorAll('.ti.folder').forEach(el => {
    el.onclick = (e) => {
      e.stopPropagation();
      const next = el.nextElementSibling;
      const ch = el.querySelector('.ch');
      if (next?.classList.contains('tc')) {
        next.classList.toggle('open');
        ch.classList.toggle('open');
      }
    };
  });
}

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function openNote(id) {
  const n = state.notes.find(x => x.id === id);
  if (!n) return;
  state.currentNoteId = id;
  showView('vault');
  $('#nTitle').value = n.title || '';
  $('#nMeta').innerHTML = formatMeta(n);
  $('#nBody').innerHTML = renderMarkdown(n.body || '');
  $('#stNote').textContent = (n.path || n.title || 'nota') + '';
  $('#tabLabel').textContent = (n.title || 'Nota').split('—')[0].trim().substring(0, 24);
  renderProps(n);
  renderBacklinks(n);
  renderTree();
  wireWikiLinks();
}

function formatMeta(n) {
  const d = n.updatedAt ? new Date(n.updatedAt).toLocaleDateString('es') : '';
  const tags = (n.tags || []).map(t => `<span class="tag">#${esc(t)}</span>`).join(' ');
  return `<span>${d}</span>${tags ? '<span>·</span>' + tags : ''}`;
}

function renderMarkdown(text) {
  let h = esc(text);
  h = h.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  h = h.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  h = h.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  h = h.replace(/\[\[([^\]]+)\]\]/g, (_, t) => {
    const note = state.notes.find(n => n.title.includes(t) || t.includes(n.title.split('—')[0].trim()));
    const id = note ? note.id : '';
    return `<a class="wiki" data-id="${id}" href="#">${esc('[[' + t + ']]')}</a>`;
  });
  h = h.replace(/^- (.+)$/gm, '<li>$1</li>');
  h = h.replace(/(<li>.*<\/li>\n?)+/g, m => '<ul>' + m + '</ul>');
  h = h.replace(/\n\n/g, '</p><p>');
  h = '<p>' + h + '</p>';
  h = h.replace(/<p><h/g, '<h').replace(/<\/h(\d)><\/p>/g, '</h$1>');
  h = h.replace(/<p><ul>/g, '<ul>').replace(/<\/ul><\/p>/g, '</ul>');
  return h;
}

function wireWikiLinks() {
  $$('.wiki').forEach(a => {
    a.onclick = (e) => {
      e.preventDefault();
      if (a.dataset.id) openNote(a.dataset.id);
    };
  });
}

function renderProps(n) {
  const box = $('#propsBox');
  if (!box) return;
  const p = n.props || {};
  const rows = Object.entries(p).map(([k, v]) =>
    `<div class="prow"><span class="k">${esc(k)}</span><span>${esc(String(v))}</span></div>`
  ).join('');
  box.innerHTML = rows || '<div class="prow"><span class="k">—</span><span>Sin propiedades</span></div>';
}

function renderBacklinks(n) {
  const box = $('#backlinksBox');
  if (!box) return;
  const titleKey = (n.title || '').split('—')[0].trim();
  const links = state.notes.filter(o => o.id !== n.id && (o.body || '').includes(titleKey));
  box.innerHTML = links.length
    ? links.map(o => `<div class="blink" data-id="${o.id}">${esc(o.title)}<div class="bctx">…menciona esta nota…</div></div>`).join('')
    : '<div style="font-size:12px;color:var(--faint)">Sin backlinks aún</div>';
  box.querySelectorAll('.blink').forEach(el => {
    el.onclick = () => openNote(el.dataset.id);
  });
}

async function createNote() {
  const title = prompt('Título de la nota:', 'Nueva nota');
  if (!title) return;
  const folder = prompt('Carpeta (path):', 'Base de Conocimiento');
  const note = await db.saveNote({
    title,
    path: `${folder || 'General'}/${title}.md`,
    body: `# ${title}\n\nEscribe aquí…\n`,
    tags: [],
    props: {}
  });
  await refreshAll();
  renderTree();
  openNote(note.id);
}

async function saveCurrentNoteBody() {
  const n = state.notes.find(x => x.id === state.currentNoteId);
  if (!n) return;
  const body = prompt('Editar contenido (markdown):', n.body || '');
  if (body == null) return;
  n.body = body;
  await db.saveNote(n);
  await refreshAll();
  openNote(n.id);
}

function renderCronograma() {
  const list = $('#cronoList');
  const yearSel = $('#yearSelect');
  if (yearSel) yearSel.value = state.year;
  if (!list) return;
  const events = state.events.slice().sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  if (!events.length) {
    list.innerHTML = '<div class="empty">No hay capacitaciones en este año. Crea la primera.</div>';
    return;
  }
  list.innerHTML = events.map(e => {
    const st = e.estado === 'Programada' || e.estado === 'Confirmada' ? 'chip-g'
      : e.estado === 'Pendiente' ? 'chip-o' : 'chip-b';
    return `<div class="list-row" data-id="${e.id}">
      <span>${esc(e.date || '')} ${esc(e.time || '')}</span>
      <span style="font-weight:500;flex:1;margin:0 12px">${esc(e.title)}</span>
      <span class="chip ${st}">${esc(e.estado || '')}</span>
      <button class="ibtn" data-del="${e.id}" title="Eliminar">✕</button>
    </div>`;
  }).join('');
  list.querySelectorAll('[data-del]').forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      if (!confirm('¿Eliminar esta capacitación del cronograma?')) return;
      await db.deleteEvent(btn.dataset.del);
      await refreshAll();
      renderCronograma();
    };
  });
}

async function addEvent() {
  const title = prompt('Nombre de la capacitación:');
  if (!title) return;
  const date = prompt('Fecha (YYYY-MM-DD):', `${state.year}-09-01`);
  if (!date) return;
  const time = prompt('Hora (HH:MM):', '09:00') || '09:00';
  const tipo = prompt('Tipo (Presencial / Virtual / Híbrida):', 'Presencial') || 'Presencial';
  const estado = prompt('Estado (Programada / Confirmada / Pendiente):', 'Programada') || 'Programada';
  await db.saveEvent({ title, date, time, tipo, estado, asistentes: 0, cupo: 30 });
  await refreshAll();
  renderCronograma();
}

async function changeYear(y) {
  state.year = parseInt(y, 10);
  state.events = await db.listEvents(state.year);
  renderCronograma();
}

async function duplicateYear() {
  const next = state.year + 1;
  if (!confirm(`¿Duplicar eventos de ${state.year} a ${next} (como borrador)?`)) return;
  const events = await db.listEvents(state.year);
  for (const e of events) {
    const copy = { ...e, id: undefined, year: next, date: e.date.replace(String(state.year), String(next)), estado: 'Borrador' };
    await db.saveEvent(copy);
  }
  state.year = next;
  await refreshAll();
  renderCronograma();
  alert(`Cronograma ${next} creado con ${events.length} eventos en borrador.`);
}

function renderFiles() {
  const list = $('#fileList');
  const folders = $('#folderList');
  if (!list) return;
  const all = state.files;
  const folderSet = [...new Set(all.map(f => f.folder || 'General'))].sort();
  if (folders) {
    folders.innerHTML = ['General', ...folderSet.filter(f => f !== 'General')].map(f =>
      `<div class="ti ${state.fileFolder === f ? 'on' : ''}" data-folder="${esc(f)}">
        <span class="ic">📁</span><span class="nm">${esc(f)}</span>
        <span style="margin-left:auto;font-size:11px;color:var(--faint)">${all.filter(x => (x.folder || 'General') === f).length}</span>
      </div>`
    ).join('');
    folders.querySelectorAll('[data-folder]').forEach(el => {
      el.onclick = () => {
        state.fileFolder = el.dataset.folder;
        renderFiles();
      };
    });
  }
  const filtered = all.filter(f => (f.folder || 'General') === state.fileFolder);
  if (!filtered.length) {
    list.innerHTML = '<div class="empty">Carpeta vacía. Sube PDF, PPT, Word, imágenes…</div>';
    return;
  }
  list.innerHTML = filtered.map(f => {
    const icon = fileIcon(f.name, f.type);
    const size = formatSize(f.size);
    const date = f.createdAt ? new Date(f.createdAt).toLocaleDateString('es') : '';
    return `<div class="list-row" data-id="${f.id}">
      <span style="width:28px">${icon}</span>
      <span style="flex:1;font-weight:500">${esc(f.name)}</span>
      <span style="color:var(--faint);font-size:12px">${size}</span>
      <span style="color:var(--faint);font-size:12px;width:90px;text-align:right">${date}</span>
      <button class="ibtn" data-dl="${f.id}" title="Descargar">⬇</button>
      <button class="ibtn" data-rm="${f.id}" title="Eliminar">✕</button>
    </div>`;
  }).join('');
  list.querySelectorAll('[data-dl]').forEach(btn => {
    btn.onclick = () => downloadFile(btn.dataset.dl);
  });
  list.querySelectorAll('[data-rm]').forEach(btn => {
    btn.onclick = async () => {
      if (!confirm('¿Eliminar archivo?')) return;
      await db.deleteFile(btn.dataset.rm);
      await refreshAll();
      renderFiles();
    };
  });
}

function fileIcon(name, type) {
  const n = (name || '').toLowerCase();
  if (n.endsWith('.pdf') || type === 'application/pdf') return '📄';
  if (n.endsWith('.ppt') || n.endsWith('.pptx')) return '📊';
  if (n.endsWith('.doc') || n.endsWith('.docx')) return '📝';
  if (n.endsWith('.xls') || n.endsWith('.xlsx')) return '📋';
  if (/\.(png|jpg|jpeg|gif|webp)$/.test(n)) return '🖼';
  if (n.endsWith('.zip')) return '📦';
  return '📎';
}

function formatSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

async function uploadFiles(fileList) {
  const folder = state.fileFolder || 'General';
  for (const file of fileList) {
    await db.saveFile({ name: file.name, folder, type: file.type, size: file.size, blob: file });
  }
  await refreshAll();
  renderFiles();
}

async function downloadFile(id) {
  const f = await db.getFile(id);
  if (!f || !f.blob) { alert('Archivo no disponible'); return; }
  const url = URL.createObjectURL(f.blob);
  const a = document.createElement('a');
  a.href = url; a.download = f.name; a.click();
  URL.revokeObjectURL(url);
}

function newFolder() {
  const name = prompt('Nombre de la carpeta:', '2026 / Materiales');
  if (!name) return;
  state.fileFolder = name;
  renderFiles();
}

function renderExams() {
  const box = $('#examList');
  if (!box) return;
  if (!state.exams.length) {
    box.innerHTML = '<div class="empty">Sin exámenes. Crea el primero.</div>';
    return;
  }
  box.innerHTML = state.exams.map(x => {
    const st = x.estado === 'Activo' ? 'chip-g' : 'chip-o';
    return `<div class="card">
      <span class="chip ${st}">${esc(x.estado || 'Borrador')}</span>
      <div style="font-weight:600;margin:8px 0 4px;font-size:15px">${esc(x.title)}</div>
      <div style="font-size:12px;color:var(--faint)">${x.preguntas || 0} preguntas · Mín. ${x.notaMin || 70}% · ${x.respuestas || 0} respuestas</div>
    </div>`;
  }).join('');
}

async function addExam() {
  const title = prompt('Título del examen:');
  if (!title) return;
  const preguntas = parseInt(prompt('Nº de preguntas:', '10') || '10', 10);
  const notaMin = parseInt(prompt('Nota mínima %:', '70') || '70', 10);
  await db.saveExam({ title, preguntas, notaMin, estado: 'Borrador', respuestas: 0, promedio: null });
  await refreshAll();
  renderExams();
}

function renderAudit() {
  const box = $('#auditStats');
  if (!box) return;
  const ev = state.events.length;
  const done = state.events.filter(e => e.estado === 'Confirmada' || e.estado === 'Programada').length;
  const files = state.files.length;
  const exams = state.exams.length;
  box.innerHTML = `
    <div class="card-grid">
      <div class="card"><div style="font-size:11px;color:var(--faint)">Eventos ${state.year}</div><div style="font-size:24px;font-weight:700">${ev}</div></div>
      <div class="card"><div style="font-size:11px;color:var(--faint)">Con estado ok</div><div style="font-size:24px;font-weight:700">${done}</div></div>
      <div class="card"><div style="font-size:11px;color:var(--faint)">Archivos en vault</div><div style="font-size:24px;font-weight:700">${files}</div></div>
      <div class="card"><div style="font-size:11px;color:var(--faint)">Exámenes</div><div style="font-size:24px;font-weight:700">${exams}</div></div>
    </div>`;
}

function exportAuditJSON() {
  const data = {
    exportedAt: new Date().toISOString(),
    year: state.year,
    notes: state.notes.map(({ body, ...rest }) => rest),
    events: state.events,
    files: state.files.map(({ blob, ...rest }) => rest),
    exams: state.exams
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `CapaciHub-auditoria-${state.year}.json`;
  a.click();
}

let gAnim, gMode = 'force', gNodes = [], gLinks = [], gVx = {}, gVy = {}, gDrag = null, gHover = null;

function buildGraphData() {
  gNodes = state.notes.map(n => ({
    id: n.id,
    label: (n.title || 'Nota').split('—')[0].trim().substring(0, 22),
    type: (n.tags || []).includes('obligatoria') ? 'cap' : (n.path || '').includes('Base') ? 'pol' : 'proc'
  }));
  state.events.forEach(e => {
    gNodes.push({ id: e.id, label: (e.title || '').substring(0, 22), type: 'cap' });
  });
  state.exams.forEach(x => {
    gNodes.push({ id: x.id, label: (x.title || '').substring(0, 22), type: 'exam' });
  });
  gLinks = [];
  state.notes.forEach(n => {
    const body = n.body || '';
    state.notes.forEach(o => {
      if (n.id === o.id) return;
      const key = (o.title || '').split('—')[0].trim();
      if (key && body.includes(key)) gLinks.push({ s: n.id, t: o.id });
    });
  });
}

function initGraph() {
  buildGraphData();
  const canvas = $('#gc');
  if (!canvas || !gNodes.length) return;
  const wrap = canvas.parentElement;
  const W = wrap.clientWidth, H = wrap.clientHeight;
  canvas.width = W * devicePixelRatio;
  canvas.height = H * devicePixelRatio;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  const ctx = canvas.getContext('2d');
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  gNodes.forEach((n, i) => {
    const a = (i / gNodes.length) * Math.PI * 2 - Math.PI / 2;
    n.x = W / 2 + Math.cos(a) * Math.min(W, H) * 0.28;
    n.y = H / 2 + Math.sin(a) * Math.min(W, H) * 0.28;
    gVx[n.id] = 0; gVy[n.id] = 0;
  });
  const cols = { cap: '#a88bff', proc: '#68cd86', exam: '#e0a050', pol: '#c9a227' };
  function pos(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  function hit(x, y) {
    return gNodes.find(n => Math.hypot(n.x - x, n.y - y) < 14) || null;
  }
  canvas.onmousedown = e => { gDrag = hit(...Object.values(pos(e))); };
  canvas.onmousemove = e => {
    const p = pos(e);
    if (gDrag) { gDrag.x = p.x; gDrag.y = p.y; gVx[gDrag.id] = 0; gVy[gDrag.id] = 0; }
    gHover = hit(p.x, p.y);
    const tip = $('#gTip');
    if (gHover) {
      tip.classList.add('on');
      $('#gT').textContent = gHover.label;
      $('#gD').textContent = gHover.type;
    } else tip.classList.remove('on');
  };
  canvas.onmouseup = () => { gDrag = null; };
  canvas.onmouseleave = () => { gDrag = null; gHover = null; };
  if (gAnim) cancelAnimationFrame(gAnim);
  function tick() {
    if (gMode === 'force') {
      for (let i = 0; i < gNodes.length; i++) {
        for (let j = i + 1; j < gNodes.length; j++) {
          const a = gNodes[i], b = gNodes[j];
          let dx = b.x - a.x, dy = b.y - a.y;
          let d = Math.hypot(dx, dy) || 1;
          const f = 5000 / (d * d);
          dx /= d; dy /= d;
          if (a !== gDrag) { gVx[a.id] -= f * dx; gVy[a.id] -= f * dy; }
          if (b !== gDrag) { gVx[b.id] += f * dx; gVy[b.id] += f * dy; }
        }
      }
      gLinks.forEach(l => {
        const a = gNodes.find(n => n.id === l.s);
        const b = gNodes.find(n => n.id === l.t);
        if (!a || !b) return;
        let dx = b.x - a.x, dy = b.y - a.y;
        let d = Math.hypot(dx, dy) || 1;
        const f = (d - 100) * 0.03;
        dx /= d; dy /= d;
        if (a !== gDrag) { gVx[a.id] += f * dx; gVy[a.id] += f * dy; }
        if (b !== gDrag) { gVx[b.id] -= f * dx; gVy[b.id] -= f * dy; }
      });
      gNodes.forEach(n => {
        if (n === gDrag) return;
        gVx[n.id] += (W / 2 - n.x) * 0.004;
        gVy[n.id] += (H / 2 - n.y) * 0.004;
        gVx[n.id] *= 0.86; gVy[n.id] *= 0.86;
        n.x = Math.max(20, Math.min(W - 20, n.x + gVx[n.id]));
        n.y = Math.max(20, Math.min(H - 20, n.y + gVy[n.id]));
      });
    }
    ctx.clearRect(0, 0, W, H);
    gLinks.forEach(l => {
      const a = gNodes.find(n => n.id === l.s);
      const b = gNodes.find(n => n.id === l.t);
      if (!a || !b) return;
      const hl = gHover && (gHover.id === l.s || gHover.id === l.t);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = hl ? 'rgba(168,139,255,.5)' : 'rgba(255,255,255,.08)';
      ctx.lineWidth = hl ? 1.5 : 1;
      ctx.stroke();
    });
    gNodes.forEach(n => {
      const r = (gHover === n || gDrag === n) ? 10 : 7;
      const c = cols[n.type] || '#aaa';
      ctx.beginPath(); ctx.arc(n.x, n.y, r + 4, 0, Math.PI * 2); ctx.fillStyle = c + '20'; ctx.fill();
      ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2); ctx.fillStyle = c; ctx.fill();
      ctx.font = '500 11px Inter,sans-serif'; ctx.fillStyle = '#b0b0b0'; ctx.textAlign = 'center';
      ctx.fillText(n.label, n.x, n.y + r + 12);
    });
    gAnim = requestAnimationFrame(tick);
  }
  tick();
}

function bindUI() {
  $('#r-files')?.addEventListener('click', () => showView('vault'));
  $('#r-graph')?.addEventListener('click', () => showView('graph'));
  $('#r-cal')?.addEventListener('click', () => showView('cronograma'));
  $('#r-files2')?.addEventListener('click', () => showView('files'));
  $('#r-exam')?.addEventListener('click', () => showView('examenes'));
  $('#r-audit')?.addEventListener('click', () => showView('auditoria'));
  $('#r-search')?.addEventListener('click', openSearch);
  $('#btnNewNote')?.addEventListener('click', createNote);
  $('#btnEditNote')?.addEventListener('click', saveCurrentNoteBody);
  $('#btnAddEvent')?.addEventListener('click', addEvent);
  $('#btnDupYear')?.addEventListener('click', duplicateYear);
  $('#yearSelect')?.addEventListener('change', e => changeYear(e.target.value));
  $('#btnAddExam')?.addEventListener('click', addExam);
  $('#btnExportAudit')?.addEventListener('click', exportAuditJSON);
  $('#btnNewFolder')?.addEventListener('click', newFolder);
  const fileInput = $('#fileInput');
  $('#btnUpload')?.addEventListener('click', () => fileInput?.click());
  fileInput?.addEventListener('change', () => {
    if (fileInput.files?.length) uploadFiles(fileInput.files);
    fileInput.value = '';
  });
  const drop = $('#fileDrop');
  if (drop) {
    drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('drag'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('drag'));
    drop.addEventListener('drop', e => {
      e.preventDefault();
      drop.classList.remove('drag');
      if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files);
    });
  }
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') { e.preventDefault(); openSearch(); }
    if (e.key === 'Escape') closeSearch();
  });
}

function openSearch() {
  $('#sModal')?.classList.add('on');
  const inp = $('#sInput');
  if (inp) { inp.value = ''; inp.focus(); doSearch(''); }
}
function closeSearch() { $('#sModal')?.classList.remove('on'); }
function doSearch(q) {
  const res = $('#sRes');
  if (!res) return;
  const ql = q.toLowerCase();
  const hits = state.notes.filter(n =>
    !q || (n.title || '').toLowerCase().includes(ql) || (n.path || '').toLowerCase().includes(ql) || (n.body || '').toLowerCase().includes(ql)
  );
  res.innerHTML = hits.map(n =>
    `<div class="sitem" data-id="${n.id}"><span>📝</span><div><div>${esc(n.title)}</div><div class="path">${esc(n.path || '')}</div></div></div>`
  ).join('') || '<div class="sitem">Sin resultados</div>';
  res.querySelectorAll('[data-id]').forEach(el => {
    el.onclick = () => { openNote(el.dataset.id); closeSearch(); };
  });
}

window.closeSearch = closeSearch;
window.doSearch = doSearch;
window.setGraphMode = (m) => { gMode = m; $$('.gctrl button').forEach(b => b.classList.toggle('on', b.dataset.mode === m)); };

boot().catch(err => {
  console.error(err);
  document.body.insertAdjacentHTML('afterbegin',
    `<div style="background:#5c1a1a;color:#fff;padding:10px;font-size:13px">Error al iniciar CapaciHub: ${esc(err.message)}</div>`);
});
