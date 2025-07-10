import mongoose from 'mongoose';
import { User, Post } from '@shared/schema';

// MongoDB connection URI from your provided credentials
const MONGODB_URI = "mongodb+srv://socialhub_user:x0W5rgRyQtXoRgaD@socialhub.jouzo8h.mongodb.net/socialhub?retryWrites=true&w=majority&appName=SocialHub";

// Connect to MongoDB
mongoose.connect(MONGODB_URI);

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  profileImage: { type: String },
});

// Post Schema
const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  mediaUrl: { type: String },
  mediaType: { type: String, enum: ['image', 'video'] },
  userId: { type: String, required: true },
  userEmail: { type: String, required: true },
  userName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  likes: { type: [String], default: [] },
  comments: {
    type: [
      {
        userId: { type: String, required: true },
        userName: { type: String, required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      }
    ],
    default: []
  },
});

export const UserModel = mongoose.model('User', userSchema);
export const PostModel = mongoose.model('Post', postSchema);