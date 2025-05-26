
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
          console.log("Found user data:", userData);
          
          const sanitizedUser: UserProfile = {
            uid: userDoc.id,
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
        console.log("Fetching profile for user:", userId);
        const userDocRef = doc(firestore, 'users', userId);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log("Profile data:", userData);
          
          const sanitizedProfile: UserProfile = {
            uid: userId,
            email: userData.email || '',
            displayName: userData.displayName || '',
            photoURL: userData.photoURL || null,
            createdAt: userData.createdAt || null
          };
          setProfile(sanitizedProfile);
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

  useEffect(() => {
    const fetchUsers = async () => {
      console.log("Starting to fetch all users...");
      
      if (!currentUser) {
        console.log("No current user, cannot fetch users");
        setUsers([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log("Current user:", currentUser.uid);
        
        // Create self-chat option
        const selfChatUser: UserProfile = {
          uid: currentUser.uid,
          email: currentUser.email || '',
          displayName: 'Chat with yourself',
          photoURL: currentUser.photoURL || null,
          createdAt: null
        };

        console.log("Querying Firestore for users...");
        const usersRef = collection(firestore, 'users');
        const querySnapshot = await getDocs(usersRef);
        
        console.log(`Found ${querySnapshot.size} users in database`);
        
        if (querySnapshot.empty) {
          console.log("No users found in database, showing only self-chat");
          setUsers([selfChatUser]);
        } else {
          const usersList: UserProfile[] = [selfChatUser];
          
          querySnapshot.forEach((userDoc) => {
            try {
              const userData = userDoc.data();
              console.log(`Processing user ${userDoc.id}:`, userData);
              
              // Skip current user in the regular list since we have self-chat
              if (userDoc.id !== currentUser.uid) {
                const sanitizedUser: UserProfile = {
                  uid: userDoc.id,
                  email: userData.email || '',
                  displayName: userData.displayName || 'Unknown User',
                  photoURL: userData.photoURL || null,
                  createdAt: userData.createdAt || null
                };
                usersList.push(sanitizedUser);
                console.log(`Added user: ${sanitizedUser.displayName}`);
              }
            } catch (docError) {
              console.error(`Error processing user document ${userDoc.id}:`, docError);
            }
          });
          
          console.log(`Total users to display: ${usersList.length}`);
          setUsers(usersList);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to fetch users. Please check your connection.');
        
        // Fallback: show at least self-chat
        if (currentUser) {
          const fallbackUser: UserProfile = {
            uid: currentUser.uid,
            email: currentUser.email || '',
            displayName: 'Chat with yourself',
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
