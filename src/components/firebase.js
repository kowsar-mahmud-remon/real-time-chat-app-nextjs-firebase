// firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBDi-LwDBDBkCYYd6VXa1o1BrNmx06dg34",
  authDomain: "nextjs-firebase-chat-app.firebaseapp.com",
  projectId: "nextjs-firebase-chat-app",
  storageBucket: "nextjs-firebase-chat-app.appspot.com",
  messagingSenderId: "38372124480",
  appId: "1:38372124480:web:857463cf204b298f7a3ca5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

export { auth, provider, signInWithPopup, signOut, db };
