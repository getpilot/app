# Instagram Automations Feature

## 🎯 Overview

The Instagram Automations feature enables users to set up trigger-based automated responses for Instagram DMs and post comments. When an incoming DM or a new comment contains a specific trigger word, the system automatically sends a predefined message or AI-generated response, otherwise the normal sidekick bot behavior continues. For comments, responses use Instagram private replies tied to the comment thread (cold DMs from comments are not allowed).

## 🧩 Core Functionality

### Primary Flow
1. **Trigger Detection**: Every incoming DM and comment on tracked posts is scanned for user-defined trigger words
2. **Conditional Response**: 
   - If trigger word matches → Send automation response (fixed message or AI-generated)
   - If no trigger → Continue with normal sidekick bot reply
3. **Delivery Channel**: 
   - DM triggers → reply via direct message
   - Comment triggers → reply via private comment reply (thread-scoped)
4. **Response Types**: 
   - **Fixed Response**: Send a predefined static message
   - **AI Prompt**: Use a custom prompt to generate contextual AI responses

### Response Type Examples

**Fixed Response Example:**
- Trigger: "PRICE"
- Response: "Thanks for your interest! Our premium package is $99/month. Would you like to schedule a demo?"

**AI Prompt Example:**
### Comment Trigger Examples

- Trigger: A follower comments "START" on a linked post → Private reply: "Thanks for reaching out! I just sent you details here."
- Trigger (AI): Comment contains "PLAN" → Private reply generated from the AI prompt in under two sentences.

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

Comment-trigger considerations (conceptual):
- **trigger_source**: "dm", "comment", or "both" (defaults to "dm")
- **post_scope**: Optional linked Instagram post to scope comment triggers when relevant

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

1. **Webhook Processing**: Extends `/api/webhook/instagram` to check for trigger words in both DMs and comment change events
2. **Message Flow**: Integrates with existing DM sending infrastructure and private replies tied to comment threads
3. **User Management**: Links to user authentication and subscription plans

## 🚀 Implementation Strategy

### Phase 1: Database & Backend Foundation
- [ ] Create database migration for automations table (add fields for trigger source and optional post scoping)
- [ ] Implement server actions for CRUD operations
- [ ] Add trigger word matching logic to webhook handler (DMs and comments)
- [ ] Extend Instagram API integration for automated responses (DM + private reply)

### Phase 2: Frontend Dashboard
- [ ] Create `/automations` page with list view
- [ ] Build automation creation form at `/automations/new` (include Trigger Source and optional Post selection)
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
│ Trigger Source:                                                 │
│ ○ Direct Message (DM)                                           │
│ ○ Comment                                                       │
│ ○ Both                                                          │
│                                                                 │
│ When Comment is selected:                                       │
│ Post: [Select linked Instagram post]                            │
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

1. **Before AI Processing**: Check for trigger words across both DM and comment payloads
2. **Conditional Flow**: 
   - If trigger found → Execute automation (DM reply or private reply on comment)
   - If no trigger → Continue to normal sidekick processing
3. **Response Tracking**: Log automation usage for analytics with channel (DM vs Comment)

### Sidekick Integration

- Automations work alongside existing sidekick functionality
- No trigger match = normal sidekick behavior
- Trigger match = automation response (bypasses sidekick for that message)

## 📊 Analytics & Monitoring

### Metrics to Track
- Automation trigger frequency (by channel: DM vs Comment)
- Response delivery success rate
- User engagement with automated responses
- Most effective trigger words

### Database Tracking

```sql
Note: Track the channel (DM or Comment) for each automation usage event to differentiate performance and engagement.
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
### Instagram Constraints for Comments
- Cold DMs from comments are not permitted; use private replies tied to the comment thread
- Continued conversations may be subject to a 24-hour window from last user interaction
- User privacy settings can limit delivery of replies

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
- Trigger match rate (% of DMs and Comments that trigger automations)
- Response delivery success rate
- User satisfaction with automated responses

### Secondary Metrics
- Time saved per user
- Conversion rate improvement
- Support ticket reduction
- User retention impact

## 📋 Implementation Checklist

### Database
- [ ] Create automations table migration (add trigger source and optional post scoping)
- [ ] Add indexes for performance
- [ ] Create automation_logs table (include channel info)
- [ ] Update existing schema relations

### Backend
- [ ] Implement CRUD server actions
- [ ] Add trigger detection logic (DMs and comments)
- [ ] Extend webhook processing (add comment branch with private replies)
- [ ] Add response tracking (by channel)
- [ ] Implement expiration handling

### Frontend
- [ ] Create automations dashboard page
- [ ] Build creation form (Trigger Source + Post selection for comments)
- [ ] Add edit/delete functionality
- [ ] Implement status toggles
- [ ] Add expiration date picker

### Integration
- [ ] Update webhook handler
- [ ] Test with Instagram API (DM + private replies on comments)
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