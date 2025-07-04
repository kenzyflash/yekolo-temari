
import { Github, MessageCircle, Mail, Shield } from 'lucide-react';

const Footer = () => {
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
              <li><a href="/" className="text-brand-green/80 hover:text-brand-red transition-colors">Home</a></li>
              <li><a href="/about" className="text-brand-green/80 hover:text-brand-red transition-colors">About</a></li>
              <li><a href="/blog" className="text-brand-green/80 hover:text-brand-red transition-colors">Blog</a></li>
              <li><a href="/events" className="text-brand-green/80 hover:text-brand-red transition-colors">Events</a></li>
              <li><a href="/projects" className="text-brand-green/80 hover:text-brand-red transition-colors">Projects</a></li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="text-white font-bold mb-4">Community</h4>
            <ul className="space-y-2">
              <li><a href="/join" className="text-brand-green/80 hover:text-brand-red transition-colors">Join Us</a></li>
              <li><a href="#" className="text-brand-green/80 hover:text-brand-red transition-colors">Code of Conduct</a></li>
              <li><a href="#" className="text-brand-green/80 hover:text-brand-red transition-colors">Contributing</a></li>
              <li><a href="#" className="text-brand-green/80 hover:text-brand-red transition-colors">Resources</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-bold mb-4">Connect</h4>
            <div className="flex space-x-4 mb-4">
              <a href="#" className="text-brand-green hover:text-brand-red transition-colors">
                <Github size={20} />
              </a>
              <a href="#" className="text-brand-green hover:text-brand-red transition-colors">
                <MessageCircle size={20} />
              </a>
              <a href="#" className="text-brand-green hover:text-brand-red transition-colors">
                <Mail size={20} />
              </a>
            </div>
            <div className="text-brand-green/80 text-sm">
              <p>Telegram: @yekolotemari</p>
              <p>Email: info@yekolotemari.org</p>
            </div>
          </div>
        </div>

        <div className="border-t border-brand-green/20 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-brand-green/60 text-sm">
            © 2024 Yekolo Temari. All rights reserved.
          </p>
          <div className="flex items-center space-x-2 text-brand-green/60 text-sm mt-4 md:mt-0">
            <Shield size={16} />
            <span>Ethical Hacking Community</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
