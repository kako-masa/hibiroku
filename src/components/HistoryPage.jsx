import { useState } from 'react'
import { C, SHIFTS, MOODS, WJ } from '../constants'

const MOOD_EMOJIS = ['😊', '🙂', '😐', '😟', '😢']

export default function HistoryPage({ state, actions }) {
  const { rec, sh } = state
  const { setDate, setTab, setMiniYm } = actions
  const [expandedNotes, setExpandedNotes] = useState(new Set())

  const allDates = Object.keys(rec)
    .filter(d => {
      const r = rec[d]
      return r && (r.mood !== undefined || r.notes?.length || r.note ||
                   r.shift || sh[d] || r.exercise)
    })
    .sort()
    .reverse()

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

  if (allDates.length === 0) {
    return (
      <>
        <div className="page-title">DIARY</div>
        <div className="empty-msg">{'記録がまだありません\n日記タブで記録してみましょう'}</div>
      </>
    )
  }

  return (
    <>
      <div className="page-title">DIARY</div>
      <div className="diary-list">
        {allDates.map(ds => {
          const r = rec[ds] || {}
          const shKey = r.shift || sh[ds]
          const sv = shKey ? SHIFTS[shKey] : null
          const d = new Date(ds.replace(/-/g, '/'))
          const moodIdx = (r.mood !== undefined && r.mood !== null) ? r.mood : null
          const moodEmoji = moodIdx !== null ? MOOD_EMOJIS[moodIdx] : null
          const moodText  = moodIdx !== null ? MOODS[moodIdx]?.split(' ').slice(1).join(' ') : null
          const notes = r.notes?.length
            ? r.notes
            : r.note ? [{ id: 'legacy', time: null, text: r.note }] : []

          return (
            <div key={ds} className="diary-day">

              {/* ── 日付ヘッダー ── */}
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

              {/* ── メモカード ── */}
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
                          <span className="diary-note-time">
                            {n.time ?? '—'}
                          </span>
                          <span className="diary-note-chevron">
                            {isOpen ? '▲' : '▼'}
                          </span>
                        </div>
                        {isOpen ? (
                          <p className="diary-note-body expanded">{n.text}</p>
                        ) : (
                          <p className="diary-note-body">{n.text}</p>
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
    </>
  )
}
