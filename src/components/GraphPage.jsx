import { useState } from 'react'
import { C, d2s } from '../constants'

const today = new Date()

function LineGraph({ data, color, unit, label }) {
  if (data.length < 2) {
    return (
      <div className="gbar-wrap">
        <div className="sec-label">{label}</div>
        <div style={{ fontSize: 11, color: C.inkL, padding: '6px 0' }}>データが2件以上で表示</div>
      </div>
    )
  }
  const values = data.map(d => d.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const W = 300, H = 64, PAD = 6
  const pts = data.map((d, i) => {
    const x = PAD + (i / (data.length - 1)) * (W - PAD * 2)
    const y = H - PAD - ((d.value - min) / range) * (H - PAD * 2)
    return `${x},${y}`
  })
  const last = values[values.length - 1]
  const prev = values[values.length - 2]
  const trend = last < prev ? '▼' : last > prev ? '▲' : '—'
  const trendColor = last < prev ? C.sage : last > prev ? C.rose : C.inkL

  return (
    <div className="gbar-wrap">
      <div className="gbar-top">
        <span className="sec-label">{label}</span>
        <span style={{ fontSize: 12, color: C.ink }}>
          {last}{unit}
          <span style={{ marginLeft: 4, fontSize: 10, color: trendColor }}>{trend}</span>
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H, display: 'block' }}>
        <defs>
          <linearGradient id={`g-${label}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.15" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={`${PAD},${H} ${pts.join(' ')} ${W - PAD},${H}`} fill={`url(#g-${label})`} />
        <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
        {data.map((d, i) => {
          const x = PAD + (i / (data.length - 1)) * (W - PAD * 2)
          const y = H - PAD - ((d.value - min) / range) * (H - PAD * 2)
          return <circle key={i} cx={x} cy={y} r="2.5" fill={color} opacity="0.8" />
        })}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: C.inkL, marginTop: 2 }}>
        <span>{data[0]?.date?.slice(5)}</span>
        <span>min {Math.min(...values)}{unit} / max {Math.max(...values)}{unit}</span>
        <span>{data[data.length - 1]?.date?.slice(5)}</span>
      </div>
    </div>
  )
}

export default function GraphPage({ state }) {
  const { rec } = state
  const [range, setRange] = useState(30)

  const start = new Date(today)
  start.setDate(today.getDate() - range + 1)

  const dateList = []
  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    dateList.push(d2s(new Date(d)))
  }

  const weightData = dateList.map(ds => ({ date: ds, value: parseFloat(rec[ds]?.weight) })).filter(d => !isNaN(d.value))
  const sleepData  = dateList.map(ds => ({ date: ds, value: parseFloat(rec[ds]?.sleep)  })).filter(d => !isNaN(d.value))
  const fatData    = dateList.map(ds => ({ date: ds, value: parseFloat(rec[ds]?.fat)    })).filter(d => !isNaN(d.value))

  const moodCounts = [0, 0, 0, 0, 0]
  dateList.forEach(ds => {
    const mv = rec[ds]?.mood
    if (mv !== undefined && mv >= 0 && mv <= 4) moodCounts[mv]++
  })
  const moodLabels = ['よい日', 'まあまあ', 'ふつう', 'あまり…', 'つらい']
  const moodColors = [C.sage, C.gold, C.inkL, C.mauve, C.rose]

  const exCount = dateList.filter(ds => rec[ds]?.exercise).length
  const noteCount = dateList.filter(ds => rec[ds]?.note).length
  const recCount = dateList.filter(ds => rec[ds]?.weight || rec[ds]?.sleep).length

  return (
    <>
      <div className="page-title">RECORDS</div>

      <div className="filter-row">
        {[7, 14, 30, 90].map(r => (
          <button key={r} className={`filter-btn${range === r ? ' active' : ''}`} onClick={() => setRange(r)}>{r}日</button>
        ))}
      </div>

      <div className="learn-stats">
        <div className="stat-box">
          <div className="stat-icon">🏃</div>
          <div className="stat-num">{exCount}</div>
          <div className="stat-label">EXERCISE</div>
        </div>
        <div className="stat-box">
          <div className="stat-icon">📝</div>
          <div className="stat-num">{noteCount}</div>
          <div className="stat-label">NOTES</div>
        </div>
        <div className="stat-box">
          <div className="stat-icon">📊</div>
          <div className="stat-num">{recCount}</div>
          <div className="stat-label">RECORDS</div>
        </div>
      </div>

      <LineGraph data={weightData} color={C.leather} unit="kg" label="WEIGHT" />
      <LineGraph data={sleepData} color={C.slate} unit="h" label="SLEEP" />
      {fatData.length >= 2 && <LineGraph data={fatData} color={C.mauve} unit="%" label="BODY FAT" />}

      <div className="gbar-wrap">
        <div className="sec-label">MOOD DISTRIBUTION</div>
        {moodCounts.every(c => c === 0) ? (
          <div style={{ fontSize: 11, color: C.inkL, padding: '6px 0' }}>データがありません</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {moodLabels.map((label, i) => {
              const maxCount = Math.max(...moodCounts) || 1
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: C.inkM, width: 52, textAlign: 'right', flexShrink: 0 }}>{label}</span>
                  <div style={{ flex: 1, background: '#EDE7DC', borderRadius: 2, height: 14 }}>
                    <div style={{ width: `${(moodCounts[i] / maxCount) * 100}%`, height: '100%', background: moodColors[i], borderRadius: 2, transition: 'width 0.4s' }} />
                  </div>
                  <span style={{ fontSize: 11, color: C.inkL, width: 20, textAlign: 'right' }}>{moodCounts[i]}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
