import { useState } from 'react'
import { C, SHIFTS, MOODS, WJ } from '../constants'

const MOOD_EMOJIS = ['😊', '🙂', '😐', '😟', '😢']

export default function HistoryPage({ state, actions }) {
  const { rec, sh } = state
  const { setDate, setTab, setMiniYm } = actions
  const [expanded, setExpanded] = useState(null)

  const allDates = Object.keys(rec)
    .filter(d => {
      const r = rec[d]
      return r && (r.mood !== undefined || r.notes?.length || r.note ||
                   r.shift || sh[d] || r.exercise)
    })
    .sort()
    .reverse()

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
          const moodText = moodIdx !== null
            ? MOODS[moodIdx]?.split(' ').slice(1).join(' ')
            : null
          const notes = r.notes?.length
            ? r.notes
            : r.note ? [{ id: 'legacy', time: null, text: r.note }] : []
          const isOpen = expanded === ds
          const firstNote = notes[0] ?? null
          const extraCount = notes.length - 1

          return (
            <div
              key={ds}
              className={`diary-card${isOpen ? ' open' : ''}`}
              onClick={() => setExpanded(isOpen ? null : ds)}
            >
              {/* ── ヘッダー: 日付・曜日・シフト ── */}
              <div className="diary-card-header">
                <div className="diary-card-date">
                  <span className="diary-date-num">{d.getMonth() + 1}/{d.getDate()}</span>
                  <span className="diary-date-dow">{WJ[d.getDay()]}曜</span>
                  <span className="diary-date-year">{d.getFullYear()}</span>
                </div>
                <div className="diary-card-right">
                  {sv && (
                    <span className="diary-shift-badge"
                      style={{ color: sv.c, background: sv.bg, border: `1px solid ${sv.c}` }}>
                      {sv.m} {sv.l}
                    </span>
                  )}
                  <span className="diary-chevron">{isOpen ? '︿' : '﹀'}</span>
                </div>
              </div>

              {/* ── 気分・運動 ── */}
              {(moodEmoji || r.exercise) && (
                <div className="diary-card-meta">
                  {moodEmoji && (
                    <span className="diary-mood">
                      {moodEmoji}
                      {moodText && <span className="diary-mood-text">{moodText}</span>}
                    </span>
                  )}
                  {r.exercise && (
                    <span className="diary-exercise">
                      ● {r.exNote || '運動'}
                    </span>
                  )}
                </div>
              )}

              {/* ── NOTEプレビュー（折りたたみ時） ── */}
              {!isOpen && firstNote && (
                <div className="diary-preview">
                  <p className="diary-preview-text">{firstNote.text}</p>
                  {extraCount > 0 && (
                    <span className="diary-preview-more">+ {extraCount}件のメモ</span>
                  )}
                </div>
              )}

              {/* ── 展開時: 全メモ ── */}
              {isOpen && notes.length > 0 && (
                <div className="diary-notes">
                  {notes.map((n, i) => (
                    <div key={n.id || i} className="diary-note-item">
                      {n.time && <span className="diary-note-time">{n.time}</span>}
                      <p className="diary-note-text">{n.text}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* ── 展開時: 編集ボタン ── */}
              {isOpen && (
                <button
                  className="diary-goto-btn"
                  onClick={(e) => { e.stopPropagation(); goToDate(ds) }}
                >
                  この日の記録を編集 →
                </button>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
