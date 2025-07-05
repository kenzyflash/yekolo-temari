
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Plus, Eye } from 'lucide-react';
import RichTextEditor from '@/components/RichTextEditor';

interface Blog {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  status: string;
  created_at: string;
  updated_at: string;
}

interface UserBlogManagementProps {
  onStatsUpdate: () => void;
}

const UserBlogManagement = ({ onStatsUpdate }: UserBlogManagementProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingBlog, setEditingBlog] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (user) {
      fetchBlogs();
    }
  }, [user]);

  const fetchBlogs = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('author_id', user.id)
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

  const deleteBlog = async (blogId: string) => {
    if (!confirm('Are you sure you want to delete this blog?')) return;
    
    try {
      const { error } = await supabase
        .from('blogs')
        .delete()
        .eq('id', blogId);

      if (error) throw error;
      
      await fetchBlogs();
      onStatsUpdate();
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

  const handleCloseEditor = () => {
    setShowEditor(false);
    setEditingBlog(undefined);
  };

  const handleSavePost = () => {
    fetchBlogs();
    onStatsUpdate();
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
    return <div className="text-brand-green">Loading your articles...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">My Articles</h2>
        <Button 
          onClick={() => setShowEditor(true)}
          className="bg-brand-red hover:bg-brand-accent-red"
        >
          <Plus size={16} className="mr-2" />
          Write New Article
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
        {filteredBlogs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-brand-green/80 text-lg">
              {statusFilter === 'all' ? 'No articles yet. Start writing!' : `No ${statusFilter} articles found.`}
            </p>
          </div>
        ) : (
          filteredBlogs.map((blog) => (
            <div key={blog.id} className="bg-brand-darker p-4 rounded-lg border border-brand-green/20">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="text-white font-medium text-lg">{blog.title}</h3>
                  <p className="text-brand-green/80 text-sm mt-1">{blog.excerpt}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-brand-green/60">
                    <span>{new Date(blog.created_at).toLocaleDateString()}</span>
                    <span className={`px-2 py-1 rounded ${getStatusColor(blog.status)}`}>
                      {blog.status}
                    </span>
                    <span className="px-2 py-1 bg-brand-red/20 text-brand-red rounded">
                      {blog.category}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
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
          ))
        )}
      </div>

      {showEditor && (
        <RichTextEditor
          blogId={editingBlog}
          onClose={handleCloseEditor}
          onSave={handleSavePost}
        />
      )}
    </div>
  );
};

export default UserBlogManagement;
