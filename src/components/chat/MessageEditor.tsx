
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { doc, updateDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Check, X } from 'lucide-react';

interface MessageEditorProps {
  messageId: string;
  chatId: string;
  currentText: string;
  onCancel: () => void;
  onSave: () => void;
}

export const MessageEditor: React.FC<MessageEditorProps> = ({
  messageId,
  chatId,
  currentText,
  onCancel,
  onSave
}) => {
  const [editedText, setEditedText] = useState(currentText);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!editedText.trim()) {
      toast({
        variant: "destructive",
        title: "Message cannot be empty",
        description: "Please enter some text",
      });
      return;
    }

    setSaving(true);
    try {
      const messageRef = doc(firestore, `chats/${chatId}/messages`, messageId);
      await updateDoc(messageRef, {
        text: editedText.trim(),
        edited: true,
        editedAt: new Date()
      });

      toast({
        title: "Message updated",
        description: "Your message has been edited",
      });
      onSave();
    } catch (error) {
      console.error('Error editing message:', error);
      toast({
        variant: "destructive",
        title: "Failed to edit message",
        description: "Please try again",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2 w-full">
      <Input
        value={editedText}
        onChange={(e) => setEditedText(e.target.value)}
        className="flex-1"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleSave();
          } else if (e.key === 'Escape') {
            onCancel();
          }
        }}
      />
      <Button
        size="sm"
        onClick={handleSave}
        disabled={saving || !editedText.trim()}
      >
        <Check className="h-3 w-3" />
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={onCancel}
        disabled={saving}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
};
