import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/axios';
import { PlayCircle, BookOpen, Clock, ChevronRight, AlertCircle, CheckCircle } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [lastLesson, setLastLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const coursesRes = await api.get('/courses');
        const coursesData = coursesRes.data.courses || coursesRes.data || [];
        setCourses(Array.isArray(coursesData) ? coursesData : []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
        <div className="text-center bg-card text-card-foreground border rounded-xl shadow-sm p-8 rounded-3xl">
          <AlertCircle className="h-12 w-12 text-pink-500 mx-auto mb-4 drop-shadow-[0_0_10px_rgba(236,72,153,0.5)]" />
          <p className="text-muted-foreground font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="relative">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-purple-600/20 rounded-full blur-3xl mix-blend-screen pointer-events-none"></div>
        <h1 className="text-3xl font-extrabold text-foreground font-semibold tracking-tight drop-shadow-md">
          Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-300">{user?.name?.split(' ')[0]}!</span>
        </h1>
        <p className="text-muted-foreground mt-2 font-medium">Continue your learning journey through the cosmos.</p>
      </div>

      {lastLesson && (
        <Link
          to={`/lessons/${lastLesson._id || lastLesson.id}`}
          className="block relative overflow-hidden bg-gradient-to-r from-purple-900/80 to-cyan-900/80 backdrop-blur-xl border border-border rounded-3xl p-8 text-white font-bold hover:from-purple-800/90 hover:to-cyan-800/90 hover:border-purple-400/50 hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all duration-500 group"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="relative flex items-center justify-between z-10">
            <div className="flex items-center gap-5">
              <div className="h-16 w-16 bg-muted/80 backdrop-blur-sm border border-border rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-white/20 transition-all duration-300">
                <PlayCircle className="h-8 w-8 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <p className="text-cyan-200/80 text-sm font-semibold tracking-wider uppercase mb-1 drop-shadow-sm">Up Next</p>
                <h3 className="text-2xl font-bold text-foreground font-semibold drop-shadow-md">{lastLesson.title}</h3>
                {lastLesson.courseName && (
                  <p className="text-primary/80 mt-1 font-medium">{lastLesson.courseName}</p>
                )}
              </div>
            </div>
            <div className="h-12 w-12 rounded-full bg-muted border border-border flex items-center justify-center group-hover:bg-muted/80 transition-colors">
              <ChevronRight className="h-6 w-6 text-foreground font-semibold" />
            </div>
          </div>
          {lastLesson.progress !== undefined && (
            <div className="mt-8 relative z-10">
              <div className="flex justify-between text-sm mb-2 font-medium">
                <span className="text-primary/90">Course Progress</span>
                <span className="text-cyan-600 dark:text-cyan-400">{Math.round(lastLesson.progress)}%</span>
              </div>
              <div className="w-full bg-muted/50 rounded-full h-2.5 shadow-inner overflow-hidden border border-border">
                <div
                  className="bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full h-2.5 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(56,189,248,0.5)]"
                  style={{ width: `${lastLesson.progress}%` }}
                ></div>
              </div>
            </div>
          )}
        </Link>
      )}

      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground font-semibold drop-shadow-sm">My Enrolled Courses</h2>
          <Link to="/courses" className="text-sm text-cyan-400 hover:text-accent font-semibold px-4 py-2 rounded-lg hover:bg-cyan-500/10 transition-colors">
            View all directory
          </Link>
        </div>

        {courses.length === 0 ? (
          <div className="bg-card text-card-foreground border rounded-xl shadow-sm rounded-3xl p-16 text-center shadow-lg pointer-events-none">
            <div className="h-20 w-20 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-border">
              <BookOpen className="h-10 w-10 text-purple-400/50" />
            </div>
            <h3 className="text-xl font-bold text-foreground font-semibold mb-2">No courses yet</h3>
            <p className="text-muted-foreground font-medium">Your enrolled modules will appear in this sector.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Link
                key={course._id || course.id}
                to={`/courses/${course._id || course.id}`}
                className="bg-card text-card-foreground border rounded-xl shadow-sm rounded-3xl overflow-hidden hover:-translate-y-1 hover:border-purple-500/40 hover:shadow-[0_10px_30px_rgba(139,92,246,0.2)] transition-all duration-300 group flex flex-col"
              >
                {course.thumbnail ? (
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent z-10"></div>
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-purple-900/40 to-cyan-900/20 border-b border-border flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L3N2Zz4=')]"></div>
                    <BookOpen className="h-14 w-14 text-purple-400/30 drop-shadow-md z-10" />
                  </div>
                )}
                <div className="p-6 flex-1 flex flex-col relative z-20">
                  <h3 className="text-lg font-bold text-foreground font-semibold group-hover:text-primary transition-colors drop-shadow-sm">
                    {course.title}
                  </h3>
                  <p className="text-muted-foreground text-sm mt-3 line-clamp-2 leading-relaxed flex-1">{course.description}</p>

                  <div className="mt-6 pt-6 border-t border-border">
                    <div className="flex justify-between text-xs font-semibold mb-2 uppercase tracking-wide">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="text-cyan-600 dark:text-cyan-400">
                        {Math.round(course.progress || 0)}%
                      </span>
                    </div>
                    <div className="w-full bg-muted/50 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full h-1.5 transition-all duration-1000"
                        style={{ width: `${course.progress || 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {recentActivity.length > 0 && (
        <div className="pt-4">
          <h2 className="text-xl font-bold text-foreground font-semibold mb-6 drop-shadow-sm">Recent Transmissions</h2>
          <div className="bg-card text-card-foreground border rounded-xl shadow-sm rounded-3xl border border-border divide-y divide-white/5">
            {recentActivity.slice(0, 5).map((activity, idx) => (
              <div key={idx} className="px-6 py-5 flex items-center gap-5 hover:bg-muted transition-colors first:rounded-t-3xl last:rounded-b-3xl">
                <div className="h-12 w-12 rounded-2xl bg-muted border border-border flex items-center justify-center shrink-0 shadow-inner">
                  {activity.type === 'lesson_complete' ? (
                    <CheckCircle className="h-6 w-6 text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.4)]" />
                  ) : activity.type === 'lesson_progress' ? (
                    <PlayCircle className="h-6 w-6 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]" />
                  ) : (
                    <Clock className="h-6 w-6 text-purple-400/70" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-medium text-foreground truncate">{activity.description || activity.title}</p>
                  <p className="text-xs text-primary/60 font-medium mt-1 uppercase tracking-wider">
                    {new Date(activity.createdAt || activity.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
