import { useState } from 'react'
import { C, SHIFTS, WJ, d2s } from '../constants'

const today = new Date()

const MOOD_EMOJIS = ['😊', '🙂', '😐', '😟', '😢']

// 各系列を 0〜1 に正規化
function normSeries(vals) {
  const nonNull = vals.filter(v => v !== null)
  if (nonNull.length < 1) return null
  const min = Math.min(...nonNull)
  const max = Math.max(...nonNull)
  const rng = max - min || 1
  return { min, max, norm: vals.map(v => v !== null ? (v - min) / rng : null) }
}

// 最新の非null値を返す
function latestVal(vals) {
  for (let i = vals.length - 1; i >= 0; i--) {
    if (vals[i] !== null) return vals[i]
  }
  return null
}

export default function GraphPage({ state }) {
  const { rec, sh } = state
  const [range, setRange] = useState(7)

  // 対象期間の日付リスト
  const start = new Date(today)
  start.setDate(today.getDate() - range + 1)
  const dateList = []
  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    dateList.push(d2s(new Date(d)))
  }

  // 日ごとのデータ
  const days = dateList.map(ds => {
    const r = rec[ds] || {}
    const shKey = r.shift || sh[ds]
    return {
      ds,
      d: new Date(ds.replace(/-/g, '/')),
      shift: shKey ? SHIFTS[shKey] : null,
      exercise: !!r.exercise,
      weight: parseFloat(r.weight) || null,
      fat:    parseFloat(r.fat)    || null,
      sleep:  parseFloat(r.sleep)  || null,
      mood:   (r.mood !== undefined && r.mood !== null) ? r.mood : null,
    }
  })

  const wNorm = normSeries(days.map(d => d.weight))
  const fNorm = normSeries(days.map(d => d.fat))
  const sNorm = normSeries(days.map(d => d.sleep))

  const latestWeight = latestVal(days.map(d => d.weight))
  const latestFat    = latestVal(days.map(d => d.fat))
  const latestSleep  = latestVal(days.map(d => d.sleep))

  // ── SVG 寸法定義 ──
  const N     = days.length
  const DAY_W = range === 7 ? 46 : 28
  const SVG_W = DAY_W * N

  const DATE_H  = 50   // 日付・曜日・気分絵文字
  const SHIFT_H = 24   // シフトアイコン＋運動ドット
  const LINE_H  = 110  // 折れ線グラフ
  const SVG_H   = DATE_H + SHIFT_H + LINE_H

  const xc = i => i * DAY_W + DAY_W / 2

  const LINE_TOP = DATE_H + SHIFT_H + 6
  const LINE_BOT = DATE_H + SHIFT_H + LINE_H - 6
  const yLine = v => LINE_BOT - v * (LINE_BOT - LINE_TOP)

  // 折れ線を null で分割してセグメント化
  function buildSegments(norm) {
    if (!norm) return []
    const segs = []
    let cur = []
    days.forEach((_, i) => {
      const v = norm.norm[i]
      if (v !== null) {
        cur.push(`${xc(i)},${yLine(v)}`)
      } else {
        if (cur.length) { segs.push(cur); cur = [] }
      }
    })
    if (cur.length) segs.push(cur)
    return segs
  }

  const lines = [
    { norm: wNorm, color: C.leather },
    { norm: fNorm, color: C.mauve },
    { norm: sNorm, color: C.slate },
  ]

  return (
    <>
      <div className="page-title">RECORDS</div>

      {/* 切り替えボタン */}
      <div className="graph-range-btns">
        <button
          className={`graph-range-btn${range === 7 ? ' active' : ''}`}
          onClick={() => setRange(7)}
        >1週間</button>
        <button
          className={`graph-range-btn${range === 30 ? ' active' : ''}`}
          onClick={() => setRange(30)}
        >1ヶ月</button>
      </div>

      {/* 最新値サマリー */}
      <div className="graph-summary">
        {[
          { label: '体重',   val: latestWeight, unit: 'kg', color: C.leather },
          { label: '体脂肪', val: latestFat,    unit: '%',  color: C.mauve   },
          { label: '睡眠',   val: latestSleep,  unit: 'h',  color: C.slate   },
          { label: '運動',   val: days.filter(d => d.exercise).length, unit: '日', color: C.sage },
        ].map(({ label, val, unit, color }) => (
          <div key={label} className="graph-summary-item">
            <div className="graph-summary-label" style={{ color }}>{label}</div>
            <div className="graph-summary-val" style={{ color }}>
              {val !== null ? `${val}${unit}` : '—'}
            </div>
          </div>
        ))}
      </div>

      {/* ── メインチャート ── */}
      <div className="graph-scroll">
        <svg
          width={SVG_W} height={SVG_H}
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          style={{ display: 'block' }}
        >
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

          {/* セクション境界線 */}
          <line x1={0} y1={DATE_H + SHIFT_H} x2={SVG_W} y2={DATE_H + SHIFT_H}
            stroke="rgba(180,162,140,0.25)" strokeWidth="1" />

          {/* 各日列 */}
          {days.map((day, i) => {
            const cx   = i * DAY_W
            const isWe = day.d.getDay() === 0 || day.d.getDay() === 6

            return (
              <g key={day.ds}>
                {/* シフト背景帯（日付行を除く全縦） */}
                {day.shift && (
                  <rect x={cx} y={DATE_H} width={DAY_W}
                    height={SHIFT_H + LINE_H}
                    fill={day.shift.c} opacity="0.09" />
                )}

                {/* 列縦線 */}
                <line x1={cx} y1={0} x2={cx} y2={SVG_H}
                  stroke="rgba(180,162,140,0.1)" strokeWidth="0.5" />

                {/* 日付 */}
                <text x={cx + DAY_W / 2} y={13}
                  textAnchor="middle" fontSize={range === 7 ? 10 : 7}
                  fill={isWe ? '#C4897A' : C.inkM} fontWeight={isWe ? '600' : '400'}
                >
                  {day.d.getMonth() + 1}/{day.d.getDate()}
                </text>
                {/* 曜日 */}
                <text x={cx + DAY_W / 2} y={25}
                  textAnchor="middle" fontSize={range === 7 ? 8 : 6}
                  fill={isWe ? '#C4897A' : C.inkL}
                >
                  {WJ[day.d.getDay()]}
                </text>
                {/* 気分絵文字 */}
                {day.mood !== null && (
                  <text x={cx + DAY_W / 2} y={43}
                    textAnchor="middle" fontSize={range === 7 ? 14 : 10}
                  >
                    {MOOD_EMOJIS[day.mood]}
                  </text>
                )}

                {/* シフトアイコン */}
                {day.shift && (
                  <text x={cx + DAY_W / 2} y={DATE_H + 16}
                    textAnchor="middle" fontSize={range === 7 ? 12 : 8}
                  >
                    {day.shift.m}
                  </text>
                )}

                {/* 運動マーク ● */}
                {day.exercise && (
                  <circle cx={cx + DAY_W / 2} cy={DATE_H + SHIFT_H - 5}
                    r={range === 7 ? 3.5 : 2.5} fill={C.sage} />
                )}
              </g>
            )
          })}

          {/* 折れ線グラフ */}
          {lines.map(({ norm, color }, li) => {
            const segs = buildSegments(norm)
            return (
              <g key={li} clipPath="url(#line-clip)">
                {segs.map((pts, si) => (
                  pts.length >= 2 && (
                    <polyline key={si} points={pts.join(' ')}
                      fill="none" stroke={color}
                      strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
                  )
                ))}
                {norm && days.map((_, i) => {
                  const v = norm.norm[i]
                  if (v === null) return null
                  return (
                    <circle key={i} cx={xc(i)} cy={yLine(v)} r="2.5"
                      fill={color} stroke="#FAF7F2" strokeWidth="1.2" />
                  )
                })}
              </g>
            )
          })}
        </svg>
      </div>

      {/* 凡例 */}
      <div className="graph-legend">
        <div className="graph-legend-group">
          {[
            { color: C.leather, label: '体重' },
            { color: C.mauve,   label: '体脂肪' },
            { color: C.slate,   label: '睡眠' },
          ].map(({ color, label }) => (
            <div key={label} className="graph-legend-item">
              <div style={{ width: 14, height: 2, background: color, borderRadius: 1 }} />
              <span>{label}</span>
            </div>
          ))}
          <div className="graph-legend-item">
            <div style={{ width: 8, height: 8, background: C.sage, borderRadius: '50%' }} />
            <span>運動</span>
          </div>
          {MOOD_EMOJIS.map((e, i) => (
            <div key={i} className="graph-legend-item">
              <span style={{ fontSize: 12 }}>{e}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
