# Instagram Automations Feature

## 🎯 Overview

The Instagram Automations feature enables users to set up trigger-based automated responses for Instagram DMs. When a DM contains a specific trigger word, the system automatically sends a predefined message or AI-generated response, otherwise the normal sidekick bot behavior continues.

## 🧩 Core Functionality

### Primary Flow
1. **Trigger Detection**: Every incoming DM is scanned for user-defined trigger words
2. **Conditional Response**: 
   - If trigger word matches → Send automation response (fixed message or AI-generated)
   - If no trigger → Continue with normal sidekick bot reply
3. **Response Types**: 
   - **Fixed Response**: Send a predefined static message
   - **AI Prompt**: Use a custom prompt to generate contextual AI responses

### Response Type Examples

**Fixed Response Example:**
- Trigger: "PRICE"
- Response: "Thanks for your interest! Our premium package is $99/month. Would you like to schedule a demo?"

**AI Prompt Example:**
- Trigger: "GYM"
- AI Prompt: "Help the user find their ideal gym routine. Ask about their fitness goals, experience level, and available time."
- AI Response: "Hey! Let's start building your custom gym routine. Can you tell me what your main fitness goals are? Are you looking to build muscle, lose weight, or improve overall fitness?"

### Data Model

Each automation requires:
- **title**: User-friendly name for the automation
- **description**: Optional context about the automation's purpose
- **trigger_word**: The keyword that triggers this automation (case-insensitive)
- **response_type**: Either "fixed" or "ai_prompt"
- **response_content**: The fixed message text OR the AI prompt for generating responses
- **is_active**: Toggle to enable/disable the automation
- **expires_at**: Optional expiration timestamp to automatically disable

## 🏗️ Technical Architecture

### Database Schema

```sql
-- Automations table
CREATE TABLE automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  trigger_word VARCHAR(100) NOT NULL,
  response_type VARCHAR(20) NOT NULL CHECK (response_type IN ('fixed', 'ai_prompt')),
  response_content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_automations_user_id ON automations(user_id);
CREATE INDEX idx_automations_trigger_word ON automations(trigger_word);
CREATE INDEX idx_automations_active ON automations(is_active) WHERE is_active = true;
```

### Integration Points

The automations feature integrates with the existing Instagram webhook system:

1. **Webhook Processing**: Extends `/api/webhook/instagram` to check for trigger words
2. **Message Flow**: Integrates with existing DM sending infrastructure
3. **User Management**: Links to user authentication and subscription plans

## 🚀 Implementation Strategy

### Phase 1: Database & Backend Foundation
- [ ] Create database migration for automations table
- [ ] Implement server actions for CRUD operations
- [ ] Add trigger word matching logic to webhook handler
- [ ] Extend Instagram API integration for automated responses

### Phase 2: Frontend Dashboard
- [ ] Create `/automations` page with list view
- [ ] Build automation creation form at `/automations/new`
- [ ] Implement edit/delete functionality
- [ ] Add toggle controls for activation/deactivation

### Phase 3: Advanced Features
- [ ] Add expiration date handling
- [ ] Implement response analytics/tracking

### Phase 4: AI Integration
- [ ] Implement AI prompt processing for automations
- [ ] Add context-aware response customization
- [ ] Implement response performance analytics

## 🔧 Technical Implementation Details

### Trigger Detection Logic

```typescript
// In webhook handler
const checkTriggers = async (messageText: string, userId: string) => {
  const activeAutomations = await db
    .select()
    .from(automations)
    .where(
      and(
        eq(automations.user_id, userId),
        eq(automations.is_active, true),
        or(
          isNull(automations.expires_at),
          gt(automations.expires_at, new Date())
        )
      )
    );

  for (const automation of activeAutomations) {
    if (messageText.toLowerCase().includes(automation.trigger_word.toLowerCase())) {
      return automation;
    }
  }
  return null;
};
```

### Response Handling

```typescript
// In webhook processing
const handleAutomation = async (automation: Automation, senderId: string, originalMessage: string) => {
  if (automation.response_type === 'fixed') {
    // Send the predefined message
    await sendDM({
      userId: automation.user_id,
      receiverId: senderId,
      message: automation.response_content,
      token: integration.token
    });
  } else if (automation.response_type === 'ai_prompt') {
    // Generate AI response using the custom prompt
    const aiResponse = await generateAIResponse(
      automation.response_content, // This is the custom prompt
      originalMessage,
      user.tone_profile
    );
    await sendDM({
      userId: automation.user_id,
      receiverId: senderId,
      message: aiResponse,
      token: integration.token
    });
  }
};
```

## 🎨 User Interface Design

### Dashboard Layout (`/automations`)

```
┌─────────────────────────────────────────────────────────────────┐
│ Automations                                           [+ New]   │
├─────────────────────────────────────────────────────────────────┤
│ Title           │ Trigger │ Type   │ Status │ Actions          │
├─────────────────────────────────────────────────────────────────┤
│ Welcome Bot     │ "hello" │ Fixed  │ Active │ [Edit] [Delete]  │
│ Gym Routine     │ "gym"   │ AI     │ Active │ [Edit] [Delete]  │
│ Support Bot     │ "help"  │ Fixed  │ Paused │ [Edit] [Delete]  │
└─────────────────────────────────────────────────────────────────┘
```

