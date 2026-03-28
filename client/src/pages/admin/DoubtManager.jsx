import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { MessageSquare, AlertCircle, Send, ChevronDown } from 'lucide-react';

const statusConfig = {
  open: { label: 'Open', bg: 'bg-orange-500/20', text: 'text-orange-300', border: 'border-orange-500/30' },
  answered: { label: 'Answered', bg: 'bg-cyan-500/20', text: 'text-cyan-300', border: 'border-cyan-500/30' },
  resolved: { label: 'Resolved', bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/30' },
  closed: { label: 'Closed', bg: 'bg-white/5', text: 'text-gray-400', border: 'border-white/10' },
};

export default function DoubtManager() {
  const [doubts, setDoubts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [expandedDoubt, setExpandedDoubt] = useState(null);
  const [reply, setReply] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDoubts();
  }, []);

  const fetchDoubts = async () => {
    try {
      const res = await api.get('/doubts');
      setDoubts(Array.isArray(res.data) ? res.data : res.data.doubts || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load doubts');
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (doubtId) => {
    if (!reply.trim() && !newStatus) return;
    setSubmitting(true);
    try {
      if (reply.trim()) {
        await api.put(`/doubts/${doubtId}/reply`, { adminReply: reply.trim() });
      }
      if (newStatus) {
        await api.put(`/doubts/${doubtId}/status`, { status: newStatus });
      }
      setDoubts((prev) =>
        prev.map((d) =>
          (d._id || d.id) === doubtId
            ? { ...d, adminReply: reply.trim() || d.adminReply, status: newStatus || d.status }
            : d
        )
      );
      setExpandedDoubt(null);
      setReply('');
      setNewStatus('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update doubt');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = filter === 'all' ? doubts : doubts.filter((d) => d.status === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent shadow-[0_0_15px_rgba(249,115,22,0.5)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative z-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pb-2 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-orange-300 mb-3 uppercase tracking-widest shadow-inner">
            Support Pipeline
          </div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-tight">Manage Doubts</h1>
          <p className="text-gray-400 mt-1 font-medium">{doubts.length} queries logged</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {['all', 'open', 'answered', 'resolved', 'closed'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
              filter === s
                ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)] border border-orange-400/50'
                : 'glass-panel text-gray-400 border border-white/10 hover:text-white hover:bg-white/10 hover:border-white/20'
            }`}
          >
            {s === 'all' ? 'All Threads' : s}
          </button>
        ))}
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
            <MessageSquare className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Support queue clear</h3>
          <p className="text-gray-400 text-sm max-w-sm mx-auto">
            {filter === 'all' ? 'No incoming queries detected.' : `No ${filter.replace('_', ' ')} queries at this time.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((doubt) => {
            const dId = doubt._id || doubt.id;
            const status = statusConfig[doubt.status] || statusConfig.open;
            const isExpanded = expandedDoubt === dId;

            return (
              <div key={dId} className="glass-panel rounded-3xl border border-white/10 overflow-hidden shadow-lg transition-all">
                <button
                  onClick={() => {
                    setExpandedDoubt(isExpanded ? null : dId);
                    setReply(doubt.adminReply || '');
                    setNewStatus(doubt.status || 'open');
                  }}
                  className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors text-left group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="text-lg font-bold text-white truncate tracking-tight">{doubt.title}</h3>
                      <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-lg border ${status.bg} ${status.text} ${status.border}`}>
                        {status.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 truncate mb-3 font-medium">{doubt.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-400 font-medium tracking-wide">
                      <span className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400"></span>
                        {doubt.learnerName || doubt.userName}
                      </span>
                      {doubt.lessonTitle && (
                        <span className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-pink-400"></span>
                          <span className="truncate max-w-[200px]">{doubt.lessonTitle}</span>
                        </span>
                      )}
                      <span className="opacity-60">{new Date(doubt.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className={`p-2 rounded-xl transition-all duration-300 ${isExpanded ? 'bg-white/10' : 'group-hover:bg-white/5'}`}>
                    <ChevronDown className={`h-6 w-6 text-gray-400 shrink-0 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-white' : ''}`} />
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-white/10 bg-black/20 backdrop-blur-md p-6 sm:p-8 space-y-6">
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-widest">Original Query Log</p>
                      <p className="text-sm text-gray-200 leading-relaxed font-medium bg-white/5 p-4 rounded-2xl border border-white/5">{doubt.description}</p>
                    </div>

                    {doubt.screenshot && (
                      <div>
                        <p className="text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-widest">Visual Intel (Screenshot)</p>
                        <img src={doubt.screenshot} alt="Context" className="max-w-md w-full rounded-2xl border border-white/10 shadow-xl" />
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 pt-4 border-t border-white/5">
                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-widest">Override Status</label>
                        <select
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value)}
                          className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm font-bold text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all shadow-inner"
                        >
                          <option value="open">Open</option>
                          <option value="answered">Answered</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>

                      <div className="sm:col-span-9">
                        <label className="block text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-widest">Transmission Response</label>
                        <textarea
                          value={reply}
                          onChange={(e) => setReply(e.target.value)}
                          rows={4}
                          className="w-full px-5 py-4 bg-black/40 border border-white/10 rounded-xl focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 text-sm font-medium text-white placeholder-gray-600 resize-none outline-none transition-all shadow-inner"
                          placeholder="Draft reply to intern..."
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => handleReply(dId)}
                        disabled={submitting}
                        className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-400 hover:to-pink-400 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:shadow-[0_0_25px_rgba(249,115,22,0.5)] hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none border border-orange-400/30"
                      >
                        <Send className="h-4 w-4" />
                        {submitting ? 'Transmitting...' : 'Transmit Override'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
