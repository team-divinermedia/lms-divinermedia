import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import { Clock, AlertCircle, CheckCircle, Send, Award, Mic, FileText } from 'lucide-react';
import VoiceRecorder from '../../components/VoiceRecorder';

export default function AssessmentPage() {
  const { id } = useParams();
  const [assessment, setAssessment] = useState(null);
  const [answers, setAnswers] = useState({});   // text summaries keyed by questionId
  const [files, setFiles] = useState({});        // voice files keyed by questionId
  const [showVoice, setShowVoice] = useState({});
  const [showSummary, setShowSummary] = useState({});
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        const res = await api.get(`/assessments/detail/${id}`);
        const assessmentData = res.data.assessment || res.data;
        if (assessmentData.questions) {
          assessmentData.questions = assessmentData.questions.map((q) => ({
            ...q,
            options: typeof q.options === 'string'
              ? (() => { try { return JSON.parse(q.options); } catch { return []; } })()
              : (q.options || []),
          }));
        }
        setAssessment(assessmentData);

        const subRes = await api.get(`/assessments/${id}/submissions`).catch(() => ({ data: null }));
        const subs = subRes.data?.submissions || [];
        if (subs.length > 0) {
          setSubmission(subs[0]);
        } else if (assessmentData.timeLimit) {
          setTimeLeft(assessmentData.timeLimit * 60);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load assessment');
      } finally {
        setLoading(false);
      }
    };
    fetchAssessment();
  }, [id]);

  useEffect(() => {
    if (timeLeft !== null && timeLeft > 0 && !submission) {
      const interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      timerRef.current = interval;
      return () => clearInterval(interval);
    }
  }, [submission]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleFileChange = (questionId, file) => {
    setFiles((prev) => ({ ...prev, [questionId]: file }));
  };

  const toggleVoice = (qId) => setShowVoice((prev) => ({ ...prev, [qId]: !prev[qId] }));
  const toggleSummary = (qId) => setShowSummary((prev) => ({ ...prev, [qId]: !prev[qId] }));

  const countWords = (text) => (text || '').trim().split(/\s+/).filter(Boolean).length;

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');

    // Validate: every question must have a voice note
    const missing = assessment.questions.filter((q) => {
      const qId = q._id || q.id;
      return !files[qId];
    });
    if (missing.length > 0) {
      const nums = missing.map((q) => assessment.questions.indexOf(q) + 1).join(', ');
      setError(`Please record a voice answer for question${missing.length > 1 ? 's' : ''}: ${nums}`);
      // Expand voice recorder for all unanswered questions
      const toOpen = {};
      missing.forEach((q) => { toOpen[q._id || q.id] = true; });
      setShowVoice((prev) => ({ ...prev, ...toOpen }));
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      const answerData = assessment.questions.map((q) => {
        const qId = q._id || q.id;
        return { questionId: qId, answer: answers[qId] || '' };
      });
      formData.append('answers', JSON.stringify(answerData));

      Object.entries(files).forEach(([qId, file]) => {
        if (file) formData.append(`file_${qId}`, file);
      });

      const res = await api.post(`/assessments/${id}/submit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSubmission(res.data?.submission || res.data);
      if (timerRef.current) clearInterval(timerRef.current);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit assessment');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
        <div className="text-center glass-panel p-8 rounded-3xl border border-white/10">
          <AlertCircle className="h-12 w-12 text-pink-500 mx-auto mb-4 drop-shadow-[0_0_10px_rgba(236,72,153,0.5)]" />
          <p className="text-gray-400 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (submission) {
    const isPass = submission.status === 'pass';
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="glass-panel rounded-3xl border border-white/10 p-8 text-center">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${
            isPass ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-purple-500/20 border border-purple-500/30'
          }`}>
            {isPass ? <Award className="h-8 w-8 text-emerald-400" /> : <CheckCircle className="h-8 w-8 text-purple-400" />}
          </div>
          <h1 className="text-2xl font-bold text-white">Assessment Submitted</h1>
          <p className="text-gray-400 mt-2">{assessment.title}</p>
          <span className={`inline-block mt-3 px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-lg border capitalize ${
            isPass
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              : 'bg-purple-500/10 text-purple-300 border-purple-500/30'
          }`}>
            {submission.status?.replace('_', ' ') || 'Submitted'}
          </span>
          {submission.score !== null && submission.score !== undefined && submission.status === 'graded' && (
            <p className="text-4xl font-black text-white mt-4 drop-shadow-md">{submission.score}%</p>
          )}
          {submission.feedback && (
            <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-2xl text-left">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Feedback</p>
              <p className="text-sm text-gray-300 leading-relaxed">{submission.feedback}</p>
            </div>
          )}
        </div>

        {submission.answers && submission.answers.length > 0 && (
          <div className="glass-panel rounded-3xl border border-white/10 p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">Your Answers</h2>
            {assessment.questions.map((q, idx) => {
              const qId = q._id || q.id;
              const submittedAnswer = submission.answers.find((a) => a.questionId === qId);
              return (
                <div key={qId || idx} className="p-4 bg-black/30 rounded-2xl border border-white/5">
                  <p className="text-sm font-semibold text-gray-300 mb-2">
                    <span className="text-purple-400 mr-2">Q{idx + 1}.</span>
                    {q.content || q.question}
                  </p>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {submittedAnswer?.content || submittedAnswer?.answer || 'No written answer provided'}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-center">
          <Link to="/courses" className="text-purple-400 hover:text-purple-300 font-medium text-sm transition-colors">
            Back to courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">{assessment.title}</h1>
          <p className="text-gray-400 text-sm mt-1">{assessment.questions?.length || 0} questions</p>
        </div>
        {timeLeft !== null && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-lg font-bold border ${
            timeLeft < 60
              ? 'bg-red-500/10 text-red-300 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
              : 'bg-purple-500/10 text-purple-300 border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
          }`}>
            <Clock className="h-5 w-5" />
            {formatTime(timeLeft)}
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-300 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {assessment.questions?.map((q, idx) => {
          const qId = q._id || q.id;
          const wordCount = countWords(answers[qId]);
          const hasVoice = !!files[qId];
          const hasSummary = (answers[qId] || '').trim().length > 0;

          return (
            <div key={qId || idx} className={`glass-panel rounded-2xl border p-6 space-y-4 transition-colors ${
              !hasVoice ? 'border-white/10' : 'border-emerald-500/30'
            }`}>
              {/* Question */}
              <div className="flex items-start justify-between gap-3">
              <p className="text-base font-semibold text-gray-100 leading-relaxed flex-1">
                <span className="text-purple-400 font-bold mr-2">Q{idx + 1}.</span>
                {q.content || q.question}
              </p>
              {hasVoice ? (
                <span className="shrink-0 text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Recorded
                </span>
              ) : (
                <span className="shrink-0 text-xs font-bold text-gray-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-600"></span> Required
                </span>
              )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3">
                {/* Primary: Voice Note — prominent */}
                <button
                  type="button"
                  onClick={() => toggleVoice(qId)}
                  className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-bold border transition-all ${
                    showVoice[qId]
                      ? 'bg-purple-500/30 text-purple-200 border-purple-400/50 shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                      : 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-purple-300 border-purple-500/30 hover:from-purple-600/30 hover:to-pink-600/30 hover:border-purple-400/50 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                  }`}
                >
                  <Mic className={`h-4 w-4 ${showVoice[qId] ? 'text-purple-300' : 'text-purple-400'}`} />
                  Record Voice Answer
                  {hasVoice && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]"></span>
                  )}
                </button>

                {/* Secondary: Summary — icon only */}
                <button
                  type="button"
                  onClick={() => toggleSummary(qId)}
                  title="Add written summary (50 words)"
                  className={`p-2.5 rounded-xl border transition-all ${
                    showSummary[qId]
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      : 'bg-white/5 text-gray-500 border-white/10 hover:bg-white/10 hover:text-gray-300'
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  {hasSummary && (
                    <span className="sr-only">Summary added</span>
                  )}
                </button>
                {hasSummary && (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.8)] -ml-2 mt-[-1.2rem] self-start"></span>
                )}
              </div>

              {/* Voice Recorder */}
              {showVoice[qId] && (
                <div className="pt-1">
                  <VoiceRecorder
                    onRecordingComplete={(file) => handleFileChange(qId, file)}
                    onClear={() => handleFileChange(qId, null)}
                  />
                </div>
              )}

              {/* Summary textarea */}
              {showSummary[qId] && (
                <div className="pt-1">
                  <textarea
                    value={answers[qId] || ''}
                    onChange={(e) => handleAnswerChange(qId, e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 text-sm resize-none text-gray-300 placeholder-gray-600 transition-all outline-none"
                    placeholder="Additional answer..."
                  />
                  <div className="flex justify-end mt-1.5">
                    <span className={`text-xs font-medium ${
                      wordCount > 50 ? 'text-red-400' : wordCount > 40 ? 'text-yellow-400' : 'text-gray-500'
                    }`}>
                      {wordCount} / 50 words
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-medium text-sm transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:shadow-[0_0_25px_rgba(168,85,247,0.5)]"
          >
            <Send className="h-4 w-4" />
            {submitting ? 'Submitting...' : 'Submit Assessment'}
          </button>
        </div>
      </form>
    </div>
  );
}
