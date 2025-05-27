
import { useState, useEffect } from 'react';
import { doc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

export interface UserOnlineStatus {
  uid: string;
  isOnline: boolean;
  lastSeen: any;
}

export const useOnlineStatus = () => {
  const { currentUser } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<Map<string, UserOnlineStatus>>(new Map());

  useEffect(() => {
    if (!currentUser) return;

    // Update current user's online status
    const updateOnlineStatus = async (isOnline: boolean) => {
      try {
        const userRef = doc(firestore, 'users', currentUser.uid);
        await updateDoc(userRef, {
          isOnline,
          lastSeen: serverTimestamp()
        });
      } catch (error) {
        console.error('Error updating online status:', error);
      }
    };

    // Set user as online
    updateOnlineStatus(true);

    // Set up beforeunload event to mark user as offline
    const handleBeforeUnload = () => {
      updateOnlineStatus(false);
    };

    // Set up visibility change to handle tab switching
    const handleVisibilityChange = () => {
      updateOnlineStatus(!document.hidden);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Periodic heartbeat to maintain online status
    const heartbeat = setInterval(() => {
      if (!document.hidden) {
        updateOnlineStatus(true);
      }
    }, 30000); // Update every 30 seconds

    return () => {
      updateOnlineStatus(false);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(heartbeat);
    };
  }, [currentUser]);

  const getUserOnlineStatus = (userId: string) => {
    return onlineUsers.get(userId);
  };

  const subscribeToUserStatus = (userId: string) => {
    const userRef = doc(firestore, 'users', userId);
    return onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        setOnlineUsers(prev => new Map(prev.set(userId, {
          uid: userId,
          isOnline: userData.isOnline || false,
          lastSeen: userData.lastSeen
        })));
      }
    });
  };

  return {
    getUserOnlineStatus,
    subscribeToUserStatus,
    onlineUsers
  };
};
