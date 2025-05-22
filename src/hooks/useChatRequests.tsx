
import { useSendChatRequest } from './useSendChatRequest';
import { useRespondToChatRequest } from './useRespondToChatRequest';
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, getDocs } from 'firebase/firestore';
import { firestore } from '../lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { ChatRequest } from '@/types/chatRequest';

// Re-export the ChatRequest type
export type { ChatRequest };

export const useChatRequests = () => {
  const { currentUser } = useAuth();
  const [incomingRequests, setIncomingRequests] = useState<ChatRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<ChatRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { sendChatRequest, isLoading: isSending } = useSendChatRequest();
  const { respondToChatRequest, isLoading: isResponding } = useRespondToChatRequest();

  useEffect(() => {
    if (!currentUser) {
      setIncomingRequests([]);
      setSentRequests([]);
      setLoading(false);
      return;
    }

    // Get incoming requests
    const incomingRef = collection(firestore, 'chatRequests');
    const incomingQ = query(
      incomingRef,
      where('to', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    // Get sent requests
    const sentRef = collection(firestore, 'chatRequests');
    const sentQ = query(
      sentRef,
      where('from', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeIncoming = onSnapshot(incomingQ, async (snapshot) => {
      const requests: ChatRequest[] = [];
      
      for (const doc of snapshot.docs) {
        const request = doc.data() as ChatRequest;
        requests.push({
          id: doc.id,
          ...request
        });
      }
      
      setIncomingRequests(requests);
      if (sentRequests.length > 0 || snapshot.size > 0) {
        setLoading(false);
      }
    });

    const unsubscribeSent = onSnapshot(sentQ, async (snapshot) => {
      const requests: ChatRequest[] = [];
      
      for (const doc of snapshot.docs) {
        const request = doc.data() as ChatRequest;
        requests.push({
          id: doc.id,
          ...request
        });
      }
      
      setSentRequests(requests);
      if (incomingRequests.length > 0 || snapshot.size > 0) {
        setLoading(false);
      }
    });

    // Make sure loading is set to false even if no requests are found
    const checkIfEmpty = async () => {
      const incomingSnapshot = await getDocs(incomingQ);
      const sentSnapshot = await getDocs(sentQ);
      
      if (incomingSnapshot.empty && sentSnapshot.empty) {
        setLoading(false);
      }
    };

    checkIfEmpty();

    return () => {
      unsubscribeIncoming();
      unsubscribeSent();
    };
  }, [currentUser]);

  return { 
    incomingRequests,
    sentRequests,
    loading,
    sendChatRequest,
    respondToChatRequest,
    isResponding,
    isSending
  };
};
