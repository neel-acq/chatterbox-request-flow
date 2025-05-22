
import React from 'react';
import { Chat } from '@/hooks/useChats';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

interface ChatItemProps {
  chat: Chat;
  isSelected: boolean;
  onClick: () => void;
}

const ChatItem: React.FC<ChatItemProps> = ({ chat, isSelected, onClick }) => {
  const getInitials = (name?: string) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const formatMessage = (message: string | null) => {
    if (!message) return 'Start chatting';
    return message.length > 25 ? `${message.substring(0, 25)}...` : message;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      transition={{ duration: 0.2 }}
    >
      <Button
        variant="ghost"
        className={cn(
          "w-full flex items-center justify-start gap-3 p-3 h-auto",
          isSelected && "bg-accent text-accent-foreground"
        )}
        onClick={onClick}
      >
        <Avatar className="h-10 w-10">
          <AvatarImage src={chat.otherUser?.photoURL || undefined} alt={chat.otherUser?.displayName} />
          <AvatarFallback>{getInitials(chat.otherUser?.displayName)}</AvatarFallback>
        </Avatar>
        <div className="text-left">
          <p className="font-medium">{chat.otherUser?.displayName || 'Unknown User'}</p>
          <p className="text-xs text-muted-foreground truncate">
            {formatMessage(chat.lastMessage)}
          </p>
        </div>
      </Button>
    </motion.div>
  );
};

export default ChatItem;
