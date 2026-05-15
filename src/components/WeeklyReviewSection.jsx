import { useState } from 'react'
import { C, MOODS, d2s } from '../constants'

const today = new Date()
const MOOD_EMOJIS = ['😊', '🙂', '😐', '😟', '😢']

function getLastWeek() {
  const d = new Date(today)
  const dow = d.getDay()
  const daysSinceMon = dow === 0 ? 6 : dow - 1
  const thisMon = new Date(d)
  thisMon.setDate(d.getDate() - daysSinceMon)
  const lastMon = new Date(thisMon)
  lastMon.setDate(thisMon.getDate() - 7)
  const lastSun = new Date(thisMon)
  lastSun.setDate(thisMon.getDate() - 1)
  return { start: d2s(lastMon), end: d2s(lastSun) }
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
  return `${s.getMonth() + 1}/${s.getDate()}（月）〜 ${e.getMonth() + 1}/${e.getDate()}（日）`
}

function MoodVal({ avg }) {
  if (avg === null) return <span style={{ color: C.inkL }}>—</span>
  const idx = Math.min(4, Math.round(avg))
  return <span>{MOOD_EMOJIS[idx]} {avg.toFixed(1)}</span>
}

export default function WeeklyReviewSection({ rec, weeklyReviews, updateWeeklyReviews }) {
  const lastWeek = getLastWeek()
  const isMonday = today.getDay() === 1
  const existing = weeklyReviews.find(r => r.weekStart === lastWeek.start)
  const stats = computeStats(rec, lastWeek.start, lastWeek.end)

  const [formOpen, setFormOpen]     = useState(false)
  const [formText, setFormText]     = useState('')
  const [formGood, setFormGood]     = useState('')
  const [formReflect, setFormReflect] = useState('')
  const [histOpen, setHistOpen]     = useState(false)

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

        {/* 自動集計 */}
        <div className="weekly-stats-row">
          <div className="weekly-stat">
            <div className="weekly-stat-label">気分平均</div>
            <div className="weekly-stat-val"><MoodVal avg={stats.avgMood} /></div>
          </div>
          <div className="weekly-stat">
            <div className="weekly-stat-label">運動</div>
            <div className="weekly-stat-val">{stats.exerciseDays}日</div>
          </div>
          <div className="weekly-stat">
            <div className="weekly-stat-label">体重変化</div>
            <div className="weekly-stat-val">
              {stats.weightChange !== null
                ? <span style={{ color: stats.weightChange <= 0 ? C.sage : C.rose }}>
                    {stats.weightChange >= 0 ? '+' : ''}{stats.weightChange}kg
                  </span>
                : <span style={{ color: C.inkL }}>—</span>
              }
            </div>
          </div>
        </div>

        {/* フォーム / 既存レビュー / 書くボタン */}
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

      {/* 過去の振り返り一覧 */}
      {pastReviews.length > 0 && (
        <>
          <button className="weekly-hist-toggle" onClick={() => setHistOpen(v => !v)}>
            過去の振り返り {histOpen ? '▲' : '▼'}
          </button>
          {histOpen && (
            <div className="weekly-hist-list">
              {pastReviews.map(r => (
                <div key={r.id} className="weekly-hist-item">
                  <div className="weekly-hist-range">{formatWeek(r.weekStart, r.weekEnd)}</div>
                  <div className="weekly-stats-row" style={{ marginBottom: 8 }}>
                    <div className="weekly-stat">
                      <div className="weekly-stat-label">気分平均</div>
                      <div className="weekly-stat-val">
                        <MoodVal avg={r.stats?.avgMood ?? null} />
                      </div>
                    </div>
                    <div className="weekly-stat">
                      <div className="weekly-stat-label">運動</div>
                      <div className="weekly-stat-val">{r.stats?.exerciseDays ?? 0}日</div>
                    </div>
                    <div className="weekly-stat">
                      <div className="weekly-stat-label">体重変化</div>
                      <div className="weekly-stat-val">
                        {r.stats?.weightChange != null
                          ? `${r.stats.weightChange >= 0 ? '+' : ''}${r.stats.weightChange}kg`
                          : '—'}
                      </div>
                    </div>
                  </div>
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
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
