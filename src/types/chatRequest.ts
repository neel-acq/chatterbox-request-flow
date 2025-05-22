
import { Timestamp } from 'firebase/firestore';

export type ChatRequest = {
  id: string;
  from: string;
  to: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Timestamp;
  fromUser?: {
    displayName: string;
    photoURL: string | null;
  };
  toUser?: {
    displayName: string;
    photoURL: string | null;
  };
};
