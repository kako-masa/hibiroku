import { useState } from 'react'
import { C, d2s, pad } from '../constants'

const todayS = d2s(new Date())

// ── ユーティリティ ──────────────────────────────────────────
function getMondayStr(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const mon = new Date(d)
  mon.setDate(d.getDate() + diff)
  return d2s(mon)
}

function getWeekDates(mondayStr) {
  const mon = new Date(mondayStr + 'T00:00:00')
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon)
    d.setDate(mon.getDate() + i)
    return d2s(d)
  })
}

function getMonthDates(yearMonth) {
  const [y, m] = yearMonth.split('-').map(Number)
  const days = new Date(y, m, 0).getDate()
  return Array.from({ length: days }, (_, i) => `${yearMonth}-${pad(i + 1)}`)
}

const currentMonday = getMondayStr(todayS)
const currentYearMonth = todayS.slice(0, 7)

function calcStats(goal, rec, dates) {
  const habits = goal.habitTasks || []
  const totalPossible = habits.length * dates.length
  let totalDone = 0
  habits.forEach(task => {
    dates.forEach(d => {
      if (task.linkedTo === 'weight')    { if (rec[d]?.weight)   totalDone++ }
      else if (task.linkedTo === 'exercise') { if (rec[d]?.exercise) totalDone++ }
      else                               { if (task.dailyDone?.[d]) totalDone++ }
    })
  })
  const habitRate = totalPossible > 0 ? Math.round((totalDone / totalPossible) * 100) : null
  const weightVals = dates
    .map(d => rec[d]?.weight ? parseFloat(rec[d].weight) : null)
    .filter(v => v !== null && !isNaN(v))
  const firstWeight   = weightVals.length > 0 ? weightVals[0] : null
  const lastWeight    = weightVals.length > 1 ? weightVals[weightVals.length - 1] : null
  const weightChange  = firstWeight !== null && lastWeight !== null
    ? Math.round((lastWeight - firstWeight) * 10) / 10
    : null
  const exerciseCount = dates.filter(d => rec[d]?.exercise).length
  return { habitRate, firstWeight, lastWeight, weightChange, exerciseCount }
}

function fmtWeek(mondayStr) {
  const mon = new Date(mondayStr + 'T00:00:00')
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
  return `${mon.getMonth()+1}/${mon.getDate()} 〜 ${sun.getMonth()+1}/${sun.getDate()}`
}
function fmtMonth(ym) {
  const [y, m] = ym.split('-')
  return `${y}年${parseInt(m)}月`
}

// ── スタイル定数 ────────────────────────────────────────────
const sBtn = (color) => ({
  fontSize: 10, color,
  background: 'transparent',
  border: `1px solid ${color}`,
  borderRadius: 3, padding: '3px 8px',
  cursor: 'pointer', fontFamily: 'inherit',
  whiteSpace: 'nowrap',
})

const formBox = {
  background: '#F5F0E8',
  border: '1px solid rgba(180,162,140,0.2)',
  borderRadius: 5,
  padding: '10px',
  marginTop: 8,
}

const fLabel = { fontSize: 9, color: C.inkL, letterSpacing: 0.5, marginBottom: 3 }

const taStyle = {
  width: '100%', background: 'transparent', border: 'none',
  borderBottom: '1px solid rgba(180,162,140,0.3)',
  padding: '4px 0', fontSize: 13, color: C.ink,
  fontFamily: 'inherit', lineHeight: 1.7, resize: 'none', outline: 'none',
  boxSizing: 'border-box',
}

const numInput = {
  width: '100%', background: 'transparent', border: 'none',
  borderBottom: '1px solid rgba(180,162,140,0.3)',
  padding: '4px 0', fontSize: 16, color: C.ink,
  fontFamily: 'Georgia, serif', fontWeight: 700,
  outline: 'none', boxSizing: 'border-box',
}