### Creation Form (`/automations/new`)

```
┌─────────────────────────────────────────────────────────────────┐
│ Create New Automation                                           │
├─────────────────────────────────────────────────────────────────┤
│ Title: [________________________________]                       │
│ Description: [________________________________]                 │
│ Trigger Word: [________________]                                │
│                                                                 │
│ Response Type:                                                  │
│ ○ Fixed Message                                                 │
│ ○ AI Prompt                                                     │
│                                                                 │
│ Response Content:                                               │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ [Enter your fixed message or AI prompt here...]             │ │
│ │                                                             │ │
│ │                                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ☐ Set expiration date                                           │
│ Expires: [____/____/____]                                       │
│                                                                 │
│ [Cancel] [Create Automation]                                    │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Integration with Existing Systems

### Webhook Enhancement

The existing Instagram webhook at `/api/webhook/instagram` will be enhanced:

1. **Before AI Processing**: Check for trigger words
2. **Conditional Flow**: 
   - If trigger found → Execute automation
   - If no trigger → Continue to normal sidekick processing
3. **Response Tracking**: Log automation usage for analytics

### Sidekick Integration

- Automations work alongside existing sidekick functionality
- No trigger match = normal sidekick behavior
- Trigger match = automation response (bypasses sidekick for that message)

## 📊 Analytics & Monitoring

### Metrics to Track
- Automation trigger frequency
- Response delivery success rate
- User engagement with automated responses
- Most effective trigger words

### Database Tracking

```sql
-- Automation usage tracking
CREATE TABLE automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID REFERENCES automations(id),
  trigger_word VARCHAR(100),
  response_sent BOOLEAN,
  delivery_status VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🛡️ Edge Cases & Error Handling

### Trigger Word Conflicts
- **Issue**: Multiple automations with same trigger word
- **Solution**: First match wins, log conflicts for user review

### Message Delivery Failures
- **Issue**: Instagram API rate limits or delivery failures
- **Solution**: Retry logic with exponential backoff, fallback to normal sidekick

### Expired Automations
- **Issue**: Automations past expiration date
- **Solution**: Automatic deactivation, user notification

### Invalid Trigger Words
- **Issue**: Empty or overly broad trigger words
- **Solution**: Validation rules, minimum length requirements

## 🚦 Rate Limiting & Performance

### Instagram API Limits
- Respect existing rate limiting infrastructure
- Queue automation responses if needed
- Monitor for shadow ban risks

### Database Performance
- Index on trigger_word for fast lookups
- Cache active automations per user
- Batch processing for high-volume users

## 🔐 Security Considerations

### User Data Protection
- Automations only access user's own data
- Validate user ownership before processing
- Audit trail for all automation actions

### Message Content
- Sanitize user input in response messages
- Prevent injection attacks
- Content moderation for automated responses

## 📈 Future Enhancements

### Advanced Triggers
- Multiple trigger words per automation
- Regex pattern matching
- Context-aware triggers (time, user history)

### Response Types
- Rich media responses (images, videos)
- Interactive buttons and quick replies
- Dynamic content based on user data

### Analytics Dashboard
- Automation performance metrics
- A/B testing for different responses
- ROI tracking for automated conversations

## 🎯 Success Metrics

### Primary KPIs
- Automation adoption rate (% of users with automations)
- Trigger match rate (% of DMs that trigger automations)
- Response delivery success rate
- User satisfaction with automated responses

### Secondary Metrics
- Time saved per user
- Conversion rate improvement
- Support ticket reduction
- User retention impact

## 📋 Implementation Checklist

### Database
- [ ] Create automations table migration
- [ ] Add indexes for performance
- [ ] Create automation_logs table
- [ ] Update existing schema relations

### Backend
- [ ] Implement CRUD server actions
- [ ] Add trigger detection logic
- [ ] Extend webhook processing
- [ ] Add response tracking
- [ ] Implement expiration handling

### Frontend
- [ ] Create automations dashboard page
- [ ] Build creation form
- [ ] Add edit/delete functionality
- [ ] Implement status toggles
- [ ] Add expiration date picker

### Integration
- [ ] Update webhook handler
- [ ] Test with Instagram API
- [ ] Add error handling
- [ ] Implement rate limiting
- [ ] Add monitoring/logging

### Testing
- [ ] Integration tests for webhook flow
- [ ] E2E tests for dashboard functionality
- [ ] Performance testing for high volume

## 🔗 Related Documentation

- [Instagram Integration Guide](./instagram-login.md)
- [Sidekick v2 Implementation](./sidekick-v2.md)
- [Webhook Processing Notes](./sidekick_automations_notes.md)
- [Product Requirements](./prd.md)

---

*This feature document serves as the comprehensive guide for implementing Instagram automations within the Pilot CRM system.*