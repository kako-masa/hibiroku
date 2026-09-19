// ── カラーパレット ──
export const C = {
  leather:  '#6B4F3A',
  leatherM: '#8B6650',
  ink:      '#2C2420',
  inkM:     '#5C4A3E',
  inkL:     '#9C8070',
  rule:     'rgba(180,162,140,0.3)',
  cream:    '#EDE7DC',
  sage:     '#7A9080',
  rose:     '#C4897A',
  slate:    '#6E7D8A',
  mauve:    '#A08090',
  gold:     '#B89060',
  ivory:    '#FFFDF9',
}

// ── シフト定義 ──
export const SHIFTS = {
  dayShift:       { l: '日勤',   m: 'ー',  c: '#4A8FA8', bg: '#DCEDF2' },
  longDay:        { l: '長日勤', m: '-2', c: '#A8842A', bg: '#CFE2E8' },
  lateStart:      { l: '遅出',   m: 'オ2', c: C.mauve,   bg: '#F0E8EE' },
  earlySemiNight: { l: '早準夜', m: '△',  c: '#A8842A', bg: '#EAE1F0' },
  semiNight:      { l: '準夜',   m: '▲',  c: '#6B4A8A', bg: '#E3D8ED' },
  midnight:       { l: '深夜',   m: '●',  c: '#A8842A', bg: '#F2E8CC' },
  dayOff:         { l: '公休',   m: '公',  c: '#B3564A', bg: '#F5DFDA' },
  paidLeave:      { l: '有休',   m: '有',  c: '#9C4A3F',  bg: '#F2D6D0' },
}

// ── 気分 ──
export const MOODS = ['😊 よい日', '🙂 まあまあ', '😐 ふつう', '😔 あまり…', '😞 つらい']

// ── タブ定義 ──
export const TABS = [
  { k: 'daily',    l: '日記',   i: '✦' },
  { k: 'shift',    l: 'シフト', i: '☀' },
  { k: 'goal',     l: '目標',   i: '◎' },
  { k: 'history',  l: '履歴',   i: '◷' },
  { k: 'graph',    l: '記録',   i: '∿' },
  { k: 'learning', l: '学び',   i: '◬' },
]

// ── 曜日 ──
export const WJ = ['日', '月', '火', '水', '木', '金', '土']
export const WE = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// ── ユーティリティ ──
export const pad = n => String(n).padStart(2, '0')
export const d2s = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export function lsGet(key, fallback) {
  try {
    const v = localStorage.getItem(key)
    return v ? JSON.parse(v) : fallback
  } catch {
    return fallback
  }
}

// debounce保存
const saveTimers = {}
export function save(key, value) {
  clearTimeout(saveTimers[key])
  saveTimers[key] = setTimeout(() => {
    try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
  }, 500)
}

// ── タグカラー ──
export const TAG_COLORS = [
  { bg: '#F5EDD8', text: '#6B4F3A', border: '#C4A882' },
  { bg: '#E4EDE8', text: '#4A7060', border: '#8AB0A0' },
  { bg: '#E4EAF0', text: '#4A5C6A', border: '#8AAABB' },
  { bg: '#F0E8EE', text: '#7A5870', border: '#B898AA' },
  { bg: '#F5E8E4', text: '#A06050', border: '#D09880' },
  { bg: '#F0EDD8', text: '#806838', border: '#C0A870' },
]

export function tagColor(tag) {
  let h = 0
  for (let i = 0; i < tag.length; i++) h = (h * 31 + tag.charCodeAt(i)) & 0xffff
  return TAG_COLORS[h % TAG_COLORS.length]
}
