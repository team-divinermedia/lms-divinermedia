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
    const assessmentDir = path.join(absoluteUploadDir, 'assessments');
    if (!fs.existsSync(assessmentDir)) {
      fs.mkdirSync(assessmentDir, { recursive: true });
    }
    cb(null, assessmentDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// GET /api/assessments/:targetId?type=lesson|module - List assessments
router.get('/:targetId', authenticate, async (req, res) => {
  try {
    const { targetId } = req.params;
    const { type } = req.query;

    if (!type || !['lesson', 'module'].includes(type)) {
      return res.status(400).json({ error: 'Query param "type" must be "lesson" or "module".' });
    }

    const where = type === 'lesson'
      ? { lessonId: targetId }
      : { moduleId: targetId };

    if (req.user.role !== 'admin') {
      where.isPublished = true;
    }

    const assessments = await prisma.assessment.findMany({
      where,
      include: {
        questions: {
          select: { id: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    const result = assessments.map((a) => ({
      ...a,
      questionsCount: a.questions.length,
      questions: undefined,
    }));

    res.json({ assessments: result });
  } catch (error) {
    console.error('List assessments error:', error);
    res.status(500).json({ error: 'Failed to list assessments.' });
  }
});

// POST /api/assessments - Create assessment with questions (admin)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { moduleId, lessonId, title, description, timeLimit, sortOrder, isPublished, questions } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required.' });
    }

    if (!moduleId && !lessonId) {
      return res.status(400).json({ error: 'Either moduleId or lessonId is required.' });
    }

    const assessment = await prisma.assessment.create({
      data: {
        moduleId: moduleId || null,
        lessonId: lessonId || null,
        title,
        description: description || '',
        timeLimit: timeLimit || null,
        sortOrder: sortOrder || 0,
        isPublished: isPublished || false,
        questions: questions && questions.length > 0
          ? {
              create: questions.map((q, idx) => ({
                type: q.type || 'short_answer',
                content: q.content,
                options: q.options ? JSON.stringify(q.options) : '[]',
                correctAnswer: q.correctAnswer || '',
                sortOrder: q.sortOrder !== undefined ? q.sortOrder : idx,
              })),
            }
          : undefined,
      },
      include: {
        questions: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    res.status(201).json({ assessment });
  } catch (error) {
    console.error('Create assessment error:', error);
    res.status(500).json({ error: 'Failed to create assessment.' });
  }
});

// GET /api/assessments/detail/:id - Get assessment with questions
router.get('/detail/:id', authenticate, async (req, res) => {
  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: req.params.id },
      include: {
        questions: {
          orderBy: { sortOrder: 'asc' },
        },
        module: true,
        lesson: true,
      },
    });

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found.' });
    }

    if (req.user.role !== 'admin' && !assessment.isPublished) {
      return res.status(404).json({ error: 'Assessment not found.' });
    }

    // For learners, hide correct answers
    if (req.user.role !== 'admin') {
      assessment.questions = assessment.questions.map((q) => ({
        ...q,
        correctAnswer: undefined,
      }));
    }

    res.json({ assessment });
  } catch (error) {
    console.error('Get assessment detail error:', error);
    res.status(500).json({ error: 'Failed to get assessment.' });
  }
});

// PUT /api/assessments/:id - Update assessment (admin)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { title, description, timeLimit, sortOrder, isPublished, questions } = req.body;

    const existing = await prisma.assessment.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Assessment not found.' });
    }

    // If questions are provided, delete old ones and create new ones
    if (questions) {
      await prisma.question.deleteMany({
        where: { assessmentId: req.params.id },
      });
    }

    const assessment = await prisma.assessment.update({
      where: { id: req.params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(timeLimit !== undefined && { timeLimit }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isPublished !== undefined && { isPublished }),
        ...(questions && {
          questions: {
            create: questions.map((q, idx) => ({
              type: q.type || 'short_answer',
              content: q.content,
              options: q.options ? JSON.stringify(q.options) : '[]',
              correctAnswer: q.correctAnswer || '',
              sortOrder: q.sortOrder !== undefined ? q.sortOrder : idx,
            })),
          },
        }),
      },
      include: {
        questions: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    res.json({ assessment });
  } catch (error) {
    console.error('Update assessment error:', error);
    res.status(500).json({ error: 'Failed to update assessment.' });
  }
});

// DELETE /api/assessments/:id - Delete assessment (admin)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const existing = await prisma.assessment.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Assessment not found.' });
    }

    await prisma.assessment.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Assessment deleted successfully.' });
  } catch (error) {
    console.error('Delete assessment error:', error);
    res.status(500).json({ error: 'Failed to delete assessment.' });
  }
});

