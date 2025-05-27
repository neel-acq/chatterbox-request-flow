
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface PinnedMessage {
  id: string;
  messageId: string;
  chatId: string;
  content: string;
  senderName: string;
  pinnedAt: any;
  pinnedBy: string;
}

export const usePinnedMessages = (chatId?: string | null) => {
  const [pinnedMessages, setPinnedMessages] = useState<PinnedMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!currentUser || !chatId) {
      setPinnedMessages([]);
      return;
    }

    setLoading(true);
    const pinnedRef = collection(firestore, 'pinnedMessages');
    const q = query(pinnedRef, where('chatId', '==', chatId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pinned: PinnedMessage[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        pinned.push({
          id: doc.id,
          messageId: data.messageId,
          chatId: data.chatId,
          content: data.content,
          senderName: data.senderName,
          pinnedAt: data.pinnedAt,
          pinnedBy: data.pinnedBy
        });
      });
      
      pinned.sort((a, b) => {
        if (!a.pinnedAt || !b.pinnedAt) return 0;
        return b.pinnedAt.toMillis() - a.pinnedAt.toMillis();
      });
      
      setPinnedMessages(pinned);
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser, chatId]);

  const pinMessage = async (messageId: string, content: string, senderName: string) => {
    if (!currentUser || !chatId) return;

    try {
      await addDoc(collection(firestore, 'pinnedMessages'), {
        messageId,
        chatId,
        content,
        senderName,
        pinnedAt: new Date(),
        pinnedBy: currentUser.uid
      });

      toast({
        title: "Message pinned",
        description: "Message has been pinned to this chat",
      });
    } catch (error) {
      console.error('Error pinning message:', error);
      toast({
        variant: "destructive",
        title: "Failed to pin message",
        description: "Please try again",
      });
    }
  };

  const unpinMessage = async (pinnedMessageId: string) => {
    try {
      await deleteDoc(doc(firestore, 'pinnedMessages', pinnedMessageId));
      
      toast({
        title: "Message unpinned",
        description: "Message has been unpinned from this chat",
      });
    } catch (error) {
      console.error('Error unpinning message:', error);
      toast({
        variant: "destructive",
        title: "Failed to unpin message",
        description: "Please try again",
      });
    }
  };

  const getAllPinnedMessages = async () => {
    if (!currentUser) return [];

    try {
      const pinnedRef = collection(firestore, 'pinnedMessages');
      const q = query(pinnedRef, where('pinnedBy', '==', currentUser.uid));
      const snapshot = await getDocs(q);
      
      const allPinned: PinnedMessage[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        allPinned.push({
          id: doc.id,
          messageId: data.messageId,
          chatId: data.chatId,
          content: data.content,
          senderName: data.senderName,
          pinnedAt: data.pinnedAt,
          pinnedBy: data.pinnedBy
        });
      });

      return allPinned.sort((a, b) => {
        if (!a.pinnedAt || !b.pinnedAt) return 0;
        return b.pinnedAt.toMillis() - a.pinnedAt.toMillis();
      });
    } catch (error) {
      console.error('Error fetching all pinned messages:', error);
      return [];
    }
  };

  return {
    pinnedMessages,
    loading,
    pinMessage,
    unpinMessage,
    getAllPinnedMessages
  };
};
