import { useEffect, useState } from "react";
import { auth, provider, signInWithPopup, signOut } from "../components/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../components/firebase"; // Firebase Firestore instance
import AdminChat from "./adminchat";
import UserChat from "./userchat";

export default function Home() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false); // Add admin state
  const [loading, setLoading] = useState(true);  // Loading state for role check

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(true);  // Start loading

      if (currentUser) {
        // Check if the current user is an admin
        const userRef = doc(db, "roles", currentUser.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          setIsAdmin(userDoc.data().role === "admin");
        }
      }
      setLoading(false);  // End loading after role check
    });

    return () => unsubscribe();
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

  if (loading) {
    return <div>Loading...</div>; // Show a loading spinner while role is being checked
  }

  return (
    <div>
      {!user ? (
        <button onClick={handleLogin}>Login with Google</button>
      ) : (
        <div>
          <button onClick={handleLogout}>Logout</button>
          {isAdmin ? <AdminChat user={user} /> : <UserChat user={user} />}
          {/* Conditionally render AdminChat or User Chat based on role */}
        </div>
      )}
    </div>
  );
}
