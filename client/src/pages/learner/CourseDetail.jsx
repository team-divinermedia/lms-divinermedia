import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import {
  BookOpen, PlayCircle, CheckCircle, Lock, ChevronDown,
  ChevronRight, FileText, AlertCircle
} from 'lucide-react';

export default function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [expandedModules, setExpandedModules] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const courseRes = await api.get(`/courses/${id}`);
        const courseData = courseRes.data.course || courseRes.data;
        setCourse(courseData);
        const mods = courseData.modules || [];
        setModules(mods);
        const expanded = {};
        mods.forEach((m, i) => { expanded[m._id || m.id || i] = i === 0; });
        setExpandedModules(expanded);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load course');
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [id]);

  const toggleModule = (moduleId) => {
    setExpandedModules((prev) => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-400 border-t-transparent shadow-[0_0_15px_rgba(168,85,247,0.5)]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center glass-panel p-8 rounded-3xl">
          <AlertCircle className="h-12 w-12 text-pink-500 mx-auto mb-4 drop-shadow-[0_0_10px_rgba(236,72,153,0.5)]" />
          <p className="text-gray-300 font-medium mb-4">{error}</p>
          <Link to="/courses" className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors">
            Back to courses
          </Link>
        </div>
      </div>
    );
  }

  const isLessonCompleted = (lesson) => lesson.lessonProgress?.some((p) => p.isCompleted) || lesson.completed;
  const totalLessons = modules.reduce((sum, m) => sum + (m.lessons?.length || 0), 0);
  const completedLessons = modules.reduce(
    (sum, m) => sum + (m.lessons?.filter((l) => isLessonCompleted(l)).length || 0), 0
  );
  const progress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  return (
    <div className="space-y-6">
      <Link to="/courses" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors font-medium">
        <ChevronRight className="h-4 w-4 rotate-180" />
        Back to courses
      </Link>

      {/* Course Header */}
      <div className="glass-panel rounded-3xl border border-white/10 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row gap-6">
          {course.thumbnail ? (
            <img src={course.thumbnail} alt={course.title} className="w-full sm:w-48 h-32 object-cover rounded-2xl" />
          ) : (
            <div className="w-full sm:w-48 h-32 bg-gradient-to-br from-purple-900/40 to-cyan-900/20 rounded-2xl flex items-center justify-center shrink-0 border border-white/5">
              <BookOpen className="h-10 w-10 text-purple-400/50" />
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">{course.title}</h1>
            <p className="text-gray-400 mt-2 leading-relaxed">{course.description}</p>
            <div className="flex items-center gap-4 mt-4 text-sm text-gray-500 font-medium">
              <span>{modules.length} module{modules.length !== 1 ? 's' : ''}</span>
              <span className="w-1 h-1 rounded-full bg-white/20"></span>
              <span>{totalLessons} lesson{totalLessons !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex justify-between text-sm mb-2 font-medium">
            <span className="text-gray-400">{completedLessons} of {totalLessons} lessons completed</span>
            <span className="text-cyan-400 font-bold">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-black/40 rounded-full h-2.5 overflow-hidden border border-white/5 shadow-inner">
            <div
              className="bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full h-2.5 transition-all duration-1000 shadow-[0_0_10px_rgba(56,189,248,0.4)]"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Modules */}
      <div className="space-y-3">
        {modules.length === 0 ? (
          <div className="glass-panel rounded-3xl border border-white/10 p-12 text-center">
            <FileText className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-1">No modules yet</h3>
            <p className="text-gray-500 text-sm">This course has no content yet</p>
          </div>
        ) : (
          modules.map((module) => {
            const mId = module._id || module.id;
            const isExpanded = expandedModules[mId];
            const lessons = module.lessons || [];
            const modCompleted = lessons.filter((l) => isLessonCompleted(l)).length;

            return (
              <div key={mId} className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
                <button
                  onClick={() => toggleModule(mId)}
                  className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                      modCompleted === lessons.length && lessons.length > 0
                        ? 'bg-emerald-500/20 border border-emerald-500/30'
                        : 'bg-purple-500/20 border border-purple-500/30'
                    }`}>
                      {modCompleted === lessons.length && lessons.length > 0 ? (
                        <CheckCircle className="h-5 w-5 text-emerald-400" />
                      ) : (
                        <BookOpen className="h-5 w-5 text-purple-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{module.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5 font-medium">
                        {modCompleted}/{lessons.length} lessons completed
                      </p>
                    </div>
                  </div>
                  <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>

                {isExpanded && lessons.length > 0 && (
                  <div className="border-t border-white/5">
                    {lessons.map((lesson, idx) => {
                      const lId = lesson._id || lesson.id;
                      const isLocked = lesson.locked;

                      return (
                        <div key={lId || idx}>
                          {isLocked ? (
                            <div className="flex items-center gap-4 px-5 py-3.5 opacity-40">
                              <Lock className="h-4 w-4 text-gray-500 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-400 truncate">{lesson.title}</p>
                                {lesson.unlockDate && (
                                  <p className="text-xs text-gray-600 mt-0.5">
                                    Unlocks {new Date(lesson.unlockDate).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          ) : (
                            <Link
                              to={`/lessons/${lId}`}
                              className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/5 transition-colors group"
                            >
                              {isLessonCompleted(lesson) ? (
                                <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                              ) : (
                                <PlayCircle className="h-4 w-4 text-purple-400 shrink-0 group-hover:text-purple-300" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate transition-colors ${
                                  isLessonCompleted(lesson)
                                    ? 'text-gray-500'
                                    : 'text-gray-200 group-hover:text-white'
                                }`}>
                                  {lesson.title}
                                </p>
                              </div>
                              <ChevronRight className="h-4 w-4 text-gray-600 group-hover:text-gray-400 shrink-0 transition-colors" />
                            </Link>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
