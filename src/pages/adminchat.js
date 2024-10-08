import React, { useState, useEffect } from "react";
import { collection, getDocs, getDoc, doc, updateDoc, arrayUnion, onSnapshot, serverTimestamp, Timestamp } from "firebase/firestore";
import { db, auth } from "../components/firebase"; // Assuming Firebase is initialized in 'firebase.js'

const AdminChat = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const admin = auth.currentUser; // Assuming Firebase Auth is used for admin login

  console.log("conversations", conversations);

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

        console.log("message", doc.data().messages);
      } else {
        setMessages([]);
      }
    });

    return () => unsubscribe();
  }, [selectedConversationId]);

  // Admin sends a reply to the selected user conversation
  const sendAdminReply = async () => {
    if (!selectedConversationId) return;

    const newMessageData = {
      senderId: admin.uid,
      senderName: admin.displayName || "Admin",
      text: newMessage,
      time: null,
    };

    try {
      const conversationRef = doc(db, "conversations", selectedConversationId);

      const currentTimestamp = Timestamp.now();


      newMessageData.time = currentTimestamp;

      const conversationSnapshot = await getDoc(conversationRef);

      if (conversationSnapshot.exists()) {
        const conversationData = conversationSnapshot.data();
        const existingMessages = conversationData.messages || [];

        // Add the new message to the array
        const updatedMessages = [...existingMessages, newMessageData]; // Append the new message

        // Update the conversation document with the new array
        await updateDoc(conversationRef, {
          messages: updatedMessages,
        });

        await updateDoc(conversationRef, {
          lastMessageTimestamp: serverTimestamp(), // Update last message timestamp
        });

        console.log('Message sent with actual timestamp');
      }

      ///////////////////

      // // Admin sends a reply
      // await updateDoc(conversationRef, {
      //   messages: arrayUnion(newMessageData),
      // });

      // // Update last message timestamp
      // await updateDoc(conversationRef, {
      //   lastMessageTimestamp: serverTimestamp(),
      // });

      setNewMessage(""); // Clear the input field after sending the message
    } catch (error) {
      console.error("Error sending admin reply: ", error);
    }
  };


  const formatTime = (timestamp) => {
    if (timestamp) {
      const date = new Date(timestamp.seconds * 1000); // Convert Firestore Timestamp to JavaScript Date
      const formattedDate = date.toLocaleDateString(); // Format date (e.g., 10/06/2024)
      const formattedTime = date.toLocaleTimeString(); // Format time (e.g., 3:45 PM)
      return `${formattedDate} ${formattedTime}`; // Combine both date and time
    }
    return '';
  };


  return (
    <div className="bg-white text-black h-screen px-10">
      <h3 className="text-center text-4xl mb-10">Admin Chat</h3>
      <div className="flex gap-20">
        <div>
          <h4>Select a User Conversation</h4>
          {conversations.length === 0 ? (
            <p>No conversations found</p>
          ) : (
            <ul>
              {conversations.map((conversation) => (
                <li
                  className="mt-4 border rounded bg-slate-200 hover:bg-slate-300 p-2"
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
            <h4 className="text-2xl mb-4">Conversation Messages</h4>
            <div className="bg-slate-200 p-6 rounded">
              {messages.length === 0 ? (
                <p>No messages in this conversation yet</p>
              ) : (
                messages.map((message, index) => (
                  <div className="mb-4" key={index}>
                    <strong className="mb-4">{message.senderName}: </strong>{message.text}
                    <br />
                    {/* <em>{new Date(msg.timestamp?.seconds * 1000).toLocaleTimeString()}</em> */}
                    <em className="text-sm">{formatTime(message.time)}</em>
                  </div>

                  // <p key={index}>
                  //   {message.senderName}: {message.text}
                  // </p>
                ))
              )}
            </div>
            <input
              type="text"
              className="bg-slate-200 border border-slate-300 mt-2 p-2"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
            />
            <button className="ml-4" onClick={sendAdminReply}>Send</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminChat;
