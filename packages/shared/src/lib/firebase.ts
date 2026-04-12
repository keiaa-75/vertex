import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBhj7iObMgiC8bD46a-BVqeNfchx0dz-Zk",
  authDomain: "vertex-dd7e4.firebaseapp.com",
  projectId: "vertex-dd7e4",
  storageBucket: "vertex-dd7e4.firebasestorage.app",
  messagingSenderId: "915271160778",
  appId: "1:915271160778:web:4bd42b5077d9cff7c6b533"
};

// Prevent duplicate initialization across multiple iframes on same origin
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);