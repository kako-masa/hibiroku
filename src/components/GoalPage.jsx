import { useState } from 'react'
import { C, d2s } from '../constants'

const todayS = d2s(new Date())

function GoalCard({ goal, onUpdate, onDelete }) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(goal.title)
  const [deadline, setDeadline] = useState(goal.deadline || '')
  const [note, setNote] = useState(goal.note || '')
  const [steps, setSteps] = useState(goal.steps || [])
  const [newStep, setNewStep] = useState('')

  const done = steps.filter(s => s.done).length
  const total = steps.length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  const daysLeft = deadline
    ? Math.ceil((new Date(deadline) - new Date(todayS)) / 86400000)
    : null

  const saveUpdates = (updates) => onUpdate({ ...goal, ...updates })

  const saveEdits = () => {
    saveUpdates({ title, deadline, note, steps })
    setEditing(false)
  }

  const toggleStep = (idx) => {
    const ns = steps.map((s, i) => i === idx ? { ...s, done: !s.done } : s)
    setSteps(ns)
    saveUpdates({ steps: ns })
  }

  const addStep = () => {
    if (!newStep.trim()) return
    const ns = [...steps, { text: newStep.trim(), done: false }]
    setSteps(ns)
    setNewStep('')
    saveUpdates({ steps: ns })
  }

  const removeStep = (idx) => {
    const ns = steps.filter((_, i) => i !== idx)
    setSteps(ns)
    saveUpdates({ steps: ns })
  }

  return (
    <div style={{ background: '#FFFDF9', borderRadius: 4, padding: 12, marginBottom: 8, border: '1px solid rgba(180,162,140,0.3)' }}>
      <div className="card-top" onClick={() => setOpen(!open)}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.ink, marginBottom: 6 }}>{goal.title}</div>
          <div className="gbar-track">
            <div className="gbar-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="gbar-sub" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
            <span>{done}/{total} ステップ ({pct}%)</span>
            {daysLeft !== null && (
              <span style={{ color: daysLeft < 7 ? C.rose : C.inkL }}>
                {daysLeft >= 0 ? `残${daysLeft}日` : `${Math.abs(daysLeft)}日超過`}
              </span>
            )}
          </div>
        </div>
        <span style={{ marginLeft: 8, color: C.inkL, fontSize: 10 }}>{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div className="card-expand">
          {editing ? (
            <div>
              <input className="date-input" style={{ marginBottom: 6 }} placeholder="目標タイトル" value={title} onChange={e => setTitle(e.target.value)} />
              <input className="date-input" type="date" style={{ marginBottom: 6 }} value={deadline} onChange={e => setDeadline(e.target.value)} />
              <textarea className="note-area" rows="3" placeholder="メモ・詳細" value={note} onChange={e => setNote(e.target.value)} />
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <button className="memo-save" onClick={saveEdits}>保存</button>
                <button className="close-btn" onClick={() => setEditing(false)}>キャンセル</button>
              </div>
            </div>
          ) : (
            <div>
              {goal.note && <div style={{ fontSize: 12, color: C.inkM, marginBottom: 6, lineHeight: 1.7 }}>{goal.note}</div>}
              {deadline && <div style={{ fontSize: 11, color: C.inkL, marginBottom: 6 }}>期限: {deadline}</div>}
              <button style={{ fontSize: 11, color: C.leather, background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }} onClick={() => setEditing(true)}>編集</button>
            </div>
          )}

          <div style={{ marginTop: 12 }}>
            <div className="sec-label">STEPS</div>
            {steps.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <input type="checkbox" checked={s.done} onChange={() => toggleStep(i)} style={{ accentColor: C.leather, width: 16, height: 16, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: s.done ? C.inkL : C.ink, textDecoration: s.done ? 'line-through' : 'none', flex: 1 }}>{s.text}</span>
                <button className="del-btn" style={{ marginTop: 0 }} onClick={() => removeStep(i)}>×</button>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              <input className="ex-note-input" style={{ flex: 1 }} placeholder="ステップを追加…" value={newStep} onChange={e => setNewStep(e.target.value)} onKeyDown={e => e.key === 'Enter' && addStep()} />
              <button className="memo-save" onClick={addStep}>追加</button>
            </div>
          </div>
          <button className="del-btn" style={{ marginTop: 12 }} onClick={() => onDelete(goal.id)}>この目標を削除</button>
        </div>
      )}
    </div>
  )
}

export default function GoalPage({ state, actions }) {
  const { goals } = state
  const { updateGoals } = actions
  const [adding, setAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDeadline, setNewDeadline] = useState('')

  const addGoal = () => {
    if (!newTitle.trim()) return
    updateGoals([...goals, { id: Date.now(), title: newTitle.trim(), deadline: newDeadline, note: '', steps: [], createdAt: todayS }])
    setNewTitle('')
    setNewDeadline('')
    setAdding(false)
  }

  const updateGoal = (updated) => updateGoals(goals.map(g => g.id === updated.id ? updated : g))
  const deleteGoal = (id) => updateGoals(goals.filter(g => g.id !== id))

  return (
    <>
      <div className="page-title">GOALS</div>
      {goals.length === 0 && !adding && <div className="empty-msg">目標がまだありません</div>}
      {goals.map(g => <GoalCard key={g.id} goal={g} onUpdate={updateGoal} onDelete={deleteGoal} />)}
      {adding ? (
        <div style={{ background: '#EDE7DC', padding: 12, borderRadius: 4, marginTop: 8 }}>
          <input className="date-input" style={{ marginBottom: 8 }} placeholder="目標タイトル" value={newTitle} onChange={e => setNewTitle(e.target.value)} autoFocus />
          <input className="date-input" type="date" style={{ marginBottom: 8 }} value={newDeadline} onChange={e => setNewDeadline(e.target.value)} />
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="memo-save" style={{ flex: 1 }} onClick={addGoal}>追加</button>
            <button className="close-btn" onClick={() => setAdding(false)}>キャンセル</button>
          </div>
        </div>
      ) : (
        <button className="ai-btn" style={{ marginTop: 12 }} onClick={() => setAdding(true)}>+ 新しい目標を追加</button>
      )}
    </>
  )
}
