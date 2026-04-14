import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { MessageSquare, Plus, AlertCircle, ChevronRight } from 'lucide-react';

const statusConfig = {
  open: { label: 'Open', bg: 'bg-yellow-500/10', text: 'text-yellow-600 dark:text-yellow-400', border: 'border-yellow-500/30' },
  in_review: { label: 'In Review', bg: 'bg-blue-500/10', text: 'text-blue-300', border: 'border-blue-500/30' },
  resolved: { label: 'Resolved', bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/30' },
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground font-semibold tracking-tight">My Doubts</h1>
          <p className="text-muted-foreground mt-1 font-medium">{doubts.length} doubt{doubts.length !== 1 ? 's' : ''} raised</p>
        </div>
        <Link
          to="/doubts/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl text-sm font-bold tracking-wide transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:shadow-[0_0_25px_rgba(168,85,247,0.5)]"
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
                ? 'bg-purple-500/20 text-primary border-purple-500/40'
                : 'bg-muted text-muted-foreground border-border hover:bg-muted/80 hover:text-foreground font-semibold'
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
        <div className="bg-card text-card-foreground border rounded-xl shadow-sm rounded-3xl border border-border p-12 text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-bold text-foreground font-semibold mb-1">No doubts found</h3>
          <p className="text-muted-foreground text-sm">
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
              <div key={dId} className="bg-card text-card-foreground border rounded-xl shadow-sm rounded-2xl border border-border overflow-hidden">
                <button
                  onClick={() => setSelectedDoubt(isSelected ? null : dId)}
                  className="w-full flex items-center justify-between p-5 hover:bg-muted transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-foreground font-semibold truncate">{doubt.title}</h3>
                      <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-lg border shrink-0 ${status.bg} ${status.text} ${status.border}`}>
                        {status.label}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{doubt.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground font-medium">
                      {doubt.lessonTitle && <span>{doubt.lessonTitle}</span>}
                      <span>{new Date(doubt.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <ChevronRight className={`h-5 w-5 text-muted-foreground shrink-0 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                </button>

                {isSelected && (
                  <div className="border-t border-border p-5 bg-muted/20">
                    <div className="mb-4">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Description</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{doubt.description}</p>
                    </div>
                    {doubt.screenshot && (
                      <div className="mb-4">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Screenshot</p>
                        <img src={doubt.screenshot} alt="Screenshot" className="max-w-sm rounded-xl border border-border" />
                      </div>
                    )}
                    {doubt.reply ? (
                      <div className="p-4 bg-purple-500/10 rounded-2xl border border-purple-500/20">
                        <p className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-1">Admin Reply</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">{doubt.reply}</p>
                        {doubt.repliedAt && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Replied on {new Date(doubt.repliedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No reply yet</p>
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
