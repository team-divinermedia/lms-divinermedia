import express from 'express';
import prisma from '../db.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Helper: Check if a lesson is unlocked for a learner.
// Unlock conditions (all must pass):
//   1. Scheduled unlock date has passed (if set).
//   2. The immediately previous lesson is marked complete.
//   3. If the previous lesson has a published assessment, the learner must have
//      submitted it. If they submit after the scheduled time, the lesson unlocks
//      immediately upon submission.
async function isLessonUnlocked(lessonId, userId) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
  });

  if (!lesson) return false;

  // 1. Scheduled unlock date gate (Mon–Fri 10 AM set by admin per lesson)
  if (lesson.unlockDate && new Date(lesson.unlockDate) > new Date()) {
    return false;
  }

  // Find the immediately previous lesson in the same module
  const prevLesson = await prisma.lesson.findFirst({
    where: {
      moduleId: lesson.moduleId,
      sortOrder: { lt: lesson.sortOrder },
    },
    orderBy: { sortOrder: 'desc' },
  });

  // First lesson in module — no gates beyond the unlock date
  if (!prevLesson) return true;

  // 2. Previous lesson must be marked complete
  const prevProgress = await prisma.lessonProgress.findUnique({
    where: {
      userId_lessonId: { userId, lessonId: prevLesson.id },
    },
  });

  if (!prevProgress?.isCompleted) return false;

  // 3. If previous lesson has a published assessment, learner must have submitted it
  const prevAssessments = await prisma.assessment.findMany({
    where: { lessonId: prevLesson.id, isPublished: true },
    select: { id: true },
  });

  if (prevAssessments.length > 0) {
    const submission = await prisma.assessmentSubmission.findFirst({
      where: {
        userId,
        assessmentId: { in: prevAssessments.map((a) => a.id) },
      },
    });
    if (!submission) return false;
  }

  return true;
}

// GET /api/lessons/:moduleId - List lessons for a module
router.get('/:moduleId', authenticate, async (req, res) => {
  try {
    const mod = await prisma.module.findUnique({
      where: { id: req.params.moduleId },
    });

    if (!mod) {
      return res.status(404).json({ error: 'Module not found.' });
    }

    const lessons = await prisma.lesson.findMany({
      where: { moduleId: req.params.moduleId },
      include: {
        lessonProgress: req.user.role === 'learner'
          ? { where: { userId: req.user.id } }
          : false,
      },
      orderBy: { sortOrder: 'asc' },
    });

    // For learners, add unlock status
    if (req.user.role === 'learner') {
      const lessonsWithUnlock = [];
      for (const lesson of lessons) {
        const unlocked = await isLessonUnlocked(lesson.id, req.user.id);
        lessonsWithUnlock.push({
          ...lesson,
          isUnlocked: unlocked,
        });
      }
      return res.json({ lessons: lessonsWithUnlock });
    }

    res.json({ lessons });
  } catch (error) {
    console.error('List lessons error:', error);
    res.status(500).json({ error: 'Failed to list lessons.' });
  }
});

// POST /api/lessons - Create lesson (admin)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { moduleId, title, description, videoUrl, notes, resources, sortOrder, unlockDate, isPublished } = req.body;

    if (!moduleId || !title) {
      return res.status(400).json({ error: 'Module ID and title are required.' });
    }

    const mod = await prisma.module.findUnique({
      where: { id: moduleId },
    });

    if (!mod) {
      return res.status(404).json({ error: 'Module not found.' });
    }

    const lesson = await prisma.lesson.create({
      data: {
        moduleId,
        title,
        description: description || '',
        videoUrl: videoUrl || '',
        notes: notes || '',
        resources: resources ? JSON.stringify(resources) : '[]',
        sortOrder: sortOrder || 0,
        unlockDate: unlockDate ? new Date(unlockDate) : null,
        isPublished: isPublished || false,
      },
    });

    res.status(201).json({ lesson });
  } catch (error) {
    console.error('Create lesson error:', error);
    res.status(500).json({ error: 'Failed to create lesson.' });
  }
});

