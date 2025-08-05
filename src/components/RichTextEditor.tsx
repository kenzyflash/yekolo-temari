
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Bold, Italic, List, ListOrdered, Image, Save, X, Plus } from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';
import { blogPostSchema, type BlogPostInput } from '@/lib/validation';

interface RichTextEditorProps {
  blogId?: string;
  onClose: () => void;
  onSave: () => void;
}

interface BlogData {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  status: string;
}

const RichTextEditor = ({ blogId, onClose, onSave }: RichTextEditorProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const [blogData, setBlogData] = useState<BlogData>({
    title: '',
    excerpt: '',
    content: '',
    category: 'General',
    tags: [],
    status: 'draft'
  });
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);

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
      setBlogData({
        title: data.title,
        excerpt: data.excerpt || '',
        content: data.content,
        category: data.category || 'General',
        tags: data.tags || [],
        status: data.status || 'draft'
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const formatText = (format: string) => {
    const textarea = contentRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    let replacement = '';
    switch (format) {
      case 'bold':
        replacement = `**${selectedText}**`;
        break;
      case 'italic':
        replacement = `*${selectedText}*`;
        break;
      case 'list':
        replacement = `\n- ${selectedText}`;
        break;
      case 'ordered-list':
        replacement = `\n1. ${selectedText}`;
        break;
      default:
        return;
    }

    const newContent = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
    setBlogData(prev => ({ ...prev, content: newContent }));
    
    // Set cursor position after formatting
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + replacement.length, start + replacement.length);
    }, 0);
  };

  const insertImage = (imageUrl: string) => {
    const textarea = contentRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const imageMarkdown = `\n![Image](${imageUrl})\n`;
    const newContent = textarea.value.substring(0, start) + imageMarkdown + textarea.value.substring(start);
    
    setBlogData(prev => ({ ...prev, content: newContent }));
    setShowImageUpload(false);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + imageMarkdown.length, start + imageMarkdown.length);
    }, 0);
  };

  const addTag = () => {
    if (newTag.trim() && !blogData.tags.includes(newTag.trim())) {
      setBlogData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setBlogData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const saveBlog = async (status: string = blogData.status) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to save a blog post",
        variant: "destructive"
      });
      return;
    }

    // Validate input data
    try {
      blogPostSchema.parse({ ...blogData, status });
    } catch (error: any) {
      const errorMessage = error.errors?.[0]?.message || 'Invalid input data';
      toast({
        title: "Validation Error",
        description: errorMessage,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const blogPayload = {
        title: blogData.title,
        excerpt: blogData.excerpt || blogData.content.substring(0, 200) + '...',
        content: blogData.content,
        category: blogData.category,
        tags: blogData.tags,
        status: status,
        author_id: user.id,
        author_name: user.email || 'Anonymous',
        updated_at: new Date().toISOString()
      };

      if (blogId) {
        const { error } = await supabase
          .from('blogs')
          .update(blogPayload)
          .eq('id', blogId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('blogs')
          .insert([blogPayload]);
        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Blog ${status === 'draft' ? 'saved as draft' : status === 'pending' ? 'submitted for review' : 'saved'} successfully`
      });
      
      onSave();
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
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-brand-dark border border-brand-green/20">
        <DialogHeader>
          <DialogTitle className="text-white">
            {blogId ? 'Edit Article' : 'Write New Article'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <Input
            placeholder="Article title..."
            value={blogData.title}
            onChange={(e) => setBlogData(prev => ({ ...prev, title: e.target.value }))}
            className="bg-brand-darker border-brand-green/20 text-white text-xl font-bold"
          />

          {/* Excerpt */}
          <Textarea
            placeholder="Brief description (optional)..."
            value={blogData.excerpt}
            onChange={(e) => setBlogData(prev => ({ ...prev, excerpt: e.target.value }))}
            className="bg-brand-darker border-brand-green/20 text-white"
            rows={2}
          />

          {/* Category and Tags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-brand-green font-medium mb-2 block">Category</label>
              <Select value={blogData.category} onValueChange={(value) => setBlogData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger className="bg-brand-darker border-brand-green/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-brand-darker border-brand-green/20">
                  {categories.map(category => (
                    <SelectItem key={category} value={category} className="text-white">
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-brand-green font-medium mb-2 block">Tags</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="bg-brand-darker border-brand-green/20 text-white"
                />
                <Button onClick={addTag} size="sm" className="bg-brand-red hover:bg-brand-accent-red">
                  <Plus size={16} />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {blogData.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="bg-brand-green/20 text-brand-green">
                    {tag}
                    <X size={12} className="ml-1 cursor-pointer" onClick={() => removeTag(tag)} />
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Formatting Toolbar */}
          <div className="flex gap-2 p-2 bg-brand-darker rounded border border-brand-green/20">
            <Button onClick={() => formatText('bold')} size="sm" variant="ghost" className="text-brand-green hover:text-brand-red">
              <Bold size={16} />
            </Button>
            <Button onClick={() => formatText('italic')} size="sm" variant="ghost" className="text-brand-green hover:text-brand-red">
              <Italic size={16} />
            </Button>
            <Button onClick={() => formatText('list')} size="sm" variant="ghost" className="text-brand-green hover:text-brand-red">
              <List size={16} />
            </Button>
            <Button onClick={() => formatText('ordered-list')} size="sm" variant="ghost" className="text-brand-green hover:text-brand-red">
              <ListOrdered size={16} />
            </Button>
            <Button onClick={() => setShowImageUpload(true)} size="sm" variant="ghost" className="text-brand-green hover:text-brand-red">
              <Image size={16} />
            </Button>
          </div>

          {/* Content Editor */}
          <Textarea
            ref={contentRef}
            placeholder="Write your article content here... You can use markdown formatting."
            value={blogData.content}
            onChange={(e) => setBlogData(prev => ({ ...prev, content: e.target.value }))}
            className="bg-brand-darker border-brand-green/20 text-white min-h-[300px] font-mono"
          />

          {/* Actions */}
          <div className="flex justify-between items-center pt-4">
            <div className="flex gap-2">
              <Button
                onClick={() => saveBlog('draft')}
                disabled={loading}
                variant="outline"
                className="border-brand-green text-brand-green hover:bg-brand-green hover:text-brand-dark"
              >
                <Save size={16} className="mr-2" />
                Save Draft
              </Button>
              <Button
                onClick={() => saveBlog('pending')}
                disabled={loading}
                className="bg-brand-red hover:bg-brand-accent-red"
              >
                Submit for Review
              </Button>
            </div>
            <Button onClick={onClose} variant="ghost" className="text-brand-green hover:text-brand-red">
              Cancel
            </Button>
          </div>
        </div>

        {showImageUpload && (
          <ImageUpload
            onImageUploaded={insertImage}
            onClose={() => setShowImageUpload(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RichTextEditor;
