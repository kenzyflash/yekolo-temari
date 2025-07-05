import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Clock, User, Search, Plus, Edit2 } from 'lucide-react';
import Navigation from '@/components/Navigation';
import MatrixRain from '@/components/MatrixRain';
import Footer from '@/components/Footer';
import BlogEditor from '@/components/BlogEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

const Blog = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showEditor, setShowEditor] = useState(false);
  const [editingPost, setEditingPost] = useState<string | undefined>();

  const categories = ['All', 'General', 'Tutorials', 'CTF Writeups', 'Tools', 'News', 'Research'];

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    filterPosts();
  }, [posts, searchTerm, selectedCategory]);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
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

  const filterPosts = () => {
    let filtered = posts;

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(post => post.category === selectedCategory);
    }

    if (searchTerm) {
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.author_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredPosts(filtered);
  };

  const handleEditPost = (postId: string) => {
    setEditingPost(postId);
    setShowEditor(true);
  };

  const handleCloseEditor = () => {
    setShowEditor(false);
    setEditingPost(undefined);
  };

  const handleSavePost = () => {
    fetchPosts();
  };

  const handleWriteArticle = () => {
    if (!user) {
      window.location.href = '/auth';
      return;
    }
    window.location.href = '/dashboard';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="text-brand-green text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-dark relative overflow-hidden">
      <MatrixRain />
      <Navigation />
      
      <div className="relative z-10 pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6 glow-text">
              Security <span className="text-brand-red">Blog</span>
            </h1>
            <p className="text-xl text-brand-green max-w-2xl mx-auto">
              Latest insights, tutorials, and writeups from the Ethiopian cybersecurity community
            </p>
          </div>

          {/* Controls */}
          <div className="mb-8 space-y-4">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-green h-5 w-5" />
                  <Input
                    type="text"
                    placeholder="Search articles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-brand-darker border-brand-green/20 text-white placeholder-brand-green/60"
                  />
                </div>
              </div>
              
              <Button
                onClick={handleWriteArticle}
                className="bg-brand-red hover:bg-brand-accent-red text-white"
              >
                <Plus size={16} className="mr-2" />
                Write Article
              </Button>
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg border transition-all ${
                    selectedCategory === category
                      ? 'bg-brand-red text-white border-brand-red'
                      : 'bg-brand-darker text-brand-green border-brand-green/20 hover:border-brand-red hover:text-brand-red'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Blog Posts */}
          <div className="grid gap-8 lg:gap-12">
            {filteredPosts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-brand-green/80 text-lg">No articles found matching your criteria.</p>
              </div>
            ) : (
              filteredPosts.map((post) => (
                <article key={post.id} className="terminal-window hover-glow transition-all duration-300">
                  <div className="terminal-header">
                    <div className="terminal-dots">
                      <div className="terminal-dot dot-red"></div>
                      <div className="terminal-dot dot-yellow"></div>
                      <div className="terminal-dot dot-green"></div>
                    </div>
                  </div>
                  <div className="p-8">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h2 className="text-2xl lg:text-3xl font-bold text-white mb-3 hover:text-brand-red transition-colors cursor-pointer">
                          {post.title}
                        </h2>
                        <p className="text-brand-green/80 text-lg leading-relaxed mb-4">
                          {post.excerpt}
                        </p>
                      </div>
                      {user && user.id === post.author_id && (
                        <Button
                          onClick={() => handleEditPost(post.id)}
                          variant="ghost"
                          size="sm"
                          className="text-brand-green hover:text-brand-red"
                        >
                          <Edit2 size={16} />
                        </Button>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-brand-green/60 mb-4">
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

                    <div className="flex flex-wrap gap-2 mb-6">
                      <span className="px-3 py-1 bg-brand-red/20 text-brand-red rounded-full text-sm">
                        {post.category}
                      </span>
                      {post.tags?.map(tag => (
                        <span key={tag} className="px-3 py-1 bg-brand-green/20 text-brand-green rounded-full text-sm">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <button className="text-brand-red hover:text-brand-accent-red font-medium transition-colors">
                      Read More →
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </div>

      {showEditor && (
        <BlogEditor
          blogId={editingPost}
          onClose={handleCloseEditor}
          onSave={handleSavePost}
        />
      )}
      
      <Footer />
    </div>
  );
};

export default Blog;
