
import { useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { firestore } from '../lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { ChatRequest } from '@/types/chatRequest';
import { createChatDocument } from '@/utils/chatRequestUtils';

export const useRespondToChatRequest = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const respondToChatRequest = async (requestId: string, accept: boolean) => {
    if (!currentUser) {
      toast({
        variant: "destructive",
        title: "Authentication error",
        description: "You must be logged in to respond to a chat request",
      });
      return;
    }

    setIsLoading(true);

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
        await createChatDocument(requestData.from, requestData.to);
        
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
    } finally {
      setIsLoading(false);
    }
  };

  return { respondToChatRequest, isLoading };
};
