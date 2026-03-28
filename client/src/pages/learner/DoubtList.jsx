import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { MessageSquare, Plus, AlertCircle, ChevronRight } from 'lucide-react';

const statusConfig = {
  open: { label: 'Open', bg: 'bg-yellow-500/10', text: 'text-yellow-300', border: 'border-yellow-500/30' },
  in_review: { label: 'In Review', bg: 'bg-blue-500/10', text: 'text-blue-300', border: 'border-blue-500/30' },
  resolved: { label: 'Resolved', bg: 'bg-emerald-500/10', text: 'text-emerald-300', border: 'border-emerald-500/30' },
};

export default function DoubtList() {
  const [doubts, setDoubts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedDoubt, setSelectedDoubt] = useState(null);

  useEffect(() => {
    api.get('/doubts')
      .then((res) => setDoubts(Array.isArray(res.data) ? res.data : res.data.doubts || []))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load doubts'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? doubts : doubts.filter((d) => d.status === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-400 border-t-transparent shadow-[0_0_15px_rgba(168,85,247,0.5)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">My Doubts</h1>
          <p className="text-gray-400 mt-1 font-medium">{doubts.length} doubt{doubts.length !== 1 ? 's' : ''} raised</p>
        </div>
        <Link
          to="/doubts/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl text-sm font-bold tracking-wide transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:shadow-[0_0_25px_rgba(168,85,247,0.5)]"
        >
          <Plus className="h-4 w-4" />
          Raise New Doubt
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'open', 'in_review', 'resolved'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
              filter === s
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
            }`}
          >
            {s === 'all' ? 'All' : s === 'in_review' ? 'In Review' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-300 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          {error}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="glass-panel rounded-3xl border border-white/10 p-12 text-center">
          <MessageSquare className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-1">No doubts found</h3>
          <p className="text-gray-500 text-sm">
            {filter === 'all' ? 'You have not raised any doubts yet' : `No ${filter.replace('_', ' ')} doubts`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((doubt) => {
            const dId = doubt._id || doubt.id;
            const status = statusConfig[doubt.status] || statusConfig.open;
            const isSelected = selectedDoubt === dId;

            return (
              <div key={dId} className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
                <button
                  onClick={() => setSelectedDoubt(isSelected ? null : dId)}
                  className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-white truncate">{doubt.title}</h3>
                      <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-lg border shrink-0 ${status.bg} ${status.text} ${status.border}`}>
                        {status.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">{doubt.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-600 font-medium">
                      {doubt.lessonTitle && <span>{doubt.lessonTitle}</span>}
                      <span>{new Date(doubt.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <ChevronRight className={`h-5 w-5 text-gray-500 shrink-0 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                </button>

                {isSelected && (
                  <div className="border-t border-white/5 p-5 bg-black/20">
                    <div className="mb-4">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Description</p>
                      <p className="text-sm text-gray-300 leading-relaxed">{doubt.description}</p>
                    </div>
                    {doubt.screenshot && (
                      <div className="mb-4">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Screenshot</p>
                        <img src={doubt.screenshot} alt="Screenshot" className="max-w-sm rounded-xl border border-white/10" />
                      </div>
                    )}
                    {doubt.reply ? (
                      <div className="p-4 bg-purple-500/10 rounded-2xl border border-purple-500/20">
                        <p className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-1">Admin Reply</p>
                        <p className="text-sm text-gray-300 leading-relaxed">{doubt.reply}</p>
                        {doubt.repliedAt && (
                          <p className="text-xs text-gray-600 mt-2">
                            Replied on {new Date(doubt.repliedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600 italic">No reply yet</p>
                    )}
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
