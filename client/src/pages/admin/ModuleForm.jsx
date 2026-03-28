import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { Layers, AlertCircle, ChevronRight } from 'lucide-react';

export default function ModuleForm() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [courseName, setCourseName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/courses/${courseId}`)
      .then((res) => setCourseName(res.data.course?.title || res.data.title || ''))
      .catch(() => {});
  }, [courseId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/modules', {
        courseId,
        title,
        description,
        sortOrder: Number(sortOrder),
      });
      navigate(`/admin/courses/${courseId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create module');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-sm text-gray-300 placeholder-gray-600 transition-all outline-none";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <button onClick={() => navigate('/admin/courses')} className="hover:text-purple-400 transition-colors font-medium">Courses</button>
        <ChevronRight className="h-3 w-3" />
        {courseName && (
          <>
            <span className="text-gray-400">{courseName}</span>
            <ChevronRight className="h-3 w-3" />
          </>
        )}
        <span className="text-white font-bold">Add Module</span>
      </div>

      <div className="glass-panel rounded-3xl border border-white/10 p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 bg-purple-500/20 border border-purple-500/30 rounded-xl flex items-center justify-center">
            <Layers className="h-5 w-5 text-purple-400" />
          </div>
          <h1 className="text-xl font-bold text-white">Add Module</h1>
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
              placeholder="Module title"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={`${inputClass} resize-none`}
              placeholder="Module description"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Sort Order</label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              min="0"
              className="w-32 px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-sm text-gray-300 transition-all outline-none"
            />
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
              {submitting ? 'Creating...' : 'Create Module'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
