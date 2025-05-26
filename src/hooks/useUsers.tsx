
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

export const useUserByEmail = (email: string) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (!email) {
        setUser(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const q = query(collection(firestore, 'users'), where('email', '==', email));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setUser(null);
          setError('No user found with that email');
        } else {
          const userData = querySnapshot.docs[0].data();
          const sanitizedUser: UserProfile = {
            uid: querySnapshot.docs[0].id,
            email: userData.email || '',
            displayName: userData.displayName || '',
            photoURL: userData.photoURL || null,
            createdAt: userData.createdAt || null
          };
          setUser(sanitizedUser);
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
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const userDocRef = doc(firestore, 'users', userId);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          const sanitizedProfile: UserProfile = {
            uid: userId,
            email: userData.email || '',
            displayName: userData.displayName || '',
            photoURL: userData.photoURL || null,
            createdAt: userData.createdAt || null
          };
          setProfile(sanitizedProfile);
        } else {
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

  useEffect(() => {
    const fetchUsers = async () => {
      if (!currentUser) {
        console.log("No current user, setting empty users list");
        setUsers([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log("Fetching all users from Firestore...");
        
        // First, add current user as "Chat with me" option
        const currentUserProfile: UserProfile = {
          uid: currentUser.uid,
          email: currentUser.email || '',
          displayName: `${currentUser.displayName || 'Me'} (Chat with yourself)`,
          photoURL: currentUser.photoURL || null,
          createdAt: null
        };

        const usersRef = collection(firestore, 'users');
        const querySnapshot = await getDocs(usersRef);
        
        console.log(`Found ${querySnapshot.size} total users in database`);
        const usersList: UserProfile[] = [currentUserProfile]; // Start with self-chat option
        
        querySnapshot.forEach((doc) => {
          try {
            const userData = doc.data();
            
            // Don't include the current user again in the regular list
            if (doc.id !== currentUser.uid) {
              const sanitizedUser: UserProfile = {
                uid: doc.id,
                email: userData.email || '',
                displayName: userData.displayName || 'Unknown User',
                photoURL: userData.photoURL || null,
                createdAt: userData.createdAt || null
              };
              usersList.push(sanitizedUser);
              console.log(`Added user: ${sanitizedUser.displayName} (${doc.id})`);
            }
          } catch (docError) {
            console.error(`Error processing user document ${doc.id}:`, docError);
          }
        });
        
        console.log(`Total users to display: ${usersList.length}`);
        setUsers(usersList);
        setError(null);
      } catch (err) {
        console.error('Error fetching all users:', err);
        setError('Failed to fetch users. Please check your connection.');
        
        // Fallback: at least show self-chat option
        if (currentUser) {
          const fallbackUser: UserProfile = {
            uid: currentUser.uid,
            email: currentUser.email || '',
            displayName: `${currentUser.displayName || 'Me'} (Chat with yourself)`,
            photoURL: currentUser.photoURL || null,
            createdAt: null
          };
          setUsers([fallbackUser]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentUser]);

  return { users, loading, error };
};
