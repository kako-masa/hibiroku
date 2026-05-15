import { useState } from 'react'
import { C, SHIFTS, MOODS, WJ, tagColor } from '../constants'

const MOOD_EMOJIS = ['😊', '🙂', '😐', '😟', '😢']

export default function HistoryPage({ state, actions }) {
  const { rec, sh } = state
  const { setDate, setTab, setMiniYm } = actions
  const [expandedNotes, setExpandedNotes] = useState(new Set())
  const [selectedTags, setSelectedTags]   = useState([])

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

  const filteredDates = selectedTags.length === 0
    ? allDates
    : allDates.filter(ds =>
        (rec[ds]?.notes || []).some(n =>
          selectedTags.some(st => (n.tags || []).includes(st))
        )
      )

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

  return (
    <>
      <div className="page-title">DIARY</div>

      {/* タグフィルター */}
      {allTags.length > 0 && (
        <div className="diary-tag-filter">
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
          {selectedTags.length > 0 && (
            <button className="diary-tag-filter-clear" onClick={() => setSelectedTags([])}>✕ クリア</button>
          )}
        </div>
      )}

      {allDates.length === 0 ? (
        <div className="empty-msg">{'記録がまだありません\n日記タブで記録してみましょう'}</div>
      ) : filteredDates.length === 0 ? (
        <div className="empty-msg">選択したタグの記録がありません</div>
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
            const notes = selectedTags.length === 0
              ? allNotes
              : allNotes.filter(n => selectedTags.some(st => (n.tags || []).includes(st)))

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
                            <span className="diary-note-time">{n.time ?? '—'}</span>
                            <span className="diary-note-chevron">{isOpen ? '▲' : '▼'}</span>
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
  )
}
