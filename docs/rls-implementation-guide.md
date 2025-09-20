# Row-Level Security (RLS) Implementation Guide

## 🎯 Overview

This document provides a comprehensive guide for implementing Row-Level Security (RLS) policies in the Pilot codebase using Drizzle ORM with Neon DB. RLS ensures that users can only access data they're authorized to see, providing an additional layer of security beyond application-level permissions.

## 📋 Table of Contents

1. [Understanding RLS in Our Context](#understanding-rls-in-our-context)
2. [Current Architecture Analysis](#current-architecture-analysis)
3. [RLS Implementation Strategy](#rls-implementation-strategy)
4. [Database Schema Updates](#database-schema-updates)
5. [Policy Definitions](#policy-definitions)
6. [Authentication Integration](#authentication-integration)
7. [Migration Strategy](#migration-strategy)
8. [Testing & Validation](#testing--validation)
9. [Performance Considerations](#performance-considerations)
10. [Monitoring & Maintenance](#monitoring--maintenance)
11. [Rollback Plan](#rollback-plan)

---

## 🧠 Understanding RLS in Our Context

### What is RLS?
Row-Level Security is a PostgreSQL feature that restricts which rows a user can access in a table. It operates at the database level, providing security even if application logic is bypassed.

### Why RLS for Pilot?
- **Multi-tenant Architecture**: Each user should only see their own contacts, automations, and data
- **Data Isolation**: Prevent accidental cross-user data access
- **Compliance**: Ensure data privacy and security standards
- **Defense in Depth**: Additional security layer beyond application logic

### Current Data Relationships
Based on our schema analysis:
- All user data is linked via `userId` foreign keys
- Primary entities: `user`, `contact`, `automation`, `sidekickSetting`
- Authentication handled by Better Auth with JWT tokens

---

## 🏗️ Current Architecture Analysis

### Database Setup
- **Provider**: Neon DB (serverless PostgreSQL)
- **ORM**: Drizzle ORM v0.44.5
- **Auth**: Better Auth with JWT tokens
- **Schema Location**: `src/lib/db/schema.ts`

### Tables in `src/lib/db/schema.ts`

1. **User Data Tables** (typically require RLS):
   - `contact` — User's Instagram contacts
   - `contact_tag` — Tags for contacts
   - `userOffer` — User's business offers
   - `userOfferLink` — Links related to user offers
   - `userToneProfile` — User's communication style
   - `userFaq` — User's FAQ responses
   - `sidekickSetting` — User's AI assistant settings
   - `chatSession` — User's chat sessions
   - `chatMessage` — Messages within chat sessions

2. **Automation Tables** (typically require RLS):
   - `automation` — User's automation rules
   - `automation_post` — Posts associated with automations
   - `automationActionLog` — Logs of automation executions

3. **Integration Tables** (typically require RLS):
   - `instagramIntegration` — User's Instagram connections
   - `sidekickActionLog` — Logs of AI assistant actions

4. **System Tables** (generally do NOT require RLS):
   - `user` — User accounts
   - `session` — Auth sessions
   - `account` — Linked accounts
   - `verification` — Verification records

---

## 🎯 RLS Implementation Strategy

### Phase 1: Foundation Setup
1. **Enable RLS on Target Tables**
2. **Create Neon-specific Roles and Functions**
3. **Update Drizzle Configuration**
4. **Create Initial Policies**

### Phase 2: Policy Implementation
1. **User Isolation Policies**
2. **Cascade Delete Policies**
3. **Read/Write Permission Policies**
4. **Integration-specific Policies**

### Phase 3: Integration & Testing
1. **Better Auth Integration**
2. **Application Code Updates**
3. **Comprehensive Testing**
4. **Performance Optimization**

---

## 🗄️ Database Schema Updates

### 1. Drizzle Configuration Updates

**File**: `drizzle.config.ts`

```typescript
// Add RLS support to drizzle config
export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // Enable role management for RLS
  entities: {
    roles: {
      provider: 'neon' // Exclude Neon-defined roles
    }
  },
  verbose: true,
  strict: true,
});
```

### 2. Schema Structure Updates

**File**: `src/lib/db/schema.ts`

#### Import Neon RLS Utilities
```typescript
import { 
  authenticatedRole, 
  anonymousRole, 
  authUid 
} from 'drizzle-orm/neon';
import { 
  pgPolicy, 
  pgRole 
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
```

#### Create Custom Roles
```typescript
// Define custom roles for different access levels
export const userRole = pgRole('user_role');
export const adminRole = pgRole('admin_role');
```

---

## 🔐 Policy Definitions

### 1. User Isolation Policies

#### Contact Table Policies
```typescript
export const contact = pgTable("contact", {
  // ... existing fields
}, (table) => [
  // Users can only see their own contacts
  pgPolicy('user_contacts_policy', {
    for: 'all',
    to: authenticatedRole,
    using: sql`user_id = auth.uid()`,
    withCheck: sql`user_id = auth.uid()`
  }),
  
  // Allow service role for system operations
  pgPolicy('service_contacts_policy', {
    for: 'all',
    to: 'service_role',
    using: sql`true`,
    withCheck: sql`true`
  })
]);
```

#### Automation Table Policies
```typescript
export const automation = pgTable("automation", {
  // ... existing fields
}, (table) => [
  pgPolicy('user_automations_policy', {
    for: 'all',
    to: authenticatedRole,
    using: sql`user_id = auth.uid()`,
    withCheck: sql`user_id = auth.uid()`
  })
]);
```

### 2. Cascade Policies

#### Contact Tags
```typescript
export const contactTag = pgTable("contact_tag", {
  // ... existing fields
}, (table) => [
  pgPolicy('user_contact_tags_policy', {
    for: 'all',
    to: authenticatedRole,
    using: sql`contact_id IN (
      SELECT id FROM contact WHERE user_id = auth.uid()
    )`,
    withCheck: sql`contact_id IN (
      SELECT id FROM contact WHERE user_id = auth.uid()
    )`
  })
]);
```

### 3. Integration-Specific Policies

#### Instagram Integration
```typescript
export const instagramIntegration = pgTable("instagram_integration", {
  // ... existing fields
}, (table) => [
  pgPolicy('user_instagram_integration_policy', {
    for: 'all',
    to: authenticatedRole,
    using: sql`user_id = auth.uid()`,
    withCheck: sql`user_id = auth.uid()`
  })
]);
```

---

## 🔑 Authentication Integration

### 1. Better Auth RLS Integration

#### JWT Token Structure
Better Auth provides JWT tokens with user information. We need to ensure:
- `sub` field contains user ID
- `role` field is set appropriately
- Token is passed to database queries

#### Database Connection Setup
```typescript
// src/lib/db/connection.ts
import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';

export function createRLSConnection(token: string) {
  const client = neon(process.env.DATABASE_URL!);
  
  return drizzle(client, {
    logger: true,
    // Set up RLS context
    beforeQuery: async (query) => {
      // Set JWT claims for RLS
      await client(sql`
        SELECT set_config('request.jwt.claims', '${sql.raw(token)}', true);
        SELECT set_config('request.jwt.claim.sub', '${sql.raw(extractUserId(token))}', true);
      `);
    }
  });
}
```

### 2. Application-Level Integration

#### Server Actions with RLS
```typescript
// src/actions/contacts.ts
import { auth } from '@/lib/auth';
import { createRLSConnection } from '@/lib/db/connection';

export async function getContacts() {
  const session = await auth.api.getSession({
    headers: headers()
  });
  
  if (!session) {
    throw new Error('Unauthorized');
  }
  
  const db = createRLSConnection(session.token);
  return db.select().from(contact);
}
```

---

## 🚀 Migration Strategy

### 1. Pre-Migration Checklist
- [ ] Backup production database
- [ ] Test RLS policies in development
- [ ] Verify all queries work with RLS enabled
- [ ] Performance testing with RLS policies

### 2. Migration Steps

#### Step 1: Enable RLS on Tables
```sql
-- Enable RLS on all user data tables
ALTER TABLE contact ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation ENABLE ROW LEVEL SECURITY;
ALTER TABLE sidekick_setting ENABLE ROW LEVEL SECURITY;
-- ... continue for all user tables
```

#### Step 2: Create Policies
```sql
-- Create user isolation policies
CREATE POLICY user_contacts_policy ON contact
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

#### Step 3: Test Policies
```sql
-- Test with different user contexts
SET ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = 'user-id-123';
SELECT * FROM contact; -- Should only return user's contacts
```

### 3. Rollback Plan
```sql
-- Disable RLS if needed
ALTER TABLE contact DISABLE ROW LEVEL SECURITY;
DROP POLICY user_contacts_policy ON contact;
```

---

## 🧪 Testing & Validation

### 1. Unit Tests
```typescript
// tests/rls-policies.test.ts
describe('RLS Policies', () => {
  it('should only return user contacts', async () => {
    const user1Db = createRLSConnection(user1Token);
    const user2Db = createRLSConnection(user2Token);
    
    const user1Contacts = await user1Db.select().from(contact);
    const user2Contacts = await user2Db.select().from(contact);
    
    // Verify isolation
    expect(user1Contacts).not.toContain(user2Contacts[0]);
  });
});
```

### 2. Integration Tests
- Test all CRUD operations with RLS
- Verify cascade operations work correctly
- Test authentication edge cases
- Performance testing with large datasets

### 3. Security Testing
- Attempt cross-user data access
- Test with invalid/malformed tokens
- Verify service role permissions
- Test policy bypass attempts

---

## ⚡ Performance Considerations

### 1. Index Optimization
```sql
-- Ensure user_id columns are indexed for RLS performance
CREATE INDEX idx_contact_user_id ON contact(user_id);
CREATE INDEX idx_automation_user_id ON automation(user_id);
-- ... for all user tables
```

### 2. Query Optimization
- Use `EXPLAIN ANALYZE` to check query plans
- Monitor slow queries with RLS enabled
- Consider materialized views for complex queries
- Optimize policy conditions

### 3. Connection Pooling
- Configure connection pooling for RLS context
- Monitor connection usage patterns
- Consider read replicas for reporting queries

---

## 📊 Monitoring & Maintenance

### 1. Monitoring Setup
```typescript
// Monitor RLS policy performance
const rlsMetrics = {
  queryTime: performance.now(),
  policyHits: 0,
  policyMisses: 0,
  errors: []
};
```

### 2. Logging
- Log all RLS policy violations
- Monitor authentication failures
- Track performance metrics
- Alert on unusual access patterns

### 3. Maintenance Tasks
- Regular policy review and updates
- Performance optimization
- Security audit of policies
- Documentation updates

---

## 🔄 Rollback Plan

### 1. Immediate Rollback
```sql
-- Disable RLS on all tables
ALTER TABLE contact DISABLE ROW LEVEL SECURITY;
ALTER TABLE automation DISABLE ROW LEVEL SECURITY;
-- ... continue for all tables
```

### 2. Application Rollback
- Revert to previous application version
- Remove RLS-specific code changes
- Restore previous database connection logic

### 3. Data Recovery
- Restore from backup if needed
- Verify data integrity
- Test application functionality

---

## 📝 Implementation Checklist

### Phase 1: Foundation
- [ ] Update `drizzle.config.ts` with RLS support
- [ ] Add Neon RLS imports to schema
- [ ] Create custom roles if needed
- [ ] Enable RLS on target tables

### Phase 2: Policies
- [ ] Implement user isolation policies
- [ ] Add cascade policies for related tables
- [ ] Create service role policies
- [ ] Test all policies in development

### Phase 3: Integration
- [ ] Update database connection logic
- [ ] Modify server actions for RLS
- [ ] Update authentication flow
- [ ] Test end-to-end functionality

### Phase 4: Deployment
- [ ] Create migration scripts
- [ ] Deploy to staging environment
- [ ] Run comprehensive tests
- [ ] Deploy to production
- [ ] Monitor and validate

---

## 🚨 Important Notes

### Security Considerations
- **Never disable RLS** on production tables with user data
- **Always test policies** thoroughly before deployment
- **Monitor for policy violations** and unauthorized access attempts
- **Keep policies simple** to avoid performance issues

### Performance Impact
- RLS adds overhead to every query
- Complex policies can significantly impact performance
- Monitor query performance after RLS implementation
- Consider indexing strategies for policy conditions

### Maintenance
- Review and update policies regularly
- Monitor for new security requirements
- Keep documentation up to date
- Train team on RLS concepts and troubleshooting

---

## 📚 Additional Resources

- [Drizzle RLS Documentation](https://orm.drizzle.team/docs/rls)
- [Neon RLS Guide](https://neon.com/docs/guides/rls-drizzle)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Better Auth Documentation](https://www.better-auth.com/docs)

---

## 🎯 Success Metrics

- **Security**: Zero cross-user data access incidents
- **Performance**: <10% query performance degradation
- **Reliability**: 99.9% uptime with RLS enabled
- **Maintainability**: Clear documentation and monitoring

---

*This document should be reviewed and updated as the RLS implementation progresses and new requirements emerge.*