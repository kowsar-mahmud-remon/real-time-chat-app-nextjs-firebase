// pages/index.js

import { useEffect, useState } from 'react';
import { auth, provider, signInWithPopup, signOut } from '../components/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Chat from './chat';

export default function Home() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
  }, []);

  const handleLogin = () => {
    signInWithPopup(auth, provider).catch((error) => {
      console.error("Error signing in: ", error);
    });
  };

  const handleLogout = () => {
    signOut(auth).catch((error) => {
      console.error("Error signing out: ", error);
    });
  };

  return (
    <div>
      {!user ? (
        <button onClick={handleLogin}>Login with Google</button>
      ) : (
        <div>
          <button onClick={handleLogout}>Logout</button>
          <Chat user={user} />
        </div>
      )}
    </div>
  );
}
