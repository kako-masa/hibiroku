import { useState } from 'react'
import { C } from '../constants'

export default function LearningPage({ state, actions }) {
  const { learn } = state
  const { updateLearn } = actions
  const [filter, setFilter] = useState('all')
  const [expanded, setExpanded] = useState(null)
  const [editingMemos, setEditingMemos] = useState({})

  const filtered = learn.filter(item => {
    if (filter === 'all') return true
    if (filter === 'unread') return !item.read
    return item.category === filter
  })

  const readCount  = learn.filter(i => i.read).length
  const workCount  = learn.filter(i => i.category === 'work').length
  const otherCount = learn.filter(i => i.category === 'other').length

  const toggleRead = (id) => updateLearn(learn.map(i => i.id === id ? { ...i, read: !i.read } : i))

  const saveMemo = (id, memo) => {
    updateLearn(learn.map(i => i.id === id ? { ...i, memo } : i))
    setEditingMemos(m => { const n = { ...m }; delete n[id]; return n })
  }

  const deleteItem = (id) => {
    updateLearn(learn.filter(i => i.id !== id))
    if (expanded === id) setExpanded(null)
  }

  const FILTERS = [
    { k: 'all',   l: 'すべて' },
    { k: 'work',  l: '仕事・看護' },
    { k: 'other', l: '趣味・健康' },
    { k: 'unread', l: '未読' },
  ]

  return (
    <>
      <div className="page-title">LEARNING</div>

      <div className="learn-stats">
        <div className="stat-box">
          <div className="stat-icon">📚</div>
          <div className="stat-num">{learn.length}</div>
          <div className="stat-label">TOTAL</div>
        </div>
        <div className="stat-box">
          <div className="stat-icon">✅</div>
          <div className="stat-num">{readCount}</div>
          <div className="stat-label">READ</div>
        </div>
        <div className="stat-box">
          <div className="stat-icon">💼</div>
          <div className="stat-num">{workCount}</div>
          <div className="stat-label">WORK</div>
        </div>
        <div className="stat-box">
          <div className="stat-icon">🌱</div>
          <div className="stat-num">{otherCount}</div>
          <div className="stat-label">OTHER</div>
        </div>
      </div>

      <div className="filter-row">
        {FILTERS.map(f => (
          <button key={f.k} className={`filter-btn${filter === f.k ? ' active' : ''}`} onClick={() => setFilter(f.k)}>{f.l}</button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-msg">
          {filter === 'unread'
            ? '未読の記事はありません'
            : 'まだ保存されていません\n日記タブのAIアドバイスから保存できます'}
        </div>
      )}

      {filtered.map(item => {
        const isOpen = expanded === item.id
        const catColor = item.category === 'work' ? C.slate : C.sage
        const memoVal = editingMemos[item.id] !== undefined ? editingMemos[item.id] : (item.memo || '')
        const isEditingMemo = editingMemos[item.id] !== undefined

        return (
          <div key={item.id} className={`learn-card ${item.category}`} style={{ opacity: item.read ? 0.75 : 1 }}>
            <div className="card-top">
              <div style={{ flex: 1 }} onClick={() => setExpanded(isOpen ? null : item.id)}>
                <div className="card-meta">
                  <span style={{ color: catColor, textTransform: 'uppercase', fontSize: 9, letterSpacing: 2 }}>
                    {item.category === 'work' ? '仕事・看護' : '趣味・健康'}
                  </span>
                  {item.addedDate && <span style={{ color: C.inkL }}>{item.addedDate}</span>}
                  {item.read && <span style={{ color: C.sage }}>✓ 既読</span>}
                </div>
                <div className="card-title">{item.title}</div>
                <div className="card-desc">{item.description}</div>
                {item.memo && !isOpen && <div className="card-memo-preview">"{item.memo}"</div>}
              </div>
              <button
                className={`read-btn${item.read ? ' done' : ''}`}
                onClick={() => toggleRead(item.id)}
                title={item.read ? '未読に戻す' : '既読にする'}
              >
                {item.read ? '✓' : '○'}
              </button>
            </div>

            {isOpen && (
              <div className="card-expand">
                {item.url && item.url !== 'N/A' && (
                  <a className="card-link" href={item.url} target="_blank" rel="noreferrer">→ 開く</a>
                )}
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 10, color: C.inkL, marginBottom: 3 }}>メモ</div>
                  <textarea
                    className="memo-area"
                    rows="3"
                    placeholder="読んだ感想、気づき…"
                    value={memoVal}
                    onChange={e => setEditingMemos(m => ({ ...m, [item.id]: e.target.value }))}
                    onBlur={() => { if (isEditingMemo) saveMemo(item.id, editingMemos[item.id]) }}
                  />
                  {isEditingMemo && (
                    <button className="memo-save" onClick={() => saveMemo(item.id, editingMemos[item.id])}>保存</button>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                  <button className="del-btn" style={{ marginTop: 0 }} onClick={() => deleteItem(item.id)}>削除</button>
                  <button className="close-btn" style={{ width: 'auto', padding: '4px 14px' }} onClick={() => setExpanded(null)}>閉じる</button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}
