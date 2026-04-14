import { useState, useEffect } from 'react';
import api from '../../api/axios';
import {
  Award, AlertCircle, CheckCircle, X, RotateCcw, ExternalLink,
  FileText, Image, Video, Link as LinkIcon, ChevronDown, User
} from 'lucide-react';

const statusConfig = {
  pending: { label: 'Pending Assessment', bg: 'bg-yellow-500/20', text: 'text-yellow-600 dark:text-yellow-400', border: 'border-yellow-500/30' },
  approved: { label: 'Cleared', bg: 'bg-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/30' },
  rejected: { label: 'Rejected', bg: 'bg-red-500/20', text: 'text-red-300', border: 'border-red-500/30' },
  revision: { label: 'Revisions Requested', bg: 'bg-orange-500/20', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-500/30' },
};

const typeIcons = { image: Image, video: Video, pdf: FileText, link: LinkIcon };

export default function ProofReview() {
  const [proofs, setProofs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [expandedProof, setExpandedProof] = useState(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/proofs')
      .then((res) => setProofs(Array.isArray(res.data) ? res.data : res.data.proofs || []))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load portfolios'))
      .finally(() => setLoading(false));
  }, []);

  const handleReview = async (proofId, status) => {
    setSubmitting(true);
    try {
      await api.put(`/proofs/${proofId}/review`, { status, adminNote: note });
      setProofs((prev) =>
        prev.map((p) =>
          (p._id || p.id) === proofId ? { ...p, status, adminNote: note } : p
        )
      );
      setExpandedProof(null);
      setNote('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update portfolio status');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = filter === 'all' ? proofs : proofs.filter((p) => p.status === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative z-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pb-2 border-b border-border">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted border border-border text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mb-3 uppercase tracking-widest shadow-inner">
            Quality Assurance
          </div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-foreground to-muted-foreground tracking-tight">Portfolio Reviews</h1>
          <p className="text-muted-foreground mt-1 font-medium">{proofs.length} total portfolios submitted</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {['all', 'pending', 'approved', 'rejected', 'revision'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
              filter === s
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold shadow-[0_0_15px_rgba(16,185,129,0.4)] border border-emerald-400/50'
                : 'bg-card text-card-foreground border rounded-xl shadow-sm text-muted-foreground border border-border hover:text-foreground font-semibold hover:bg-muted/80 hover:border-border'
            }`}
          >
            {s === 'all' ? 'All Portfolios' : s === 'revision' ? 'Needs Revision' : s}
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
            <Award className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-2xl font-bold text-foreground font-semibold mb-2 tracking-tight">Review queue clear</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            {filter === 'all' ? 'No portfolios have been submitted for review yet.' : `No ${filter} portfolios in the queue.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((proof) => {
            const pId = proof._id || proof.id;
            const status = statusConfig[proof.status] || statusConfig.pending;
            const TypeIcon = typeIcons[proof.type] || FileText;
            const isExpanded = expandedProof === pId;

            return (
              <div key={pId} className="bg-card text-card-foreground border rounded-xl shadow-sm rounded-3xl border border-border overflow-hidden shadow-lg transition-all group">
                <button
                  onClick={() => { setExpandedProof(isExpanded ? null : pId); setNote(proof.adminNote || ''); }}
                  className="w-full flex items-center justify-between p-6 hover:bg-muted transition-colors text-left"
                >
                  <div className="flex items-center gap-5 flex-1 min-w-0">
                    <div className="h-12 w-12 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-border rounded-2xl flex items-center justify-center shrink-0 shadow-inner group-hover:from-emerald-500/30 transition-colors">
                      <TypeIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="text-lg font-bold text-foreground font-semibold truncate tracking-tight">{proof.title}</h3>
                        <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-lg border ${status.bg} ${status.text} ${status.border}`}>
                          {status.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium tracking-wide">
                        <span className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400"></span>
                          {proof.learnerName || proof.userName}
                        </span>
                        <span className="flex items-center gap-2 uppercase">
                          <span className="h-1.5 w-1.5 rounded-full bg-purple-400"></span>
                          {proof.type}
                        </span>
                        <span className="opacity-60">{new Date(proof.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className={`p-2 rounded-xl transition-all duration-300 ${isExpanded ? 'bg-muted/80' : 'group-hover:bg-muted'}`}>
                    <ChevronDown className={`h-6 w-6 text-muted-foreground shrink-0 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-foreground font-semibold' : ''}`} />
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-border bg-muted/20 backdrop-blur-md p-6 sm:p-8 space-y-6">
                    {proof.description && (
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground mb-2 uppercase tracking-widest">Project Synopsis</p>
                        <p className="text-sm text-foreground leading-relaxed font-medium bg-muted p-4 rounded-2xl border border-border">{proof.description}</p>
                      </div>
                    )}

                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground mb-3 uppercase tracking-widest">Asset Preview</p>
                      {proof.type === 'image' && proof.fileUrl && (
                        <img src={proof.fileUrl} alt={proof.title} className="max-w-xl w-full rounded-2xl border border-border shadow-xl" />
                      )}
                      {proof.type === 'pdf' && proof.fileUrl && (
                        <a href={proof.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 px-6 py-3.5 bg-muted hover:bg-muted/80 border border-border rounded-xl text-emerald-600 dark:text-emerald-400 text-sm font-bold uppercase tracking-widest transition-all hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                          <FileText className="h-5 w-5" /> View Project Document <ExternalLink className="h-4 w-4 opacity-50" />
                        </a>
                      )}
                      {proof.type === 'video' && proof.fileUrl && (
                        <video src={proof.fileUrl} controls className="max-w-xl w-full rounded-2xl border border-border shadow-xl" />
                      )}
                      {(proof.type === 'link' || proof.type === 'editable_file_link') && (proof.url || proof.fileUrl) && (
                        <a href={proof.url || proof.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 px-6 py-3.5 bg-muted hover:bg-muted/80 border border-border rounded-xl text-cyan-600 dark:text-cyan-400 text-sm font-bold uppercase tracking-widest transition-all hover:shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                          Explore Asset Link <ExternalLink className="h-4 w-4 opacity-50" />
                        </a>
                      )}
                    </div>

                    <div className="pt-4 border-t border-border">
                      <label className="block text-[10px] font-bold text-muted-foreground mb-2 uppercase tracking-widest">Director Notes</label>
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={3}
                        className="w-full px-5 py-4 bg-muted/50 border border-border rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-sm font-medium text-foreground font-semibold placeholder-muted-foreground/50 resize-none outline-none transition-all shadow-inner"
                        placeholder="Log feedback for the intern (optional)..."
                      />
                    </div>

                    <div className="flex flex-wrap gap-4 pt-2">
                      <button
                        onClick={() => handleReview(pId, 'approved')}
                        disabled={submitting}
                        className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none border border-emerald-400/30"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Clear Asset
                      </button>
                      <button
                        onClick={() => handleReview(pId, 'rejected')}
                        disabled={submitting}
                        className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none border border-red-400/30"
                      >
                        <X className="h-4 w-4" />
                        Reject Asset
                      </button>
                      <button
                        onClick={() => handleReview(pId, 'revision')}
                        disabled={submitting}
                        className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-bold rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none border border-orange-400/30"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Request Revision
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
