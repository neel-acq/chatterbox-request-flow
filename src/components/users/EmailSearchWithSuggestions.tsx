
import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useChatRequests } from '@/hooks/useChatRequests';
import { UserProfile } from '@/hooks/useUsers';
import { Search, X } from 'lucide-react';

export const EmailSearchWithSuggestions: React.FC = () => {
  const [searchEmail, setSearchEmail] = useState('');
  const [suggestions, setSuggestions] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { sendChatRequest } = useChatRequests();
  const { currentUser } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const searchUsers = async (emailQuery: string) => {
    if (!emailQuery.trim() || emailQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      // Search for users whose email starts with the query
      const usersRef = collection(firestore, 'users');
      const q = query(
        usersRef,
        where('email', '>=', emailQuery.toLowerCase()),
        where('email', '<=', emailQuery.toLowerCase() + '\uf8ff'),
        limit(5)
      );

      const querySnapshot = await getDocs(q);
      const usersList: UserProfile[] = [];

      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        if (doc.id !== currentUser?.uid) {
          usersList.push({
            uid: doc.id,
            email: userData.email || '',
            displayName: userData.displayName || 'Unknown User',
            photoURL: userData.photoURL || null,
            createdAt: userData.createdAt || null
          });
        }
      });

      setSuggestions(usersList);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error searching users:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      searchUsers(searchEmail);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchEmail]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSuggestionClick = (user: UserProfile) => {
    setSelectedUser(user);
    setSearchEmail(user.email);
    setShowSuggestions(false);
  };

  const handleSendRequest = () => {
    if (selectedUser) {
      sendChatRequest(selectedUser.uid);
      setSelectedUser(null);
      setSearchEmail('');
      setSuggestions([]);
    }
  };

  const clearSearch = () => {
    setSearchEmail('');
    setSelectedUser(null);
    setSuggestions([]);
    setShowSuggestions(false);
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
    <div className="w-full relative">
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder="Search by email..."
              value={searchEmail}
              onChange={(e) => {
                setSearchEmail(e.target.value);
                setSelectedUser(null);
              }}
              onFocus={() => {
                if (suggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              className="pl-10 pr-10"
            />
            {searchEmail && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
                onClick={clearSearch}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto"
            >
              {suggestions.map((user) => (
                <div
                  key={user.uid}
                  className="flex items-center gap-3 p-3 hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => handleSuggestionClick(user)}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName} />
                    <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{user.displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button 
          onClick={handleSendRequest} 
          disabled={!selectedUser || loading}
        >
          {loading ? 'Searching...' : 'Send Request'}
        </Button>
      </div>

      {selectedUser && (
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedUser.photoURL || undefined} alt={selectedUser.displayName} />
                <AvatarFallback>{getInitials(selectedUser.displayName)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">{selectedUser.displayName}</p>
                <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
