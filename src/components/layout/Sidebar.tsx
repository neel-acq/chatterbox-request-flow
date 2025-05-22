
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import UserSearch from '../users/UserSearch';
import UsersList from '../users/UsersList';
import ChatRequestsList from '../chat/ChatRequestsList';
import ChatsList from '../chat/ChatsList';

interface SidebarProps {
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ selectedChatId, onSelectChat }) => {
  return (
    <div className="w-full h-full flex flex-col border-r">
      <div className="p-4">
        <h2 className="font-semibold text-lg">Chatterbox</h2>
      </div>
      
      <Separator />
      
      <div className="p-4">
        <UserSearch />
      </div>
      
      <Separator />
      
      <div className="flex-1 overflow-y-auto">
        <Tabs defaultValue="chats" className="w-full h-full">
          <div className="px-4 pt-4">
            <TabsList className="w-full">
              <TabsTrigger value="chats" className="flex-1">Chats</TabsTrigger>
              <TabsTrigger value="requests" className="flex-1">Requests</TabsTrigger>
              <TabsTrigger value="users" className="flex-1">Users</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="chats" className="px-4 h-[calc(100%-60px)]">
            <ChatsList 
              selectedChatId={selectedChatId}
              onSelectChat={onSelectChat}
            />
          </TabsContent>
          
          <TabsContent value="requests" className="px-4">
            <ChatRequestsList />
          </TabsContent>

          <TabsContent value="users" className="px-4">
            <UsersList />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Sidebar;
