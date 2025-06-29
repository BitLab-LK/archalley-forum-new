# Archalley Forum

A dedicated space for architects, designers, and construction professionals to connect, share ideas, and discuss all things architecture, design, and construction.

---

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Data Model](#data-model)
- [API & Functionality](#api--functionality)
- [Categories](#categories)
- [User Roles & Ranks](#user-roles--ranks)
- [Modularity & Extensibility](#modularity--extensibility)
- [Real-Time Architecture](#real-time-architecture)
- [Getting Started](#getting-started)
- [License](#license)

---

## Overview
Archalley Forum is a modern, full-featured community platform tailored for the architecture, design, and construction industries. It enables professionals and enthusiasts to:
- Share projects, ideas, and questions
- Connect and network with peers
- Discuss industry trends, techniques, and research
- Showcase portfolios and professional profiles

---

## Features
- **User Registration & Authentication**: Email/password and social login (Google, Facebook)
- **User Profiles**: Customizable profiles with profession, company, bio, social links, and privacy controls
- **Forum Posts**: Create, edit, delete, and vote on posts; support for images and file uploads
- **Categories**: Organized discussions by topic (Business, Design, Career, Construction, Academic, Informative, Other)
- **Comments & Replies**: Threaded discussions, upvotes/downvotes, best answer marking, real-time updates
- **Trending Posts & Top Contributors**: Sidebar highlights for community engagement
- **Member Directory**: Search, filter, and sort members by profession, activity, or join date
- **Notifications**: Real-time and email notifications for mentions, replies, and system events
- **Admin Dashboard**: Manage users, categories, settings, appearance, and custom pages
- **Custom Pages**: Admins can create and manage static pages (e.g., About, Guidelines)
- **AI-Powered Features**: Automatic post categorization and tag suggestion using Google Gemini
- **File Uploads**: Secure image uploads with automatic resizing and format conversion
- **Accessibility & Responsive Design**: Mobile-friendly, dark mode, and accessible UI
- **Facebook-Style Modal Popups**: Responsive, two-column modals for posts (image and text), matching modern social UX
- **Real-Time Voting & Commenting**: Like/dislike posts and comments, add comments/replies, all with instant updates
- **Extensible & Modular Codebase**: Shared hooks for voting and comments, modularized modal and card components

---

## Tech Stack
- **Frontend**: React 19, Next.js 15 (App Router, Server Components)
- **Styling**: Tailwind CSS, Shadcn UI, Lucide Icons
- **Backend**: Next.js API routes, Prisma ORM, PostgreSQL
- **Authentication**: NextAuth.js, @auth/prisma-adapter
- **AI Integration**: Google Gemini (Generative AI)
- **Real-Time**: Socket.IO for live comments, votes, and notifications
- **Email**: Resend, Nodemailer
- **Validation**: Zod
- **Other**: Sharp (image processing), bcryptjs (password hashing)

---

## Data Model (Prisma)
- **User**: Profile, social links, role, rank, status, timestamps
- **Category**: Name, description, color, icon, slug, post count
- **Post**: Content, author, category, AI tags, language, attachments, votes, view/share count
- **Comment**: Threaded, parent/child, author, post, content, votes, replies
- **Vote**: Up/down, user, post/comment
- **Flag**: Moderation, status, user, post/comment
- **Attachment**: File uploads for posts
- **Notification**: Type, message, user, read status
- **Settings**: Key-value pairs for site configuration
- **Page**: Custom static pages (admin-managed)

---

## API & Functionality
- **/api/auth/**: Registration, login, social auth, session management
- **/api/posts/**: CRUD for posts, voting, AI categorization, image attachments
- **/api/comments/**: CRUD for comments and replies, voting, real-time updates
- **/api/categories/**: List and manage discussion categories
- **/api/users/**: Profile view and update, privacy controls
- **/api/notifications/**: Fetch and mark notifications as read
- **/api/upload/**: Secure file/image uploads with validation and processing
- **/api/admin/**: Admin dashboard endpoints for settings, users, pages, and stats
- **/api/websocket/**: Real-time features (Socket.IO integration)

---

## Categories
- **Business**: Strategies, entrepreneurship, industry trends
- **Design**: Architectural designs, concepts, inspiration
- **Career**: Advice, jobs, professional development
- **Construction**: Techniques, materials, project management, innovations
- **Academic**: Research, theories, educational resources
- **Informative**: News, updates, tutorials
- **Other**: General topics not covered above

---

## User Roles & Ranks
- **Roles**: Admin, Moderator, Member
- **Ranks**: New Member, Conversation Starter, Rising Star, Visual Storyteller, Valued Responder, Community Expert, Top Contributor

---

## Modularity & Extensibility
- **Component Separation**: Post card, image modal, and text modal are separate, reusable components
- **Shared Hooks**: `usePostVote` and `usePostComments` provide voting and comment logic to all components
- **Easy Theming**: Tailwind and Shadcn UI for rapid UI changes
- **Plug-and-Play Features**: Add new features (e.g., reactions, polls) with minimal refactor

---

## Real-Time Architecture
- **Socket.IO**: Used for all real-time features (comments, votes, notifications)
- **Room-Based Updates**: Users join post-specific rooms for efficient updates
- **Optimistic UI**: Voting and commenting update instantly, with server confirmation
- **Scalable**: Designed for high concurrency and low latency

---

## Getting Started
1. Clone the repository
2. Install dependencies (`npm install` or `pnpm install`)
3. Set up your `.env` file (see `.env.example`)
4. Run database migrations (`npx prisma migrate dev`)
5. Start the development server (`npm run dev`)

---

## License
MIT
