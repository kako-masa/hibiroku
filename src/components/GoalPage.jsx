import { useState } from 'react'
import { C, d2s } from '../constants'

const todayS = d2s(new Date())

// Get Monday date string for a given date string
function getMondayStr(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDay() // 0=Sun
  const diff = day === 0 ? -6 : 1 - day
  const mon = new Date(d)
  mon.setDate(d.getDate() + diff)
  return d2s(mon)
}

// Get all 7 date strings for the week starting at mondayStr
function getWeekDates(mondayStr) {
  const mon = new Date(mondayStr + 'T00:00:00')
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon)
    d.setDate(mon.getDate() + i)
    return d2s(d)
  })
}

const currentMonday = getMondayStr(todayS)
const currentWeekDates = getWeekDates(currentMonday)

function isHabitDone(task, rec) {
  if (task.linkedTo === 'weight') {
    return currentWeekDates.some(d => rec[d]?.weight)
  }
  if (task.linkedTo === 'exercise') {
    return currentWeekDates.some(d => rec[d]?.exercise)
  }
  return !!(task.weeklyDone?.[currentMonday])
}

function calcProgress(goal, rec) {
  const habits = goal.habitTasks || []
  const todos = goal.todoTasks || []
  const total = habits.length + todos.length
  if (total === 0) return 0
  const habitDone = habits.filter(h => isHabitDone(h, rec)).length
  const todoDone = todos.filter(t => t.done).length
  return Math.round(((habitDone + todoDone) / total) * 100)
}

function HabitTaskItem({ task, rec, onToggle, onDelete }) {
  const done = isHabitDone(task, rec)
  const isLinked = !!task.linkedTo

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
      <input
        type="checkbox"
        checked={done}
        disabled={isLinked}
        onChange={() => !isLinked && onToggle()}
        style={{ accentColor: C.leather, width: 16, height: 16, flexShrink: 0, cursor: isLinked ? 'default' : 'pointer' }}
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
          padding: '2px 5px',
          flexShrink: 0,
          fontWeight: 600
        }}>
          日記連動
        </span>
      )}
      {!isLinked && (
        <button className="del-btn" style={{ marginTop: 0 }} onClick={onDelete}>x</button>
      )}
    </div>
  )
}

function TodoTaskItem({ task, onToggle, onDelete }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
      <input
        type="checkbox"
        checked={task.done}
        onChange={onToggle}
        style={{ accentColor: C.sage, width: 16, height: 16, flexShrink: 0, cursor: 'pointer' }}
      />
      <span style={{
        fontSize: 13,
        color: task.done ? C.inkL : C.ink,
        textDecoration: task.done ? 'line-through' : 'none',
        flex: 1,
        lineHeight: 1.4
      }}>
        {task.text}
      </span>
      <button className="del-btn" style={{ marginTop: 0 }} onClick={onDelete}>x</button>
    </div>
  )
}

