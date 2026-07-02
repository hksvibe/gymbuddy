import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getFunctions, type Functions } from 'firebase/functions'

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const firebaseConfigured = Boolean(config.apiKey && config.projectId)

let app: FirebaseApp | null = null
let _auth: Auth | null = null
let _db: Firestore | null = null
let _fns: Functions | null = null

if (firebaseConfigured) {
  app = initializeApp(config)
  _auth = getAuth(app)
  _db = getFirestore(app)
  _fns = getFunctions(app, 'asia-south1')
}

export const auth = _auth
export const db = _db
export const fns = _fns
