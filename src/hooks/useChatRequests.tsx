
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

    let unsubscribeIncoming: (() => void) | undefined;
    let unsubscribeSent: (() => void) | undefined;

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

      unsubscribeIncoming = onSnapshot(incomingQ, async (snapshot) => {
        try {
          const requests: ChatRequest[] = [];
          
          for (const doc of snapshot.docs) {
            const requestData = doc.data();
            // Clone and sanitize data for serialization
            const sanitizedData: ChatRequest = {
              id: doc.id,
              from: requestData.from || '',
              to: requestData.to || '',
              status: (requestData.status as 'pending' | 'accepted' | 'declined') || 'pending',
              createdAt: requestData.createdAt,
              fromUser: requestData.fromUser ? {
                displayName: requestData.fromUser.displayName || '',
                photoURL: requestData.fromUser.photoURL || null
                // Remove the uid property as it's not in the type definition
              } : null
            };
            requests.push(sanitizedData);
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

      unsubscribeSent = onSnapshot(sentQ, async (snapshot) => {
        try {
          const requests: ChatRequest[] = [];
          
          for (const doc of snapshot.docs) {
            const requestData = doc.data();
            // Clone and sanitize data for serialization
            const sanitizedData: ChatRequest = {
              id: doc.id,
              from: requestData.from || '',
              to: requestData.to || '',
              status: (requestData.status as 'pending' | 'accepted' | 'declined') || 'pending',
              createdAt: requestData.createdAt,
              toUser: requestData.toUser ? {
                displayName: requestData.toUser.displayName || '',
                photoURL: requestData.toUser.photoURL || null
                // Remove the uid property as it's not in the type definition
              } : null
            };
            requests.push(sanitizedData);
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
        if (unsubscribeIncoming) unsubscribeIncoming();
        if (unsubscribeSent) unsubscribeSent();
      };
    } catch (error) {
      console.error("Error setting up request listeners:", error);
      setLoading(false);
      return () => {};
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
