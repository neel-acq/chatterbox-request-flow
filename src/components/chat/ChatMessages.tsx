
import React, { useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Message } from '@/hooks/useChats';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ChatMessagesProps {
  messages: Message[];
  otherUserName?: string;
  otherUserAvatar?: string | null;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ 
  messages, 
  otherUserName = 'User',
  otherUserAvatar
}) => {
  const { currentUser } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  return (
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
                "flex items-start mb-4",
                isCurrentUserMessage(message) ? "justify-end" : "justify-start"
              )}
            >
              {!isCurrentUserMessage(message) && (
                <Avatar className="h-8 w-8 mr-2 mt-1">
                  <AvatarImage src={otherUserAvatar || undefined} alt={otherUserName} />
                  <AvatarFallback>{getInitials(otherUserName)}</AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  "max-w-[70%]",
                  isCurrentUserMessage(message) ? "text-right" : "text-left"
                )}
              >
                <div
                  className={cn(
                    "px-4 py-2 rounded-md inline-block",
                    isCurrentUserMessage(message)
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : "bg-muted rounded-tl-none"
                  )}
                >
                  {message.text}
                </div>
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
  );
};

export default ChatMessages;
