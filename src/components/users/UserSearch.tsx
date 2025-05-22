
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useUserByEmail } from '@/hooks/useUsers';
import { useChatRequests } from '@/hooks/useChatRequests';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';

const UserSearch: React.FC = () => {
  const [searchEmail, setSearchEmail] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const { user, loading, error } = useUserByEmail(searchEmail);
  const { sendChatRequest } = useChatRequests();
  const { currentUser } = useAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchEmail.trim()) {
      setHasSearched(true);
    }
  };

  const handleSendRequest = () => {
    if (user) {
      sendChatRequest(user.uid);
    }
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
    <div className="w-full">
      <form onSubmit={handleSearch} className="flex items-center gap-2 mb-4">
        <Input
          placeholder="Search by email"
          value={searchEmail}
          onChange={(e) => {
            setSearchEmail(e.target.value);
            setHasSearched(false);
          }}
          className="flex-grow"
        />
        <Button type="submit" disabled={loading || !searchEmail.trim()}>
          Search
        </Button>
      </form>

      {hasSearched && (
        <div className="mt-4">
          {loading ? (
            <p className="text-center text-muted-foreground">Searching...</p>
          ) : error ? (
            <p className="text-center text-destructive">{error}</p>
          ) : user ? (
            <motion.div
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
                    <Button 
                      onClick={handleSendRequest} 
                      disabled={currentUser?.uid === user.uid}
                    >
                      Chat
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <p className="text-center text-muted-foreground">No user found with that email</p>
          )}
        </div>
      )}
    </div>
  );
};

export default UserSearch;
