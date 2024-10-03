import { useEffect, useState } from "react";
import { getAuth, signOut } from "firebase/auth";
import { doc, getDoc, updateDoc, onSnapshot, serverTimestamp, arrayUnion, setDoc } from "firebase/firestore";
import { db } from "../components/firebase"; // Firestore configuration

const Chat = () => {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [conversationId, setConversationId] = useState(null); // Each user has their own conversation ID

  useEffect(() => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUser(currentUser);
      checkIfAdmin(currentUser);
      setConversationId(currentUser.uid); // Use the user ID as the conversation ID
      fetchConversation(currentUser.uid); // Fetch the user's own conversation
    } else {
      console.error("User not authenticated");
    }
  }, []);

  const checkIfAdmin = async (user) => {
    const docRef = doc(db, "roles", user.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      setIsAdmin(docSnap.data().role === "admin");
    } else {
      setIsAdmin(false);
    }
  };

  const fetchConversation = async (userId) => {
    const conversationRef = doc(db, "conversations", userId); // User-specific conversation
    const unsubscribe = onSnapshot(conversationRef, (doc) => {
      if (doc.exists()) {
        setMessages(doc.data().messages || []);
      } else {
        // If no conversation exists, create a new one
        createNewConversation(userId);
      }
    });
    return () => unsubscribe(); // Cleanup on unmount
  };

  const createNewConversation = async (userId) => {
    const conversationRef = doc(db, "conversations", userId);
    // Create the conversation document with an empty messages array
    await setDoc(conversationRef, {
      messages: [],
      lastMessageTimestamp: null,
    });
  };

  const sendMessage = async () => {
    try {
      if (!conversationId || typeof conversationId !== "string") {
        throw new Error("Invalid conversation ID");
      }

      const conversationRef = doc(db, "conversations", conversationId);

      // Create a message object without the timestamp initially
      const newMessageData = {
        senderId: user.uid,
        senderName: user.displayName || "Anonymous",
        text: newMessage,
      };

      // Push the new message without a timestamp
      await updateDoc(conversationRef, {
        messages: arrayUnion(newMessageData),
      });

      // Then update the conversation's lastMessageTimestamp to serverTimestamp
      await updateDoc(conversationRef, {
        lastMessageTimestamp: serverTimestamp(),
      });

      setNewMessage(""); // Clear the input field after sending the message
    } catch (error) {
      console.error("Error sending message: ", error);
    }
  };


  return (
    <div>
      <header>
        <h1>Chat</h1>
        {user && (
          <>
            <p>Welcome, {user.displayName}</p>
            <button onClick={() => signOut(getAuth())}>Logout</button>
          </>
        )}
      </header>

      <main>
        <div>
          <div className="chat-thread">
            {messages.length > 0 ? (
              messages.map((msg, index) => (
                <div key={index} className={`message ${msg.senderId === user.uid ? "user-message" : "admin-message"}`}>
                  <strong>{msg.senderName}:</strong> {msg.text}
                  <small>{msg.timestamp ? new Date(msg.timestamp.toDate()).toLocaleString() : "Sending..."}</small>
                </div>
              ))
            ) : (
              <p>No messages yet</p>
            )}
          </div>

          <div>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        </div>
      </main>

      <style jsx>{`
        .chat-thread {
          max-height: 400px;
          overflow-y: auto;
          border: 1px solid #ccc;
          padding: 10px;
          margin-bottom: 20px;
        }
        .message {
          margin-bottom: 10px;
        }
        .user-message {
          background-color: #d1ffd1;
        }
        .admin-message {
          background-color: #ffd1d1;
        }
      `}</style>
    </div>
  );
};

export default Chat;


//
// rules_version = '2';

// service cloud.firestore {
//   match /databases/{database}/documents {

//     // Conversations collection rules
//     match /conversations/{conversationId} {
//       // Allow all authenticated users to read any conversation
//       allow read: if request.auth != null;

//       // Allow authenticated users to update (send messages) in any conversation
//       allow update: if request.auth != null;

//       // Allow authenticated users to create new conversations
//       allow create: if request.auth != null;

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
