// Page-shell additions the patched bundle calls into: subject folders in the course tree,
// a breadcrumb with hover menus, and draggable column gaps on the desktop layout.

import { L } from './kit.js';

export const defaultSubject = L('System Design', '系统设计');
const RESIZE_HINT = L('Drag to resize, double-click to reset', '拖动调整宽度，双击复位');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const read = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};
const write = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};

// ---- course list: subject → module → lesson ----

// Runs once on the bundle's module list, before anything reads it.
export function prepare(mods) {
  mods.forEach((m, i) => {
    if (!m.subject) Object.assign(m, { subject: defaultSubject, subjectId: 'system-design' });
    m.groupStart = i === 0 || mods[i - 1].subjectId !== m.subjectId;
  });
  return 1;
}

const subjectsOf = (mods) => {
  const out = [];
  for (const m of mods) {
    const last = out[out.length - 1];
    if (last && last.id === m.subjectId) last.mods.push(m);
    else out.push({ id: m.subjectId, title: m.subject, mods: [m] });
  }
  return out;
};

const openSubjects = new Set(read('psd:subjects', []));
let revealedFor = null;

export function tree(mods, O, folder, icon, renderModule) {
  return subjectsOf(mods).map(
    (g) => `
    <section class="subj ${openSubjects.has(g.id) ? 'is-open' : ''}" data-subj="${g.id}">
      <button class="subj__head" type="button" data-subj="${g.id}" aria-expanded="${openSubjects.has(g.id)}">
        ${icon('chevronRight', { size: 15, stroke: 2.2, cls: 'subj__chev' })}
        ${folder('ink')}
        <span class="subj__title" title="${esc(O(g.title))}">${O(g.title)}</span>
        <span class="subj__count"></span>
      </button>
      <div class="subj__body"><div class="subj__clip"><div class="subj__mods">${g.mods.map(renderModule).join('')}</div></div></div>
    </section>`,
  );
}

function setOpen(el, open) {
  el.classList.toggle('is-open', open);
  el.querySelector('.subj__head').setAttribute('aria-expanded', open);
  if (open) openSubjects.add(el.dataset.subj);
  else openSubjects.delete(el.dataset.subj);
  write('psd:subjects', [...openSubjects]);
}

// Called at the start of every sidebar refresh.
export function syncTree(state) {
  for (const el of document.querySelectorAll('#course .subj')) {
    const lessons = [...el.querySelectorAll('.lesson[data-lesson]')];
    const done = lessons.filter((l) => state.done.has(l.dataset.lesson)).length;
    el.querySelector('.subj__count').textContent = `${done}/${lessons.length}`;
    if (state.lessonId !== revealedFor && el.querySelector(`.lesson[data-lesson="${state.lessonId}"]`) && !el.classList.contains('is-open')) setOpen(el, true);
  }
  revealedFor = state.lessonId;
}

// ---- breadcrumb ----

