
import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import LoginForm from './LoginForm';
import SignUpForm from './SignUpForm';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  const toggleForm = () => {
    setIsLogin(!isLogin);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Chatterbox</h1>
          <p className="text-muted-foreground">Connect with friends in real-time</p>
        </div>
        
        <AnimatePresence mode="wait">
          {isLogin ? (
            <LoginForm key="login" onToggleForm={toggleForm} />
          ) : (
            <SignUpForm key="signup" onToggleForm={toggleForm} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AuthPage;
