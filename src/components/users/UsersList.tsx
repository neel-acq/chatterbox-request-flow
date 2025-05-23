
import React, { useEffect } from 'react';
import { useAllUsers } from '@/hooks/useUsers';
import { useChatRequests } from '@/hooks/useChatRequests';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const UsersList: React.FC = () => {
  const { users, loading, error } = useAllUsers();
  const { sendChatRequest, isSending } = useChatRequests();

  useEffect(() => {
    console.log("UsersList component rendered with:", {
      usersCount: users?.length || 0,
      loading,
      hasError: !!error
    });
  }, [users, loading, error]);

  const handleSendRequest = (userId: string) => {
    if (userId) {
      try {
        sendChatRequest(userId);
      } catch (error) {
        console.error("Error sending chat request:", error);
      }
    }
  };

  const getInitials = (name: string) => {
    if (!name) return '??';
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

  if (!users || users.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        No other users found
      </div>
    );
  }

  console.log("Rendering users list with", users.length, "users");

  return (
    <div className="space-y-3 mt-4">
      <h3 className="text-sm font-medium">All Users ({users.length})</h3>
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
                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
                    <AvatarFallback>{getInitials(user.displayName || 'User')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{user.displayName || 'Anonymous User'}</p>
                    <p className="text-sm text-muted-foreground">{user.email || 'No email'}</p>
                  </div>
                </div>
                <Button 
                  onClick={() => handleSendRequest(user.uid)}
                  disabled={isSending}
                >
                  {isSending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
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
