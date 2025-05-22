
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp, 
  getDoc,
  setDoc
} from 'firebase/firestore';
import { firestore } from '../lib/firebase';
import { ChatRequest } from '../types/chatRequest';
import { User } from 'firebase/auth';

export const fetchUserDetailsForRequests = async (requests: ChatRequest[], fieldName: 'from' | 'to'): Promise<ChatRequest[]> => {
  const updatedRequests: ChatRequest[] = [];
  
  for (const request of requests) {
    const requestData = { ...request };
    
    try {
      const userDoc = await getDocs(query(
        collection(firestore, 'users'), 
        where('uid', '==', request[fieldName])
      ));
      
      if (!userDoc.empty) {
        const userData = userDoc.docs[0].data();
        if (fieldName === 'from') {
          requestData.fromUser = {
            displayName: userData.displayName,
            photoURL: userData.photoURL
          };
        } else {
          requestData.toUser = {
            displayName: userData.displayName,
            photoURL: userData.photoURL
          };
        }
      }
    } catch (error) {
      console.error(`Error fetching ${fieldName} user data:`, error);
    }
    
    updatedRequests.push(requestData);
  }
  
  return updatedRequests;
};

export const createChatRequestDocument = async (currentUser: User, toUserId: string) => {
  return await addDoc(collection(firestore, 'chatRequests'), {
    from: currentUser.uid,
    to: toUserId,
    status: 'pending',
    createdAt: serverTimestamp()
  });
};

export const checkExistingRequests = async (currentUserId: string, toUserId: string) => {
  const existingRequestQuery = query(
    collection(firestore, 'chatRequests'),
    where('from', '==', currentUserId),
    where('to', '==', toUserId),
  );
  
  const reverseRequestQuery = query(
    collection(firestore, 'chatRequests'),
    where('from', '==', toUserId),
    where('to', '==', currentUserId),
  );

  const [existingSnapshot, reverseSnapshot] = await Promise.all([
    getDocs(existingRequestQuery),
    getDocs(reverseRequestQuery)
  ]);

  return {
    existingRequest: !existingSnapshot.empty ? existingSnapshot.docs[0] : null,
    reverseRequest: !reverseSnapshot.empty ? reverseSnapshot.docs[0] : null
  };
};

export const createChatDocument = async (userId1: string, userId2: string) => {
  const chatId = [userId1, userId2].sort().join('_');
  
  await setDoc(doc(firestore, 'chats', chatId), {
    participants: [userId1, userId2],
    createdAt: serverTimestamp(),
    lastMessage: null,
    lastMessageTimestamp: null
  });
  
  return chatId;
};
