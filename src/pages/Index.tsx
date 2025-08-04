import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Terminal, Shield, Code, Users, Calendar, Github } from 'lucide-react';
import Navigation from '../components/Navigation';
import MatrixRain from '../components/MatrixRain';
import Footer from '../components/Footer';

const Index = () => {
  const [displayText, setDisplayText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const fullText = 'root@yekolo:~$ Welcome to Yekolo Temari';

  useEffect(() => {
    let i = 0;
    const typeWriter = () => {
      if (i < fullText.length) {
        setDisplayText(fullText.slice(0, i + 1));
        i++;
        setTimeout(typeWriter, 100);
      }
    };
    typeWriter();

    // Cursor blinking
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);

    return () => clearInterval(cursorInterval);
  }, []);

  const features = [
    {
      icon: Shield,
      title: 'Cybersecurity Training',
      description: 'Learn ethical hacking, penetration testing, and security best practices.'
    },
    {
      icon: Code,
      title: 'CTF Competitions',
      description: 'Participate in Capture The Flag events and sharpen your skills.'
    },
    {
      icon: Users,
      title: 'Community Driven',
      description: 'Connect with like-minded security enthusiasts in Ethiopia.'
    },
    {
      icon: Terminal,
      title: 'Hands-on Learning',
      description: 'Practice with real-world scenarios and cutting-edge tools.'
    }
  ];

  return (
    <div className="min-h-screen bg-brand-dark relative overflow-hidden">
      <MatrixRain />
      <Navigation />
      
      <div className="relative z-10 pt-14 sm:pt-16">
        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center responsive-padding">
          <div className="max-w-6xl mx-auto text-center w-full">
            {/* Terminal Window */}
            <div className="terminal-window max-w-4xl mx-auto mb-8 sm:mb-12">
              <div className="terminal-header">
                <div className="terminal-dots">
                  <div className="terminal-dot dot-red"></div>
                  <div className="terminal-dot dot-yellow"></div>
                  <div className="terminal-dot dot-green"></div>
                </div>
              </div>
              <div className="terminal-content">
                <div className="text-left mb-6 sm:mb-8">
                  <p className="text-brand-green font-mono text-base sm:text-lg lg:text-xl break-words">
                    {displayText}
                    <span className={`${showCursor ? 'opacity-100' : 'opacity-0'} transition-opacity`}>|</span>
                  </p>
                </div>
                
                <div className="text-center">
                  <img 
                    src="/lovable-uploads/b0a82a80-d078-4caf-92be-cca56b1efd1e.png" 
                    alt="Yekolo Temari Hacker Logo" 
                    className="h-24 sm:h-32 lg:h-48 mx-auto mb-6 sm:mb-8 filter brightness-0 invert"
                  />
                  
                  <h1 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 sm:mb-6 glow-text">
                    Welcome to <span className="text-brand-red">Yekolo Temari</span>
                  </h1>
                  
                  <p className="text-base sm:text-lg lg:text-xl xl:text-2xl text-brand-green mb-6 sm:mb-8 leading-relaxed">
                    Ethiopia's Premier Ethical Hacking & Cybersecurity Community
                  </p>
                  
                  <p className="text-sm sm:text-base lg:text-lg text-gray-300 mb-8 sm:mb-12 max-w-2xl mx-auto">
                    Join our community of ethical hackers, security researchers, and cybersecurity enthusiasts. 
                    Learn, compete, and contribute to making the digital world safer.
                  </p>
                  
                  <Link
                    to="/join"
                    className="inline-flex items-center space-x-2 bg-brand-red hover:bg-brand-accent-red text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-lg text-base sm:text-lg transition-all duration-300 hover-glow transform hover:scale-105 touch-target"
                  >
                    <span>Join the Movement</span>
                    <ChevronRight size={20} />
                  </Link>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-12 sm:mb-16">
              <div className="terminal-window text-center">
                <div className="terminal-content">
                  <div className="text-lg sm:text-xl lg:text-3xl font-bold text-brand-red mb-1 sm:mb-2">1500+</div>
                  <div className="text-brand-green text-xs sm:text-sm lg:text-base">Members</div>
                </div>
              </div>
              <div className="terminal-window text-center">
                <div className="terminal-content">
                  <div className="text-lg sm:text-xl lg:text-3xl font-bold text-brand-red mb-1 sm:mb-2">20+</div>
                  <div className="text-brand-green text-xs sm:text-sm lg:text-base">CTF Events</div>
                </div>
              </div>
              <div className="terminal-window text-center">
                <div className="terminal-content">
                  <div className="text-lg sm:text-xl lg:text-3xl font-bold text-brand-red mb-1 sm:mb-2">10+</div>
                  <div className="text-brand-green text-xs sm:text-sm lg:text-base">Workshops</div>
                </div>
              </div>
              <div className="terminal-window text-center">
                <div className="terminal-content">
                  <div className="text-lg sm:text-xl lg:text-3xl font-bold text-brand-red mb-1 sm:mb-2">100%</div>
                  <div className="text-brand-green text-xs sm:text-sm lg:text-base">Ethical</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12 sm:py-16 lg:py-20 responsive-padding">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6 glow-text">
                What We <span className="text-brand-red">Offer</span>
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-brand-green max-w-2xl mx-auto">
                Comprehensive cybersecurity education and community support
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="terminal-window hover-glow transition-all duration-300 transform hover:scale-105">
                    <div className="terminal-header mb-4">
                      <div className="terminal-dots">
                        <div className="terminal-dot dot-red"></div>
                        <div className="terminal-dot dot-yellow"></div>
                        <div className="terminal-dot dot-green"></div>
                      </div>
                    </div>
                    <div className="terminal-content text-center">
                      <Icon className="h-10 sm:h-12 w-10 sm:w-12 text-brand-red mx-auto mb-3 sm:mb-4" />
                      <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">{feature.title}</h3>
                      <p className="text-sm sm:text-base text-brand-green leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 sm:py-16 lg:py-20 responsive-padding">
          <div className="max-w-4xl mx-auto text-center">
            <div className="terminal-window">
              <div className="terminal-header mb-6 sm:mb-8">
                <div className="terminal-dots">
                  <div className="terminal-dot dot-red"></div>
                  <div className="terminal-dot dot-yellow"></div>
                  <div className="terminal-dot dot-green"></div>
                </div>
              </div>
              <div className="terminal-content">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6">
                  Ready to <span className="text-brand-red">Level Up</span> Your Skills?
                </h2>
                <p className="text-base sm:text-lg lg:text-xl text-brand-green mb-6 sm:mb-8">
                  Join Ethiopia's most active cybersecurity community and start your ethical hacking journey today.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                  <Link
                    to="/join"
                    className="inline-flex items-center justify-center space-x-2 bg-brand-red hover:bg-brand-accent-red text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 hover-glow touch-target"
                  >
                    <Users size={20} />
                    <span>Join Community</span>
                  </Link>
                  <Link
                    to="/blog"
                    className="inline-flex items-center justify-center space-x-2 border-2 border-brand-green text-brand-green hover:bg-brand-green hover:text-brand-dark font-bold py-3 px-6 rounded-lg transition-all duration-300 touch-target"
                  >
                    <Code size={20} />
                    <span>Read Writeups</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default Index;
