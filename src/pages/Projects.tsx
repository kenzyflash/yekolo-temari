
import Navigation from '../components/Navigation';
import MatrixRain from '../components/MatrixRain';
import { Github, Star, Code, Shield, Bug, Zap, ExternalLink, Users } from 'lucide-react';

const Projects = () => {
  const projects = [
    {
      id: 1,
      name: 'EthioRecon',
      description: 'Comprehensive reconnaissance tool tailored for Ethiopian networks and infrastructure.',
      language: 'Python',
      stars: 245,
      forks: 67,
      category: 'Reconnaissance',
      tags: ['Python', 'Network Scanning', 'OSINT'],
      github: 'https://github.com/yekolo-temari/ethio-recon',
      featured: true
    },
    {
      id: 2,
      name: 'AmharicPayloads',
      description: 'Collection of security payloads and wordlists with Amharic context for localized testing.',
      language: 'Text',
      stars: 156,
      forks: 43,
      category: 'Payloads',
      tags: ['Wordlists', 'Payloads', 'Localization'],
      github: 'https://github.com/yekolo-temari/amharic-payloads',
      featured: true
    },
    {
      id: 3,
      name: 'CTF-Challenges',
      description: 'Custom CTF challenges created by our community for training and competitions.',
      language: 'Multiple',
      stars: 189,
      forks: 78,
      category: 'Education',
      tags: ['CTF', 'Challenges', 'Training'],
      github: 'https://github.com/yekolo-temari/ctf-challenges',
      featured: false
    },
    {
      id: 4,
      name: 'VulnScanner-ET',
      description: 'Automated vulnerability scanner with Ethiopian banking and financial sector focus.',
      language: 'Go',
      stars: 324,
      forks: 89,
      category: 'Scanning',
      tags: ['Go', 'Vulnerability Scanner', 'Automation'],
      github: 'https://github.com/yekolo-temari/vulnscanner-et',
      featured: true
    },
    {
      id: 5,
      name: 'SecureAuth-Ethiopia',
      description: 'Multi-factor authentication library designed for Ethiopian mobile networks.',
      language: 'JavaScript',
      stars: 98,
      forks: 23,
      category: 'Authentication',
      tags: ['JavaScript', 'Authentication', 'Mobile'],
      github: 'https://github.com/yekolo-temari/secureauth-ethiopia',
      featured: false
    },
    {
      id: 6,
      name: 'PhishGuard-AM',
      description: 'Phishing detection and prevention tool with Amharic language support.',
      language: 'Python',
      stars: 167,
      forks: 34,
      category: 'Security',
      tags: ['Python', 'Phishing', 'ML'],
      github: 'https://github.com/yekolo-temari/phishguard-am',
      featured: false
    }
  ];

  const categories = ['All', 'Reconnaissance', 'Payloads', 'Education', 'Scanning', 'Authentication', 'Security'];

  const getLanguageColor = (language: string) => {
    const colors: Record<string, string> = {
      'Python': 'bg-blue-500',
      'JavaScript': 'bg-yellow-500',
      'Go': 'bg-cyan-400',
      'Text': 'bg-gray-500',
      'Multiple': 'bg-gradient-to-r from-brand-red to-brand-accent-red'
    };
    return colors[language] || 'bg-brand-green';
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      'Reconnaissance': Shield,
      'Payloads': Bug,
      'Education': Code,
      'Scanning': Zap,
      'Authentication': Users,
      'Security': Shield
    };
    return icons[category] || Code;
  };

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
                Open Source <span className="text-brand-red">Projects</span>
              </h1>
              <p className="text-xl text-brand-green mb-6">
                Security tools and resources built by our community
              </p>
              <div className="flex justify-center items-center space-x-2 text-brand-green/80">
                <Github className="h-5 w-5" />
                <span>All projects are open source and available on GitHub</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            <div className="terminal-window p-6 text-center">
              <div className="text-3xl font-bold text-brand-red mb-2">25+</div>
              <div className="text-brand-green">Active Projects</div>
            </div>
            <div className="terminal-window p-6 text-center">
              <div className="text-3xl font-bold text-brand-red mb-2">1.2k+</div>
              <div className="text-brand-green">GitHub Stars</div>
            </div>
            <div className="terminal-window p-6 text-center">
              <div className="text-3xl font-bold text-brand-red mb-2">350+</div>
              <div className="text-brand-green">Forks</div>
            </div>
            <div className="terminal-window p-6 text-center">
              <div className="text-3xl font-bold text-brand-red mb-2">45+</div>
              <div className="text-brand-green">Contributors</div>
            </div>
          </div>

          {/* Categories */}
          <div className="mb-8">
            <div className="flex flex-wrap justify-center gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  className="px-4 py-2 rounded-lg bg-brand-darker border border-brand-green/30 text-brand-green hover:bg-brand-red hover:text-white transition-all duration-300 text-sm"
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Featured Projects */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">
              Featured <span className="text-brand-red">Projects</span>
            </h2>
            <div className="grid lg:grid-cols-2 gap-8">
              {projects.filter(p => p.featured).map((project) => {
                const CategoryIcon = getCategoryIcon(project.category);
                return (
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
                        <div className="flex items-center space-x-2">
                          <CategoryIcon className="h-5 w-5 text-brand-red" />
                          <span className="text-brand-red text-sm font-medium">{project.category}</span>
                        </div>
                        <span className="bg-brand-red text-white px-3 py-1 rounded-full text-xs font-bold">
                          FEATURED
                        </span>
                      </div>

                      <h3 className="text-2xl font-bold text-white mb-3">{project.name}</h3>
                      <p className="text-brand-green mb-4">{project.description}</p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {project.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-brand-green/20 text-brand-green text-xs rounded border border-brand-green/30"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <div className={`w-3 h-3 rounded-full ${getLanguageColor(project.language)}`}></div>
                            <span className="text-brand-green/80 text-sm">{project.language}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-brand-green/80">
                            <Star className="h-4 w-4" />
                            <span className="text-sm">{project.stars}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-brand-green/80">
                            <Code className="h-4 w-4" />
                            <span className="text-sm">{project.forks}</span>
                          </div>
                        </div>
                      </div>

                      <a
                        href={project.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-brand-red hover:bg-brand-accent-red text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 hover-glow flex items-center justify-center space-x-2"
                      >
                        <Github className="h-5 w-5" />
                        <span>View on GitHub</span>
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* All Projects */}
          <section>
            <h2 className="text-3xl font-bold text-white mb-8 text-center">
              All <span className="text-brand-red">Projects</span>
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => {
                const CategoryIcon = getCategoryIcon(project.category);
                return (
                  <div key={project.id} className="terminal-window hover-glow transition-all duration-300">
                    <div className="terminal-header">
                      <div className="terminal-dots">
                        <div className="terminal-dot dot-red"></div>
                        <div className="terminal-dot dot-yellow"></div>
                        <div className="terminal-dot dot-green"></div>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <CategoryIcon className="h-4 w-4 text-brand-red" />
                        <span className="text-brand-red text-sm">{project.category}</span>
                      </div>

                      <h3 className="text-lg font-bold text-white mb-2">{project.name}</h3>
                      <p className="text-brand-green text-sm mb-3 line-clamp-2">{project.description}</p>

                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-1">
                          <div className={`w-2 h-2 rounded-full ${getLanguageColor(project.language)}`}></div>
                          <span className="text-brand-green/80 text-xs">{project.language}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-1">
                            <Star className="h-3 w-3 text-brand-green/80" />
                            <span className="text-brand-green/80 text-xs">{project.stars}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Code className="h-3 w-3 text-brand-green/80" />
                            <span className="text-brand-green/80 text-xs">{project.forks}</span>
                          </div>
                        </div>
                      </div>

                      <a
                        href={project.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full border border-brand-green/30 text-brand-green hover:bg-brand-green hover:text-brand-dark font-bold py-2 px-3 rounded-lg transition-all duration-300 text-sm flex items-center justify-center space-x-2"
                      >
                        <Github className="h-4 w-4" />
                        <span>GitHub</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Contribution CTA */}
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
                Contribute to <span className="text-brand-red">Our Projects</span>
              </h3>
              <p className="text-brand-green mb-6">
                Help us build better security tools for the Ethiopian cybersecurity community.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="bg-brand-red hover:bg-brand-accent-red text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 hover-glow flex items-center justify-center space-x-2">
                  <Github className="h-5 w-5" />
                  <span>View All Projects</span>
                </button>
                <button className="border-2 border-brand-green text-brand-green hover:bg-brand-green hover:text-brand-dark font-bold py-3 px-6 rounded-lg transition-all duration-300">
                  Submit Your Project
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Projects;
