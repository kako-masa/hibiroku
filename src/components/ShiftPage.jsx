import { useState } from 'react'
import { C, SHIFTS, WJ, pad, d2s } from '../constants'

const todayS = d2s(new Date())

export default function ShiftPage({ state, actions }) {
  const { sh, rec, miniYm } = state
  const { updateSh, updateRec } = actions
  const [ym, setYm] = useState(miniYm)
  const [picker, setPicker] = useState(null)

  const { y, m } = ym
  const dim = new Date(y, m + 1, 0).getDate()
  const fd = new Date(y, m, 1).getDay()

  const goMonth = (delta) => {
    const d = new Date(y, m + delta, 1)
    setYm({ y: d.getFullYear(), m: d.getMonth() })
    setPicker(null)
  }

  const setShift = (ds, key) => {
    const newSh = { ...sh, [ds]: key }
    const newRec = { ...rec, [ds]: { ...rec[ds], shift: key } }
    updateSh(newSh)
    updateRec(newRec)
    setPicker(null)
  }

  const clearShift = (ds) => {
    const newSh = { ...sh }
    delete newSh[ds]
    const newRec = { ...rec, [ds]: { ...rec[ds], shift: undefined } }
    updateSh(newSh)
    updateRec(newRec)
    setPicker(null)
  }

  const counts = {}
  for (let d = 1; d <= dim; d++) {
    const ds = `${y}-${pad(m + 1)}-${pad(d)}`
    const k = sh[ds] || rec[ds]?.shift
    if (k) counts[k] = (counts[k] || 0) + 1
  }

  const cells = []
  WJ.forEach((w, i) => {
    const color = i === 0 ? '#A06060' : i === 6 ? '#607080' : '#9C8070'
    cells.push(<div key={`hd-${i}`} className="cal-hd" style={{ color }}>{w}</div>)
  })
  for (let i = 0; i < fd; i++) cells.push(<div key={`e-${i}`} />)
  for (let d = 1; d <= dim; d++) {
    const ds = `${y}-${pad(m + 1)}-${pad(d)}`
    const k = sh[ds] || rec[ds]?.shift
    const sv = k ? SHIFTS[k] : null
    const isToday = ds === todayS
    const isSel = picker === ds
    cells.push(
      <button
        key={ds}
        className={`cal-cell${isToday ? ' today-cell' : ''}`}
        style={{
          background: sv ? sv.bg : 'transparent',
          border: isSel ? `2px solid ${C.leather}` : undefined,
        }}
        onClick={() => setPicker(picker === ds ? null : ds)}
      >
        <span className="cal-day" style={{ color: isToday ? C.leatherM : C.ink, fontWeight: isToday ? 700 : 400 }}>
          {d}
        </span>
        {sv && <span className="cal-mark" style={{ color: sv.c }}>{sv.m}</span>}
      </button>
    )
  }

  return (
    <>
      <div className="page-title">SHIFT CALENDAR</div>

      <div className="month-nav">
        <button className="arrow-btn" onClick={() => goMonth(-1)}>‹</button>
        <div className="month-label">{y}年 {m + 1}月</div>
        <button className="arrow-btn" onClick={() => goMonth(1)}>›</button>
      </div>

      {picker && (
        <div className="picker-box">
          <div className="picker-title">{picker} のシフト</div>
          <div className="picker-grid">
            {Object.entries(SHIFTS).map(([key, s]) => {
              const cur = sh[picker] || rec[picker]?.shift
              return (
                <button
                  key={key}
                  className="shift-opt"
                  style={{
                    background: cur === key ? s.c : s.bg,
                    color: cur === key ? '#fff' : s.c,
                    border: `1.5px solid ${s.c}`,
                  }}
                  onClick={() => setShift(picker, key)}
                >
                  {s.m} {s.l}
                </button>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {(sh[picker] || rec[picker]?.shift) && (
              <button className="close-btn" style={{ color: C.rose }} onClick={() => clearShift(picker)}>クリア</button>
            )}
            <button className="close-btn" style={{ flex: 1 }} onClick={() => setPicker(null)}>閉じる</button>
          </div>
        </div>
      )}

      <div className="cal-grid">{cells}</div>

      <div className="page-title" style={{ marginTop: 16 }}>SUMMARY</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {Object.entries(SHIFTS).map(([key, s]) => (
          <div
            key={key}
            style={{
              background: s.bg,
              border: `1px solid ${s.c}`,
              borderRadius: 4,
              padding: '5px 10px',
              fontSize: 12,
              color: s.c,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {s.m} {s.l} <strong>{counts[key] || 0}</strong>日
          </div>
        ))}
      </div>
    </>
  )
}
