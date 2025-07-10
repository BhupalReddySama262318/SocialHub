import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, registerSchema, insertPostSchema } from "@shared/schema";
import jwt from "jsonwebtoken";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

// TypeScript: Extend Express Request to include 'user' property
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';
import type { FileFilterCallback } from 'multer';

interface RequestUser {
  userId: string;
  email?: string;
  name?: string;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: RequestUser;
  }
}

const JWT_SECRET = "your-secret-key";

// Configure Cloudinary
cloudinary.config({
  cloud_name: "dapc3rkho",
  api_key: "246578766356929",
  api_secret: "HAS8XcpdaZRLQn-aBnwUXtv10Ro",
});

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and videos are allowed.'));
    }
  },
});

// Middleware to verify JWT token
const authenticateToken = (req: Request, res: Response, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const userData = registerSchema.parse(req.body);
      const user = await storage.createUser(userData);
      
      // Don't send password back
      const { password, ...userWithoutPassword } = user;
      
      const token = jwt.sign(
        { userId: user.id, email: user.email, name: user.name },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      res.json({ user: userWithoutPassword, token });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const user = await storage.verifyPassword(email, password);
      
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      const { password: _, ...userWithoutPassword } = user;
      
      const token = jwt.sign(
        { userId: user.id, email: user.email, name: user.name },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      res.json({ user: userWithoutPassword, token });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
      const user = await storage.getUserById(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      const { password, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Post routes
  app.get("/api/posts", async (req: Request, res: Response) => {
    try {
      const posts = await storage.getAllPosts();
      res.json(posts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/posts", authenticateToken, upload.single('media'), async (req: Request, res: Response) => {
    try {
      const postData = {
        title: req.body.title,
        description: req.body.description || '',
      };

      const validatedData = insertPostSchema.parse(postData);
      let mediaUrl = '';
      let mediaType: 'image' | 'video' | undefined;

      // Upload media to Cloudinary if file is provided
      if (req.file) {
        const fileBuffer = (req.file as Express.Multer.File).buffer;
        const isVideo = (req.file as Express.Multer.File).mimetype.startsWith('video/');
        
        const uploadResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              resource_type: isVideo ? 'video' : 'image',
              folder: 'socialhub',
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(fileBuffer);
        });

        mediaUrl = (uploadResult as any).secure_url;
        mediaType = isVideo ? 'video' : 'image';
      }

      const post = await storage.createPost({
        ...validatedData,
        mediaUrl,
        mediaType,
      }, req.user.userId);

      res.json(post);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/posts/user/:userId", async (req: Request, res: Response) => {
    try {
      const posts = await storage.getPostsByUserId(req.params.userId);
      res.json(posts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Like a post (toggle like)
  app.post("/api/posts/:id/like", authenticateToken, async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
      const post = await storage.likePost(req.params.id, req.user.userId);
      res.json(post);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Comment on a post
  app.post("/api/posts/:id/comment", authenticateToken, async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
      const { text } = req.body;
      if (!text) return res.status(400).json({ message: 'Comment text required' });
      // Extra null check for TypeScript
      const post = await storage.commentOnPost(req.params.id, req.user!.userId, req.user!.name || 'User', text);
      res.json(post);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Update user profile
  app.put("/api/users/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      if (!req.user || req.user.userId !== req.params.id) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
      const { name, email, profileImage } = req.body;
      const updateData: any = { name, email };
      if (profileImage) updateData.profileImage = profileImage;
      const updatedUser = await storage.updateUserProfile(req.params.id, updateData);
      const { password, ...userWithoutPassword } = updatedUser;
      res.json({ user: userWithoutPassword });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Update a post
  app.put("/api/posts/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
      const post = await storage.getPostById(req.params.id);
      if (!post) return res.status(404).json({ message: 'Post not found' });
      if (post.userId !== req.user.userId) return res.status(403).json({ message: 'Forbidden' });
      const { title, description } = req.body;
      const updated = await storage.updatePost(req.params.id, { title, description });
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Delete a post
  app.delete("/api/posts/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
      const post = await storage.getPostById(req.params.id);
      if (!post) return res.status(404).json({ message: 'Post not found' });
      if (post.userId !== req.user.userId) return res.status(403).json({ message: 'Forbidden' });
      await storage.deletePost(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Delete user and all their posts
  app.delete("/api/users/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      if (!req.user || req.user.userId !== req.params.id) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
      await storage.deleteUserAndPosts(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Change user password
  app.put("/api/users/:id/password", authenticateToken, async (req: Request, res: Response) => {
    try {
      if (!req.user || req.user.userId !== req.params.id) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Current and new password required' });
      }
      const user = await storage.getUserById(req.params.id);
      if (!user) return res.status(404).json({ message: 'User not found' });
      const valid = await storage.verifyPassword(user.email, currentPassword);
      if (!valid) return res.status(401).json({ message: 'Current password is incorrect' });
      await storage.updateUserPassword(req.params.id, newPassword);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
