# StudentDrive - AI-Powered Learning Platform

## Overview

StudentDrive is a comprehensive web application designed to enhance student learning through AI-powered tools and collaborative content sharing. The platform supports multiple user roles (students, institutions, and admins) and provides features for note management, assessment creation, AI-generated study materials, and subscription-based premium content.

The application serves as a centralized hub where students can upload and share study materials, take AI-generated quizzes, create flashcards from their notes, and track their learning progress. Institutions can manage their programs and students, while admins oversee the entire platform.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client-side application uses a modern React setup with TypeScript for type safety and enhanced developer experience. The architecture follows these key patterns:

- **Framework**: React 18 with Vite for fast development and optimized builds
- **Routing**: Wouter for lightweight client-side routing with protected routes for authenticated users
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Framework**: Tailwind CSS with shadcn/ui component library for consistent design
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **Authentication Context**: Custom React context for managing user authentication state

The application implements a component-based architecture with clear separation between pages, reusable UI components, and business logic hooks. Protected routes ensure proper access control based on user authentication status.

### Backend Architecture
The server-side follows a RESTful API design built on Express.js with the following architectural decisions:

- **Framework**: Express.js with TypeScript for type-safe server development
- **Authentication**: Passport.js with local strategy and session-based authentication
- **Password Security**: Scrypt-based password hashing with salt for secure credential storage
- **File Upload**: Multer middleware for handling file uploads with type and size restrictions
- **Session Management**: Express sessions with PostgreSQL session store for persistence
- **API Structure**: RESTful endpoints organized by resource type (users, content, assessments, etc.)

The backend implements middleware patterns for request logging, error handling, and authentication checks. Route handlers are organized in a modular structure for maintainability.

### Database Design
The application uses PostgreSQL as the primary database with Drizzle ORM for type-safe database operations:

- **ORM**: Drizzle ORM with schema-first approach for type safety
- **Schema**: Comprehensive relational schema supporting users, institutions, programs, content, assessments, and activity tracking
- **Migrations**: Drizzle Kit for database schema migrations and version control
- **Connection**: Neon serverless PostgreSQL with connection pooling

The database schema supports complex relationships between entities, enabling features like institutional program management, content categorization, and user progress tracking.

### AI Integration
OpenAI API integration provides intelligent content generation capabilities:

- **Model**: GPT-5 for text generation and content analysis
- **Features**: Flashcard generation, quiz creation, content summarization, and mind mapping
- **Processing**: Server-side AI content generation with structured JSON responses
- **Error Handling**: Graceful fallbacks and user feedback for AI operation failures

AI tools are integrated as server-side services that process user content and return structured educational materials.

### Authentication & Authorization
Session-based authentication system with role-based access control:

- **Strategy**: Local authentication strategy with username/email and password
- **Sessions**: Server-side session storage in PostgreSQL for security and scalability
- **Roles**: Three distinct user roles (student, institution, admin) with different permissions
- **Protection**: Route-level protection with redirect handling for unauthorized access

The authentication system maintains user sessions across requests and provides proper access control throughout the application.

### File Management
Comprehensive file upload and management system for educational content:

- **Storage**: Local file system storage with organized directory structure
- **Validation**: File type restrictions (PDF, PPTX, DOC, DOCX) and size limits (20MB)
- **Security**: File type validation and sanitization to prevent malicious uploads
- **Organization**: Content categorization by institution, program, and subject matter

## External Dependencies

### Database Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting with automatic scaling and branching capabilities
- **Connection Pooling**: @neondatabase/serverless for efficient database connections in serverless environments

### AI Services
- **OpenAI API**: GPT-5 integration for content generation, analysis, and educational tool creation
- **Capabilities**: Text processing, quiz generation, flashcard creation, and content summarization

### Payment Processing
- **Stripe**: Complete payment infrastructure for subscription management and premium features
- **Integration**: React Stripe.js for frontend payment forms and server-side webhook handling
- **Features**: Subscription tiers, customer management, and secure payment processing

### UI Component Library
- **Radix UI**: Headless, accessible UI primitives for complex interactive components
- **shadcn/ui**: Pre-built component library built on Radix UI with Tailwind CSS styling
- **Lucide React**: Comprehensive icon library for consistent visual elements

### Development Tools
- **Vite**: Fast build tool with hot module replacement for efficient development
- **TypeScript**: Type safety across the entire application stack
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **ESBuild**: Fast JavaScript bundler for production builds

### Hosting & Deployment
- **Replit**: Development and hosting platform with integrated development environment
- **WebSocket Support**: Real-time functionality support for interactive features
- **Environment Configuration**: Automated environment setup and deployment workflows