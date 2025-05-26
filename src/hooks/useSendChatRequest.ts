
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { checkExistingRequests, createChatRequestDocument, createChatDocument } from '@/utils/chatRequestUtils';

export const useSendChatRequest = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const sendChatRequest = async (toUserId: string) => {
    if (!currentUser) {
      toast({
        variant: "destructive",
        title: "Authentication error",
        description: "You must be logged in to send a chat request",
      });
      return;
    }

    console.log(`Sending chat request from ${currentUser.uid} to ${toUserId}`);

    // Handle self-chat - directly create chat without request
    if (toUserId === currentUser.uid) {
      setIsLoading(true);
      try {
        console.log("Creating self-chat...");
        const chatId = await createChatDocument(currentUser.uid, currentUser.uid);
        console.log("Self-chat created with ID:", chatId);
        
        toast({
          title: "Chat with yourself created",
          description: "You can now start chatting with yourself!",
        });
      } catch (error) {
        console.error("Error creating self-chat:", error);
        toast({
          variant: "destructive",
          title: "Failed to create chat",
          description: "Could not create self-chat. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);
    
    try {
      // Check if a request already exists
      const { existingRequest, reverseRequest } = await checkExistingRequests(currentUser.uid, toUserId);

      if (existingRequest) {
        const existingRequestData = existingRequest.data();
        if (existingRequestData.status === 'pending') {
          toast({
            title: "Request pending",
            description: "You already have a pending request to this user",
          });
        } else if (existingRequestData.status === 'accepted') {
          toast({
            title: "Chat exists",
            description: "You already have an active chat with this user",
          });
        } else {
          // If declined, allow to send again
          await createChatRequestDocument(currentUser, toUserId);
          
          toast({
            title: "Request sent",
            description: "Your chat request has been sent",
          });
        }
        setIsLoading(false);
        return;
      }

      if (reverseRequest) {
        const reverseRequestData = reverseRequest.data();
        if (reverseRequestData.status === 'pending') {
          toast({
            title: "Request exists",
            description: "This user has already sent you a request. Check your incoming requests.",
          });
        } else if (reverseRequestData.status === 'accepted') {
          toast({
            title: "Chat exists",
            description: "You already have an active chat with this user",
          });
        } else {
          // If declined, allow to send
          await createChatRequestDocument(currentUser, toUserId);
          
          toast({
            title: "Request sent",
            description: "Your chat request has been sent",
          });
        }
        setIsLoading(false);
        return;
      }

      // If no existing requests either way, create a new request
      await createChatRequestDocument(currentUser, toUserId);

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
    } finally {
      setIsLoading(false);
    }
  };

  return { sendChatRequest, isLoading };
};
