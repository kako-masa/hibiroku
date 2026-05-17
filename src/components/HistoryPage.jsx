import { useState } from 'react'
import { C, SHIFTS, MOODS, WJ, tagColor } from '../constants'

const MOOD_EMOJIS = ['😊', '🙂', '😐', '😟', '😢']

function formatWeekRange(start, end) {
  const s = new Date(start.replace(/-/g, '/'))
  const e = new Date(end.replace(/-/g, '/'))
  return `${s.getMonth() + 1}/${s.getDate()}〜${e.getMonth() + 1}/${e.getDate()}`
}

export default function HistoryPage({ state, actions }) {
  const { rec, sh, weeklyReviews = [], historySubTab = 'diary' } = state
  const { setDate, setTab, setMiniYm, updateRec, setHistorySubTab } = actions
  const [expandedNotes, setExpandedNotes] = useState(new Set())
  const [selectedTags, setSelectedTags]   = useState([])
  const [showOnlyFav, setShowOnlyFav]     = useState(false)

  // ── 日記タブ ──
  const allDates = Object.keys(rec)
    .filter(d => {
      const r = rec[d]
      return r && (r.notes?.length > 0 || (r.note && r.note.trim()))
    })
    .sort()
    .reverse()

  const allTags = (() => {
    const counts = {}
    Object.values(rec).forEach(r => {
      ;(r.notes || []).forEach(n => {
        ;(n.tags || []).forEach(t => { counts[t] = (counts[t] || 0) + 1 })
      })
    })
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([t]) => t)
  })()

  const toggleTag = (tag) =>
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])

  const filteredDates = allDates.filter(ds => {
    const notes = rec[ds]?.notes || []
    if (showOnlyFav && !notes.some(n => n.starred)) return false
    if (selectedTags.length > 0 && !notes.some(n => selectedTags.some(st => (n.tags || []).includes(st)))) return false
    return true
  })

  const toggleStarInHistory = (ds, noteId) => {
    const newNotes = (rec[ds]?.notes || []).map(n =>
      n.id !== noteId ? n : { ...n, starred: !n.starred }
    )
    updateRec({ ...rec, [ds]: { ...rec[ds], notes: newNotes } })
  }

  const toggleNote = (uid) => {
    setExpandedNotes(prev => {
      const next = new Set(prev)
      next.has(uid) ? next.delete(uid) : next.add(uid)
      return next
    })
  }

  const goToDate = (ds) => {
    const d = new Date(ds.replace(/-/g, '/'))
    setDate(ds)
    setMiniYm({ y: d.getFullYear(), m: d.getMonth() })
    setTab('daily')
  }

  // ── 振り返りタブ ──
  const sortedReviews = [...weeklyReviews].sort((a, b) => b.weekStart.localeCompare(a.weekStart))

  return (
    <>
      <div className="page-title">DIARY</div>

      {/* サブタブ */}
      <div className="history-tabs">
        <button
          className={`history-tab${historySubTab === 'diary' ? ' active' : ''}`}
          onClick={() => setHistorySubTab('diary')}
        >日記</button>
        <button
          className={`history-tab${historySubTab === 'review' ? ' active' : ''}`}
          onClick={() => setHistorySubTab('review')}
        >振り返り</button>
      </div>

      {historySubTab === 'diary' ? (
        <>
          {/* フィルター */}
          <div className="diary-tag-filter">
            <button
              className={`diary-fav-filter-btn${showOnlyFav ? ' active' : ''}`}
              onClick={() => setShowOnlyFav(v => !v)}
            >★ お気に入りのみ</button>
            {allTags.map(tag => {
              const tc = tagColor(tag)
              const active = selectedTags.includes(tag)
              return (
                <button
                  key={tag}
                  className="diary-tag-filter-btn"
                  onClick={() => toggleTag(tag)}
                  style={active
                    ? { background: tc.text, color: '#fff', border: `1px solid ${tc.text}` }
                    : { background: tc.bg, color: tc.text, border: `1px solid ${tc.border}` }
                  }
                >{tag}</button>
              )
            })}
            {(selectedTags.length > 0 || showOnlyFav) && (
              <button className="diary-tag-filter-clear" onClick={() => { setSelectedTags([]); setShowOnlyFav(false) }}>✕ クリア</button>
            )}
          </div>

          {allDates.length === 0 ? (
            <div className="empty-msg">{'記録がまだありません\n日記タブで記録してみましょう'}</div>
          ) : filteredDates.length === 0 ? (
            <div className="empty-msg">
              {showOnlyFav ? 'お気に入りのメモがありません' : '選択したフィルターの記録がありません'}
            </div>
          ) : (
            <div className="diary-list">
              {filteredDates.map(ds => {
                const r = rec[ds] || {}
                const shKey = r.shift || sh[ds]
                const sv = shKey ? SHIFTS[shKey] : null
                const d = new Date(ds.replace(/-/g, '/'))
                const moodIdx = (r.mood !== undefined && r.mood !== null) ? r.mood : null
                const moodEmoji = moodIdx !== null ? MOOD_EMOJIS[moodIdx] : null
                const moodText  = moodIdx !== null ? MOODS[moodIdx]?.split(' ').slice(1).join(' ') : null
                const allNotes = r.notes?.length
                  ? r.notes
                  : r.note ? [{ id: 'legacy', time: null, text: r.note }] : []
                const notes = allNotes
                  .filter(n => !showOnlyFav || n.starred)
                  .filter(n => selectedTags.length === 0 || selectedTags.some(st => (n.tags || []).includes(st)))

                return (
                  <div key={ds} className="diary-day">

                    {/* 日付ヘッダー */}
                    <div className="diary-day-header" onClick={() => goToDate(ds)}>
                      <div className="diary-day-date">
                        <span className="diary-date-num">{d.getMonth() + 1}/{d.getDate()}</span>
                        <span className="diary-date-dow">{WJ[d.getDay()]}曜</span>
                        <span className="diary-date-year">{d.getFullYear()}</span>
                      </div>
                      <div className="diary-day-badges">
                        {sv && (
                          <span className="diary-shift-badge"
                            style={{ color: sv.c, background: sv.bg, border: `1px solid ${sv.c}` }}>
                            {sv.m} {sv.l}
                          </span>
                        )}
                        {moodEmoji && (
                          <span className="diary-mood-badge" title={moodText}>{moodEmoji}</span>
                        )}
                        {r.exercise && (
                          <span className="diary-exercise-badge">● 運動</span>
                        )}
                      </div>
                    </div>

                    {/* メモカード */}
                    {notes.length > 0 && (
                      <div className="diary-note-cards">
                        {notes.map((n, i) => {
                          const uid = `${ds}-${n.id ?? i}`
                          const isOpen = expandedNotes.has(uid)
                          return (
                            <div
                              key={uid}
                              className={`diary-note-card${isOpen ? ' open' : ''}`}
                              onClick={() => toggleNote(uid)}
                            >
                              <div className="diary-note-card-top">
                                <span className="diary-note-time">{n.time ?? '—'}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  {n.id !== 'legacy' && (
                                    <button
                                      className={`note-star-btn${n.starred ? ' starred' : ''}`}
                                      onClick={(e) => { e.stopPropagation(); toggleStarInHistory(ds, n.id) }}
                                      title={n.starred ? 'お気に入り解除' : 'お気に入り登録'}
                                    >{n.starred ? '★' : '☆'}</button>
                                  )}
                                  <span className="diary-note-chevron">{isOpen ? '▲' : '▼'}</span>
                                </div>
                              </div>
                              {isOpen ? (
                                <p className="diary-note-body expanded">{n.text}</p>
                              ) : (
                                <p className="diary-note-body">{n.text}</p>
                              )}
                              {(n.tags || []).length > 0 && (
                                <div className="note-tags-row" onClick={e => e.stopPropagation()}>
                                  {(n.tags || []).map(tag => {
                                    const tc = tagColor(tag)
                                    return (
                                      <span key={tag} className="note-tag-chip"
                                        style={{ background: tc.bg, color: tc.text, border: `1px solid ${tc.border}` }}>
                                        {tag}
                                      </span>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}

                  </div>
                )
              })}
            </div>
          )}
        </>
      ) : (
        /* ── 振り返りタブ ── */
        sortedReviews.length === 0 ? (
          <div className="empty-msg">{'振り返りがまだありません\n日記ページのWEEKLY REVIEWで記録してみましょう'}</div>
        ) : (
          <div className="review-list">
            {sortedReviews.map(r => (
              <div key={r.id || r.weekStart} className="weekly-card">
                <div className="weekly-card-header">
                  <span className="weekly-week-range">{formatWeekRange(r.weekStart, r.weekEnd)}</span>
                </div>
                <div className="weekly-stats-row">
                  <div className="weekly-stat">
                    <div className="weekly-stat-label">気分平均</div>
                    <div className="weekly-stat-val">
                      {r.stats?.avgMood != null
                        ? <span>{MOOD_EMOJIS[Math.min(4, Math.round(r.stats.avgMood))]} {r.stats.avgMood.toFixed(1)}</span>
                        : <span style={{ color: C.inkL }}>—</span>
                      }
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
                        ? <span style={{ color: r.stats.weightChange <= 0 ? C.sage : C.rose }}>
                            {r.stats.weightChange >= 0 ? '+' : ''}{r.stats.weightChange}kg
                          </span>
                        : <span style={{ color: C.inkL }}>—</span>
                      }
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
                {!r.text && !r.good && !r.reflect && (
                  <p style={{ color: C.inkL, fontSize: 12, margin: 0 }}>振り返りは未記入です</p>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </>
  )
}
