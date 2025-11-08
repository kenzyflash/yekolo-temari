
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { blogSchema } from '@/lib/validation-schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Edit, Trash2, Eye, Plus, Check, X, Search } from 'lucide-react';
import BlogEditor from '@/components/BlogEditor';
import BlogPreview from '@/components/BlogPreview';
import LoadingSpinner from '@/components/LoadingSpinner';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
      // Validate status change
      if (!['draft', 'pending', 'published', 'rejected'].includes(status)) {
        toast({
          title: "Error",
          description: "Invalid blog status",
          variant: "destructive"
        });
        return;
      }

      // Get blog data to validate before publishing
      if (status === 'published') {
        const { data: blog, error: fetchError } = await supabase
          .from('blogs')
          .select('title, content, category')
          .eq('id', blogId)
          .single();

        if (fetchError) throw fetchError;

        // Validate required fields
        if (!blog.title || !blog.content || !blog.category) {
          toast({
            title: "Validation Error",
            description: "Blog must have title, content, and category before publishing",
            variant: "destructive"
          });
          return;
        }
      }

      const { error } = await supabase
        .from('blogs')
        .update({ 
          status, 
          updated_at: new Date().toISOString(),
          published: status === 'published'
        })
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
    setDeletingId(blogId);
    
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
        description: error.message || "Failed to delete blog",
        variant: "destructive"
      });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredBlogs = blogs
    .filter(blog => statusFilter === 'all' || blog.status === statusFilter)
    .filter(blog => 
      searchTerm === '' || 
      blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blog.author_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blog.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
    return <LoadingSpinner text="Loading blogs..." />;
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

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-green h-5 w-5" />
        <Input
          type="text"
          placeholder="Search blogs by title, author, or category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-brand-darker border-brand-green/20 text-white"
        />
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
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
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-brand-green hover:text-brand-red"
                      disabled={deletingId === blog.id}
                    >
                      {deletingId === blog.id ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-brand-dark border border-brand-green/20">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-white">Delete Blog</AlertDialogTitle>
                      <AlertDialogDescription className="text-brand-green/60">
                        Are you sure you want to delete "{blog.title}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="border-brand-green/20 text-brand-green hover:bg-brand-green/10">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteBlog(blog.id)}
                        className="bg-brand-red hover:bg-brand-red/80 text-white"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
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
