import { useState } from 'react'
import { C, SHIFTS, WJ, d2s } from '../constants'

const today = new Date()
const MOOD_EMOJIS = ['😊', '🙂', '😐', '😟', '😢']

const GRAPH_TABS = [
  { k: 'weight',       l: '体重',       color: C.leather },
  { k: 'weight-fat',   l: '体重+体脂肪', color: C.leather },
  { k: 'weight-sleep', l: '体重+睡眠',   color: C.leather },
  { k: 'sleep',        l: '睡眠',        color: C.slate   },
  { k: 'mood',         l: '気分',        color: C.gold    },
]

function normSeries(vals) {
  const nonNull = vals.filter(v => v !== null)
  if (nonNull.length < 1) return null
  const min = Math.min(...nonNull)
  const max = Math.max(...nonNull)
  const rng = max - min || 1
  return { min, max, norm: vals.map(v => v !== null ? (v - min) / rng : null) }
}

function latestVal(vals) {
  for (let i = vals.length - 1; i >= 0; i--) {
    if (vals[i] !== null) return vals[i]
  }
  return null
}

function lsGetNum(key) {
  try { const v = localStorage.getItem(key); return v ? parseFloat(v) : null } catch { return null }
}

export default function GraphPage({ state }) {
  const { rec, sh } = state
  const [range, setRange]           = useState(7)
  const [graphTab, setGraphTab]     = useState('weight')
  const [goalWeight, setGoalWeight] = useState(() => lsGetNum('hbr-goal-weight'))
  const [goalFat,    setGoalFat]    = useState(() => lsGetNum('hbr-goal-fat'))
  const [gwInput,    setGwInput]    = useState(() => { const v = lsGetNum('hbr-goal-weight'); return v !== null ? String(v) : '' })
  const [gfInput,    setGfInput]    = useState(() => { const v = lsGetNum('hbr-goal-fat');    return v !== null ? String(v) : '' })

  // 対象期間の日付リスト
  const start = new Date(today)
  start.setDate(today.getDate() - range + 1)
  const dateList = []
  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    dateList.push(d2s(new Date(d)))
  }

  const days = dateList.map(ds => {
    const r = rec[ds] || {}
    const shKey = r.shift || sh[ds]
    return {
      ds,
      d: new Date(ds.replace(/-/g, '/')),
      shift: shKey ? SHIFTS[shKey] : null,
      weight: parseFloat(r.weight) || null,
      fat:    parseFloat(r.fat)    || null,
      sleep:  parseFloat(r.sleep)  || null,
      mood:   (r.mood !== undefined && r.mood !== null) ? r.mood : null,
    }
  })

  const latestWeight = latestVal(days.map(d => d.weight))
  const latestFat    = latestVal(days.map(d => d.fat))
  const latestSleep  = latestVal(days.map(d => d.sleep))

  // タブごとの系列定義
  const seriesDefs = {
    weight: [
      { vals: days.map(d => d.weight), goal: goalWeight, color: C.leather, unit: 'kg', side: 'left',  label: '体重' },
    ],
    'weight-fat': [
      { vals: days.map(d => d.weight), goal: goalWeight, color: C.leather, unit: 'kg', side: 'left',  label: '体重' },
      { vals: days.map(d => d.fat),    goal: goalFat,    color: C.mauve,   unit: '%',  side: 'right', label: '体脂肪' },
    ],
    'weight-sleep': [
      { vals: days.map(d => d.weight), goal: goalWeight, color: C.leather, unit: 'kg', side: 'left',  label: '体重' },
      { vals: days.map(d => d.sleep),  goal: null,       color: C.slate,   unit: 'h',  side: 'right', label: '睡眠' },
    ],
    sleep: [
      { vals: days.map(d => d.sleep), goal: null, color: C.slate, unit: 'h', side: 'left', label: '睡眠' },
    ],
    mood: null,
  }

  const currentSeries = (seriesDefs[graphTab] || []).map(s => ({
    ...s, nm: normSeries(s.vals),
  }))

  // SVG 寸法
  const N     = days.length
  const DAY_W = range === 7 ? 46 : 28
  const SVG_W = DAY_W * N
  const DATE_H  = 36
  const SHIFT_H = 22
  const LINE_H  = 110
  const SVG_H   = DATE_H + SHIFT_H + LINE_H

  const xc     = i => i * DAY_W + DAY_W / 2
  const LINE_TOP = DATE_H + SHIFT_H + 6
  const LINE_BOT = DATE_H + SHIFT_H + LINE_H - 6
  const yLine  = v => LINE_BOT - v * (LINE_BOT - LINE_TOP)

  function buildSegments(nm) {
    if (!nm) return []
    const pts = []
    days.forEach((_, i) => {
      const v = nm.norm[i]
      if (v !== null) pts.push(`${xc(i)},${yLine(v)}`)
    })
    return pts.length >= 2 ? [pts] : []
  }

  function getTargetY(goal, nm) {
    if (goal === null || nm === null) return null
    const normalized = (goal - nm.min) / (nm.max - nm.min || 1)
    return yLine(Math.max(0, Math.min(1, normalized)))
  }

  function saveGoal(key, raw) {
    const n = parseFloat(raw)
    const lsKey = key === 'weight' ? 'hbr-goal-weight' : 'hbr-goal-fat'
    if (!isNaN(n) && raw.trim() !== '') {
      localStorage.setItem(lsKey, String(n))
      key === 'weight' ? setGoalWeight(n) : setGoalFat(n)
    } else {
      localStorage.removeItem(lsKey)
      key === 'weight' ? setGoalWeight(null) : setGoalFat(null)
    }
  }

  const showGoalWeight = ['weight', 'weight-fat', 'weight-sleep'].includes(graphTab)
  const showGoalFat    = graphTab === 'weight-fat'
  const isDual         = currentSeries.length === 2

  return (
    <>
      <div className="page-title">RECORDS</div>

      {/* グラフタブ */}
      <div className="graph-tab-btns">
        {GRAPH_TABS.map(t => (
          <button
            key={t.k}
            className={`graph-tab-btn${graphTab === t.k ? ' active' : ''}`}
            style={graphTab === t.k ? { background: t.color, borderColor: t.color, color: '#fff' } : {}}
            onClick={() => setGraphTab(t.k)}
          >{t.l}</button>
        ))}
      </div>

      {/* 期間ボタン */}
      <div className="graph-range-btns">
        <button className={`graph-range-btn${range === 7  ? ' active' : ''}`} onClick={() => setRange(7)}>1週間</button>
        <button className={`graph-range-btn${range === 30 ? ' active' : ''}`} onClick={() => setRange(30)}>1ヶ月</button>
      </div>

      {/* 最新値サマリー */}
      <div className="graph-summary">
        {[
          { label: '体重',   val: latestWeight, unit: 'kg', color: C.leather },
          { label: '体脂肪', val: latestFat,    unit: '%',  color: C.mauve   },
          { label: '睡眠',   val: latestSleep,  unit: 'h',  color: C.slate   },
        ].map(({ label, val, unit, color }) => (
          <div key={label} className="graph-summary-item">
            <div className="graph-summary-label" style={{ color }}>{label}</div>
            <div className="graph-summary-val" style={{ color }}>
              {val !== null ? `${val}${unit}` : '—'}
            </div>
          </div>
        ))}
      </div>

      {/* 目標値入力 */}
      {(showGoalWeight || showGoalFat) && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          {showGoalWeight && (
            <div className="graph-goal-row" style={{ flex: 1, marginBottom: 0 }}>
              <span className="graph-goal-label" style={{ color: C.leather }}>目標体重</span>
              <input
                className="graph-goal-input"
                type="number" step="0.1" placeholder="55.0"
                value={gwInput}
                onChange={e => setGwInput(e.target.value)}
                onBlur={e => saveGoal('weight', e.target.value)}
              />
              <span className="graph-goal-unit">kg</span>
            </div>
          )}
          {showGoalFat && (
            <div className="graph-goal-row" style={{ flex: 1, marginBottom: 0 }}>
              <span className="graph-goal-label" style={{ color: C.mauve }}>目標体脂肪</span>
              <input
                className="graph-goal-input"
                type="number" step="0.1" placeholder="22.0"
                value={gfInput}
                onChange={e => setGfInput(e.target.value)}
                onBlur={e => saveGoal('fat', e.target.value)}
              />
              <span className="graph-goal-unit">%</span>
            </div>
          )}
        </div>
      )}

      {/* 凡例（デュアル系列のみ） */}
      {isDual && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 8, paddingLeft: 2 }}>
          {currentSeries.map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 20, height: 2.5, background: s.color, borderRadius: 2 }} />
              <span style={{ fontSize: 10, color: s.color }}>{s.label} ({s.unit})</span>
            </div>
          ))}
        </div>
      )}

      {/* ── 気分タブ: 絵文字グリッド ── */}
      {graphTab === 'mood' ? (
        <div className="graph-mood-grid" style={{ gridTemplateColumns: `repeat(${range === 7 ? 7 : 5}, 1fr)` }}>
          {days.map(day => {
            const isWe = day.d.getDay() === 0 || day.d.getDay() === 6
            return (
              <div key={day.ds} className="graph-mood-cell">
                <div className="graph-mood-date" style={{ color: isWe ? '#C4897A' : C.inkM }}>
                  {day.d.getMonth() + 1}/{day.d.getDate()}
                </div>
                <div className="graph-mood-dow" style={{ color: isWe ? '#C4897A' : C.inkL }}>
                  {WJ[day.d.getDay()]}
                </div>
                <div className="graph-mood-emoji">
                  {day.mood !== null ? MOOD_EMOJIS[day.mood] : <span style={{ color: C.inkL, fontSize: 10 }}>—</span>}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* ── 折れ線グラフ ── */
        <div className="graph-scroll">
          <svg width={SVG_W} height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ display: 'block' }}>
            <defs>
              <clipPath id="line-clip">
                <rect x={0} y={DATE_H + SHIFT_H} width={SVG_W} height={LINE_H} />
              </clipPath>
            </defs>

            {/* グリッド水平線 */}
            {[0.25, 0.5, 0.75].map(v => (
              <line key={v} x1={0} y1={yLine(v)} x2={SVG_W} y2={yLine(v)}
                stroke="rgba(180,162,140,0.15)" strokeWidth="1" strokeDasharray="3 3" />
            ))}
            <line x1={0} y1={DATE_H + SHIFT_H} x2={SVG_W} y2={DATE_H + SHIFT_H}
              stroke="rgba(180,162,140,0.25)" strokeWidth="1" />

            {/* 各日列 */}
            {days.map((day, i) => {
              const cx   = i * DAY_W
              const isWe = day.d.getDay() === 0 || day.d.getDay() === 6
              return (
                <g key={day.ds}>
                  {day.shift && (
                    <rect x={cx} y={DATE_H} width={DAY_W} height={SHIFT_H + LINE_H}
                      fill={day.shift.c} opacity="0.09" />
                  )}
                  <line x1={cx} y1={0} x2={cx} y2={SVG_H}
                    stroke="rgba(180,162,140,0.1)" strokeWidth="0.5" />
                  <text x={cx + DAY_W / 2} y={14} textAnchor="middle"
                    fontSize={range === 7 ? 10 : 7}
                    fill={isWe ? '#C4897A' : C.inkM} fontWeight={isWe ? '600' : '400'}>
                    {day.d.getMonth() + 1}/{day.d.getDate()}
                  </text>
                  <text x={cx + DAY_W / 2} y={26} textAnchor="middle"
                    fontSize={range === 7 ? 8 : 6}
                    fill={isWe ? '#C4897A' : C.inkL}>
                    {WJ[day.d.getDay()]}
                  </text>
                  {day.shift && (
                    <text x={cx + DAY_W / 2} y={DATE_H + 15} textAnchor="middle"
                      fontSize={range === 7 ? 12 : 8}>
                      {day.shift.m}
                    </text>
                  )}
                </g>
              )
            })}

            {/* チャートエリア内の描画（clipPath適用） */}
            <g clipPath="url(#line-clip)">
              {currentSeries.map((s, si) => {
                const segs    = buildSegments(s.nm)
                const targetY = getTargetY(s.goal, s.nm)
                return (
                  <g key={si}>
                    {/* 目標点線 */}
                    {targetY !== null && (
                      <line x1={0} y1={targetY} x2={SVG_W} y2={targetY}
                        stroke={s.color} strokeWidth="1.5" strokeDasharray="6 4" opacity="0.55" />
                    )}
                    {/* 折れ線 */}
                    {segs.map((pts, pi) => pts.length >= 2 && (
                      <polyline key={pi} points={pts.join(' ')}
                        fill="none" stroke={s.color}
                        strokeWidth={si === 0 ? 2 : 1.5}
                        strokeLinejoin="round" strokeLinecap="round"
                        strokeDasharray={si === 1 ? '1 0' : undefined}
                      />
                    ))}
                    {/* データ点 */}
                    {s.nm && days.map((_, i) => {
                      const v = s.nm.norm[i]
                      if (v === null) return null
                      return (
                        <circle key={i} cx={xc(i)} cy={yLine(v)} r={si === 0 ? 2.5 : 2}
                          fill={s.color} stroke="#FAF7F2" strokeWidth="1.2" />
                      )
                    })}
                  </g>
                )
              })}
            </g>

            {/* 軸ラベル（各系列のmin/max、左右に分けて表示） */}
            {currentSeries.map((s, si) => {
              if (!s.nm) return null
              const isRight  = s.side === 'right'
              const xPos     = isRight ? SVG_W - 4 : 4
              const anchor   = isRight ? 'end' : 'start'
              return (
                <g key={si}>
                  <text x={xPos} y={LINE_TOP + 8} textAnchor={anchor} fontSize="7" fill={s.color}>
                    {s.nm.max}{s.unit}
                  </text>
                  <text x={xPos} y={LINE_BOT} textAnchor={anchor} fontSize="7" fill={s.color}>
                    {s.nm.min}{s.unit}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      )}
    </>
  )
}
