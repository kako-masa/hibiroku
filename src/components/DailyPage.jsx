import { useState, useRef } from 'react'
import { C, SHIFTS, MOODS, WJ, WE, d2s, pad, save } from '../constants'

const today = new Date()
const todayS = d2s(today)

// 指定日にその習慣が完了しているか
function isHabitDone(task, rec, date) {
  if (task.linkedTo === 'weight') return !!(rec[date]?.weight)
  if (task.linkedTo === 'exercise') return !!(rec[date]?.exercise)
  return !!(task.dailyDone?.[date])
}

export default function DailyPage({ state, actions }) {
  const { date, rec, sh, learn, miniYm, goals } = state
  const { setDate, setMiniYm, updateRec, updateLearn, updateGoals } = actions
  const [calOpen, setCalOpen] = useState(false)
  const [shiftOpen, setShiftOpen] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState(null)
  const [aiError, setAiError] = useState(null)
  const [aiSaved, setAiSaved] = useState(false)
  const [noteInput, setNoteInput] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [habitOpen, setHabitOpen] = useState(() => {
    try { return JSON.parse(localStorage.getItem('hbr-habit-open') ?? 'true') } catch { return true }
  })
  const [isListening, setIsListening] = useState(false)
  const noteRef = useRef(null)
  const recognitionRef = useRef(null)
  const voiceBaseRef = useRef('')

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

  const goCalMonth = (delta) => {
    const d = new Date(miniYm.y, miniYm.m + delta, 1)
    setMiniYm({ y: d.getFullYear(), m: d.getMonth() })
  }

  const goDay = (delta) => {
    const nd = new Date(date.replace(/-/g, '/'))
    nd.setDate(nd.getDate() + delta)
    const ds = d2s(nd)
    setDate(ds)
    setMiniYm({ y: nd.getFullYear(), m: nd.getMonth() })
    setAiResult(null)
    setAiError(null)
    setAiSaved(false)
    setNoteInput('')
  }

  const selectShift = (key) => {
    const newSh = { ...sh, [date]: key }
    const newRec = { ...rec, [date]: { ...rec[date], shift: key } }
    updateRec(newRec)
    actions.updateSh(newSh)
    setShiftOpen(false)
  }

  const addNote = () => {
    const text = noteInput.trim()
    if (!text) return
    const now = new Date()
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    const entry = { id: Date.now().toString(), time, text }
    const existing = r.notes || []
    const newRec = { ...rec, [date]: { ...rec[date], notes: [...existing, entry] } }
    updateRec(newRec)
    setNoteInput('')
    setEditingId(null)
    if (noteRef.current) noteRef.current.focus()
  }

  const startEdit = (n) => {
    setEditingId(n.id)
    setEditText(n.text)
  }

  const saveEdit = (id) => {
    const text = editText.trim()
    if (!text) return
    const newNotes = (r.notes || []).map(n => n.id === id ? { ...n, text } : n)
    const newRec = { ...rec, [date]: { ...rec[date], notes: newNotes } }
    updateRec(newRec)
    setEditingId(null)
    setEditText('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditText('')
  }

  const deleteNote = (id) => {
    const existing = r.notes || []
    const newRec = { ...rec, [date]: { ...rec[date], notes: existing.filter(n => n.id !== id) } }
    updateRec(newRec)
  }

  const handleExNote = (e) => {
    const newRec = { ...rec, [date]: { ...rec[date], exNote: e.target.value } }
    save('hbr-rec', newRec)
  }

  const toggleVoice = () => {
    if (isListening) {
      recognitionRef.current?.stop()
      return
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      alert('このブラウザは音声認識に対応していません。\nChromeまたはEdgeをお使いください。')
      return
    }
    const recognition = new SR()
    recognition.lang = 'ja-JP'
    recognition.continuous = true
    recognition.interimResults = true
    voiceBaseRef.current = noteInput
    recognition.onresult = (e) => {
      let interim = ''
      let finalText = voiceBaseRef.current
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          finalText += e.results[i][0].transcript
          voiceBaseRef.current = finalText
        } else {
          interim += e.results[i][0].transcript
        }
      }
      setNoteInput(finalText + interim)
    }
    recognition.onend = () => {
      setIsListening(false)
      setNoteInput(voiceBaseRef.current)
      if (noteRef.current) noteRef.current.focus()
    }
    recognition.onerror = (e) => {
      if (e.error !== 'aborted') console.warn('音声認識エラー:', e.error)
      setIsListening(false)
    }
    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }

  // ハビットトラッカー：選択中の日付のチェックをgoalsに反映
  const toggleHabitForDate = (goalId, taskId) => {
    const updated = (goals || []).map(g => {
      if (g.id !== goalId) return g
      return {
        ...g,
        habitTasks: (g.habitTasks || []).map(t => {
          if (t.id !== taskId) return t
          const prev = t.dailyDone?.[date]
          return { ...t, dailyDone: { ...(t.dailyDone || {}), [date]: !prev } }
        })
      }
    })
    updateGoals(updated)
  }

  const toggleHabitOpen = () => {
    setHabitOpen(v => {
      const next = !v
      try { localStorage.setItem('hbr-habit-open', JSON.stringify(next)) } catch {}
      return next
    })
  }

  // 目標体重・体脂肪をlocalStorageから読む（GraphPageで保存）
  const goalWeight = (() => { try { const v = localStorage.getItem('hbr-goal-weight'); return v ? parseFloat(v) : null } catch { return null } })()
  const goalFat    = (() => { try { const v = localStorage.getItem('hbr-goal-fat');    return v ? parseFloat(v) : null } catch { return null } })()

  // 習慣グループ：habitTasksがあるgoalのみ
  const habitGroups = (goals || [])
    .filter(g => (g.habitTasks || []).length > 0)
    .map(g => ({
      goalId: g.id,
      goalTitle: g.title,
      tasks: g.habitTasks || []
    }))

  const totalHabits = habitGroups.reduce((s, g) => s + g.tasks.length, 0)
  const doneHabits = habitGroups.reduce((s, g) => s + g.tasks.filter(t => isHabitDone(t, rec, date)).length, 0)

  const fetchAI = async () => {
    setAiLoading(true)
    setAiResult(null)
    setAiError(null)
    const sl = shift?.l || '未設定'
    const moodLabel = r.mood !== undefined ? MOODS[r.mood] : '未'
    const noteText = (r.notes || []).map(n => `[${n.time}] ${n.text}`).join(' / ') || r.note || 'なし'
    const prompt = `看護師サポートAI。【${date}】シフト:${sl}/体重:${r.weight || '未'}kg/体脂肪:${r.fat || '未'}%/睡眠:${r.sleep || '未'}h/気分:${moodLabel}/運動:${r.exercise ? (r.exNote || 'あり') : 'なし'}/日記:${noteText}\n以下JSONのみ(バックティック不要):{"advice":"アドバイス3点(番号改行)","workResources":[{"title":"名称","url":"https://...","description":"説明1文"}],"otherResources":[{"title":"名称","url":"https://...","description":"説明1文"}]}\nworkは看護・緩和ケア関連1〜2件、otherは健康・生活1〜2件。`
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      const data = await res.json()
      if (!res.ok) {
        const msg = data.error?.message || `APIエラー (${res.status})`
        setAiError(msg)
        setAiLoading(false)
        return
      }
      const raw = data.content?.map(b => b.text || '').join('') || ''
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        setAiError('レスポンスのJSON解析に失敗しました。もう一度お試しください。')
        setAiLoading(false)
        return
      }
      const parsed = JSON.parse(jsonMatch[0])
      setAiResult(parsed)
    } catch (err) {
      setAiError(err.message || '通信エラーが発生しました。')
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
      {/* ── インラインカレンダー ── */}
      <div className="dcal-wrap">
        <button className="dcal-toggle" onClick={() => setCalOpen(o => !o)}>
          <span className="dcal-toggle-ym">{miniYm.y}年 {miniYm.m + 1}月</span>
          <span className="dcal-toggle-arrow">{calOpen ? '▲ 閉じる' : '▼ カレンダー'}</span>
        </button>
        {calOpen && (
          <div className="dcal-body">
            <div className="dcal-nav">
              <button className="dcal-nav-btn" onClick={() => goCalMonth(-1)}>‹</button>
              <span className="dcal-nav-ym">{miniYm.y}年 {miniYm.m + 1}月</span>
              <button className="dcal-nav-btn" onClick={() => goCalMonth(1)}>›</button>
            </div>
            <div className="dcal-grid">
              {WJ.map((w, i) => (
                <div key={w} className="dcal-hd"
                  style={{ color: i === 0 ? '#A06060' : i === 6 ? '#607080' : C.inkL }}>
                  {w}
                </div>
              ))}
              {Array.from({ length: new Date(miniYm.y, miniYm.m, 1).getDay() }).map((_, i) => (
                <div key={`e${i}`} />
              ))}
              {Array.from({ length: new Date(miniYm.y, miniYm.m + 1, 0).getDate() }).map((_, i) => {
                const day = i + 1
                const ds = `${miniYm.y}-${pad(miniYm.m + 1)}-${pad(day)}`
                const sk = sh[ds] || rec[ds]?.shift
                const sv = sk ? SHIFTS[sk] : null
                const isToday = ds === todayS
                const isSel = ds === date
                const plans = rec[ds]?.plans || []
                const hasRec = rec[ds] && (
                  rec[ds].weight || rec[ds].sleep || rec[ds].fat ||
                  rec[ds].note || rec[ds].notes?.length || rec[ds].mood !== undefined
                )
                return (
                  <button
                    key={ds}
                    className={`dcal-cell${isToday ? ' dcal-today' : ''}${isSel ? ' dcal-sel' : ''}`}
                    style={{ background: sv ? sv.bg : 'transparent' }}
                    onClick={() => {
                      setDate(ds)
                      setNoteInput('')
                      setEditingId(null)
                    }}
                  >
                    <span className="dcal-day"
                      style={{ color: sv ? sv.c : isToday ? C.leatherM : C.ink }}>
                      {day}
                    </span>
                    {sv && <span className="dcal-shift" style={{ color: sv.c }}>{sv.m}</span>}
                    {plans.slice(0, 2).map(p => (
                      <span key={p.id} className="dcal-plan-title">{p.text}</span>
                    ))}
                    {plans.length > 2 && (
                      <span className="dcal-plan-more">+{plans.length - 2}</span>
                    )}
                    {hasRec && plans.length === 0 && <span className="dcal-dot" />}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

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

        {/* ── 今日のハビットトラッカー ── */}
        {totalHabits > 0 && (
          <div style={{
            background: '#FFFDF9',
            border: '1px solid rgba(107,79,58,0.2)',
            borderRadius: 6,
            marginBottom: 12,
            overflow: 'hidden'
          }}>
            {/* トグルヘッダー */}
            <button
              onClick={toggleHabitOpen}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 12px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: C.leather }}>
                  {isToday ? '今日のハビット' : `${dateObj.getMonth()+1}/${dateObj.getDate()} のハビット`}
                </span>
                {/* ミニ進捗バー */}
                <div style={{ width: 60, height: 4, background: '#EDE7DC', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${totalHabits > 0 ? Math.round((doneHabits / totalHabits) * 100) : 0}%`,
                    background: C.leather,
                    borderRadius: 2,
                    transition: 'width 0.3s'
                  }} />
                </div>
                <span style={{ fontSize: 10, color: C.inkL }}>{doneHabits}/{totalHabits}</span>
              </div>
              <span style={{ fontSize: 9, color: C.inkL }}>{habitOpen ? '▲' : '▼'}</span>
            </button>

            {habitOpen && (
              <div style={{ padding: '0 12px 10px' }}>
                {habitGroups.map((group, gi) => (
                  <div key={group.goalId} style={{ marginTop: gi === 0 ? 0 : 10 }}>
                    {/* 目標名（カテゴリ） */}
                    <div style={{
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: 1,
                      color: C.inkL,
                      textTransform: 'uppercase',
                      marginBottom: 6,
                      paddingBottom: 4,
                      borderBottom: `1px solid rgba(180,162,140,0.2)`
                    }}>
                      {group.goalTitle}
                    </div>
                    {group.tasks.map(task => {
                      const done = isHabitDone(task, rec, date)
                      const isLinked = !!task.linkedTo
                      return (
                        <div
                          key={task.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 9,
                            marginBottom: 7,
                            opacity: done ? 0.6 : 1,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={done}
                            disabled={isLinked}
                            onChange={() => !isLinked && toggleHabitForDate(group.goalId, task.id)}
                            style={{
                              accentColor: C.leather,
                              width: 17,
                              height: 17,
                              flexShrink: 0,
                              cursor: isLinked ? 'default' : 'pointer'
                            }}
                          />
                          <span style={{
                            fontSize: 13,
                            color: done ? C.inkL : C.ink,
                            textDecoration: done ? 'line-through' : 'none',
                            flex: 1,
                            lineHeight: 1.4
                          }}>
                            {task.text}
                          </span>
                          {isLinked && (
                            <span style={{
                              fontSize: 9,
                              background: '#EDE7DC',
                              color: C.leather,
                              borderRadius: 3,
                              padding: '1px 5px',
                              flexShrink: 0,
                              fontWeight: 600
                            }}>
                              自動
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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
              { key: 'weight', label: '体重', unit: 'kg', step: '0.1', placeholder: prevRec.weight ? `前回 ${prevRec.weight}` : '58.0', goal: goalWeight },
              { key: 'fat',    label: '体脂肪', unit: '%', step: '0.1', placeholder: prevRec.fat ? `前回 ${prevRec.fat}` : '25.0',  goal: goalFat    },
              { key: 'sleep',  label: '睡眠',   unit: 'h', step: '0.1', placeholder: prevRec.sleep ? `前回 ${prevRec.sleep}` : '7.0', goal: null       },
            ].map(({ key, label, unit, step, placeholder, goal }) => {
              const curVal = parseFloat(r[key])
              const diff = (!isNaN(curVal) && goal !== null) ? Math.abs(curVal - goal) : null
              const reached = diff !== null && diff < 0.05
              return (
                <div key={`${date}-${key}`} className="vital-box">
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
                  {goal !== null && (
                    <div style={{ fontSize: 8, color: '#9C8070', marginTop: 3, textAlign: 'center', lineHeight: 1.5 }}>
                      目標 {goal}{unit}
                      {reached && <><br />✓ 達成</>}
                      {!reached && diff !== null && <><br />あと {diff.toFixed(1)}{unit}</>}
                    </div>
                  )}
                </div>
              )
            })}
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
          <div className="note-input-wrap">
            <textarea
              ref={noteRef}
              className={`note-area${isListening ? ' note-area-listening' : ''}`}
              rows="3"
              placeholder="今日のこと、気になったこと、感じたこと…"
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); addNote() }
              }}
            />
            <div className="note-btn-row">
              <button
                className={`mic-btn${isListening ? ' mic-listening' : ''}`}
                onClick={toggleVoice}
                title={isListening ? '録音を停止' : '音声入力'}
                type="button"
              >
                {isListening ? '⏹' : '🎤'}
              </button>
              <button
                className="note-add-btn"
                onClick={addNote}
                disabled={!noteInput.trim()}
              >
                保存
              </button>
            </div>
          </div>
          {r.note && !(r.notes?.length) && (
            <div className="note-legacy">
              <span className="note-entry-time">—</span>
              <span className="note-entry-text">{r.note}</span>
            </div>
          )}
          {(r.notes || []).map((n) => (
            <div key={n.id} className="note-entry">
              <div className="note-entry-header">
                <span className="note-entry-time">{n.time}</span>
                <div className="note-entry-actions">
                  {editingId !== n.id && (
                    <button className="note-edit-btn" onClick={() => startEdit(n)}>編集</button>
                  )}
                  <button className="note-del-btn" onClick={() => deleteNote(n.id)}>削除</button>
                </div>
              </div>
              {editingId === n.id ? (
                <div className="note-edit-wrap">
                  <textarea
                    className="note-area note-edit-area"
                    rows="3"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); saveEdit(n.id) }
                      if (e.key === 'Escape') cancelEdit()
                    }}
                    autoFocus
                  />
                  <div className="note-edit-btns">
                    <button className="note-edit-cancel-btn" onClick={cancelEdit}>キャンセル</button>
                    <button className="note-add-btn" onClick={() => saveEdit(n.id)} disabled={!editText.trim()}>保存</button>
                  </div>
                </div>
              ) : (
                <div className="note-entry-text">{n.text}</div>
              )}
            </div>
          ))}
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
          {aiError && (
            <div className="ai-box" style={{ marginTop: 10 }}>
              <p style={{ fontSize: 13, color: '#c0392b', margin: 0 }}>⚠️ {aiError}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
