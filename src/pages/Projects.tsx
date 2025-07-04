
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Github, Star, GitFork, ExternalLink, Filter } from 'lucide-react';
import Navigation from '@/components/Navigation';
import MatrixRain from '@/components/MatrixRain';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface Project {
  id: string;
  name: string;
  description: string;
  github_url: string;
  language: string;
  category: string;
  tags: string[];
  stars: number;
  forks: number;
  featured: boolean;
}

const Projects = () => {
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLanguage, setSelectedLanguage] = useState('All');

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    filterProjects();
  }, [projects, selectedCategory, selectedLanguage]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('featured', { ascending: false })
        .order('stars', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
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

  const filterProjects = () => {
    let filtered = projects;

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(project => project.category === selectedCategory);
    }

    if (selectedLanguage !== 'All') {
      filtered = filtered.filter(project => project.language === selectedLanguage);
    }

    setFilteredProjects(filtered);
  };

  // Get unique categories and languages for filters
  const categories = ['All', ...Array.from(new Set(projects.map(p => p.category)))];
  const languages = ['All', ...Array.from(new Set(projects.map(p => p.language).filter(Boolean)))];

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
              Open Source <span className="text-brand-red">Projects</span>
            </h1>
            <p className="text-xl text-brand-green max-w-2xl mx-auto">
              Explore our collection of cybersecurity tools, frameworks, and educational resources built by the Ethiopian hacker community.
            </p>
          </div>

          {/* Filters */}
          <div className="mb-8 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Filter size={20} className="text-brand-green" />
              <span className="text-brand-green font-medium">Filter Projects</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-brand-green font-medium mb-2">Category</label>
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
              
              <div>
                <label className="block text-brand-green font-medium mb-2">Language</label>
                <div className="flex flex-wrap gap-2">
                  {languages.map(language => (
                    <button
                      key={language}
                      onClick={() => setSelectedLanguage(language)}
                      className={`px-4 py-2 rounded-lg border transition-all ${
                        selectedLanguage === language
                          ? 'bg-brand-red text-white border-brand-red'
                          : 'bg-brand-darker text-brand-green border-brand-green/20 hover:border-brand-red hover:text-brand-red'
                      }`}
                    >
                      {language}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Projects Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProjects.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-brand-green/80 text-lg">No projects found matching your criteria.</p>
              </div>
            ) : (
              filteredProjects.map((project) => (
                <div key={project.id} className="terminal-window hover-glow transition-all duration-300 transform hover:scale-105">
                  <div className="terminal-header">
                    <div className="terminal-dots">
                      <div className="terminal-dot dot-red"></div>
                      <div className="terminal-dot dot-yellow"></div>
                      <div className="terminal-dot dot-green"></div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-bold text-white">{project.name}</h3>
                      {project.featured && (
                        <Badge className="bg-brand-red text-white">Featured</Badge>
                      )}
                    </div>
                    
                    <p className="text-brand-green/80 text-sm mb-4 leading-relaxed">
                      {project.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge variant="outline" className="border-brand-red text-brand-red">
                        {project.category}
                      </Badge>
                      {project.language && (
                        <Badge variant="outline" className="border-brand-green text-brand-green">
                          {project.language}
                        </Badge>
                      )}
                      {project.tags?.map(tag => (
                        <Badge key={tag} variant="secondary" className="bg-brand-green/20 text-brand-green">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-brand-green/60">
                        <div className="flex items-center space-x-1">
                          <Star size={16} />
                          <span>{project.stars}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <GitFork size={16} />
                          <span>{project.forks}</span>
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => window.open(project.github_url, '_blank')}
                        size="sm"
                        className="bg-brand-red hover:bg-brand-accent-red text-white"
                      >
                        <Github size={16} className="mr-2" />
                        View Code
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Projects;
