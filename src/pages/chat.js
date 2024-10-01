import { useEffect, useState } from "react";
import { getAuth, signOut } from "firebase/auth";
import { doc, getDoc, updateDoc, onSnapshot, serverTimestamp, addDoc, collection, arrayUnion } from "firebase/firestore";
import { db } from "../components/firebase";  // Your Firebase configuration file

const Chat = () => {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [conversationId, setConversationId] = useState(null);

  // Get the authenticated user
  useEffect(() => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUser(currentUser);
      checkIfAdmin(currentUser);
      fetchConversation(currentUser.uid);
    } else {
      console.error("User not authenticated");
    }
  }, []);

  // Check if the authenticated user is an admin
  const checkIfAdmin = async (user) => {
    const docRef = doc(db, "roles", user.uid);
    const docSnap = await getDoc(docRef);

    console.log("Role document: ", docSnap.data());



    if (docSnap.exists()) {
      setIsAdmin(docSnap.data().role === 'admin');
    } else {
      setIsAdmin(false);
    }
  };

  // Fetch the conversation for the current user or admin
  const fetchConversation = async (userId) => {
    const conversationRef = doc(db, "conversations", userId);
    const conversationSnap = await getDoc(conversationRef);

    if (conversationSnap.exists()) {
      setConversationId(userId);
      // Listen for real-time updates to the conversation
      onSnapshot(conversationRef, (doc) => {
        setMessages(doc.data().messages || []);
      });
    } else {
      // Create a new conversation document for the user if it doesn't exist
      const newConversation = await addDoc(collection(db, "conversations"), {
        userId: userId,
        messages: [],
      });
      setConversationId(newConversation.id);
    }
  };


  // Function to send a new message
  const sendMessage = async () => {
    if (!newMessage.trim() || !conversationId) return;

    // First, create the message object without the timestamp
    const messageData = {
      senderId: user.uid,
      senderName: user.displayName || "Unknown",
      message: newMessage,
      timestamp: null  // Temporarily set timestamp as null
    };

    // Now, update the conversation by adding the message and setting the server timestamp in two steps
    const conversationRef = doc(db, "conversations", conversationId);

    // First, append the message without timestamp
    await updateDoc(conversationRef, {
      messages: arrayUnion(messageData)  // Add the message without timestamp
    });

    // Then, update the timestamp of the last message
    await updateDoc(conversationRef, {
      [`messages.${messageData.message}`]: serverTimestamp()  // Set the server timestamp separately
    });

    setNewMessage("");  // Clear the input after sending the message
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
          {/* Chat Thread */}
          <div className="chat-thread">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.senderId === user.uid ? "user-message" : "admin-message"}`}>
                <strong>{msg.senderName}:</strong> {msg.message}
                <small>{new Date(msg.timestamp?.toDate()).toLocaleString()}</small>
              </div>
            ))}
          </div>

          {/* Send Message Input */}
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
