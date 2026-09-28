import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBZ877ToGxUbri6JMkjJPSG6QqcwZShygk',
  authDomain: 'edite-profissional.firebaseapp.com',
  projectId: 'edite-profissional',
  storageBucket: 'edite-profissional.firebasestorage.app',
  messagingSenderId: '19696679233',
  appId: '1:19696679233:web:3fd43455fd551b637689c0',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
