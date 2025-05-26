
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { firestore } from '../lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

export type UserProfile = {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  createdAt: any;
};

const sanitizeUserData = (userData: any, uid: string): UserProfile => {
  return {
    uid,
    email: String(userData.email || ''),
    displayName: String(userData.displayName || 'Unknown User'),
    photoURL: userData.photoURL || null,
    createdAt: userData.createdAt || null
  };
};

export const useUserByEmail = (email: string) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (!email.trim()) {
        setUser(null);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log("Searching for user with email:", email);
        const q = query(collection(firestore, 'users'), where('email', '==', email));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          console.log("No user found with email:", email);
          setUser(null);
          setError('No user found with that email');
        } else {
          const userDoc = querySnapshot.docs[0];
          const userData = userDoc.data();
          console.log("Found user data for email search");
          
          const sanitizedUser = sanitizeUserData(userData, userDoc.id);
          setUser(sanitizedUser);
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching user by email:', err);
        setError('Failed to fetch user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [email]);

  return { user, loading, error };
};

export const useUserProfile = (userId: string | null) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) {
        setProfile(null);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log("Fetching profile for user:", userId);
        const userDocRef = doc(firestore, 'users', userId);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log("Profile data loaded successfully");
          
          const sanitizedProfile = sanitizeUserData(userData, userId);
          setProfile(sanitizedProfile);
          setError(null);
        } else {
          console.log("Profile not found for user:", userId);
          setProfile(null);
          setError('User profile not found');
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('Failed to fetch user profile');
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  return { profile, loading, error };
};

export const useAllUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  const fetchUsers = async () => {
    if (!currentUser) {
      console.log("No current user, cannot fetch users");
      setUsers([]);
      setLoading(false);
      setError(null);
      return;
    }

    console.log("Fetching all users...");
    setLoading(true);
    setError(null);

    try {
      // Create self-chat option first
      const selfChatUser: UserProfile = {
        uid: currentUser.uid,
        email: currentUser.email || '',
        displayName: 'Chat with me',
        photoURL: currentUser.photoURL || null,
        createdAt: null
      };

      console.log("Querying Firestore for users...");
      const usersRef = collection(firestore, 'users');
      const querySnapshot = await getDocs(usersRef);
      
      console.log(`Found ${querySnapshot.size} users in database`);
      
      const usersList: UserProfile[] = [selfChatUser];
      
      if (!querySnapshot.empty) {
        querySnapshot.forEach((userDoc) => {
          try {
            const userData = userDoc.data();
            console.log(`Processing user ${userDoc.id}`);
            
            // Skip current user in regular list since we have self-chat
            if (userDoc.id !== currentUser.uid) {
              const sanitizedUser = sanitizeUserData(userData, userDoc.id);
              usersList.push(sanitizedUser);
              console.log(`Added user: ${sanitizedUser.displayName}`);
            }
          } catch (docError) {
            console.error(`Error processing user document ${userDoc.id}:`, docError);
          }
        });
      }
      
      console.log(`Total users to display: ${usersList.length}`);
      setUsers(usersList);
      setError(null);
      
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to fetch users. Please check your connection.');
      
      // Fallback: show at least self-chat
      if (currentUser) {
        const fallbackUser: UserProfile = {
          uid: currentUser.uid,
          email: currentUser.email || '',
          displayName: 'Chat with me',
          photoURL: currentUser.photoURL || null,
          createdAt: null
        };
        setUsers([fallbackUser]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentUser]);

  return { users, loading, error, refetch: fetchUsers };
};
