import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import prisma from '../db.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { uploadFileToDrive } from '../utils/drive.js';
import { sendDiscordNotification } from '../utils/discord.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const uploadDir = process.env.UPLOAD_DIR || './uploads';
const absoluteUploadDir = path.resolve(__dirname, '../../../', uploadDir);
if (!fs.existsSync(absoluteUploadDir)) {
  fs.mkdirSync(absoluteUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const doubtDir = path.join(absoluteUploadDir, 'doubts');
    if (!fs.existsSync(doubtDir)) {
      fs.mkdirSync(doubtDir, { recursive: true });
    }
    cb(null, doubtDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// GET /api/doubts - List doubts
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, lessonId, moduleId } = req.query;

    const where = {};

    if (req.user.role !== 'admin') {
      where.userId = req.user.id;
    }

    if (status) where.status = status;
    if (lessonId) where.lessonId = lessonId;
    if (moduleId) where.moduleId = moduleId;

    const doubts = await prisma.doubt.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        lesson: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ doubts });
  } catch (error) {
    console.error('List doubts error:', error);
    res.status(500).json({ error: 'Failed to list doubts.' });
  }
});

// POST /api/doubts - Create doubt (learner)
router.post('/', authenticate, upload.single('screenshot'), async (req, res) => {
  try {
    const { lessonId, moduleId, title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required.' });
    }

    let attachmentUrl = '';
    if (req.file) {
      try {
        const driveFileId = await uploadFileToDrive(req.file.path, req.file.originalname, req.file.mimetype);
        attachmentUrl = `/api/files/${driveFileId}`;
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.warn('Drive upload failed, falling back to local storage', err);
        attachmentUrl = `/uploads/doubts/${req.file.filename}`;
      }
    }

    const doubt = await prisma.doubt.create({
      data: {
        userId: req.user.id,
        lessonId: lessonId || null,
        moduleId: moduleId || null,
        title,
        description,
        attachment: attachmentUrl,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        lesson: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    sendDiscordNotification(
      'New Doubt Submitted',
      `**Title:** ${title}\n**From:** ${doubt.user.name} (${doubt.user.email})`,
      0x5865F2
    );

    res.status(201).json({ doubt });
  } catch (error) {
    console.error('Create doubt error:', error);
    res.status(500).json({ error: 'Failed to create doubt.' });
  }
});

// GET /api/doubts/:id - Get doubt detail
router.get('/:id', authenticate, async (req, res) => {
  try {
    const doubt = await prisma.doubt.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        lesson: {
          select: {
            id: true,
            title: true,
            moduleId: true,
          },
        },
      },
    });

    if (!doubt) {
      return res.status(404).json({ error: 'Doubt not found.' });
    }

    // Learners can only see their own doubts
    if (req.user.role !== 'admin' && doubt.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    res.json({ doubt });
  } catch (error) {
    console.error('Get doubt error:', error);
    res.status(500).json({ error: 'Failed to get doubt.' });
  }
});

// PUT /api/doubts/:id/reply - Admin reply to doubt
router.put('/:id/reply', authenticate, requireAdmin, async (req, res) => {
  try {
    const { adminReply } = req.body;

    if (!adminReply) {
      return res.status(400).json({ error: 'Admin reply is required.' });
    }

    const existing = await prisma.doubt.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Doubt not found.' });
    }

    const doubt = await prisma.doubt.update({
      where: { id: req.params.id },
      data: {
        adminReply,
        status: 'answered',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        lesson: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    res.json({ doubt });
  } catch (error) {
    console.error('Reply to doubt error:', error);
    res.status(500).json({ error: 'Failed to reply to doubt.' });
  }
});

// PUT /api/doubts/:id/status - Update doubt status
router.put('/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required.' });
    }

    const validStatuses = ['open', 'answered', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    const existing = await prisma.doubt.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Doubt not found.' });
    }

    // Learners can only update their own doubts
    if (req.user.role !== 'admin' && existing.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const data = { status };
    if (status === 'resolved') {
      data.resolvedAt = new Date();
    }

    const doubt = await prisma.doubt.update({
      where: { id: req.params.id },
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        lesson: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    res.json({ doubt });
  } catch (error) {
    console.error('Update doubt status error:', error);
    res.status(500).json({ error: 'Failed to update doubt status.' });
  }
});

export default router;
