
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc, addDoc, Timestamp, DocumentData, updateDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';

export interface UserData {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export interface Message {
  id: string;
  text: string;
  sender: string;
  createdAt: Timestamp;
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage: string | null;
  lastMessageAt: Timestamp | null;
  createdAt: Timestamp;
  otherUser?: UserData | null;
}

export const useChats = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) {
      setChats([]);
      setLoading(false);
      return;
    }

    // Query chats where currentUser is a participant
    const chatsRef = collection(firestore, 'chats');
    const q = query(
      chatsRef,
      where('participants', 'array-contains', currentUser.uid),
      orderBy('lastMessageAt', 'desc')
    );

    try {
      const unsubscribe = onSnapshot(q, async (snapshot) => {
        try {
          const chatsList: Chat[] = [];
          
          for (const chatDoc of snapshot.docs) {
            const chatData = chatDoc.data() as Chat;
            
            // Find the other user in the chat
            const otherUserId = chatData.participants.find(id => id !== currentUser.uid);
            let otherUserData = null;
            
            if (otherUserId) {
              try {
                const otherUserRef = doc(firestore, 'users', otherUserId);
                const otherUserSnap = await getDoc(otherUserRef);
                
                if (otherUserSnap.exists()) {
                  const userData = otherUserSnap.data() as DocumentData;
                  otherUserData = {
                    uid: otherUserId,
                    displayName: userData.displayName || null,
                    email: userData.email || null,
                    photoURL: userData.photoURL || null
                  };
                }
              } catch (error) {
                console.error(`Error fetching other user data: ${otherUserId}`, error);
              }
            }
            
            // Create a new chat object with safe serializable properties
            const safeChat: Chat = {
              id: chatDoc.id,
              participants: [...chatData.participants],
              lastMessage: chatData.lastMessage,
              lastMessageAt: chatData.lastMessageAt,
              createdAt: chatData.createdAt,
              otherUser: otherUserData
            };
            
            chatsList.push(safeChat);
          }
          
          setChats(chatsList);
          setLoading(false);
        } catch (error) {
          console.error("Error processing chat data:", error);
          setLoading(false);
        }
      }, (error) => {
        console.error("Error in chat snapshot listener:", error);
        setLoading(false);
      });
      
      return () => unsubscribe();
    } catch (error) {
      console.error("Error setting up chat listener:", error);
      setLoading(false);
    }
  }, [currentUser]);

  const sendMessage = async (chatId: string, text: string) => {
    if (!currentUser) return;
    
    try {
      const messagesRef = collection(firestore, `chats/${chatId}/messages`);
      const chatRef = doc(firestore, 'chats', chatId);
      
      // Add new message
      await addDoc(messagesRef, {
        text,
        sender: currentUser.uid,
        createdAt: Timestamp.now()
      });
      
      // Update last message in chat
      const chatDoc = await getDoc(chatRef);
      if (chatDoc.exists()) {
        await updateDoc(chatRef, {
          lastMessage: text,
          lastMessageAt: Timestamp.now()
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return { chats, loading, sendMessage };
};

// Add a new hook for individual chat view
export const useChat = (chatId: string | null) => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!chatId || !currentUser) {
      setChat(null);
      setMessages([]);
      setLoading(false);
      return;
    }

    let unsubChat: (() => void) | undefined;
    let unsubMessages: (() => void) | undefined;

    try {
      // Get chat data
      const chatRef = doc(firestore, 'chats', chatId);
      unsubChat = onSnapshot(chatRef, async (chatDoc) => {
        try {
          if (!chatDoc.exists()) {
            setChat(null);
            setLoading(false);
            return;
          }

          const chatData = chatDoc.data() as Omit<Chat, 'id'>;
          const otherUserId = chatData.participants.find(id => id !== currentUser.uid);
          let otherUserData = null;
          
          if (otherUserId) {
            try {
              const otherUserRef = doc(firestore, 'users', otherUserId);
              const otherUserSnap = await getDoc(otherUserRef);
              
              if (otherUserSnap.exists()) {
                const userData = otherUserSnap.data() as DocumentData;
                otherUserData = {
                  uid: otherUserId,
                  displayName: userData.displayName || null,
                  email: userData.email || null,
                  photoURL: userData.photoURL || null
                };
              }
            } catch (error) {
              console.error("Error fetching other user data:", error);
            }
          }
          
          // Create a serializable chat object
          setChat({
            id: chatDoc.id,
            participants: [...chatData.participants],
            lastMessage: chatData.lastMessage,
            lastMessageAt: chatData.lastMessageAt,
            createdAt: chatData.createdAt,
            otherUser: otherUserData
          });
        } catch (error) {
          console.error("Error processing chat document:", error);
        }
      }, (error) => {
        console.error("Error in chat snapshot listener:", error);
      });

      // Get messages
      const messagesRef = collection(firestore, `chats/${chatId}/messages`);
      const messagesQuery = query(messagesRef, orderBy('createdAt', 'asc'));
      
      unsubMessages = onSnapshot(messagesQuery, (snapshot) => {
        try {
          const messagesList: Message[] = [];
          
          snapshot.forEach((doc) => {
            const msgData = doc.data();
            messagesList.push({
              id: doc.id,
              text: msgData.text || '',
              sender: msgData.sender || '',
              createdAt: msgData.createdAt
            });
          });
          
          setMessages(messagesList);
          setLoading(false);
        } catch (error) {
          console.error("Error processing messages:", error);
          setLoading(false);
        }
      }, (error) => {
        console.error("Error in messages snapshot listener:", error);
        setLoading(false);
      });
    } catch (error) {
      console.error("Error setting up chat listeners:", error);
      setLoading(false);
    }

    return () => {
      if (unsubChat) unsubChat();
      if (unsubMessages) unsubMessages();
    };
  }, [chatId, currentUser]);

  const sendMessage = async (text: string) => {
    if (!currentUser || !chatId) return;
    
    try {
      const messagesRef = collection(firestore, `chats/${chatId}/messages`);
      const chatRef = doc(firestore, 'chats', chatId);
      
      // Add new message
      await addDoc(messagesRef, {
        text,
        sender: currentUser.uid,
        createdAt: Timestamp.now()
      });
      
      // Update last message in chat
      await updateDoc(chatRef, {
        lastMessage: text,
        lastMessageAt: Timestamp.now()
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return { chat, messages, loading, sendMessage };
};
