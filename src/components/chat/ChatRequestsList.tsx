
import React from 'react';
import { useChatRequests } from '@/hooks/useChatRequests';
import { ChatRequest } from '@/types/chatRequest';
import ChatRequestItem from './ChatRequestItem';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnimatePresence } from 'framer-motion';

const ChatRequestsList: React.FC = () => {
  const { 
    incomingRequests, 
    sentRequests, 
    loading, 
    respondToChatRequest 
  } = useChatRequests();

  const pendingIncomingRequests = incomingRequests.filter(
    req => req.status === 'pending'
  );
  
  const otherIncomingRequests = incomingRequests.filter(
    req => req.status !== 'pending'
  );

  const handleAccept = (requestId: string) => {
    respondToChatRequest(requestId, true);
  };

  const handleDecline = (requestId: string) => {
    respondToChatRequest(requestId, false);
  };

  if (loading) {
    return <div className="text-center py-8">Loading requests...</div>;
  }

  return (
    <div>
      <Tabs defaultValue="incoming" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="incoming" className="flex-1">
            Incoming {pendingIncomingRequests.length > 0 && `(${pendingIncomingRequests.length})`}
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex-1">
            Sent {sentRequests.length > 0 && `(${sentRequests.length})`}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="incoming" className="py-2">
          {pendingIncomingRequests.length === 0 && otherIncomingRequests.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No incoming requests
            </div>
          ) : (
            <>
              {pendingIncomingRequests.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-2">Pending Requests</h3>
                  <AnimatePresence>
                    {pendingIncomingRequests.map(request => (
                      <ChatRequestItem
                        key={request.id}
                        request={request}
                        onAccept={() => handleAccept(request.id)}
                        onDecline={() => handleDecline(request.id)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
              
              {otherIncomingRequests.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Previous Requests</h3>
                  <AnimatePresence>
                    {otherIncomingRequests.map(request => (
                      <ChatRequestItem
                        key={request.id}
                        request={request}
                        onAccept={() => {}}
                        onDecline={() => {}}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </>
          )}
        </TabsContent>
        
        <TabsContent value="sent" className="py-2">
          {sentRequests.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No sent requests
            </div>
          ) : (
            <AnimatePresence>
              {sentRequests.map(request => (
                <ChatRequestItem
                  key={request.id}
                  request={request}
                  onAccept={() => {}}
                  onDecline={() => {}}
                  isSent={true}
                />
              ))}
            </AnimatePresence>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ChatRequestsList;
