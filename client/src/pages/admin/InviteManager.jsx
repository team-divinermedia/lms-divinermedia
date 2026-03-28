import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Mail, AlertCircle, Plus, Copy, Trash2, CheckCircle, Send, Key } from 'lucide-react';

const statusConfig = {
  pending: { label: 'Awaiting Claim', bg: 'bg-yellow-500/20', text: 'text-yellow-300', border: 'border-yellow-500/30' },
  used: { label: 'Claimed', bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/30' },
  expired: { label: 'Burned', bg: 'bg-white/5', text: 'text-gray-500', border: 'border-white/10' },
};

export default function InviteManager() {
  const [invites, setInvites] = useState([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('learner');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    fetchInvites();
  }, []);

  const fetchInvites = async () => {
    try {
      const res = await api.get('/admin/invites');
      setInvites(Array.isArray(res.data) ? res.data : res.data.invites || []);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to sync dispatch logs');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.post('/admin/invites', { email, role });
      setInvites([res.data, ...invites]);
      setEmail('');
      setSuccess('Access token successfully minted & dispatched');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to mint access token');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Burn this access token?')) return;
    try {
      await api.delete(`/admin/invites/${id}`);
      setInvites((prev) => prev.filter((i) => (i._id || i.id) !== id));
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to burn token');
    }
  };

  const copyLink = (invite) => {
    const token = invite.token || invite._id || invite.id;
    const link = `${window.location.origin}/register/${token}`;
    navigator.clipboard.writeText(link);
    setCopiedId(invite._id || invite.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-500 border-t-transparent shadow-[0_0_15px_rgba(6,182,212,0.5)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative z-10">
      <div className="flex flex-col pb-2 border-b border-white/10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-cyan-300 mb-3 uppercase tracking-widest shadow-inner w-fit">
          <Key className="h-3 w-3" />
          Access Control
        </div>
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-tight">Access Provisioning</h1>
        <p className="text-gray-400 mt-1 font-medium">Mint and dispatch secure registration links for new personnel</p>
      </div>

      <div className="glass-panel rounded-3xl border border-white/10 p-7 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none -mt-20 -mr-20"></div>
        
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3 relative z-10 tracking-wide">
          <div className="p-2 bg-cyan-500/20 rounded-xl border border-cyan-500/30 shadow-inner">
            <Plus className="h-5 w-5 text-cyan-400" />
          </div>
          Mint Access Token
        </h2>

        {error && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-200 text-sm backdrop-blur-md shadow-inner relative z-10">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-200 text-sm backdrop-blur-md shadow-inner relative z-10">
            <CheckCircle className="h-5 w-5 shrink-0 text-emerald-400" />
            {success}
          </div>
        )}

        <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-4 relative z-10">
          <div className="relative flex-1">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Target Email Address"
              className="w-full pl-12 pr-4 py-3.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 text-white placeholder-gray-500 transition-all shadow-inner font-medium text-sm outline-none"
            />
          </div>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full sm:w-48 px-4 py-3.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 text-white font-bold tracking-wider uppercase text-xs outline-none transition-all shadow-inner"
          >
            <option value="learner">Intern / Learner</option>
            <option value="admin">Administrator</option>
          </select>
          <button
            type="submit"
            disabled={creating}
            className="flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold tracking-widest uppercase transition-all disabled:opacity-50 shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] hover:-translate-y-0.5 border border-cyan-400/30"
          >
            <Send className="h-4 w-4" />
            {creating ? 'Minting...' : 'Dispatch Link'}
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-xl font-bold text-white mb-5 tracking-wide">Dispatch Log</h2>
        {invites.length === 0 ? (
          <div className="glass-panel rounded-[2.5rem] border border-white/10 p-16 text-center">
            <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner ring-1 ring-white/10">
              <Mail className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Log is empty</h3>
            <p className="text-gray-400 text-sm">Mint your first access token above to begin.</p>
          </div>
        ) : (
          <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="text-left py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Target Identity</th>
                    <th className="text-left py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Clearance Level</th>
                    <th className="text-left py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Status Validation</th>
                    <th className="text-left py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Minted Date</th>
                    <th className="text-left py-4 px-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Overrides</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {invites.map((invite) => {
                    const iId = invite._id || invite.id;
                    const status = statusConfig[invite.status] || statusConfig.pending;

                    return (
                      <tr key={iId} className="hover:bg-white/5 transition-colors group">
                        <td className="py-4 px-6 text-sm font-bold text-white tracking-wide">{invite.email}</td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-white/10 ${invite.role==='admin' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'}`}>
                            {invite.role}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-lg border ${status.bg} ${status.text} ${status.border}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm font-medium text-gray-400">
                          {new Date(invite.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => copyLink(invite)}
                              className="p-2.5 rounded-xl hover:bg-white/10 transition-colors text-gray-400 hover:text-cyan-400 ring-1 ring-transparent hover:ring-white/20"
                              title="Copy secure link"
                            >
                              {copiedId === iId ? (
                                <CheckCircle className="h-5 w-5 text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                              ) : (
                                <Copy className="h-5 w-5" />
                              )}
                            </button>
                            {invite.status === 'pending' && (
                              <button
                                onClick={() => handleDelete(iId)}
                                className="p-2.5 rounded-xl hover:bg-red-500/10 transition-colors text-gray-400 hover:text-red-400 ring-1 ring-transparent hover:ring-red-500/20"
                                title="Burn token"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
