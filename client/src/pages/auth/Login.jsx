import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, AlertCircle, Sparkles, TrendingUp, Video, Layers, ArrowRight } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 sm:p-12 relative overflow-hidden bg-[#030712] selection:bg-pink-500/30">
      {/* High-intensity ambient lights for refraction behind the glass */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-purple-600/40 rounded-full blur-[140px] mix-blend-screen pointer-events-none -translate-x-1/4 -translate-y-1/4"></div>
      <div className="absolute bottom-0 right-0 w-[700px] h-[700px] bg-pink-600/30 rounded-full blur-[150px] mix-blend-screen pointer-events-none translate-x-1/4 translate-y-1/4"></div>
      <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
      
      {/* Grid overlay for a 'bento' technical feel */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgNDBoNDBWMEgwem0zOS0xdjM4SDFWMmgzOHoiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMSkiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvc3ZnPg==')] opacity-50 z-0"></div>

      <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        
        {/* LEFT SIDE: The Login Form (Bento Box 1) */}
        <div className="lg:col-span-5 glass-panel rounded-[2.5rem] px-10 py-12 sm:px-14 sm:py-16 border border-white/20 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="mb-12">
              <div className="inline-flex items-center justify-center p-3.5 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-2xl mb-8 shadow-[0_0_30px_rgba(236,72,153,0.4)] border border-pink-400/50">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-gray-400 tracking-tight leading-tight">Diviner<br/>Media</h1>
              <p className="text-pink-400 mt-3 font-bold text-sm tracking-[0.2em] uppercase">Intern Training Portal</p>
            </div>

            {error && (
              <div className="mb-8 flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-200 text-sm backdrop-blur-md shadow-inner">
                <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Intern Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-5 py-4 bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 text-white placeholder-gray-600 transition-all font-medium text-base shadow-inner"
                  placeholder="intern@divinermedia.com"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center pl-1 pr-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Security Keyword</label>
                  <Link to="/forgot-password" className="text-xs text-purple-400 hover:text-pink-400 font-bold transition-colors tracking-wide">
                    FORGOT?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-5 py-4 bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 text-white placeholder-gray-600 transition-all font-medium text-base shadow-inner pr-14"
                    placeholder="Enter your access phrase"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 mt-6 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 hover:from-purple-500 hover:via-pink-500 hover:to-orange-400 text-white rounded-2xl font-black tracking-widest uppercase text-sm transition-all duration-300 shadow-[0_10px_40px_rgba(219,39,119,0.4)] hover:shadow-[0_15px_50px_rgba(219,39,119,0.6)] hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border border-white/20 flex items-center justify-center gap-3 group"
              >
                {loading ? 'Initializing...' : 'Authorize Access'}
                {!loading && <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />}
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT SIDE: Bento Grid Graphic Showcase */}
        <div className="hidden lg:grid col-span-7 grid-cols-2 grid-rows-3 gap-8 h-full">
          
          {/* Top Span Box - Main Branding */}
          <div className="col-span-2 row-span-2 glass-panel rounded-[2.5rem] px-12 py-14 relative overflow-hidden group hover:border-white/30 transition-all duration-700 flex flex-col justify-end">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 via-transparent to-orange-900/30 opacity-70"></div>
            <div className="absolute -right-12 -top-24 opacity-10 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-1000 ease-out">
              <Layers className="w-[36rem] h-[36rem] text-white" />
            </div>
            
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-white/10 border border-white/20 text-xs font-bold text-pink-300 mb-8 backdrop-blur-md uppercase tracking-[0.15em] shadow-lg">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
                </span>
                Curriculum v2.0 Live
              </div>
              <h2 className="text-5xl font-black text-white leading-[1.1] tracking-tight">
                Master the Art of <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-orange-400 to-yellow-400">Viral Content Creation</span>
              </h2>
              <p className="text-gray-300 mt-6 max-w-lg text-lg font-medium leading-relaxed">
                Your exclusive portal to Diviner Media's internal strategies, algorithm hacks, and explosive content deployment playbooks.
              </p>
            </div>
          </div>

          {/* Bottom Left Box - Analytics */}
          <div className="col-span-1 row-span-1 glass-panel rounded-[2.5rem] px-10 py-8 relative overflow-hidden group hover:bg-white/10 transition-colors duration-500 flex flex-col justify-center">
            <div className="absolute -right-6 -bottom-6 opacity-[0.07] group-hover:-translate-y-3 group-hover:-translate-x-3 transition-transform duration-700 ease-out">
              <TrendingUp className="w-56 h-56 text-cyan-400" />
            </div>
            <div className="bg-cyan-500/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border border-cyan-500/30 backdrop-blur-md relative z-10 shrink-0">
              <TrendingUp className="h-7 w-7 text-cyan-300" />
            </div>
            <h3 className="text-2xl font-bold text-white relative z-10 tracking-tight">Growth Analytics</h3>
            <p className="text-gray-400 text-sm mt-3 relative z-10 font-medium leading-relaxed">Decode algorithms, optimize viewer retention, and scale client accounts dynamically.</p>
          </div>

          {/* Bottom Right Box - Production */}
          <div className="col-span-1 row-span-1 glass-panel rounded-[2.5rem] px-10 py-8 relative overflow-hidden group hover:bg-white/10 transition-colors duration-500 flex flex-col justify-center">
            <div className="absolute -right-6 -bottom-6 opacity-[0.07] group-hover:-translate-y-3 group-hover:-translate-x-3 transition-transform duration-700 ease-out">
              <Video className="w-56 h-56 text-pink-400" />
            </div>
            <div className="bg-pink-500/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border border-pink-500/30 backdrop-blur-md relative z-10 shrink-0">
              <Video className="h-7 w-7 text-pink-300" />
            </div>
            <h3 className="text-2xl font-bold text-white relative z-10 tracking-tight">Post-Production</h3>
            <p className="text-gray-400 text-sm mt-3 relative z-10 font-medium leading-relaxed">Master editing flow-states, visual micro-hooks, and high-impact pacing techniques.</p>
          </div>

        </div>
      </div>
    </div>
  );
}
