import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Use a safer glob pattern to avoid build errors if the specific config file is missing (e.g. in Vercel)
const configs = import.meta.glob('../../*.json', { eager: true }) as any;
const localConfig = configs['../../firebase-applet-config.json']?.default || {};

const firebaseConfig = {
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY || localConfig.apiKey) as string,
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || localConfig.authDomain) as string,
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID || localConfig.projectId) as string,
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || localConfig.storageBucket) as string,
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || localConfig.messagingSenderId) as string,
  appId: (import.meta.env.VITE_FIREBASE_APP_ID || localConfig.appId) as string,
  firestoreDatabaseId: (import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || localConfig.firestoreDatabaseId) as string,
};

if (!firebaseConfig.apiKey) {
  console.warn("Firebase configuration not found. Please check your Environment Variables or ensure firebase-applet-config.json exists.");
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
// Use the custom database ID if provided, otherwise the default
export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, updateProfile };
