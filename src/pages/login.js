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


// firebase code


// rules_version = '2';

// service cloud.firestore {
//   match /databases/{database}/documents {

//     // Conversations collection rules
//     match /conversations/{conversationId} {

//       // Allow the owner of the conversation (user) to read and update their own conversation
//       allow read, update: if request.auth != null && request.auth.uid == conversationId;

//       // Allow admins to read and update any conversation
//       allow read, update: if request.auth != null && get(/databases/$(database)/documents/roles/$(request.auth.uid)).data.role == "admin";

//       // Allow authenticated users to create new conversations (tied to their user ID)
//       allow create: if request.auth != null && request.auth.uid == conversationId;

//       // Allow only admins to delete conversations
//       allow delete: if get(/databases/$(database)/documents/roles/$(request.auth.uid)).data.role == "admin";
//     }

//     // Roles collection rules for managing user roles
//     match /roles/{userId} {
//       // Allow users to read their own role document (for checking admin status)
//       allow read: if request.auth != null && request.auth.uid == userId;

//       // Only allow admins to write/update roles (e.g., assign admin role)
//       allow write: if get(/databases/$(database)/documents/roles/$(request.auth.uid)).data.role == "admin";
//     }
//   }
// }
