import { memo } from 'react';
import { Github, MessageCircle, Mail, Shield, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = memo(() => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-brand-darker border-t border-brand-green/20 py-12 px-4 relative overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center space-x-3 mb-4">
              <img 
                src="/lovable-uploads/b0a82a80-d078-4caf-92be-cca56b1efd1e.png" 
                alt="Yekolo Temari Logo" 
                className="h-8 w-auto filter brightness-0 invert"
                loading="lazy"
                decoding="async"
              />
              <span className="text-lg font-bold text-brand-green">
                Yekolo Temari
              </span>
            </div>
            <p className="text-brand-green/80 text-sm leading-relaxed">
              Ethiopia's premier ethical hacking and cybersecurity community. 
              Learning, competing, and securing the digital world together.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link to="/" className="text-brand-green/80 hover:text-brand-red transition-colors">Home</Link></li>
              <li><Link to="/about" className="text-brand-green/80 hover:text-brand-red transition-colors">About</Link></li>
              <li><Link to="/blog" className="text-brand-green/80 hover:text-brand-red transition-colors">Blog</Link></li>
              <li><Link to="/events" className="text-brand-green/80 hover:text-brand-red transition-colors">Events</Link></li>
              <li><Link to="/projects" className="text-brand-green/80 hover:text-brand-red transition-colors">Projects</Link></li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="text-white font-bold mb-4">Community</h4>
            <ul className="space-y-2">
              <li><Link to="/join" className="text-brand-green/80 hover:text-brand-red transition-colors">Join Us</Link></li>
              <li><a href="#" className="text-brand-green/80 hover:text-brand-red transition-colors">Code of Conduct</a></li>
              <li><a href="#" className="text-brand-green/80 hover:text-brand-red transition-colors">Contributing</a></li>
              <li><a href="#" className="text-brand-green/80 hover:text-brand-red transition-colors">Resources</a></li>
              <li>
                <Link to="/auth" className="text-brand-green/80 hover:text-brand-red transition-colors flex items-center space-x-2">
                  <LogIn size={16} />
                  <span>Login</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="text-white font-bold mb-4">Connect</h4>
            <div className="flex space-x-4 mb-4">
              <a href="https://github.com/yekolotemari" target="_blank" rel="noopener noreferrer" className="text-brand-green hover:text-brand-red transition-colors">
                <Github size={20} />
              </a>
              <a href="https://t.me/temari_yekolo" target="_blank" rel="noopener noreferrer" className="text-brand-green hover:text-brand-red transition-colors">
                <MessageCircle size={20} />
              </a>
              <a href="mailto:contact@yekolotemari.com" className="text-brand-green hover:text-brand-red transition-colors">
                <Mail size={20} />
              </a>
            </div>
            <div className="text-brand-green/80 text-sm">
              <p>Telegram: @temari_yekolo</p>
              <p>Email: contact@yekolotemari.com</p>
            </div>
          </div>
        </div>

        <div className="border-t border-brand-green/20 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-brand-green/60 text-sm">
            © {currentYear} Yekolo Temari. All rights reserved.
          </p>
          <div className="flex items-center space-x-2 text-brand-green/60 text-sm mt-4 md:mt-0">
            <Shield size={16} />
            <span>Ethical Hacking Community</span>
          </div>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';

export default Footer;
