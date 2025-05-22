
import React from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import MainApp from './MainApp';

const Index = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

export default Index;