const saveBtn = {
  background: C.leatherM, color: '#fff', border: 'none',
  padding: '7px 18px', fontSize: 11, borderRadius: 3,
  cursor: 'pointer', fontFamily: 'inherit', letterSpacing: 1,
  marginTop: 4,
}

// ── 統計バー ────────────────────────────────────────────────
function StatsBar({ stats }) {
  if (!stats) return null
  const boxes = []
  if (stats.habitRate !== null && stats.habitRate !== undefined) {
    boxes.push({ label: '習慣達成率', value: stats.habitRate, unit: '%' })
  }
  if (stats.weightChange !== null && stats.weightChange !== undefined) {
    boxes.push({ label: '体重変化', value: (stats.weightChange > 0 ? '+' : '') + stats.weightChange, unit: 'kg' })
  } else if (stats.firstWeight !== null && stats.firstWeight !== undefined) {
    boxes.push({ label: '体重', value: stats.firstWeight, unit: 'kg' })
  }
  boxes.push({ label: '運動', value: stats.exerciseCount ?? 0, unit: '日' })
  if (boxes.length === 0) return null
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
      {boxes.map(({ label, value, unit }) => (
        <div key={label} style={{ flex: 1, background: '#FAF7F2', borderRadius: 4, padding: '6px 4px 5px', textAlign: 'center', border: '1px solid rgba(180,162,140,0.15)' }}>
          <div style={{ fontSize: 8, color: C.inkL, marginBottom: 2 }}>{label}</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: C.ink, fontFamily: 'Georgia, serif', lineHeight: 1 }}>
            {value}<span style={{ fontSize: 9 }}>{unit}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── 振り返り履歴アイテム ────────────────────────────────────
function HistItem({ review, type, onDelete }) {
  const [exp, setExp] = useState(false)
  const label = type === 'week' ? fmtWeek(review.weekStart) : fmtMonth(review.month)
  return (
    <div style={{ border: '1px solid rgba(180,162,140,0.2)', borderRadius: 4, marginBottom: 4, overflow: 'hidden' }}>
      <button
        onClick={() => setExp(v => !v)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
      >
        <span style={{ fontSize: 11, color: C.inkM }}>{label}</span>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          {review.stats?.habitRate != null && (
            <span style={{ fontSize: 9, color: C.leather, background: '#F5EDD8', borderRadius: 3, padding: '1px 5px' }}>
              {review.stats.habitRate}%
            </span>
          )}
          <span style={{ fontSize: 9, color: C.inkL }}>{exp ? '▲' : '▼'}</span>
        </div>
      </button>
      {exp && (
        <div style={{ padding: '6px 10px 10px', borderTop: '1px solid rgba(180,162,140,0.1)' }}>
          <StatsBar stats={review.stats} />
          {type === 'week' ? (
            <>
              {review.good       && <RField label="よかったこと"     v={review.good} />}
              {review.reflection && <RField label="反省点"           v={review.reflection} />}
              {review.insight    && <RField label="気づき"           v={review.insight} />}
              {review.nextGoal   && <RField label="来週の一言目標"   v={review.nextGoal} />}
            </>
          ) : (
            <>
              {review.summary          && <RField label="今月の総括"       v={review.summary} />}
              {review.nextWeightTarget != null && <RField label="来月の目標体重" v={`${review.nextWeightTarget} kg`} />}
              {review.nextFatTarget    != null && <RField label="来月の目標体脂肪" v={`${review.nextFatTarget} %`} />}
            </>
          )}
          <button
            onClick={onDelete}
            style={{ fontSize: 10, color: C.inkL, background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0, marginTop: 6 }}
          >
            削除
          </button>
        </div>
      )}
    </div>
  )
}

function RField({ label, v }) {
  return (
    <div style={{ marginBottom: 7 }}>
      <div style={{ fontSize: 8, color: C.inkL, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 12, color: C.inkM, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{v}</div>
    </div>
  )
}

// ── 週次振り返り ────────────────────────────────────────────
const WEEK_BLANK = { good: '', reflection: '', insight: '', nextGoal: '' }

function WeeklyReview({ goal, rec, onUpdate }) {
  const reviews = goal.weeklyReviews || []
  const [formOpen, setFormOpen] = useState(false)
  const [histOpen, setHistOpen] = useState(false)
  const [form, setForm] = useState(WEEK_BLANK)

  const weekDates = getWeekDates(currentMonday)
  const stats     = calcStats(goal, rec, weekDates)
  const existing  = reviews.find(r => r.weekStart === currentMonday)

  const openForm = () => {
    if (!formOpen) {
      setForm(existing
        ? { good: existing.good || '', reflection: existing.reflection || '', insight: existing.insight || '', nextGoal: existing.nextGoal || '' }
        : WEEK_BLANK
      )
    }
    setFormOpen(v => !v)
  }

  const save = () => {
    const entry = {
      id: existing?.id ?? Date.now(),
      weekStart: currentMonday,
      weekEnd: weekDates[6],
      stats, ...form,
      createdAt: todayS,
    }
    onUpdate({ ...goal, weeklyReviews: [entry, ...reviews.filter(r => r.weekStart !== currentMonday)] })
    setFormOpen(false)
  }

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: C.leatherM }}>週次振り返り</span>
        <div style={{ display: 'flex', gap: 5 }}>
          {reviews.length > 0 && (
            <button onClick={() => setHistOpen(v => !v)} style={sBtn(C.inkL)}>
              過去 {reviews.length}件 {histOpen ? '▲' : '▼'}
            </button>
          )}
          <button onClick={openForm} style={sBtn(C.leather)}>
            {formOpen ? '閉じる' : existing ? '今週を更新' : '今週の振り返りを書く'}
          </button>
        </div>
      </div>

      {formOpen && (
        <div style={formBox}>
          <div style={{ fontSize: 10, color: C.inkL, marginBottom: 8 }}>{fmtWeek(currentMonday)}</div>
          <StatsBar stats={stats} />
          {[
            { key: 'good',       label: 'よかったこと',   rows: 3 },
            { key: 'reflection', label: '反省点',         rows: 3 },
            { key: 'insight',    label: '気づき',         rows: 2 },
            { key: 'nextGoal',   label: '来週の一言目標', rows: 2 },
          ].map(({ key, label, rows }) => (
            <div key={key} style={{ marginBottom: 8 }}>
              <div style={fLabel}>{label}</div>
              <textarea
                style={taStyle} rows={rows}
                value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={`${label}…`}
              />
            </div>
          ))}
          <button style={saveBtn} onClick={save}>保存する</button>
        </div>
      )}

      {histOpen && (
        <div style={{ marginTop: 6 }}>
          {[...reviews].sort((a, b) => b.weekStart.localeCompare(a.weekStart)).map(r => (
            <HistItem key={r.id} review={r} type="week"
              onDelete={() => onUpdate({ ...goal, weeklyReviews: reviews.filter(rv => rv.id !== r.id) })} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── 月次振り返り ────────────────────────────────────────────
const MONTH_BLANK = { summary: '', nextWeightTarget: '', nextFatTarget: '' }

function MonthlyReview({ goal, rec, onUpdate }) {
  const reviews = goal.monthlyReviews || []
  const [formOpen, setFormOpen] = useState(false)
  const [histOpen, setHistOpen] = useState(false)
  const [form, setForm] = useState(MONTH_BLANK)

  const stats    = calcStats(goal, rec, getMonthDates(currentYearMonth))
  const existing = reviews.find(r => r.month === currentYearMonth)

  const openForm = () => {
    if (!formOpen) {
      setForm(existing
        ? {
            summary:          existing.summary || '',
            nextWeightTarget: existing.nextWeightTarget != null ? String(existing.nextWeightTarget) : '',
            nextFatTarget:    existing.nextFatTarget    != null ? String(existing.nextFatTarget)    : '',
          }
        : MONTH_BLANK
      )
    }
    setFormOpen(v => !v)
  }

  const save = () => {
    const entry = {
      id: existing?.id ?? Date.now(),
      month: currentYearMonth,
      stats,
      summary:          form.summary,
      nextWeightTarget: form.nextWeightTarget ? parseFloat(form.nextWeightTarget) : null,
      nextFatTarget:    form.nextFatTarget    ? parseFloat(form.nextFatTarget)    : null,
      createdAt: todayS,
    }
    onUpdate({ ...goal, monthlyReviews: [entry, ...reviews.filter(r => r.month !== currentYearMonth)] })
    setFormOpen(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: C.leatherM }}>月次振り返り</span>
        <div style={{ display: 'flex', gap: 5 }}>
          {reviews.length > 0 && (
            <button onClick={() => setHistOpen(v => !v)} style={sBtn(C.inkL)}>
              過去 {reviews.length}件 {histOpen ? '▲' : '▼'}
            </button>
          )}
          <button onClick={openForm} style={sBtn(C.leather)}>
            {formOpen ? '閉じる' : existing ? '今月を更新' : '今月の振り返りを書く'}
          </button>
        </div>
      </div>

      {formOpen && (
        <div style={formBox}>
          <div style={{ fontSize: 10, color: C.inkL, marginBottom: 8 }}>{fmtMonth(currentYearMonth)}</div>
          <StatsBar stats={stats} />
          <div style={{ marginBottom: 8 }}>
            <div style={fLabel}>今月の総括</div>
            <textarea
              style={taStyle} rows={4}
              value={form.summary}
              onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
              placeholder="今月を振り返って…"
            />
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={fLabel}>来月の目標体重 (kg)</div>
              <input type="number" step="0.1" style={numInput}
                value={form.nextWeightTarget}
                onChange={e => setForm(f => ({ ...f, nextWeightTarget: e.target.value }))}
                placeholder="55.0"
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={fLabel}>来月の目標体脂肪 (%)</div>
              <input type="number" step="0.1" style={numInput}
                value={form.nextFatTarget}
                onChange={e => setForm(f => ({ ...f, nextFatTarget: e.target.value }))}
                placeholder="22.0"
              />
            </div>
          </div>
          <button style={saveBtn} onClick={save}>保存する</button>
        </div>
      )}

      {histOpen && (
        <div style={{ marginTop: 6 }}>
          {[...reviews].sort((a, b) => b.month.localeCompare(a.month)).map(r => (
            <HistItem key={r.id} review={r} type="month"
              onDelete={() => onUpdate({ ...goal, monthlyReviews: reviews.filter(rv => rv.id !== r.id) })} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── 振り返りセクション（GoalCardに埋め込む） ───────────────
export function ReviewSection({ goal, rec, onUpdate }) {
  const [open, setOpen] = useState(false)
  const weeklyCount  = (goal.weeklyReviews  || []).length
  const monthlyCount = (goal.monthlyReviews || []).length

  return (
    <div style={{
      background: '#FAF7F2',
      borderRadius: 5,
      border: '1px solid rgba(107,79,58,0.15)',
      marginBottom: 10,
      overflow: 'hidden',
    }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '9px 10px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: C.leather }}>振り返り</span>
          {(weeklyCount > 0 || monthlyCount > 0) && (
            <span style={{ fontSize: 9, color: C.inkL }}>週 {weeklyCount} · 月 {monthlyCount}</span>
          )}
        </div>
        <span style={{ fontSize: 9, color: C.inkL }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{ padding: '0 10px 10px', borderTop: '1px solid rgba(180,162,140,0.2)' }}>
          <div style={{ paddingTop: 10 }}>
            <WeeklyReview goal={goal} rec={rec} onUpdate={onUpdate} />
          </div>
          <div style={{ borderTop: '1px solid rgba(180,162,140,0.15)', paddingTop: 10 }}>
            <MonthlyReview goal={goal} rec={rec} onUpdate={onUpdate} />
          </div>
        </div>
      )}
    </div>
  )
}
