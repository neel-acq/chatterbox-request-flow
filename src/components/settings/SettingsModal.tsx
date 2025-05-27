
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePinnedMessages, PinnedMessage } from '@/hooks/usePinnedMessages';
import { formatDistanceToNow } from 'date-fns';
import { Settings, Pin } from 'lucide-react';

interface SettingsModalProps {
  children: React.ReactNode;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [allPinnedMessages, setAllPinnedMessages] = useState<PinnedMessage[]>([]);
  const { getAllPinnedMessages, unpinMessage } = usePinnedMessages();

  useEffect(() => {
    if (open) {
      loadPinnedMessages();
    }
  }, [open]);

  const loadPinnedMessages = async () => {
    const messages = await getAllPinnedMessages();
    setAllPinnedMessages(messages);
  };

  const handleUnpin = async (pinnedMessageId: string) => {
    await unpinMessage(pinnedMessageId);
    loadPinnedMessages();
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="pinned" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pinned">Pinned Messages</TabsTrigger>
            <TabsTrigger value="general">General</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pinned" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pin className="h-4 w-4" />
                  Your Pinned Messages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  {allPinnedMessages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      No pinned messages yet
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {allPinnedMessages.map((message) => (
                        <div
                          key={message.id}
                          className="border rounded-lg p-3 space-y-2"
                        >
                          <div className="flex justify-between items-start">
                            <p className="text-sm font-medium">{message.senderName}</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUnpin(message.id)}
                            >
                              Unpin
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground break-words">
                            {message.content}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Pinned {formatTime(message.pinnedAt)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Additional settings can be added here in the future.
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
