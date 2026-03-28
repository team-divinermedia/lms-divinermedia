import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  BookOpen, LayoutDashboard, MessageSquare, Award, Users,
  BarChart3, FileText, Mail, LogOut, User, Menu, X, ChevronDown,
  AlertCircle, Layers
} from 'lucide-react';

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
      <header className="fixed top-0 left-0 right-0 z-[100] glass-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-8">
              <Link to="/dashboard" className="flex items-center gap-3 group">
                <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-purple-500 to-cyan-500 shadow-lg shadow-purple-500/30 group-hover:shadow-cyan-500/40 transition-all border border-purple-400/50">
                  <Layers className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
                  Diviner Media
                </span>
              </Link>
            </div>

            <div className="flex items-center gap-4">
              {/* Consolidated Navigation Dropdown Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-3 px-3 py-2 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all"
                >
                  <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-purple-600/50 to-cyan-500/50 border border-white/20 flex items-center justify-center outline outline-2 outline-offset-2 outline-transparent hover:outline-purple-500/50 transition-all shadow-inner">
                    <User className="h-5 w-5 text-purple-200" />
                  </div>
                  <div className="hidden sm:flex flex-col items-start pr-1">
                    <span className="text-sm font-bold text-gray-200 leading-tight">
                      {user?.name || 'User'}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-purple-300/70 font-semibold mt-0.5">
                      {user?.role === 'admin' ? 'Administrator' : 'Intern'}
                    </span>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-3 w-64 bg-[#0a0c16] rounded-3xl py-2 z-50 transform opacity-100 scale-100 transition-all shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] border border-white/10 ring-1 ring-white/5">
                    <div className="px-5 py-4 border-b border-white/5">
                      <p className="text-sm font-bold text-white">{user?.name}</p>
                      <p className="text-xs text-gray-400 mt-1">{user?.email}</p>
                    </div>
                    
                    <div className="py-2 px-3 border-b border-white/5 flex flex-col gap-1">
                      {navLinks.map((link) => (
                        <NavLink
                          key={link.to}
                          to={link.to}
                          onClick={() => setUserMenuOpen(false)}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                              isActive
                                ? 'bg-purple-500/20 text-purple-200 shadow-inner border border-purple-500/30'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
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
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all tracking-wide uppercase"
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
