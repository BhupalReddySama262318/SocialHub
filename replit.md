# SocialHub - Social Media Web Application

## Overview

SocialHub is a modern full-stack social media web application built with React, Express.js, and TypeScript. Users can create accounts, share posts with images/videos, and view a public feed of all posts. The application features a clean, responsive design using shadcn/ui components and Tailwind CSS.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management
- **UI Components**: shadcn/ui (Radix UI primitives with Tailwind styling)
- **Styling**: Tailwind CSS with CSS variables for theming
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT tokens with bcrypt for password hashing
- **File Upload**: Multer for handling multipart/form-data
- **Media Storage**: Cloudinary for image and video hosting

## Key Components

### Authentication System
- JWT-based authentication with secure token storage
- Password hashing using bcryptjs
- Protected routes requiring authentication for post creation
- Public access for viewing posts without login

### Post Management
- Create posts with title, description, and optional media
- Support for image uploads (JPEG, PNG, GIF) and video uploads (MP4, QuickTime)
- Media files processed through Cloudinary with 10MB size limit
- Post feed displaying all posts in a responsive grid layout

### Database Schema
- **Users**: ID, email, name, hashed password, creation timestamp
- **Posts**: ID, title, description, media URL, media type, user info, creation timestamp
- Shared schema definitions using Zod for validation

### UI/UX Features
- Responsive design optimized for mobile and desktop
- Dark/light theme support through CSS variables
- Toast notifications for user feedback
- Modal dialogs for post creation
- Avatar components with fallback initials
- Loading states and error handling

## Data Flow

1. **User Registration/Login**: Client sends credentials → Server validates → JWT token returned and stored
2. **Post Creation**: 
   - User fills form with media upload → Client validates → Token verified
   - Media uploaded to Cloudinary → Post saved to database with media URL
   - Client cache invalidated to show new post
3. **Feed Display**: Client fetches posts → Server returns all posts with user info → Rendered in grid layout

## External Dependencies

### Core Dependencies
- **Database**: @neondatabase/serverless for PostgreSQL connection
- **ORM**: drizzle-orm with drizzle-kit for migrations
- **Authentication**: jsonwebtoken, bcryptjs
- **File Upload**: multer, cloudinary
- **Validation**: zod for schema validation
- **UI**: @radix-ui components, tailwindcss, class-variance-authority

### Development Tools
- **Build**: vite, esbuild for server bundling
- **Development**: tsx for TypeScript execution
- **Replit Integration**: @replit/vite-plugin-cartographer, @replit/vite-plugin-runtime-error-modal

## Deployment Strategy

### Build Process
- Frontend: Vite builds React app to `dist/public`
- Backend: esbuild bundles Express server to `dist/index.js`
- Database: Drizzle migrations applied via `db:push` command

### Environment Configuration
- Development: `NODE_ENV=development` with tsx for hot reloading
- Production: `NODE_ENV=production` with compiled JavaScript
- Database: `DATABASE_URL` environment variable for PostgreSQL connection
- Cloudinary: API credentials for media upload service

### File Structure
- `client/`: React frontend application
- `server/`: Express.js backend API
- `shared/`: Common TypeScript schemas and types
- `migrations/`: Database migration files
- Configuration files in root for tools (Vite, Tailwind, TypeScript, etc.)

The application follows a monorepo structure with clear separation between frontend, backend, and shared code, making it easy to maintain and scale.