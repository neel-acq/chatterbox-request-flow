
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import ChatView from '../chat/ChatView';
import UserMenu from './UserMenu';
import { NotificationBell } from '../notifications/NotificationBell';

const ChatLayout: React.FC = () => {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="border-b p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Chatterbox</h1>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <UserMenu />
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 border-r">
          <Sidebar 
            selectedChatId={selectedChatId}
            onSelectChat={setSelectedChatId}
          />
        </div>

        {/* Chat view */}
        <div className="flex-1">
          <ChatView chatId={selectedChatId} />
        </div>
      </div>
    </div>
  );
};

export default ChatLayout;
