
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
          setUser({
            ...userData,
            uid: querySnapshot.docs[0].id,
            email: userData.email || '',
            displayName: userData.displayName || '',
            photoURL: userData.photoURL || null,
            createdAt: userData.createdAt || null
          });
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
          setProfile({
            uid: userId,
            email: userData.email || '',
            displayName: userData.displayName || '',
            photoURL: userData.photoURL || null,
            createdAt: userData.createdAt || null
          });
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

// Update the useAllUsers hook to properly fetch all users
export const useAllUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchUsers = async () => {
      if (!currentUser) {
        setUsers([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log("Fetching all users...");
        const usersRef = collection(firestore, 'users');
        // Remove orderBy which might be causing issues if there's no index
        const q = query(usersRef);
        const querySnapshot = await getDocs(q);
        
        console.log(`Found ${querySnapshot.size} users in database`);
        const usersList: UserProfile[] = [];
        
        querySnapshot.forEach((doc) => {
          const userData = doc.data();
          // Don't include the current user in the list
          if (doc.id !== currentUser.uid) {
            usersList.push({
              uid: doc.id,
              email: userData.email || '',
              displayName: userData.displayName || '',
              photoURL: userData.photoURL || null,
              createdAt: userData.createdAt || null
            });
            console.log(`Added user: ${userData.displayName || 'unknown'} (${doc.id})`);
          }
        });
        
        setUsers(usersList);
        console.log(`Set ${usersList.length} users in state`);
      } catch (err) {
        console.error('Error fetching all users:', err);
        setError('Failed to fetch users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentUser]);

  return { users, loading, error };
};
