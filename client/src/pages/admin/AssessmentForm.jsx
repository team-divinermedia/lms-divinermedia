import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { ClipboardList, AlertCircle, ChevronRight, Plus, Trash2 } from 'lucide-react';

export default function AssessmentForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [title, setTitle] = useState('');
  const [timeLimit, setTimeLimit] = useState('');
  const [targetType, setTargetType] = useState('lesson');
  const [targetId, setTargetId] = useState('');
  const [questions, setQuestions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const coursesRes = await api.get('/courses');
        setCourses(Array.isArray(coursesRes.data) ? coursesRes.data : coursesRes.data.courses || []);

        if (isEdit) {
          const res = await api.get(`/assessments/detail/${id}`);
          const assessment = res.data.assessment || res.data;
          setTitle(assessment.title || '');
          setTimeLimit(assessment.timeLimit || '');
          setTargetType(assessment.targetType || 'lesson');
          setTargetId(assessment.targetId || assessment.lessonId || assessment.moduleId || '');
          setQuestions(assessment.questions || []);
          if (assessment.courseId) setSelectedCourse(assessment.courseId);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, isEdit]);

  useEffect(() => {
    if (selectedCourse) {
      const fetchTargets = async () => {
        try {
          if (targetType === 'lesson') {
            const courseRes = await api.get(`/courses/${selectedCourse}`);
            const course = courseRes.data.course || courseRes.data;
            const mods = course.modules || [];
            const allLessons = mods.flatMap((m) => (m.lessons || []).map((l) => ({ ...l, moduleName: m.title })));
            setTargets(allLessons);
          } else {
            const modulesRes = await api.get(`/modules/${selectedCourse}`);
            const mods = Array.isArray(modulesRes.data) ? modulesRes.data : modulesRes.data.modules || [];
            setTargets(mods);
          }
        } catch {
          setTargets([]);
        }
      };
      fetchTargets();
    } else {
      setTargets([]);
    }
  }, [selectedCourse, targetType]);

  const addQuestion = () => {
    setQuestions([...questions, { type: 'short_answer', content: '', options: [] }]);
  };

  const updateQuestion = (idx, field, value) => {
    const updated = [...questions];
    updated[idx] = { ...updated[idx], [field]: value };
    setQuestions(updated);
  };

  const removeQuestion = (idx) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const addOption = (qIdx) => {
    const updated = [...questions];
    updated[qIdx].options = [...(updated[qIdx].options || []), ''];
    setQuestions(updated);
  };

  const updateOption = (qIdx, oIdx, value) => {
    const updated = [...questions];
    updated[qIdx].options[oIdx] = value;
    setQuestions(updated);
  };

  const removeOption = (qIdx, oIdx) => {
    const updated = [...questions];
    updated[qIdx].options = updated[qIdx].options.filter((_, i) => i !== oIdx);
    setQuestions(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const data = {
        title,
        timeLimit: timeLimit ? Number(timeLimit) : null,
        ...(targetType === 'lesson' ? { lessonId: targetId } : { moduleId: targetId }),
        questions,
      };

      if (isEdit) {
        await api.put(`/assessments/${id}`, data);
      } else {
        await api.post('/assessments', data);
      }
      navigate('/admin/courses');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save assessment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button onClick={() => navigate('/admin/courses')} className="hover:text-purple-600">Courses</button>
        <ChevronRight className="h-3 w-3" />
        <span className="text-gray-900 font-medium">{isEdit ? 'Edit Assessment' : 'New Assessment'}</span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <ClipboardList className="h-5 w-5 text-purple-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">{isEdit ? 'Edit Assessment' : 'Create Assessment'}</h1>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
              placeholder="Assessment title"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Course</label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
              >
                <option value="">Select course</option>
                {courses.map((c) => (
                  <option key={c._id || c.id} value={c._id || c.id}>{c.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Target Type</label>
              <select
                value={targetType}
                onChange={(e) => { setTargetType(e.target.value); setTargetId(''); }}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
              >
                <option value="lesson">Lesson</option>
                <option value="module">Module</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Target</label>
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                disabled={!selectedCourse}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm disabled:bg-gray-100"
              >
                <option value="">Select {targetType}</option>
                {targets.map((t) => (
                  <option key={t._id || t.id} value={t._id || t.id}>{t.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Time Limit (minutes)</label>
            <input
              type="number"
              value={timeLimit}
              onChange={(e) => setTimeLimit(e.target.value)}
              min="0"
              className="w-32 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground mt-1">Leave empty for no time limit</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-medium text-gray-700">Questions</label>
              <button
                type="button"
                onClick={addQuestion}
                className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                <Plus className="h-4 w-4" />
                Add Question
              </button>
            </div>

            {questions.length === 0 && (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-sm text-muted-foreground">No questions yet. Click "Add Question" to start.</p>
              </div>
            )}

            {questions.map((q, idx) => (
              <div key={idx} className="p-4 border border-gray-200 rounded-xl mb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-purple-600">Question {idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeQuestion(idx)}
                    className="p-1 text-muted-foreground hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  <select
                    value={q.type}
                    onChange={(e) => updateQuestion(idx, 'type', e.target.value)}
                    className="w-48 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="short_answer">Short Answer</option>
                    <option value="mcq">Multiple Choice</option>
                    <option value="voice_note">Voice Note</option>
                  </select>

                  <textarea
                    value={q.content}
                    onChange={(e) => updateQuestion(idx, 'content', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                    placeholder="Question text..."
                  />

                  {q.type === 'mcq' && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Options</p>
                      {(q.options || []).map((opt, oIdx) => (
                        <div key={oIdx} className="flex gap-2">
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => updateOption(idx, oIdx, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            placeholder={`Option ${oIdx + 1}`}
                          />
                          <button
                            type="button"
                            onClick={() => removeOption(idx, oIdx)}
                            className="p-2 text-muted-foreground hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addOption(idx)}
                        className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                      >
                        + Add Option
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/admin/courses')}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
            >
              {submitting ? 'Saving...' : isEdit ? 'Update Assessment' : 'Create Assessment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
