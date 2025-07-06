
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Clock, User, ArrowLeft, Edit2 } from 'lucide-react';
import Navigation from '@/components/Navigation';
import MatrixRain from '@/components/MatrixRain';
import Footer from '@/components/Footer';
import BlogEditor from '@/components/BlogEditor';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author_name: string;
  author_id: string;
  category: string;
  tags: string[];
  read_time: string;
  created_at: string;
  status: string;
}

const BlogPost = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPost();
    }
  }, [id]);

  const fetchPost = async () => {
    try {
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('id', id)
        .eq('status', 'published')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          toast({
            title: "Blog post not found",
            description: "The blog post you're looking for doesn't exist or has been removed.",
            variant: "destructive"
          });
          navigate('/blog');
          return;
        }
        throw error;
      }

      setPost(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load blog post",
        variant: "destructive"
      });
      navigate('/blog');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPost = () => {
    setShowEditor(true);
  };

  const handleCloseEditor = () => {
    setShowEditor(false);
  };

  const handleSavePost = () => {
    fetchPost();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="text-brand-green text-xl">Loading...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="text-brand-green text-xl">Blog post not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-dark relative overflow-hidden">
      <MatrixRain />
      <Navigation />
      
      <div className="relative z-10 pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Back button */}
          <Button
            onClick={() => navigate('/blog')}
            variant="ghost"
            className="text-brand-green hover:text-brand-red mb-8"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Blog
          </Button>

          {/* Blog post */}
          <article className="terminal-window">
            <div className="terminal-header">
              <div className="terminal-dots">
                <div className="terminal-dot dot-red"></div>
                <div className="terminal-dot dot-yellow"></div>
                <div className="terminal-dot dot-green"></div>
              </div>
            </div>
            <div className="p-8">
              {/* Header with edit button */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4 glow-text">
                    {post.title}
                  </h1>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-brand-green/60 mb-6">
                    <div className="flex items-center space-x-1">
                      <User size={16} />
                      <span>{post.author_name}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar size={16} />
                      <span>{new Date(post.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock size={16} />
                      <span>{post.read_time}</span>
                    </div>
                  </div>
                </div>
                
                {user && user.id === post.author_id && (
                  <Button
                    onClick={handleEditPost}
                    variant="ghost"
                    size="sm"
                    className="text-brand-green hover:text-brand-red"
                  >
                    <Edit2 size={16} className="mr-1" />
                    Edit
                  </Button>
                )}
              </div>

              {/* Tags and category */}
              <div className="flex flex-wrap gap-2 mb-8">
                <span className="px-3 py-1 bg-brand-red/20 text-brand-red rounded-full text-sm">
                  {post.category}
                </span>
                {post.tags?.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-brand-green/20 text-brand-green rounded-full text-sm">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Excerpt */}
              {post.excerpt && (
                <div className="text-xl text-brand-green/80 mb-8 leading-relaxed italic border-l-4 border-brand-red pl-6">
                  {post.excerpt}
                </div>
              )}

              {/* Content */}
              <div 
                className="prose prose-invert prose-lg max-w-none text-white"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            </div>
          </article>
        </div>
      </div>

      {showEditor && (
        <BlogEditor
          blogId={post.id}
          onClose={handleCloseEditor}
          onSave={handleSavePost}
        />
      )}
      
      <Footer />
    </div>
  );
};

export default BlogPost;
