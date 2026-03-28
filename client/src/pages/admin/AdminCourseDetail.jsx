import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import {
  BookOpen, AlertCircle, ChevronRight, Plus, Edit, Trash2,
  FileText, Layers, ChevronDown, ChevronUp, ArrowUp, ArrowDown,
} from 'lucide-react';

export default function AdminCourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [expandedModules, setExpandedModules] = useState({});

  useEffect(() => { fetchCourse(); }, [id]);

  const fetchCourse = async () => {
    try {
      const res = await api.get(`/courses/${id}`);
      const data = res.data.course || res.data;
      setCourse(data);
      const expanded = {};
      (data.modules || []).forEach((m) => { expanded[m.id] = true; });
      setExpandedModules(expanded);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const toggleModule = (moduleId) =>
    setExpandedModules((prev) => ({ ...prev, [moduleId]: !prev[moduleId] }));

  const deleteModule = async (moduleId) => {
    if (!window.confirm('Delete this module and all its lessons?')) return;
    setDeleting(moduleId);
    try {
      await api.delete(`/modules/${moduleId}`);
      setCourse((prev) => ({ ...prev, modules: prev.modules.filter((m) => m.id !== moduleId) }));
    } catch {
      setError('Failed to delete module');
    } finally {
      setDeleting(null);
    }
  };

  const moveModule = async (index, direction) => {
    const modules = [...course.modules];
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= modules.length) return;

    // Swap sortOrder values
    const aId = modules[index].id;
    const bId = modules[swapIndex].id;
    const aOrder = modules[swapIndex].sortOrder;
    const bOrder = modules[index].sortOrder;

    try {
      await Promise.all([
        api.put(`/modules/${aId}`, { sortOrder: aOrder }),
        api.put(`/modules/${bId}`, { sortOrder: bOrder }),
      ]);
      // Swap in local state
      [modules[index], modules[swapIndex]] = [modules[swapIndex], modules[index]];
      modules[index].sortOrder = bOrder;
      modules[swapIndex].sortOrder = aOrder;
      setCourse((prev) => ({ ...prev, modules }));
    } catch {
      setError('Failed to reorder modules');
    }
  };

  const deleteLesson = async (lessonId, moduleId) => {
    if (!window.confirm('Delete this lesson?')) return;
    setDeleting(lessonId);
    try {
      await api.delete(`/lessons/${lessonId}`);
      setCourse((prev) => ({
        ...prev,
        modules: prev.modules.map((m) =>
          m.id === moduleId ? { ...m, lessons: m.lessons.filter((l) => l.id !== lessonId) } : m
        ),
      }));
    } catch {
      setError('Failed to delete lesson');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-400 border-t-transparent shadow-[0_0_15px_rgba(168,85,247,0.5)]"></div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <button onClick={() => navigate('/admin/courses')} className="hover:text-purple-400 transition-colors font-medium">Courses</button>
        <ChevronRight className="h-3 w-3" />
        <span className="text-white font-bold truncate">{course?.title}</span>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-300 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          {error}
        </div>
      )}

      {/* Course header */}
      <div className="glass-panel rounded-3xl border border-white/10 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/10 flex items-center justify-center shrink-0">
              <BookOpen className="h-6 w-6 text-pink-300" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{course?.title}</h1>
              {course?.description && (
                <p className="text-sm text-gray-400 mt-1 max-w-lg">{course.description}</p>
              )}
              <span className={`inline-block mt-2 px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-widest ${
                course?.isPublished
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-white/5 text-gray-400 border-white/10'
              }`}>
                {course?.isPublished ? 'Published' : 'Draft'}
              </span>
            </div>
          </div>
          <Link
            to={`/admin/courses/${id}/edit`}
            className="shrink-0 p-2.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <Edit className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Modules section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Modules ({course?.modules?.length || 0})
          </h2>
          <Link
            to={`/admin/modules/${id}/new`}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)]"
          >
            <Plus className="h-4 w-4" />
            Add Module
          </Link>
        </div>

        {(!course?.modules || course.modules.length === 0) ? (
          <div className="glass-panel rounded-2xl border border-white/10 p-10 text-center">
            <Layers className="h-10 w-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No modules yet</p>
            <p className="text-gray-600 text-sm mt-1">Add your first module to get started</p>
          </div>
        ) : (
          course.modules.map((mod, index) => (
            <div key={mod.id} className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
              {/* Module header */}
              <div className="flex items-center justify-between p-4 gap-3">
                <button
                  onClick={() => toggleModule(mod.id)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/20 flex items-center justify-center shrink-0">
                    <Layers className="h-4 w-4 text-purple-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-white text-sm truncate">{mod.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{mod.lessons?.length || 0} lessons</p>
                  </div>
                  {expandedModules[mod.id]
                    ? <ChevronUp className="h-4 w-4 text-gray-500 shrink-0" />
                    : <ChevronDown className="h-4 w-4 text-gray-500 shrink-0" />
                  }
                </button>
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Reorder buttons */}
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => moveModule(index, -1)}
                      disabled={index === 0}
                      className="p-1 text-gray-600 hover:text-gray-300 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                      title="Move up"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => moveModule(index, 1)}
                      disabled={index === course.modules.length - 1}
                      className="p-1 text-gray-600 hover:text-gray-300 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                      title="Move down"
                    >
                      <ArrowDown className="h-3 w-3" />
                    </button>
                  </div>
                  <Link
                    to={`/admin/lessons/${mod.id}/new`}
                    state={{ courseId: id }}
                    className="px-3 py-1.5 text-[11px] font-bold text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-lg transition-colors uppercase tracking-widest whitespace-nowrap"
                  >
                    + Lesson
                  </Link>
                  <button
                    onClick={() => deleteModule(mod.id)}
                    disabled={deleting === mod.id}
                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Lessons list */}
              {expandedModules[mod.id] && mod.lessons && mod.lessons.length > 0 && (
                <div className="border-t border-white/5 divide-y divide-white/5">
                  {mod.lessons.map((lesson) => (
                    <div key={lesson.id} className="flex items-center justify-between px-4 py-3 pl-14 hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                        <span className="text-sm text-gray-300 truncate">{lesson.title}</span>
                        {!lesson.isPublished && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-500 border border-white/10 font-bold uppercase tracking-wide shrink-0">
                            Draft
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Link
                          to={`/admin/lessons/${lesson.id}/edit`}
                          className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          onClick={() => deleteLesson(lesson.id, mod.id)}
                          disabled={deleting === lesson.id}
                          className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
