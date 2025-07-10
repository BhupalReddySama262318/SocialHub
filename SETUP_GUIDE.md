# SocialHub - Setup Guide for VS Code

## Project Overview
Complete social media web application with:
- User authentication (JWT + MongoDB)
- Post creation with media uploads (Cloudinary)
- Profile management
- Public feed
- Responsive design

## Prerequisites
1. Node.js (v18 or higher)
2. MongoDB Atlas account (or local MongoDB)
3. Cloudinary account for media uploads
4. VS Code

## Manual Setup Instructions

### 1. Create New Project
```bash
mkdir socialhub
cd socialhub
npm init -y
```

### 2. Install Dependencies
```bash
# Core dependencies
npm install express mongoose bcryptjs jsonwebtoken multer cloudinary
npm install @types/express @types/node @types/bcryptjs @types/jsonwebtoken @types/multer
npm install zod wouter @tanstack/react-query
npm install react react-dom @types/react @types/react-dom
npm install vite @vitejs/plugin-react tsx
npm install tailwindcss postcss autoprefixer
npm install @hookform/resolvers react-hook-form
npm install @radix-ui/react-dialog @radix-ui/react-tabs @radix-ui/react-avatar
npm install @radix-ui/react-button @radix-ui/react-card @radix-ui/react-input
npm install @radix-ui/react-label @radix-ui/react-toast
npm install lucide-react class-variance-authority clsx tailwind-merge
```

### 3. Environment Variables
Create `.env` file:
```env
DATABASE_URL=mongodb+srv://socialhub_user:x0W5rgRyQtXoRgaD@socialhub.jouzo8h.mongodb.net/socialhub
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
JWT_SECRET=your_jwt_secret_here
```

### 4. File Structure
```
socialhub/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── navbar.tsx
│   │   │   ├── create-post-modal.tsx
│   │   │   └── post-card.tsx
│   │   ├── pages/
│   │   │   ├── home.tsx
│   │   │   ├── login.tsx
│   │   │   ├── register.tsx
│   │   │   ├── profile.tsx
│   │   │   └── not-found.tsx
│   │   ├── lib/
│   │   │   ├── auth.ts
│   │   │   ├── cloudinary.ts
│   │   │   ├── queryClient.ts
│   │   │   └── utils.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   └── index.html
├── server/
│   ├── db.ts
│   ├── storage.ts
│   ├── routes.ts
│   ├── index.ts
│   └── vite.ts
├── shared/
│   └── schema.ts
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── postcss.config.js
```

### 5. Package.json Scripts
```json
{
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### 6. Key Configuration Files

#### vite.config.ts
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@shared': path.resolve(__dirname, './shared'),
    },
  },
  build: {
    outDir: 'dist/public',
  },
  server: {
    port: 3000,
  },
})
```

#### tailwind.config.ts
```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './client/src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
    },
  },
  plugins: [],
}

export default config
```

### 7. Run the Application
```bash
npm run dev
```

### 8. Deploy Options
- **Vercel**: Connect GitHub repo, auto-deploy
- **Netlify**: Connect GitHub repo, auto-deploy
- **Railway**: Connect GitHub repo, auto-deploy
- **Heroku**: Use git deployment

## Features Working
✅ User registration and login
✅ JWT authentication
✅ Post creation with media uploads
✅ Profile management
✅ Public feed
✅ Responsive design
✅ MongoDB data persistence
✅ Cloudinary media storage

## Need Help?
1. Check the browser console for errors
2. Check the server logs
3. Verify environment variables are set
4. Ensure MongoDB connection is working
5. Verify Cloudinary credentials

The application is fully functional and ready for deployment!