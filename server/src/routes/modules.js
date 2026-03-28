import express from 'express';
import prisma from '../db.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET /api/modules/:courseId - List modules for a course
router.get('/:courseId', authenticate, async (req, res) => {
  try {
    const course = await prisma.course.findUnique({
      where: { id: req.params.courseId },
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    if (req.user.role !== 'admin' && !course.isPublished) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    const modules = await prisma.module.findMany({
      where: { courseId: req.params.courseId },
      include: {
        lessons: {
          select: { id: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    const result = modules.map((mod) => ({
      ...mod,
      lessonsCount: mod.lessons.length,
      lessons: undefined,
    }));

    res.json({ modules: result });
  } catch (error) {
    console.error('List modules error:', error);
    res.status(500).json({ error: 'Failed to list modules.' });
  }
});

// POST /api/modules - Create module (admin)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { courseId, title, description, sortOrder } = req.body;

    if (!courseId || !title) {
      return res.status(400).json({ error: 'Course ID and title are required.' });
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    const mod = await prisma.module.create({
      data: {
        courseId,
        title,
        description: description || '',
        sortOrder: sortOrder || 0,
      },
    });

    res.status(201).json({ module: mod });
  } catch (error) {
    console.error('Create module error:', error);
    res.status(500).json({ error: 'Failed to create module.' });
  }
});

// PUT /api/modules/:id - Update module (admin)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { title, description, sortOrder } = req.body;

    const existing = await prisma.module.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Module not found.' });
    }

    const mod = await prisma.module.update({
      where: { id: req.params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    });

    res.json({ module: mod });
  } catch (error) {
    console.error('Update module error:', error);
    res.status(500).json({ error: 'Failed to update module.' });
  }
});

// DELETE /api/modules/:id - Delete module (admin)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const existing = await prisma.module.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Module not found.' });
    }

    await prisma.module.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Module deleted successfully.' });
  } catch (error) {
    console.error('Delete module error:', error);
    res.status(500).json({ error: 'Failed to delete module.' });
  }
});

export default router;
