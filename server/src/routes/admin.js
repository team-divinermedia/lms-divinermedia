import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../db.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { sendInviteEmail } from '../utils/email.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate, requireAdmin);

// POST /api/admin/invites - Send invite
router.post('/invites', async (req, res) => {
  try {
    const { email, role, expiresInDays } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email already exists.' });
    }

    // Check if there's an existing unused invite
    const existingInvite = await prisma.invite.findUnique({
      where: { email },
    });

    if (existingInvite && !existingInvite.used) {
      return res.status(400).json({ error: 'An active invite for this email already exists.' });
    }

    // If there's a used invite, delete it to allow re-invite
    if (existingInvite && existingInvite.used) {
      await prisma.invite.delete({
        where: { id: existingInvite.id },
      });
    }

    const token = uuidv4();
    const days = expiresInDays || 7;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const invite = await prisma.invite.create({
      data: {
        email,
        role: role || 'learner',
        token,
        expiresAt,
      },
    });

    await sendInviteEmail(email, token);

    res.status(201).json({ invite });
  } catch (error) {
    console.error('Create invite error:', error);
    res.status(500).json({ error: 'Failed to create invite.' });
  }
});

// GET /api/admin/invites - List all invites
router.get('/invites', async (req, res) => {
  try {
    const invites = await prisma.invite.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
    const withStatus = invites.map((invite) => ({
      ...invite,
      status: invite.used ? 'used' : new Date(invite.expiresAt) < now ? 'expired' : 'pending',
    }));

    res.json({ invites: withStatus });
  } catch (error) {
    console.error('List invites error:', error);
    res.status(500).json({ error: 'Failed to list invites.' });
  }
});

// DELETE /api/admin/invites/:id - Delete invite
router.delete('/invites/:id', async (req, res) => {
  try {
    const existing = await prisma.invite.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Invite not found.' });
    }

    await prisma.invite.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Invite deleted successfully.' });
  } catch (error) {
    console.error('Delete invite error:', error);
    res.status(500).json({ error: 'Failed to delete invite.' });
  }
});

// GET /api/admin/learners - List all learners with progress summary
router.get('/learners', async (req, res) => {
  try {
    const learners = await prisma.user.findMany({
      where: { role: 'learner' },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        accessExpiry: true,
        lastActiveAt: true,
        createdAt: true,
        lessonProgress: {
          select: {
            isCompleted: true,
            lessonId: true,
          },
        },
        assessmentSubmissions: {
          select: {
            id: true,
            status: true,
            score: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalLessons = await prisma.lesson.count({
      where: { isPublished: true },
    });

    const result = learners.map((learner) => {
      const completedLessons = learner.lessonProgress.filter((p) => p.isCompleted).length;
      const gradedSubmissions = learner.assessmentSubmissions.filter((s) => s.score !== null);
      const avgScore = gradedSubmissions.length > 0
        ? gradedSubmissions.reduce((sum, s) => sum + s.score, 0) / gradedSubmissions.length
        : null;

      return {
        id: learner.id,
        email: learner.email,
        name: learner.name,
        isActive: learner.isActive,
        accessExpiry: learner.accessExpiry,
        lastActiveAt: learner.lastActiveAt,
        createdAt: learner.createdAt,
        completedLessons,
        totalLessons,
        progressPercent: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
        totalSubmissions: learner.assessmentSubmissions.length,
        averageScore: avgScore !== null ? Math.round(avgScore * 100) / 100 : null,
      };
    });

    res.json({ learners: result });
  } catch (error) {
    console.error('List learners error:', error);
    res.status(500).json({ error: 'Failed to list learners.' });
  }
});

// PUT /api/admin/learners/:id - Update learner
router.put('/learners/:id', async (req, res) => {
  try {
    const { isActive, accessExpiry, name } = req.body;

    const existing = await prisma.user.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Learner not found.' });
    }

    if (existing.role !== 'learner') {
      return res.status(400).json({ error: 'Can only update learner accounts.' });
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...(isActive !== undefined && { isActive }),
        ...(accessExpiry !== undefined && { accessExpiry: accessExpiry ? new Date(accessExpiry) : null }),
        ...(name !== undefined && { name }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        accessExpiry: true,
        lastActiveAt: true,
        createdAt: true,
      },
    });

    res.json({ user });
  } catch (error) {
    console.error('Update learner error:', error);
    res.status(500).json({ error: 'Failed to update learner.' });
  }
});

// GET /api/admin/stats - Dashboard stats (compact)
router.get('/stats', async (req, res) => {
  try {
    const [totalLearners, activeCourses, pendingAssessments, openDoubts, pendingProofs] = await Promise.all([
      prisma.user.count({ where: { role: 'learner' } }),
      prisma.course.count({ where: { isPublished: true } }),
      prisma.assessmentSubmission.count({ where: { status: 'submitted' } }),
      prisma.doubt.count({ where: { status: 'open' } }),
      prisma.portfolioProof.count({ where: { status: 'pending' } }),
    ]);
    res.json({ totalLearners, activeCourses, pendingAssessments, openDoubts, pendingProofs });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to load stats.' });
  }
});

// GET /api/admin/reports/overview - Dashboard stats
router.get('/reports/overview', async (req, res) => {
  try {
    const [
      totalLearners,
      activeLearners,
      totalCourses,
      publishedCourses,
      totalLessons,
      totalModules,
      totalAssessments,
      totalSubmissions,
      openDoubts,
      totalDoubts,
      pendingProofs,
      totalProofs,
      completedLessons,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'learner' } }),
      prisma.user.count({ where: { role: 'learner', isActive: true } }),
      prisma.course.count(),
      prisma.course.count({ where: { isPublished: true } }),
      prisma.lesson.count(),
      prisma.module.count(),
      prisma.assessment.count(),
      prisma.assessmentSubmission.count(),
      prisma.doubt.count({ where: { status: 'open' } }),
      prisma.doubt.count(),
      prisma.portfolioProof.count({ where: { status: 'pending' } }),
      prisma.portfolioProof.count(),
      prisma.lessonProgress.count({ where: { isCompleted: true } }),
    ]);

    res.json({
      overview: {
        totalLearners,
        activeLearners,
        totalCourses,
        publishedCourses,
        totalLessons,
        totalModules,
        totalAssessments,
        totalSubmissions,
        completedLessons,
        openDoubts,
        totalDoubts,
        pendingProofs,
        totalProofs,
      },
    });
  } catch (error) {
    console.error('Reports overview error:', error);
    res.status(500).json({ error: 'Failed to get overview.' });
  }
});

