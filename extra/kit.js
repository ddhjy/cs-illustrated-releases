// Authoring kit for the extra lessons.
//
// The site's own lessons are English objects plus a per-language dictionary keyed by the
// exact English string. L()/LL() keep that contract while letting a lesson be written
// with both languages side by side: they return the English text and record the
// Simplified Chinese one in `zh`.

export const zh = Object.create(null);
export const conflicts = [];

// The site strips these markers before looking a line up (changes: + ~ −, panel lines: = ! #).
const PREFIX = /^([+~−-]|[=!#]) /;

function put(en, cn) {
  if (!en.trim()) return;
  if (en in zh && zh[en] !== cn) conflicts.push({ en, a: zh[en], b: cn });
  zh[en] = cn;
}

export function L(en, cn) {
  if (PREFIX.test(en)) put(en.slice(2), PREFIX.test(cn) ? cn.slice(2) : cn);
  else put(en, cn);
  return en;
}

// Multi-line block labels are translated as one "\n"-joined key.
export function LL(en, cn) {
  put(en.join('\n'), cn.join('\n'));
  return en;
}

export const block = (x, y, o = {}) => ({ type: 'block', x, y, color: 'blue', glyph: 'box', ...o });
export const store = (x, y, o = {}) => ({ type: 'db', x, y, ...o });
export const crowd = (rect, count, label, o = {}) => ({ type: 'crowd', ...rect, count, label, ...o });
export const ghost = (x, y, s, h, label) => ({ type: 'ghost', x, y, s, h, label });
export const device = (x, y, o = {}) => ({ type: 'device', x, y, ...o });
export const zone = (rect, label, o = {}) => ({ type: 'zone', ...rect, label, ...o });
export const backlog = (x, y, n, dir = [0, -1], o = {}) => ({ type: 'queue', x, y, n, dir, ...o });
export const panel = (title, lines, icon = 'sparkles', o = {}) => ({ type: 'panel', x: 0, y: 0, z: 0, title, lines, icon, ...o });
export const link = (from, to, o = {}) => ({ from, to, pts: [from, to], heads: 'end', ...o });
export const path = (from, to, pts, o = {}) => ({ from, to, pts, heads: 'end', ...o });
export const tag = (text, tone, icon) => ({ text, ...(tone ? { tone } : {}), ...(icon ? { icon } : {}) });

const pick = (map) => (v) => map[v] || 'none';

// A string-valued chip. `levels` maps the English value to good | warn | bad.
export const chip = (label, icon, levels = {}) => ({ label, icon, fmt: (v) => v, level: pick(levels) });

// A numeric chip; `grade` turns the number into good | warn | bad.
export const count = (label, icon, grade) => ({
  label,
  icon,
  fmt: (v) => (typeof v === 'number' ? String(Math.round(v)) : v),
  level: (v) => (typeof v === 'number' && grade ? grade(v) : 'none'),
});
