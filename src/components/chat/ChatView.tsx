
import React from 'react';
import { useChat } from '@/hooks/useChats';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';

interface ChatViewProps {
  chatId: string | null;
}

const ChatView: React.FC<ChatViewProps> = ({ chatId }) => {
  const { chat, messages, loading, sendMessage } = useChat(chatId);

  if (!chatId) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">Select a chat to start messaging</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">Loading chat...</p>
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">Chat not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4">
        <h2 className="font-medium">{chat.otherUser?.displayName || 'Chat'}</h2>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <ChatMessages 
          messages={messages} 
          otherUserName={chat.otherUser?.displayName} 
          otherUserAvatar={chat.otherUser?.photoURL}
        />
        <ChatInput onSendMessage={sendMessage} />
      </div>
    </div>
  );
};

export default ChatView;
