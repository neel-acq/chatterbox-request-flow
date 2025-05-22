
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc, addDoc, Timestamp, DocumentData } from 'firebase/firestore';
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

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const chatsList: Chat[] = [];
      
      for (const chatDoc of snapshot.docs) {
        const chatData = chatDoc.data() as Chat;
        
        // Find the other user in the chat
        const otherUserId = chatData.participants.find(id => id !== currentUser.uid);
        let otherUserData = null;
        
        if (otherUserId) {
          const otherUserRef = doc(firestore, 'users', otherUserId);
          const otherUserSnap = await getDoc(otherUserRef);
          
          if (otherUserSnap.exists()) {
            // Fixed: correctly type the document data
            const userData = otherUserSnap.data() as DocumentData;
            otherUserData = {
              uid: otherUserId,
              displayName: userData.displayName || null,
              email: userData.email || null,
              photoURL: userData.photoURL || null
            };
          }
        }
        
        chatsList.push({
          id: chatDoc.id,
          ...chatData,
          otherUser: otherUserData
        });
      }
      
      setChats(chatsList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const sendMessage = async (chatId: string, text: string) => {
    if (!currentUser) return;
    
    const messagesRef = collection(firestore, `chats/${chatId}/messages`);
    const chatRef = doc(firestore, 'chats', chatId);
    
    // Add new message
    await addDoc(messagesRef, {
      text,
      sender: currentUser.uid,
      createdAt: Timestamp.now()
    });
    
    // Update last message in chat
    await getDoc(chatRef).then((chatDoc) => {
      if (chatDoc.exists()) {
        chatDoc.ref.update({
          lastMessage: text,
          lastMessageAt: Timestamp.now()
        });
      }
    });
  };

  return { chats, loading, sendMessage };
};
