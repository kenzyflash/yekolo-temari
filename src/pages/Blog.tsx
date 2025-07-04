
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '../components/Navigation';
import MatrixRain from '../components/MatrixRain';
import Footer from '../components/Footer';
import { Search, Calendar, User, ChevronRight, Code, Shield, Bug } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Blog = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [blogPosts, setBlogPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { toast } = useToast();

  const categories = ['All', 'Web Security', 'Binary Exploitation', 'CTF Writeup', 'Tutorial', 'Mobile Security'];

  useEffect(() => {
    fetchBlogs();
  }, []);

  useEffect(() => {
    filterPosts();
  }, [blogPosts, searchTerm, selectedCategory]);

  const fetchBlogs = async () => {
    try {
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBlogPosts(data || []);
    } catch (error: any) {
      console.error('Error fetching blogs:', error);
      toast({
        title: "Error",
        description: "Failed to load blog posts",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterPosts = () => {
    let filtered = blogPosts.filter((post: any) =>
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (post.tags && post.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase())))
    );

    if (selectedCategory !== 'All') {
      filtered = filtered.filter((post: any) => post.category === selectedCategory);
    }

    setFilteredPosts(filtered);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Web Security': return Shield;
      case 'Binary Exploitation': return Bug;
      case 'CTF Writeup': return Code;
      default: return Code;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="text-brand-green text-xl">Loading blogs...</div>
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
            <div className="terminal-window max-w-4xl mx-auto p-8">
              <div className="terminal-header mb-6">
                <div className="terminal-dots">
                  <div className="terminal-dot dot-red"></div>
                  <div className="terminal-dot dot-yellow"></div>
                  <div className="terminal-dot dot-green"></div>
                </div>
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6 glow-text">
                Security <span className="text-brand-red">Blog</span>
              </h1>
              <p className="text-xl text-brand-green mb-6">
                CTF writeups, tutorials, and insights from our community
              </p>
              
              {/* Search */}
              <div className="relative max-w-md mx-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-green h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search posts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-brand-darker border border-brand-green/30 rounded-lg text-brand-green placeholder-brand-green/60 focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20"
                />
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="mb-8">
            <div className="flex flex-wrap justify-center gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg border border-brand-green/30 text-sm transition-all duration-300 ${
                    selectedCategory === category
                      ? 'bg-brand-red text-white'
                      : 'bg-brand-darker text-brand-green hover:bg-brand-red hover:text-white'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Blog Posts Grid */}
          {filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <div className="terminal-window max-w-md mx-auto p-8">
                <div className="terminal-header mb-4">
                  <div className="terminal-dots">
                    <div className="terminal-dot dot-red"></div>
                    <div className="terminal-dot dot-yellow"></div>
                    <div className="terminal-dot dot-green"></div>
                  </div>
                </div>
                <p className="text-brand-green text-lg">No blog posts found</p>
                <p className="text-brand-green/60 text-sm mt-2">
                  {searchTerm || selectedCategory !== 'All' 
                    ? 'Try adjusting your search or filter' 
                    : 'Check back soon for new content!'}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-8">
              {filteredPosts.map((post: any) => {
                const CategoryIcon = getCategoryIcon(post.category);
                return (
                  <article key={post.id} className="terminal-window hover-glow transition-all duration-300 transform hover:scale-105">
                    <div className="terminal-header">
                      <div className="terminal-dots">
                        <div className="terminal-dot dot-red"></div>
                        <div className="terminal-dot dot-yellow"></div>
                        <div className="terminal-dot dot-green"></div>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      {/* Category and Read Time */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <CategoryIcon className="h-4 w-4 text-brand-red" />
                          <span className="text-brand-red text-sm font-medium">{post.category}</span>
                        </div>
                        <span className="text-brand-green/60 text-sm">{post.read_time}</span>
                      </div>

                      {/* Title */}
                      <h2 className="text-xl font-bold text-white mb-3 hover:text-brand-red transition-colors cursor-pointer">
                        {post.title}
                      </h2>

                      {/* Excerpt */}
                      <p className="text-brand-green mb-4 line-clamp-3">
                        {post.excerpt}
                      </p>

                      {/* Tags */}
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {post.tags.map((tag: string, index: number) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-brand-red/20 text-brand-red text-xs rounded border border-brand-red/30"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Meta */}
                      <div className="flex items-center justify-between text-sm text-brand-green/80">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <User className="h-4 w-4" />
                            <span>{post.author_name}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(post.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <button className="flex items-center space-x-1 text-brand-red hover:text-brand-accent-red transition-colors">
                          <span>Read More</span>
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* CTA Section */}
          <div className="text-center mt-16">
            <div className="terminal-window max-w-2xl mx-auto p-8">
              <div className="terminal-header mb-6">
                <div className="terminal-dots">
                  <div className="terminal-dot dot-red"></div>
                  <div className="terminal-dot dot-yellow"></div>
                  <div className="terminal-dot dot-green"></div>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Share Your <span className="text-brand-red">Knowledge</span>
              </h3>
              <p className="text-brand-green mb-6">
                Have a CTF writeup or security tutorial to share? Contribute to our community blog!
              </p>
              <button className="bg-brand-red hover:bg-brand-accent-red text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 hover-glow">
                Submit Article
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Blog;
