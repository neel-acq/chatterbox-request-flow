
import React from 'react';
import { useChats } from '@/hooks/useChats';
import ChatItem from './ChatItem';
import { AnimatePresence } from 'framer-motion';

interface ChatsListProps {
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
}

const ChatsList: React.FC<ChatsListProps> = ({ selectedChatId, onSelectChat }) => {
  const { chats, loading } = useChats();

  if (loading) {
    return <div className="text-center py-8">Loading chats...</div>;
  }

  return (
    <div className="space-y-1 py-2">
      {chats.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground">
          No active chats
        </div>
      ) : (
        <AnimatePresence>
          {chats.map(chat => (
            <ChatItem
              key={chat.id}
              chat={chat}
              isSelected={selectedChatId === chat.id}
              onClick={() => onSelectChat(chat.id)}
            />
          ))}
        </AnimatePresence>
      )}
    </div>
  );
};

export default ChatsList;
