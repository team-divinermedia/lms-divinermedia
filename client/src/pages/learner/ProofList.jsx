import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { Award, Plus, AlertCircle, ExternalLink, FileText, Image, Video, Link as LinkIcon } from 'lucide-react';

const statusConfig = {
  pending: { label: 'Pending', bg: 'bg-yellow-500/10', text: 'text-yellow-600 dark:text-yellow-400', border: 'border-yellow-500/30' },
  approved: { label: 'Approved', bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/30' },
  rejected: { label: 'Rejected', bg: 'bg-red-500/10', text: 'text-red-300', border: 'border-red-500/30' },
  revision: { label: 'Needs Revision', bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-500/30' },
};

const typeIcons = {
  image: Image,
  video: Video,
  pdf: FileText,
  link: LinkIcon,
};

export default function ProofList() {
  const [proofs, setProofs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/proofs')
      .then((res) => setProofs(Array.isArray(res.data) ? res.data : res.data.proofs || []))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load proofs'))
      .finally(() => setLoading(false));
  }, []);

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
          <h1 className="text-2xl font-extrabold text-foreground font-semibold tracking-tight">My Portfolio</h1>
          <p className="text-muted-foreground mt-1 font-medium">{proofs.length} proof{proofs.length !== 1 ? 's' : ''} of work</p>
        </div>
        <Link
          to="/proofs/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl text-sm font-bold tracking-wide transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:shadow-[0_0_25px_rgba(168,85,247,0.5)]"
        >
          <Plus className="h-4 w-4" />
          Upload Your Work
        </Link>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-300 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          {error}
        </div>
      )}

      {proofs.length === 0 ? (
        <div className="bg-card text-card-foreground border rounded-xl shadow-sm rounded-3xl border border-border p-12 text-center">
          <div className="w-16 h-16 bg-muted rounded-3xl flex items-center justify-center mx-auto mb-4 ring-1 ring-white/10">
            <Award className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold text-foreground font-semibold mb-1">No proofs yet</h3>
          <p className="text-muted-foreground text-sm mb-4">Upload your work to build your portfolio</p>
          <Link
            to="/proofs/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)]"
          >
            <Plus className="h-4 w-4" />
            Upload Your Work
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {proofs.map((proof) => {
            const pId = proof._id || proof.id;
            const status = statusConfig[proof.status] || statusConfig.pending;
            const TypeIcon = typeIcons[proof.type] || FileText;

            return (
              <div key={pId} className="bg-card text-card-foreground border rounded-xl shadow-sm rounded-2xl border border-border overflow-hidden hover:border-border hover:-translate-y-1 transition-all shadow-lg group">
                {proof.type === 'image' && proof.fileUrl ? (
                  <img src={proof.fileUrl} alt={proof.title} className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 bg-gradient-to-br from-purple-900/40 to-pink-900/20 flex items-center justify-center">
                    <TypeIcon className="h-12 w-12 text-purple-500/40" />
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-lg border ${status.bg} ${status.text} ${status.border}`}>
                      {status.label}
                    </span>
                    <span className="text-xs text-muted-foreground capitalize font-medium">{proof.type}</span>
                  </div>
                  <h3 className="font-bold text-foreground font-semibold">{proof.title}</h3>
                  {proof.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{proof.description}</p>
                  )}
                  {proof.lessonTitle && (
                    <p className="text-xs text-muted-foreground mt-2 font-medium">Lesson: {proof.lessonTitle}</p>
                  )}
                  {proof.adminNote && (
                    <div className="mt-3 p-2.5 bg-muted/50 rounded-xl border border-border">
                      <p className="text-xs text-muted-foreground leading-relaxed">{proof.adminNote}</p>
                    </div>
                  )}
                  {(proof.fileUrl || proof.url) && (
                    <a
                      href={proof.fileUrl || proof.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-purple-400 hover:text-primary mt-3 font-medium transition-colors"
                    >
                      View <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
