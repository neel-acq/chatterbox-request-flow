
import { useSendChatRequest } from './useSendChatRequest';
import { useRespondToChatRequest } from './useRespondToChatRequest';
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { firestore } from '../lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { ChatRequest } from '@/types/chatRequest';

export type { ChatRequest };

const sanitizeChatRequest = (data: any, docId: string): ChatRequest => {
  return {
    id: docId,
    from: String(data.from || ''),
    to: String(data.to || ''),
    status: (data.status as 'pending' | 'accepted' | 'declined') || 'pending',
    createdAt: data.createdAt || null,
    fromUser: data.fromUser ? {
      displayName: String(data.fromUser.displayName || ''),
      photoURL: data.fromUser.photoURL || null
    } : null,
    toUser: data.toUser ? {
      displayName: String(data.toUser.displayName || ''),
      photoURL: data.toUser.photoURL || null
    } : null
  };
};

export const useChatRequests = () => {
  const { currentUser } = useAuth();
  const [incomingRequests, setIncomingRequests] = useState<ChatRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<ChatRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { sendChatRequest, isLoading: isSending } = useSendChatRequest();
  const { respondToChatRequest, isLoading: isResponding } = useRespondToChatRequest();

  useEffect(() => {
    if (!currentUser) {
      console.log("No current user, clearing requests");
      setIncomingRequests([]);
      setSentRequests([]);
      setLoading(false);
      setError(null);
      return;
    }

    console.log("Setting up chat request listeners for user:", currentUser.uid);
    setError(null);
    
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

      unsubscribeIncoming = onSnapshot(
        incomingQ,
        (snapshot) => {
          console.log(`Received ${snapshot.size} incoming requests`);
          try {
            const requests: ChatRequest[] = [];
            
            snapshot.forEach((doc) => {
              try {
                const requestData = doc.data();
                console.log("Processing incoming request:", doc.id);
                
                const sanitizedData = sanitizeChatRequest(requestData, doc.id);
                requests.push(sanitizedData);
              } catch (docError) {
                console.error("Error processing request document:", docError);
              }
            });
            
            setIncomingRequests(requests);
            console.log("Updated incoming requests:", requests.length);
          } catch (error) {
            console.error("Error processing incoming requests:", error);
            setError("Failed to load incoming requests");
          }
        },
        (error) => {
          console.error("Error in incoming requests listener:", error);
          setError("Connection error for incoming requests");
        }
      );

      // Sent requests listener
      const sentRef = collection(firestore, 'chatRequests');
      const sentQ = query(
        sentRef,
        where('from', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );

      unsubscribeSent = onSnapshot(
        sentQ,
        (snapshot) => {
          console.log(`Received ${snapshot.size} sent requests`);
          try {
            const requests: ChatRequest[] = [];
            
            snapshot.forEach((doc) => {
              try {
                const requestData = doc.data();
                console.log("Processing sent request:", doc.id);
                
                const sanitizedData = sanitizeChatRequest(requestData, doc.id);
                requests.push(sanitizedData);
              } catch (docError) {
                console.error("Error processing request document:", docError);
              }
            });
            
            setSentRequests(requests);
            console.log("Updated sent requests:", requests.length);
          } catch (error) {
            console.error("Error processing sent requests:", error);
            setError("Failed to load sent requests");
          }
        },
        (error) => {
          console.error("Error in sent requests listener:", error);
          setError("Connection error for sent requests");
        }
      );

      // Set loading to false after initial setup
      setTimeout(() => {
        setLoading(false);
      }, 1000);

    } catch (error) {
      console.error("Error setting up request listeners:", error);
      setError("Failed to connect to chat requests");
      setLoading(false);
    }

    return () => {
      console.log("Cleaning up chat request listeners");
      if (unsubscribeIncoming) unsubscribeIncoming();
      if (unsubscribeSent) unsubscribeSent();
    };
  }, [currentUser]);

  return { 
    incomingRequests,
    sentRequests,
    loading,
    error,
    sendChatRequest,
    respondToChatRequest,
    isResponding,
    isSending
  };
};
