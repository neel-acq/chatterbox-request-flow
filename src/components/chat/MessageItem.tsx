
import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { usePinnedMessages } from '@/hooks/usePinnedMessages';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { Pin } from 'lucide-react';

interface MessageItemProps {
  message: {
    id: string;
    content: string;
    senderId: string;
    senderName?: string;
    senderPhoto?: string;
    timestamp: any;
    type?: 'text' | 'image';
    imageUrl?: string;
    caption?: string;
  };
  chatId: string;
  isOwn: boolean;
  otherUserName?: string;
  otherUserAvatar?: string;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  chatId,
  isOwn,
  otherUserName,
  otherUserAvatar
}) => {
  const [showPinOption, setShowPinOption] = useState(false);
  const { pinMessage, pinnedMessages } = usePinnedMessages(chatId);
  const { currentUser } = useAuth();

  const isPinned = pinnedMessages.some(pm => pm.messageId === message.id);

  const handlePin = () => {
    const senderName = isOwn ? (currentUser?.displayName || 'You') : (otherUserName || 'User');
    pinMessage(message.id, message.content, senderName);
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div
      className={`flex gap-3 p-3 hover:bg-accent/50 transition-colors group ${
        isOwn ? 'flex-row-reverse' : ''
      }`}
      onMouseEnter={() => setShowPinOption(true)}
      onMouseLeave={() => setShowPinOption(false)}
    >
      <Avatar className="h-8 w-8">
        <AvatarImage 
          src={isOwn ? currentUser?.photoURL || undefined : otherUserAvatar} 
          alt={isOwn ? currentUser?.displayName || '' : otherUserName || ''} 
        />
        <AvatarFallback>
          {getInitials(isOwn ? (currentUser?.displayName || 'You') : (otherUserName || 'User'))}
        </AvatarFallback>
      </Avatar>

      <div className={`flex-1 space-y-1 ${isOwn ? 'text-right' : ''}`}>
        <div className="flex items-center gap-2">
          {!isOwn && (
            <span className="font-medium text-sm">
              {message.senderName || otherUserName || 'User'}
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            {formatTime(message.timestamp)}
          </span>
          {isPinned && <Pin className="h-3 w-3 text-blue-500" />}
        </div>

        {message.type === 'image' ? (
          <div className="space-y-2">
            <img 
              src={message.imageUrl} 
              alt="Shared image" 
              className="max-w-xs rounded-lg shadow-sm"
            />
            {message.caption && (
              <p className="text-sm bg-muted p-2 rounded">
                {message.caption}
              </p>
            )}
          </div>
        ) : (
          <p className={`text-sm ${isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'} p-2 rounded-lg inline-block max-w-xs break-words`}>
            {message.content}
          </p>
        )}

        {showPinOption && !isPinned && (
          <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePin}
              className="opacity-70 hover:opacity-100"
            >
              <Pin className="h-3 w-3 mr-1" />
              Pin
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
