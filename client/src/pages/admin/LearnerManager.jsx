import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Users, AlertCircle, Search, User, ToggleLeft, ToggleRight, Loader } from 'lucide-react';

export default function LearnerManager() {
  const [learners, setLearners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    api.get('/admin/learners')
      .then((res) => setLearners(Array.isArray(res.data) ? res.data : res.data.learners || []))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load learners'))
      .finally(() => setLoading(false));
  }, []);

  const toggleStatus = async (learnerId, currentStatus) => {
    setUpdating(learnerId);
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await api.put(`/admin/learners/${learnerId}`, { status: newStatus });
      setLearners((prev) =>
        prev.map((l) =>
          (l._id || l.id) === learnerId ? { ...l, status: newStatus } : l
        )
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update learner');
    } finally {
      setUpdating(null);
    }
  };

  const updateExpiry = async (learnerId, date) => {
    try {
      await api.put(`/admin/learners/${learnerId}`, { accessExpiry: date || null });
      setLearners((prev) =>
        prev.map((l) =>
          (l._id || l.id) === learnerId ? { ...l, accessExpiry: date || null } : l
        )
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update expiry');
    }
  };

  const filtered = learners.filter(
    (l) =>
      l.name?.toLowerCase().includes(search.toLowerCase()) ||
      l.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-500 border-t-transparent shadow-[0_0_15px_rgba(6,182,212,0.5)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative z-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pb-2 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-cyan-300 mb-3 uppercase tracking-widest shadow-inner">
            Intern Roster
          </div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-tight">Manage Learners</h1>
          <p className="text-gray-400 mt-1 font-medium">{learners.length} active personnel</p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search roster..."
            className="w-full pl-12 pr-4 py-3 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 text-white placeholder-gray-500 transition-all shadow-inner font-medium text-sm"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-200 text-sm backdrop-blur-md shadow-inner">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
          {error}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="glass-panel rounded-[2.5rem] border border-white/10 p-16 text-center">
          <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner ring-1 ring-white/10">
            <Users className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">No learners found</h3>
          <p className="text-gray-400 text-sm max-w-sm mx-auto">
            {search ? 'Try a different search term or check spelling.' : 'No personnel have been onboarded yet.'}
          </p>
        </div>
      ) : (
        <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="text-left py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Learner Protocol</th>
                  <th className="text-left py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Last Intel</th>
                  <th className="text-left py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Progression</th>
                  <th className="text-left py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Status</th>
                  <th className="text-left py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Clearance Expiry</th>
                  <th className="text-left py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Overrides</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((learner) => {
                  const lId = learner._id || learner.id;
                  const isActive = learner.status === 'active' || learner.status === undefined;

                  return (
                    <tr key={lId} className="hover:bg-white/5 transition-colors group">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-white/10 rounded-2xl flex items-center justify-center shrink-0 shadow-inner group-hover:from-cyan-500/30 transition-colors">
                            <User className="h-5 w-5 text-cyan-300" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white uppercase tracking-wide">{learner.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{learner.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-400 font-medium">
                        {learner.lastActiveAt
                          ? new Date(learner.lastActiveAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
                          : <span className="text-gray-600 italic">No signal</span>}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3 w-40">
                          <div className="flex-1 bg-black/40 rounded-full h-2 overflow-hidden border border-white/10 shadow-inner">
                            <div
                              className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full rounded-full shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                              style={{ width: `${learner.progress || 0}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-bold text-gray-300 w-8">{Math.round(learner.progress || 0)}%</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-lg border ${
                          isActive 
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' 
                            : 'bg-white/5 text-gray-500 border-white/10'
                        }`}>
                          {isActive ? 'Active' : 'Offline'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <input
                          type="date"
                          value={learner.accessExpiry ? learner.accessExpiry.split('T')[0] : ''}
                          onChange={(e) => updateExpiry(lId, e.target.value)}
                          className="px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs font-medium text-gray-300 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all outline-none"
                          style={{ colorScheme: 'dark' }}
                        />
                      </td>
                      <td className="py-4 px-6">
                        <button
                          onClick={() => toggleStatus(lId, isActive ? 'active' : 'inactive')}
                          disabled={updating === lId}
                          className="p-2 rounded-xl hover:bg-white/10 transition-colors disabled:opacity-50 ring-1 ring-transparent hover:ring-white/20"
                          title={isActive ? 'Deactivate' : 'Activate'}
                        >
                          {updating === lId ? (
                             <Loader className="h-5 w-5 text-gray-400 animate-spin" />
                          ) : isActive ? (
                            <ToggleRight className="h-6 w-6 text-cyan-400 shadow-cyan-500/50" />
                          ) : (
                            <ToggleLeft className="h-6 w-6 text-gray-500" />
                          )}
                        </button>
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
  );
}
