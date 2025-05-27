
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
        <div className="text-center">
          <p className="text-muted-foreground mb-2">Select a chat to start messaging</p>
          <p className="text-sm text-muted-foreground">Choose from your existing chats or start a new conversation</p>
        </div>
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

  const chatTitle = chat.isSelfChat ? "Chat with Me" : (chat.otherUser?.displayName || 'Chat');

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4">
        <h2 className="font-medium">{chatTitle}</h2>
        {chat.isSelfChat && (
          <p className="text-sm text-muted-foreground">Your personal space</p>
        )}
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
