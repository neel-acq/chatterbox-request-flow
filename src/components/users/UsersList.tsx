
import React, { useEffect } from 'react';
import { useAllUsers } from '@/hooks/useUsers';
import { useChatRequests } from '@/hooks/useChatRequests';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const UsersList: React.FC = () => {
  const { users, loading, error } = useAllUsers();
  const { sendChatRequest, isSending } = useChatRequests();
  const { currentUser } = useAuth();

  useEffect(() => {
    console.log("UsersList rendered:", {
      usersCount: users?.length || 0,
      loading,
      hasError: !!error,
      currentUser: currentUser?.uid
    });
  }, [users, loading, error, currentUser]);

  const handleSendRequest = async (userId: string, isSelfChat: boolean = false) => {
    console.log("Sending chat request to:", userId, "isSelfChat:", isSelfChat);
    
    if (!userId) {
      console.error("No user ID provided");
      return;
    }

    try {
      await sendChatRequest(userId);
      console.log("Chat request sent successfully to:", userId);
    } catch (error) {
      console.error("Error sending chat request:", error);
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

  const isCurrentUser = (userId: string) => {
    return currentUser?.uid === userId;
  };

  const refreshUsers = () => {
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading users...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-destructive mb-2">{error}</p>
        <p className="text-sm text-muted-foreground mb-3">
          Check your connection and try again
        </p>
        <Button variant="outline" onClick={refreshUsers} size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-muted-foreground mb-2">No users found</p>
        <Button variant="outline" onClick={refreshUsers} size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
    );
  }

  console.log("Rendering", users.length, "users");

  return (
    <div className="space-y-3 mt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Users ({users.length})</h3>
        <Button variant="ghost" size="sm" onClick={refreshUsers}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      
      {users.map((user, index) => {
        const isSelfChat = isCurrentUser(user.uid);
        
        return (
          <motion.div
            key={`user-${user.uid}-${index}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage 
                        src={user.photoURL || undefined} 
                        alt={user.displayName || 'User'} 
                      />
                      <AvatarFallback>
                        {getInitials(user.displayName || 'User')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {isSelfChat ? 'Chat with yourself' : (user.displayName || 'Anonymous User')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {user.email || 'No email'}
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => handleSendRequest(user.uid, isSelfChat)}
                    disabled={isSending}
                    variant={isSelfChat ? "secondary" : "default"}
                    size="sm"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Sending...
                      </>
                    ) : (
                      "Chat"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};

export default UsersList;