// GET /api/lessons/detail/:id - Get lesson detail
router.get('/detail/:id', authenticate, async (req, res) => {
  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: req.params.id },
      include: {
        module: {
          include: { course: true },
        },
        lessonProgress: req.user.role === 'learner'
          ? { where: { userId: req.user.id } }
          : false,
        assessments: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found.' });
    }

    if (req.user.role !== 'admin' && !lesson.isPublished) {
      return res.status(404).json({ error: 'Lesson not found.' });
    }

    // Check unlock for learners
    if (req.user.role === 'learner') {
      const unlocked = await isLessonUnlocked(lesson.id, req.user.id);
      if (!unlocked) {
        return res.status(403).json({ error: 'This lesson is locked. Complete previous lessons first.', courseId: lesson.module?.courseId });
      }
    }

    // Fetch previous lesson
    const prevLesson = await prisma.lesson.findFirst({
      where: {
        moduleId: lesson.moduleId,
        sortOrder: { lt: lesson.sortOrder },
      },
      orderBy: { sortOrder: 'desc' },
      select: { id: true },
    });

    // Fetch next lesson
    const nextLesson = await prisma.lesson.findFirst({
      where: {
        moduleId: lesson.moduleId,
        sortOrder: { gt: lesson.sortOrder },
      },
      orderBy: { sortOrder: 'asc' },
      select: { id: true },
    });

    lesson.prevLessonId = prevLesson?.id || null;
    lesson.nextLessonId = nextLesson?.id || null;

    res.json({ lesson });
  } catch (error) {
    console.error('Get lesson detail error:', error);
    res.status(500).json({ error: 'Failed to get lesson.' });
  }
});

// PUT /api/lessons/:id - Update lesson (admin)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { title, description, videoUrl, notes, resources, sortOrder, unlockDate, isPublished } = req.body;

    const existing = await prisma.lesson.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Lesson not found.' });
    }

    const lesson = await prisma.lesson.update({
      where: { id: req.params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(videoUrl !== undefined && { videoUrl }),
        ...(notes !== undefined && { notes }),
        ...(resources !== undefined && { resources: JSON.stringify(resources) }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(unlockDate !== undefined && { unlockDate: unlockDate ? new Date(unlockDate) : null }),
        ...(isPublished !== undefined && { isPublished }),
      },
    });

    res.json({ lesson });
  } catch (error) {
    console.error('Update lesson error:', error);
    res.status(500).json({ error: 'Failed to update lesson.' });
  }
});

// DELETE /api/lessons/:id - Delete lesson (admin)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const existing = await prisma.lesson.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Lesson not found.' });
    }

    await prisma.lesson.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Lesson deleted successfully.' });
  } catch (error) {
    console.error('Delete lesson error:', error);
    res.status(500).json({ error: 'Failed to delete lesson.' });
  }
});

// POST /api/lessons/:id/progress - Update progress (learner)
router.post('/:id/progress', authenticate, async (req, res) => {
  try {
    const { lastWatchedPos, isCompleted } = req.body;

    const lesson = await prisma.lesson.findUnique({
      where: { id: req.params.id },
    });

    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found.' });
    }

    const existingProgress = await prisma.lessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId: req.user.id,
          lessonId: req.params.id,
        },
      },
    });

    const data = {};
    if (lastWatchedPos !== undefined) data.lastWatchedPos = lastWatchedPos;
    if (isCompleted !== undefined) {
      data.isCompleted = isCompleted;
      if (isCompleted && (!existingProgress || !existingProgress.isCompleted)) {
        data.completedAt = new Date();
      }
    }

    let progress;
    if (existingProgress) {
      progress = await prisma.lessonProgress.update({
        where: { id: existingProgress.id },
        data,
      });
    } else {
      progress = await prisma.lessonProgress.create({
        data: {
          userId: req.user.id,
          lessonId: req.params.id,
          ...data,
        },
      });
    }

    res.json({ progress });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ error: 'Failed to update progress.' });
  }
});

// GET /api/lessons/:id/progress - Get progress for a lesson
router.get('/:id/progress', authenticate, async (req, res) => {
  try {
    const progress = await prisma.lessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId: req.user.id,
          lessonId: req.params.id,
        },
      },
    });

    res.json({ progress: progress || null });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ error: 'Failed to get progress.' });
  }
});

export default router;
