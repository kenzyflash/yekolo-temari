
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { blogSchema } from '@/lib/validation-schemas';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Eye, Plus, Check, X } from 'lucide-react';
import BlogEditor from '@/components/BlogEditor';
import BlogPreview from '@/components/BlogPreview';

interface Blog {
  id: string;
  title: string;
  excerpt: string;
  author_name: string;
  author_id: string;
  category: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const BlogManagement = () => {
  const { toast } = useToast();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingBlog, setEditingBlog] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState('all');
  const [showPreview, setShowPreview] = useState(false);
  const [previewBlogId, setPreviewBlogId] = useState<string>('');

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBlogs(data || []);
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

  const updateBlogStatus = async (blogId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('blogs')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', blogId);

      if (error) throw error;
      
      await fetchBlogs();
      toast({
        title: "Success",
        description: `Blog ${status} successfully`
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const deleteBlog = async (blogId: string) => {
    if (!confirm('Are you sure you want to delete this blog?')) return;
    
    try {
      const { error } = await supabase
        .from('blogs')
        .delete()
        .eq('id', blogId);

      if (error) throw error;
      
      await fetchBlogs();
      toast({
        title: "Success",
        description: "Blog deleted successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const filteredBlogs = statusFilter === 'all' 
    ? blogs 
    : blogs.filter(blog => blog.status === statusFilter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-500/20 text-green-400';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400';
      case 'draft': return 'bg-gray-500/20 text-gray-400';
      case 'rejected': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (loading) {
    return <div className="text-brand-green">Loading blogs...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">Blog Management</h2>
        <Button 
          onClick={() => setShowEditor(true)}
          className="bg-brand-red hover:bg-brand-accent-red"
        >
          <Plus size={16} className="mr-2" />
          New Blog
        </Button>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 mb-6">
        {['all', 'published', 'pending', 'draft', 'rejected'].map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg capitalize ${
              statusFilter === status
                ? 'bg-brand-red text-white'
                : 'bg-brand-darker text-brand-green hover:bg-brand-red/20'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredBlogs.map((blog) => (
          <div key={blog.id} className="bg-brand-darker p-4 rounded-lg border border-brand-green/20">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3 className="text-white font-medium text-lg">{blog.title}</h3>
                <p className="text-brand-green/80 text-sm mt-1">{blog.excerpt}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-brand-green/60">
                  <span>By {blog.author_name}</span>
                  <span>{new Date(blog.created_at).toLocaleDateString()}</span>
                  <span className={`px-2 py-1 rounded ${getStatusColor(blog.status)}`}>
                    {blog.status}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                {blog.status === 'pending' && (
                  <>
                    <Button
                      onClick={() => updateBlogStatus(blog.id, 'published')}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check size={14} />
                    </Button>
                    <Button
                      onClick={() => updateBlogStatus(blog.id, 'rejected')}
                      size="sm"
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <X size={14} />
                    </Button>
                  </>
                )}
                <Button
                  onClick={() => {
                    setPreviewBlogId(blog.id);
                    setShowPreview(true);
                  }}
                  size="sm"
                  variant="ghost"
                  className="text-brand-green hover:text-brand-red"
                  title="Preview Blog"
                >
                  <Eye size={14} />
                </Button>
                <Button
                  onClick={() => {
                    setEditingBlog(blog.id);
                    setShowEditor(true);
                  }}
                  size="sm"
                  variant="ghost"
                  className="text-brand-green hover:text-brand-red"
                >
                  <Edit size={14} />
                </Button>
                <Button
                  onClick={() => deleteBlog(blog.id)}
                  size="sm"
                  variant="ghost"
                  className="text-brand-green hover:text-brand-red"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showEditor && (
        <BlogEditor
          blogId={editingBlog}
          onClose={() => {
            setShowEditor(false);
            setEditingBlog(undefined);
          }}
          onSave={() => {
            fetchBlogs();
          }}
        />
      )}

      <BlogPreview
        blogId={previewBlogId}
        isOpen={showPreview}
        onClose={() => {
          setShowPreview(false);
          setPreviewBlogId('');
        }}
      />
    </div>
  );
};

export default BlogManagement;
