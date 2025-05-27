
import React from 'react';
import { EmailSearchWithSuggestions } from './EmailSearchWithSuggestions';

const UserSearch: React.FC = () => {
  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Find Users</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Search for users by their email address to start a conversation.
        </p>
      </div>
      
      <EmailSearchWithSuggestions />
    </div>
  );
};

export default UserSearch;
