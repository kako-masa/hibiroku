import { C, SHIFTS, WJ, pad, d2s } from '../constants'

const today = new Date()
const todayS = d2s(today)
const MONTH_NAMES = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']

export default function MiniCalendar({ state, actions }) {
  const { miniCalOpen, miniYm, date, rec, sh } = state
  const { setMiniCalOpen, setMiniYm, setDate } = actions
  const { y, m } = miniYm
  const dim = new Date(y, m + 1, 0).getDate()
  const fd = new Date(y, m, 1).getDay()

  const toggleOpen = () => setMiniCalOpen(!miniCalOpen)

  const goMonth = (delta) => {
    const d = new Date(y, m + delta, 1)
    setMiniYm({ y: d.getFullYear(), m: d.getMonth() })
  }

  const selectDate = (ds) => {
    setDate(ds)
    setMiniCalOpen(false)
    const d = new Date(ds.replace(/-/g, '/'))
    setMiniYm({ y: d.getFullYear(), m: d.getMonth() })
  }

  const cells = []
  WJ.forEach((w, i) => {
    const color = i === 0 ? '#A06060' : i === 6 ? '#607080' : '#9C8070'
    cells.push(
      <div key={`hd-${i}`} className="mini-hd" style={{ color }}>{w}</div>
    )
  })
  for (let i = 0; i < fd; i++) {
    cells.push(<div key={`empty-${i}`} />)
  }
  for (let d = 1; d <= dim; d++) {
    const ds = `${y}-${pad(m + 1)}-${pad(d)}`
    const sk = sh[ds] || rec[ds]?.shift
    const sv = sk ? SHIFTS[sk] : null
    const isToday = ds === todayS
    const isSel = ds === date
    const hasRec = rec[ds] && (rec[ds].weight || rec[ds].note || rec[ds].mood !== undefined)

    cells.push(
      <button
        key={ds}
        className={`mini-cell${isToday ? ' mini-today' : ''}${isSel ? ' mini-selected' : ''}`}
        style={{ background: sv ? sv.bg : 'transparent' }}
        onClick={(e) => { e.stopPropagation(); selectDate(ds) }}
      >
        <span
          className="mini-day"
          style={{
            color: isToday ? C.leatherM : C.ink,
            fontWeight: isToday || isSel ? '700' : '400',
          }}
        >
          {d}
        </span>
        {sv ? (
          <span className="mini-mark" style={{ color: sv.c }}>{sv.m}</span>
        ) : hasRec ? (
          <div className="mini-dot" />
        ) : null}
      </button>
    )
  }

  const displayDate = date === todayS ? 'Today' : date.slice(5)

  return (
    <div id="mini-cal-wrap">
      <button id="mini-cal-toggle" onClick={toggleOpen}>
        <div id="mini-cal-toggle-left">
          <span className="mini-cal-month">{y}年 {MONTH_NAMES[m]}</span>
          <span className="mini-cal-arrow">{miniCalOpen ? '▲ 閉じる' : '▼ カレンダー'}</span>
        </div>
        <span style={{ fontSize: '10px', color: '#9C8070', letterSpacing: '1px' }}>
          {displayDate}
        </span>
      </button>

      {miniCalOpen && (
        <div id="mini-cal-body">
          <div id="mini-cal-nav">
            <button className="mini-nav-btn" onClick={(e) => { e.stopPropagation(); goMonth(-1) }}>‹</button>
            <span className="mini-month-lbl">{y}年 {MONTH_NAMES[m]}</span>
            <button className="mini-nav-btn" onClick={(e) => { e.stopPropagation(); goMonth(1) }}>›</button>
          </div>
          <div className="mini-grid">{cells}</div>
        </div>
      )}
    </div>
  )
}
