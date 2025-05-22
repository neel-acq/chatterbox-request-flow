
import React from 'react';
import { useAllUsers } from '@/hooks/useUsers';
import { useChatRequests } from '@/hooks/useChatRequests';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const UsersList: React.FC = () => {
  const { users, loading, error } = useAllUsers();
  const { sendChatRequest } = useChatRequests();

  const handleSendRequest = (userId: string) => {
    sendChatRequest(userId);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4 text-destructive">
        <p>{error}</p>
      </div>
    );
  }

  if (!users.length) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        No other users found
      </div>
    );
  }

  return (
    <div className="space-y-3 mt-4">
      <h3 className="text-sm font-medium">All Users</h3>
      {users.map((user) => (
        <motion.div
          key={user.uid}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName} />
                    <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{user.displayName}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <Button onClick={() => handleSendRequest(user.uid)}>
                  Chat
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default UsersList;
