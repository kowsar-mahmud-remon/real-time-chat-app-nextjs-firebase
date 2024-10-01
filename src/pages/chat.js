import { useEffect, useState } from "react";
import { getAuth, signOut } from "firebase/auth";
import { collection, doc, getDoc, onSnapshot, addDoc, serverTimestamp, getDocs } from "firebase/firestore";
import { db } from "../components/firebase"; // Make sure this path points to your firebase config

const Chat = () => {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [newMessage, setNewMessage] = useState("");

  // Get the current authenticated user
  useEffect(() => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUser(currentUser);
      checkIfAdmin(currentUser);
    } else {
      console.error("User not authenticated");
    }
  }, []);

  // Function to check if the user is an admin
  const checkIfAdmin = async (user) => {
    const docRef = doc(db, "roles", user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      if (docSnap.data().role === 'admin') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } else {
      setIsAdmin(false);
    }
  };

  // Function to fetch messages and their responses
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'conversations'), async (snapshot) => {
      const chatData = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const responseSnapshot = await getDocs(collection(db, 'conversations', doc.id, 'responses'));
          const responses = responseSnapshot.docs.map(resDoc => resDoc.data());

          return {
            id: doc.id,
            data: {
              ...doc.data(),
              responses,
            }
          };
        })
      );
      setMessages(chatData);
    });

    return () => unsubscribe();
  }, []);

  // Function to send a new message
  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    await addDoc(collection(db, "conversations"), {
      userName: user.displayName,
      userImage: user.photoURL,
      userMessage: newMessage,
      timestamp: serverTimestamp(),
    });

    setNewMessage("");
  };

  // Function to respond to a message as an admin
  const respondToMessage = async (conversationId) => {
    const response = prompt("Enter your response:");
    if (!response) return;

    await addDoc(collection(db, 'conversations', conversationId, 'responses'), {
      adminName: user.displayName,
      adminImage: user.photoURL,
      message: response,
      timestamp: serverTimestamp(),
    });
  };


  return (
    <div>
      <header>
        <h1>Chat App</h1>
        {user && (
          <>
            <p>Welcome {user.displayName}</p>
            <button onClick={() => signOut(getAuth())}>Logout</button>
          </>
        )}
      </header>

      <main>
        <div>
          {/* Render Messages */}
          {messages.map(({ id, data }) => (
            <div key={id} className="message">
              <img src={data.userImage} alt="user avatar" width="30" />
              <strong>{data.userName}:</strong> {data.userMessage}

              {/* Only admins can reply */}
              {isAdmin && (
                <button onClick={() => respondToMessage(id)}>Reply as Admin</button>
              )}

              {/* Render Admin Responses */}
              {data.responses && data.responses.length > 0 && (
                <div>
                  <h4>Admin Responses:</h4>
                  {data.responses.map((response, idx) => (
                    <div key={idx} className="response">
                      <img src={response.adminImage} alt="admin avatar" width="30" />
                      <strong>{response.adminName}:</strong> {response.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Input Field for Sending New Messages (for regular users) */}
        {!isAdmin && (
          <div>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        )}
      </main>

      <style jsx>{`
        .message {
          border: 1px solid #ccc;
          padding: 10px;
          margin-bottom: 10px;
        }
        .response {
          margin-left: 20px;
          margin-top: 10px;
        }
      `}</style>
    </div>
  );
};

export default Chat;
