import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import { MessageSquare, AlertCircle, Upload, ChevronRight, Mic } from 'lucide-react';
import VoiceRecorder from '../../components/VoiceRecorder';

export default function DoubtForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedLessonId = searchParams.get('lessonId');

  const [courses, setCourses] = useState([]);
  const [modules, setModules] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  const [selectedLesson, setSelectedLesson] = useState(preselectedLessonId || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [attachmentType, setAttachmentType] = useState('screenshot');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/courses')
      .then((res) => setCourses(res.data.courses || res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      api.get(`/modules/${selectedCourse}`)
        .then((res) => {
          const mods = Array.isArray(res.data) ? res.data : res.data.modules || [];
          setModules(mods);
          setSelectedModule('');
          setLessons([]);
          if (!preselectedLessonId) setSelectedLesson('');
        })
        .catch(() => setModules([]));
    } else {
      setModules([]);
      setLessons([]);
    }
  }, [selectedCourse]);

  useEffect(() => {
    if (selectedModule) {
      api.get(`/lessons/${selectedModule}`)
        .then((res) => setLessons(Array.isArray(res.data) ? res.data : res.data.lessons || []))
        .catch(() => setLessons([]));

      if (!preselectedLessonId) setSelectedLesson('');
    } else {
      setLessons([]);
    }
  }, [selectedModule, modules]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      if (selectedLesson) formData.append('lessonId', selectedLesson);
      if (selectedCourse) formData.append('courseId', selectedCourse);
      if (selectedModule) formData.append('moduleId', selectedModule);
      if (screenshot) formData.append('screenshot', screenshot);

      await api.post('/doubts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      navigate('/doubts');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit doubt');
    } finally {
      setSubmitting(false);
    }
  };

  const selectClass = "w-full px-3 py-2.5 bg-muted/50 border border-border rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-sm text-muted-foreground transition-all outline-none disabled:opacity-40";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-400 border-t-transparent shadow-[0_0_15px_rgba(168,85,247,0.5)]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button onClick={() => navigate('/doubts')} className="hover:text-purple-400 transition-colors">Doubts</button>
        <ChevronRight className="h-3 w-3" />
        <span className="text-muted-foreground font-medium">Raise a Doubt</span>
      </div>

      <div className="bg-card text-card-foreground border rounded-xl shadow-sm rounded-3xl border border-border p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 bg-purple-500/20 border border-purple-500/30 rounded-xl flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground font-semibold">Raise a Doubt</h1>
            <p className="text-muted-foreground text-sm">Describe your question and we will help you out</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-300 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Course</label>
              <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} className={selectClass}>
                <option value="">Select course</option>
                {courses.map((c) => (
                  <option key={c._id || c.id} value={c._id || c.id}>{c.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Module</label>
              <select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                disabled={!selectedCourse}
                className={selectClass}
              >
                <option value="">Select module</option>
                {modules.map((m) => (
                  <option key={m._id || m.id} value={m._id || m.id}>{m.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Lesson</label>
              <select
                value={selectedLesson}
                onChange={(e) => setSelectedLesson(e.target.value)}
                disabled={!selectedModule}
                className={selectClass}
              >
                <option value="">Select lesson</option>
                {lessons.map((l) => (
                  <option key={l._id || l.id} value={l._id || l.id}>{l.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-sm text-muted-foreground placeholder-muted-foreground/50 transition-all outline-none"
              placeholder="Brief summary of your doubt"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={5}
              className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-sm resize-none text-muted-foreground placeholder-muted-foreground/50 transition-all outline-none"
              placeholder="Describe your doubt in detail..."
            />
          </div>

          <div>
            <div className="flex items-center gap-4 mb-3">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Attachment (optional)</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setAttachmentType('screenshot'); setScreenshot(null); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    attachmentType === 'screenshot'
                      ? 'bg-purple-500/20 text-primary border-purple-500/40'
                      : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
                  }`}
                >
                  <Upload className="h-3 w-3 inline mr-1" /> Image
                </button>
                <button
                  type="button"
                  onClick={() => { setAttachmentType('voice'); setScreenshot(null); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    attachmentType === 'voice'
                      ? 'bg-purple-500/20 text-primary border-purple-500/40'
                      : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
                  }`}
                >
                  <Mic className="h-3 w-3 inline mr-1" /> Voice Note
                </button>
              </div>
            </div>

            {attachmentType === 'screenshot' ? (
              <label className="flex items-center gap-3 px-4 py-3 bg-muted/50 hover:bg-muted border border-dashed border-border hover:border-purple-500/40 rounded-xl cursor-pointer transition-colors w-full sm:w-auto">
                <Upload className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{screenshot ? screenshot.name : 'Choose image file'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setScreenshot(e.target.files[0])}
                  className="hidden"
                />
              </label>
            ) : (
              <VoiceRecorder
                onRecordingComplete={(file) => setScreenshot(file)}
                onClear={() => setScreenshot(null)}
              />
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/doubts')}
              className="px-4 py-2.5 text-sm font-medium text-muted-foreground bg-muted border border-border hover:bg-muted/80 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl font-medium text-sm transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
            >
              {submitting ? 'Submitting...' : 'Submit Doubt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
