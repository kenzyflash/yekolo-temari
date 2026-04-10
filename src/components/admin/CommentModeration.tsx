
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Trash2, MessageSquare, ExternalLink, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CommentRow {
  id: string;
  blog_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  is_edited: boolean;
  created_at: string;
  blog_title: string;
  author_name: string;
}

const CommentModeration = () => {
  const { toast } = useToast();
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchComments = async () => {
    try {
      // Fetch comments
      const { data: commentsData, error } = await supabase
        .from('blog_comments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      if (!commentsData || commentsData.length === 0) {
        setComments([]);
        setLoading(false);
        return;
      }

      // Fetch blog titles and profile names
      const blogIds = [...new Set(commentsData.map(c => c.blog_id))];
      const userIds = [...new Set(commentsData.map(c => c.user_id))];

      const [blogsRes, profilesRes] = await Promise.all([
        supabase.from('blogs').select('id, title').in('id', blogIds),
        supabase.from('profiles').select('user_id, first_name, last_name').in('user_id', userIds),
      ]);

      const blogMap = new Map<string, string>();
      blogsRes.data?.forEach(b => blogMap.set(b.id, b.title));

      const nameMap = new Map<string, string>();
      profilesRes.data?.forEach(p => {
        nameMap.set(p.user_id, [p.first_name, p.last_name].filter(Boolean).join(' ') || 'Anonymous');
      });

      const enriched: CommentRow[] = commentsData.map(c => ({
        ...c,
        blog_title: blogMap.get(c.blog_id) || 'Unknown Blog',
        author_name: nameMap.get(c.user_id) || 'Anonymous',
      }));

      setComments(enriched);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
      toast({ title: 'Error', description: 'Failed to load comments.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const { error } = await supabase.from('blog_comments').delete().eq('id', id);
      if (error) throw error;
      setComments(prev => prev.filter(c => c.id !== id));
      toast({ title: 'Comment deleted' });
    } catch {
      toast({ title: 'Error', description: 'Failed to delete comment.', variant: 'destructive' });
    } finally {
      setDeleting(null);
    }
  };

  const filtered = search
    ? comments.filter(c =>
        c.content.toLowerCase().includes(search.toLowerCase()) ||
        c.author_name.toLowerCase().includes(search.toLowerCase()) ||
        c.blog_title.toLowerCase().includes(search.toLowerCase())
      )
    : comments;

  if (loading) {
    return <div className="text-brand-green/60 text-center py-8">Loading comments...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <MessageSquare size={20} className="text-brand-red" />
          <h2 className="text-xl font-bold text-white">Comment Moderation</h2>
          <span className="text-brand-green/60 text-sm">({comments.length} total)</span>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-green/40 h-4 w-4" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search comments..."
            className="pl-9 bg-brand-dark border-brand-green/20 text-white placeholder:text-brand-green/30 h-9 text-sm"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-brand-green/40 text-center py-8">No comments found.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(comment => (
            <div key={comment.id} className="bg-brand-darker/50 border border-brand-green/10 rounded-lg p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm mb-1">
                    <span className="text-brand-green font-semibold">{comment.author_name}</span>
                    <span className="text-brand-green/30">•</span>
                    <span className="text-brand-green/40">{new Date(comment.created_at).toLocaleString()}</span>
                    {comment.is_edited && <span className="text-brand-green/30 text-xs italic">(edited)</span>}
                    {comment.parent_id && <span className="text-brand-red/60 text-xs">↳ reply</span>}
                  </div>
                  <p className="text-white/80 text-sm mb-2 break-words">{comment.content}</p>
                  <a
                    href={`/blog/${comment.blog_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-green/50 text-xs hover:text-brand-green flex items-center gap-1 w-fit"
                  >
                    <ExternalLink size={12} />
                    {comment.blog_title}
                  </a>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-brand-red/60 hover:text-brand-red hover:bg-brand-red/10 shrink-0"
                  onClick={() => handleDelete(comment.id)}
                  disabled={deleting === comment.id}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentModeration;
