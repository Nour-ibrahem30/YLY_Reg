import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA4TdQZh7RTgRMJDrRpSFxM3p33mt26Cew",
  authDomain: "yly-cairo.firebaseapp.com",
  projectId: "yly-cairo",
  storageBucket: "yly-cairo.firebasestorage.app",
  messagingSenderId: "693686391893",
  appId: "1:693686391893:web:e53039d6249169a6d5b0dc",
  measurementId: "G-RXZLYS1H41"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
