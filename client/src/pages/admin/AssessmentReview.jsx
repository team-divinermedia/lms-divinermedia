import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { ClipboardList, AlertCircle, ChevronRight, CheckCircle, User, Send, Mic, FileText } from 'lucide-react';

const statusConfig = {
  submitted: { label: 'Submitted', bg: 'bg-yellow-500/10', text: 'text-yellow-600 dark:text-yellow-400', border: 'border-yellow-500/30' },
  graded:    { label: 'Graded',    bg: 'bg-blue-500/10',   text: 'text-blue-300',   border: 'border-blue-500/30' },
  pass:      { label: 'Pass',      bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/30' },
  needs_improvement: { label: 'Needs Improvement', bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-500/30' },
  reviewed:  { label: 'Reviewed',  bg: 'bg-purple-500/10', text: 'text-primary', border: 'border-purple-500/30' },
};

// Parse answer content into { voiceUrl, text }
const parseAnswer = (answer) => {
  const raw = answer?.content || answer?.answer || '';
  if (answer?.type === 'voice_with_text') {
    try {
      const parsed = JSON.parse(raw);
      return { voiceUrl: parsed.voiceUrl, text: parsed.text };
    } catch { return { voiceUrl: null, text: raw }; }
  }
  if (answer?.type === 'voice' || raw.startsWith('/api/files/') || raw.startsWith('/uploads/')) {
    return { voiceUrl: raw, text: '' };
  }
  return { voiceUrl: null, text: raw };
};

export default function AssessmentReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assessRes, subsRes] = await Promise.all([
          api.get(`/admin/assessments/${id}`),
          api.get(`/admin/assessments/${id}/submissions`),
        ]);
        setAssessment(assessRes.data);
        setSubmissions(Array.isArray(subsRes.data) ? subsRes.data : subsRes.data.submissions || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleReview = async (submissionId, status) => {
    setSubmitting(true);
    try {
      await api.put(`/admin/submissions/${submissionId}/review`, { status, feedback });
      setSubmissions((prev) =>
        prev.map((s) =>
          (s._id || s.id) === submissionId ? { ...s, status, feedback } : s
        )
      );
      setSelectedSubmission(null);
      setFeedback('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-400 border-t-transparent shadow-[0_0_15px_rgba(168,85,247,0.5)]"></div>
      </div>
    );
  }

  if (error && !assessment) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center bg-card text-card-foreground border rounded-xl shadow-sm p-8 rounded-3xl border border-border">
          <AlertCircle className="h-12 w-12 text-pink-500 mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative z-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground pb-2 border-b border-border">
        <button onClick={() => navigate('/admin/courses')} className="hover:text-purple-400 transition-colors font-medium">
          Courses
        </button>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-semibold font-bold">Review: {assessment?.title}</span>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-300 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          {error}
        </div>
      )}

      {submissions.length === 0 ? (
        <div className="bg-card text-card-foreground border rounded-xl shadow-sm rounded-3xl border border-border p-12 text-center">
          <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-bold text-foreground font-semibold mb-1">No submissions yet</h3>
          <p className="text-muted-foreground text-sm">No learners have submitted this assessment</p>
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map((sub) => {
            const sId = sub._id || sub.id;
            const status = statusConfig[sub.status] || statusConfig.submitted;
            const isSelected = selectedSubmission === sId;

            return (
              <div key={sId} className="bg-card text-card-foreground border rounded-xl shadow-sm rounded-2xl border border-border overflow-hidden">
                {/* Submission header */}
                <button
                  onClick={() => {
                    setSelectedSubmission(isSelected ? null : sId);
                    setFeedback(sub.feedback || '');
                  }}
                  className="w-full flex items-center justify-between p-5 hover:bg-muted transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-purple-500/20 border border-purple-500/30 rounded-full flex items-center justify-center shrink-0">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground font-semibold">{sub.user?.name || sub.learnerName || sub.userName || 'Learner'}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {sub.user?.email && <span className="mr-2">{sub.user.email}</span>}
                        Submitted {new Date(sub.submittedAt || sub.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-lg border ${status.bg} ${status.text} ${status.border}`}>
                    {status.label}
                  </span>
                </button>

                {/* Expanded answers + review */}
                {isSelected && (
                  <div className="border-t border-border p-5 space-y-5">
                    {/* Answers */}
                    <div className="space-y-4">
                      {sub.answers?.map((answer, idx) => {
                        const question = assessment?.questions?.[idx];
                        const { voiceUrl, text } = parseAnswer(answer);
                        const isVoice = !!voiceUrl;
                        const hasText = !!text;

                        return (
                          <div key={idx} className="p-4 bg-muted/50 rounded-2xl border border-border space-y-3">
                            {/* Question */}
                            <p className="text-sm font-semibold text-muted-foreground">
                              <span className="text-purple-400 mr-2">Q{idx + 1}.</span>
                              {question?.content || answer.question?.content || 'Question'}
                            </p>

                            {/* Voice answer */}
                            {isVoice && (
                              <div className="flex items-center gap-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                                <div className="h-8 w-8 bg-purple-500/20 rounded-lg flex items-center justify-center shrink-0">
                                  <Mic className="h-4 w-4 text-purple-400" />
                                </div>
                                <audio
                                  src={voiceUrl}
                                  controls
                                  className="flex-1 h-9 min-w-0"
                                  style={{ colorScheme: 'dark' }}
                                />
                              </div>
                            )}

                            {/* Text / additional answer */}
                            {hasText && (
                              <div className="flex items-start gap-2 p-3 bg-muted border border-border rounded-xl">
                                <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
                              </div>
                            )}

                            {!isVoice && !hasText && (
                              <p className="text-xs text-muted-foreground italic">No answer provided</p>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Feedback */}
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
                        Feedback for learner
                      </label>
                      <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-sm resize-none text-muted-foreground placeholder-muted-foreground/50 transition-all outline-none"
                        placeholder="Add feedback for the learner..."
                      />
                    </div>

                    {/* Review actions */}
                    <div className="flex gap-3 flex-wrap">
                      <button
                        onClick={() => handleReview(sId, 'pass')}
                        disabled={submitting}
                        className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm font-bold transition-colors disabled:opacity-50 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Pass
                      </button>
                      <button
                        onClick={() => handleReview(sId, 'needs_improvement')}
                        disabled={submitting}
                        className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-400 text-white font-bold rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                      >
                        Needs Improvement
                      </button>
                      <button
                        onClick={() => handleReview(sId, 'reviewed')}
                        disabled={submitting}
                        className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                      >
                        <Send className="h-4 w-4" />
                        Mark Reviewed
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
