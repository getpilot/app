# Convex Migration Plan: Neon DB + Drizzle ORM + Better Auth → Convex + Better Auth

## Overview

This document outlines a comprehensive migration plan to transition from Neon DB with Drizzle ORM and Better Auth to a Convex backend integrated with Better Auth. Server actions will be maintained for most functionality, with API routes only used for webhooks and official Instagram endpoints.

## Current Architecture Analysis

### Current Stack
- **Database**: Neon DB (PostgreSQL)
- **ORM**: Drizzle ORM
- **Authentication**: Better Auth with Drizzle adapter
- **Server Actions**: `src/actions/`
- **API Routes**: `src/app/api/`

### Current Database Schema
Based on analysis, the current schema includes:
- **Core Tables**: `user`, `account`, `session`, `verification`
- **Instagram Integration**: `instagram_integration`, `contact`, `automation`, `automation_action_log`
- **Sidekick Features**: `sidekick_action_log`, `sidekick_setting`, `user_faq`, `user_offer`, `user_offer_link`, `user_tone_profile`
- **Chat System**: `chat_session`, `chat_message`
- **Automation System**: `automation`, `automation_post`, `automation_action_log`

### Current Actions Structure
- `src/actions/automations.ts` - Automation management
- `src/actions/contacts.ts` - Contact management and Instagram sync
- `src/actions/instagram.ts` - Instagram API integration
- `src/actions/onboarding.ts` - User onboarding flow
- `src/actions/settings.ts` - User settings management
- `src/actions/realtime.ts` - Real-time functionality
- `src/actions/upload.ts` - File upload handling
- `src/actions/sidekick/` - Sidekick-specific actions (AI tools, onboarding, settings, etc.)

## Migration Strategy

### Phase 1: Convex Setup and Configuration

#### 1.1 Initialize Convex Project
- Install Convex dependencies: `convex`, `@convex-dev/react`
- Run `npx convex dev` to initialize Convex project
- Configure Convex deployment URLs and environment variables
- Set up Convex dashboard access

#### 1.2 Configure Better Auth with Convex
- Install `@convex-dev/better-auth` package
- Create `convex/auth.config.ts` for Better Auth configuration
- Register Better Auth component in `convex.config.ts`
- Set up environment variables:
  - `BETTER_AUTH_SECRET`
  - `BETTER_AUTH_URL`
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `POLAR_ACCESS_TOKEN`

#### 1.3 Create Convex Schema
- Define Convex schema in `convex/schema.ts`
- Map existing Drizzle tables to Convex documents
- Handle relationships and indexes appropriately
- Consider data types and validation

### Phase 2: Database Operations Conversion

#### 2.1 Schema Translation
- Convert PostgreSQL schema to Convex document schema
- Map foreign key relationships to document references
- Handle array fields and complex data types
- Set up proper indexing for performance

#### 2.2 Drizzle ORM to Convex Functions Conversion
- Convert all Drizzle queries to Convex queries
- Convert all Drizzle mutations to Convex mutations
- Convert complex operations to Convex actions
- Handle transaction-like operations in Convex

#### 2.3 Better Auth Integration
- Replace Drizzle adapter with Convex adapter
- Update Better Auth configuration for Convex
- Test authentication flows with new backend
- Validate session management

### Phase 3: Server Actions Migration with Convex

#### 3.1 Convex Functions Creation
- Create queries for data retrieval operations
- Create mutations for data modification operations
- Create actions for external API calls and complex operations
- Implement proper error handling and validation

#### 3.2 Server Actions Conversion Strategy

**Maintain Server Actions Structure**
Keep existing server actions but replace Drizzle database calls with Convex function calls:
- `src/actions/instagram.ts` - Instagram API integration (keep as server action)
- `src/actions/contacts.ts` - Contact management and sync (keep as server action)
- `src/actions/automations.ts` - Automation management (keep as server action)
- `src/actions/upload.ts` - File upload handling (keep as server action)
- `src/actions/sidekick/ai-tools/*` - All AI tool functions (keep as server actions)
- `src/actions/sidekick/onboarding.ts` - Sidekick onboarding (keep as server action)
- `src/actions/sidekick/settings.ts` - Sidekick settings (keep as server action)
- `src/actions/sidekick/personalized-*.ts` - Personalized data functions (keep as server actions)
- `src/actions/onboarding.ts` - General onboarding (keep as server action)
- `src/actions/settings.ts` - User settings (keep as server action)
- `src/actions/realtime.ts` - Real-time functionality (keep as server action)

**API Routes Only For Required Endpoints**
- Authentication endpoints (`src/app/api/auth/`) - Better Auth integration
- Instagram webhooks (`src/app/api/webhooks/instagram/`)
- Inngest webhooks (`src/app/api/inngest/`) - Background job processing
- Chat API (`src/app/api/chat/`) - AI chat functionality
- Any other official external API requirements

