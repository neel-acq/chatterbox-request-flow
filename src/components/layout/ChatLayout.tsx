
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import ChatView from '../chat/ChatView';
import UserMenu from './UserMenu';

const ChatLayout: React.FC = () => {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  return (
    <div className="h-screen flex flex-col">
      <header className="border-b">
        <div className="container flex items-center justify-between h-16">
          <h1 className="font-bold text-xl">Chatterbox</h1>
          <UserMenu />
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-full md:w-80 lg:w-96">
          <Sidebar 
            selectedChatId={selectedChatId}
            onSelectChat={setSelectedChatId}
          />
        </div>
        <main className="flex-1 overflow-hidden">
          <ChatView chatId={selectedChatId} />
        </main>
      </div>
    </div>
  );
};

export default ChatLayout;