// GET /api/admin/reports/weak-topics - Doubts per lesson, sorted desc
router.get('/reports/weak-topics', async (req, res) => {
  try {
    const lessons = await prisma.lesson.findMany({
      include: {
        doubts: {
          select: { id: true },
        },
        module: {
          select: {
            id: true,
            title: true,
            course: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    const weakTopics = lessons
      .map((lesson) => ({
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        moduleTitle: lesson.module.title,
        courseTitle: lesson.module.course.title,
        doubtCount: lesson.doubts.length,
      }))
      .filter((t) => t.doubtCount > 0)
      .sort((a, b) => b.doubtCount - a.doubtCount);

    res.json({ weakTopics });
  } catch (error) {
    console.error('Weak topics error:', error);
    res.status(500).json({ error: 'Failed to get weak topics.' });
  }
});

// GET /api/admin/reports/learner-progress - Per-learner progress details
router.get('/reports/learner-progress', async (req, res) => {
  try {
    const learners = await prisma.user.findMany({
      where: { role: 'learner' },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        lastActiveAt: true,
        lessonProgress: {
          include: {
            lesson: {
              select: {
                id: true,
                title: true,
                module: {
                  select: {
                    id: true,
                    title: true,
                    course: {
                      select: {
                        id: true,
                        title: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        assessmentSubmissions: {
          include: {
            assessment: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        doubts: {
          select: {
            id: true,
            status: true,
          },
        },
        portfolioProofs: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const totalLessons = await prisma.lesson.count({
      where: { isPublished: true },
    });

    const result = learners.map((learner) => {
      const completedLessons = learner.lessonProgress.filter((p) => p.isCompleted).length;
      const submissions = learner.assessmentSubmissions;
      const gradedSubmissions = submissions.filter((s) => s.score !== null);
      const avgScore = gradedSubmissions.length > 0
        ? gradedSubmissions.reduce((sum, s) => sum + s.score, 0) / gradedSubmissions.length
        : null;

      return {
        id: learner.id,
        email: learner.email,
        name: learner.name,
        isActive: learner.isActive,
        lastActiveAt: learner.lastActiveAt,
        completedLessons,
        totalLessons,
        progressPercent: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
        totalSubmissions: submissions.length,
        averageScore: avgScore !== null ? Math.round(avgScore * 100) / 100 : null,
        totalDoubts: learner.doubts.length,
        openDoubts: learner.doubts.filter((d) => d.status === 'open').length,
        totalProofs: learner.portfolioProofs.length,
        approvedProofs: learner.portfolioProofs.filter((p) => p.status === 'approved').length,
        lessonProgress: learner.lessonProgress,
        assessmentSubmissions: learner.assessmentSubmissions,
      };
    });

    res.json({ learnerProgress: result });
  } catch (error) {
    console.error('Learner progress error:', error);
    res.status(500).json({ error: 'Failed to get learner progress.' });
  }
});

export default router;
