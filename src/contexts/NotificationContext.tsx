
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { collection, query, where, onSnapshot, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

export interface Notification {
  id: string;
  type: 'chat_request' | 'request_accepted' | 'request_declined' | 'new_message' | 'new_chat';
  title: string;
  message: string;
  read: boolean;
  createdAt: Timestamp;
  userId: string;
  relatedId?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { currentUser } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      return;
    }

    const notificationsRef = collection(firestore, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationsList: Notification[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        notificationsList.push({
          id: doc.id,
          type: data.type,
          title: data.title,
          message: data.message,
          read: data.read || false,
          createdAt: data.createdAt,
          userId: data.userId,
          relatedId: data.relatedId
        });
      });

      // Sort by createdAt (newest first)
      notificationsList.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.toMillis() - a.createdAt.toMillis();
      });

      // Show toast for new unread notifications
      const newUnreadNotifications = notificationsList.filter(n => !n.read);
      if (newUnreadNotifications.length > 0 && notifications.length > 0) {
        const latestNotification = newUnreadNotifications[0];
        toast({
          title: latestNotification.title,
          description: latestNotification.message,
        });
      }

      setNotifications(notificationsList);
    });

    return () => unsubscribe();
  }, [currentUser, toast]);

  const markAsRead = async (notificationId: string) => {
    try {
      const notificationRef = doc(firestore, 'notifications', notificationId);
      await updateDoc(notificationRef, { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      const promises = unreadNotifications.map(notification => 
        updateDoc(doc(firestore, 'notifications', notification.id), { read: true })
      );
      await Promise.all(promises);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
