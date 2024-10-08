import { useState, useEffect } from 'react';
import { collection, addDoc, getDoc, updateDoc, doc, onSnapshot, serverTimestamp, arrayUnion, Timestamp } from 'firebase/firestore';
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
          console.log("user message", docSnapshot.data().messages);
          console.log("date", serverTimestamp());


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
      time: null,
    };

    try {
      const conversationRef = doc(db, 'conversations', conversationId);
      const currentTimestamp = Timestamp.now();

      // Add the actual timestamp to the message data
      messageData.time = currentTimestamp;

      // Get the current document data
      const conversationSnapshot = await getDoc(conversationRef);
      if (conversationSnapshot.exists()) {
        const conversationData = conversationSnapshot.data();
        const existingMessages = conversationData.messages || [];

        // Add the new message to the array
        const updatedMessages = [...existingMessages, messageData]; // Append the new message

        // Update the conversation document with the new array
        await updateDoc(conversationRef, {
          messages: updatedMessages,
        });

        await updateDoc(conversationRef, {
          lastMessageTimestamp: serverTimestamp(), // Update last message timestamp
        });

        console.log('Message sent with actual timestamp');
      }



      setNewMessage(''); // Clear the input after sending
    } catch (error) {
      console.error('Error sending message: ', error);
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
    <div className="bg-white text-black h-screen flex justify-center">
      <div className="">
        <div className='bg-slate-200 p-6 rounded'>
          {messages.map((msg, index) => (
            <div className='mb-4' key={index}>
              <strong className='mb-4'>{msg.senderName}: </strong>{msg.text}
              {/* <em>{new Date(msg.timestamp?.seconds * 1000).toLocaleTimeString()}</em> */}
              <br />
              <em className='text-sm'>{formatTime(msg.time)}</em>
            </div>
          ))}
        </div>
        <input
          className='bg-slate-200 border border-slate-300 mt-2 p-2'
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message"
        />
        <button className='ml-4' onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}
