/* ============================================
   SALENTINO BPM - Firebase Configuration
   ============================================

   SETUP INSTRUCTIONS:
   1. Go to https://console.firebase.google.com
   2. Create a new project called "salentino-bpm"
   3. Enable Authentication > Email/Password
   4. Create a Firestore Database (start in test mode)
   5. Go to Project Settings > General > Your apps > Web
   6. Register a web app and copy the config below
   7. Replace the placeholder values with your actual config
   ============================================ */

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBlZ_2FYSS3_QxvEDpUqC5VUeJ4iM7figs",
  authDomain: "salentino-bpm.firebaseapp.com",
  projectId: "salentino-bpm",
  storageBucket: "salentino-bpm.firebasestorage.app",
  messagingSenderId: "501254428011",
  appId: "1:501254428011:web:68323fde70d192cf0ce82e"
};

// ─── Firebase Mode Toggle ────────────────────
const USE_FIREBASE = true;

// ─── Firebase Initialization ─────────────────
let db = null;
let auth = null;
let firebaseReady = false;

async function initFirebase() {
  if (!USE_FIREBASE) {
    console.log('🔶 Firebase disabled — using localStorage mode');
    return false;
  }

  if (FIREBASE_CONFIG.apiKey === 'YOUR_API_KEY') {
    console.warn('⚠️ Firebase config not set — falling back to localStorage');
    return false;
  }

  try {
    // Dynamic import of Firebase SDK (CDN)
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js');
    const { getFirestore, enableIndexedDbPersistence } = await import('https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js');
    const { getAuth } = await import('https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js');

    const app = initializeApp(FIREBASE_CONFIG);
    db = getFirestore(app);
    auth = getAuth(app);

    // Enable offline persistence
    try {
      await enableIndexedDbPersistence(db);
      console.log('✅ Firestore offline persistence enabled');
    } catch (err) {
      if (err.code === 'failed-precondition') {
        console.warn('Offline persistence unavailable: multiple tabs open');
      } else if (err.code === 'unimplemented') {
        console.warn('Offline persistence not supported in this browser');
      }
    }

    firebaseReady = true;
    console.log('✅ Firebase initialized successfully');
    return true;
  } catch (err) {
    console.error('❌ Firebase init failed:', err);
    return false;
  }
}

// ─── Firestore Store (replaces localStorage when active) ───
const FirestoreStore = {
  async getRecords(formId) {
    if (!firebaseReady) return [];
    const { collection, getDocs, query, orderBy } = await import('https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js');
    const q = query(collection(db, 'records', formId, 'entries'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async addRecord(formId, data) {
    if (!firebaseReady) return null;
    const { collection, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js');
    const record = {
      formId,
      createdAt: new Date().toISOString(),
      serverTimestamp: serverTimestamp(),
      ...data
    };
    const ref = await addDoc(collection(db, 'records', formId, 'entries'), record);
    return { id: ref.id, ...record };
  },

  async getAllRecords() {
    if (!firebaseReady) return [];
    const { collectionGroup, getDocs, query, orderBy } = await import('https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js');
    const q = query(collectionGroup(db, 'entries'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
};

// ─── Hybrid Store ────────────────────────────
// Uses Firebase when available, falls back to localStorage
const HybridStore = {
  getRecords(formId) {
    if (firebaseReady) return FirestoreStore.getRecords(formId);
    return Promise.resolve(Store.getRecords(formId));
  },

  addRecord(formId, data) {
    // Always save to localStorage (offline backup)
    const localRecord = Store.addRecord(formId, data);
    // Also save to Firebase if available
    if (firebaseReady) {
      FirestoreStore.addRecord(formId, data).catch(err => {
        console.warn('Firebase write failed, data saved locally:', err);
      });
    }
    return localRecord;
  }
};
