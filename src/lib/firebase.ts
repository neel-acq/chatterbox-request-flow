
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyDx_Li8Bq2yJf70q6cG3vWC8clGFTqI-Yo',
  authDomain: 'test-bolt-d3b25.firebaseapp.com',
  projectId: 'test-bolt-d3b25',
  storageBucket: 'test-bolt-d3b25.firebasestorage.app',
  messagingSenderId: '164902093979',
  appId: '1:164902093979:web:525afad07e8d5039b9b23e',
  measurementId: 'G-EPF0TH3GT5',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