export function crumb(entry, mods, registry, O, icon) {
  const ready = (id) => !!registry[id];
  const firstReady = (list) => list.flatMap((m) => m.lessons).find((l) => ready(l.id));
  const chev = icon('chevronDown', { size: 12, stroke: 2.4, cls: 'crumb__chev' });
  const item = (href, label, meta, current) =>
    href
      ? `<a class="crumb__item ${current ? 'is-current' : ''}" href="${href}" role="menuitem"><b>${label}</b>${meta ? `<em>${meta}</em>` : ''}</a>`
      : `<div class="crumb__item is-soon"><b>${label}</b><em>${O('Coming soon')}</em></div>`;
  const segment = (href, label, items) => `
    <div class="crumb__seg" tabindex="-1">
      ${href ? `<a class="crumb__link" href="${href}">${label}</a>` : `<button class="crumb__link" type="button">${label}</button>`}${chev}
      <div class="crumb__menu" role="menu"><div class="crumb__box">${items.join('')}</div></div>
    </div>`;

  const mod = entry.module;
  const subjects = subjectsOf(mods);
  const subject = subjects.find((g) => g.id === mod.subjectId);
  const count = (list) => list.reduce((n, m) => n + m.lessons.length, 0);
  const href = (lesson) => (lesson ? `#/${lesson.id}/1` : null);

  const subjectSeg = segment(
    href(firstReady(subject.mods)),
    O(subject.title),
    subjects.map((g) => item(href(firstReady(g.mods)), O(g.title), O('{n} lessons', { n: count(g.mods) }), g.id === subject.id)),
  );
  const moduleSeg = segment(
    href(firstReady([mod])),
    `${mod.num}. ${O(mod.title)}`,
    subject.mods.map((m) => item(href(firstReady([m])), `${m.num}. ${O(m.title)}`, O('{n} lessons', { n: m.lessons.length }), m === mod)),
  );
  const lessonSeg = segment(
    null,
    O('Lesson {n} of {total}', { n: entry.index, total: entry.of }),
    mod.lessons.map((l, i) => item(ready(l.id) ? href(l) : null, `${i + 1}. ${O(l.title)}`, '', l.id === entry.id)),
  );
  return `<div class="crumb">${subjectSeg}<span>·</span>${moduleSeg}<span>/</span>${lessonSeg}</div>`;
}

// ---- resizable columns ----

const COLUMNS = {
  side: { initial: 296, min: 220, max: 440 },
  rail: { initial: 376, min: 300, max: 560 },
};
const MIN_SHEET = 520;

export function mount(O) {
  const root = document.documentElement;
  const win = document.querySelector('.window');
  const body = document.querySelector('.body');
  const widths = { side: COLUMNS.side.initial, rail: COLUMNS.rail.initial, ...read('psd:columns', {}) };

  document.getElementById('course').addEventListener('click', (e) => {
    const head = e.target.closest('.subj__head');
    if (!head) return;
    const el = head.closest('.subj');
    setOpen(el, !el.classList.contains('is-open'));
  });

  let queued = false;
  const refit = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      window.dispatchEvent(new Event('resize'));
    });
  };
  const apply = () => {
    root.style.setProperty('--psd-side', `${widths.side}px`);
    root.style.setProperty('--psd-rail', `${widths.rail}px`);
  };
  const clamp = (which, v) => {
    const { min, max } = COLUMNS[which];
    const other = which === 'side' ? widths.rail : widths.side;
    return Math.round(Math.max(min, Math.min(max, body.clientWidth - other - MIN_SHEET, v)));
  };
  apply();

  for (const which of Object.keys(COLUMNS)) {
    const handle = document.createElement('div');
    handle.className = `psd-resizer psd-resizer--${which}`;
    handle.setAttribute('role', 'separator');
    handle.setAttribute('aria-orientation', 'vertical');
    handle.addEventListener('pointerenter', () => (handle.title = O(RESIZE_HINT)));
    handle.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      handle.setPointerCapture(e.pointerId);
      const zoom = parseFloat(win.style.zoom) || 1;
      const startX = e.clientX;
      const start = widths[which];
      root.classList.add('is-resizing');
      const move = (ev) => {
        const dx = (ev.clientX - startX) / zoom;
        widths[which] = clamp(which, which === 'side' ? start + dx : start - dx);
        apply();
        refit();
      };
      const up = () => {
        root.classList.remove('is-resizing');
        handle.removeEventListener('pointermove', move);
        handle.removeEventListener('pointerup', up);
        handle.removeEventListener('pointercancel', up);
        write('psd:columns', widths);
      };
      handle.addEventListener('pointermove', move);
      handle.addEventListener('pointerup', up);
      handle.addEventListener('pointercancel', up);
    });
    handle.addEventListener('dblclick', () => {
      widths[which] = COLUMNS[which].initial;
      apply();
      refit();
      write('psd:columns', widths);
    });
    body.appendChild(handle);
  }
  refit();
}
