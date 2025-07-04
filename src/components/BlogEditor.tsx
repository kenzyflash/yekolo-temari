
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Save, Eye, Send, X } from 'lucide-react';

interface BlogEditorProps {
  blogId?: string;
  onClose: () => void;
  onSave?: () => void;
}

const BlogEditor = ({ blogId, onClose, onSave }: BlogEditorProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [category, setCategory] = useState('General');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [status, setStatus] = useState<'draft' | 'pending' | 'published'>('draft');

  const categories = ['General', 'Tutorials', 'CTF Writeups', 'Tools', 'News', 'Research'];

  useEffect(() => {
    if (blogId) {
      fetchBlog();
    }
  }, [blogId]);

  const fetchBlog = async () => {
    if (!blogId) return;
    
    try {
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('id', blogId)
        .single();

      if (error) throw error;

      setTitle(data.title);
      setContent(data.content);
      setExcerpt(data.excerpt || '');
      setCategory(data.category || 'General');
      setTags(data.tags || []);
      setStatus(data.status || 'draft');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const saveBlog = async (newStatus: 'draft' | 'pending' | 'published') => {
    if (!user) return;
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Error",
        description: "Title and content are required",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const blogData = {
        title,
        content,
        excerpt: excerpt || content.substring(0, 200) + '...',
        category,
        tags,
        status: newStatus,
        author_id: user.id,
        author_name: user.email?.split('@')[0] || 'Anonymous'
      };

      if (blogId) {
        const { error } = await supabase
          .from('blogs')
          .update({ ...blogData, updated_at: new Date().toISOString() })
          .eq('id', blogId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('blogs')
          .insert([blogData]);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Blog ${newStatus === 'draft' ? 'saved as draft' : newStatus === 'pending' ? 'submitted for review' : 'published'} successfully`
      });

      onSave?.();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-brand-darker border border-brand-green/20 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-brand-green/20">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">
              {blogId ? 'Edit Blog Post' : 'Create New Blog Post'}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-brand-green hover:text-brand-red"
            >
              <X size={20} />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-brand-green font-medium mb-2">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter blog title..."
              className="bg-brand-dark border-brand-green/20 text-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-brand-green font-medium mb-2">Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-brand-dark border-brand-green/20 text-white">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-brand-green font-medium mb-2">Tags</label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Add tags..."
                  className="bg-brand-dark border-brand-green/20 text-white"
                />
                <Button onClick={addTag} size="sm" className="bg-brand-red hover:bg-brand-accent-red">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="bg-brand-green/20 text-brand-green">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="ml-1 hover:text-brand-red">
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-brand-green font-medium mb-2">Excerpt (Optional)</label>
            <Textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Brief description of the blog post..."
              className="bg-brand-dark border-brand-green/20 text-white"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-brand-green font-medium mb-2">Content</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your blog content here... (Markdown supported)"
              className="bg-brand-dark border-brand-green/20 text-white"
              rows={15}
            />
          </div>

          <div className="flex gap-4 pt-4 border-t border-brand-green/20">
            <Button
              onClick={() => saveBlog('draft')}
              disabled={loading}
              className="bg-gray-600 hover:bg-gray-700"
            >
              <Save size={16} className="mr-2" />
              Save Draft
            </Button>
            <Button
              onClick={() => saveBlog('pending')}
              disabled={loading}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              <Send size={16} className="mr-2" />
              Submit for Review
            </Button>
            <Button
              onClick={() => saveBlog('published')}
              disabled={loading}
              className="bg-brand-red hover:bg-brand-accent-red"
            >
              <Eye size={16} className="mr-2" />
              Publish Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogEditor;
