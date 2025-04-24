import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Firebase Configuration - Use environment variables with fallbacks
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAKVwzmaS3toFkSK6CHVpPMwN0Rcqd15Ns",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "gtmanager-57a85.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "gtmanager-57a85",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "gtmanager-57a85.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "741437889109",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:741437889109:web:579fcf8aede2c372f252dc",
};

// Log config for debugging (without exposing secrets)
console.log("Firebase config loaded:", {
  apiKeyExists: !!firebaseConfig.apiKey,
  authDomainExists: !!firebaseConfig.authDomain,
  projectIdExists: !!firebaseConfig.projectId,
  config: firebaseConfig // Add for debugging
});

// Initialize Firebase - only once
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { app, db, auth, storage };
