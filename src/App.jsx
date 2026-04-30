import { useState, useCallback, useEffect, useRef } from 'react'
import './App.css'
import { TABS, WE, d2s } from './constants'
import DailyPage from './components/DailyPage'
import ShiftPage from './components/ShiftPage'
import GoalPage from './components/GoalPage'
import HistoryPage from './components/HistoryPage'
import GraphPage from './components/GraphPage'
import LearningPage from './components/LearningPage'
import { auth, signInWithGoogle, signOutUser } from './firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { loadAllData, saveToFirestore, migrateFromLocalStorage } from './firestoreService'

const today = new Date()
const todayS = d2s(today)

function lsGet(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback } catch { return fallback }
}

const lsTimers = {}
const fsTimers = {}

export default function App() {
  const [tab, setTab] = useState('daily')
  const [date, setDate] = useState(todayS)
  const [miniCalOpen, setMiniCalOpen] = useState(false)
  const [miniYm, setMiniYm] = useState({ y: today.getFullYear(), m: today.getMonth() })
  const [rec, setRec] = useState(() => lsGet('hbr-rec', {}))
  const [sh, setSh] = useState(() => lsGet('hbr-sh', {}))
  const [goals, setGoals] = useState(() => lsGet('hbr-goals', []))
  const [learn, setLearn] = useState(() => lsGet('hbr-learn', []))
  const [shTodos, setShTodos] = useState(() => lsGet('hbr-sh-todos', []))

  // Firebase auth
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [syncStatus, setSyncStatus] = useState('')  // '' | 'syncing' | 'migrating' | 'synced' | 'error'
  const [migrated, setMigrated] = useState(false)
  const userRef = useRef(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        userRef.current = u
        setUser(u)
        setSyncStatus('syncing')
        try {
          const data = await loadAllData(u.uid)
          const hasData = (
            Object.keys(data.rec).length > 0 ||
            data.goals.length > 0 ||
            data.learn.length > 0
          )
          if (!hasData) {
            // Firestoreが空ならlocalStorageから移行
            const lsRec   = lsGet('hbr-rec', {})
            const lsGoals = lsGet('hbr-goals', [])
            if (Object.keys(lsRec).length > 0 || lsGoals.length > 0) {
              setSyncStatus('migrating')
              await migrateFromLocalStorage(u.uid)
              const d2 = await loadAllData(u.uid)
              setRec(d2.rec);     setSh(d2.sh);    setGoals(d2.goals)
              setLearn(d2.learn); setShTodos(d2.shTodos)
              setMigrated(true)
            }
          } else {
            setRec(data.rec);     setSh(data.sh);    setGoals(data.goals)
            setLearn(data.learn); setShTodos(data.shTodos)
          }
          setSyncStatus('synced')
        } catch (err) {
          console.error('Firestore load error:', err)
          setSyncStatus('error')
        }
      } else {
        userRef.current = null
        setUser(null)
        setSyncStatus('')
      }
      setAuthLoading(false)
    })
    return unsubscribe
  }, [])

  const fsSave = useCallback((key, value) => {
    const uid = userRef.current?.uid
    if (!uid) return
    clearTimeout(fsTimers[key])
    fsTimers[key] = setTimeout(() => {
      setSyncStatus('syncing')
      saveToFirestore(uid, key, value)
        .then(() => setSyncStatus('synced'))
        .catch(() => setSyncStatus('error'))
    }, 1500)
  }, [])

  const lsSave = (lsKey, value) => {
    clearTimeout(lsTimers[lsKey])
    lsTimers[lsKey] = setTimeout(() => {
      try { localStorage.setItem(lsKey, JSON.stringify(value)) } catch {}
    }, 500)
  }

  const updateRec = useCallback((v) => {
    setRec(v); lsSave('hbr-rec', v); fsSave('rec', v)
  }, [fsSave])

  const updateSh = useCallback((v) => {
    setSh(v); lsSave('hbr-sh', v); fsSave('sh', v)
  }, [fsSave])

  const updateGoals = useCallback((v) => {
    setGoals(v); lsSave('hbr-goals', v); fsSave('goals', v)
  }, [fsSave])

  const updateLearn = useCallback((v) => {
    setLearn(v); lsSave('hbr-learn', v); fsSave('learn', v)
  }, [fsSave])

  const updateShTodos = useCallback((v) => {
    setShTodos(v); lsSave('hbr-sh-todos', v); fsSave('shTodos', v)
  }, [fsSave])

  const state   = { tab, date, miniCalOpen, miniYm, rec, sh, goals, learn, shTodos }
  const actions = { setTab, setDate, setMiniCalOpen, setMiniYm, updateRec, updateSh, updateGoals, updateLearn, updateShTodos }

  const pages = { shift: ShiftPage, goal: GoalPage, history: HistoryPage, graph: GraphPage, learning: LearningPage }
  const PageComponent = pages[tab]

  const now = new Date()

  const syncLabel =
    syncStatus === 'syncing'   ? '同期中…'        :
    syncStatus === 'migrating' ? 'データ移行中…'  :
    syncStatus === 'synced'    ? '✓ 同期済み'     :
    syncStatus === 'error'     ? '⚠ 同期エラー'   : ''

  const syncColor = syncStatus === 'error' ? '#c0392b' : '#9C8070'

  return (
    <div className="hbr-app">
      <header id="hdr">
        <div id="hdr-top">
          <div>
            <div className="logo-en">hibiroku</div>
            <div className="logo-jp">ひびろく — daily record</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="hdr-date-num">{now.getMonth()+1}.{String(now.getDate()).padStart(2,'0')}</div>
            <div className="hdr-date-sub">{now.getFullYear()} / {WE[now.getDay()].toUpperCase()}</div>
            {!authLoading && (
              <div style={{ marginTop: 4 }}>
                {user ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                    {syncLabel && (
                      <div style={{ fontSize: 9, color: syncColor, letterSpacing: 0.5 }}>{syncLabel}</div>
                    )}
                    <button
                      onClick={signOutUser}
                      style={{
                        fontSize: 10, color: '#9C8070',
                        background: 'transparent',
                        border: '1px solid rgba(180,162,140,0.4)',
                        borderRadius: 4, padding: '2px 8px', cursor: 'pointer',
                      }}
                    >
                      ログアウト
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={signInWithGoogle}
                    style={{
                      fontSize: 10, color: '#6B4F3A',
                      background: 'rgba(107,79,58,0.08)',
                      border: '1px solid rgba(107,79,58,0.3)',
                      borderRadius: 4, padding: '3px 10px', cursor: 'pointer', marginTop: 2,
                    }}
                  >
                    Googleでログイン
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {migrated && (
          <div style={{
            fontSize: 11, color: '#6B4F3A',
            background: 'rgba(107,79,58,0.08)',
            padding: '4px 12px', textAlign: 'center',
          }}>
            ✓ ローカルデータをFirestoreに移行しました
          </div>
        )}

        <nav id="nav">
          {TABS.map(t => (
            <button
              key={t.k}
              className={`nav-btn${tab === t.k ? ' active' : ''}`}
              onClick={(e) => { e.stopPropagation(); setTab(t.k) }}
            >
              <span className="nav-icon">{t.i}</span>
              <span className="nav-label">{t.l}</span>
            </button>
          ))}
        </nav>
      </header>

      <main id="main">
        {tab === 'daily' ? (
          <div id="page-daily-wrap">
            <DailyPage state={state} actions={actions} />
          </div>
        ) : (
          <div className="page">
            <PageComponent state={state} actions={actions} />
          </div>
        )}
      </main>
    </div>
  )
}
