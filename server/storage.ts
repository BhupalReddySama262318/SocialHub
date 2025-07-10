import { User, Post, InsertUser, InsertPost } from "@shared/schema";
import { UserModel, PostModel } from "./db";
import bcrypt from "bcryptjs";

export interface IStorage {
  // User methods
  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  verifyPassword(email: string, password: string): Promise<User | null>;
  
  // Post methods
  createPost(post: InsertPost, userId: string): Promise<Post>;
  getAllPosts(): Promise<Post[]>;
  getPostsByUserId(userId: string): Promise<Post[]>;
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
    }));
  }
}

export const storage = new MongoStorage();
