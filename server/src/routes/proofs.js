import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../db.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { fileURLToPath } from 'url';
import { uploadFileToDrive } from '../utils/drive.js';
import { sendDiscordNotification } from '../utils/discord.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const uploadDir = process.env.UPLOAD_DIR || './uploads';
const absoluteUploadDir = path.resolve(__dirname, '../../../', uploadDir);
if (!fs.existsSync(absoluteUploadDir)) {
  fs.mkdirSync(absoluteUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const proofDir = path.join(absoluteUploadDir, 'proofs');
    if (!fs.existsSync(proofDir)) {
      fs.mkdirSync(proofDir, { recursive: true });
    }
    cb(null, proofDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// GET /api/proofs - List proofs
router.get('/', authenticate, async (req, res) => {
  try {
    const where = {};

    if (req.user.role !== 'admin') {
      where.userId = req.user.id;
    }

    const { status, lessonId } = req.query;
    if (status) where.status = status;
    if (lessonId) where.lessonId = lessonId;

    const proofs = await prisma.portfolioProof.findMany({
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

    res.json({ proofs });
  } catch (error) {
    console.error('List proofs error:', error);
    res.status(500).json({ error: 'Failed to list proofs.' });
  }
});

// POST /api/proofs - Upload proof (learner)
router.post('/', authenticate, upload.single('file'), async (req, res) => {
  try {
    const { lessonId, assessmentId, type, title, description, url } = req.body;

    if (!type) {
      return res.status(400).json({ error: 'Proof type is required.' });
    }

    let fileUrl = '';
    
    if (type === 'link' || type === 'editable_file_link') {
      if (!url) {
        return res.status(400).json({ error: 'URL is required for this proof type.' });
      }
      fileUrl = url;
    } else {
      if (!req.file) {
        return res.status(400).json({ error: 'File is required.' });
      }
      // Use the learner's personal Drive folder if available
      const uploader = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { driveFolderId: true },
      });
      try {
        const driveFileId = await uploadFileToDrive(
          req.file.path,
          req.file.originalname,
          req.file.mimetype,
          uploader?.driveFolderId || null
        );
        fileUrl = `/api/files/${driveFileId}`;
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.warn('Drive upload failed, falling back to local storage', err);
        fileUrl = `/uploads/proofs/${req.file.filename}`;
        sendDiscordNotification(
          '⚠️ Google Drive Upload Failed',
          `**Route:** Proof upload\n**User:** ${req.user.id}\n**File:** ${req.file.originalname}\n**Error:** ${err.message}\nFalling back to local storage.`,
          0xED4245
        );
      }
    }

    const proof = await prisma.portfolioProof.create({
      data: {
        userId: req.user.id,
        lessonId: lessonId || null,
        assessmentId: assessmentId || null,
        type,
        fileUrl,
        title: title || '',
        description: description || '',
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
      'Portfolio Proof Uploaded',
      `**Type:** ${type}\n**From:** ${proof.user.name} (${proof.user.email})`,
      0xFEE75C
    );

    res.status(201).json({ proof });
  } catch (error) {
    console.error('Upload proof error:', error);
    res.status(500).json({ error: 'Failed to upload proof.' });
  }
});

// GET /api/proofs/:id - Get proof detail
router.get('/:id', authenticate, async (req, res) => {
  try {
    const proof = await prisma.portfolioProof.findUnique({
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
          },
        },
      },
    });

    if (!proof) {
      return res.status(404).json({ error: 'Proof not found.' });
    }

    if (req.user.role !== 'admin' && proof.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    res.json({ proof });
  } catch (error) {
    console.error('Get proof error:', error);
    res.status(500).json({ error: 'Failed to get proof.' });
  }
});

// PUT /api/proofs/:id/review - Review proof (admin)
router.put('/:id/review', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status, adminNote } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required.' });
    }

    const validStatuses = ['approved', 'rejected', 'revision'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    const existing = await prisma.portfolioProof.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Proof not found.' });
    }

    const proof = await prisma.portfolioProof.update({
      where: { id: req.params.id },
      data: {
        status,
        adminNote: adminNote || '',
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

    res.json({ proof });
  } catch (error) {
    console.error('Review proof error:', error);
    res.status(500).json({ error: 'Failed to review proof.' });
  }
});

export default router;
