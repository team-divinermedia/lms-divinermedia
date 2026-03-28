import { useState, useEffect } from 'react';
import api from '../../api/axios';
import {
  BarChart3, AlertCircle, Users, BookOpen, TrendingUp,
  MessageSquare, Award, User, Download
} from 'lucide-react';

export default function Reports() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/admin/reports/overview')
      .then((res) => setReport(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load reports'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center bg-red-500/10 border border-red-500/30 p-8 rounded-3xl backdrop-blur-md">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-200 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  const overviewStats = [
    { label: 'Total Interns', value: report?.totalLearners || 0, icon: Users, color: 'purple' },
    { label: 'Total Modules', value: report?.totalCourses || 0, icon: BookOpen, color: 'blue' },
    { label: 'Completion Rate', value: `${Math.round(report?.avgCompletion || 0)}%`, icon: TrendingUp, color: 'emerald' },
    { label: 'Total Doubts', value: report?.totalDoubts || 0, icon: MessageSquare, color: 'orange' },
    { label: 'Total Portfolios', value: report?.totalProofs || 0, icon: Award, color: 'pink' },
  ];

  const colorClasses = {
    purple: { bg: 'from-purple-500/20 to-indigo-500/20', icon: 'text-purple-300', shadow: 'shadow-purple-500/20', ring: 'ring-purple-500/30' },
    blue: { bg: 'from-blue-500/20 to-cyan-500/20', icon: 'text-blue-300', shadow: 'shadow-blue-500/20', ring: 'ring-blue-500/30' },
    emerald: { bg: 'from-emerald-500/20 to-teal-500/20', icon: 'text-emerald-300', shadow: 'shadow-emerald-500/20', ring: 'ring-emerald-500/30' },
    orange: { bg: 'from-orange-500/20 to-amber-500/20', icon: 'text-orange-300', shadow: 'shadow-orange-500/20', ring: 'ring-orange-500/30' },
    pink: { bg: 'from-pink-500/20 to-rose-500/20', icon: 'text-pink-300', shadow: 'shadow-pink-500/20', ring: 'ring-pink-500/30' },
  };

  const weakTopics = report?.weakTopics || [];
  const learnerProgress = report?.learnerProgress || [];
  const courseCompletion = report?.courseCompletion || [];

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Courses Enrolled', 'Lessons Completed', 'Progress (%)', 'Doubts Raised', 'Proofs Submitted'];
    const rows = learnerProgress.map((l) => [
      l.name,
      l.email,
      l.coursesEnrolled || 0,
      l.lessonsCompleted || 0,
      Math.round(l.progress || 0),
      l.doubtsRaised || 0,
      l.proofsSubmitted || 0,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lms-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 relative z-10">
      <div className="flex items-start justify-between pb-2 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-indigo-300 mb-3 uppercase tracking-widest shadow-inner w-fit">
            <BarChart3 className="h-3 w-3" />
            Metrics & Telemetry
          </div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-tight">Platform Analytics</h1>
          <p className="text-gray-400 mt-1 font-medium">Real-time engagement insights and performance tracking</p>
        </div>
        {learnerProgress.length > 0 && (
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] hover:-translate-y-0.5 border border-indigo-400/30 shrink-0 mt-1"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {overviewStats.map((stat) => {
          const colors = colorClasses[stat.color];
          return (
            <div key={stat.label} className="glass-panel rounded-3xl border border-white/10 p-6 flex flex-col items-start relative overflow-hidden group hover:-translate-y-1 transition-all hover:border-white/20 shadow-lg">
              <div className={`absolute inset-0 bg-gradient-to-br ${colors.bg} opacity-5 group-hover:opacity-20 transition-opacity duration-500`}></div>
              <div className={`h-12 w-12 bg-gradient-to-br ${colors.bg} rounded-2xl flex items-center justify-center mb-4 ring-1 ${colors.ring} ${colors.shadow} shadow-inner group-hover:scale-110 transition-transform`}>
                <stat.icon className={`h-6 w-6 ${colors.icon}`} />
              </div>
              <p className="text-3xl font-black text-white tracking-tight drop-shadow-md relative z-10">{stat.value}</p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1 relative z-10">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel rounded-3xl border border-white/10 p-7 shadow-xl">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-3 tracking-wide">
            <div className="p-2 bg-orange-500/20 rounded-xl border border-orange-500/30">
              <MessageSquare className="h-4 w-4 text-orange-400" />
            </div>
            Doubt Frequency Heatmap (Topics)
          </h2>
          {weakTopics.length === 0 ? (
            <div className="h-40 flex items-center justify-center">
              <p className="text-sm font-medium text-gray-500 italic">Insufficient data pipeline</p>
            </div>
          ) : (
            <div className="space-y-5">
              {weakTopics.slice(0, 10).map((topic, idx) => {
                const maxCount = weakTopics[0]?.count || 1;
                const pct = (topic.count / maxCount) * 100;
                return (
                  <div key={idx} className="group">
                    <div className="flex items-center justify-between text-xs font-bold mb-2">
                      <span className="text-gray-300 truncate flex-1 mr-4 uppercase tracking-wider">{topic.lessonTitle || topic.title}</span>
                      <span className="text-orange-300 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20 shrink-0">
                        {topic.count} logs
                      </span>
                    </div>
                    <div className="w-full bg-black/40 rounded-full h-2.5 overflow-hidden border border-white/5 shadow-inner">
                      <div
                        className="bg-gradient-to-r from-orange-500 to-amber-400 h-full shadow-[0_0_10px_rgba(249,115,22,0.5)] group-hover:brightness-110 transition-all"
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="glass-panel rounded-3xl border border-white/10 p-7 shadow-xl">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-3 tracking-wide">
            <div className="p-2 bg-blue-500/20 rounded-xl border border-blue-500/30">
              <BookOpen className="h-4 w-4 text-blue-400" />
            </div>
            Module Progression Rates
          </h2>
          {courseCompletion.length === 0 ? (
            <div className="h-40 flex items-center justify-center">
              <p className="text-sm font-medium text-gray-500 italic">Insufficient data pipeline</p>
            </div>
          ) : (
            <div className="space-y-5">
              {courseCompletion.map((course, idx) => (
                <div key={idx} className="group">
                  <div className="flex items-center justify-between text-xs font-bold mb-2">
                    <span className="text-gray-300 truncate flex-1 mr-4 uppercase tracking-wider">{course.title}</span>
                    <span className="text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 shrink-0">
                      {Math.round(course.completionRate || 0)}%
                    </span>
                  </div>
                  <div className="w-full bg-black/40 rounded-full h-2.5 overflow-hidden border border-white/5 shadow-inner">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full shadow-[0_0_10px_rgba(59,130,246,0.5)] group-hover:brightness-110 transition-all"
                      style={{ width: `${course.completionRate || 0}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="glass-panel rounded-3xl border border-white/10 p-7 shadow-xl">
        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-3 tracking-wide">
          <div className="p-2 bg-purple-500/20 rounded-xl border border-purple-500/30">
            <Users className="h-4 w-4 text-purple-400" />
          </div>
          Intern Roster Performance Matrix
        </h2>
        {learnerProgress.length === 0 ? (
          <div className="py-12 flex items-center justify-center">
            <p className="text-sm font-medium text-gray-500 italic">No personnel data logged</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="text-left py-4 px-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Subject ID</th>
                  <th className="text-left py-4 px-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap hidden sm:table-cell">Enrolled</th>
                  <th className="text-left py-4 px-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap hidden md:table-cell">Lessons Finished</th>
                  <th className="text-left py-4 px-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Global Progress</th>
                  <th className="text-center py-4 px-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Doubts</th>
                  <th className="text-center py-4 px-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Assets</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {learnerProgress.map((learner, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors group">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-purple-500/20 border border-purple-500/30 rounded-full flex items-center justify-center shrink-0 shadow-inner group-hover:bg-purple-500/30 transition-colors">
                          <User className="h-4 w-4 text-purple-300" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white tracking-wide">{learner.name}</p>
                          <p className="text-xs text-gray-400 font-medium">{learner.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-sm font-bold text-gray-300 hidden sm:table-cell">{learner.coursesEnrolled || 0}</td>
                    <td className="py-4 px-5 text-sm font-bold text-gray-300 hidden md:table-cell">{learner.lessonsCompleted || 0}</td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3 w-32">
                        <div className="flex-1 bg-black/40 rounded-full h-1.5 overflow-hidden shadow-inner border border-white/5">
                          <div
                            className="bg-purple-500 h-full shadow-[0_0_8px_rgba(168,85,247,0.6)]"
                            style={{ width: `${learner.progress || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-[10px] font-bold tracking-wider text-gray-300">{Math.round(learner.progress || 0)}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-sm font-bold text-orange-300 text-center bg-orange-500/5">{learner.doubtsRaised || 0}</td>
                    <td className="py-4 px-5 text-sm font-bold text-emerald-300 text-center">{learner.proofsSubmitted || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
