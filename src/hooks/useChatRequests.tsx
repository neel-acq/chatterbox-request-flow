import { useSendChatRequest } from './useSendChatRequest';
import { useRespondToChatRequest } from './useRespondToChatRequest';
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { firestore } from '../lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { ChatRequest } from '@/types/chatRequest';
import { fetchUserDetailsForRequests } from '@/utils/chatRequestUtils';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  const [incomingRequests, setIncomingRequests] = useState<ChatRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<ChatRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { sendChatRequest, isLoading: isSending } = useSendChatRequest();
  const { respondToChatRequest, isLoading: isResponding } = useRespondToChatRequest();

  const cancelChatRequest = async (requestId: string) => {
    try {
      await deleteDoc(doc(firestore, 'chatRequests', requestId));
      toast({
        title: "Request cancelled",
        description: "Your chat request has been cancelled",
      });
    } catch (error) {
      console.error("Error cancelling chat request:", error);
      toast({
        variant: "destructive",
        title: "Failed to cancel request",
        description: "Please try again",
      });
    }
  };

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
      // Incoming requests listener - removed orderBy to avoid index requirement
      const incomingRef = collection(firestore, 'chatRequests');
      const incomingQ = query(
        incomingRef,
        where('to', '==', currentUser.uid)
      );

      unsubscribeIncoming = onSnapshot(
        incomingQ,
        async (snapshot) => {
          console.log(`Received ${snapshot.size} incoming requests`);
          try {
            const requests: ChatRequest[] = [];
            
            snapshot.forEach((doc) => {
              try {
                const requestData = doc.data();
                console.log("Processing incoming request:", doc.id, requestData);
                
                const sanitizedData = sanitizeChatRequest(requestData, doc.id);
                requests.push(sanitizedData);
              } catch (docError) {
                console.error("Error processing request document:", docError);
              }
            });
            
            // Sort by createdAt in memory (newest first)
            requests.sort((a, b) => {
              if (!a.createdAt || !b.createdAt) return 0;
              return b.createdAt.toMillis() - a.createdAt.toMillis();
            });

            // Fetch user details for the from users
            const requestsWithUserData = await fetchUserDetailsForRequests(requests, 'from');
            
            setIncomingRequests(requestsWithUserData);
            console.log("Updated incoming requests:", requestsWithUserData.length);
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

      // Sent requests listener - removed orderBy to avoid index requirement
      const sentRef = collection(firestore, 'chatRequests');
      const sentQ = query(
        sentRef,
        where('from', '==', currentUser.uid)
      );

      unsubscribeSent = onSnapshot(
        sentQ,
        async (snapshot) => {
          console.log(`Received ${snapshot.size} sent requests`);
          try {
            const requests: ChatRequest[] = [];
            
            snapshot.forEach((doc) => {
              try {
                const requestData = doc.data();
                console.log("Processing sent request:", doc.id, requestData);
                
                const sanitizedData = sanitizeChatRequest(requestData, doc.id);
                requests.push(sanitizedData);
              } catch (docError) {
                console.error("Error processing request document:", docError);
              }
            });
            
            // Sort by createdAt in memory (newest first)
            requests.sort((a, b) => {
              if (!a.createdAt || !b.createdAt) return 0;
              return b.createdAt.toMillis() - a.createdAt.toMillis();
            });

            // Fetch user details for the to users
            const requestsWithUserData = await fetchUserDetailsForRequests(requests, 'to');
            
            setSentRequests(requestsWithUserData);
            console.log("Updated sent requests:", requestsWithUserData.length);
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
      }, 2000);

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
    cancelChatRequest,
    isResponding,
    isSending
  };
};
