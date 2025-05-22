
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { firestore } from '../lib/firebase';

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
          const userData = querySnapshot.docs[0].data() as UserProfile;
          setUser(userData);
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
          setProfile(userDoc.data() as UserProfile);
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
