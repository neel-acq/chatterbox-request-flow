
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthPage from '@/components/auth/AuthPage';
import ChatLayout from '@/components/layout/ChatLayout';

const MainApp: React.FC = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Loading...</h2>
          <p className="text-muted-foreground">Setting up your experience</p>
        </div>
      </div>
    );
  }

  return currentUser ? <ChatLayout /> : <AuthPage />;
};

export default MainApp;
