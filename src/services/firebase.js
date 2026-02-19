import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, doc, deleteDoc, onSnapshot, query, orderBy, getDocs } from 'firebase/firestore'
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth'

let app = null
let db = null
let auth = null
let entriesCol = null

export function initFirebase() {
  const apiKey = process.env.VUE_APP_FIREBASE_API_KEY
  const authDomain = process.env.VUE_APP_FIREBASE_AUTH_DOMAIN
  const projectId = process.env.VUE_APP_FIREBASE_PROJECT_ID
  const appId = process.env.VUE_APP_FIREBASE_APP_ID

  console.log('Firebase init - checking config:', { apiKey: !!apiKey, authDomain: !!authDomain, projectId: !!projectId, appId: !!appId })

  if (!apiKey || !projectId) {
    console.warn('Firebase not configured - missing apiKey or projectId')
    return false
  }

  try {
    app = initializeApp({
      apiKey,
      authDomain,
      projectId,
      appId
    })
    db = getFirestore(app)
    auth = getAuth(app)
    entriesCol = collection(db, 'journal_entries')
    console.log('Firebase initialized successfully', { projectId })
    return true
  } catch (e) {
    console.warn('Firebase init failed:', e)
    return false
  }
}

export function onAuthChange(cb) {
  if (!auth) {
    console.warn('Auth not initialized - skipping onAuthChange')
    return
  }
  onAuthStateChanged(auth, (user) => {
    console.log('Auth state changed:', { uid: user?.uid, anon: user?.isAnonymous })
    cb(user)
  })
}

export async function signInAnonymous() {
  if (!auth) throw new Error('Auth not initialized')
  console.log('Signing in anonymously...')
  const result = await signInAnonymously(auth)
  console.log('Anonymous sign-in success:', { uid: result.user.uid })
  return result
}

export function listenEntries(onChange) {
  if (!db || !entriesCol) {
    console.warn('listenEntries - db or entriesCol not initialized')
    return null
  }
  console.log('Starting to listen to journal_entries collection...')
  const q = query(entriesCol, orderBy('last_updated_at', 'desc'))
  const unsub = onSnapshot(q, (snapshot) => {
    console.log('Firestore snapshot received:', { docCount: snapshot.size })
    const docs = []
    snapshot.forEach(d => {
      const data = d.data()
      docs.push({
        remoteId: d.id,
        client_id: data.client_id,
        author: data.author,
        date: data.date,
        title: data.title,
        content: data.content,
        mood: data.mood,
        photos: data.photos || [],
        lastUpdatedAt: data.last_updated_at,
        lastUpdatedBy: data.last_updated_by
      })
    })
    console.log('Mapped docs:', docs.length)
    onChange(docs)
  }, (err) => {
    console.error('listenEntries snapshot error:', err)
  })
  return unsub
}

export async function createOrUpdateEntry(entry) {
  if (!db || !entriesCol) {
    console.warn('createOrUpdateEntry - db or entriesCol not initialized')
    return
  }
  try {
    console.log('Creating/updating entry:', { id: entry.id, title: entry.title })
    // Try upsert by creating a new doc with client_id field
    const result = await addDoc(entriesCol, {
      client_id: entry.id,
      author: entry.author,
      date: entry.date,
      title: entry.title,
      content: entry.content,
      mood: entry.mood,
      photos: entry.photos || [],
      last_updated_at: entry.lastUpdatedAt || new Date().toISOString(),
      last_updated_by: entry.lastUpdatedBy || entry.author
    })
    console.log('Entry created in Firestore:', { remoteId: result.id })
  } catch (e) {
    console.error('createOrUpdateEntry failed:', e)
  }
}

export async function removeEntryByClientId(clientId) {
  if (!db) {
    console.warn('removeEntryByClientId - db not initialized')
    return
  }
  try {
    console.log('Removing entry by client_id:', clientId)
    const snap = await getDocs(entriesCol)
    const toDelete = []
    snap.forEach(d => {
      const data = d.data()
      if (data.client_id === clientId) {
        toDelete.push(d.id)
      }
    })
    for (const docId of toDelete) {
      await deleteDoc(doc(db, 'journal_entries', docId))
      console.log('Deleted document:', docId)
    }
  } catch (e) {
    console.error('removeEntryByClientId failed:', e)
  }
}

export { db, auth }
