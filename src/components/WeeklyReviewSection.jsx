import { useState } from 'react'
import { C, MOODS, d2s } from '../constants'

const today = new Date()
const todayS = d2s(today)
const MOOD_EMOJIS = ['😊', '🙂', '😐', '😟', '😢']

function getWeekOf(ds) {
  const d = new Date(ds.replace(/-/g, '/'))
  const dow = d.getDay()
  const daysSinceMon = dow === 0 ? 6 : dow - 1
  const mon = new Date(d)
  mon.setDate(d.getDate() - daysSinceMon)
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  return { start: d2s(mon), end: d2s(sun) }
}

function getLastWeek() {
  const d = new Date(today)
  d.setDate(d.getDate() - 7)
  return getWeekOf(d2s(d))
}

function computeStats(rec, weekStart, weekEnd) {
  const dates = []
  const s = new Date(weekStart.replace(/-/g, '/'))
  const e = new Date(weekEnd.replace(/-/g, '/'))
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    dates.push(d2s(new Date(d)))
  }
  const moods = dates.map(ds => rec[ds]?.mood).filter(v => v !== undefined && v !== null)
  const avgMood = moods.length > 0
    ? Math.round(moods.reduce((a, b) => a + b, 0) / moods.length * 10) / 10
    : null
  const exerciseDays = dates.filter(ds => rec[ds]?.exercise).length
  const weights = dates.map(ds => parseFloat(rec[ds]?.weight)).filter(v => !isNaN(v))
  const weightChange = weights.length >= 2
    ? Math.round((weights[weights.length - 1] - weights[0]) * 10) / 10
    : null
  return { avgMood, exerciseDays, weightChange }
}

function formatWeek(start, end) {
  const s = new Date(start.replace(/-/g, '/'))
  const e = new Date(end.replace(/-/g, '/'))
  return `${s.getMonth() + 1}/${s.getDate()}〜${e.getMonth() + 1}/${e.getDate()}`
}

function MoodVal({ avg }) {
  if (avg === null || avg === undefined) return <span style={{ color: C.inkL }}>—</span>
  const idx = Math.min(4, Math.round(avg))
  return <span>{MOOD_EMOJIS[idx]} {avg.toFixed(1)}</span>
}

function StatsRow({ stats, style }) {
  return (
    <div className="weekly-stats-row" style={style}>
      <div className="weekly-stat">
        <div className="weekly-stat-label">気分平均</div>
        <div className="weekly-stat-val"><MoodVal avg={stats?.avgMood ?? null} /></div>
      </div>
      <div className="weekly-stat">
        <div className="weekly-stat-label">運動</div>
        <div className="weekly-stat-val">{stats?.exerciseDays ?? 0}日</div>
      </div>
      <div className="weekly-stat">
        <div className="weekly-stat-label">体重変化</div>
        <div className="weekly-stat-val">
          {stats?.weightChange != null
            ? <span style={{ color: stats.weightChange <= 0 ? C.sage : C.rose }}>
                {stats.weightChange >= 0 ? '+' : ''}{stats.weightChange}kg
              </span>
            : <span style={{ color: C.inkL }}>—</span>
          }
        </div>
      </div>
    </div>
  )
}

