
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { updateProfile, updatePassword } from 'firebase/auth';
import { doc, updateDoc, query, where, collection, getDocs } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { User, Camera } from 'lucide-react';

interface ProfileUpdateModalProps {
  children: React.ReactNode;
}

export const ProfileUpdateModal: React.FC<ProfileUpdateModalProps> = ({ children }) => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: currentUser?.displayName || '',
    email: currentUser?.email || '',
    photoURL: currentUser?.photoURL || '',
  });

  const checkEmailUnique = async (email: string): Promise<boolean> => {
    if (email === currentUser?.email) return true;
    
    const q = query(collection(firestore, 'users'), where('email', '==', email));
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setLoading(true);
    try {
      // Check email uniqueness
      if (formData.email !== currentUser.email) {
        const isEmailUnique = await checkEmailUnique(formData.email);
        if (!isEmailUnique) {
          toast({
            variant: "destructive",
            title: "Email already exists",
            description: "This email is already in use by another account.",
          });
          setLoading(false);
          return;
        }
      }

      // Update Firebase Auth profile
      await updateProfile(currentUser, {
        displayName: formData.displayName,
        photoURL: formData.photoURL,
      });

      // Update Firestore user document
      const userRef = doc(firestore, 'users', currentUser.uid);
      await updateDoc(userRef, {
        displayName: formData.displayName,
        email: formData.email,
        photoURL: formData.photoURL,
      });

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });

      setOpen(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Profile</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={formData.photoURL} alt={formData.displayName} />
                <AvatarFallback>
                  {formData.displayName ? getInitials(formData.displayName) : <User />}
                </AvatarFallback>
              </Avatar>
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="photoURL">Profile Image URL</Label>
              <Input
                id="photoURL"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={formData.photoURL}
                onChange={(e) => setFormData(prev => ({ ...prev, photoURL: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Email (must be unique)</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Profile'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
