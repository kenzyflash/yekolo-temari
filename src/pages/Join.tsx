import { useState } from 'react';
import Navigation from '../components/Navigation';
import MatrixRain from '../components/MatrixRain';
import { Github, Mail, User, Send, ExternalLink } from 'lucide-react';
import { FaTelegramPlane, FaGithub, FaTwitter, FaYoutube, FaInstagram } from 'react-icons/fa';
import { SocialIcon } from 'react-social-icons';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

const Join = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
    interests: [] as string[]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const interests = [
    'Web Security',
    'Mobile Security',
    'Binary Exploitation',
    'Cryptography',
    'Network Security',
    'Malware Analysis',
    'CTF Competitions',
    'Bug Bounty',
    'Digital Forensics',
    'Social Engineering'
  ];

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('contact_messages')
        .insert({
          name: formData.name.trim(),
          email: formData.email.trim(),
          message: formData.message.trim() || null,
          interests: formData.interests,
          user_id: user?.id || null
        });

      if (error) throw error;

      toast({
        title: "Message Sent!",
        description: "Thank you for reaching out. We'll get back to you soon!",
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        message: '',
        interests: []
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
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
                Join <span className="text-brand-red">Yekolo Temari</span>
              </h1>
              <p className="text-xl text-brand-green">
                Become part of Ethiopia's amazing cybersecurity community
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Community Links */}
            <div className="space-y-8">
              <div className="terminal-window">
                <div className="terminal-header">
                  <div className="terminal-dots">
                    <div className="terminal-dot dot-red"></div>
                    <div className="terminal-dot dot-yellow"></div>
                    <div className="terminal-dot dot-green"></div>
                  </div>
                </div>
                <div className="p-8">
                  <h2 className="text-2xl font-bold text-white mb-6">
                    Connect With <span className="text-brand-red">Us</span>
                  </h2>
                  
                  <div className="space-y-4">
                    {/* Telegram */}
                    <a
                      href="https://t.me/temari_yekolo"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-4 p-4 bg-brand-darker rounded-lg hover:bg-brand-red/20 hover:border-brand-red border border-brand-green/30 transition-all duration-300 hover-glow"
                    >
                      <FaTelegramPlane className="h-8 w-8 text-blue-400" />
                      <div>
                        <h3 className="text-white font-bold">Telegram Channel</h3>
                        <p className="text-brand-green text-sm">Community Announcements, Security News, and  Blog Posts</p>
                        <p className="text-brand-green/60 text-xs">1500+ active members</p>
                      </div>
                      <ExternalLink className="h-5 w-5 text-brand-green/60 ml-auto" />
                    </a>
                    <a
                      href="https://t.me/+VEHOLUBqlzQW766y"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-4 p-4 bg-brand-darker rounded-lg hover:bg-brand-red/20 hover:border-brand-red border border-brand-green/30 transition-all duration-300 hover-glow"
                    >
                      <FaTelegramPlane className="h-8 w-8 text-blue-400" />
                      <div>
                        <h3 className="text-white font-bold">Telegram Group</h3>
                        <p className="text-brand-green text-sm">Daily Discussions, CTF/Hack Night Announcements, and Community Support</p>
                        <p className="text-brand-green/60 text-xs">500+ active members</p>
                      </div>
                      <ExternalLink className="h-5 w-5 text-brand-green/60 ml-auto" />
                    </a>

                    {/* GitHub */}
                    <a
                      href="https://github.com/yekolotemari"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-4 p-4 bg-brand-darker rounded-lg hover:bg-brand-red/20 hover:border-brand-red border border-brand-green/30 transition-all duration-300 hover-glow"
                    >
                      <FaGithub className="h-8 w-8 text-white" />
                      <div>
                        <h3 className="text-white font-bold">GitHub Organization</h3>
                        <p className="text-brand-green text-sm">Open source security tools and CTF challenges</p>
                        <p className="text-brand-green/60 text-xs">8+ repositories</p>
                      </div>
                      <ExternalLink className="h-5 w-5 text-brand-green/60 ml-auto" />
                    </a>

                    {/* Twitter (X) using react-social-icons */}
                    <a
                      href="https://twitter.com/yekolotemari"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-4 p-4 bg-brand-darker rounded-lg hover:bg-brand-red/20 hover:border-brand-red border border-brand-green/30 transition-all duration-300 hover-glow"
                    >
                      <SocialIcon url="https://x.com/yekolo_temari"   />
                      <div>
                        <h3 className="text-white font-bold">Twitter</h3>
                        <p className="text-brand-green text-sm">Follow us for updates, news, and event highlights</p>
                        <p className="text-brand-green/60 text-xs">@yekolotemari</p>
                      </div>
                      <ExternalLink className="h-5 w-5 text-brand-green/60 ml-auto" />
                    </a>

                    {/* YouTube */}
                    <a
                      href="https://www.youtube.com/@yekolotemari8858"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-4 p-4 bg-brand-darker rounded-lg hover:bg-brand-red/20 hover:border-brand-red border border-brand-green/30 transition-all duration-300 hover-glow"
                    >
                      <FaYoutube className="h-8 w-8 text-red-600" />
                      <div>
                        <h3 className="text-white font-bold">YouTube</h3>
                        <p className="text-brand-green text-sm">Watch our talks, tutorials, and event recordings</p>
                        <p className="text-brand-green/60 text-xs">@yekolotemari</p>
                      </div>
                      <ExternalLink className="h-5 w-5 text-brand-green/60 ml-auto" />
                    </a>

                    {/* Instagram */}
                    <a
                      href="https://instagram.com/yekolo_temari1337"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-4 p-4 bg-brand-darker rounded-lg hover:bg-brand-red/20 hover:border-brand-red border border-brand-green/30 transition-all duration-300 hover-glow"
                    >
                      <FaInstagram className="h-8 w-8 text-pink-500" />
                      <div>
                        <h3 className="text-white font-bold">Instagram</h3>
                        <p className="text-brand-green text-sm">See photos, stories, and event highlights</p>
                        <p className="text-brand-green/60 text-xs">@yekolotemari</p>
                      </div>
                      <ExternalLink className="h-5 w-5 text-brand-green/60 ml-auto" />
                    </a>

                    {/* Email */}
                    <a
                      href="mailto:contact@yekolotemari.com"
                      className="flex items-center space-x-4 p-4 bg-brand-darker rounded-lg hover:bg-brand-red/20 hover:border-brand-red border border-brand-green/30 transition-all duration-300 hover-glow cursor-pointer"
                      onClick={(e) => {
                        // Copy to clipboard as backup
                        navigator.clipboard.writeText('contact@yekolotemari.com').then(() => {
                          toast({
                            title: "Email Copied!",
                            description: "Email address copied to clipboard"
                          });
                        });
                      }}
                    >
                      <Mail className="h-8 w-8 text-brand-red" />
                      <div>
                        <h3 className="text-white font-bold">Email Contact</h3>
                        <p className="text-brand-green text-sm">contact@yekolotemari.com</p>
                        <p className="text-brand-green/60 text-xs">For partnership and collaboration inquiries</p>
                      </div>
                      <ExternalLink className="h-5 w-5 text-brand-green/60 ml-auto" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Community Stats */}
              <div className="terminal-window">
                <div className="terminal-header">
                  <div className="terminal-dots">
                    <div className="terminal-dot dot-red"></div>
                    <div className="terminal-dot dot-yellow"></div>
                    <div className="terminal-dot dot-green"></div>
                  </div>
                </div>
                <div className="p-8">
                  <h2 className="text-2xl font-bold text-white mb-6">
                    Community <span className="text-brand-red">Stats</span>
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-brand-darker rounded-lg">
                      <div className="text-2xl font-bold text-brand-red mb-1">1500+</div>
                      <div className="text-brand-green text-sm">Active Members</div>
                    </div>
                    <div className="text-center p-4 bg-brand-darker rounded-lg">
                      <div className="text-2xl font-bold text-brand-red mb-1">20+</div>
                      <div className="text-brand-green text-sm">CTF Events</div>
                    </div>
                    <div className="text-center p-4 bg-brand-darker rounded-lg">
                      <div className="text-2xl font-bold text-brand-red mb-1">10+</div>
                      <div className="text-brand-green text-sm">Workshops</div>
                    </div>
                    <div className="text-center p-4 bg-brand-darker rounded-lg">
                      <div className="text-2xl font-bold text-brand-red mb-1">25+</div>
                      <div className="text-brand-green text-sm">GitHub Stars</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="terminal-window">
              <div className="terminal-header">
                <div className="terminal-dots">
                  <div className="terminal-dot dot-red"></div>
                  <div className="terminal-dot dot-yellow"></div>
                  <div className="terminal-dot dot-green"></div>
                </div>
              </div>
              <div className="p-8">
                <h2 className="text-2xl font-bold text-white mb-6">
                  Get in <span className="text-brand-red">Touch</span>
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-brand-green mb-2">
                      <User className="inline h-4 w-4 mr-2" />
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full p-3 bg-brand-darker border border-brand-green/30 rounded-lg text-brand-green placeholder-brand-green/60 focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20"
                      placeholder="Your full name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-brand-green mb-2">
                      <Mail className="inline h-4 w-4 mr-2" />
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full p-3 bg-brand-darker border border-brand-green/30 rounded-lg text-brand-green placeholder-brand-green/60 focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20"
                      placeholder="your@email.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-brand-green mb-2">Areas of Interest</label>
                    <div className="grid grid-cols-2 gap-2">
                      {interests.map((interest) => (
                        <label
                          key={interest}
                          className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-brand-darker transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={formData.interests.includes(interest)}
                            onChange={() => handleInterestToggle(interest)}
                            className="form-checkbox h-4 w-4 text-brand-red bg-brand-darker border-brand-green/30 rounded focus:ring-brand-red focus:ring-offset-0"
                          />
                          <span className="text-brand-green text-sm">{interest}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-brand-green mb-2">Message (Optional)</label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                      rows={4}
                      className="w-full p-3 bg-brand-darker border border-brand-green/30 rounded-lg text-brand-green placeholder-brand-green/60 focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 resize-none"
                      placeholder="Tell us about your background, interests, or any questions you have..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-brand-red hover:bg-brand-accent-red text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 hover-glow flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5" />
                        <span>Send Message</span>
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-8 p-4 bg-brand-green/10 rounded-lg border border-brand-green/30">
                  <p className="text-brand-green text-sm">
                    <strong>Pro Tip:</strong> Join our Telegram group for immediate access to the community. 
                    This form is for formal inquiries and partnership opportunities.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div className="mt-16">
            <div className="terminal-window max-w-4xl mx-auto p-8">
              <div className="terminal-header mb-6">
                <div className="terminal-dots">
                  <div className="terminal-dot dot-red"></div>
                  <div className="terminal-dot dot-yellow"></div>
                  <div className="terminal-dot dot-green"></div>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-6 text-center">
                What We <span className="text-brand-red">Expect</span>
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-bold text-brand-red mb-4">✓ Requirements</h3>
                  <ul className="text-brand-green space-y-2">
                    <li>• Genuine interest in cybersecurity</li>
                    <li>• Commitment to ethical hacking principles</li>
                    <li>• Willingness to learn and share knowledge</li>
                    <li>• Respect for community guidelines</li>
                    <li>• Basic understanding of computer systems</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-brand-red mb-4">✗ Not Required</h3>
                  <ul className="text-brand-green space-y-2">
                    <li>• Prior cybersecurity experience</li>
                    <li>• Formal education in IT/CS</li>
                    <li>• Advanced technical skills</li>
                    <li>• Professional certifications</li>
                    <li>• Age restrictions (16+ preferred)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Join;
