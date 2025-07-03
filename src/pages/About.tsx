
import Navigation from '../components/Navigation';
import MatrixRain from '../components/MatrixRain';
import { Shield, Target, Users, Globe, Award, Code } from 'lucide-react';

const About = () => {
  const values = [
    {
      icon: Shield,
      title: 'Ethical Hacking',
      description: 'We promote responsible disclosure and ethical security practices.'
    },
    {
      icon: Target,
      title: 'Skill Development',
      description: 'Continuous learning and improvement in cybersecurity skills.'
    },
    {
      icon: Users,
      title: 'Community First',
      description: 'Building a supportive network of security professionals.'
    },
    {
      icon: Globe,
      title: 'Local Impact',
      description: 'Strengthening cybersecurity awareness in Ethiopia.'
    }
  ];

  const achievements = [
    { icon: Award, title: 'CTF Champions', value: '15+ Wins' },
    { icon: Users, title: 'Community Size', value: '500+ Members' },
    { icon: Code, title: 'Open Source Tools', value: '25+ Projects' },
    { icon: Shield, title: 'Security Reports', value: '100+ Disclosed' }
  ];

  return (
    <div className="min-h-screen bg-brand-dark relative overflow-hidden">
      <MatrixRain />
      <Navigation />
      
      <div className="relative z-10 pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="terminal-window max-w-4xl mx-auto p-8 lg:p-12">
              <div className="terminal-header mb-8">
                <div className="terminal-dots">
                  <div className="terminal-dot dot-red"></div>
                  <div className="terminal-dot dot-yellow"></div>
                  <div className="terminal-dot dot-green"></div>
                </div>
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6 glow-text">
                About <span className="text-brand-red">Yekolo Temari</span>
              </h1>
              <p className="text-xl text-brand-green leading-relaxed">
                Ethiopia's leading ethical hacking and cybersecurity community, dedicated to 
                fostering security awareness and building the next generation of ethical hackers.
              </p>
            </div>
          </div>

          {/* Mission Section */}
          <section className="mb-16">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div className="terminal-window p-8">
                <div className="terminal-header mb-6">
                  <div className="terminal-dots">
                    <div className="terminal-dot dot-red"></div>
                    <div className="terminal-dot dot-yellow"></div>
                    <div className="terminal-dot dot-green"></div>
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-white mb-6">Our Mission</h2>
                <p className="text-brand-green text-lg leading-relaxed mb-6">
                  To create a thriving cybersecurity ecosystem in Ethiopia by providing education, 
                  resources, and opportunities for ethical hackers and security enthusiasts to 
                  grow and contribute to global cybersecurity efforts.
                </p>
                <p className="text-gray-300 leading-relaxed">
                  We believe in the power of community-driven learning and the importance of 
                  ethical practices in cybersecurity. Our goal is to bridge the knowledge gap 
                  and create opportunities for Ethiopian talent in the global security landscape.
                </p>
              </div>
              
              <div className="terminal-window p-8">
                <div className="terminal-header mb-6">
                  <div className="terminal-dots">
                    <div className="terminal-dot dot-red"></div>
                    <div className="terminal-dot dot-yellow"></div>
                    <div className="terminal-dot dot-green"></div>
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-white mb-6">Our Vision</h2>
                <p className="text-brand-green text-lg leading-relaxed mb-6">
                  To be recognized as the premier cybersecurity community in East Africa, 
                  producing world-class ethical hackers and security professionals who 
                  contribute meaningfully to global cybersecurity initiatives.
                </p>
                <p className="text-gray-300 leading-relaxed">
                  We envision a future where Ethiopian cybersecurity professionals are 
                  at the forefront of innovation, helping to secure digital infrastructure 
                  both locally and internationally.
                </p>
              </div>
            </div>
          </section>

          {/* Values Section */}
          <section className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-6 glow-text">
                Our <span className="text-brand-red">Values</span>
              </h2>
              <p className="text-xl text-brand-green max-w-2xl mx-auto">
                The principles that guide our community and shape our approach to cybersecurity
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => {
                const Icon = value.icon;
                return (
                  <div key={index} className="terminal-window p-6 hover-glow transition-all duration-300">
                    <div className="terminal-header mb-4">
                      <div className="terminal-dots">
                        <div className="terminal-dot dot-red"></div>
                        <div className="terminal-dot dot-yellow"></div>
                        <div className="terminal-dot dot-green"></div>
                      </div>
                    </div>
                    <div className="text-center">
                      <Icon className="h-12 w-12 text-brand-red mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-white mb-3">{value.title}</h3>
                      <p className="text-brand-green text-sm">{value.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Achievements Section */}
          <section className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-6 glow-text">
                Our <span className="text-brand-red">Impact</span>
              </h2>
              <p className="text-xl text-brand-green max-w-2xl mx-auto">
                Measurable contributions to the cybersecurity community
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {achievements.map((achievement, index) => {
                const Icon = achievement.icon;
                return (
                  <div key={index} className="terminal-window p-6 text-center hover-glow transition-all duration-300">
                    <div className="terminal-header mb-4">
                      <div className="terminal-dots">
                        <div className="terminal-dot dot-red"></div>
                        <div className="terminal-dot dot-yellow"></div>
                        <div className="terminal-dot dot-green"></div>
                      </div>
                    </div>
                    <Icon className="h-12 w-12 text-brand-red mx-auto mb-4" />
                    <div className="text-3xl font-bold text-white mb-2">{achievement.value}</div>
                    <div className="text-brand-green">{achievement.title}</div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* What We Do Section */}
          <section>
            <div className="terminal-window p-8 lg:p-12">
              <div className="terminal-header mb-8">
                <div className="terminal-dots">
                  <div className="terminal-dot dot-red"></div>
                  <div className="terminal-dot dot-yellow"></div>
                  <div className="terminal-dot dot-green"></div>
                </div>
              </div>
              
              <h2 className="text-3xl font-bold text-white mb-8 text-center">
                What We <span className="text-brand-red">Do</span>
              </h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-bold text-brand-red mb-4">Education & Training</h3>
                  <ul className="text-brand-green space-y-2 mb-6">
                    <li>• Regular workshops and seminars</li>
                    <li>• Hands-on penetration testing training</li>
                    <li>• Vulnerability assessment courses</li>
                    <li>• Security awareness programs</li>
                  </ul>
                  
                  <h3 className="text-xl font-bold text-brand-red mb-4">Community Building</h3>
                  <ul className="text-brand-green space-y-2">
                    <li>• Networking events and meetups</li>
                    <li>• Mentorship programs</li>
                    <li>• Career guidance and support</li>
                    <li>• Industry connections and partnerships</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-brand-red mb-4">Competitions & Challenges</h3>
                  <ul className="text-brand-green space-y-2 mb-6">
                    <li>• Regular CTF competitions</li>
                    <li>• Bug bounty programs</li>
                    <li>• Security challenge series</li>
                    <li>• International competition participation</li>
                  </ul>
                  
                  <h3 className="text-xl font-bold text-brand-red mb-4">Research & Development</h3>
                  <ul className="text-brand-green space-y-2">
                    <li>• Open source security tools</li>
                    <li>• Vulnerability research</li>
                    <li>• Security advisory publications</li>
                    <li>• Collaboration with international researchers</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default About;
