import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { BookOpen, Search, AlertCircle } from 'lucide-react';

export default function CourseList() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/courses')
      .then((res) => setCourses(res.data.courses || res.data || []))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load courses'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = courses.filter((c) =>
    c.title?.toLowerCase().includes(search.toLowerCase()) ||
    c.description?.toLowerCase().includes(search.toLowerCase())
  );

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
          <p className="text-gray-300 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative">
      <div className="absolute top-0 right-10 w-64 h-64 bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 relative z-10">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-sm">Course Directory</h1>
          <p className="text-purple-200/70 mt-2 font-medium">Browse {courses.length} active module{courses.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search the cosmos..."
            className="w-full pl-12 pr-4 py-3 bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 text-white placeholder-gray-500 transition-all shadow-inner"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-panel rounded-3xl p-16 text-center shadow-lg relative z-10">
          <div className="h-20 w-20 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-white/5">
            <BookOpen className="h-10 w-10 text-gray-500 drop-shadow-sm" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            {search ? 'No transmissions found' : 'No courses available'}
          </h3>
          <p className="text-purple-200/60 font-medium">
            {search ? 'Try adjusting your search frequency' : 'There are currently no active modules'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
          {filtered.map((course) => (
            <Link
              key={course._id || course.id}
              to={`/courses/${course._id || course.id}`}
              className="glass-panel rounded-3xl overflow-hidden hover:-translate-y-1 hover:border-purple-500/40 hover:shadow-[0_10px_30px_rgba(139,92,246,0.2)] transition-all duration-300 group flex flex-col"
            >
              {course.thumbnail ? (
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent z-10"></div>
                  <img src={course.thumbnail} alt={course.title} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-purple-900/40 to-cyan-900/20 border-b border-white/5 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L3N2Zz4=')]"></div>
                  <BookOpen className="h-14 w-14 text-purple-400/30 drop-shadow-md z-10" />
                </div>
              )}
              <div className="p-6 flex-1 flex flex-col relative z-20">
                <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors drop-shadow-sm">
                  {course.title}
                </h3>
                <p className="text-gray-400 text-sm mt-3 line-clamp-2 leading-relaxed flex-1">{course.description}</p>

                <div className="mt-6">
                  <div className="flex justify-between text-xs font-semibold mb-2 uppercase tracking-wide">
                    <span className="text-gray-500">Progress</span>
                    <span className="text-cyan-400">{Math.round(course.progress || 0)}%</span>
                  </div>
                  <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full h-1.5 transition-all duration-1000"
                      style={{ width: `${course.progress || 0}%` }}
                    ></div>
                  </div>
                </div>

                {course.moduleCount !== undefined && (
                  <p className="text-xs text-purple-300/50 font-medium mt-5 uppercase tracking-wider flex items-center gap-2">
                    <span>{course.moduleCount} module{course.moduleCount !== 1 ? 's' : ''}</span>
                    <span className="w-1 h-1 rounded-full bg-white/20"></span>
                    <span>{course.lessonCount || 0} lesson{(course.lessonCount || 0) !== 1 ? 's' : ''}</span>
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
