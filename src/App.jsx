import { useState, useCallback } from 'react'
import './App.css'
import { TABS, WE, d2s } from './constants'
import MiniCalendar from './components/MiniCalendar'
import DailyPage from './components/DailyPage'
import ShiftPage from './components/ShiftPage'
import GoalPage from './components/GoalPage'
import HistoryPage from './components/HistoryPage'
import GraphPage from './components/GraphPage'
import LearningPage from './components/LearningPage'

const today = new Date()
const todayS = d2s(today)

function lsGet(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback } catch { return fallback }
}
const saveTimers = {}
function save(key, value) {
  clearTimeout(saveTimers[key])
  saveTimers[key] = setTimeout(() => { try { localStorage.setItem(key, JSON.stringify(value)) } catch {} }, 500)
}

export default function App() {
  const [tab, setTab] = useState('daily')
  const [date, setDate] = useState(todayS)
  const [miniCalOpen, setMiniCalOpen] = useState(false)
  const [miniYm, setMiniYm] = useState({ y: today.getFullYear(), m: today.getMonth() })
  const [rec, setRec] = useState(() => lsGet('hbr-rec', {}))
  const [sh, setSh] = useState(() => lsGet('hbr-sh', {}))
  const [goals, setGoals] = useState(() => lsGet('hbr-goals', []))
  const [learn, setLearn] = useState(() => lsGet('hbr-learn', []))

  const updateRec = useCallback((v) => { setRec(v); save('hbr-rec', v) }, [])
  const updateSh = useCallback((v) => { setSh(v); save('hbr-sh', v) }, [])
  const updateGoals = useCallback((v) => { setGoals(v); save('hbr-goals', v) }, [])
  const updateLearn = useCallback((v) => { setLearn(v); save('hbr-learn', v) }, [])

  const state = { tab, date, miniCalOpen, miniYm, rec, sh, goals, learn }
  const actions = { setTab, setDate, setMiniCalOpen, setMiniYm, updateRec, updateSh, updateGoals, updateLearn }

  const pages = { shift: ShiftPage, goal: GoalPage, history: HistoryPage, graph: GraphPage, learning: LearningPage }
  const PageComponent = pages[tab]

  const now = new Date()

  return (
    <div className="hbr-app" onClick={() => setMiniCalOpen(false)}>
      <header id="hdr">
        <div id="hdr-top">
          <div>
            <div className="logo-en">hibiroku</div>
            <div className="logo-jp">ひびろく — daily record</div>
          </div>
          <div>
            <div className="hdr-date-num">{now.getMonth()+1}.{String(now.getDate()).padStart(2,'0')}</div>
            <div className="hdr-date-sub">{now.getFullYear()} / {WE[now.getDay()].toUpperCase()}</div>
          </div>
        </div>
        {tab === 'daily' && <MiniCalendar state={state} actions={actions} />}
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
