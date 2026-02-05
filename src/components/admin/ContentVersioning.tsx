import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { History, RotateCcw, Eye, RefreshCw, FileText, FolderOpen } from 'lucide-react';
import type { Json } from '@/integrations/supabase/types';

interface ContentVersion {
  id: string;
  content_type: string;
  content_id: string;
  version_number: number;
  title: string;
  content: Json;
  created_by: string;
  created_at: string;
  change_summary: string | null;
}

interface ContentItem {
  id: string;
  title: string;
  name?: string;
}

const ContentVersioning = () => {
  const { toast } = useToast();
  const [contentType, setContentType] = useState<'blog' | 'project'>('blog');
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [selectedContent, setSelectedContent] = useState<string>('');
  const [versions, setVersions] = useState<ContentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<ContentVersion | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    fetchContentItems();
  }, [contentType]);

  useEffect(() => {
    if (selectedContent) {
      fetchVersions();
    }
  }, [selectedContent]);

  const fetchContentItems = async () => {
    setLoading(true);
    try {
      if (contentType === 'blog') {
        const { data, error } = await supabase
          .from('blogs')
          .select('id, title')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setContentItems(data || []);
      } else {
        const { data, error } = await supabase
          .from('projects')
          .select('id, name')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setContentItems(data?.map(p => ({ id: p.id, title: p.name })) || []);
      }
    } catch (error) {
      console.error('Error fetching content items:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVersions = async () => {
    try {
      const { data, error } = await supabase
        .from('content_versions')
        .select('*')
        .eq('content_type', contentType)
        .eq('content_id', selectedContent)
        .order('version_number', { ascending: false });

      if (error) throw error;
      setVersions(data || []);
    } catch (error) {
      console.error('Error fetching versions:', error);
    }
  };

  const createVersion = async (contentId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let contentData: Record<string, unknown>;
      let title: string;

      if (contentType === 'blog') {
        const { data, error } = await supabase
          .from('blogs')
          .select('*')
          .eq('id', contentId)
          .single();
        
        if (error) throw error;
        contentData = data;
        title = data.title;
      } else {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', contentId)
          .single();
        
        if (error) throw error;
        contentData = data;
        title = data.name;
      }

      // Get next version number
      const { data: maxVersion } = await supabase
        .from('content_versions')
        .select('version_number')
        .eq('content_type', contentType)
        .eq('content_id', contentId)
        .order('version_number', { ascending: false })
        .limit(1)
        .single();

      const nextVersion = (maxVersion?.version_number || 0) + 1;

      const { error: insertError } = await supabase
        .from('content_versions')
        .insert({
          content_type: contentType,
          content_id: contentId,
          version_number: nextVersion,
          title,
          content: contentData as Json,
          created_by: user.id,
          change_summary: `Manual backup - Version ${nextVersion}`
        });

      if (insertError) throw insertError;

      toast({
        title: 'Success',
        description: `Created version ${nextVersion} for "${title}"`
      });
      fetchVersions();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create version',
        variant: 'destructive'
      });
    }
  };

  const restoreVersion = async () => {
    if (!selectedVersion) return;
    
    setRestoring(true);
    try {
      const content = selectedVersion.content as Record<string, unknown>;
      
      if (contentType === 'blog') {
        const { error } = await supabase
          .from('blogs')
          .update({
            title: content.title as string,
            content: content.content as string,
            excerpt: content.excerpt as string,
            category: content.category as string,
            tags: content.tags as string[],
            status: content.status as string,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedVersion.content_id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('projects')
          .update({
            name: content.name as string,
            description: content.description as string,
            github_url: content.github_url as string,
            category: content.category as string,
            language: content.language as string,
            tags: content.tags as string[],
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedVersion.content_id);

        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: `Restored to version ${selectedVersion.version_number}`
      });
      setShowPreview(false);
      setSelectedVersion(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to restore version',
        variant: 'destructive'
      });
    } finally {
      setRestoring(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin text-brand-green" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-6 w-6 text-brand-red" />
          <h2 className="text-xl font-bold text-white">Content Versioning</h2>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-brand-darker border-brand-green/20">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-brand-green text-sm mb-2 block">Content Type</label>
              <Select value={contentType} onValueChange={(v: 'blog' | 'project') => {
                setContentType(v);
                setSelectedContent('');
                setVersions([]);
              }}>
                <SelectTrigger className="bg-brand-dark border-brand-green/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-brand-darker border-brand-green/20">
                  <SelectItem value="blog">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Blogs
                    </div>
                  </SelectItem>
                  <SelectItem value="project">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-4 w-4" />
                      Projects
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-brand-green text-sm mb-2 block">Select Content</label>
              <Select value={selectedContent} onValueChange={setSelectedContent}>
                <SelectTrigger className="bg-brand-dark border-brand-green/20 text-white">
                  <SelectValue placeholder="Choose content..." />
                </SelectTrigger>
                <SelectContent className="bg-brand-darker border-brand-green/20">
                  {contentItems.map(item => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.title || item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedContent && (
              <div className="flex items-end">
                <Button 
                  onClick={() => createVersion(selectedContent)}
                  className="bg-brand-red hover:bg-brand-accent-red"
                >
                  <History className="h-4 w-4 mr-2" />
                  Create Backup
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Versions Table */}
      {selectedContent && (
        <Card className="bg-brand-darker border-brand-green/20">
          <CardHeader>
            <CardTitle className="text-white">Version History</CardTitle>
            <CardDescription>
              {versions.length} version(s) available
            </CardDescription>
          </CardHeader>
          <CardContent>
            {versions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-brand-green/20">
                    <TableHead className="text-brand-green">Version</TableHead>
                    <TableHead className="text-brand-green">Title</TableHead>
                    <TableHead className="text-brand-green">Created</TableHead>
                    <TableHead className="text-brand-green">Summary</TableHead>
                    <TableHead className="text-brand-green text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {versions.map((version) => (
                    <TableRow key={version.id} className="border-brand-green/20">
                      <TableCell>
                        <Badge variant="outline" className="border-brand-green text-brand-green">
                          v{version.version_number}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white">{version.title}</TableCell>
                      <TableCell className="text-brand-green/80">
                        {format(new Date(version.created_at), 'MMM d, yyyy HH:mm')}
                      </TableCell>
                      <TableCell className="text-brand-green/60 text-sm">
                        {version.change_summary || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedVersion(version);
                              setShowPreview(true);
                            }}
                            className="text-brand-green"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedVersion(version);
                              setShowPreview(true);
                            }}
                            className="text-brand-red"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-brand-green/60">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No versions available for this content.</p>
                <p className="text-sm mt-2">Create a backup to start tracking versions.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Preview/Restore Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="bg-brand-darker border-brand-green/20 max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">
              Version {selectedVersion?.version_number} - {selectedVersion?.title}
            </DialogTitle>
            <DialogDescription>
              Created on {selectedVersion && format(new Date(selectedVersion.created_at), 'MMMM d, yyyy at HH:mm')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-brand-dark p-4 rounded border border-brand-green/20 max-h-96 overflow-y-auto">
            <pre className="text-brand-green text-sm whitespace-pre-wrap">
              {JSON.stringify(selectedVersion?.content, null, 2)}
            </pre>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPreview(false)}
              className="border-brand-green/20 text-brand-green"
            >
              Cancel
            </Button>
            <Button
              onClick={restoreVersion}
              disabled={restoring}
              className="bg-brand-red hover:bg-brand-accent-red"
            >
              {restoring ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Restoring...
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Restore This Version
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContentVersioning;
