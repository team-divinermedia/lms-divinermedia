import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../db.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { uploadFileToDrive } from '../utils/drive.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const uploadDir = process.env.UPLOAD_DIR || './uploads';
const absoluteUploadDir = path.resolve(__dirname, '../../../', uploadDir);
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(absoluteUploadDir, 'courses');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// GET /api/courses - List courses
router.get('/', authenticate, async (req, res) => {
  try {
    const where = req.user.role === 'admin' ? {} : { isPublished: true };

    const courses = await prisma.course.findMany({
      where,
      include: {
        modules: {
          select: { id: true, lessons: { select: { id: true } } },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    const result = courses.map((course) => ({
      ...course,
      modulesCount: course.modules.length,
      lessonsCount: course.modules.reduce((sum, m) => sum + (m.lessons?.length || 0), 0),
      modules: undefined,
    }));

    res.json({ courses: result });
  } catch (error) {
    console.error('List courses error:', error);
    res.status(500).json({ error: 'Failed to list courses.' });
  }
});

// POST /api/courses - Create course (admin only)
router.post('/', authenticate, requireAdmin, upload.single('thumbnail'), async (req, res) => {
  try {
    const { title, description, isPublished, sortOrder } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required.' });
    }

    let thumbnailUrl = '';
    if (req.file) {
      try {
        const driveFileId = await uploadFileToDrive(req.file.path, req.file.originalname, req.file.mimetype);
        thumbnailUrl = `/api/files/${driveFileId}`;
        fs.unlinkSync(req.file.path);
      } catch (err) {
        thumbnailUrl = `/uploads/courses/${req.file.filename}`;
      }
    }

    const course = await prisma.course.create({
      data: {
        title,
        description: description || '',
        thumbnail: thumbnailUrl,
        isPublished: isPublished === 'true' || isPublished === true,
        sortOrder: sortOrder ? Number(sortOrder) : 0,
      },
    });

    res.status(201).json({ course });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ error: 'Failed to create course.' });
  }
});

// GET /api/courses/:id - Get course with modules and lessons
router.get('/:id', authenticate, async (req, res) => {
  try {
    const course = await prisma.course.findUnique({
      where: { id: req.params.id },
      include: {
        modules: {
          orderBy: { sortOrder: 'asc' },
          include: {
            lessons: {
              orderBy: { sortOrder: 'asc' },
              include: {
                lessonProgress: req.user.role === 'learner'
                  ? { where: { userId: req.user.id } }
                  : false,
              },
            },
          },
        },
      },
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    if (req.user.role !== 'admin' && !course.isPublished) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    res.json({ course });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ error: 'Failed to get course.' });
  }
});

// PUT /api/courses/:id - Update course (admin)
router.put('/:id', authenticate, requireAdmin, upload.single('thumbnail'), async (req, res) => {
  try {
    const { title, description, isPublished, sortOrder } = req.body;

    const existing = await prisma.course.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    let thumbnailUrl;
    if (req.file) {
      try {
        const driveFileId = await uploadFileToDrive(req.file.path, req.file.originalname, req.file.mimetype);
        thumbnailUrl = `/api/files/${driveFileId}`;
        fs.unlinkSync(req.file.path);
      } catch (err) {
        thumbnailUrl = `/uploads/courses/${req.file.filename}`;
      }
    }

    const course = await prisma.course.update({
      where: { id: req.params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(thumbnailUrl !== undefined && { thumbnail: thumbnailUrl }),
        ...(isPublished !== undefined && { isPublished: isPublished === 'true' || isPublished === true }),
        ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
      },
    });

    res.json({ course });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ error: 'Failed to update course.' });
  }
});

// DELETE /api/courses/:id - Delete course (admin)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const existing = await prisma.course.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    await prisma.course.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Course deleted successfully.' });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ error: 'Failed to delete course.' });
  }
});

export default router;
