
import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  doc,
  getDocs,
  getDoc,
  addDoc, 
  onSnapshot,
  serverTimestamp,
  updateDoc,
  limit,
  Timestamp
} from 'firebase/firestore';
import { firestore } from '../lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

export type Chat = {
  id: string;
  participants: string[];
  createdAt: Timestamp;
  lastMessage: string | null;
  lastMessageTimestamp: Timestamp | null;
  otherUser?: {
    uid: string;
    displayName: string;
    photoURL: string | null;
  };
};

export type Message = {
  id: string;
  chatId: string;
  sender: string;
  text: string;
  createdAt: Timestamp;
};

export const useChats = () => {
  const { currentUser } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!currentUser) {
      setChats([]);
      setLoading(false);
      return;
    }

    const chatsQuery = query(
      collection(firestore, 'chats'),
      where('participants', 'array-contains', currentUser.uid),
      orderBy('lastMessageTimestamp', 'desc')
    );

    const unsubscribe = onSnapshot(chatsQuery, async (snapshot) => {
      const chatList: Chat[] = [];
      
      const chatPromises = snapshot.docs.map(async (doc) => {
        const chatData = { id: doc.id, ...doc.data() } as Chat;
        
        // Find the other participant
        const otherParticipantId = chatData.participants.find(
          id => id !== currentUser.uid
        );
        
        if (otherParticipantId) {
          try {
            const userDoc = await getDoc(doc(firestore, 'users', otherParticipantId));
            
            if (userDoc.exists()) {
              const userData = userDoc.data();
              chatData.otherUser = {
                uid: otherParticipantId,
                displayName: userData.displayName,
                photoURL: userData.photoURL
              };
            }
          } catch (error) {
            console.error('Error fetching other user:', error);
          }
        }
        
        return chatData;
      });
      
      const resolvedChats = await Promise.all(chatPromises);
      setChats(resolvedChats);
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser]);

  return { chats, loading };
};

export const useChat = (chatId: string | null) => {
  const { currentUser } = useAuth();
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!currentUser || !chatId) {
      setChat(null);
      setMessages([]);
      setLoading(false);
      return;
    }

    const chatRef = doc(firestore, 'chats', chatId);
    const messagesRef = collection(firestore, 'chats', chatId, 'messages');
    const messagesQuery = query(messagesRef, orderBy('createdAt', 'asc'));

    const chatUnsubscribe = onSnapshot(chatRef, async (docSnapshot) => {
      if (docSnapshot.exists()) {
        const chatData = { id: docSnapshot.id, ...docSnapshot.data() } as Chat;
        
        // Find the other participant
        const otherParticipantId = chatData.participants.find(
          id => id !== currentUser.uid
        );
        
        if (otherParticipantId) {
          try {
            const userDoc = await getDoc(doc(firestore, 'users', otherParticipantId));
            
            if (userDoc.exists()) {
              const userData = userDoc.data();
              chatData.otherUser = {
                uid: otherParticipantId,
                displayName: userData.displayName,
                photoURL: userData.photoURL
              };
            }
          } catch (error) {
            console.error('Error fetching other user:', error);
          }
        }
        
        setChat(chatData);
      } else {
        setChat(null);
      }
    });

    const messagesUnsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesList = snapshot.docs.map(doc => ({
        id: doc.id,
        chatId,
        ...doc.data()
      })) as Message[];
      
      setMessages(messagesList);
      setLoading(false);
    });

    return () => {
      chatUnsubscribe();
      messagesUnsubscribe();
    };
  }, [currentUser, chatId]);

  const sendMessage = async (text: string) => {
    if (!currentUser || !chatId || !text.trim()) {
      return;
    }

    try {
      const messageData = {
        chatId,
        sender: currentUser.uid,
        text,
        createdAt: serverTimestamp()
      };

      // Add message to the messages subcollection
      await addDoc(collection(firestore, 'chats', chatId, 'messages'), messageData);
      
      // Update the chat with the last message
      await updateDoc(doc(firestore, 'chats', chatId), {
        lastMessage: text,
        lastMessageTimestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        variant: "destructive",
        title: "Failed to send message",
        description: "Please try again",
      });
    }
  };

  return { chat, messages, loading, sendMessage };
};
