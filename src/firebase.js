import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyA0vSNMTPiHt3jvEEK6sDsdLLWncOKTqdY',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'torgai-tynysy.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'torgai-tynysy',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'torgai-tynysy.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1073542921724',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1073542921724:web:7710836551536abdc98679',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-X0DWC694DW',
};

export const firebaseReady = Boolean(config.apiKey && config.authDomain && config.projectId && config.appId);
const app = firebaseReady ? (getApps()[0] || initializeApp(config)) : null;

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
const workerUrl = import.meta.env.VITE_UPLOAD_API_URL || '';
export const uploadApi = workerUrl.endsWith('/') ? workerUrl.slice(0, -1) : workerUrl;
