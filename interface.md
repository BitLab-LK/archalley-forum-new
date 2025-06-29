# AI Website Builder Prompt: Recreate Archalley Forum

## Objective
Recreate the Archalley Forum website with all its features, UI/UX, real-time capabilities, and extensible architecture as described below. The result should be a modern, responsive, and accessible community platform for architects, designers, and construction professionals.

---

## Core Features & Functions
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

## UI/UX Requirements
- **Modern, clean, and professional design**
- **Responsive layout** for desktop, tablet, and mobile
- **Dark mode** and accessibility support (WCAG 2.1 AA)
- **Sidebar** for trending posts, top contributors, and navigation
- **Facebook-style post modal**: Two-column for image posts, single-column for text posts, with sticky header and footer, scrollable content, and real-time comment section
- **Consistent use of avatars, badges, and icons**
- **Easy navigation** between categories, posts, and user profiles
- **Admin dashboard** with clear controls and analytics

---

## Tech Stack (Recommended)
- **Frontend**: React (latest), Next.js (latest, App Router, Server Components)
- **Styling**: Tailwind CSS (latest), Shadcn UI, Lucide Icons
- **Backend**: Next.js API routes, Supabase (as the database and real-time backend)
- **Authentication**: NextAuth.js (latest), @auth/supabase-adapter or Supabase Auth
- **AI Integration**: Google Gemini (Generative AI)
- **Real-Time**: Supabase Realtime for live comments, votes, and notifications
- **Email**: Resend, Nodemailer
- **Validation**: Zod
- **Other**: Sharp (image processing), bcryptjs (password hashing)
- **Hosting**: Netlify
- **Website Builder**: bolt.new

---

## Data Model (Supabase/Postgres)
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

## Real-Time Architecture
- **Supabase Realtime**: Used for all real-time features (comments, votes, notifications)
- **Room-Based Updates**: Users join post-specific rooms for efficient updates
- **Optimistic UI**: Voting and commenting update instantly, with server confirmation
- **Scalable**: Designed for high concurrency and low latency

---

## Modularity & Extensibility
- **Component Separation**: Post card, image modal, and text modal are separate, reusable components
- **Shared Hooks**: `usePostVote` and `usePostComments` provide voting and comment logic to all components
- **Easy Theming**: Tailwind and Shadcn UI for rapid UI changes
- **Plug-and-Play Features**: Add new features (e.g., reactions, polls) with minimal refactor

---

## Prompt for AI Website Builder

> **Prompt:**
>
> Recreate the Archalley Forum website as described above. Implement all features, UI/UX, real-time capabilities, and extensible architecture. Use the latest versions of all tech stack components. Use Supabase as the database and real-time backend. Host the website on Netlify. Use bolt.new as the website builder. Ensure the site is modular, accessible, and scalable. All post and comment interactions (voting, commenting, replying) must be real-time and match the described Facebook-style modal experience. Include admin and AI-powered features. The result should be a production-ready, full-featured community platform for the architecture, design, and construction industries. 