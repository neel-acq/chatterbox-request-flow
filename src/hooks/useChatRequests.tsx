
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

    try {
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
        try {
          const requests: ChatRequest[] = [];
          
          for (const doc of snapshot.docs) {
            const requestData = doc.data();
            requests.push({
              id: doc.id,
              from: requestData.from,
              to: requestData.to,
              status: requestData.status,
              createdAt: requestData.createdAt,
              fromUser: requestData.fromUser ? {
                uid: requestData.fromUser.uid,
                displayName: requestData.fromUser.displayName,
                email: requestData.fromUser.email,
                photoURL: requestData.fromUser.photoURL
              } : null
            });
          }
          
          setIncomingRequests(requests);
          if (sentRequests.length > 0 || snapshot.size > 0) {
            setLoading(false);
          }
        } catch (error) {
          console.error("Error processing incoming requests:", error);
        }
      }, (error) => {
        console.error("Error in incoming requests listener:", error);
        setLoading(false);
      });

      const unsubscribeSent = onSnapshot(sentQ, async (snapshot) => {
        try {
          const requests: ChatRequest[] = [];
          
          for (const doc of snapshot.docs) {
            const requestData = doc.data();
            requests.push({
              id: doc.id,
              from: requestData.from,
              to: requestData.to,
              status: requestData.status,
              createdAt: requestData.createdAt,
              toUser: requestData.toUser ? {
                uid: requestData.toUser.uid,
                displayName: requestData.toUser.displayName,
                email: requestData.toUser.email,
                photoURL: requestData.toUser.photoURL
              } : null
            });
          }
          
          setSentRequests(requests);
          if (incomingRequests.length > 0 || snapshot.size > 0) {
            setLoading(false);
          }
        } catch (error) {
          console.error("Error processing sent requests:", error);
        }
      }, (error) => {
        console.error("Error in sent requests listener:", error);
        setLoading(false);
      });

      // Make sure loading is set to false even if no requests are found
      const checkIfEmpty = async () => {
        try {
          const incomingSnapshot = await getDocs(incomingQ);
          const sentSnapshot = await getDocs(sentQ);
          
          if (incomingSnapshot.empty && sentSnapshot.empty) {
            setLoading(false);
          }
        } catch (error) {
          console.error("Error checking for empty requests:", error);
          setLoading(false);
        }
      };

      checkIfEmpty();

      return () => {
        unsubscribeIncoming();
        unsubscribeSent();
      };
    } catch (error) {
      console.error("Error setting up request listeners:", error);
      setLoading(false);
    }
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
