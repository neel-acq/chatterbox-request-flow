
import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp, 
  onSnapshot 
} from 'firebase/firestore';
import { firestore } from '../lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

export type ChatRequest = {
  id: string;
  from: string;
  to: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: any;
  fromUser?: {
    displayName: string;
    photoURL: string | null;
  };
  toUser?: {
    displayName: string;
    photoURL: string | null;
  };
};

export const useChatRequests = () => {
  const { currentUser } = useAuth();
  const [incomingRequests, setIncomingRequests] = useState<ChatRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<ChatRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!currentUser) {
      setIncomingRequests([]);
      setSentRequests([]);
      setLoading(false);
      return;
    }

    const requestsCollection = collection(firestore, 'chatRequests');
    
    // Query for incoming requests
    const incomingQuery = query(
      requestsCollection,
      where('to', '==', currentUser.uid),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    // Query for sent requests
    const sentQuery = query(
      requestsCollection,
      where('from', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const incomingUnsubscribe = onSnapshot(incomingQuery, async (snapshot) => {
      const requests: ChatRequest[] = [];
      
      for (const doc of snapshot.docs) {
        const requestData = { 
          id: doc.id, 
          ...doc.data() 
        } as ChatRequest;
        
        // Fetch sender details
        try {
          const senderDoc = await getDocs(query(
            collection(firestore, 'users'), 
            where('uid', '==', requestData.from)
          ));
          
          if (!senderDoc.empty) {
            const senderData = senderDoc.docs[0].data();
            requestData.fromUser = {
              displayName: senderData.displayName,
              photoURL: senderData.photoURL
            };
          }
        } catch (error) {
          console.error('Error fetching sender data:', error);
        }
        
        requests.push(requestData);
      }
      
      setIncomingRequests(requests);
      setLoading(false);
    });

    const sentUnsubscribe = onSnapshot(sentQuery, async (snapshot) => {
      const requests: ChatRequest[] = [];
      
      for (const doc of snapshot.docs) {
        const requestData = { 
          id: doc.id, 
          ...doc.data() 
        } as ChatRequest;
        
        // Fetch receiver details
        try {
          const receiverDoc = await getDocs(query(
            collection(firestore, 'users'), 
            where('uid', '==', requestData.to)
          ));
          
          if (!receiverDoc.empty) {
            const receiverData = receiverDoc.docs[0].data();
            requestData.toUser = {
              displayName: receiverData.displayName,
              photoURL: receiverData.photoURL
            };
          }
        } catch (error) {
          console.error('Error fetching receiver data:', error);
        }
        
        requests.push(requestData);
      }
      
      setSentRequests(requests);
    });

    return () => {
      incomingUnsubscribe();
      sentUnsubscribe();
    };
  }, [currentUser]);

  const sendChatRequest = async (toUserId: string) => {
    if (!currentUser) {
      toast({
        variant: "destructive",
        title: "Authentication error",
        description: "You must be logged in to send a chat request",
      });
      return;
    }

    if (toUserId === currentUser.uid) {
      toast({
        variant: "destructive",
        title: "Invalid request",
        description: "You cannot send a chat request to yourself",
      });
      return;
    }

    try {
      // Check if a request already exists
      const existingRequestQuery = query(
        collection(firestore, 'chatRequests'),
        where('from', '==', currentUser.uid),
        where('to', '==', toUserId),
      );
      
      const reverseRequestQuery = query(
        collection(firestore, 'chatRequests'),
        where('from', '==', toUserId),
        where('to', '==', currentUser.uid),
      );

      const [existingSnapshot, reverseSnapshot] = await Promise.all([
        getDocs(existingRequestQuery),
        getDocs(reverseRequestQuery)
      ]);

      if (!existingSnapshot.empty) {
        const existingRequest = existingSnapshot.docs[0].data();
        if (existingRequest.status === 'pending') {
          toast({
            title: "Request pending",
            description: "You already have a pending request to this user",
          });
        } else if (existingRequest.status === 'accepted') {
          toast({
            title: "Chat exists",
            description: "You already have an active chat with this user",
          });
        } else {
          // If declined, allow to send again
          await addDoc(collection(firestore, 'chatRequests'), {
            from: currentUser.uid,
            to: toUserId,
            status: 'pending',
            createdAt: serverTimestamp()
          });
          
          toast({
            title: "Request sent",
            description: "Your chat request has been sent",
          });
        }
        return;
      }

      if (!reverseSnapshot.empty) {
        const reverseRequest = reverseSnapshot.docs[0].data();
        if (reverseRequest.status === 'pending') {
          toast({
            title: "Request exists",
            description: "This user has already sent you a request. Check your incoming requests.",
          });
        } else if (reverseRequest.status === 'accepted') {
          toast({
            title: "Chat exists",
            description: "You already have an active chat with this user",
          });
        } else {
          // If declined, allow to send
          await addDoc(collection(firestore, 'chatRequests'), {
            from: currentUser.uid,
            to: toUserId,
            status: 'pending',
            createdAt: serverTimestamp()
          });
          
          toast({
            title: "Request sent",
            description: "Your chat request has been sent",
          });
        }
        return;
      }

      // If no existing requests either way, create a new request
      await addDoc(collection(firestore, 'chatRequests'), {
        from: currentUser.uid,
        to: toUserId,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      toast({
        title: "Request sent",
        description: "Your chat request has been sent",
      });
    } catch (error) {
      console.error("Error sending chat request:", error);
      toast({
        variant: "destructive",
        title: "Request failed",
        description: "Failed to send chat request. Please try again.",
      });
    }
  };

  const respondToChatRequest = async (requestId: string, accept: boolean) => {
    if (!currentUser) {
      toast({
        variant: "destructive",
        title: "Authentication error",
        description: "You must be logged in to respond to a chat request",
      });
      return;
    }

    try {
      const requestRef = doc(firestore, 'chatRequests', requestId);
      const requestDoc = await getDoc(requestRef);
      
      if (!requestDoc.exists()) {
        toast({
          variant: "destructive",
          title: "Request error",
          description: "Chat request not found",
        });
        return;
      }
      
      const requestData = requestDoc.data() as ChatRequest;
      
      if (requestData.to !== currentUser.uid) {
        toast({
          variant: "destructive",
          title: "Permission denied",
          description: "You cannot respond to this request",
        });
        return;
      }

      const newStatus = accept ? 'accepted' : 'declined';
      
      await updateDoc(requestRef, {
        status: newStatus
      });

      if (accept) {
        // Create a chat document when accepted
        const chatId = [requestData.from, requestData.to].sort().join('_');
        
        await setDoc(doc(firestore, 'chats', chatId), {
          participants: [requestData.from, requestData.to],
          createdAt: serverTimestamp(),
          lastMessage: null,
          lastMessageTimestamp: null
        });
        
        toast({
          title: "Request accepted",
          description: "You can now chat with this user",
        });
      } else {
        toast({
          title: "Request declined",
          description: "The chat request has been declined",
        });
      }
    } catch (error) {
      console.error("Error responding to chat request:", error);
      toast({
        variant: "destructive",
        title: "Response failed",
        description: "Failed to respond to chat request. Please try again.",
      });
    }
  };

  return {
    incomingRequests,
    sentRequests,
    loading,
    sendChatRequest,
    respondToChatRequest
  };
};

// Added missing imports to fix the error in the function above
import { getDoc, setDoc } from 'firebase/firestore';
