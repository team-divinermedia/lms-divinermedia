import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { BookOpen, AlertCircle, Upload, ChevronRight } from 'lucide-react';

export default function CourseForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [published, setPublished] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      api.get(`/courses/${id}`)
        .then((res) => {
          const course = res.data.course || res.data;
          setTitle(course.title || '');
          setDescription(course.description || '');
          setPublished(course.isPublished || false);
          if (course.thumbnail) setThumbnailPreview(course.thumbnail);
        })
        .catch((err) => setError(err.response?.data?.message || 'Failed to load course'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setThumbnail(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('isPublished', published);
      if (thumbnail) formData.append('thumbnail', thumbnail);

      if (isEdit) {
        await api.put(`/courses/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        navigate(`/admin/courses/${id}`);
      } else {
        const res = await api.post('/courses', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const newId = res.data.course?.id || res.data.id;
        navigate(`/admin/courses/${newId}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save course');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-sm text-gray-300 placeholder-gray-600 transition-all outline-none";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-400 border-t-transparent shadow-[0_0_15px_rgba(168,85,247,0.5)]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <button onClick={() => navigate('/admin/courses')} className="hover:text-purple-400 transition-colors font-medium">Courses</button>
        <ChevronRight className="h-3 w-3" />
        <span className="text-white font-bold">{isEdit ? 'Edit Course' : 'New Course'}</span>
      </div>

      <div className="glass-panel rounded-3xl border border-white/10 p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 bg-purple-500/20 border border-purple-500/30 rounded-xl flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-purple-400" />
          </div>
          <h1 className="text-xl font-bold text-white">{isEdit ? 'Edit Course' : 'Create New Course'}</h1>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-300 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className={inputClass}
              placeholder="Course title"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className={`${inputClass} resize-none`}
              placeholder="Describe the course..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Thumbnail</label>
            {thumbnailPreview && (
              <img src={thumbnailPreview} alt="Preview" className="w-48 h-28 object-cover rounded-xl mb-3 border border-white/10" />
            )}
            <label className="flex items-center gap-3 px-4 py-4 bg-black/30 hover:bg-white/5 border-2 border-dashed border-white/10 hover:border-purple-500/40 rounded-xl cursor-pointer transition-colors">
              <Upload className="h-5 w-5 text-gray-500" />
              <span className="text-sm text-gray-500">{thumbnail ? thumbnail.name : 'Choose thumbnail image'}</span>
              <input type="file" accept="image/*" onChange={handleThumbnailChange} className="hidden" />
            </label>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPublished(!published)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${published ? 'bg-purple-600' : 'bg-white/10'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${published ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className="text-sm font-medium text-gray-300">Published</span>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/admin/courses')}
              className="px-4 py-2.5 text-sm font-medium text-gray-400 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-medium text-sm transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
            >
              {submitting ? 'Saving...' : isEdit ? 'Update Course' : 'Create Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
