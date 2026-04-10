
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Reply, Edit2, Trash2, Send, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface Comment {
  id: string;
  blog_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  author_name: string;
}

interface BlogCommentsProps {
  blogId: string;
}

const MAX_COMMENT_LENGTH = 2000;

const BlogComments = ({ blogId }: BlogCommentsProps) => {
  const { user } = useAuth();
  const { isAdmin } = useUserRoles();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [collapsedReplies, setCollapsedReplies] = useState<Set<string>>(new Set());

  const fetchComments = useCallback(async () => {
    try {
      const { data: commentsData, error } = await supabase
        .from('blog_comments')
        .select('*')
        .eq('blog_id', blogId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (!commentsData || commentsData.length === 0) {
        setComments([]);
        return;
      }

      // Fetch profile names for all unique user_ids
      const userIds = [...new Set(commentsData.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', userIds);

      const nameMap = new Map<string, string>();
      profiles?.forEach(p => {
        const name = [p.first_name, p.last_name].filter(Boolean).join(' ') || 'Anonymous';
        nameMap.set(p.user_id, name);
      });

      const enriched: Comment[] = commentsData.map(c => ({
        ...c,
        author_name: nameMap.get(c.user_id) || 'Anonymous',
      }));

      setComments(enriched);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setLoading(false);
    }
  }, [blogId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const validateContent = (content: string): string | null => {
    const trimmed = content.trim();
    if (!trimmed) return 'Comment cannot be empty.';
    if (trimmed.length > MAX_COMMENT_LENGTH) return `Comment must be under ${MAX_COMMENT_LENGTH} characters.`;
    return null;
  };

  const handleSubmit = async (parentId: string | null = null) => {
    if (!user) return;
    const content = parentId ? replyContent : newComment;
    const validationError = validateContent(content);
    if (validationError) {
      toast({ title: 'Validation Error', description: validationError, variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('blog_comments').insert({
        blog_id: blogId,
        user_id: user.id,
        parent_id: parentId,
        content: content.trim(),
      });
      if (error) throw error;

      if (parentId) {
        setReplyContent('');
        setReplyingTo(null);
      } else {
        setNewComment('');
      }
      await fetchComments();
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to post comment.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (commentId: string) => {
    const validationError = validateContent(editContent);
    if (validationError) {
      toast({ title: 'Validation Error', description: validationError, variant: 'destructive' });
      return;
    }

    try {
      const { error } = await supabase
        .from('blog_comments')
        .update({ content: editContent.trim(), is_edited: true })
        .eq('id', commentId);
      if (error) throw error;

      setEditingId(null);
      setEditContent('');
      await fetchComments();
    } catch {
      toast({ title: 'Error', description: 'Failed to update comment.', variant: 'destructive' });
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      const { error } = await supabase.from('blog_comments').delete().eq('id', commentId);
      if (error) throw error;
      await fetchComments();
    } catch {
      toast({ title: 'Error', description: 'Failed to delete comment.', variant: 'destructive' });
    }
  };

  const toggleReplies = (commentId: string) => {
    setCollapsedReplies(prev => {
      const next = new Set(prev);
      if (next.has(commentId)) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
  };

  // Build tree structure
  const topLevel = comments.filter(c => !c.parent_id);
  const repliesMap = new Map<string, Comment[]>();
  comments.forEach(c => {
    if (c.parent_id) {
      const existing = repliesMap.get(c.parent_id) || [];
      existing.push(c);
      repliesMap.set(c.parent_id, existing);
    }
  });

  const commentCount = comments.length;

  const renderComment = (comment: Comment, depth: number = 0) => {
    const replies = repliesMap.get(comment.id) || [];
    const isCollapsed = collapsedReplies.has(comment.id);
    const canModify = user && (user.id === comment.user_id || isAdmin());
    const canDelete = canModify;
    const canEdit = user && user.id === comment.user_id;

    return (
      <div key={comment.id} className={depth > 0 ? 'ml-6 border-l-2 border-brand-green/20 pl-4' : ''}>
        <div className="bg-brand-darker/50 border border-brand-green/10 rounded-lg p-4 mb-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-brand-green font-semibold">{comment.author_name}</span>
              <span className="text-brand-green/40">•</span>
              <span className="text-brand-green/40">
                {new Date(comment.created_at).toLocaleDateString()}
              </span>
              {comment.is_edited && (
                <span className="text-brand-green/30 text-xs italic">(edited)</span>
              )}
            </div>
            {(canEdit || canDelete) && editingId !== comment.id && (
              <div className="flex items-center gap-1">
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-brand-green/60 hover:text-brand-green"
                    onClick={() => { setEditingId(comment.id); setEditContent(comment.content); }}
                  >
                    <Edit2 size={14} />
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-brand-red/60 hover:text-brand-red"
                    onClick={() => handleDelete(comment.id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Content or edit form */}
          {editingId === comment.id ? (
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                maxLength={MAX_COMMENT_LENGTH}
                className="bg-brand-dark border-brand-green/30 text-white resize-none"
                rows={3}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleEdit(comment.id)} className="bg-brand-green text-brand-dark hover:bg-brand-green/80">
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="text-brand-green/60">
                  <X size={14} className="mr-1" /> Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-white/80 text-sm whitespace-pre-wrap break-words">{comment.content}</p>
          )}

          {/* Actions */}
          {user && editingId !== comment.id && (
            <div className="flex items-center gap-3 mt-3">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-brand-green/50 hover:text-brand-green text-xs"
                onClick={() => { setReplyingTo(replyingTo === comment.id ? null : comment.id); setReplyContent(''); }}
              >
                <Reply size={14} className="mr-1" /> Reply
              </Button>
              {replies.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-brand-green/50 hover:text-brand-green text-xs"
                  onClick={() => toggleReplies(comment.id)}
                >
                  {isCollapsed ? <ChevronDown size={14} className="mr-1" /> : <ChevronUp size={14} className="mr-1" />}
                  {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                </Button>
              )}
            </div>
          )}

          {/* Reply form */}
          {replyingTo === comment.id && (
            <div className="mt-3 space-y-2">
              <Textarea
                value={replyContent}
                onChange={e => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                maxLength={MAX_COMMENT_LENGTH}
                className="bg-brand-dark border-brand-green/30 text-white placeholder:text-brand-green/30 resize-none"
                rows={2}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleSubmit(comment.id)}
                  disabled={submitting}
                  className="bg-brand-green text-brand-dark hover:bg-brand-green/80"
                >
                  <Send size={14} className="mr-1" /> {submitting ? 'Posting...' : 'Reply'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setReplyingTo(null)} className="text-brand-green/60">
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Nested replies */}
        {!isCollapsed && replies.map(reply => renderComment(reply, depth + 1))}
      </div>
    );
  };

  return (
    <div className="mt-12">
      <div className="terminal-window">
        <div className="terminal-header">
          <div className="terminal-dots">
            <div className="terminal-dot dot-red"></div>
            <div className="terminal-dot dot-yellow"></div>
            <div className="terminal-dot dot-green"></div>
          </div>
        </div>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center gap-2 mb-6">
            <MessageSquare size={20} className="text-brand-green" />
            <h2 className="text-xl font-bold text-white">
              Comments {commentCount > 0 && <span className="text-brand-green/60 text-base">({commentCount})</span>}
            </h2>
          </div>

          {/* New comment form */}
          {user ? (
            <div className="mb-8 space-y-3">
              <Textarea
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Share your thoughts..."
                maxLength={MAX_COMMENT_LENGTH}
                className="bg-brand-dark border-brand-green/30 text-white placeholder:text-brand-green/30 resize-none"
                rows={3}
              />
              <div className="flex items-center justify-between">
                <span className="text-brand-green/30 text-xs">{newComment.length}/{MAX_COMMENT_LENGTH}</span>
                <Button
                  onClick={() => handleSubmit(null)}
                  disabled={submitting || !newComment.trim()}
                  className="bg-brand-green text-brand-dark hover:bg-brand-green/80"
                >
                  <Send size={14} className="mr-2" /> {submitting ? 'Posting...' : 'Post Comment'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="mb-8 p-4 border border-brand-green/20 rounded-lg text-center">
              <p className="text-brand-green/60">
                <a href="/auth" className="text-brand-green hover:text-brand-red transition-colors underline">Log in</a> to join the conversation.
              </p>
            </div>
          )}

          {/* Comments list */}
          {loading ? (
            <div className="text-brand-green/60 text-center py-8">Loading comments...</div>
          ) : topLevel.length === 0 ? (
            <div className="text-brand-green/40 text-center py-8">No comments yet. Be the first to comment!</div>
          ) : (
            <div className="space-y-2">
              {topLevel.map(comment => renderComment(comment))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlogComments;
