import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import {
  Users, BookOpen, ClipboardList, MessageSquare, Award,
  Plus, AlertCircle, TrendingUp, Mail, Activity
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, activityRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/activity/recent').catch(() => ({ data: [] })),
        ]);
        setStats(statsRes.data);
        setRecentActivity(Array.isArray(activityRes.data) ? activityRes.data : []);
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
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-500 border-t-transparent shadow-[0_0_15px_rgba(236,72,153,0.5)]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center glass-panel p-8 rounded-3xl border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
          <AlertCircle className="h-14 w-14 text-pink-500 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(236,72,153,0.5)]" />
          <p className="text-red-200 font-bold tracking-wide">{error}</p>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Interns', value: stats?.totalLearners || 0, icon: Users, grad: 'from-purple-500 to-indigo-500', shadow: 'shadow-purple-500/30', to: '/admin/learners' },
    { label: 'Active Modules', value: stats?.activeCourses || 0, icon: BookOpen, grad: 'from-cyan-400 to-blue-500', shadow: 'shadow-cyan-500/30', to: '/admin/courses' },
    { label: 'Review Queue', value: stats?.pendingAssessments || 0, icon: ClipboardList, grad: 'from-orange-400 to-pink-500', shadow: 'shadow-orange-500/30', to: '/admin/courses' },
    { label: 'Open Doubts', value: stats?.openDoubts || 0, icon: MessageSquare, grad: 'from-pink-500 to-rose-500', shadow: 'shadow-pink-500/30', to: '/admin/doubts' },
    { label: 'Pending Portfolios', value: stats?.pendingProofs || 0, icon: Award, grad: 'from-emerald-400 to-teal-500', shadow: 'shadow-emerald-500/30', to: '/admin/proofs' },
  ];

  const quickActions = [
    { label: 'Create Curriculum', icon: Plus, to: '/admin/courses/new', bg: 'bg-purple-600/20 hover:bg-purple-600/40 border-purple-500/30 text-purple-300 shadow-purple-500/20' },
    { label: 'Recruit Interns', icon: Mail, to: '/admin/invites', bg: 'bg-cyan-600/20 hover:bg-cyan-600/40 border-cyan-500/30 text-cyan-300 shadow-cyan-500/20' },
    { label: 'Performance Metrics', icon: TrendingUp, to: '/admin/reports', bg: 'bg-pink-600/20 hover:bg-pink-600/40 border-pink-500/30 text-pink-300 shadow-pink-500/20' },
  ];

  return (
    <div className="space-y-10 relative">
      <div className="absolute -top-20 -right-20 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-pink-300 mb-4 backdrop-blur-md uppercase tracking-[0.15em] shadow-inner">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
            </span>
            Director Interface Access Granted
          </div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-tight">Diviner Command Center</h1>
          <p className="text-purple-300/70 mt-2 font-semibold">Global overview of training progress and content pipelines</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 relative z-10">
        {statCards.map((card) => (
          <Link
            key={card.label}
            to={card.to}
            className="glass-panel rounded-3xl p-6 relative overflow-hidden group hover:-translate-y-1 hover:border-white/30 transition-all duration-300 flex flex-col items-start"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${card.grad} opacity-[0.05] group-hover:opacity-10 transition-opacity duration-300`}></div>
            <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${card.grad} shadow-lg ${card.shadow} flex items-center justify-center mb-5 border border-white/20 group-hover:scale-110 transition-transform duration-300`}>
              <card.icon className="h-6 w-6 text-white" />
            </div>
            <p className="text-4xl font-black text-white drop-shadow-md mb-1">{card.value}</p>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{card.label}</p>
          </Link>
        ))}
      </div>

      <div className="relative z-10">
        <h2 className="text-xl font-bold text-white mb-6 tracking-wide drop-shadow-md flex items-center gap-3">
          <Activity className="h-6 w-6 text-purple-400" />
          Rapid Deployment
        </h2>
        <div className="flex flex-wrap gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              to={action.to}
              className={`inline-flex items-center gap-3 px-6 py-3.5 backdrop-blur-md border rounded-2xl text-sm font-bold transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${action.bg}`}
            >
              <action.icon className="h-5 w-5 opacity-90" />
              <span className="uppercase tracking-widest">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {recentActivity.length > 0 && (
        <div className="pt-4 relative z-10">
          <h2 className="text-xl font-bold text-white mb-6 tracking-wide drop-shadow-md flex items-center gap-3">
            <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Global Intern Activity Stream
          </h2>
          <div className="glass-panel rounded-3xl border border-white/10 divide-y divide-white/5 shadow-2xl">
            {recentActivity.slice(0, 10).map((activity, idx) => (
              <div key={idx} className="px-6 py-5 flex items-center gap-5 hover:bg-white/5 transition-colors first:rounded-t-3xl last:rounded-b-3xl">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center shrink-0 shadow-inner">
                  <Users className="h-6 w-6 text-purple-300 opacity-80" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-gray-200 truncate">{activity.description || activity.title}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    {activity.userName && (
                      <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[10px] uppercase font-bold tracking-wider border border-purple-500/20">
                        {activity.userName}
                      </span>
                    )}
                    <span className="text-xs text-gray-500 font-medium tracking-wide">
                      {new Date(activity.createdAt || activity.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
