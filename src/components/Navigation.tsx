
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Terminal, Shield, Code, Calendar, Users, Github, MessageCircle, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import AdminNotificationBell from '@/components/admin/AdminNotificationBell';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin } = useUserRoles();
  const { toast } = useToast();

  const navItems = [
    { name: 'Home', path: '/', icon: Terminal },
    { name: 'About', path: '/about', icon: Shield },
    { name: 'Blog', path: '/blog', icon: Code },
    { name: 'Events', path: '/events', icon: Calendar },
    { name: 'Projects', path: '/projects', icon: Github },
    { name: 'Join Us', path: '/join', icon: Users },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "Logged out successfully"
        });
        navigate('/');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-brand-darker/95 backdrop-blur-sm border-b border-brand-green/20">
      <div className="max-w-7xl mx-auto responsive-padding">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 sm:space-x-3 hover-glow p-1 sm:p-2 rounded-lg transition-all duration-300">
            <img 
              src="/lovable-uploads/b0a82a80-d078-4caf-92be-cca56b1efd1e.png" 
              alt="Yekolo Temari Logo" 
              className="h-8 sm:h-10 w-auto filter brightness-0 invert"
            />
            <span className="text-lg sm:text-xl font-bold text-brand-green glow-text hidden xs:block">
              Yekolo Temari
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center space-x-2 px-3 xl:px-4 py-2 rounded-lg transition-all duration-300 text-sm xl:text-base touch-target ${
                    isActive(item.path)
                      ? 'bg-brand-red text-white shadow-lg'
                      : 'text-brand-green hover:bg-brand-red/20 hover:text-white'
                  }`}
                >
                  <Icon size={18} />
                  <span className="hidden xl:block">{item.name}</span>
                </Link>
              );
            })}
            
            {/* Auth buttons */}
            {user ? (
              <div className="flex items-center space-x-1 xl:space-x-2 ml-2 xl:ml-4">
                {isAdmin() && <AdminNotificationBell />}
                <Link
                  to={isAdmin() ? "/admin" : "/dashboard"}
                  className="text-brand-green hover:bg-brand-red/20 hover:text-white px-2 xl:px-4 py-2 rounded-lg transition-all duration-300 text-sm xl:text-base touch-target"
                >
                  <span className="hidden xl:block">Dashboard</span>
                  <span className="xl:hidden">Dash</span>
                </Link>
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  size="sm"
                  className="text-brand-green hover:bg-brand-red hover:text-white touch-target"
                >
                  <LogOut size={18} />
                  <span className="ml-1 hidden xl:block">Logout</span>
                </Button>
              </div>
            ) : (
              <Link
                to="/auth"
                className="text-brand-green hover:bg-brand-red/20 hover:text-white px-2 xl:px-4 py-2 rounded-lg transition-all duration-300 ml-2 xl:ml-4 text-sm xl:text-base touch-target"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile/Tablet menu button */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-brand-green hover:text-white p-2 rounded-lg hover:bg-brand-red/20 transition-colors touch-target"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile/Tablet Navigation */}
        {isOpen && (
          <div className="lg:hidden terminal-window mt-2 mb-4 max-h-[80vh] overflow-y-auto">
            <div className="terminal-header">
              <div className="terminal-dots">
                <div className="terminal-dot dot-red"></div>
                <div className="terminal-dot dot-yellow"></div>
                <div className="terminal-dot dot-green"></div>
              </div>
            </div>
            <div className="p-4 space-y-2 scrollable-content">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                      isActive(item.path)
                        ? 'bg-brand-red text-white'
                        : 'text-brand-green hover:bg-brand-red/20 hover:text-white'
                    }`}
                  >
                    <Icon size={20} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              
              {/* Mobile Auth buttons */}
              {user ? (
                <>
                  <Link
                    to={isAdmin() ? "/admin" : "/dashboard"}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 text-brand-green hover:bg-brand-red/20 hover:text-white"
                  >
                    <Users size={20} />
                    <span>Dashboard</span>
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsOpen(false);
                    }}
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 text-brand-green hover:bg-brand-red/20 hover:text-white w-full text-left"
                  >
                    <LogOut size={20} />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <Link
                  to="/auth"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 text-brand-green hover:bg-brand-red/20 hover:text-white"
                >
                  <Users size={20} />
                  <span>Login</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
