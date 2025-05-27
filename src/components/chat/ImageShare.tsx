
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Image } from 'lucide-react';

interface ImageShareProps {
  onSendImage: (imageUrl: string, caption?: string) => void;
}

export const ImageShare: React.FC<ImageShareProps> = ({ onSendImage }) => {
  const [open, setOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSend = async () => {
    if (!imageUrl.trim()) {
      toast({
        variant: "destructive",
        title: "Image URL required",
        description: "Please enter a valid image URL",
      });
      return;
    }

    setLoading(true);
    try {
      // Validate URL by creating an image element
      const img = new Image();
      img.onload = () => {
        onSendImage(imageUrl, caption);
        setImageUrl('');
        setCaption('');
        setOpen(false);
        setLoading(false);
        toast({
          title: "Image sent",
          description: "Your image has been shared",
        });
      };
      img.onerror = () => {
        setLoading(false);
        toast({
          variant: "destructive",
          title: "Invalid image",
          description: "Please check the image URL and try again",
        });
      };
      img.src = imageUrl;
    } catch (error) {
      setLoading(false);
      toast({
        variant: "destructive",
        title: "Error sharing image",
        description: "Please try again",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Image className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Image</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input
              id="imageUrl"
              type="url"
              placeholder="https://example.com/image.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="caption">Caption (optional)</Label>
            <Input
              id="caption"
              placeholder="Add a caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
          </div>

          {imageUrl && (
            <div className="mt-4">
              <Label>Preview:</Label>
              <img 
                src={imageUrl} 
                alt="Preview" 
                className="mt-2 max-w-full h-32 object-cover rounded-md"
                onError={() => toast({
                  variant: "destructive",
                  title: "Invalid image URL",
                  description: "Unable to load image preview"
                })}
              />
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleSend} disabled={loading || !imageUrl.trim()}>
              {loading ? 'Sending...' : 'Send Image'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
