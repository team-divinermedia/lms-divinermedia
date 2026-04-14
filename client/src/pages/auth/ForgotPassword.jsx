import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { Sparkles, AlertCircle, CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import ThemeToggle from '../../components/ThemeToggle';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-background selection:bg-pink-500/30 font-sans">
      <div className="absolute top-8 right-8 z-50">
        <ThemeToggle />
      </div>
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-purple-600/40 rounded-full blur-[140px] mix-blend-screen pointer-events-none -translate-x-1/4 -translate-y-1/4"></div>
      <div className="absolute bottom-0 right-0 w-[700px] h-[700px] bg-pink-600/30 rounded-full blur-[150px] mix-blend-screen pointer-events-none translate-x-1/4 translate-y-1/4"></div>
      <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgNDBoNDBWMEgwem0zOS0xdjM4SDFWMmgzOHoiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMSkiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvc3ZnPg==')] opacity-50 z-0"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-card text-card-foreground border rounded-xl shadow-sm rounded-[2.5rem] px-10 py-12 border border-border relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>

          <div className="relative z-10">
            <div className="mb-10">
              <div className="inline-flex items-center justify-center p-3.5 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-2xl mb-6 shadow-[0_0_30px_rgba(236,72,153,0.4)] border border-pink-400/50">
                <Sparkles className="h-7 w-7 text-white font-bold" />
              </div>
              <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-gray-400 tracking-tight">Reset your password</h1>
              <p className="text-muted-foreground mt-2 font-medium text-sm">We'll send a reset link to your email</p>
            </div>

            {success ? (
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 border border-green-500/30 rounded-2xl mb-6">
                  <CheckCircle className="h-8 w-8 text-green-400" />
                </div>
                <h2 className="text-xl font-bold text-foreground font-semibold mb-3">Check your email</h2>
                <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
                  If an account exists with <span className="text-pink-400 font-semibold">{email}</span>, you will receive a password reset link shortly.
                </p>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-semibold font-medium transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to sign in
                </Link>
              </div>
            ) : (
              <>
                {error && (
                  <div className="mb-6 flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-destructive text-sm backdrop-blur-md">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Email address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-5 py-4 bg-muted/50 backdrop-blur-md border border-border rounded-2xl focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 text-foreground font-semibold placeholder-muted-foreground/50 transition-all font-medium text-base shadow-inner"
                      placeholder="intern@divinermedia.com"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 mt-2 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 hover:from-purple-500 hover:via-pink-500 hover:to-orange-400 text-white font-bold rounded-2xl font-black tracking-widest uppercase text-sm transition-all duration-300 shadow-[0_10px_40px_rgba(219,39,119,0.4)] hover:shadow-[0_15px_50px_rgba(219,39,119,0.6)] hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border border-border flex items-center justify-center gap-3 group"
                  >
                    {loading ? 'Sending...' : 'Send Reset Link'}
                    {!loading && <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />}
                  </button>
                </form>

                <div className="mt-8 text-center">
                  <Link to="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-semibold transition-colors font-medium">
                    <ArrowLeft className="h-4 w-4" />
                    Back to sign in
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
