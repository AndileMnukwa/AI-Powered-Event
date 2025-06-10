// In client/src/firebase/config.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDss1qQhwchPgu0dJixdTBqnmDfjQm8CR4",
  authDomain: "vibecatcher-d1152.firebaseapp.com",
  projectId: "vibecatcher-d1152",
  storageBucket: "vibecatcher-d1152.appspot.com",
  messagingSenderId: "920707234998",
  appId: "1:920707234998:web:9c2466b56dff46fff23a17",
  measurementId: "G-6J6X56ETM2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;