**Convert to Server Actions**
- Instagram sync configuration (`src/app/api/instagram/sync-config/`) → Convert to server action

### Phase 4: Minimal API Route Implementation

#### 4.1 Required API Routes Only
```
src/app/api/
├── auth/
│   ├── [...all]/
│   │   └── route.ts           # Better Auth endpoints (REQUIRED)
│   └── instagram/
│       ├── route.ts           # Instagram authentication (REQUIRED)
│       └── status/
│           └── route.ts       # Authentication status (REQUIRED)
├── webhooks/
│   └── instagram/
│       └── route.ts           # Instagram webhook handling (REQUIRED)
├── inngest/
│   └── route.ts               # Inngest webhook for background jobs (REQUIRED)
└── chat/
    ├── route.ts               # AI chat API (REQUIRED)
    └── sessions/
        ├── route.ts           # Chat session management (REQUIRED)
        └── [id]/
            └── route.ts       # Individual session operations (REQUIRED)
```

#### 4.2 Server Actions Structure (Maintained + Converted)
```
src/actions/
├── automations.ts             # Automation management (server action)
├── contacts.ts                # Contact management (server action)
├── instagram.ts               # Instagram API integration (server action)
├── instagram-sync-config.ts   # Instagram sync configuration (CONVERTED from API route)
├── onboarding.ts              # User onboarding (server action)
├── settings.ts                # User settings (server action)
├── realtime.ts                # Real-time functionality (server action)
├── upload.ts                  # File upload handling (server action)
└── sidekick/
    ├── ai-tools/
    │   ├── actions.ts         # Action logs (server action)
    │   ├── contacts.ts        # Contact AI tools (server action)
    │   ├── offers.ts          # Offer management (server action)
    │   ├── faqs.ts            # FAQ management (server action)
    │   ├── tone-profile.ts    # Tone profile (server action)
    │   └── user-profile.ts    # User profile (server action)
    ├── onboarding.ts          # Sidekick onboarding (server action)
    ├── settings.ts            # Sidekick settings (server action)
    ├── personalized-data.ts   # Personalized data (server action)
    └── personalized-prompts.ts # Personalized prompts (server action)
```

### Phase 5: Frontend Integration Updates

#### 5.1 Minimal Frontend Changes
- Keep existing server action imports (no changes needed)
- Maintain current form submission patterns
- Keep existing error handling patterns
- Maintain current loading states and optimistic updates

#### 5.2 Convex React Integration (Optional)
- Install and configure `@convex-dev/react` for real-time features
- Set up Convex provider in app layout
- Use Convex hooks for real-time data where beneficial
- Implement real-time subscriptions for live data updates

### Phase 6: Testing and Validation

#### 6.1 Unit Testing
- Test all Convex functions individually
- Test API route handlers
- Validate data transformations
- Test error scenarios

#### 6.2 Integration Testing
- Test end-to-end user flows
- Validate authentication integration
- Test Instagram webhook functionality
- Verify chat system operations

#### 6.3 Performance Testing
- Compare performance with previous implementation
- Test under load conditions
- Validate real-time functionality
- Monitor Convex usage and limits

### Phase 7: Deployment and Monitoring

#### 7.1 Staging Deployment
- Deploy to staging environment
- Run comprehensive tests
- Validate all functionality
- Performance benchmarking

#### 7.2 Production Migration
- Plan maintenance window
- Execute data migration
- Deploy new code
- Monitor for issues
- Rollback plan preparation

#### 7.3 Post-Migration Monitoring
- Monitor Convex dashboard metrics
- Track API performance
- Monitor error rates
- User feedback collection

### Phase 8: Cleanup and Documentation

#### 8.1 Code Cleanup
- Remove old Drizzle ORM code
- Delete unused server actions
- Clean up dependencies
- Remove Neon DB configuration

#### 8.2 Documentation Updates
- Update API documentation
- Update setup instructions
- Create migration runbook
- Update troubleshooting guides

## Detailed Implementation Steps

### Step 1: Convex Project Initialization
1. Install Convex packages
2. Run `npx convex dev`
3. Configure Convex dashboard
4. Set up environment variables
5. Test basic Convex functionality

### Step 2: Better Auth Integration
1. Install Convex Better Auth adapter
2. Create auth configuration
3. Set up authentication routes
4. Test authentication flows
5. Validate session management

### Step 3: Schema Conversion
1. Analyze existing Drizzle schema
2. Create Convex schema definitions
3. Map relationships and indexes
4. Validate schema design
5. Test schema operations

### Step 4: Database Operations Conversion
1. Convert Drizzle queries to Convex queries
2. Convert Drizzle mutations to Convex mutations
3. Convert complex operations to Convex actions
4. Handle Better Auth database operations
5. Test all database operations

