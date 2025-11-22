# Archalley Forum

A comprehensive, modern community platform designed specifically for architects, designers, and construction professionals. Built with cutting-edge technology and industry-specific features to foster meaningful professional connections and knowledge sharing.

---

## Table of Contents
- [Overview](#overview)
- [Core Features](#core-features)
- [Advanced Features](#advanced-features)
- [Security & Privacy](#security--privacy)
- [Tech Stack](#tech-stack)
- [Data Model](#data-model)
- [API Endpoints](#api-endpoints)
- [UI Components](#ui-components)
- [Categories](#categories)
- [Badge System](#badge-system)
- [User Management](#user-management)
- [Admin Features](#admin-features)
- [Real-Time Features](#real-time-features)
- [Email System](#email-system)
- [File Management](#file-management)
- [Getting Started](#getting-started)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Overview
Archalley Forum is a sophisticated, enterprise-grade community platform tailored for the architecture, design, and construction industries. It provides a comprehensive ecosystem for professionals to:

- **Connect & Network**: Build meaningful professional relationships within the industry
- **Share Knowledge**: Post projects, ideas, questions, and insights with rich media support
- **Collaborate**: Engage in threaded discussions with real-time updates and notifications
- **Showcase Work**: Display portfolios, achievements, and professional credentials
- **Learn & Grow**: Access categorized content, expert insights, and industry trends
- **Build Reputation**: Earn badges and recognition through community engagement

---

## Core Features

### 🔐 Authentication & User Management
- **Multi-Provider Authentication**: Email/password, Google OAuth, Facebook OAuth, LinkedIn OAuth
- **Two-Factor Authentication (2FA)**: TOTP-based security with QR code setup
- **Account Security**: Password reset, email verification, account suspension
- **Session Management**: Secure session handling with NextAuth.js

### 👤 User Profiles & Professional Networking
- **Comprehensive Profiles**: Name, bio, profession, company, location, contact info
- **Social Media Integration**: LinkedIn, Twitter, Instagram, GitHub, YouTube, TikTok, Behance, Dribbble
- **Professional Experience**: Work history, education, skills, portfolio links
- **Privacy Controls**: Granular privacy settings for profile visibility
- **Profile Verification**: Admin-verified professional accounts

### 📝 Content Creation & Management
- **Rich Text Posts**: Create detailed posts with formatting and media
- **Image Uploads**: Multiple image support with automatic optimization
- **Anonymous Posting**: Option to post anonymously while maintaining engagement
- **Post Categories**: Multi-category tagging system
- **Post Moderation**: Pin, lock, and flag posts for community management
- **AI-Powered Categorization**: Automatic content categorization using Google Gemini

### 💬 Discussion System
- **Threaded Comments**: Nested reply system with unlimited depth
- **Real-Time Updates**: Live comment updates via Socket.IO
- **Voting System**: Upvote/downvote posts and comments
- **Best Answer Marking**: Highlight the most helpful responses
- **Comment Moderation**: Flag and moderate inappropriate content

### 🔔 Notification System
- **Real-Time Notifications**: Instant browser notifications for engagement
- **Email Notifications**: Comprehensive email system with customizable preferences
- **Notification Types**: Likes, comments, replies, mentions, system alerts
- **Email Digests**: Daily, weekly, or monthly activity summaries
- **Notification Preferences**: Granular control over notification types

---

## Advanced Features

### 🏆 Professional Badge System
- **Achievement Badges**: 7 categories (Activity, Appreciation, Engagement, Tenure, Achievement, Content Type, Quality)
- **Badge Levels**: Bronze, Silver, Gold, Platinum tiers
- **Automatic Awarding**: System automatically awards badges based on criteria
- **Manual Badges**: Admins can award special recognition badges
- **Badge Leaderboard**: Community-wide badge rankings
- **Badge Display**: Prominent badge showcase on profiles and posts

### 🤖 AI Integration
- **Content Categorization**: Automatic post categorization using Google Gemini
- **Multi-Language Support**: Content translation and language detection
- **AI Tags**: Intelligent tag suggestions for better content discovery
- **Content Analysis**: AI-powered content quality assessment

### 📊 Analytics & Insights
- **User Activity Tracking**: Comprehensive activity monitoring
- **Content Analytics**: Post views, shares, engagement metrics
- **Community Statistics**: Member growth, activity trends, popular content
- **Admin Analytics**: Detailed dashboard with key performance indicators

### 🔍 Search & Discovery
- **Advanced Search**: Full-text search across posts, comments, and users
- **Filter Options**: Search by category, date, author, content type
- **Trending Content**: Algorithm-based trending posts and topics
- **Member Directory**: Searchable member database with filtering

---

## Security & Privacy

### 🔒 Security Features
- **Two-Factor Authentication**: TOTP-based 2FA with QR code setup
- **Password Security**: Bcrypt hashing with secure password policies
- **Session Security**: Secure session management with proper expiration
- **CSRF Protection**: Cross-site request forgery protection
- **XSS Prevention**: Content sanitization and security headers
- **SQL Injection Prevention**: Prisma ORM with parameterized queries

### 🛡️ Privacy Controls
- **Profile Privacy**: Granular privacy settings for profile information
- **Email Privacy**: Control who can see your email address
- **Activity Privacy**: Control visibility of your activity and posts
- **Data Export**: Users can export their personal data
- **Account Deletion**: Complete account and data removal

### 📋 Content Moderation
- **Flagging System**: Community-driven content reporting
- **Admin Moderation**: Comprehensive admin tools for content management
- **User Suspension**: Temporary and permanent account restrictions
- **Content Review**: Flagged content review workflow

---

## Tech Stack

### Frontend
- **React 18.3.1**: Modern React with hooks and functional components
- **Next.js 15.2.4**: App Router, Server Components, API routes
- **TypeScript 5.8.3**: Full type safety and enhanced developer experience
- **Tailwind CSS 3.4.17**: Utility-first CSS framework
- **Shadcn UI**: Modern, accessible component library
- **Lucide React**: Beautiful, customizable icons

### Backend & Database
- **Next.js API Routes**: Serverless API endpoints
- **Prisma 5.22.0**: Type-safe database ORM
- **PostgreSQL**: Robust relational database
- **NextAuth.js 4.24.11**: Authentication framework
- **Socket.IO 4.8.1**: Real-time communication

### AI & External Services
- **Google Gemini**: AI-powered content categorization and translation
- **Azure Blob Storage**: Secure file storage and CDN
- **Resend**: Email delivery service
- **Nodemailer**: SMTP email client

### Development & Deployment
- **Sharp**: Image processing and optimization
- **Zod**: Runtime type validation
- **Bcryptjs**: Password hashing
- **Speakeasy**: Two-factor authentication
- **QRCode**: QR code generation for 2FA

---

## Data Model

### Core Entities
- **Users**: Comprehensive user profiles with professional information
- **Posts**: Rich content with AI categorization and media support
- **Comments**: Threaded discussion system with voting
- **Categories**: Organized content classification
- **Badges**: Achievement and recognition system
- **Notifications**: Real-time and email notification system
- **Votes**: Upvote/downvote system for posts and comments
- **Attachments**: File upload management
- **Settings**: Site-wide configuration management
- **Pages**: Custom static pages for admins

### Advanced Models
- **Work Experience**: Professional work history
- **Education**: Academic background and qualifications
- **Email Logs**: Comprehensive email delivery tracking
- **Flags**: Content moderation and reporting system
- **Sessions**: Secure session management
- **Accounts**: OAuth provider integration

---

## API Endpoints

### Authentication (`/api/auth/`)
- `[...nextauth]`: OAuth and session management
- `register`: User registration with validation
- `auto-login`: Automatic login functionality
- `manual-logout`: Secure logout process

### Content Management (`/api/posts/`)
- `GET/POST /`: List and create posts
- `GET/PUT/DELETE /[postId]`: Individual post operations
- `POST /[postId]/vote`: Voting system
- `POST /[postId]/share`: Social sharing
- `GET /[postId]/comments/count`: Comment statistics

### Comments (`/api/comments/`)
- `GET/POST /`: List and create comments
- `PUT/DELETE /[commentId]`: Comment management
- `POST /[commentId]/vote`: Comment voting

### User Management (`/api/users/`)
- `GET/PUT /[id]`: Profile management
- `POST /[id]/settings`: User preferences
- `POST /[id]/two-factor`: 2FA management
- `POST /[id]/change-password`: Password updates
- `POST /[id]/delete-account`: Account deletion
- `GET /[id]/activity`: User activity tracking
- `POST /[id]/export-data`: Data export functionality

### Badge System (`/api/badges/`)
- `GET /`: List all available badges
- `POST /`: Create new badges (admin)
- `GET /user/[id]`: User's earned badges
- `GET /leaderboard`: Community badge rankings
- `POST /check`: Check badge eligibility

### Admin Panel (`/api/admin/`)
- `GET /stats`: Community statistics
- `GET/PATCH /users`: User management
- `GET/POST /pages`: Custom page management
- `GET/PUT /settings`: Site configuration
- `POST /seed-categories`: Category seeding
- `POST /cleanup-blobs`: File cleanup

### File Management (`/api/upload/`)
- `POST /blob`: Azure Blob Storage upload
- `POST /token`: Upload token generation
- `POST /registration`: Registration file upload

### Real-Time Features (`/api/websocket/`)
- Socket.IO integration for live updates
- Real-time notifications
- Live comment updates
- Instant voting updates

---

## UI Components

### Core Components
- **PostCard**: Rich post display with voting and interaction
- **PostCreator**: Advanced post creation with media upload
- **PostModal**: Full-screen post viewing experience
- **ImagePostModal**: Specialized image post viewer
- **TextPostModal**: Text-focused post viewer
- **CommentSection**: Threaded comment system
- **ActivityFeed**: Real-time activity stream

### User Interface
- **Header**: Navigation with user menu and notifications
- **Sidebar**: Trending content and community highlights
- **Footer**: Site information and links
- **NotificationDropdown**: Real-time notification center
- **ShareDropdown**: Social sharing options
- **BadgeDisplay**: Professional badge showcase

### Admin Components
- **AdminDashboard**: Comprehensive admin interface
- **ProfessionalBadgeSystem**: Badge management interface
- **AuthGuard**: Route protection and access control

### Utility Components
- **ThemeProvider**: Dark/light mode support
- **Providers**: Context providers for state management
- **SocketContext**: Real-time communication context
- **SidebarContext**: Sidebar state management

---

## Categories

The forum organizes content into seven main categories:

- **🏢 Business**: Entrepreneurship, industry strategies, market trends, professional networking
- **🎨 Design**: Architectural concepts, design inspiration, creative processes, visual storytelling
- **💼 Career**: Job opportunities, professional development, industry advice, career growth
- **🏗️ Construction**: Building techniques, materials, project management, construction innovations
- **🎓 Academic**: Research papers, educational resources, theoretical discussions, learning
- **📰 Informative**: Industry news, updates, tutorials, educational content
- **💬 Other**: General discussions, off-topic conversations, community building

---

## Badge System

### Badge Categories
1. **Activity Badges**: Recognition for community participation
   - First Steps, Active Contributor, Prolific Writer, Content Creator
2. **Engagement Badges**: Recognition for community interaction
   - Conversationalist, Discussion Leader, Community Connector, Engagement Expert
3. **Appreciation Badges**: Recognition for helpful contributions
   - Helpful Responder, Valued Contributor, Community Helper, Appreciation Master
4. **Content Type Badges**: Recognition for specific content types
   - Visual Storyteller, Question Master, Answer Expert, Content Specialist
5. **Quality Badges**: Recognition for high-quality contributions
   - Quality Contributor, Expert Advisor, Knowledge Keeper, Quality Master
6. **Tenure Badges**: Recognition for community longevity
   - Newcomer, Regular Member, Veteran Member, Community Elder
7. **Achievement Badges**: Recognition for special accomplishments
   - Rising Star, Community Expert, Top Contributor, Forum Legend

### Badge Levels
- **🥉 Bronze**: Entry-level achievements
- **🥈 Silver**: Intermediate accomplishments
- **🥇 Gold**: Advanced achievements
- **💎 Platinum**: Elite recognition

---

## User Management

### User Roles
- **Admin**: Full system access, user management, content moderation
- **Moderator**: Content moderation, user assistance, community management
- **Member**: Standard user with full community access

### User Features
- **Profile Management**: Comprehensive profile editing
- **Privacy Settings**: Granular privacy controls
- **Email Preferences**: Customizable notification settings
- **Two-Factor Authentication**: Enhanced security options
- **Data Export**: Personal data download
- **Account Deletion**: Complete account removal

---

## Admin Features

### Dashboard Management
- **Statistics Overview**: Community metrics and analytics
- **User Management**: User roles, permissions, and moderation
- **Content Management**: Post and comment moderation
- **Category Management**: Content organization and structure
- **Settings Configuration**: Site-wide settings and preferences
- **Custom Pages**: Static page creation and management

### Moderation Tools
- **Content Flagging**: Community-driven content reporting
- **User Suspension**: Temporary and permanent restrictions
- **Badge Management**: Manual badge awarding and management
- **Analytics**: Detailed community insights and metrics

---

## Real-Time Features

### Socket.IO Integration
- **Live Comments**: Real-time comment updates
- **Instant Voting**: Immediate vote count updates
- **Live Notifications**: Real-time notification delivery
- **Room-Based Updates**: Efficient post-specific updates
- **Optimistic UI**: Instant user feedback with server confirmation

### Real-Time Components
- **Comment Updates**: Live comment threading
- **Vote Synchronization**: Global vote state management
- **Notification Delivery**: Instant notification system
- **Activity Streams**: Live activity feeds

---

## Email System

### Email Features
- **Multi-Provider Support**: SMTP and Resend integration
- **Template System**: Rich HTML email templates
- **Delivery Tracking**: Comprehensive email logging
- **Preference Management**: Granular email preferences
- **Digest Emails**: Scheduled activity summaries

### Email Types
- **Welcome Emails**: New user onboarding
- **Verification Emails**: Account verification
- **Notification Emails**: Engagement notifications
- **Digest Emails**: Periodic activity summaries
- **System Emails**: Administrative communications

---

## File Management

### Upload Features
- **Multiple Formats**: JPEG, PNG, GIF, WebP support
- **Size Optimization**: Automatic image resizing
- **Format Conversion**: WebP optimization for performance
- **Secure Storage**: Azure Blob Storage integration
- **CDN Delivery**: Global content delivery

### File Processing
- **Sharp Integration**: Advanced image processing
- **Automatic Optimization**: Size and format optimization
- **Security Validation**: File type and size validation
- **Storage Management**: Efficient file organization

---

## Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Google Gemini API key (for AI features)
- OAuth provider credentials (Google, Facebook, LinkedIn)
- Email service configuration (SMTP or Resend)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/archalley-forum.git
   cd archalley-forum
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Environment setup**
   ```bash
   cp env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Database setup**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

5. **Seed initial data**
   ```bash
   npm run seed
   npm run seed:badges
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

### Environment Variables

Required environment variables (see `env.example` for complete list):

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# AI Integration
GEMINI_API_KEY="your-gemini-api-key"

# Email Service
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"

# File Storage (Azure Blob Storage)
AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;AccountName=your-account-name;AccountKey=your-account-key;EndpointSuffix=core.windows.net"
# Or use separate credentials:
# AZURE_STORAGE_ACCOUNT_NAME="your-account-name"
# AZURE_STORAGE_ACCOUNT_KEY="your-account-key"
```

---

## Deployment

### Production Setup

1. **Database Migration**
   ```bash
   npm run db:migrate
   ```

2. **Build Application**
   ```bash
   npm run build
   ```

3. **Start Production Server**
   ```bash
   npm start
   ```

### Deployment Scripts
- `npm run deploy:setup`: Production database setup
- `npm run deploy:check`: Health check verification
- `npm run deploy:test`: API endpoint testing

### Security Considerations
- Enable HTTPS in production
- Configure proper CORS settings
- Set up rate limiting
- Implement monitoring and logging
- Regular security updates

---

## Contributing

We welcome contributions to Archalley Forum! Please see our contributing guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Development Guidelines
- Follow TypeScript best practices
- Use Prettier for code formatting
- Write meaningful commit messages
- Test your changes thoroughly
- Update documentation as needed

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.