
import { 
  collection, 
  query, 
  where, 
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
        const sanitizedUserData = {
          displayName: String(userData.displayName || 'Unknown User'),
          photoURL: userData.photoURL || null
        };
        
        if (fieldName === 'from') {
          requestData.fromUser = sanitizedUserData;
        } else {
          requestData.toUser = sanitizedUserData;
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
  console.log("Creating chat request document...");
  
  const requestData = {
    from: currentUser.uid,
    to: toUserId,
    status: 'pending',
    createdAt: serverTimestamp()
  };
  
  return await addDoc(collection(firestore, 'chatRequests'), requestData);
};

export const checkExistingRequests = async (currentUserId: string, toUserId: string) => {
  console.log(`Checking existing requests between ${currentUserId} and ${toUserId}`);
  
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
  // For self-chat, use the same user ID twice but create a unique chat ID
  const chatId = userId1 === userId2 ? `self_${userId1}` : [userId1, userId2].sort().join('_');
  
  console.log("Creating chat document with ID:", chatId);
  
  const chatData = {
    participants: userId1 === userId2 ? [userId1] : [userId1, userId2],
    createdAt: serverTimestamp(),
    lastMessage: null,
    lastMessageTimestamp: null,
    isSelfChat: userId1 === userId2
  };
  
  await setDoc(doc(firestore, 'chats', chatId), chatData);
  
  console.log("Chat document created successfully");
  return chatId;
};
