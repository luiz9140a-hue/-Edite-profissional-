import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, getDoc, updateDoc, setDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { getAuth, GithubAuthProvider, GoogleAuthProvider, signOut } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

const runtimeConfig = {
  ...firebaseConfig,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfig.appId,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId
};

const app = initializeApp(runtimeConfig);
export const db = getFirestore(app, runtimeConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);
export { collection, addDoc, doc, getDoc, updateDoc, setDoc, onSnapshot, query, orderBy, GithubAuthProvider, GoogleAuthProvider, signOut };