function GoalCard({ goal, rec, onUpdate, onDelete }) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(goal.title)
  const [deadline, setDeadline] = useState(goal.deadline || '')
  const [note, setNote] = useState(goal.note || '')
  const [newHabit, setNewHabit] = useState('')
  const [newTodo, setNewTodo] = useState('')
  const [showAddHabit, setShowAddHabit] = useState(false)
  const [showAddTodo, setShowAddTodo] = useState(false)

  const habitTasks = goal.habitTasks || []
  const todoTasks = goal.todoTasks || []
  const pct = calcProgress(goal, rec)
  const habitDone = habitTasks.filter(h => isHabitDone(h, rec)).length
  const todoDone = todoTasks.filter(t => t.done).length

  const daysLeft = goal.deadline
    ? Math.ceil((new Date(goal.deadline) - new Date(todayS)) / 86400000)
    : null

  const update = (patch) => onUpdate({ ...goal, ...patch })

  const saveEdits = () => {
    update({ title, deadline, note })
    setEditing(false)
  }

  const toggleHabit = (id) => {
    const task = habitTasks.find(h => h.id === id)
    if (!task || task.linkedTo) return
    const prev = task.weeklyDone?.[currentMonday]
    const weeklyDone = { ...(task.weeklyDone || {}), [currentMonday]: !prev }
    update({ habitTasks: habitTasks.map(h => h.id === id ? { ...h, weeklyDone } : h) })
  }

  const deleteHabit = (id) => update({ habitTasks: habitTasks.filter(h => h.id !== id) })

  const addHabit = (linkedTo = null) => {
    if (!linkedTo && !newHabit.trim()) return
    const text = linkedTo === 'weight' ? '体重を記録する'
      : linkedTo === 'exercise' ? '運動する'
      : newHabit.trim()
    const task = { id: Date.now(), text, linkedTo: linkedTo || null, weeklyDone: {} }
    update({ habitTasks: [...habitTasks, task] })
    setNewHabit('')
    setShowAddHabit(false)
  }

  const toggleTodo = (id) => {
    update({ todoTasks: todoTasks.map(t => t.id === id ? { ...t, done: !t.done } : t) })
  }

  const deleteTodo = (id) => update({ todoTasks: todoTasks.filter(t => t.id !== id) })

  const addTodo = () => {
    if (!newTodo.trim()) return
    const task = { id: Date.now(), text: newTodo.trim(), done: false }
    update({ todoTasks: [...todoTasks, task] })
    setNewTodo('')
    setShowAddTodo(false)
  }

  const hasWeightHabit = habitTasks.some(h => h.linkedTo === 'weight')
  const hasExerciseHabit = habitTasks.some(h => h.linkedTo === 'exercise')

  return (
    <div style={{
      background: C.ivory,
      borderRadius: 6,
      padding: 12,
      marginBottom: 10,
      border: '1px solid rgba(180,162,140,0.35)'
    }}>
      {/* Header */}
      <div className="card-top" onClick={() => setOpen(!open)}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.ink, marginBottom: 7 }}>
            {goal.title}
          </div>
          <div className="gbar-track">
            <div className="gbar-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="gbar-sub" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
            <span>
              {pct}%
              {(habitTasks.length > 0 || todoTasks.length > 0) && (
                <span style={{ color: C.inkL }}>
                  {habitTasks.length > 0 && <span> . 習慣 {habitDone}/{habitTasks.length}</span>}
                  {todoTasks.length > 0 && <span> . TODO {todoDone}/{todoTasks.length}</span>}
                </span>
              )}
            </span>
            {daysLeft !== null && (
              <span style={{ color: daysLeft < 7 ? C.rose : C.inkL }}>
                {daysLeft >= 0 ? `残${daysLeft}日` : `${Math.abs(daysLeft)}日超過`}
              </span>
            )}
          </div>
        </div>
        <span style={{ marginLeft: 8, color: C.inkL, fontSize: 10, flexShrink: 0, alignSelf: 'flex-start', marginTop: 2 }}>
          {open ? 'A' : 'V'}
        </span>
      </div>

      {open && (
        <div className="card-expand">
          {editing ? (
            <div style={{ marginBottom: 12 }}>
              <input
                className="date-input"
                style={{ marginBottom: 6 }}
                placeholder="目標タイトル"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
              <input
                className="date-input"
                type="date"
                style={{ marginBottom: 6 }}
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
              />
              <textarea
                className="note-area"
                rows="3"
                placeholder="メモ・詳細"
                value={note}
                onChange={e => setNote(e.target.value)}
              />
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <button className="memo-save" onClick={saveEdits}>保存</button>
                <button className="close-btn" onClick={() => setEditing(false)}>キャンセル</button>
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: 12 }}>
              {goal.note && (
                <div style={{ fontSize: 12, color: C.inkM, marginBottom: 4, lineHeight: 1.7 }}>{goal.note}</div>
              )}
              {goal.deadline && (
                <div style={{ fontSize: 11, color: C.inkL, marginBottom: 4 }}>期限: {goal.deadline}</div>
              )}
              <button
                style={{ fontSize: 11, color: C.leather, background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                onClick={() => setEditing(true)}
              >
                編集
              </button>
            </div>
          )}

          {/* 習慣タスク section */}
          <div style={{
            background: '#FAF7F2',
            borderRadius: 5,
            padding: '10px 10px 8px',
            marginBottom: 10,
            border: '1px solid rgba(107,79,58,0.15)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: C.leather }}>習慣タスク</span>
                <span style={{ fontSize: 9, color: C.inkL, background: '#EDE7DC', borderRadius: 3, padding: '1px 5px' }}>毎週リセット</span>
              </div>
              {habitTasks.length > 0 && (
                <span style={{ fontSize: 10, color: C.inkL }}>{habitDone}/{habitTasks.length}</span>
              )}
            </div>

            {habitTasks.length === 0 && !showAddHabit && (
              <div style={{ fontSize: 12, color: C.inkL, paddingBottom: 4 }}>習慣タスクなし</div>
            )}

            {habitTasks.map(task => (
              <HabitTaskItem
                key={task.id}
                task={task}
                rec={rec}
                onToggle={() => toggleHabit(task.id)}
                onDelete={() => deleteHabit(task.id)}
              />
            ))}

            {showAddHabit ? (
              <div style={{ marginTop: 6 }}>
                <input
                  className="ex-note-input"
                  style={{ width: '100%', marginBottom: 6, boxSizing: 'border-box' }}
                  placeholder="習慣タスク名..."
                  value={newHabit}
                  onChange={e => setNewHabit(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addHabit()}
                  autoFocus
                />
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  <button className="memo-save" onClick={() => addHabit()}>追加</button>
                  {!hasWeightHabit && (
                    <button className="close-btn" style={{ fontSize: 11 }} onClick={() => addHabit('weight')}>
                      体重記録
                    </button>
                  )}
                  {!hasExerciseHabit && (
                    <button className="close-btn" style={{ fontSize: 11 }} onClick={() => addHabit('exercise')}>
                      運動
                    </button>
                  )}
                  <button className="close-btn" onClick={() => { setShowAddHabit(false); setNewHabit('') }}>
                    キャンセル
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddHabit(true)}
                style={{
                  fontSize: 11,
                  color: C.leather,
                  background: 'transparent',
                  border: `1px dashed ${C.leather}`,
                  borderRadius: 4,
                  padding: '3px 10px',
                  cursor: 'pointer',
                  marginTop: habitTasks.length > 0 ? 4 : 0
                }}
              >
                + 習慣を追加
              </button>
            )}
          </div>

          {/* やることリスト section */}
          <div style={{
            background: '#FAF7F2',
            borderRadius: 5,
            padding: '10px 10px 8px',
            marginBottom: 10,
            border: '1px solid rgba(122,144,128,0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: C.sage }}>やることリスト</span>
                <span style={{ fontSize: 9, color: C.inkL, background: '#E4EDE8', borderRadius: 3, padding: '1px 5px' }}>一度きり</span>
              </div>
              {todoTasks.length > 0 && (
                <span style={{ fontSize: 10, color: C.inkL }}>{todoDone}/{todoTasks.length}</span>
              )}
            </div>

            {todoTasks.length === 0 && !showAddTodo && (
              <div style={{ fontSize: 12, color: C.inkL, paddingBottom: 4 }}>やることなし</div>
            )}

            {todoTasks.map(task => (
              <TodoTaskItem
                key={task.id}
                task={task}
                onToggle={() => toggleTodo(task.id)}
                onDelete={() => deleteTodo(task.id)}
              />
            ))}

            {showAddTodo ? (
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <input
                  className="ex-note-input"
                  style={{ flex: 1 }}
                  placeholder="やることを追加..."
                  value={newTodo}
                  onChange={e => setNewTodo(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addTodo()}
                  autoFocus
                />
                <button className="memo-save" onClick={addTodo}>追加</button>
                <button className="close-btn" onClick={() => { setShowAddTodo(false); setNewTodo('') }}>
                  x
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAddTodo(true)}
                style={{
                  fontSize: 11,
                  color: C.sage,
                  background: 'transparent',
                  border: `1px dashed ${C.sage}`,
                  borderRadius: 4,
                  padding: '3px 10px',
                  cursor: 'pointer',
                  marginTop: todoTasks.length > 0 ? 4 : 0
                }}
              >
                + やることを追加
              </button>
            )}
          </div>

          <button className="del-btn" style={{ marginTop: 4 }} onClick={() => onDelete(goal.id)}>
            この目標を削除
          </button>
        </div>
      )}
    </div>
  )
}

export default function GoalPage({ state, actions }) {
  const { goals, rec } = state
  const { updateGoals } = actions
  const [adding, setAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDeadline, setNewDeadline] = useState('')

  const addGoal = () => {
    if (!newTitle.trim()) return
    updateGoals([...goals, {
      id: Date.now(),
      title: newTitle.trim(),
      deadline: newDeadline,
      note: '',
      habitTasks: [],
      todoTasks: [],
      createdAt: todayS
    }])
    setNewTitle('')
    setNewDeadline('')
    setAdding(false)
  }

  const updateGoal = (updated) => updateGoals(goals.map(g => g.id === updated.id ? updated : g))
  const deleteGoal = (id) => updateGoals(goals.filter(g => g.id !== id))

  return (
    <>
      <div className="page-title">GOALS</div>
      {goals.length === 0 && !adding && (
        <div className="empty-msg">目標がまだありません</div>
      )}
      {goals.map(g => (
        <GoalCard
          key={g.id}
          goal={g}
          rec={rec}
          onUpdate={updateGoal}
          onDelete={deleteGoal}
        />
      ))}
      {adding ? (
        <div style={{
          background: '#EDE7DC',
          padding: 12,
          borderRadius: 6,
          marginTop: 8,
          border: '1px solid rgba(180,162,140,0.3)'
        }}>
          <input
            className="date-input"
            style={{ marginBottom: 8 }}
            placeholder="目標タイトル"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addGoal()}
            autoFocus
          />
          <input
            className="date-input"
            type="date"
            style={{ marginBottom: 8 }}
            value={newDeadline}
            onChange={e => setNewDeadline(e.target.value)}
          />
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="memo-save" style={{ flex: 1 }} onClick={addGoal}>追加</button>
            <button className="close-btn" onClick={() => setAdding(false)}>キャンセル</button>
          </div>
        </div>
      ) : (
        <button className="ai-btn" style={{ marginTop: 12 }} onClick={() => setAdding(true)}>
          + 新しい目標を追加
        </button>
      )}
    </>
  )
}
