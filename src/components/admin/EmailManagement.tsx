import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { RecipientSelector } from './RecipientSelector';
import { EmailHistoryPanel } from './EmailHistoryPanel';
import { Send, Mail, History, AlertTriangle } from 'lucide-react';

export default function EmailManagement() {
  const { toast } = useToast();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [recipientType, setRecipientType] = useState<'selected' | 'all' | 'by_role'>('selected');
  const [selectedRole, setSelectedRole] = useState<string | undefined>();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [refreshHistory, setRefreshHistory] = useState(0);

  const handleRecipientTypeChange = (type: 'selected' | 'all' | 'by_role', role?: string) => {
    setRecipientType(type);
    setSelectedRole(role);
  };

  const getRecipientCount = () => {
    if (recipientType === 'selected') {
      return selectedIds.length;
    }
    return '(will be calculated)';
  };

  const handleSendEmail = async () => {
    setShowConfirmDialog(false);

    if (!subject.trim() || !message.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide both subject and message",
        variant: "destructive",
      });
      return;
    }

    if (recipientType === 'selected' && selectedIds.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one recipient",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      const requestBody: any = {
        recipient_type: recipientType,
        subject: subject.trim(),
        message: message.trim(),
      };

      if (recipientType === 'selected') {
        requestBody.recipient_ids = selectedIds;
      } else if (recipientType === 'by_role') {
        requestBody.role = selectedRole;
      }

      const { data, error } = await supabase.functions.invoke('send-admin-email', {
        body: requestBody,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: data.message || 'Emails sent successfully!',
      });

      // Reset form
      setSubject('');
      setMessage('');
      setSelectedIds([]);
      setRecipientType('selected');
      setSelectedRole(undefined);
      
      // Refresh history
      setRefreshHistory(prev => prev + 1);

    } catch (error: any) {
      console.error('Error sending emails:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to send emails',
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleSendClick = () => {
    setShowConfirmDialog(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Mail className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Email Management</h2>
          <p className="text-muted-foreground">
            Send emails to users or view email history
          </p>
        </div>
      </div>

      <Tabs defaultValue="compose" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="compose">
            <Send className="h-4 w-4 mr-2" />
            Compose Email
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            Email History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="compose" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Recipient Selection */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-4">Select Recipients</h3>
                <RecipientSelector
                  selectedIds={selectedIds}
                  onSelectionChange={setSelectedIds}
                  onRecipientTypeChange={handleRecipientTypeChange}
                />
              </div>
            </div>

            {/* Right Column: Email Composer */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Compose Message</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter email subject..."
                    maxLength={200}
                  />
                  <p className="text-xs text-muted-foreground">
                    {subject.length}/200 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write your message here..."
                    rows={12}
                    className="resize-none"
                    maxLength={5000}
                  />
                  <p className="text-xs text-muted-foreground">
                    {message.length}/5000 characters
                  </p>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">Recipients:</span>
                    <span className="text-muted-foreground">
                      {recipientType === 'all' && 'All Users'}
                      {recipientType === 'by_role' && `All ${selectedRole}s`}
                      {recipientType === 'selected' && `${selectedIds.length} selected user(s)`}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleSendClick}
                  disabled={sending || !subject.trim() || !message.trim() || 
                    (recipientType === 'selected' && selectedIds.length === 0)}
                  className="w-full"
                  size="lg"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {sending ? 'Sending...' : 'Send Email'}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <EmailHistoryPanel key={refreshHistory} />
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Confirm Email Send
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to send an email to{' '}
              <strong>
                {recipientType === 'all' && 'all users'}
                {recipientType === 'by_role' && `all ${selectedRole}s`}
                {recipientType === 'selected' && `${selectedIds.length} selected user(s)`}
              </strong>
              .
              <br /><br />
              <strong>Subject:</strong> {subject}
              <br /><br />
              This action cannot be undone. Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSendEmail}>
              Yes, Send Email
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}