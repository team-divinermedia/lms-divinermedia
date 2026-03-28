import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import prisma from '../db.js';
import { authenticate } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { sendPasswordResetEmail } from '../utils/email.js';
import { createLearnerFolder } from '../utils/drive.js';

const router = express.Router();

const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    inviteToken: z.string().min(1, 'Invite token is required'),
  }),
});

// GET /api/auth/invite/:token - Validate invite token and return invite details
router.get('/invite/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const invite = await prisma.invite.findUnique({
      where: { token },
    });

    if (!invite) {
      return res.status(404).json({ error: 'Invalid invite token.' });
    }

    if (invite.used) {
      return res.status(400).json({ error: 'This invite has already been used.' });
    }

    if (new Date(invite.expiresAt) < new Date()) {
      return res.status(400).json({ error: 'This invite has expired.' });
    }

    res.json({ email: invite.email, role: invite.role });
  } catch (error) {
    console.error('Validate invite error:', error);
    res.status(500).json({ error: 'Failed to validate invite.' });
  }
});

// POST /api/auth/register - Register with invite token
router.post('/register', validateRequest(registerSchema), async (req, res) => {
  try {
    const { email, password, name, inviteToken } = req.body;

    const invite = await prisma.invite.findUnique({
      where: { token: inviteToken },
    });

    if (!invite) {
      return res.status(400).json({ error: 'Invalid invite token.' });
    }

    if (invite.used) {
      return res.status(400).json({ error: 'Invite token has already been used.' });
    }

    if (new Date(invite.expiresAt) < new Date()) {
      return res.status(400).json({ error: 'Invite token has expired.' });
    }

    if (invite.email !== email) {
      return res.status(400).json({ error: 'Email does not match the invite.' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a personal Drive folder for learners
    let driveFolderId = null;
    if (invite.role === 'learner') {
      try {
        driveFolderId = await createLearnerFolder(name);
      } catch (err) {
        console.warn('Could not create Drive folder for learner:', err.message);
        const { sendDiscordNotification } = await import('../utils/discord.js');
        sendDiscordNotification(
          '⚠️ Google Drive Folder Creation Failed',
          `**Learner:** ${name} (${email})\n**Error:** ${err.message}\nUploads will fall back to local storage until this is resolved.`,
          0xED4245
        );
      }
    }

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: invite.role,
        ...(driveFolderId && { driveFolderId }),
      },
    });

    await prisma.invite.update({
      where: { id: invite.id },
      data: { used: true },
    });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed.' });
  }
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
});

// POST /api/auth/login - Email/password login
router.post('/login', validateRequest(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is deactivated.' });
    }

    if (user.accessExpiry && new Date(user.accessExpiry) < new Date()) {
      return res.status(403).json({ error: 'Access has expired.' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed.' });
  }
});

// POST /api/auth/forgot-password - Generate password reset token
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ message: 'If an account with that email exists, a reset token has been generated.' });
    }

    const resetToken = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordReset.create({
      data: {
        email,
        token: resetToken,
        expiresAt,
      },
    });

    await sendPasswordResetEmail(email, resetToken);

    res.json({
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process request.' });
  }
});

// POST /api/auth/reset-password - Reset password with token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const resetRecord = await prisma.passwordReset.findUnique({
      where: { token },
    });

    if (!resetRecord) {
      return res.status(400).json({ error: 'Invalid reset token.' });
    }

    if (resetRecord.used) {
      return res.status(400).json({ error: 'Reset token has already been used.' });
    }

    if (new Date(resetRecord.expiresAt) < new Date()) {
      return res.status(400).json({ error: 'Reset token has expired.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { email: resetRecord.email },
      data: { password: hashedPassword },
    });

    await prisma.passwordReset.update({
      where: { id: resetRecord.id },
      data: { used: true },
    });

    res.json({ message: 'Password has been reset successfully.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password.' });
  }
});

// GET /api/auth/me - Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        accessExpiry: true,
        lastActiveAt: true,
        createdAt: true,
      },
    });

    res.json({ user });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Failed to get user info.' });
  }
});

// POST /api/auth/refresh - Refresh JWT token
router.post('/refresh', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || !user.isActive || (user.accessExpiry && new Date(user.accessExpiry) < new Date())) {
      return res.status(401).json({ error: 'User invalid or access expired' });
    }

    const newToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token: newToken });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({ error: 'Failed to refresh token.' });
  }
});

export default router;
