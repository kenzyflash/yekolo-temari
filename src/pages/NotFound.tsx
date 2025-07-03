
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Terminal, Home, ArrowLeft } from 'lucide-react';
import MatrixRain from '../components/MatrixRain';

const NotFound = () => {
  const [displayText, setDisplayText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const fullText = 'root@yekolo:~$ Error 404: Access Denied';

  useEffect(() => {
    let i = 0;
    const typeWriter = () => {
      if (i < fullText.length) {
        setDisplayText(fullText.slice(0, i + 1));
        i++;
        setTimeout(typeWriter, 100);
      }
    };
    
    setTimeout(typeWriter, 500);

    // Cursor blinking
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);

    return () => clearInterval(cursorInterval);
  }, []);

  const glitchTexts = [
    'You got 404\'d, script kiddie!',
    'Access denied, h4ck3r wannabe',
    'Page not found in the matrix',
    'System breach unsuccessful',
    'Permission denied, try harder'
  ];

  const [currentGlitch, setCurrentGlitch] = useState(0);

  useEffect(() => {
    const glitchInterval = setInterval(() => {
      setCurrentGlitch(prev => (prev + 1) % glitchTexts.length);
    }, 2000);

    return () => clearInterval(glitchInterval);
  }, []);

  return (
    <div className="min-h-screen bg-brand-dark relative overflow-hidden flex items-center justify-center">
      <MatrixRain />
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        {/* Terminal Window */}
        <div className="terminal-window max-w-3xl mx-auto mb-8">
          <div className="terminal-header">
            <div className="terminal-dots">
              <div className="terminal-dot dot-red"></div>
              <div className="terminal-dot dot-yellow"></div>
              <div className="terminal-dot dot-green"></div>
            </div>
          </div>
          
          <div className="p-8 lg:p-12">
            {/* Terminal Command */}
            <div className="text-left mb-8">
              <p className="text-brand-green font-mono text-lg">
                {displayText}
                <span className={`${showCursor ? 'opacity-100' : 'opacity-0'} transition-opacity`}>|</span>
              </p>
            </div>

            {/* 404 ASCII Art */}
            <div className="text-center mb-8">
              <div className="text-6xl lg:text-8xl font-bold text-brand-red mb-4 font-mono leading-none">
                404
              </div>
              
              {/* Glitch Effect */}
              <div className="relative">
                <h1 className="text-2xl lg:text-4xl font-bold text-white mb-4 glitch-text">
                  {glitchTexts[currentGlitch]}
                </h1>
              </div>

              {/* Hacker Silhouette */}
              <div className="my-8">
                <img 
                  src="/lovable-uploads/b0a82a80-d078-4caf-92be-cca56b1efd1e.png" 
                  alt="Hacker Silhouette" 
                  className="h-32 lg:h-48 mx-auto filter brightness-0 invert opacity-50"
                />
              </div>

              <p className="text-xl text-brand-green mb-8 max-w-2xl mx-auto">
                Looks like you tried to access a restricted area of the matrix. 
                Even the best hackers sometimes hit dead ends.
              </p>
            </div>

            {/* Error Details */}
            <div className="bg-brand-darker p-6 rounded-lg border border-brand-red/30 mb-8 text-left">
              <div className="flex items-center space-x-2 mb-4">
                <Terminal className="h-5 w-5 text-brand-red" />
                <span className="text-brand-red font-bold">System Error Log</span>
              </div>
              <div className="font-mono text-sm text-brand-green space-y-1">
                <p>[ERROR] HTTP 404: Resource not found</p>
                <p>[INFO] User attempted unauthorized access</p>
                <p>[WARNING] Redirecting to safe zone recommended</p>
                <p>[DEBUG] Consider checking your navigation skills</p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/"
                className="inline-flex items-center justify-center space-x-2 bg-brand-red hover:bg-brand-accent-red text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 hover-glow"
              >
                <Home size={20} />
                <span>Return to Base</span>
              </Link>
              <button
                onClick={() => window.history.back()}
                className="inline-flex items-center justify-center space-x-2 border-2 border-brand-green text-brand-green hover:bg-brand-green hover:text-brand-dark font-bold py-3 px-6 rounded-lg transition-all duration-300"
              >
                <ArrowLeft size={20} />
                <span>Go Back</span>
              </button>
            </div>
          </div>
        </div>

        {/* Easter Egg */}
        <div className="text-center">
          <p className="text-brand-green/60 text-sm font-mono">
            Pro tip: Try using the navigation menu like a real hacker would 😉
          </p>
        </div>
      </div>

      <style jsx>{`
        .glitch-text {
          animation: glitch 2s infinite;
        }
        
        @keyframes glitch {
          0% { transform: translateX(0); }
          10% { transform: translateX(-2px) translateY(1px); }
          20% { transform: translateX(2px) translateY(-1px); }
          30% { transform: translateX(0); }
          40% { transform: translateX(1px) translateY(1px); }
          50% { transform: translateX(-1px) translateY(-1px); }
          60% { transform: translateX(0); }
          70% { transform: translateX(2px) translateY(0); }
          80% { transform: translateX(-2px) translateY(0); }
          90% { transform: translateX(0); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

export default NotFound;