// POST /api/assessments/:id/submit - Submit answers (learner)
router.post('/:id/submit', authenticate, upload.any(), async (req, res) => {
  try {
    const answersData = req.body.answers;
    
    let answers = [];
    if (answersData) {
      try {
        answers = JSON.parse(answersData);
      } catch (err) {
        return res.status(400).json({ error: 'Answers must be valid JSON array.' });
      }
    }

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: 'Answers are required.' });
    }

    const assessment = await prisma.assessment.findUnique({
      where: { id: req.params.id },
      include: {
        questions: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found.' });
    }

    if (!assessment.isPublished) {
      return res.status(400).json({ error: 'Assessment is not published.' });
    }

    // Process files if any
    const fileUrls = {};
    if (req.files && req.files.length > 0) {
      const uploader = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { driveFolderId: true },
      });
      for (const file of req.files) {
        // file.fieldname is expected to be `file_${questionId}`
        const match = file.fieldname.match(/^file_(.+)$/);
        if (match) {
          try {
            const driveFileId = await uploadFileToDrive(
              file.path,
              file.originalname,
              file.mimetype,
              uploader?.driveFolderId || null
            );
            fileUrls[match[1]] = `/api/files/${driveFileId}`;
            fs.unlinkSync(file.path);
          } catch (err) {
            console.warn('Drive upload failed, falling back to local storage', err);
            fileUrls[match[1]] = `/uploads/assessments/${file.filename}`;
            sendDiscordNotification(
              '⚠️ Google Drive Upload Failed',
              `**Route:** Assessment submission\n**User:** ${req.user.id}\n**File:** ${file.originalname}\n**Error:** ${err.message}\nFalling back to local storage.`,
              0xED4245
            );
          }
        }
      }
    }

    // Auto-grade multiple choice / true-false questions
    const totalQuestions = assessment.questions.length;
    let correctCount = 0;

    const questionMap = {};
    for (const q of assessment.questions) {
      questionMap[q.id] = q;
    }

    for (const ans of answers) {
      const question = questionMap[ans.questionId];
      if (question && question.correctAnswer) {
        if (question.type === 'mcq' || question.type === 'true_false') {
          if ((ans.content || '').trim().toLowerCase() === question.correctAnswer.trim().toLowerCase()) {
            correctCount++;
          }
        }
      }
    }

    // If any voice files were submitted, the whole submission requires manual review
    const hasVoiceFiles = Object.keys(fileUrls).length > 0;

    const hasAutoGradable = !hasVoiceFiles && assessment.questions.some(
      (q) => (q.type === 'mcq' || q.type === 'true_false') && q.correctAnswer
    );

    const hasManualGradable = hasVoiceFiles || assessment.questions.some(
      (q) => q.type === 'short_answer' || q.type === 'long_answer' || q.type === 'voice_note' || q.type === 'file_upload'
    );

    const score = hasAutoGradable ? (correctCount / totalQuestions) * 100 : null;

    const submission = await prisma.assessmentSubmission.create({
      data: {
        userId: req.user.id,
        assessmentId: req.params.id,
        status: hasAutoGradable && !hasManualGradable ? 'graded' : 'submitted',
        score,
        submittedAt: new Date(),
        answers: {
          create: answers.map((ans) => {
            const voiceUrl = fileUrls[ans.questionId];
            const text = ans.answer || ans.content || '';
            let content, type;
            if (voiceUrl && text) {
              content = JSON.stringify({ voiceUrl, text });
              type = 'voice_with_text';
            } else if (voiceUrl) {
              content = voiceUrl;
              type = 'voice';
            } else {
              content = text;
              type = 'text';
            }
            return { questionId: ans.questionId, content, type };
          }),
        },
      },
      include: {
        answers: true,
      },
    });

    sendDiscordNotification(
      'Assessment Submitted',
      `**Assessment ID:** ${req.params.id}\n**User ID:** ${req.user.id}\n**Score:** ${score !== null ? `${score}%` : 'Needs manual grading'}`,
      0x57F287
    );

    res.status(201).json({ submission });
  } catch (error) {
    console.error('Submit assessment error:', error);
    res.status(500).json({ error: 'Failed to submit assessment.' });
  }
});

// GET /api/assessments/:id/submissions - Get submissions
router.get('/:id/submissions', authenticate, async (req, res) => {
  try {
    const where = { assessmentId: req.params.id };

    if (req.user.role !== 'admin') {
      where.userId = req.user.id;
    }

    const submissions = await prisma.assessmentSubmission.findMany({
      where,
      include: {
        answers: {
          include: {
            question: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ submissions });
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ error: 'Failed to get submissions.' });
  }
});

// PUT /api/assessments/submissions/:id/review - Review submission (admin)
router.put('/submissions/:id/review', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status, score, feedback } = req.body;

    const existing = await prisma.assessmentSubmission.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Submission not found.' });
    }

    const submission = await prisma.assessmentSubmission.update({
      where: { id: req.params.id },
      data: {
        ...(status !== undefined && { status }),
        ...(score !== undefined && { score }),
        ...(feedback !== undefined && { feedback }),
      },
      include: {
        answers: {
          include: {
            question: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json({ submission });
  } catch (error) {
    console.error('Review submission error:', error);
    res.status(500).json({ error: 'Failed to review submission.' });
  }
});

export default router;
