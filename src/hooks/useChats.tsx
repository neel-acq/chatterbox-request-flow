import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, onSnapshot, doc, getDoc, addDoc, Timestamp, DocumentData, updateDoc } from 'firebase/firestore';
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
  type?: 'text' | 'image';
  imageUrl?: string;
  edited?: boolean;
  editedAt?: any;
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage: string | null;
  lastMessageAt: Timestamp | null;
  createdAt: Timestamp;
  isSelfChat?: boolean;
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

    console.log("Setting up chats listener for user:", currentUser.uid);

    // Query chats where currentUser is a participant
    const chatsRef = collection(firestore, 'chats');
    const q = query(
      chatsRef,
      where('participants', 'array-contains', currentUser.uid)
    );

    try {
      const unsubscribe = onSnapshot(q, async (snapshot) => {
        try {
          console.log(`Found ${snapshot.size} chats for user`);
          const chatsList: Chat[] = [];
          
          for (const chatDoc of snapshot.docs) {
            const chatData = chatDoc.data() as Chat;
            console.log("Processing chat:", chatDoc.id, chatData);
            
            // Check if it's a self-chat
            const isSelfChat = chatData.isSelfChat || chatData.participants.length === 1;
            
            let otherUserData = null;
            
            if (isSelfChat) {
              // For self-chat, use current user data
              otherUserData = {
                uid: currentUser.uid,
                displayName: "Me",
                email: currentUser.email,
                photoURL: currentUser.photoURL
              };
            } else {
              // Find the other user in the chat
              const otherUserId = chatData.participants.find(id => id !== currentUser.uid);
              
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
            }
            
            // Create a new chat object with safe serializable properties
            const safeChat: Chat = {
              id: chatDoc.id,
              participants: [...chatData.participants],
              lastMessage: chatData.lastMessage,
              lastMessageAt: chatData.lastMessageAt,
              createdAt: chatData.createdAt,
              isSelfChat,
              otherUser: otherUserData
            };
            
            chatsList.push(safeChat);
          }
          
          // Sort by lastMessageAt (most recent first)
          chatsList.sort((a, b) => {
            if (!a.lastMessageAt && !b.lastMessageAt) return 0;
            if (!a.lastMessageAt) return 1;
            if (!b.lastMessageAt) return -1;
            return b.lastMessageAt.toMillis() - a.lastMessageAt.toMillis();
          });
          
          setChats(chatsList);
          setLoading(false);
          console.log("Updated chats list:", chatsList.length);
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
        createdAt: Timestamp.now(),
        type: 'text'
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
          const isSelfChat = chatData.isSelfChat || chatData.participants.length === 1;
          
          let otherUserData = null;
          
          if (isSelfChat) {
            otherUserData = {
              uid: currentUser.uid,
              displayName: "Me",
              email: currentUser.email,
              photoURL: currentUser.photoURL
            };
          } else {
            const otherUserId = chatData.participants.find(id => id !== currentUser.uid);
            
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
          }
          
          // Create a serializable chat object
          setChat({
            id: chatDoc.id,
            participants: [...chatData.participants],
            lastMessage: chatData.lastMessage,
            lastMessageAt: chatData.lastMessageAt,
            createdAt: chatData.createdAt,
            isSelfChat,
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
      
      unsubMessages = onSnapshot(messagesRef, (snapshot) => {
        try {
          const messagesList: Message[] = [];
          
          snapshot.forEach((doc) => {
            const msgData = doc.data();
            messagesList.push({
              id: doc.id,
              text: msgData.text || '',
              sender: msgData.sender || '',
              createdAt: msgData.createdAt,
              type: msgData.type || 'text',
              imageUrl: msgData.imageUrl,
              edited: msgData.edited,
              editedAt: msgData.editedAt
            });
          });
          
          // Sort messages by createdAt
          messagesList.sort((a, b) => {
            if (!a.createdAt || !b.createdAt) return 0;
            return a.createdAt.toMillis() - b.createdAt.toMillis();
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
        createdAt: Timestamp.now(),
        type: 'text'
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
