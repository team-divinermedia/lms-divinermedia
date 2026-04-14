import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../../api/axios';
import { FileText, AlertCircle, ChevronRight, Plus, Trash2, Calendar } from 'lucide-react';

// Returns the next Mon–Fri at 10:00 AM (local time) from a given date
function nextWeekday10AM(from = new Date()) {
  const d = new Date(from);
  d.setSeconds(0, 0);
  d.setHours(10, 0, 0, 0);
  // If it's already past 10 AM today and today is a weekday, move to next day
  if (d <= new Date()) d.setDate(d.getDate() + 1);
  // Skip weekends
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  return d;
}

// Format a Date to datetime-local input value "YYYY-MM-DDTHH:MM"
function toDatetimeLocal(date) {
  if (!date) return '';
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function LessonForm() {
  const { moduleId, id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = !!id;
  const [courseId, setCourseId] = useState(location.state?.courseId || null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [resources, setResources] = useState([]);
  const [unlockDate, setUnlockDate] = useState('');
  const [published, setPublished] = useState(true);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      api.get(`/lessons/detail/${id}`)
        .then((res) => {
          const lesson = res.data.lesson || res.data;
          setTitle(lesson.title || '');
          setDescription(lesson.description || '');
          setVideoUrl(lesson.videoUrl || '');
          setNotes(lesson.notes || '');
          const rawResources = lesson.resources;
          setResources(
            typeof rawResources === 'string'
              ? (() => { try { return JSON.parse(rawResources); } catch { return []; } })()
              : (rawResources || [])
          );
          setUnlockDate(lesson.unlockDate ? toDatetimeLocal(new Date(lesson.unlockDate)) : '');
          setPublished(lesson.isPublished !== false);
          if (lesson.module?.courseId) setCourseId(lesson.module.courseId);
        })
        .catch((err) => setError(err.response?.data?.message || 'Failed to load lesson'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const addResource = () => setResources([...resources, { title: '', url: '', type: '' }]);

  const updateResource = (idx, field, value) => {
    const updated = [...resources];
    updated[idx] = { ...updated[idx], [field]: value };
    setResources(updated);
  };

  const removeResource = (idx) => setResources(resources.filter((_, i) => i !== idx));

  const suggestNextWeekday = () => {
    // If there's already a date set, suggest the next weekday after it
    const base = unlockDate ? new Date(unlockDate) : new Date();
    const next = nextWeekday10AM(base);
    setUnlockDate(toDatetimeLocal(next));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const data = {
        title,
        description,
        videoUrl,
        notes,
        resources: resources.filter((r) => r.title || r.url),
        // Convert local datetime string → UTC ISO before sending
        unlockDate: unlockDate ? new Date(unlockDate).toISOString() : null,
        isPublished: published,
      };

      if (isEdit) {
        await api.put(`/lessons/${id}`, data);
      } else {
        await api.post('/lessons', { ...data, moduleId });
      }
      navigate(courseId ? `/admin/courses/${courseId}` : '/admin/courses');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save lesson');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full px-4 py-2.5 bg-muted/50 border border-border rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-sm text-muted-foreground placeholder-muted-foreground/50 transition-all outline-none";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-400 border-t-transparent shadow-[0_0_15px_rgba(168,85,247,0.5)]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button onClick={() => navigate('/admin/courses')} className="hover:text-purple-400 transition-colors font-medium">Courses</button>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-semibold font-bold">{isEdit ? 'Edit Lesson' : 'Add Lesson'}</span>
      </div>

      <div className="bg-card text-card-foreground border rounded-xl shadow-sm rounded-3xl border border-border p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 bg-purple-500/20 border border-purple-500/30 rounded-xl flex items-center justify-center">
            <FileText className="h-5 w-5 text-purple-400" />
          </div>
          <h1 className="text-xl font-bold text-foreground font-semibold">{isEdit ? 'Edit Lesson' : 'Add Lesson'}</h1>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-300 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className={inputClass} placeholder="Lesson title" />
          </div>

          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={`${inputClass} resize-none`} placeholder="Lesson description" />
          </div>

          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Video URL</label>
            <input type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} className={inputClass} placeholder="https://youtube.com/watch?v=..." />
          </div>

          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={6} className={`${inputClass} resize-none`} placeholder="Lesson notes and key takeaways..." />
          </div>

          {/* Resources */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Resources</label>
              <button type="button" onClick={addResource} className="flex items-center gap-1 text-sm text-purple-400 hover:text-primary font-medium transition-colors">
                <Plus className="h-4 w-4" /> Add Resource
              </button>
            </div>
            {resources.map((resource, idx) => (
              <div key={idx} className="flex gap-3 mb-3">
                <input
                  type="text"
                  value={resource.title}
                  onChange={(e) => updateResource(idx, 'title', e.target.value)}
                  className={inputClass}
                  placeholder="Resource title"
                />
                <input
                  type="url"
                  value={resource.url}
                  onChange={(e) => updateResource(idx, 'url', e.target.value)}
                  className={inputClass}
                  placeholder="URL"
                />
                <button type="button" onClick={() => removeResource(idx)} className="p-2 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Unlock Date — datetime with weekday helper */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
              Unlock Date &amp; Time
            </label>
            <div className="flex items-center gap-3">
              <input
                type="datetime-local"
                value={unlockDate}
                onChange={(e) => setUnlockDate(e.target.value)}
                className={`${inputClass} w-auto`}
                style={{ colorScheme: 'dark' }}
              />
              <button
                type="button"
                onClick={suggestNextWeekday}
                title="Set to next weekday at 10:00 AM"
                className="flex items-center gap-2 px-3 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground font-semibold transition-colors shrink-0"
              >
                <Calendar className="h-3.5 w-3.5" />
                Next weekday 10 AM
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              Lesson unlocks at this time <span className="text-muted-foreground font-medium">and</span> only after the previous lesson's assessment is submitted.
            </p>
          </div>

          {/* Published toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPublished(!published)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${published ? 'bg-purple-600' : 'bg-muted/80'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${published ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className="text-sm font-medium text-muted-foreground">Published</span>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => navigate('/admin/courses')} className="px-4 py-2.5 text-sm font-medium text-muted-foreground bg-muted border border-border hover:bg-muted/80 rounded-xl transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl font-medium text-sm transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
              {submitting ? 'Saving...' : isEdit ? 'Update Lesson' : 'Create Lesson'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
