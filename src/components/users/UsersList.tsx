
import React, { useEffect, useState } from 'react';
import { useAllUsers } from '@/hooks/useUsers';
import { useChatRequests } from '@/hooks/useChatRequests';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { Loader2, RefreshCw, AlertCircle, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';

const UsersList: React.FC = () => {
  const { users, loading, error, refetch } = useAllUsers();
  const { sendChatRequest, isSending, cancelChatRequest } = useChatRequests();
  const { currentUser } = useAuth();
  const { getUserOnlineStatus, subscribeToUserStatus } = useOnlineStatus();
  const [sentRequests, setSentRequests] = useState<Map<string, string>>(new Map());
  const [acceptedChats, setAcceptedChats] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!currentUser) return;

    // Check for sent requests
    const checkSentRequests = async () => {
      try {
        const requestsRef = collection(firestore, 'chatRequests');
        const q = query(requestsRef, where('from', '==', currentUser.uid));
        const snapshot = await getDocs(q);
        
        const sentMap = new Map<string, string>();
        snapshot.forEach(doc => {
          const data = doc.data();
          sentMap.set(data.to, doc.id);
        });
        setSentRequests(sentMap);
      } catch (error) {
        console.error('Error checking sent requests:', error);
      }
    };

    // Check for accepted chats
    const checkAcceptedChats = async () => {
      try {
        const chatsRef = collection(firestore, 'chats');
        const q = query(chatsRef, where('participants', 'array-contains', currentUser.uid));
        const snapshot = await getDocs(q);
        
        const acceptedSet = new Set<string>();
        snapshot.forEach(doc => {
          const data = doc.data();
          const otherUser = data.participants.find((p: string) => p !== currentUser.uid);
          if (otherUser && !data.isSelfChat) {
            acceptedSet.add(otherUser);
          }
        });
        setAcceptedChats(acceptedSet);
      } catch (error) {
        console.error('Error checking accepted chats:', error);
      }
    };

    checkSentRequests();
    checkAcceptedChats();
  }, [currentUser, users]);

  useEffect(() => {
    // Subscribe to online status for all users
    const unsubscribes: (() => void)[] = [];
    
    users?.forEach(user => {
      const unsubscribe = subscribeToUserStatus(user.uid);
      unsubscribes.push(unsubscribe);
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [users, subscribeToUserStatus]);

  const handleSendRequest = async (userId: string) => {
    console.log("Sending chat request to:", userId);
    
    if (!userId) {
      console.error("No user ID provided");
      return;
    }

    try {
      await sendChatRequest(userId);
      console.log("Chat request sent successfully to:", userId);
      // Refresh sent requests after sending
      setTimeout(() => {
        const checkSentRequests = async () => {
          const requestsRef = collection(firestore, 'chatRequests');
          const q = query(requestsRef, where('from', '==', currentUser?.uid));
          const snapshot = await getDocs(q);
          
          const sentMap = new Map<string, string>();
          snapshot.forEach(doc => {
            const data = doc.data();
            sentMap.set(data.to, doc.id);
          });
          setSentRequests(sentMap);
        };
        checkSentRequests();
      }, 1000);
    } catch (error) {
      console.error("Error sending chat request:", error);
    }
  };

  const handleCancelRequest = async (userId: string) => {
    const requestId = sentRequests.get(userId);
    if (requestId && cancelChatRequest) {
      await cancelChatRequest(requestId);
      setSentRequests(prev => {
        const newMap = new Map(prev);
        newMap.delete(userId);
        return newMap;
      });
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

  const getButtonState = (userId: string) => {
    if (acceptedChats.has(userId)) return 'chat';
    if (sentRequests.has(userId)) return 'sent';
    return 'send';
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
        <div className="flex items-center justify-center gap-2 text-destructive mb-2">
          <AlertCircle className="h-4 w-4" />
          <p className="text-sm">{error}</p>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Check your connection and try again
        </p>
        <Button variant="outline" onClick={refetch} size="sm">
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
        <Button variant="outline" onClick={refetch} size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
    );
  }

  // Filter out users who have accepted chats (except self)
  const filteredUsers = users.filter(user => 
    isCurrentUser(user.uid) || !acceptedChats.has(user.uid)
  );

  console.log("Rendering", filteredUsers.length, "users");

  return (
    <div className="space-y-3 mt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Users ({filteredUsers.length})</h3>
        <Button variant="ghost" size="sm" onClick={refetch}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      
      {filteredUsers.map((user, index) => {
        const isSelfChat = isCurrentUser(user.uid);
        const buttonState = getButtonState(user.uid);
        const onlineStatus = getUserOnlineStatus(user.uid);
        
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
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage 
                          src={user.photoURL || undefined} 
                          alt={user.displayName || 'User'} 
                        />
                        <AvatarFallback>
                          {getInitials(user.displayName || 'User')}
                        </AvatarFallback>
                      </Avatar>
                      {/* Online status indicator */}
                      {!isSelfChat && (
                        <div 
                          className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${
                            onlineStatus?.isOnline ? 'bg-green-500' : 'bg-gray-400'
                          }`}
                        />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {user.displayName || 'Anonymous User'}
                        {isSelfChat && ' (You)'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {user.email || 'No email'}
                      </p>
                      {!isSelfChat && onlineStatus && (
                        <p className="text-xs text-muted-foreground">
                          {onlineStatus.isOnline ? 'Online' : 'Offline'}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {buttonState === 'sent' && (
                      <Button 
                        onClick={() => handleCancelRequest(user.uid)}
                        variant="outline"
                        size="sm"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    )}
                    
                    <Button 
                      onClick={() => handleSendRequest(user.uid)}
                      disabled={isSending || buttonState === 'chat'}
                      variant={isSelfChat ? "secondary" : buttonState === 'sent' ? "outline" : "default"}
                      size="sm"
                    >
                      {isSending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Sending...
                        </>
                      ) : (
                        buttonState === 'chat' ? 'Chat Active' :
                        buttonState === 'sent' ? 'Sent' :
                        isSelfChat ? 'Chat with Me' : 'Send Request'
                      )}
                    </Button>
                  </div>
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
