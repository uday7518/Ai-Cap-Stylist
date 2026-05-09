import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export // For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDkzyWnWbiUH--9lSRNVq0jJLl8abEvD_Y",
  authDomain: "ai-cap-stylist.firebaseapp.com",
  projectId: "ai-cap-stylist",
  storageBucket: "ai-cap-stylist.firebasestorage.app",
  messagingSenderId: "314939665341",
  appId: "1:314939665341:web:496de3fb5b9bc3423f80d4",
  measurementId: "G-9NC5S4NKJL"
};

export const firebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);
export const firebaseDb = getFirestore(firebaseApp);
