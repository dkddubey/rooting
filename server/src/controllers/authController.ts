import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma, config } from '../config/index.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

export class AuthController {
  /**
   * Register a new user
   */
  public static async register(req: Request, res: Response) {
    try {
      const { email, password, name, bio, originPlaces } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({ error: 'Email, password, and name are required.' });
      }

      const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
      if (existingUser) {
        return res.status(409).json({ error: 'A user with this email already exists.' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          email: email.toLowerCase().trim(),
          passwordHash,
          name: name.trim(),
          bio: bio ? bio.trim() : '',
          originPlaces: originPlaces ? JSON.stringify(originPlaces) : JSON.stringify([])
        }
      });

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        config.jwtSecret,
        { expiresIn: '7d' }
      );

      return res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          bio: user.bio,
          originPlaces: user.originPlaces ? JSON.parse(user.originPlaces) : []
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({ error: 'Internal server error during registration.' });
    }
  }

  /**
   * Login user
   */
  public static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }

      const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        config.jwtSecret,
        { expiresIn: '7d' }
      );

      return res.json({
        message: 'Logged in successfully',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          bio: user.bio,
          originPlaces: user.originPlaces ? JSON.parse(user.originPlaces) : []
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ error: 'Internal server error during login.' });
    }
  }

  /**
   * Password reset
   */
  public static async resetPassword(req: Request, res: Response) {
    try {
      const { email, newPassword } = req.body;

      if (!email || !newPassword) {
        return res.status(400).json({ error: 'Email and new password are required.' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      }

      const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
      if (!user) {
        return res.status(404).json({ error: 'No user account found with this email.' });
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash }
      });

      const token = jwt.sign(
        { userId: updated.id, email: updated.email },
        config.jwtSecret,
        { expiresIn: '7d' }
      );

      return res.json({
        message: 'Password updated successfully',
        token,
        user: {
          id: updated.id,
          email: updated.email,
          name: updated.name,
          bio: updated.bio,
          originPlaces: updated.originPlaces ? JSON.parse(updated.originPlaces) : []
        }
      });
    } catch (error) {
      console.error('Password reset error:', error);
      return res.status(500).json({ error: 'Failed to reset password' });
    }
  }

  /**
   * Get current authenticated user profile
   */
  public static async me(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          bio: true,
          avatarUrl: true,
          originPlaces: true,
          createdAt: true
        }
      });

      if (!user) return res.status(404).json({ error: 'User not found' });

      return res.json({
        ...user,
        originPlaces: user.originPlaces ? JSON.parse(user.originPlaces) : []
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to retrieve profile' });
    }
  }

  /**
   * Update current user profile (name, bio, ancestral origin places)
   */
  public static async updateProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const { name, bio, originPlaces, avatarUrl } = req.body;

      const updated = await prisma.user.update({
        where: { id: userId },
        data: {
          name: name ? name.trim() : undefined,
          bio: bio !== undefined ? bio.trim() : undefined,
          avatarUrl: avatarUrl !== undefined ? avatarUrl : undefined,
          originPlaces: originPlaces ? JSON.stringify(originPlaces) : undefined
        }
      });

      return res.json({
        id: updated.id,
        email: updated.email,
        name: updated.name,
        bio: updated.bio,
        avatarUrl: updated.avatarUrl,
        originPlaces: updated.originPlaces ? JSON.parse(updated.originPlaces) : [],
        createdAt: updated.createdAt
      });
    } catch (error) {
      console.error('Update profile error:', error);
      return res.status(500).json({ error: 'Failed to update profile' });
    }
  }

  /**
   * List all platform users (for discovery and search)
   */
  public static async getDemoUsers(req: Request, res: Response) {
    try {
      const users = await prisma.user.findMany({
        select: { id: true, name: true, email: true, bio: true, originPlaces: true }
      });

      const formatted = users.map(u => ({
        ...u,
        originPlaces: u.originPlaces ? JSON.parse(u.originPlaces) : []
      }));

      return res.json(formatted);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to retrieve users' });
    }
  }

  /**
   * Quick-login switch for demo persona (Eleanor Vance / Marcus Vance)
   */
  public static async switchDemo(req: Request, res: Response) {
    try {
      const { email } = req.body;
      const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });

      if (!user) {
        return res.status(404).json({ error: 'Demo user not found' });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        config.jwtSecret,
        { expiresIn: '7d' }
      );

      return res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          bio: user.bio,
          originPlaces: user.originPlaces ? JSON.parse(user.originPlaces) : []
        }
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to switch demo user' });
    }
  }
}
