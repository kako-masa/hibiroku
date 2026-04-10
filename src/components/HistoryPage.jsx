import { useState } from 'react'
import { C, SHIFTS, MOODS, WJ } from '../constants'

const pad = n => String(n).padStart(2, '0')
const today = new Date()
const todayS = `${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(today.getDate())}`

export default function HistoryPage({ state, actions }) {
  const { rec, sh } = state
  const { setDate, setTab, setMiniYm } = actions

  const [calYm, setCalYm] = useState({ y: today.getFullYear(), m: today.getMonth() })

  const allDates = Object.keys(rec)
    .filter(d => {
      const r = rec[d]
      return r && (r.weight || r.fat || r.sleep || r.mood !== undefined ||
                   r.note || r.notes?.length || r.shift || sh[d])
    })
    .sort()
    .reverse()

  const recDateSet = new Set(allDates)

  const goToDate = (ds) => {
    const d = new Date(ds.replace(/-/g, '/'))
    setDate(ds)
    setMiniYm({ y: d.getFullYear(), m: d.getMonth() })
    setTab('daily')
  }

  // カレンダー計算
  const firstDay = new Date(calYm.y, calYm.m, 1)
  const lastDay  = new Date(calYm.y, calYm.m + 1, 0)
  const startDow = firstDay.getDay()
  const calDays  = []
  for (let i = 0; i < startDow; i++) calDays.push(null)
  for (let d = 1; d <= lastDay.getDate(); d++) calDays.push(d)

  const prevMonth = () => setCalYm(({ y, m }) => m === 0 ? { y: y-1, m: 11 } : { y, m: m-1 })
  const nextMonth = () => setCalYm(({ y, m }) => m === 11 ? { y: y+1, m: 0 } : { y, m: m+1 })

  if (allDates.length === 0) {
    return (
      <>
        <div className="page-title">HISTORY</div>
        <div className="empty-msg">{'記録がまだありません\n日記タブで記録してみましょう'}</div>
      </>
    )
  }

  return (
    <>
      <div className="page-title">HISTORY</div>

      {/* カレンダー */}
      <div className="hist-cal">
        <div className="hist-cal-header">
          <button className="hist-cal-nav" onClick={prevMonth}>‹</button>
          <span className="hist-cal-title">{calYm.y}年 {calYm.m + 1}月</span>
          <button className="hist-cal-nav" onClick={nextMonth}>›</button>
        </div>
        <div className="hist-cal-grid">
          {WJ.map(w => <div key={w} className="hist-cal-dow">{w}</div>)}
          {calDays.map((d, i) => {
            if (!d) return <div key={`e${i}`} />
            const ds = `${calYm.y}-${pad(calYm.m+1)}-${pad(d)}`
            const hasRec = recDateSet.has(ds)
            const isToday = ds === todayS
            return (
              <div
                key={ds}
                className={`hist-cal-day${hasRec ? ' has-rec' : ''}${isToday ? ' is-today' : ''}`}
                onClick={() => hasRec && goToDate(ds)}
              >
                <span>{d}</span>
                {hasRec && <span className="hist-cal-dot" />}
              </div>
            )
          })}
        </div>
      </div>

      {/* 記録一覧 */}
      <div style={{ marginTop: 20 }}>
        {allDates.map(ds => {
          const r = rec[ds] || {}
          const shKey = r.shift || sh[ds]
          const sv = shKey ? SHIFTS[shKey] : null
          const d = new Date(ds.replace(/-/g, '/'))
          const moodLabel = r.mood !== undefined ? MOODS[r.mood] : null
          const moodEmoji = moodLabel?.split(' ')[0]
          const moodText  = moodLabel?.split(' ').slice(1).join(' ')
          const notes = r.notes?.length
            ? r.notes
            : r.note ? [{ id: 'legacy', time: null, text: r.note }] : []

          return (
            <div key={ds} className="hist-entry">
              {/* 日付ヘッダー */}
              <div className="hist-entry-header" onClick={() => goToDate(ds)}>
                <div className="hist-entry-date">
                  <span className="hist-entry-datenum">{d.getMonth()+1}/{d.getDate()}</span>
                  <span className="hist-entry-dow">{WJ[d.getDay()]}曜</span>
                  <span className="hist-entry-year">{d.getFullYear()}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {sv && (
                    <span className="hist-shift-badge" style={{ color: sv.c, background: sv.bg, border: `1px solid ${sv.c}` }}>
                      {sv.m} {sv.l}
                    </span>
                  )}
                  <span className="hist-entry-arrow">›</span>
                </div>
              </div>

              {/* バイタル */}
              {(r.weight || r.fat || r.sleep) && (
                <div className="hist-vitals">
                  {r.weight && <span>体重 <b>{r.weight}</b>kg</span>}
                  {r.fat    && <span>体脂肪 <b>{r.fat}</b>%</span>}
                  {r.sleep  && <span>睡眠 <b>{r.sleep}</b>h</span>}
                </div>
              )}

              {/* 気分・運動 */}
              {(moodEmoji || r.exercise) && (
                <div className="hist-mood-row">
                  {moodEmoji && (
                    <span className="hist-mood">
                      {moodEmoji} <span style={{ fontSize: 11, color: C.inkM }}>{moodText}</span>
                    </span>
                  )}
                  {r.exercise && (
                    <span className="hist-exercise">◯ {r.exNote || '運動'}</span>
                  )}
                </div>
              )}

              {/* DAILY NOTE */}
              {notes.length > 0 && (
                <div className="hist-notes">
                  {notes.map((n, i) => (
                    <div key={n.id || i} className="hist-note-item">
                      {n.time && <span className="hist-note-time">{n.time}</span>}
                      <span className="hist-note-text">{n.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
