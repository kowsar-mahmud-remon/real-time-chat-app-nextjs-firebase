import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore"; // Firestore imports
import { db } from '../components/firebase'; // Firestore instance

export default function Login({ setIsAdmin }) {
  const provider = new GoogleAuthProvider();
  const auth = getAuth();

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if the user is an admin by querying Firestore
      checkIfAdmin(user);
    } catch (error) {
      console.error("Error during login:", error);
    }
  };


  const checkIfAdmin = async (user) => {
    const docRef = doc(db, "roles", user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists() && docSnap.data().role === 'admin') {
      setIsAdmin(true);  // Admin UI state
    } else {
      setIsAdmin(false);
    }
  };

  return (
    <div>
      <button onClick={signInWithGoogle}>Sign in with Google</button>
    </div>
  );
}
