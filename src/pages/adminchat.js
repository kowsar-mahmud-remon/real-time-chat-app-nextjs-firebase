import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc, arrayUnion, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../components/firebase"; // Assuming Firebase is initialized in 'firebase.js'

const AdminChat = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const admin = auth.currentUser; // Assuming Firebase Auth is used for admin login

  // Fetch all conversations (admin-side)
  useEffect(() => {
    const loadConversations = async () => {
      const conversationsRef = collection(db, "conversations");
      const querySnapshot = await getDocs(conversationsRef);

      const conversationsData = [];
      querySnapshot.forEach((doc) => {
        conversationsData.push({ id: doc.id, ...doc.data() });
      });
      setConversations(conversationsData);
    };

    loadConversations();
  }, []);

  // Load selected conversation's messages
  useEffect(() => {
    if (!selectedConversationId) return;

    const conversationRef = doc(db, "conversations", selectedConversationId);
    const unsubscribe = onSnapshot(conversationRef, (doc) => {
      if (doc.exists()) {
        setMessages(doc.data().messages || []);
      } else {
        setMessages([]);
      }
    });

    return () => unsubscribe();
  }, [selectedConversationId]);

  // Admin sends a reply to the selected user conversation
  const sendAdminReply = async () => {
    if (!selectedConversationId) return;

    try {
      const conversationRef = doc(db, "conversations", selectedConversationId);
      const newMessageData = {
        senderId: admin.uid,
        senderName: admin.displayName || "Admin",
        text: newMessage,
      };

      // Admin sends a reply
      await updateDoc(conversationRef, {
        messages: arrayUnion(newMessageData),
      });

      // Update last message timestamp
      await updateDoc(conversationRef, {
        lastMessageTimestamp: serverTimestamp(),
      });

      setNewMessage(""); // Clear the input field after sending the message
    } catch (error) {
      console.error("Error sending admin reply: ", error);
    }
  };

  return (
    <div>
      <h3>Admin Chat</h3>
      <div>
        <h4>Select a User Conversation</h4>
        {conversations.length === 0 ? (
          <p>No conversations found</p>
        ) : (
          <ul>
            {conversations.map((conversation) => (
              <li
                key={conversation.id}
                onClick={() => setSelectedConversationId(conversation.id)}
                style={{ cursor: "pointer" }}
              >
                Conversation with User ID: {conversation.id}
              </li>
            ))}
          </ul>
        )}
      </div>

      {selectedConversationId && (
        <div>
          <h4>Conversation Messages</h4>
          <div>
            {messages.length === 0 ? (
              <p>No messages in this conversation yet</p>
            ) : (
              messages.map((message, index) => (
                <p key={index}>
                  {message.senderName}: {message.text}
                </p>
              ))
            )}
          </div>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
          />
          <button onClick={sendAdminReply}>Send</button>
        </div>
      )}
    </div>
  );
};

export default AdminChat;
