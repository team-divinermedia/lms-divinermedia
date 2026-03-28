import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { BookOpen, Plus, Edit, Trash2, AlertCircle, Layers, FileText } from 'lucide-react';

export default function CourseManager() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await api.get('/courses');
      setCourses(Array.isArray(res.data) ? res.data : res.data.courses || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    setDeleting(id);
    try {
      await api.delete(`/courses/${id}`);
      setCourses((prev) => prev.filter((c) => (c._id || c.id) !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete course');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-500 border-t-transparent shadow-[0_0_15px_rgba(236,72,153,0.5)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative z-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pb-2 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-cyan-300 mb-3 uppercase tracking-widest shadow-inner">
            Curriculum Control
          </div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-tight">Manage Courses</h1>
          <p className="text-gray-400 mt-1 font-medium">{courses.length} module{courses.length !== 1 ? 's' : ''} deployed</p>
        </div>
        <Link
          to="/admin/courses/new"
          className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl text-sm font-bold tracking-wide uppercase shadow-[0_0_20px_rgba(219,39,119,0.3)] hover:shadow-[0_0_30px_rgba(219,39,119,0.5)] transition-all hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" />
          Create New Course
        </Link>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-200 text-sm backdrop-blur-md shadow-inner">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
          {error}
        </div>
      )}

      {courses.length === 0 ? (
        <div className="glass-panel rounded-[2.5rem] border border-white/10 p-16 text-center">
          <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner ring-1 ring-white/10">
            <BookOpen className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">No courses active</h3>
          <p className="text-gray-400 text-sm mb-8 max-w-sm mx-auto">Create your first training module to begin curating the intern curriculum.</p>
          <Link
            to="/admin/courses/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl text-sm font-bold tracking-wide uppercase transition-all shadow-lg hover:shadow-pink-500/50"
          >
            <Plus className="h-5 w-5" />
            Create Course
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {courses.map((course) => {
            const cId = course._id || course.id;
            return (
              <div key={cId} className="glass-panel rounded-3xl border border-white/10 p-5 hover:border-white/20 transition-all duration-300 shadow-lg group">
                {/* Top row: thumbnail + title/description + published badge */}
                <div className="flex items-start gap-4">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title} className="w-14 h-14 rounded-2xl object-cover shrink-0 ring-1 ring-white/20 shadow-lg" />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/10 flex items-center justify-center shrink-0 shadow-inner group-hover:from-purple-500/30 transition-colors">
                      <BookOpen className="h-6 w-6 text-pink-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-base font-bold text-white truncate tracking-tight leading-tight">{course.title}</h3>
                      <span className={`shrink-0 px-2.5 py-1 rounded-lg border font-bold uppercase tracking-wider text-[10px] ${
                        course.isPublished
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-white/5 text-gray-400 border-white/10'
                      }`}>
                        {course.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 truncate mt-1">{course.description}</p>
                  </div>
                </div>

                {/* Bottom row: stats on left, actions on right */}
                <div className="flex items-center justify-between gap-2 flex-wrap mt-4 pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                    <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5">
                      <Layers className="h-3 w-3 text-cyan-400" />
                      {course.modulesCount || 0} modules
                    </span>
                    <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5">
                      <FileText className="h-3 w-3 text-purple-400" />
                      {course.lessonsCount || 0} lessons
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Link
                      to={`/admin/courses/${cId}`}
                      className="px-3 py-1.5 text-[11px] font-bold text-pink-300 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/20 rounded-lg transition-colors uppercase tracking-widest"
                    >
                      Manage
                    </Link>
                    <Link
                      to={`/admin/courses/${cId}/edit`}
                      className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(cId)}
                      disabled={deleting === cId}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
