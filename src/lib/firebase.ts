import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBZ877ToGxUbri6JMkjJPSG6QqcwZShygk',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'edite-profissional.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'edite-profissional',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'edite-profissional.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '19696679233',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:19696679233:web:3fd43455fd551b637689c0',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
