import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { X, Calendar, User, Clock, Tag } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface BlogPreviewProps {
  blogId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface BlogData {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  author_name: string;
  category: string;
  tags: string[];
  status: string;
  read_time: string;
  created_at: string;
  updated_at: string;
}

const BlogPreview = ({ blogId, isOpen, onClose }: BlogPreviewProps) => {
  const [blog, setBlog] = useState<BlogData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && blogId) {
      fetchBlog();
    }
  }, [isOpen, blogId]);

  const fetchBlog = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('id', blogId)
        .single();

      if (error) throw error;
      setBlog(data);
    } catch (error) {
      console.error('Error fetching blog:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'draft': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-brand-darker border-brand-green/20 text-white">
        <DialogHeader className="border-b border-brand-green/20 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl text-white mb-2">
                {loading ? 'Loading...' : blog?.title}
              </DialogTitle>
              {blog && (
                <div className="flex items-center gap-4 text-sm text-brand-green/80">
                  <div className="flex items-center gap-1">
                    <User size={14} />
                    <span>{blog.author_name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    <span>{new Date(blog.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    <span>{blog.read_time}</span>
                  </div>
                  <Badge className={`${getStatusColor(blog.status)} capitalize`}>
                    {blog.status}
                  </Badge>
                </div>
              )}
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-brand-green hover:text-brand-red"
            >
              <X size={16} />
            </Button>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 space-y-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green mx-auto"></div>
              <p className="text-brand-green mt-2">Loading blog content...</p>
            </div>
          ) : blog ? (
            <>
              {/* Excerpt */}
              {blog.excerpt && (
                <div className="bg-brand-dark/50 p-4 rounded-lg border-l-4 border-brand-red">
                  <p className="text-brand-green italic text-lg leading-relaxed">
                    {blog.excerpt}
                  </p>
                </div>
              )}

              {/* Category and Tags */}
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-brand-red/20 text-brand-red border-brand-red/30">
                  <Tag size={12} className="mr-1" />
                  {blog.category}
                </Badge>
                {blog.tags?.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="text-brand-green border-brand-green/30"
                  >
                    #{tag}
                  </Badge>
                ))}
              </div>

              {/* Content */}
              <div className="prose prose-invert prose-green max-w-none">
                <div className="text-brand-green leading-relaxed">
                  <ReactMarkdown
                    components={{
                      h1: ({ children }) => <h1 className="text-3xl font-bold text-white mb-4">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-2xl font-bold text-white mb-3 mt-6">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-xl font-bold text-white mb-2 mt-4">{children}</h3>,
                      p: ({ children }) => <p className="text-brand-green mb-4 leading-relaxed">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-1 text-brand-green">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-1 text-brand-green">{children}</ol>,
                      li: ({ children }) => <li className="text-brand-green">{children}</li>,
                      code: ({ children }) => (
                        <code className="bg-brand-dark px-2 py-1 rounded text-brand-red font-mono text-sm">
                          {children}
                        </code>
                      ),
                      pre: ({ children }) => (
                        <pre className="bg-brand-dark p-4 rounded-lg overflow-x-auto border border-brand-green/20 mb-4">
                          {children}
                        </pre>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-brand-red bg-brand-dark/50 p-4 rounded-r-lg mb-4 italic">
                          {children}
                        </blockquote>
                      ),
                      a: ({ children, href }) => (
                        <a href={href} className="text-brand-red hover:text-brand-accent-red underline" target="_blank" rel="noopener noreferrer">
                          {children}
                        </a>
                      ),
                    }}
                  >
                    {blog.content}
                  </ReactMarkdown>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-brand-green">Blog not found</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BlogPreview;