// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// All credentials are loaded from window.ENV (set in config.js)
// 
// ⚠️ Copy this file as firebase-config.js — it is gitignored.
// No changes needed here; just ensure config.js has your ENV values.
const firebaseConfig = {
  apiKey: window.ENV.FIREBASE_API_KEY,
  authDomain: window.ENV.FIREBASE_AUTH_DOMAIN,
  databaseURL: window.ENV.FIREBASE_DATABASE_URL,
  projectId: window.ENV.FIREBASE_PROJECT_ID,
  storageBucket: window.ENV.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: window.ENV.FIREBASE_MESSAGING_SENDER_ID,
  appId: window.ENV.FIREBASE_APP_ID,
  measurementId: window.ENV.FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