export default function WeeklyReviewSection({ rec, weeklyReviews, updateWeeklyReviews }) {
  const lastWeek = getLastWeek()
  const isMonday = today.getDay() === 1
  const existing = weeklyReviews.find(r => r.weekStart === lastWeek.start)
  const stats = computeStats(rec, lastWeek.start, lastWeek.end)

  const [formOpen, setFormOpen]       = useState(false)
  const [formText, setFormText]       = useState('')
  const [formGood, setFormGood]       = useState('')
  const [formReflect, setFormReflect] = useState('')
  const [openPast, setOpenPast]       = useState(new Set())

  const togglePast = (weekStart) => {
    setOpenPast(prev => {
      const next = new Set(prev)
      next.has(weekStart) ? next.delete(weekStart) : next.add(weekStart)
      return next
    })
  }

  const openForm = () => {
    setFormText(existing?.text || '')
    setFormGood(existing?.good || '')
    setFormReflect(existing?.reflect || '')
    setFormOpen(true)
  }

  const saveReview = () => {
    const review = {
      id: existing?.id || Date.now().toString(),
      weekStart: lastWeek.start,
      weekEnd:   lastWeek.end,
      stats,
      text:    formText.trim(),
      good:    formGood.trim(),
      reflect: formReflect.trim(),
      createdAt: new Date().toISOString(),
    }
    if (existing) {
      updateWeeklyReviews(weeklyReviews.map(r => r.weekStart === lastWeek.start ? review : r))
    } else {
      updateWeeklyReviews([review, ...weeklyReviews])
    }
    setFormOpen(false)
  }

  const pastReviews = weeklyReviews
    .filter(r => r.weekStart !== lastWeek.start)
    .sort((a, b) => b.weekStart.localeCompare(a.weekStart))

  return (
    <div className="ruled" style={{ paddingBottom: 20 }}>
      <div className="sec-label">WEEKLY REVIEW</div>

      {/* 先週カード */}
      <div className="weekly-card">
        <div className="weekly-card-header">
          <span className="weekly-week-range">{formatWeek(lastWeek.start, lastWeek.end)}</span>
          {isMonday && (
            <span className="weekly-monday-badge">振り返りタイム ✦</span>
          )}
        </div>

        <StatsRow stats={stats} />

        {formOpen ? (
          <div className="weekly-form">
            <div className="weekly-form-label">今週はどんな週でしたか？</div>
            <textarea
              className="weekly-textarea"
              rows={3}
              value={formText}
              onChange={e => setFormText(e.target.value)}
              placeholder="先週全体を振り返って…"
              autoFocus
            />
            <div className="weekly-form-label">よかったこと</div>
            <textarea
              className="weekly-textarea"
              rows={2}
              value={formGood}
              onChange={e => setFormGood(e.target.value)}
              placeholder="うれしかったこと、うまくいったこと…"
            />
            <div className="weekly-form-label">反省点</div>
            <textarea
              className="weekly-textarea"
              rows={2}
              value={formReflect}
              onChange={e => setFormReflect(e.target.value)}
              placeholder="改善したいこと、次週に活かしたいこと…"
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button className="note-edit-cancel-btn" onClick={() => setFormOpen(false)}>キャンセル</button>
              <button className="note-add-btn" onClick={saveReview}>保存</button>
            </div>
          </div>
        ) : existing ? (
          <div className="weekly-existing">
            {existing.text && <p className="weekly-review-text">{existing.text}</p>}
            {existing.good && (
              <div className="weekly-review-item">
                <span className="weekly-review-item-label">✓ よかったこと</span>
                <p className="weekly-review-text">{existing.good}</p>
              </div>
            )}
            {existing.reflect && (
              <div className="weekly-review-item">
                <span className="weekly-review-item-label">△ 反省点</span>
                <p className="weekly-review-text">{existing.reflect}</p>
              </div>
            )}
            <button className="weekly-edit-btn" onClick={openForm}>編集</button>
          </div>
        ) : (
          <button className="weekly-write-btn" onClick={openForm}>
            + 先週の振り返りを書く
          </button>
        )}
      </div>

      {/* 過去の振り返り（個別折りたたみ）*/}
      {pastReviews.length > 0 && (
        <div style={{ marginTop: 8 }}>
          {pastReviews.map(r => {
            const isOpen = openPast.has(r.weekStart)
            return (
              <div key={r.weekStart} className="weekly-past-card">
                <button className="weekly-past-header" onClick={() => togglePast(r.weekStart)}>
                  <span className="weekly-week-range">{formatWeek(r.weekStart, r.weekEnd)}</span>
                  <span className="weekly-past-arrow">{isOpen ? '▲' : '▼'}</span>
                </button>
                {isOpen && (
                  <div className="weekly-past-body">
                    <StatsRow stats={r.stats} style={{ marginBottom: 8 }} />
                    {r.text && <p className="weekly-review-text">{r.text}</p>}
                    {r.good && (
                      <div className="weekly-review-item">
                        <span className="weekly-review-item-label">✓ よかったこと</span>
                        <p className="weekly-review-text">{r.good}</p>
                      </div>
                    )}
                    {r.reflect && (
                      <div className="weekly-review-item">
                        <span className="weekly-review-item-label">△ 反省点</span>
                        <p className="weekly-review-text">{r.reflect}</p>
                      </div>
                    )}
                    {!r.text && !r.good && !r.reflect && (
                      <p style={{ color: C.inkL, fontSize: 12, margin: 0 }}>振り返りは未記入です</p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