### Step 5: Server Actions Conversion
1. Keep existing server action structure
2. Replace Drizzle database calls with Convex function calls
3. Update Better Auth integration in each action
4. Maintain existing error handling patterns
5. Keep existing input validation

### Step 6: Minimal API Route Implementation
1. Update existing Better Auth routes (`src/app/api/auth/[...all]/`)
2. Update existing Instagram webhook routes (`src/app/api/webhooks/instagram/`)
3. Update existing Instagram auth routes (`src/app/api/auth/instagram/`)
4. Update existing Inngest webhook routes (`src/app/api/inngest/`)
5. Update existing Chat API routes (`src/app/api/chat/`)
6. Convert Instagram sync-config API route to server action
7. Ensure proper error handling for webhooks
8. Maintain existing rate limiting

### Step 7: Frontend Updates (Minimal)
1. Keep existing import statements (no changes needed)
2. Maintain server action usage (no API route conversion)
3. Keep existing form handling patterns
4. Maintain existing loading states
5. Keep existing error handling

### Step 8: Testing Phase
1. Unit test all functions
2. Integration test workflows
3. End-to-end testing
4. Performance testing
5. Security testing

### Step 9: Deployment
1. Deploy to staging
2. Run acceptance tests
3. Deploy to production
4. Monitor system health
5. Collect user feedback

### Step 10: Cleanup
1. Remove old code
2. Update documentation
3. Clean up dependencies
4. Archive old database
5. Update deployment scripts

## Risk Mitigation

### Data Loss Prevention
- Complete data backup before migration
- Incremental migration approach
- Data validation at each step
- Rollback procedures

### Service Disruption Minimization
- Blue-green deployment strategy
- Feature flags for gradual rollout
- Monitoring and alerting setup
- Quick rollback capabilities

### Performance Considerations
- Load testing before migration
- Convex usage monitoring
- Caching strategy implementation
- Database optimization

## Success Criteria

### Technical Success
- All functionality working correctly
- Performance equal or better than current
- Zero data loss
- Successful authentication integration

### Business Success
- No user disruption
- Improved developer experience
- Reduced maintenance overhead
- Better scalability

## Timeline Estimation

- **Phase 1**: 3-5 days (Convex Setup and Better Auth Integration)
- **Phase 2**: 1-2 weeks (Database Operations Conversion)
- **Phase 3**: 1-2 weeks (Server Actions Migration with Convex)
- **Phase 4**: 2-3 days (Minimal API Route Updates)
- **Phase 5**: 1-2 days (Minimal Frontend Updates)
- **Phase 6**: 3-5 days (Testing)
- **Phase 7**: 2-3 days (Deployment)
- **Phase 8**: 1-2 days (Cleanup)

**Total Estimated Time**: 4-6 weeks

## Dependencies and Prerequisites

### Technical Dependencies
- Convex account and project setup
- Better Auth Convex adapter availability
- Environment variable configuration
- External API access (Instagram, Google, Polar)

### Team Dependencies
- Development team availability
- Testing resources
- DevOps support for deployment
- Stakeholder approval for migration

## Monitoring and Success Metrics

### Technical Metrics
- API response times
- Error rates
- Convex function execution times
- Database query performance
- Authentication success rates

### Business Metrics
- User engagement levels
- Feature usage statistics
- Support ticket volume
- System uptime
- User satisfaction scores

## Key Technical Challenges

### Database Operations Conversion
- **Drizzle Queries → Convex Queries**: Convert complex SQL queries with joins, filters, and aggregations
- **Drizzle Mutations → Convex Mutations**: Handle insert, update, delete operations with proper validation
- **Transaction Handling**: Convert Drizzle transactions to Convex's atomic operations
- **Better Auth Integration**: Replace Drizzle adapter with Convex adapter while maintaining authentication flows

### Server Actions Migration
- **Database Call Replacement**: Replace all Drizzle database calls with Convex function calls
- **Better Auth Integration**: Update Better Auth to use Convex adapter instead of Drizzle
- **Error Handling**: Maintain existing server action error patterns
- **Form Handling**: Keep existing server action form handling (no changes needed)
- **Real-time Features**: Optionally implement Convex subscriptions for live data updates

## Conclusion

This migration plan focuses on the core technical conversion work: transforming database operations from Neon + Drizzle to Convex while maintaining the existing server actions architecture. The phased approach ensures systematic conversion of each component while maintaining system reliability and minimal disruption.

The approach keeps all existing server actions intact, only replacing the underlying database operations with Convex functions. API routes are only used where absolutely required (webhooks and official Instagram endpoints), maintaining the simplicity and efficiency of the current server actions architecture while gaining Convex's real-time capabilities and simplified backend.
