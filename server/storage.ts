import { User, Post, InsertUser, InsertPost } from "@shared/schema";
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

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private posts: Map<string, Post>;
  private userIdCounter: number;
  private postIdCounter: number;

  constructor() {
    this.users = new Map();
    this.posts = new Map();
    this.userIdCounter = 1;
    this.postIdCounter = 1;
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const existingUser = await this.getUserByEmail(insertUser.email);
    if (existingUser) {
      throw new Error("User already exists");
    }

    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const id = this.userIdCounter.toString();
    this.userIdCounter++;

    const user: User = {
      ...insertUser,
      id,
      password: hashedPassword,
      createdAt: new Date(),
    };

    this.users.set(id, user);
    return user;
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

    const id = this.postIdCounter.toString();
    this.postIdCounter++;

    const post: Post = {
      ...insertPost,
      id,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      createdAt: new Date(),
    };

    this.posts.set(id, post);
    return post;
  }

  async getAllPosts(): Promise<Post[]> {
    return Array.from(this.posts.values()).sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async getPostsByUserId(userId: string): Promise<Post[]> {
    return Array.from(this.posts.values())
      .filter(post => post.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

export const storage = new MemStorage();
