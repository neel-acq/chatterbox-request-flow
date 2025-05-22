
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChatRequest } from '@/types/chatRequest';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

interface ChatRequestItemProps {
  request: ChatRequest;
  onAccept: () => void;
  onDecline: () => void;
  isSent?: boolean;
}

const ChatRequestItem: React.FC<ChatRequestItemProps> = ({
  request,
  onAccept,
  onDecline,
  isSent = false
}) => {
  const user = isSent ? request.toUser : request.fromUser;
  
  const getInitials = (name?: string) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    
    if (timestamp.toDate) {
      return format(timestamp.toDate(), 'MMM d, h:mm a');
    }
    return '';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="mb-3 overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName} />
                <AvatarFallback>{getInitials(user?.displayName)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{user?.displayName || 'Unknown User'}</p>
                <p className="text-xs text-muted-foreground">
                  {isSent 
                    ? `Sent ${formatDate(request.createdAt)}` 
                    : `Received ${formatDate(request.createdAt)}`
                  }
                </p>
              </div>
            </div>
            {!isSent && request.status === 'pending' ? (
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={onDecline}
                  className="text-destructive border-destructive hover:bg-destructive/10"
                >
                  Decline
                </Button>
                <Button size="sm" onClick={onAccept}>
                  Accept
                </Button>
              </div>
            ) : (
              <div className="text-sm px-3 py-1 rounded-full bg-muted text-muted-foreground">
                {request.status === 'accepted' ? 'Accepted' : 
                 request.status === 'declined' ? 'Declined' : 'Pending'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ChatRequestItem;
