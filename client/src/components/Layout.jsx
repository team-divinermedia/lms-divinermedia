import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  BookOpen, LayoutDashboard, MessageSquare, Award, Users,
  FileText, LogOut, User, Menu, X, ChevronDown,
  AlertCircle, Layers, BarChart3, Mail
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getExpiryWarning = () => {
    if (!user?.accessExpiry) return null;
    const expiryDate = new Date(user.accessExpiry);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 7 && diffDays > 0) {
      return `Your access expires in ${diffDays} day${diffDays === 1 ? '' : 's'}.`;
    } else if (diffDays <= 0) {
      return 'Your access has expired.';
    }
    return null;
  };

  const warningMsg = getExpiryWarning();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const learnerLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/courses', label: 'My Courses', icon: BookOpen },
    { to: '/doubts', label: 'Doubts', icon: MessageSquare },
    { to: '/proofs', label: 'Portfolio', icon: Award },
  ];

  const adminLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/courses', label: 'Courses', icon: BookOpen },
    { to: '/admin/learners', label: 'Learners', icon: Users },
    { to: '/admin/doubts', label: 'Doubts', icon: MessageSquare },
    { to: '/admin/proofs', label: 'Proofs', icon: Award },
    { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
    { to: '/admin/invites', label: 'Invites', icon: Mail },
  ];

  const navLinks = isAdmin ? adminLinks : learnerLinks;

  return (
    <div className="min-h-screen text-gray-100 font-sans selection:bg-purple-500/30">
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            
            {/* Logo Sector */}
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center border border-primary-light shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                <Layers className="h-5 w-5 text-foreground font-semibold" />
              </div>
              <div>
                <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary-light to-primary-dark tracking-tight">Diviner Media</span>
              </div>
            </div>

            {/* Desktop Metrics & Profile */}
            <div className="hidden md:flex items-center gap-6">
              <ThemeToggle />
              
              <div className="h-8 w-[1px] bg-border mx-2"></div>

              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-4 p-2 rounded-2xl hover:bg-muted transition-colors border border-transparent hover:border-border"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                      <span className="font-bold text-primary tracking-wider">{user?.name?.charAt(0) || 'U'}{user?.name?.split(' ')[1]?.charAt(0) || ''}</span>
                    </div>
                    <div className="text-left hidden lg:block">
                      <p className="text-sm font-bold text-foreground leading-none">{user?.name}</p>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 block">
                        {isAdmin ? 'Administrator' : 'Intern Protocol'}
                      </span>
                    </div>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-3 w-64 bg-card rounded-2xl py-2 z-50 transform opacity-100 scale-100 transition-all shadow-lg border border-border">
                    <div className="px-5 py-4 border-b border-border">
                      <p className="text-sm font-bold text-foreground">{user?.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{user?.email}</p>
                    </div>
                    
                    <div className="py-2 px-3 border-b border-border flex flex-col gap-1">
                      {navLinks.map((link) => (
                        <NavLink
                          key={link.to}
                          to={link.to}
                          onClick={() => setUserMenuOpen(false)}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                              isActive
                                ? 'bg-primary/15 text-primary shadow-inner border border-primary/20'
                                : 'text-muted-foreground hover:text-foreground font-semibold hover:bg-muted'
                            }`
                          }
                          end={link.to === '/dashboard'}
                        >
                          <link.icon className="h-4 w-4 opacity-90" />
                          {link.label}
                        </NavLink>
                      ))}
                    </div>

                    <div className="p-3">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-red-600 dark:text-red-400 hover:text-red-500 hover:bg-red-500/10 transition-all tracking-wide uppercase"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-12">
        {warningMsg && !isAdmin && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-6">
            <div className="bg-orange-500/20 backdrop-blur-md border border-orange-500/30 rounded-2xl px-5 py-4 flex items-center gap-4 text-orange-200 text-sm font-medium shadow-[0_0_15px_rgba(249,115,22,0.15)]">
              <AlertCircle className="h-6 w-6 shrink-0 text-orange-400 drop-shadow-sm" />
              <span className="drop-shadow-sm">{warningMsg} Contact your administrator to extend your plan.</span>
            </div>
          </div>
        )}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
