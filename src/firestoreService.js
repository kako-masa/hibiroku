import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from './firebase'

function dataDoc(uid, name) {
  return doc(db, 'users', uid, 'data', name)
}

export async function loadAllData(uid) {
  const [recSnap, shSnap, goalsSnap, learnSnap, settingsSnap] = await Promise.all([
    getDoc(dataDoc(uid, 'rec')),
    getDoc(dataDoc(uid, 'sh')),
    getDoc(dataDoc(uid, 'goals')),
    getDoc(dataDoc(uid, 'learn')),
    getDoc(dataDoc(uid, 'settings')),
  ])
  return {
    rec:     recSnap.exists()      ? recSnap.data()              : {},
    sh:      shSnap.exists()       ? shSnap.data()               : {},
    goals:   goalsSnap.exists()    ? (goalsSnap.data().items ?? [])   : [],
    learn:   learnSnap.exists()    ? (learnSnap.data().items ?? [])   : [],
    shTodos: settingsSnap.exists() ? (settingsSnap.data().shTodos ?? []) : [],
  }
}

export async function saveToFirestore(uid, key, value) {
  if (key === 'goals' || key === 'learn') {
    await setDoc(dataDoc(uid, key), { items: value })
  } else if (key === 'shTodos') {
    await setDoc(dataDoc(uid, 'settings'), { shTodos: value }, { merge: true })
  } else {
    // rec / sh: valueはdateキーのオブジェクト
    await setDoc(dataDoc(uid, key), value)
  }
}

export async function migrateFromLocalStorage(uid) {
  function lsGet(k, fallback) {
    try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback } catch { return fallback }
  }
  const rec     = lsGet('hbr-rec', {})
  const sh      = lsGet('hbr-sh', {})
  const goals   = lsGet('hbr-goals', [])
  const learn   = lsGet('hbr-learn', [])
  const shTodos = lsGet('hbr-sh-todos', [])

  await Promise.all([
    saveToFirestore(uid, 'rec',     rec),
    saveToFirestore(uid, 'sh',      sh),
    saveToFirestore(uid, 'goals',   goals),
    saveToFirestore(uid, 'learn',   learn),
    saveToFirestore(uid, 'shTodos', shTodos),
  ])
}
