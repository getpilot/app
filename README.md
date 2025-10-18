<p align="center">
  <a href="https://pilot-ops.vercel.app" rel="noopener">
 <img width=600px height=315px src="https://pilot-ops.vercel.app/og.png" alt="Pilot - Instagram Automation Platform"></a>
</p>

<h3 align="center">Pilot - Instagram Automation & Deal Management Platform</h3>

<div align="center">

[![Status](https://img.shields.io/badge/status-active-success.svg)]()
[![GitHub Issues](https://img.shields.io/github/issues/pilot-ops-crm/app.svg)](https://github.com/pilot-ops-crm/app/issues)
[![GitHub Pull Requests](https://img.shields.io/github/issues-pr/pilot-ops-crm/app.svg)](https://github.com/pilot-ops-crm/app/pulls)
[![License](https://img.shields.io/badge/license-Proprietary-blue.svg)]()

</div>

---

<p align="center">
  AI-powered Instagram automation for lead management and sales — built for creators, entrepreneurs, and social media managers to automate responses, manage contacts, and streamline deals.
</p>

## 📝 Table of Contents

- [About](#about)
- [Getting Started](#getting_started)
- [Deployment](#deployment)
- [Usage](#usage)
- [Built Using](#built_using)
- [Documentation](./docs/)
- [Authors](#authors)
- [Acknowledgments](#acknowledgement)

## 🧐 About <a name = "about"></a>

Pilot is an Instagram automation and deal management platform designed to help creators, entrepreneurs, small businesses, and social media managers transform their Instagram presence into a powerful lead generation and sales engine.

The platform features an AI-powered "Sidekick" that acts as a personalized assistant for managing deals, tracking progress, and providing intelligent recommendations. Users can automate responses to Instagram reels and interactions (e.g., replying 'YES' to receive resources or packages in their inbox), manage contacts with advanced scoring and filtering, and create custom automation workflows for repetitive tasks.

Built with modern web technologies, Pilot emphasizes AI-driven personalization, seamless Instagram integration, and user-friendly automations to streamline social commerce workflows. The platform is currently in active development and focuses on transparency through open-source practices.

## 🏁 Getting Started <a name = "getting_started"></a>

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See [deployment](#deployment) for notes on how to deploy the project on a live system.

### Prerequisites

- **Node.js** (v18 or higher)
- **pnpm** package manager
- **PostgreSQL** database (or compatible like Neon)
- **Instagram Developer Account** (for API features)

### Installing

1. **Clone the repository**

   ```bash
   git clone https://github.com/pilot-ops-crm/app.git
   cd app
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   Copy `.env.example` to `.env.local` and configure.

4. **Set up the database**

   ```bash
   # Generate and run migrations
   pnpm db:generate
   pnpm db:migrate

   # Optional: Open Drizzle Studio for database inspection
   pnpm db:studio
   ```

5. **Start the development server**

   ```bash
   # Basic development server
   pnpm dev

   # Or run all services together (includes Inngest and database studio)
   pnpm dev:all
   ```

The application will be available at `http://localhost:3000`.

## 🔧 Running the tests <a name = "tests"></a>

Currently, the project uses manual testing and user acceptance testing. Automated testing setup is planned for future releases.

### Manual Testing

1. **Development Testing**

   - Run the development server with `pnpm dev`
   - Test core features: Instagram login, contact management, automation creation, sidekick interactions
   - Verify database operations and API endpoints

2. **Integration Testing**

   - Test Instagram API connections
   - Verify webhook functionality
   - Test real-time features and chat integration

3. **User Journey Testing**
   - Complete onboarding flow
   - Create and test automations
   - Manage contacts and view analytics

### Code Quality Checks

Run linting and type checking:

```bash
# Lint the codebase
pnpm lint

# Type checking
pnpm typecheck
```

## 🎈 Usage <a name="usage"></a>

### Core Features

1. **Instagram Integration**

   - Connect your Instagram account via OAuth
   - Set up automated responses to reels and stories
   - Configure lead capture from direct messages

2. **Contact Management**

   - View and organize Instagram contacts in a centralized table
   - Score contacts based on engagement and relevance
   - Add custom tags and notes for better organization
   - Filter and search through your contact database

3. **Automation Workflows**

   - Create custom automation templates
   - Set up triggers based on Instagram interactions
   - Configure automated responses and follow-ups
   - Monitor automation performance and logs

4. **AI Sidekick**

   - Set up your personalized AI assistant
   - Configure prompts and behavior preferences
   - Use for deal management and recommendations
   - Track conversation history and insights

5. **Dashboard and Analytics**
   - Monitor key metrics and performance
   - View automation success rates
   - Track contact engagement and conversion

### Getting Started Workflow

1. Complete the onboarding process
2. Connect your Instagram account
3. Set up your first automation (e.g., "YES" response to reels)
4. Import or start collecting contacts
5. Configure your AI Sidekick preferences
6. Monitor and optimize your automations

For detailed guides, see the [documentation](./docs/) folder.

## 🚀 Deployment <a name = "deployment"></a>

The project is configured for deployment on Vercel with the following services:

### Production Deployment

1. **Vercel Deployment**

   - Connect your repository to Vercel
   - Configure environment variables in Vercel dashboard
   - Deploy automatically on pushes to main branch

2. **Required Environment Variables**

   ```env
   BETTER_AUTH_SECRET=""
   BETTER_AUTH_URL=""

   DATABASE_URL=""

   GOOGLE_CLIENT_ID=""
   GOOGLE_CLIENT_SECRET=""

   POLAR_ACCESS_TOKEN=""
   POLAR_ORG_SLUG=""

   INSTAGRAM_CLIENT_ID=""
   INSTAGRAM_CLIENT_SECRET=""
   NEXT_PUBLIC_APP_URL=""

   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=""
   CLOUDINARY_API_KEY=""
   CLOUDINARY_API_SECRET=""

   GOOGLE_GENERATIVE_AI_API_KEY=""

   NODE_ENV="development"

   SENTRY_AUTH_TOKEN=""
   SENTRY_DSN=""
   ```

3. **Database Setup**

- Use Neon PostgreSQL for production database
- Run migrations on deployment: `pnpm db:migrate`

4. **Monitoring and Error Tracking**

- Sentry is configured for error tracking and performance monitoring
- Check Sentry dashboard for any production issues

5. **Domain Configuration**

- Configure custom domain in Vercel
- Update NEXTAUTH_URL to match your domain

### Additional Services

- **Inngest**: For data ingestion and workflow automation
- **Polar**: For payments and subscriptions
- **Cloudinary**: For image management and optimization

## ⛏️ Built Using <a name = "built_using"></a>

### Core Framework

- [Next.js](https://nextjs.org/) - React Framework with App Router
- [React](https://react.dev/) - UI Library (v19.1.1)
- [TypeScript](https://www.typescriptlang.org/) - Type Safety
- [Node.js](https://nodejs.org/en/) - Runtime Environment

### Database & ORM

- [Drizzle ORM](https://orm.drizzle.team/) - Database Toolkit
- [PostgreSQL](https://www.postgresql.org/) - Primary Database
- [Neon](https://neon.tech/) - Serverless PostgreSQL

### Authentication & Authorization

- [Better Auth](https://better-auth.com/) - Authentication System
- [NextAuth.js](https://next-auth.js.org/) - Authentication Integration

### UI & Styling

- [Tailwind CSS](https://tailwindcss.com/) - Utility-First CSS Framework
- [shadcn/ui](https://ui.shadcn.com/) - Modern UI Components
- [Radix UI](https://www.radix-ui.com/) - Headless UI Components
- [Lucide React](https://lucide.dev/) - Icon Library

### AI & External APIs

- [Vercel AI SDK](https://sdk.vercel.ai/) - AI Integration
- [Google AI](https://ai.google.dev/) - AI Provider
- [Instagram API](https://developers.facebook.com/docs/instagram) - Social Media Integration

### Development & Deployment

- [Vercel](https://vercel.com/) - Deployment Platform
- [pnpm](https://pnpm.io/) - Package Manager
- [ESLint](https://eslint.org/) - Code Linting
- [Sentry](https://sentry.io/) - Error Tracking & Performance Monitoring

### Additional Libraries

- [React Hook Form](https://react-hook-form.com/) - Form Management
- [TanStack Table](https://tanstack.com/table) - Data Tables
- [Motion](https://motion.dev/) - Animation Library
- [date-fns](https://date-fns.org/) - Date Utilities
- [Zod](https://zod.dev/) - Schema Validation

## ✍️ Authors <a name = "authors"></a>

- **ArjunCodess** - Project development and maintenance

_Note: This project embraces open-source values and transparency. We love open source because it keeps us accountable, fosters collaboration, and drives innovation. For collaboration opportunities or questions, please reach out through the appropriate channels._

## 🎉 Acknowledgements <a name = "acknowledgement"></a>

- **Instagram** for providing the API that powers our social media integrations
- **Vercel** for the excellent deployment platform and AI SDK
- **Neon** for reliable serverless PostgreSQL hosting
- **shadcn/ui** and **Radix UI** for beautiful, accessible component libraries
- **Drizzle Team** for the powerful ORM toolkit
- **Open Source Community** for the countless libraries and tools that make modern web development possible

---

<div align="center">

**Pilot** - Transforming Instagram interactions into business opportunities

_Built with ❤️ for creators and entrepreneurs_

</div>
