
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Plus, X, Save } from 'lucide-react';

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
  created_at: string;
}

const ProjectManagement = () => {
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    github_url: '',
    language: '',
    category: 'Security',
    tags: [] as string[],
    stars: 0,
    forks: 0,
    featured: false
  });

  const [tagInput, setTagInput] = useState('');

  const categories = ['Security', 'Tools', 'Education', 'Reconnaissance', 'Payloads', 'Scanning', 'Authentication'];
  const languages = ['Python', 'JavaScript', 'Go', 'Rust', 'C++', 'Java', 'Shell', 'PHP', 'Multiple'];

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

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

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({...formData, tags: [...formData.tags, tagInput.trim()]});
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({...formData, tags: formData.tags.filter(tag => tag !== tagToRemove)});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description || !formData.github_url) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingProject) {
        const { error } = await supabase
          .from('projects')
          .update({ ...formData, updated_at: new Date().toISOString() })
          .eq('id', editingProject.id);

        if (error) throw error;
        toast({ title: "Project updated successfully" });
      } else {
        const { error } = await supabase
          .from('projects')
          .insert([formData]);

        if (error) throw error;
        toast({ title: "Project created successfully" });
      }

      resetForm();
      fetchProjects();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      github_url: '',
      language: '',
      category: 'Security',
      tags: [],
      stars: 0,
      forks: 0,
      featured: false
    });
    setEditingProject(null);
    setShowForm(false);
    setTagInput('');
  };

  const editProject = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description,
      github_url: project.github_url,
      language: project.language || '',
      category: project.category,
      tags: project.tags || [],
      stars: project.stars,
      forks: project.forks,
      featured: project.featured
    });
    setShowForm(true);
  };

  const deleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;
      
      await fetchProjects();
      toast({ title: "Project deleted successfully" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="text-brand-green">Loading projects...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">Project Management</h2>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-brand-red hover:bg-brand-accent-red"
        >
          <Plus size={16} className="mr-2" />
          New Project
        </Button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-brand-darker border border-brand-green/20 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-brand-green/20">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">
                  {editingProject ? 'Edit Project' : 'Create New Project'}
                </h3>
                <Button
                  onClick={resetForm}
                  variant="ghost"
                  size="sm"
                  className="text-brand-green hover:text-brand-red"
                >
                  <X size={16} />
                </Button>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-brand-green font-medium mb-2">Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="bg-brand-dark border-brand-green/20 text-white"
                  required
                />
              </div>
              
              <div>
                <label className="block text-brand-green font-medium mb-2">Description *</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="bg-brand-dark border-brand-green/20 text-white"
                  rows={4}
                  required
                />
              </div>
              
              <div>
                <label className="block text-brand-green font-medium mb-2">GitHub URL *</label>
                <Input
                  value={formData.github_url}
                  onChange={(e) => setFormData({...formData, github_url: e.target.value})}
                  placeholder="https://github.com/..."
                  className="bg-brand-dark border-brand-green/20 text-white"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-brand-green font-medium mb-2">Category</label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                    <SelectTrigger className="bg-brand-dark border-brand-green/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-brand-green font-medium mb-2">Language</label>
                  <Select value={formData.language} onValueChange={(value) => setFormData({...formData, language: value})}>
                    <SelectTrigger className="bg-brand-dark border-brand-green/20 text-white">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map(lang => (
                        <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <label className="block text-brand-green font-medium mb-2">Tags</label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Add tags..."
                    className="bg-brand-dark border-brand-green/20 text-white"
                  />
                  <Button onClick={addTag} size="sm" type="button" className="bg-brand-red hover:bg-brand-accent-red">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="bg-brand-green/20 text-brand-green">
                      {tag}
                      <button onClick={() => removeTag(tag)} className="ml-1 hover:text-brand-red">
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-brand-green font-medium mb-2">Stars</label>
                  <Input
                    type="number"
                    value={formData.stars}
                    onChange={(e) => setFormData({...formData, stars: parseInt(e.target.value) || 0})}
                    className="bg-brand-dark border-brand-green/20 text-white"
                  />
                </div>
                <div>
                  <label className="block text-brand-green font-medium mb-2">Forks</label>
                  <Input
                    type="number"
                    value={formData.forks}
                    onChange={(e) => setFormData({...formData, forks: parseInt(e.target.value) || 0})}
                    className="bg-brand-dark border-brand-green/20 text-white"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.featured}
                  onCheckedChange={(checked) => setFormData({...formData, featured: checked})}
                />
                <label className="text-brand-green font-medium">Featured Project</label>
              </div>
              
              <div className="flex gap-4 pt-4">
                <Button type="submit" className="bg-brand-red hover:bg-brand-accent-red">
                  <Save size={16} className="mr-2" />
                  {editingProject ? 'Update Project' : 'Create Project'}
                </Button>
                <Button type="button" onClick={resetForm} variant="outline">
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {projects.map((project) => (
          <div key={project.id} className="bg-brand-darker p-4 rounded-lg border border-brand-green/20">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-white font-medium text-lg">{project.name}</h3>
                  {project.featured && (
                    <Badge className="bg-brand-red text-white">Featured</Badge>
                  )}
                </div>
                <p className="text-brand-green/80 text-sm mb-2">{project.description}</p>
                <div className="flex flex-wrap gap-2 mb-2">
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
                <div className="flex items-center gap-4 text-xs text-brand-green/60">
                  <span>⭐ {project.stars}</span>
                  <span>🍴 {project.forks}</span>
                  <a href={project.github_url} target="_blank" rel="noopener noreferrer" className="hover:text-brand-red">
                    View on GitHub
                  </a>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => editProject(project)}
                  size="sm"
                  variant="ghost"
                  className="text-brand-green hover:text-brand-red"
                >
                  <Edit size={14} />
                </Button>
                <Button
                  onClick={() => deleteProject(project.id)}
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
    </div>
  );
};

export default ProjectManagement;
