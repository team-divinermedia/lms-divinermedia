import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ReactPlayer from 'react-player';
import api from '../../api/axios';
import {
  ChevronRight, ChevronLeft, CheckCircle, FileText, Download,
  MessageSquare, ClipboardList, AlertCircle, BookOpen
} from 'lucide-react';

// Smart video player: YouTube iframe for YT URLs, ReactPlayer for everything else
function VideoPlayer({ url, onProgress, onPause, playerRef, progressInterval }) {
  const getYouTubeId = (rawUrl) => {
    if (!rawUrl) return null;
    const match = rawUrl.trim().match(
      /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
    );
    return match ? match[1] : null;
  };

  const ytId = getYouTubeId(url);

  if (ytId) {
    return (
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${ytId}?modestbranding=1&rel=0`}
        title="Lesson Video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        style={{ width: '100%', height: '100%', border: 'none' }}
      />
    );
  }

  // Fallback: ReactPlayer for Vimeo, direct video files, etc.
  return (
    <ReactPlayer
      ref={playerRef}
      url={url}
      width="100%"
      height="100%"
      controls
      onProgress={onProgress}
      onPause={onPause}
      progressInterval={progressInterval}
    />
  );
}

export default function LessonViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const playerRef = useRef(null);
  const [lesson, setLesson] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completing, setCompleting] = useState(false);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const lastSavedTime = useRef(0);
  const playerReadyRef = useRef(false);
  const hasSeekRef = useRef(false);

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        const [lessonRes, progressRes] = await Promise.all([
          api.get(`/lessons/detail/${id}`),
          api.get(`/lessons/${id}/progress`).catch(() => ({ data: null })),
        ]);
        const lessonData = lessonRes.data.lesson || lessonRes.data;
        setLesson(lessonData);
        const prog = progressRes.data?.progress || progressRes.data;
        if (prog) {
          setProgress(prog);
        }
      } catch (err) {
        setError(err.response?.data?.error || err.response?.data?.message || 'Failed to load lesson');
        if (err.response?.data?.courseId || err.response?.data?.lesson?.module?.courseId) {
          setLesson({ isErrorContext: true, courseId: err.response?.data?.courseId });
        }
      } finally {
        setLoading(false);
      }
    };
    fetchLesson();
  }, [id]);

  const saveVideoProgress = useCallback(async (playedSeconds) => {
    if (Math.abs(playedSeconds - lastSavedTime.current) < 10) return;
    lastSavedTime.current = playedSeconds;
    try {
      await api.post(`/lessons/${id}/progress`, { lastWatchedPos: Math.floor(playedSeconds) });
    } catch {
      // silent fail for progress save
    }
  }, [id]);

  const handleProgress = useCallback(({ playedSeconds }) => {
    saveVideoProgress(playedSeconds);
  }, [saveVideoProgress]);

  const handlePause = useCallback(() => {
    if (playerRef.current) {
      const currentTime = playerRef.current.getCurrentTime();
      saveVideoProgress(currentTime);
    }
  }, [saveVideoProgress]);

  const seekToSavedPos = useCallback((pos) => {
    if (!hasSeekRef.current && pos && playerRef.current) {
      playerRef.current.seekTo(pos, 'seconds');
      hasSeekRef.current = true;
    }
  }, []);

  const handleReady = useCallback(() => {
    playerReadyRef.current = true;
    seekToSavedPos(progress?.lastWatchedPos);
  }, [progress, seekToSavedPos]);

  useEffect(() => {
    if (playerReadyRef.current && progress?.lastWatchedPos) {
      seekToSavedPos(progress.lastWatchedPos);
    }
  }, [progress, seekToSavedPos]);

  useEffect(() => {
    playerReadyRef.current = false;
    hasSeekRef.current = false;
  }, [id]);

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await api.post(`/lessons/${id}/progress`, { isCompleted: true });
      setProgress((prev) => ({ ...prev, isCompleted: true }));
      setLesson((prev) => ({ ...prev, isCompleted: true }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark as complete');
    } finally {
      setCompleting(false);
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await api.post(`/lessons/${id}/progress`, { lastWatchedPos: progress?.lastWatchedPos || 0 });
    } catch {
      // silent
    } finally {
      setSavingNotes(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-400 border-t-transparent shadow-[0_0_15px_rgba(168,85,247,0.5)]"></div>
      </div>
    );
  }

  if (error && (!lesson || lesson.isErrorContext)) {
    return (
      <div className="flex items-center justify-center py-20 px-4">
        <div className="text-center glass-panel p-8 rounded-3xl border border-white/10 max-w-md w-full">
          <BookOpen className="h-14 w-14 text-purple-400 mx-auto mb-4 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
          <h2 className="text-xl font-bold text-white mb-2">Lesson Locked</h2>
          <p className="text-gray-400 mb-6 leading-relaxed">{error}</p>
          <div className="flex justify-center gap-4">
            {lesson?.courseId ? (
              <Link
                to={`/courses/${lesson.courseId}`}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-sm font-medium rounded-xl transition shadow-[0_0_15px_rgba(168,85,247,0.3)]"
              >
                Back to Course
              </Link>
            ) : (
              <Link
                to="/dashboard"
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-sm font-medium rounded-xl transition shadow-[0_0_15px_rgba(168,85,247,0.3)]"
              >
                Back to Dashboard
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        {lesson.module?.courseId && (
          <>
            <Link to={`/courses/${lesson.module.courseId}`} className="hover:text-purple-400 transition-colors">
              {lesson.module?.course?.title || 'Course'}
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span>{lesson.module?.title}</span>
            <ChevronRight className="h-3 w-3" />
          </>
        )}
        <span className="text-gray-300 font-medium">{lesson.title}</span>
      </div>

      {/* Video */}
      {lesson.videoUrl && (
        <div className="bg-black rounded-2xl overflow-hidden aspect-video shadow-[0_0_30px_rgba(0,0,0,0.5)]">
          <VideoPlayer
            url={lesson.videoUrl.trim()}
            playerRef={playerRef}
            onProgress={handleProgress}
            onPause={handlePause}
            progressInterval={5000}
          />
        </div>
      )}

      {/* Lesson Info */}
      <div className="glass-panel rounded-2xl border border-white/10 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white">{lesson.title}</h1>
            {lesson.description && (
              <p className="text-gray-400 mt-1 text-sm leading-relaxed">{lesson.description}</p>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {lesson.assessments?.length > 0 && (
              <Link
                to={`/assessments/${lesson.assessments[0].id}`}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-xl transition-colors"
              >
                <ClipboardList className="h-4 w-4" />
                Assessment
              </Link>
            )}
            <Link
              to={`/doubts/new?lessonId=${id}`}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-300 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors"
            >
              <MessageSquare className="h-4 w-4" />
              Raise Doubt
            </Link>
          </div>
        </div>
      </div>

      {/* Lesson Notes */}
      {lesson.notes && (
        <div className="glass-panel rounded-2xl border border-white/10 p-6">
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-400" />
            Lesson Notes
          </h2>
          <div className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">{lesson.notes}</div>
        </div>
      )}

      {/* My Notes */}
      <div className="glass-panel rounded-2xl border border-white/10 p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white">My Notes</h2>
          <button
            onClick={handleSaveNotes}
            disabled={savingNotes}
            className="text-sm font-medium text-purple-400 hover:text-purple-300 disabled:opacity-50 transition-colors"
          >
            {savingNotes ? 'Saving...' : 'Save Notes'}
          </button>
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-sm resize-none text-gray-300 placeholder-gray-600 transition-all"
          placeholder="Write your notes here..."
        />
      </div>

      {/* Resources */}
      {(() => {
        let resources = lesson.resources;
        if (typeof resources === 'string') {
          try { resources = JSON.parse(resources); } catch { resources = []; }
        }
        return resources && resources.length > 0 ? (
          <div className="glass-panel rounded-2xl border border-white/10 p-6">
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Download className="h-5 w-5 text-cyan-400" />
              Resources
            </h2>
            <div className="space-y-2">
              {resources.map((resource, idx) => (
                <a
                  key={idx}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={resource.title || resource.name || true}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group border border-transparent hover:border-white/10"
                >
                  <div className="h-10 w-10 bg-purple-500/20 border border-purple-500/30 rounded-xl flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-300 group-hover:text-white truncate transition-colors">
                      {resource.title || resource.name || `Resource ${idx + 1}`}
                    </p>
                    {resource.type && <p className="text-xs text-gray-500 mt-0.5 uppercase">{resource.type}</p>}
                  </div>
                  <Download className="h-4 w-4 text-gray-500 group-hover:text-cyan-400 shrink-0 transition-colors" />
                </a>
              ))}
            </div>
          </div>
        ) : null;
      })()}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          {lesson.prevLessonId && (
            <Link
              to={`/lessons/${lesson.prevLessonId}`}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-300 glass-panel border border-white/10 hover:bg-white/10 rounded-xl transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Link>
          )}
          {lesson.nextLessonId && (
            <Link
              to={`/lessons/${lesson.nextLessonId}`}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl transition-colors shadow-[0_0_15px_rgba(168,85,247,0.3)]"
            >
              Next Lesson
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        {!lesson.isCompleted && !progress?.isCompleted && (
          <button
            onClick={handleComplete}
            disabled={completing}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl transition-colors disabled:opacity-50 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
          >
            <CheckCircle className="h-4 w-4" />
            {completing ? 'Marking...' : 'Mark as Complete'}
          </button>
        )}

        {(lesson.isCompleted || progress?.isCompleted) && (
          <span className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
            <CheckCircle className="h-5 w-5" />
            Completed
          </span>
        )}
      </div>
    </div>
  );
}
