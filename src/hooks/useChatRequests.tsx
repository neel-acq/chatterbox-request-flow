
import { useSendChatRequest } from './useSendChatRequest';
import { useRespondToChatRequest } from './useRespondToChatRequest';
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, getDocs } from 'firebase/firestore';
import { firestore } from '../lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { ChatRequest } from '@/types/chatRequest';

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
      console.log("No current user, clearing requests");
      setIncomingRequests([]);
      setSentRequests([]);
      setLoading(false);
      return;
    }

    console.log("Setting up chat request listeners for user:", currentUser.uid);
    let unsubscribeIncoming: (() => void) | undefined;
    let unsubscribeSent: (() => void) | undefined;

    try {
      // Incoming requests listener
      const incomingRef = collection(firestore, 'chatRequests');
      const incomingQ = query(
        incomingRef,
        where('to', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );

      unsubscribeIncoming = onSnapshot(incomingQ, (snapshot) => {
        console.log(`Received ${snapshot.size} incoming requests`);
        try {
          const requests: ChatRequest[] = [];
          
          snapshot.forEach((doc) => {
            const requestData = doc.data();
            console.log("Processing incoming request:", doc.id, requestData);
            
            const sanitizedData: ChatRequest = {
              id: doc.id,
              from: String(requestData.from || ''),
              to: String(requestData.to || ''),
              status: (requestData.status as 'pending' | 'accepted' | 'declined') || 'pending',
              createdAt: requestData.createdAt,
              fromUser: requestData.fromUser ? {
                displayName: String(requestData.fromUser.displayName || ''),
                photoURL: requestData.fromUser.photoURL || null
              } : null
            };
            requests.push(sanitizedData);
          });
          
          setIncomingRequests(requests);
          console.log("Updated incoming requests:", requests.length);
        } catch (error) {
          console.error("Error processing incoming requests:", error);
        }
      }, (error) => {
        console.error("Error in incoming requests listener:", error);
      });

      // Sent requests listener
      const sentRef = collection(firestore, 'chatRequests');
      const sentQ = query(
        sentRef,
        where('from', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );

      unsubscribeSent = onSnapshot(sentQ, (snapshot) => {
        console.log(`Received ${snapshot.size} sent requests`);
        try {
          const requests: ChatRequest[] = [];
          
          snapshot.forEach((doc) => {
            const requestData = doc.data();
            console.log("Processing sent request:", doc.id, requestData);
            
            const sanitizedData: ChatRequest = {
              id: doc.id,
              from: String(requestData.from || ''),
              to: String(requestData.to || ''),
              status: (requestData.status as 'pending' | 'accepted' | 'declined') || 'pending',
              createdAt: requestData.createdAt,
              toUser: requestData.toUser ? {
                displayName: String(requestData.toUser.displayName || ''),
                photoURL: requestData.toUser.photoURL || null
              } : null
            };
            requests.push(sanitizedData);
          });
          
          setSentRequests(requests);
          console.log("Updated sent requests:", requests.length);
        } catch (error) {
          console.error("Error processing sent requests:", error);
        }
      }, (error) => {
        console.error("Error in sent requests listener:", error);
      });

      // Set loading to false after a short delay to allow initial data to load
      setTimeout(() => {
        setLoading(false);
      }, 2000);

      return () => {
        console.log("Cleaning up chat request listeners");
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
