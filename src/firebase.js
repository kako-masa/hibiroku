import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyAoBJ3pNwdoHwnkEx-LpMUBgyL1JAxVEJA",
  authDomain: "hibiroku-project.firebaseapp.com",
  projectId: "hibiroku-project",
  storageBucket: "hibiroku-project.firebasestorage.app",
  messagingSenderId: "321458479483",
  appId: "1:321458479483:web:91ae2340f36823e5fb1dde",
  measurementId: "G-5VBZ3YTDJR"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)

const googleProvider = new GoogleAuthProvider()

export async function signInWithGoogle() {
  return signInWithPopup(auth, googleProvider)
}

export async function signOutUser() {
  return signOut(auth)
}
