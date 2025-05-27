
import React, { useEffect } from 'react';
import { useChat } from '@/hooks/useChats';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import { collection, addDoc, Timestamp, updateDoc, doc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

interface ChatViewProps {
  chatId: string | null;
}

const ChatView: React.FC<ChatViewProps> = ({ chatId }) => {
  const { chat, messages, loading, sendMessage } = useChat(chatId);
  const { currentUser } = useAuth();
  const { getUserOnlineStatus, subscribeToUserStatus } = useOnlineStatus();

  // Subscribe to other user's online status
  useEffect(() => {
    if (chat?.otherUser?.uid && !chat.isSelfChat) {
      const unsubscribe = subscribeToUserStatus(chat.otherUser.uid);
      return () => unsubscribe();
    }
  }, [chat?.otherUser?.uid, chat?.isSelfChat, subscribeToUserStatus]);

  const handleSendImage = async (imageUrl: string, caption?: string) => {
    if (!currentUser || !chatId) return;
    
    try {
      const messagesRef = collection(firestore, `chats/${chatId}/messages`);
      const chatRef = doc(firestore, 'chats', chatId);
      
      // Add new image message
      await addDoc(messagesRef, {
        type: 'image',
        imageUrl,
        text: caption || '',
        sender: currentUser.uid,
        createdAt: Timestamp.now()
      });
      
      // Update last message in chat
      await updateDoc(chatRef, {
        lastMessage: caption ? `📷 ${caption}` : '📷 Image',
        lastMessageAt: Timestamp.now()
      });
    } catch (error) {
      console.error("Error sending image:", error);
    }
  };

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
  const otherUserStatus = chat.otherUser?.uid ? getUserOnlineStatus(chat.otherUser.uid) : null;

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="font-medium">{chatTitle}</h2>
            {chat.isSelfChat ? (
              <p className="text-sm text-muted-foreground">Your personal space</p>
            ) : (
              <div className="flex items-center gap-2">
                <div 
                  className={`w-2 h-2 rounded-full ${
                    otherUserStatus?.isOnline ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                />
                <p className="text-sm text-muted-foreground">
                  {otherUserStatus?.isOnline ? 'Online' : 'Offline'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <ChatMessages 
          messages={messages} 
          otherUserName={chat.otherUser?.displayName} 
          otherUserAvatar={chat.otherUser?.photoURL}
          chatId={chatId}
          onSendImage={handleSendImage}
        />
        <ChatInput onSendMessage={sendMessage} />
      </div>
    </div>
  );
};

export default ChatView;
