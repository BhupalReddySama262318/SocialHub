import { User, Post, InsertUser, InsertPost } from "@shared/schema";
import { UserModel, PostModel } from "./db";
import bcrypt from "bcryptjs";

export interface IStorage {
  // User methods
  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  verifyPassword(email: string, password: string): Promise<User | null>;
  updateUserProfile(id: string, data: Partial<Omit<User, 'id' | 'createdAt' | 'password'>>): Promise<User>;
  updateUserPassword(id: string, newPassword: string): Promise<void>;
  
  // Post methods
  createPost(post: InsertPost, userId: string): Promise<Post>;
  getAllPosts(): Promise<Post[]>;
  getPostsByUserId(userId: string): Promise<Post[]>;
  likePost(postId: string, userId: string): Promise<Post>;
  commentOnPost(postId: string, userId: string, userName: string, text: string): Promise<Post>;
  getPostById(postId: string): Promise<Post | undefined>;
  updatePost(postId: string, data: Partial<Pick<Post, 'title' | 'description'>>): Promise<Post>;
  deletePost(postId: string): Promise<void>;
  deleteUserAndPosts(userId: string): Promise<void>;
}

export class MongoStorage implements IStorage {
  async getUserById(id: string): Promise<User | undefined> {
    const user = await UserModel.findById(id);
    if (!user) return undefined;
    
    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      password: user.password,
      createdAt: user.createdAt,
      ...(user.profileImage ? { profileImage: user.profileImage } : {}),
    };
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const user = await UserModel.findOne({ email });
    if (!user) return undefined;
    
    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      password: user.password,
      createdAt: user.createdAt,
      ...(user.profileImage ? { profileImage: user.profileImage } : {}),
    };
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const existingUser = await this.getUserByEmail(insertUser.email);
    if (existingUser) {
      throw new Error("User already exists");
    }

    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const user = new UserModel({
      email: insertUser.email,
      name: insertUser.name,
      password: hashedPassword,
    });
    
    await user.save();
    
    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      password: user.password,
      createdAt: user.createdAt,
    };
  }

  async verifyPassword(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  async createPost(insertPost: InsertPost, userId: string): Promise<Post> {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const post = new PostModel({
      ...insertPost,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
    });
    
    await post.save();
    
    return {
      id: post._id.toString(),
      title: post.title,
      description: post.description || undefined,
      mediaUrl: post.mediaUrl || undefined,
      mediaType: post.mediaType as "image" | "video" | undefined,
      userId: post.userId,
      userEmail: post.userEmail,
      userName: post.userName,
      createdAt: post.createdAt,
      likes: post.likes || [],
      comments: post.comments || [],
    };
  }

  async getAllPosts(): Promise<Post[]> {
    const posts = await PostModel.find().sort({ createdAt: -1 });
    return posts.map(post => ({
      id: post._id.toString(),
      title: post.title,
      description: post.description || undefined,
      mediaUrl: post.mediaUrl || undefined,
      mediaType: post.mediaType as "image" | "video" | undefined,
      userId: post.userId,
      userEmail: post.userEmail,
      userName: post.userName,
      createdAt: post.createdAt,
      likes: post.likes || [],
      comments: post.comments || [],
    }));
  }

  async getPostsByUserId(userId: string): Promise<Post[]> {
    const posts = await PostModel.find({ userId }).sort({ createdAt: -1 });
    return posts.map(post => ({
      id: post._id.toString(),
      title: post.title,
      description: post.description || undefined,
      mediaUrl: post.mediaUrl || undefined,
      mediaType: post.mediaType as "image" | "video" | undefined,
      userId: post.userId,
      userEmail: post.userEmail,
      userName: post.userName,
      createdAt: post.createdAt,
      likes: post.likes || [],
      comments: post.comments || [],
    }));
  }

  async updateUserProfile(id: string, data: Partial<Omit<User, 'id' | 'createdAt' | 'password'>>): Promise<User> {
    const user = await UserModel.findByIdAndUpdate(id, data, { new: true });
    if (!user) throw new Error('User not found');
    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      password: user.password,
      createdAt: user.createdAt,
    };
  }

  async updateUserPassword(id: string, newPassword: string): Promise<void> {
    const hashed = await bcrypt.hash(newPassword, 10);
    await UserModel.findByIdAndUpdate(id, { password: hashed });
  }

  async likePost(postId: string, userId: string): Promise<Post> {
    const post = await PostModel.findById(postId);
    if (!post) throw new Error('Post not found');
    const likes: string[] = post.likes || [];
    const index = likes.indexOf(userId);
    if (index === -1) {
      likes.push(userId);
    } else {
      likes.splice(index, 1);
    }
    post.likes = likes;
    await post.save();
    return {
      id: post._id.toString(),
      title: post.title,
      description: post.description || undefined,
      mediaUrl: post.mediaUrl || undefined,
      mediaType: post.mediaType as "image" | "video" | undefined,
      userId: post.userId,
      userEmail: post.userEmail,
      userName: post.userName,
      createdAt: post.createdAt,
      likes: post.likes || [],
      comments: post.comments || [],
    };
  }

  async commentOnPost(postId: string, userId: string, userName: string, text: string): Promise<Post> {
    const post = await PostModel.findById(postId);
    if (!post) throw new Error('Post not found');
    const comment = {
      userId,
      userName,
      text,
      createdAt: new Date(),
    };
    post.comments = post.comments || [];
    post.comments.push(comment);
    await post.save();
    return {
      id: post._id.toString(),
      title: post.title,
      description: post.description || undefined,
      mediaUrl: post.mediaUrl || undefined,
      mediaType: post.mediaType as "image" | "video" | undefined,
      userId: post.userId,
      userEmail: post.userEmail,
      userName: post.userName,
      createdAt: post.createdAt,
      likes: post.likes || [],
      comments: post.comments || [],
    };
  }

  async getPostById(postId: string): Promise<Post | undefined> {
    const post = await PostModel.findById(postId);
    if (!post) return undefined;
    return {
      id: post._id.toString(),
      title: post.title,
      description: post.description || undefined,
      mediaUrl: post.mediaUrl || undefined,
      mediaType: post.mediaType as "image" | "video" | undefined,
      userId: post.userId,
      userEmail: post.userEmail,
      userName: post.userName,
      createdAt: post.createdAt,
      likes: post.likes || [],
      comments: post.comments || [],
    };
  }

  async updatePost(postId: string, data: Partial<Pick<Post, 'title' | 'description'>>): Promise<Post> {
    const post = await PostModel.findByIdAndUpdate(postId, data, { new: true });
    if (!post) throw new Error('Post not found');
    return {
      id: post._id.toString(),
      title: post.title,
      description: post.description || undefined,
      mediaUrl: post.mediaUrl || undefined,
      mediaType: post.mediaType as "image" | "video" | undefined,
      userId: post.userId,
      userEmail: post.userEmail,
      userName: post.userName,
      createdAt: post.createdAt,
      likes: post.likes || [],
      comments: post.comments || [],
    };
  }

  async deletePost(postId: string): Promise<void> {
    await PostModel.findByIdAndDelete(postId);
  }

  async deleteUserAndPosts(userId: string): Promise<void> {
    const user = await UserModel.findById(userId);
    if (user) {
      await UserModel.deleteMany({ $or: [{ _id: userId }, { email: user.email }] });
      await PostModel.deleteMany({ userId });
    }
  }
}

export const storage = new MongoStorage();
