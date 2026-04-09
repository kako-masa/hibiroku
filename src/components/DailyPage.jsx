import { useState } from 'react'
import { C, SHIFTS, MOODS, WJ, WE, d2s, save } from '../constants'

const today = new Date()
const todayS = d2s(today)

export default function DailyPage({ state, actions }) {
  const { date, rec, sh, learn } = state
  const { setDate, setMiniYm, updateRec, updateLearn } = actions
  const [shiftOpen, setShiftOpen] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState(null)
  const [aiSaved, setAiSaved] = useState(false)

  const dateObj = new Date(date.replace(/-/g, '/'))
  const isToday = date === todayS
  const r = rec[date] || {}
  const shKey = r.shift || sh[date]
  const shift = shKey ? SHIFTS[shKey] : null

  const prevRec = (() => {
    const dates = Object.keys(rec).filter(d => d < date).sort().reverse()
    for (const d of dates) {
      const rv = rec[d]
      if (rv && (rv.weight || rv.fat || rv.sleep)) return rv
    }
    return {}
  })()

  const setRecField = (key, value) => {
    const newRec = { ...rec, [date]: { ...rec[date], [key]: value } }
    updateRec(newRec)
  }

  const goDay = (delta) => {
    const nd = new Date(date.replace(/-/g, '/'))
    nd.setDate(nd.getDate() + delta)
    const ds = d2s(nd)
    setDate(ds)
    setMiniYm({ y: nd.getFullYear(), m: nd.getMonth() })
    setAiResult(null)
    setAiSaved(false)
  }

  const selectShift = (key) => {
    const newSh = { ...sh, [date]: key }
    const newRec = { ...rec, [date]: { ...rec[date], shift: key } }
    updateRec(newRec)
    actions.updateSh(newSh)
    setShiftOpen(false)
  }

  const handleNote = (e) => {
    const newRec = { ...rec, [date]: { ...rec[date], note: e.target.value } }
    save('hbr-rec', newRec)
  }

  const handleExNote = (e) => {
    const newRec = { ...rec, [date]: { ...rec[date], exNote: e.target.value } }
    save('hbr-rec', newRec)
  }

  const fetchAI = async () => {
    setAiLoading(true)
    setAiResult(null)
    const sl = shift?.l || '未設定'
    const moodLabel = r.mood !== undefined ? MOODS[r.mood] : '未'
    const prompt = `看護師サポートAI。【${date}】シフト:${sl}/体重:${r.weight || '未'}kg/体脂肪:${r.fat || '未'}%/睡眠:${r.sleep || '未'}h/気分:${moodLabel}/運動:${r.exercise ? (r.exNote || 'あり') : 'なし'}/日記:${r.note || 'なし'}\n以下JSONのみ(バックティック不要):{"advice":"アドバイス3点(番号改行)","workResources":[{"title":"名称","url":"https://...","description":"説明1文"}],"otherResources":[{"title":"名称","url":"https://...","description":"説明1文"}]}\nworkは看護・緩和ケア関連1〜2件、otherは健康・生活1〜2件。`
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_ANTHROPIC_KEY || '',
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      const data = await res.json()
      const raw = data.content?.map(b => b.text || '').join('') || ''
      const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())
      setAiResult(parsed)
    } catch {
      setAiResult({ error: true })
    }
    setAiLoading(false)
  }

  const saveToLearn = () => {
    if (!aiResult) return
    const items = [
      ...(aiResult.workResources || []).map(r => ({
        id: 'w' + Date.now() + Math.random(), ...r,
        category: 'work', addedDate: date, read: false, memo: '',
      })),
      ...(aiResult.otherResources || []).map(r => ({
        id: 'o' + Date.now() + Math.random(), ...r,
        category: 'other', addedDate: date, read: false, memo: '',
      })),
    ]
    const existing = new Set(learn.map(i => i.url || i.title))
    const fresh = items.filter(i => !existing.has(i.url || i.title))
    if (fresh.length) updateLearn([...learn, ...fresh])
    setAiSaved(true)
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <div id="date-bar">
        <button className="arrow-btn" onClick={() => goDay(-1)}>‹</button>
        <div className="date-center">
          <div className="date-dow-en">{WE[dateObj.getDay()]}</div>
          <div className="date-num">
            {dateObj.getMonth() + 1}
            <span className="date-slash">/</span>
            {dateObj.getDate()}
          </div>
          <div className="date-dow">
            {WJ[dateObj.getDay()]}曜日
            {isToday && <span className="date-today">Today</span>}
          </div>
        </div>
        <button className="arrow-btn" onClick={() => goDay(1)}>›</button>
      </div>
      <div className="date-str">{date}</div>

      <div style={{ padding: '10px 16px 30px' }}>
        {/* シフト */}
        <div className="ruled">
          <div className="sec-label">SHIFT</div>
          <button
            className="shift-btn"
            style={{ background: shift ? shift.bg : C.cream, borderColor: shift ? shift.c : C.rule }}
            onClick={() => setShiftOpen(!shiftOpen)}
          >
            {shift ? (
              <>
                <span style={{ color: shift.c, fontWeight: 700, marginRight: 8, fontSize: 15 }}>{shift.m}</span>
                <span style={{ color: shift.c }}>{shift.l}</span>
              </>
            ) : (
              <span style={{ color: C.inkL }}>シフトを選択</span>
            )}
            <span style={{ marginLeft: 'auto', color: C.inkL, fontSize: 10 }}>▼</span>
          </button>
          {shiftOpen && (
            <div className="shift-grid">
              {Object.entries(SHIFTS).map(([key, s]) => (
                <button
                  key={key}
                  className="shift-opt"
                  style={{
                    background: shKey === key ? s.c : s.bg,
                    color: shKey === key ? '#fff' : s.c,
                    border: `1.5px solid ${s.c}`,
                  }}
                  onClick={() => selectShift(key)}
                >
                  {s.m} {s.l}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* バイタル */}
        <div className="ruled">
          <div className="sec-label">VITALS</div>
          <div className="vitals-row">
            {[
              { key: 'weight', label: '体重', unit: 'kg', step: '0.1', placeholder: prevRec.weight ? `前回 ${prevRec.weight}` : '58.0' },
              { key: 'fat',    label: '体脂肪', unit: '%', step: '0.1', placeholder: prevRec.fat ? `前回 ${prevRec.fat}` : '25.0' },
              { key: 'sleep',  label: '睡眠',   unit: 'h', step: '0.1', placeholder: prevRec.sleep ? `前回 ${prevRec.sleep}` : '7.0' },
            ].map(({ key, label, unit, step, placeholder }) => (
              <div key={key} className="vital-box">
                <div className="vital-label">{label}</div>
                <input
                  className="vital-input"
                  type="number"
                  step={step}
                  defaultValue={r[key] || ''}
                  placeholder={placeholder}
                  onBlur={(e) => setRecField(key, e.target.value)}
                />
                <div className="vital-unit">{unit}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 気分・運動 */}
        <div className="ruled">
          <div className="sec-label">MOOD & ACTIVITY</div>
          <div className="mood-row">
            {MOODS.map((mood, i) => {
              const parts = mood.split(' ')
              const emoji = parts[0]
              const label = parts.slice(1).join(' ')
              return (
                <button
                  key={i}
                  className={`mood-btn${r.mood === i ? ' active' : ''}`}
                  onClick={() => setRecField('mood', i)}
                >
                  <span className="mood-emoji">{emoji}</span>
                  <span className="mood-text">{label}</span>
                </button>
              )
            })}
          </div>
          <button
            className={`ex-btn${r.exercise ? ' active' : ''}`}
            onClick={() => setRecField('exercise', !r.exercise)}
          >
            {r.exercise ? '✓ 運動した' : '+ 運動の記録'}
          </button>
          {r.exercise && (
            <div style={{ marginTop: 8 }}>
              <input
                className="ex-note-input"
                type="text"
                defaultValue={r.exNote || ''}
                placeholder="ウォーキング30分、ストレッチ… など"
                onBlur={handleExNote}
              />
            </div>
          )}
        </div>

        {/* 日記 */}
        <div className="ruled">
          <div className="sec-label">DAILY NOTE</div>
          <textarea
            className="note-area"
            rows="5"
            placeholder="今日のこと、気になったこと、感じたこと…"
            defaultValue={r.note || ''}
            key={date}
            onBlur={handleNote}
          />
        </div>

        {/* AI アドバイス */}
        <div>
          <div className="sec-label">AI ADVICE & READING</div>
          <button
            className="ai-btn"
            style={{ marginTop: 6 }}
            onClick={fetchAI}
            disabled={aiLoading}
          >
            {aiLoading ? '⏳ 分析中…' : '今日の記録からアドバイスをもらう'}
          </button>

          {aiResult && !aiResult.error && (
            <div>
              <div className="ai-box">
                <div className="ai-box-label">Advice</div>
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 2, fontSize: 13, color: C.ink }}>
                  {aiResult.advice}
                </div>
              </div>
              {[
                { list: aiResult.workResources, label: '仕事・看護', mark: '💼' },
                { list: aiResult.otherResources, label: '趣味・健康', mark: '🌱' },
              ].map(({ list, label, mark }) =>
                list?.length ? (
                  <div key={label} style={{ marginTop: 10 }}>
                    <div className="res-group-label">{mark} {label}</div>
                    {list.map((item, i) => (
                      <div key={i} className="res-item">
                        <div className="res-title">{item.title}</div>
                        <div className="res-desc">{item.description}</div>
                        {item.url && item.url !== 'N/A' && (
                          <a className="res-link" href={item.url} target="_blank" rel="noreferrer">→ 開く</a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : null
              )}
              <button className="save-res-btn" onClick={saveToLearn} disabled={aiSaved}>
                {aiSaved ? '✓ 保存済み' : '学びタブに保存 →'}
              </button>
              {aiSaved && <div className="saved-msg">✓ 学びタブに保存しました</div>}
            </div>
          )}
          {aiResult?.error && (
            <div className="ai-box" style={{ marginTop: 10 }}>
              <p style={{ fontSize: 13, color: C.ink }}>取得に失敗しました。もう一度お試しください。</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
