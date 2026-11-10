import { useState, useRef } from 'react'
import { C, WJ, WE, d2s } from '../constants'

const todayS = d2s(new Date())

export default function DekitaPage({ state, actions }) {
  const { dekita } = state
  const { updateDekita } = actions
  const [date, setDate] = useState(todayS)
  const [input, setInput] = useState('')
  // editing: { id, field: 'text' | 'note' }
  const [editing, setEditing] = useState(null)
  const [editText, setEditText] = useState('')
  const inputRef = useRef(null)
  const topRef = useRef(null)

  const dateObj = new Date(date.replace(/-/g, '/'))
  const isToday = date === todayS
  const items = dekita[date] || []

  // その日のリストを置き換える（空になったら日付ごと消す）
  const setItems = (ds, list) => {
    const next = { ...dekita }
    if (list.length) next[ds] = list
    else delete next[ds]
    updateDekita(next)
  }

  const goDay = (delta) => {
    const nd = new Date(date.replace(/-/g, '/'))
    nd.setDate(nd.getDate() + delta)
    selectDate(d2s(nd))
  }

  const selectDate = (ds) => {
    setDate(ds)
    setInput('')
    setEditing(null)
  }

  const addItem = () => {
    const text = input.trim()
    if (!text) return
    setItems(date, [...items, { id: Date.now().toString(), text, note: '' }])
    setInput('')
    if (inputRef.current) inputRef.current.focus()
  }

  const startEdit = (item, field) => {
    setEditing({ id: item.id, field })
    setEditText(field === 'text' ? item.text : (item.note || ''))
  }

  const cancelEdit = () => {
    setEditing(null)
    setEditText('')
  }

  const saveEdit = () => {
    if (!editing) return
    const value = editText.trim()
    if (editing.field === 'text' && !value) return
    setItems(date, items.map(i => i.id === editing.id ? { ...i, [editing.field]: value } : i))
    cancelEdit()
  }

  const deleteItem = (id) => {
    setItems(date, items.filter(i => i.id !== id))
    if (editing?.id === id) cancelEdit()
  }

  const onEnter = (e, fn) => {
    if (e.nativeEvent.isComposing) return
    if (e.key === 'Enter') { e.preventDefault(); fn() }
    if (e.key === 'Escape') cancelEdit()
  }

  const pastDates = Object.keys(dekita)
    .filter(ds => ds !== date && dekita[ds]?.length)
    .sort()
    .reverse()

  const lineInput = {
    width: '100%', background: 'transparent', border: 'none',
    borderBottom: `1px solid ${C.rule}`, padding: '6px 0',
    fontSize: 16, color: C.ink, fontFamily: 'inherit', outline: 'none',
  }

  return (
    <>
      <div ref={topRef} className="page-title">DEKITA — できたこと</div>

      <div id="date-bar" style={{ padding: '4px 0 6px' }}>
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
      <div className="date-str">
        {date}
        {!isToday && (
          <button
            className="note-edit-btn"
            style={{ marginLeft: 10, fontSize: 10 }}
            onClick={() => selectDate(todayS)}
          >今日に戻る</button>
        )}
      </div>

      <div className="ruled" style={{ marginTop: 12 }}>
        <div className="sec-label">
          {isToday ? "TODAY'S DONE" : 'DONE'}{items.length > 0 && ` · ${items.length}`}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
          <input
            ref={inputRef}
            style={lineInput}
            placeholder="できたこと（例：お散歩に行けた）"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => onEnter(e, addItem)}
          />
          <button className="note-add-btn" onClick={addItem} disabled={!input.trim()} style={{ flexShrink: 0 }}>
            追加
          </button>
        </div>

        {items.length === 0 && (
          <div className="empty-msg" style={{ padding: '16px 0' }}>
            {isToday ? '今日できたことを、ひとつずつ書いてみましょう' : 'この日の記録はありません'}
          </div>
        )}

        {items.map(item => {
          const isEditingText = editing?.id === item.id && editing.field === 'text'
          const isEditingNote = editing?.id === item.id && editing.field === 'note'
          return (
            <div key={item.id} className="note-entry">
              {isEditingText ? (
                <div className="note-edit-wrap">
                  <input
                    autoFocus
                    style={{ ...lineInput, borderBottom: `1.5px solid ${C.leatherM}` }}
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    onKeyDown={e => onEnter(e, saveEdit)}
                  />
                  <div className="note-edit-btns">
                    <button className="note-edit-cancel-btn" onClick={cancelEdit}>キャンセル</button>
                    <button className="note-add-btn" onClick={saveEdit} disabled={!editText.trim()}>保存</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                  <div className="note-entry-text" style={{ flex: 1 }}>
                    <span style={{ color: C.sage, marginRight: 6 }}>✓</span>{item.text}
                  </div>
                  <div className="note-entry-actions" style={{ flexShrink: 0 }}>
                    {!isEditingNote && (
                      <button className="note-edit-btn" onClick={() => startEdit(item, 'note')}>気づき</button>
                    )}
                    <button className="note-edit-btn" onClick={() => startEdit(item, 'text')}>直す</button>
                    <button className="note-del-btn" onClick={() => deleteItem(item.id)}>消す</button>
                  </div>
                </div>
              )}

              {isEditingNote ? (
                <div className="note-edit-wrap">
                  <input
                    autoFocus
                    style={{ ...lineInput, fontSize: 16, borderBottom: `1.5px solid ${C.leatherM}` }}
                    placeholder="気づいたこと（空のまま保存すると消えます）"
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    onKeyDown={e => onEnter(e, saveEdit)}
                  />
                  <div className="note-edit-btns">
                    <button className="note-edit-cancel-btn" onClick={cancelEdit}>キャンセル</button>
                    <button className="note-add-btn" onClick={saveEdit}>保存</button>
                  </div>
                </div>
              ) : item.note && !isEditingText ? (
                <div style={{ fontSize: 12, color: C.inkM, lineHeight: 1.7, marginTop: 2, paddingLeft: 18 }}>
                  <span style={{ color: C.gold, marginRight: 4 }}>💡</span>{item.note}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>

      <div>
        <div className="sec-label">HISTORY</div>
        {pastDates.length === 0 && (
          <div className="empty-msg" style={{ padding: '16px 0' }}>ほかの日の記録はまだありません</div>
        )}
        {pastDates.map(ds => {
          const d = new Date(ds.replace(/-/g, '/'))
          const list = dekita[ds]
          return (
            <div
              key={ds}
              className="note-entry"
              style={{ cursor: 'pointer' }}
              onClick={() => { selectDate(ds); topRef.current?.scrollIntoView({ behavior: 'smooth' }) }}
            >
              <div className="note-entry-header">
                <span className="note-entry-time">
                  {d.getMonth() + 1}/{d.getDate()} ({WJ[d.getDay()]})
                  {ds === todayS && <span className="date-today">Today</span>}
                </span>
                <span style={{ fontSize: 10, color: C.inkL }}>{list.length}件 →</span>
              </div>
              {list.map(item => (
                <div key={item.id} style={{ fontSize: 12, color: C.ink, lineHeight: 1.7 }}>
                  <span style={{ color: C.sage, marginRight: 6 }}>✓</span>{item.text}
                  {item.note && <span style={{ color: C.inkL, marginLeft: 6 }}>💡{item.note}</span>}
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </>
  )
}
