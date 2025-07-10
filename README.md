# SocialHub

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20Now-blue?style=for-the-badge)](https://socialhub-twyy.onrender.com/)

Check out the live website: [https://socialhub-twyy.onrender.com/](https://socialhub-twyy.onrender.com/)

# SocialHub - A Modern Social Media Platform

A Twitter-like social media platform built with React, Express.js, and MongoDB that allows users to share posts with text, images, and videos.

## Features

- User Authentication (Register, Login, Logout)
- Create, Edit, and Delete Posts
- Image & Video Upload Support (Cloudinary)
- Like and Comment on Posts
- User Profile with "My Posts" tab
- Edit Profile, Change Email & Password, Delete Account
- Responsive Design with Tailwind CSS
- Dark/Light Theme Toggle
- Optimistic UI Updates
- Accessibility Improvements (ARIA, keyboard navigation)
- Error Boundaries and Toast Notifications
- Pagination and Skeleton Loaders

## Technologies Used

- React + TypeScript (Frontend)
- Express.js + TypeScript (Backend)
- MongoDB + Mongoose (Database)
- Cloudinary (Media Storage)
- Tailwind CSS (Styling)
- TanStack Query (State/Server Sync)
- JWT + bcryptjs (Authentication)
- Multer (File Uploads)
- Zod (Validation)

## Prerequisites

- Node.js (v18+ recommended)
- npm (Node package manager)
- MongoDB Atlas account (or local MongoDB)
- Cloudinary account (for media uploads)

## Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd SocialHub
   ```

2. **Install dependencies:**
   ```bash
   npm install
   cd client && npm install && cd ..
   ```

3. **Environment Variables:**
   Create a `.env` file in the project root with the following (replace with your credentials):
   ```env
   MONGODB_URI=your-mongodb-uri
   JWT_SECRET=your-jwt-secret
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   - The backend runs on [http://localhost:3000](http://localhost:3000)
   - The frontend runs on [http://localhost:5173](http://localhost:5173)

## Project Structure

- `client/` - React frontend (pages, components, hooks, UI)
- `server/` - Express.js backend (routes, db, storage)
- `shared/` - Shared TypeScript schemas and types
- `attached_assets/` - (Optional) Reference assets
- Config files: Tailwind, Vite, TypeScript, etc.

## Features in Detail

### User Management
- Register, login, and logout
- Change email and password
- Delete account (removes user and all posts)

### Post Management
- Create, edit, and delete posts (with media)
- Like and comment on posts
- View all posts or just your own ("My Posts" tab)
- Optimistic UI for fast feedback

### UI/UX
- Responsive design (mobile & desktop)
- Dark/light mode toggle (persistent)
- Skeleton loaders for better perceived performance
- Accessible components (ARIA, keyboard navigation)
- Error boundaries for robust error handling

### Security
- JWT authentication
- Passwords hashed with bcryptjs
- Secure media upload via Cloudinary
- CSRF protection via best practices

## Deployment

- The app is ready for deployment on any Node.js-compatible host.
- Set environment variables in your production environment.
- Use `npm run build` in `client/` for a production frontend build.

## Environment Variables

Set the following in your `.env` file:
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret for JWT signing
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret

## Contributing

1. Fork the repository
2. Create a new branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.

## Acknowledgments

- React, Express, MongoDB, Cloudinary, Tailwind CSS, and the open source community.