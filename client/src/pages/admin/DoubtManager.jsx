import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { MessageSquare, AlertCircle, Send, ChevronDown } from 'lucide-react';

const statusConfig = {
  open: { label: 'Open', bg: 'bg-orange-500/20', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-500/30' },
  answered: { label: 'Answered', bg: 'bg-cyan-500/20', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-500/30' },
  resolved: { label: 'Resolved', bg: 'bg-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/30' },
  closed: { label: 'Closed', bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border' },
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pb-2 border-b border-border">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted border border-border text-[10px] font-bold text-cyan-600 dark:text-cyan-400 mb-3 uppercase tracking-widest shadow-inner">
            Support Pipeline
          </div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-foreground to-muted-foreground tracking-tight">Manage Doubts</h1>
          <p className="text-muted-foreground mt-1 font-medium">{doubts.length} queries logged</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {['all', 'open', 'answered', 'resolved', 'closed'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
              filter === s
                ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold shadow-[0_0_15px_rgba(249,115,22,0.4)] border border-orange-400/50'
                : 'bg-card text-card-foreground border rounded-xl shadow-sm text-muted-foreground border border-border hover:text-foreground font-semibold hover:bg-muted/80 hover:border-border'
            }`}
          >
            {s === 'all' ? 'All Threads' : s}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-destructive text-sm backdrop-blur-md shadow-inner">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
          {error}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-card text-card-foreground border rounded-xl shadow-sm rounded-[2.5rem] border border-border p-16 text-center">
          <div className="w-20 h-20 bg-muted rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner ring-1 ring-white/10">
            <MessageSquare className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-2xl font-bold text-foreground font-semibold mb-2 tracking-tight">Support queue clear</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
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
              <div key={dId} className="bg-card text-card-foreground border rounded-xl shadow-sm rounded-3xl border border-border overflow-hidden shadow-lg transition-all">
                <button
                  onClick={() => {
                    setExpandedDoubt(isExpanded ? null : dId);
                    setReply(doubt.adminReply || '');
                    setNewStatus(doubt.status || 'open');
                  }}
                  className="w-full flex items-center justify-between p-6 hover:bg-muted transition-colors text-left group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="text-lg font-bold text-foreground font-semibold truncate tracking-tight">{doubt.title}</h3>
                      <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-lg border ${status.bg} ${status.text} ${status.border}`}>
                        {status.label}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate mb-3 font-medium">{doubt.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium tracking-wide">
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
                  <div className={`p-2 rounded-xl transition-all duration-300 ${isExpanded ? 'bg-muted/80' : 'group-hover:bg-muted'}`}>
                    <ChevronDown className={`h-6 w-6 text-muted-foreground shrink-0 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-foreground font-semibold' : ''}`} />
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-border bg-muted/20 backdrop-blur-md p-6 sm:p-8 space-y-6">
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground mb-2 uppercase tracking-widest">Original Query Log</p>
                      <p className="text-sm text-foreground leading-relaxed font-medium bg-muted p-4 rounded-2xl border border-border">{doubt.description}</p>
                    </div>

                    {doubt.screenshot && (
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground mb-2 uppercase tracking-widest">Visual Intel (Screenshot)</p>
                        <img src={doubt.screenshot} alt="Context" className="max-w-md w-full rounded-2xl border border-border shadow-xl" />
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 pt-4 border-t border-border">
                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-bold text-muted-foreground mb-2 uppercase tracking-widest">Override Status</label>
                        <select
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value)}
                          className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-sm font-bold text-foreground font-semibold focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all shadow-inner"
                        >
                          <option value="open">Open</option>
                          <option value="answered">Answered</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>

                      <div className="sm:col-span-9">
                        <label className="block text-[10px] font-bold text-muted-foreground mb-2 uppercase tracking-widest">Transmission Response</label>
                        <textarea
                          value={reply}
                          onChange={(e) => setReply(e.target.value)}
                          rows={4}
                          className="w-full px-5 py-4 bg-muted/50 border border-border rounded-xl focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 text-sm font-medium text-foreground font-semibold placeholder-muted-foreground/50 resize-none outline-none transition-all shadow-inner"
                          placeholder="Draft reply to intern..."
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => handleReply(dId)}
                        disabled={submitting}
                        className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-400 hover:to-pink-400 text-white font-bold rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:shadow-[0_0_25px_rgba(249,115,22,0.5)] hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none border border-orange-400/30"
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
