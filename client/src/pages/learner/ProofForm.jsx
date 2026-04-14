import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { Award, AlertCircle, Upload, ChevronRight, Image, Video, FileText, Link as LinkIcon, FileEdit } from 'lucide-react';

const proofTypes = [
  { value: 'image', label: 'Image', icon: Image },
  { value: 'video', label: 'Video', icon: Video },
  { value: 'pdf', label: 'PDF', icon: FileText },
  { value: 'link', label: 'Link', icon: LinkIcon },
  { value: 'editable_file_link', label: 'Editable File', icon: FileEdit },
];

export default function ProofForm() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [attachTo, setAttachTo] = useState('lesson');
  const [selectedAttachment, setSelectedAttachment] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('image');
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState('');
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
      const fetchItems = async () => {
        try {
          const courseRes = await api.get(`/courses/${selectedCourse}`);
          const course = courseRes.data.course || courseRes.data;
          const mods = course.modules || [];
          const allLessons = mods.flatMap((m) => (m.lessons || []).map((l) => ({ ...l, moduleName: m.title })));
          setLessons(allLessons);
          setAssessments([]);
        } catch {
          setLessons([]);
          setAssessments([]);
        }
      };
      fetchItems();
    } else {
      setLessons([]);
      setAssessments([]);
    }
    setSelectedAttachment('');
  }, [selectedCourse]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      let requestData;
      let headers = {};

      if (type === 'link' || type === 'editable_file_link') {
        requestData = { title, description, type, url };
        if (selectedAttachment) {
          requestData[attachTo === 'lesson' ? 'lessonId' : 'assessmentId'] = selectedAttachment;
        }
        headers = { 'Content-Type': 'application/json' };
      } else {
        requestData = new FormData();
        requestData.append('title', title);
        requestData.append('description', description);
        requestData.append('type', type);
        if (selectedAttachment) {
          requestData.append(attachTo === 'lesson' ? 'lessonId' : 'assessmentId', selectedAttachment);
        }
        if (file) requestData.append('file', file);
        headers = { 'Content-Type': 'multipart/form-data' };
      }

      await api.post('/proofs', requestData, { headers });
      navigate('/proofs');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to upload proof');
    } finally {
      setSubmitting(false);
    }
  };

  const isUrlType = type === 'link' || type === 'editable_file_link';
  const fileAccept = type === 'image' ? 'image/*' : type === 'video' ? 'video/*' : type === 'pdf' ? '.pdf' : '*';

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
        <button onClick={() => navigate('/proofs')} className="hover:text-purple-400 transition-colors">Portfolio</button>
        <ChevronRight className="h-3 w-3" />
        <span className="text-muted-foreground font-medium">Upload Proof</span>
      </div>

      <div className="bg-card text-card-foreground border rounded-xl shadow-sm rounded-3xl border border-border p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 bg-purple-500/20 border border-purple-500/30 rounded-xl flex items-center justify-center">
            <Award className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground font-semibold">Upload Proof of Work</h1>
            <p className="text-muted-foreground text-sm">Share your work to build your portfolio</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-300 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Attach to</label>
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => { setAttachTo('lesson'); setSelectedAttachment(''); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    attachTo === 'lesson'
                      ? 'bg-purple-500/20 text-primary border-purple-500/40'
                      : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
                  }`}
                >
                  Lesson
                </button>
                <button
                  type="button"
                  onClick={() => { setAttachTo('assessment'); setSelectedAttachment(''); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    attachTo === 'assessment'
                      ? 'bg-purple-500/20 text-primary border-purple-500/40'
                      : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
                  }`}
                >
                  Assessment
                </button>
              </div>
              <select
                value={selectedAttachment}
                onChange={(e) => setSelectedAttachment(e.target.value)}
                disabled={!selectedCourse}
                className={selectClass}
              >
                <option value="">Select {attachTo}</option>
                {(attachTo === 'lesson' ? lessons : assessments).map((item) => (
                  <option key={item._id || item.id} value={item._id || item.id}>{item.title}</option>
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
              placeholder="Give your proof a title"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-sm resize-none text-muted-foreground placeholder-muted-foreground/50 transition-all outline-none"
              placeholder="Describe what you created..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Type</label>
            <div className="flex flex-wrap gap-2">
              {proofTypes.map((pt) => (
                <button
                  key={pt.value}
                  type="button"
                  onClick={() => setType(pt.value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
                    type === pt.value
                      ? 'bg-purple-500/20 text-primary border-purple-500/40'
                      : 'bg-muted text-muted-foreground border-border hover:bg-muted/80 hover:text-foreground font-semibold'
                  }`}
                >
                  <pt.icon className="h-4 w-4" />
                  {pt.label}
                </button>
              ))}
            </div>
          </div>

          {isUrlType ? (
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">URL</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-sm text-muted-foreground placeholder-muted-foreground/50 transition-all outline-none"
                placeholder="https://..."
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">File</label>
              <label className="flex items-center gap-3 px-4 py-4 bg-muted/50 hover:bg-muted border-2 border-dashed border-border hover:border-purple-500/40 rounded-xl cursor-pointer transition-colors">
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{file ? file.name : 'Click to upload file'}</span>
                <input
                  type="file"
                  accept={fileAccept}
                  onChange={(e) => setFile(e.target.files[0])}
                  className="hidden"
                />
              </label>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/proofs')}
              className="px-4 py-2.5 text-sm font-medium text-muted-foreground bg-muted border border-border hover:bg-muted/80 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl font-medium text-sm transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
            >
              {submitting ? 'Uploading...' : 'Upload Proof'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
