import { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc, onSnapshot, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { db } from '../components/firebase'; // Assuming this is your Firebase setup file

export default function UserChat({ user }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const conversationId = user.uid; // Assuming conversationId is the user's UID

  // Fetch messages in real-time using Firestore's onSnapshot
  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'conversations', conversationId),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          setMessages(docSnapshot.data().messages || []);
        } else {
          console.error('Conversation does not exist.');
        }
      },
      (error) => {
        console.error('Error fetching messages: ', error);
      }
    );

    return () => unsubscribe(); // Clean up the listener when the component unmounts
  }, [conversationId]);

  const sendMessage = async () => {
    if (newMessage.trim() === '') return;

    const messageData = {
      senderId: user.uid,
      senderName: user.displayName,
      text: newMessage,
    };

    try {
      const conversationRef = doc(db, 'conversations', conversationId);

      // First, add the message without the timestamp using arrayUnion
      await updateDoc(conversationRef, {
        messages: arrayUnion(messageData), // Add message without timestamp
      });

      // Then, add the timestamp in a separate update
      await updateDoc(conversationRef, {
        lastMessageTimestamp: serverTimestamp(), // Update last message timestamp
      });

      setNewMessage(''); // Clear the input after sending
    } catch (error) {
      console.error('Error sending message: ', error);
    }
  };


  return (
    <div>
      <div>
        {messages.map((msg, index) => (
          <div key={index}>
            <strong>{msg.senderName}: </strong>{msg.text} <em>{new Date(msg.timestamp?.seconds * 1000).toLocaleTimeString()}</em>
          </div>
        ))}
      </div>
      <input
        type="text"
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        placeholder="Type your message"
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}
