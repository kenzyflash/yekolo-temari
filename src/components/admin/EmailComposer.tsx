import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Send } from 'lucide-react';

interface EmailComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  eventTitle: string;
  selectedParticipantIds?: string[];
  onEmailSent?: () => void;
}

export function EmailComposer({ 
  open, 
  onOpenChange, 
  eventId, 
  eventTitle,
  selectedParticipantIds,
  onEmailSent 
}: EmailComposerProps) {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const [subject, setSubject] = useState(`Important Update: ${eventTitle}`);
  const [message, setMessage] = useState('');

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide both subject and message",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-event-confirmation', {
        body: {
          eventId,
          participantIds: selectedParticipantIds,
          emailType: 'custom',
          customSubject: subject,
          customMessage: message
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: data.message || 'Custom emails sent successfully!',
      });

      // Reset form
      setSubject(`Important Update: ${eventTitle}`);
      setMessage('');
      onOpenChange(false);
      onEmailSent?.();
    } catch (error: any) {
      console.error('Error sending custom emails:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to send custom emails',
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Compose Email
          </DialogTitle>
          <DialogDescription>
            {selectedParticipantIds && selectedParticipantIds.length > 0
              ? `Send custom email to ${selectedParticipantIds.length} selected participant(s)`
              : 'Send custom email to all participants'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject..."
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message here..."
              rows={10}
              className="w-full resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Your message will be sent to participants for {eventTitle}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={sending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={sending || !subject.trim() || !message.trim()}
          >
            <Send className="h-4 w-4 mr-2" />
            {sending ? 'Sending...' : 'Send Email'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}