import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { downloadFileStreamFromDrive } from '../utils/drive.js';

const router = express.Router();

// GET /api/files/:fileId - Securely proxy file stream from Google Drive
router.get('/:fileId', authenticate, async (req, res) => {
  try {
    const { fileId } = req.params;
    if (!fileId) {
      return res.status(400).json({ error: 'File ID is required.' });
    }

    // Proxy the stream
    await downloadFileStreamFromDrive(fileId, res);
  } catch (error) {
    console.error('File fetch error:', error);
    res.status(500).json({ error: 'Failed to proxy file.' });
  }
});

export default router;
