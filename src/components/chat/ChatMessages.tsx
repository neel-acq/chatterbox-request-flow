
import React, { useRef, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Message } from '@/hooks/useChats';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Pin, Edit3 } from 'lucide-react';
import { MessageEditor } from './MessageEditor';
import { usePinnedMessages } from '@/hooks/usePinnedMessages';
import { ImageShare } from './ImageShare';

interface ChatMessagesProps {
  messages: Message[];
  otherUserName?: string;
  otherUserAvatar?: string | null;
  chatId: string;
  onSendImage: (imageUrl: string, caption?: string) => void;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ 
  messages, 
  otherUserName = 'User',
  otherUserAvatar,
  chatId,
  onSendImage
}) => {
  const { currentUser } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const { pinMessage, pinnedMessages } = usePinnedMessages(chatId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    
    if (timestamp.toDate) {
      return format(timestamp.toDate(), 'h:mm a');
    }
    
    return '';
  };

  const isCurrentUserMessage = (message: Message) => {
    return message.sender === currentUser?.uid;
  };

  const isPinned = (messageId: string) => {
    return pinnedMessages.some(pm => pm.messageId === messageId);
  };

  const handlePinMessage = (messageId: string, text: string) => {
    const senderName = isCurrentUserMessage({ id: messageId, text, sender: '', createdAt: null as any }) 
      ? (currentUser?.displayName || 'You') 
      : otherUserName;
    pinMessage(messageId, text, senderName);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Pinned messages section */}
      {pinnedMessages.length > 0 && (
        <div className="border-b bg-muted/50 p-2">
          <div className="text-xs font-medium mb-1 flex items-center gap-1">
            <Pin className="h-3 w-3" />
            Pinned Messages
          </div>
          <div className="space-y-1">
            {pinnedMessages.slice(0, 3).map((pinnedMsg) => (
              <div key={pinnedMsg.id} className="text-xs bg-background p-2 rounded">
                <span className="font-medium">{pinnedMsg.senderName}:</span> {pinnedMsg.content}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence>
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">No messages yet. Say hello!</p>
            </div>
          ) : (
            messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "flex items-start mb-4 group",
                  isCurrentUserMessage(message) ? "justify-end" : "justify-start"
                )}
                onMouseEnter={() => setHoveredMessageId(message.id)}
                onMouseLeave={() => setHoveredMessageId(null)}
              >
                {!isCurrentUserMessage(message) && (
                  <Avatar className="h-8 w-8 mr-2 mt-1">
                    <AvatarImage src={otherUserAvatar || undefined} alt={otherUserName} />
                    <AvatarFallback>{getInitials(otherUserName)}</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "max-w-[70%] relative",
                    isCurrentUserMessage(message) ? "text-right" : "text-left"
                  )}
                >
                  {editingMessageId === message.id ? (
                    <MessageEditor
                      messageId={message.id}
                      chatId={chatId}
                      currentText={message.text}
                      onCancel={() => setEditingMessageId(null)}
                      onSave={() => setEditingMessageId(null)}
                    />
                  ) : (
                    <>
                      <div
                        className={cn(
                          "px-4 py-2 rounded-md inline-block relative",
                          isCurrentUserMessage(message)
                            ? "bg-primary text-primary-foreground rounded-tr-none"
                            : "bg-muted rounded-tl-none"
                        )}
                      >
                        {message.text}
                        {isPinned(message.id) && (
                          <Pin className="h-3 w-3 absolute -top-1 -right-1 text-blue-500" />
                        )}
                      </div>
                      
                      {/* Message actions */}
                      {hoveredMessageId === message.id && (
                        <div 
                          className={cn(
                            "flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity",
                            isCurrentUserMessage(message) ? "justify-end" : "justify-start"
                          )}
                        >
                          {isCurrentUserMessage(message) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => setEditingMessageId(message.id)}
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                          )}
                          {!isPinned(message.id) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => handlePinMessage(message.id, message.text)}
                            >
                              <Pin className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      )}
                    </>
                  )}
                  
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatTimestamp(message.createdAt)}
                  </p>
                </div>
                {isCurrentUserMessage(message) && (
                  <Avatar className="h-8 w-8 ml-2 mt-1">
                    <AvatarImage src={currentUser?.photoURL || undefined} alt={currentUser?.displayName || ''} />
                    <AvatarFallback>{currentUser?.displayName ? getInitials(currentUser.displayName) : 'Me'}</AvatarFallback>
                  </Avatar>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Image share button */}
      <div className="p-2 border-t">
        <ImageShare onSendImage={onSendImage} />
      </div>
    </div>
  );
};

export default ChatMessages;
