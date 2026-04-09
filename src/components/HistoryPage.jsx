import { C, SHIFTS, MOODS, WJ } from '../constants'

export default function HistoryPage({ state, actions }) {
  const { rec, sh } = state
  const { setDate, setTab, setMiniYm } = actions

  const dates = Object.keys(rec)
    .filter(d => {
      const r = rec[d]
      return r && (r.weight || r.fat || r.sleep || r.mood !== undefined || r.note || r.shift || sh[d])
    })
    .sort()
    .reverse()

  const goToDate = (ds) => {
    const d = new Date(ds.replace(/-/g, '/'))
    setDate(ds)
    setMiniYm({ y: d.getFullYear(), m: d.getMonth() })
    setTab('daily')
  }

  if (dates.length === 0) {
    return (
      <>
        <div className="page-title">HISTORY</div>
        <div className="empty-msg">{'記録がまだありません\n日記タブで記録してみましょう'}</div>
      </>
    )
  }

  const groups = {}
  dates.forEach(ds => {
    const key = ds.slice(0, 7)
    if (!groups[key]) groups[key] = []
    groups[key].push(ds)
  })

  return (
    <>
      <div className="page-title">HISTORY</div>
      {Object.entries(groups).map(([ym, dsList]) => {
        const [y, mo] = ym.split('-')
        return (
          <div key={ym}>
            <div className="page-title" style={{ marginBottom: 8, marginTop: 4 }}>
              {y}年 {parseInt(mo)}月
            </div>
            {dsList.map(ds => {
              const r = rec[ds] || {}
              const shKey = r.shift || sh[ds]
              const sv = shKey ? SHIFTS[shKey] : null
              const d = new Date(ds.replace(/-/g, '/'))
              const dow = WJ[d.getDay()]
              const moodEmoji = r.mood !== undefined ? MOODS[r.mood]?.split(' ')[0] : null

              return (
                <div
                  key={ds}
                  className="learn-card"
                  style={{ borderLeftColor: sv ? sv.c : 'rgba(180,162,140,0.4)', cursor: 'pointer', marginBottom: 6 }}
                  onClick={() => goToDate(ds)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ textAlign: 'center', minWidth: 32, flexShrink: 0 }}>
                      <div style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: C.leather, lineHeight: 1 }}>{d.getDate()}</div>
                      <div style={{ fontSize: 9, color: C.inkL }}>{dow}曜</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 3 }}>
                        {sv && <span style={{ fontSize: 10, color: sv.c, background: sv.bg, padding: '1px 5px', borderRadius: 2 }}>{sv.m} {sv.l}</span>}
                        {moodEmoji && <span style={{ fontSize: 12 }}>{moodEmoji}</span>}
                        {r.exercise && <span style={{ fontSize: 10, color: C.sage }}>◯ 運動</span>}
                      </div>
                      <div style={{ display: 'flex', gap: 8, fontSize: 11, color: C.inkL, flexWrap: 'wrap' }}>
                        {r.weight && <span>体重 {r.weight}kg</span>}
                        {r.sleep && <span>睡眠 {r.sleep}h</span>}
                        {r.fat && <span>体脂肪 {r.fat}%</span>}
                      </div>
                      {r.note && (
                        <div style={{ fontSize: 11, color: C.inkM, marginTop: 2, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                          {r.note}
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: 9, color: C.inkL, flexShrink: 0 }}>›</span>
                  </div>
                </div>
              )
            })}
          </div>
        )
      })}
    </>
  )
}
