import { useState, useRef } from 'react'
import { C, SHIFTS, WJ, pad, d2s } from '../constants'

const todayS = d2s(new Date())

export default function ShiftPage({ state, actions }) {
  const { sh, rec, miniYm } = state
  const { updateSh, updateRec } = actions
  const [ym, setYm] = useState(miniYm)
  const [picker, setPicker] = useState(null)
  const [planInput, setPlanInput] = useState('')
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkDraft, setBulkDraft] = useState({})
  const planRef = useRef(null)

  const { y, m } = ym
  const dim = new Date(y, m + 1, 0).getDate()
  const fd = new Date(y, m, 1).getDay()

  const goMonth = (delta) => {
    const d = new Date(y, m + delta, 1)
    setYm({ y: d.getFullYear(), m: d.getMonth() })
    setPicker(null)
  }

  const openPicker = (ds) => {
    setPicker(picker === ds ? null : ds)
    setPlanInput('')
  }

  const setShift = (ds, key) => {
    const newSh = { ...sh, [ds]: key }
    const newRec = { ...rec, [ds]: { ...rec[ds], shift: key } }
    updateSh(newSh)
    updateRec(newRec)
  }

  const clearShift = (ds) => {
    const newSh = { ...sh }
    delete newSh[ds]
    const newRec = { ...rec, [ds]: { ...rec[ds], shift: undefined } }
    updateSh(newSh)
    updateRec(newRec)
  }

  const addPlan = (ds) => {
    const text = planInput.trim()
    if (!text) return
    const entry = { id: Date.now().toString(), text }
    const existing = rec[ds]?.plans || []
    const newRec = { ...rec, [ds]: { ...rec[ds], plans: [...existing, entry] } }
    updateRec(newRec)
    setPlanInput('')
    if (planRef.current) planRef.current.focus()
  }

  const deletePlan = (ds, id) => {
    const existing = rec[ds]?.plans || []
    const newRec = { ...rec, [ds]: { ...rec[ds], plans: existing.filter(p => p.id !== id) } }
    updateRec(newRec)
  }

  const openBulk = () => {
    const draft = {}
    for (let d = 1; d <= dim; d++) {
      const ds = `${y}-${pad(m + 1)}-${pad(d)}`
      const k = sh[ds] || rec[ds]?.shift
      if (k) draft[ds] = k
    }
    setBulkDraft(draft)
    setBulkOpen(true)
  }

  const saveBulk = () => {
    const newSh = { ...sh }
    const newRec = { ...rec }
    for (let d = 1; d <= dim; d++) {
      const ds = `${y}-${pad(m + 1)}-${pad(d)}`
      if (bulkDraft[ds]) {
        newSh[ds] = bulkDraft[ds]
        newRec[ds] = { ...newRec[ds], shift: bulkDraft[ds] }
      } else {
        delete newSh[ds]
        if (newRec[ds]) newRec[ds] = { ...newRec[ds], shift: undefined }
      }
    }
    updateSh(newSh)
    updateRec(newRec)
    setBulkOpen(false)
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
    const plans = rec[ds]?.plans || []
    const isToday = ds === todayS
    const isSel = picker === ds
    cells.push(
      <button
        key={ds}
        className={`cal-cell${isToday ? ' today-cell' : ''}${isSel ? ' cal-cell-sel' : ''}`}
        style={{ background: sv ? sv.bg : 'transparent' }}
        onClick={() => openPicker(ds)}
      >
        <span className="cal-day" style={{ color: isToday ? C.leatherM : C.ink, fontWeight: isToday ? 700 : 400 }}>
          {d}
        </span>
        {sv && <span className="cal-mark" style={{ color: sv.c }}>{sv.m}</span>}
        {plans.slice(0, 2).map(p => (
          <span key={p.id} className="cal-plan-title">{p.text}</span>
        ))}
        {plans.length > 2 && (
          <span className="cal-plan-more">+{plans.length - 2}</span>
        )}
      </button>
    )
  }

  const bulkRows = []
  for (let d = 1; d <= dim; d++) {
    const ds = `${y}-${pad(m + 1)}-${pad(d)}`
    const dow = new Date(y, m, d).getDay()
    const isToday = ds === todayS
    const sel = bulkDraft[ds]
    const dowColor = dow === 0 ? '#A06060' : dow === 6 ? '#607080' : C.inkL
    bulkRows.push(
      <div key={ds} className="bulk-row">
        <div className="bulk-date" style={{ color: isToday ? C.leatherM : C.ink }}>
          <span className="bulk-day-num" style={{ fontWeight: isToday ? 700 : 400 }}>{m + 1}/{d}</span>
          <span className="bulk-dow" style={{ color: dowColor }}>{WJ[dow]}</span>
        </div>
        <div className="bulk-shifts">
          {Object.entries(SHIFTS).map(([key, s]) => (
            <button
              key={key}
              className="bulk-shift-btn"
              style={{
                background: sel === key ? s.c : s.bg,
                color: sel === key ? '#fff' : s.c,
                border: `1.5px solid ${s.c}`,
              }}
              onClick={() => setBulkDraft(prev => ({
                ...prev,
                [ds]: prev[ds] === key ? undefined : key,
              }))}
            >
              <span className="bulk-shift-icon">{s.m}</span>
              <span className="bulk-shift-label">{s.l}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  const pickerPlans = picker ? (rec[picker]?.plans || []) : []

  return (
    <>
      <div className="page-title">SHIFT CALENDAR</div>

      <div className="month-nav">
        <button className="arrow-btn" onClick={() => goMonth(-1)}>‹</button>
        <div className="month-label">{y}年 {m + 1}月</div>
        <button className="arrow-btn" onClick={() => goMonth(1)}>›</button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <button className="bulk-open-btn" onClick={openBulk}>一括入力</button>
      </div>

      {picker && (
        <div className="picker-box">
          <div className="picker-title">{picker}</div>

          {/* シフト選択 */}
          <div className="picker-section-label">SHIFT</div>
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

          {/* 予定セクション */}
          <div className="picker-section-label" style={{ marginTop: 10 }}>PLANS</div>
          {pickerPlans.length > 0 && (
            <div className="plan-list">
              {pickerPlans.map(p => (
                <div key={p.id} className="plan-item">
                  <span className="plan-item-text">{p.text}</span>
                  <button className="plan-del-btn" onClick={() => deletePlan(picker, p.id)}>✕</button>
                </div>
              ))}
            </div>
          )}
          <div className="plan-input-row">
            <input
              ref={planRef}
              className="plan-input"
              type="text"
              placeholder="予定を入力（例：病院 14:00）"
              value={planInput}
              onChange={e => setPlanInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPlan(picker) } }}
            />
            <button
              className="plan-add-btn"
              onClick={() => addPlan(picker)}
              disabled={!planInput.trim()}
            >追加</button>
          </div>

          {/* フッターボタン */}
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            {(sh[picker] || rec[picker]?.shift) && (
              <button className="close-btn" style={{ color: C.rose }} onClick={() => clearShift(picker)}>シフトクリア</button>
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

      {bulkOpen && (
        <div className="bulk-overlay">
          <div className="bulk-modal">
            <div className="bulk-modal-header">
              <span className="bulk-modal-title">{y}年 {m + 1}月　一括入力</span>
              <button className="bulk-close-btn" onClick={() => setBulkOpen(false)}>✕</button>
            </div>
            <div className="bulk-list">
              {bulkRows}
            </div>
            <div className="bulk-footer">
              <button className="bulk-cancel-btn" onClick={() => setBulkOpen(false)}>キャンセル</button>
              <button className="bulk-save-btn" onClick={saveBulk}>保存する</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
