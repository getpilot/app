import { relations } from "drizzle-orm/relations";
import {
  user,
  contact,
  account,
  instagramIntegration,
  userOfferLink,
  session,
  userToneProfile,
  userFaq,
  automation,
  automationPost,
  sidekickSetting,
  sidekickActionLog,
  chatSession,
  contactTag,
  userOffer,
  chatMessage,
  automationActionLog,
} from "./schema";

export const contactRelations = relations(contact, ({ one, many }) => ({
  user: one(user, {
    fields: [contact.userId],
    references: [user.id],
  }),
  contactTags: many(contactTag),
}));

export const userRelations = relations(user, ({ many }) => ({
  contacts: many(contact),
  accounts: many(account),
  instagramIntegrations: many(instagramIntegration),
  userOfferLinks: many(userOfferLink),
  sessions: many(session),
  userToneProfiles: many(userToneProfile),
  userFaqs: many(userFaq),
  sidekickSettings: many(sidekickSetting),
  sidekickActionLogs: many(sidekickActionLog),
  chatSessions: many(chatSession),
  contactTags: many(contactTag),
  userOffers: many(userOffer),
  automations: many(automation),
  automationActionLogs: many(automationActionLog),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const instagramIntegrationRelations = relations(
  instagramIntegration,
  ({ one }) => ({
    user: one(user, {
      fields: [instagramIntegration.userId],
      references: [user.id],
    }),
  })
);

export const userOfferLinkRelations = relations(userOfferLink, ({ one }) => ({
  user: one(user, {
    fields: [userOfferLink.userId],
    references: [user.id],
  }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const userToneProfileRelations = relations(
  userToneProfile,
  ({ one }) => ({
    user: one(user, {
      fields: [userToneProfile.userId],
      references: [user.id],
    }),
  })
);

export const userFaqRelations = relations(userFaq, ({ one }) => ({
  user: one(user, {
    fields: [userFaq.userId],
    references: [user.id],
  }),
}));

export const automationPostRelations = relations(automationPost, ({ one }) => ({
  automation: one(automation, {
    fields: [automationPost.automationId],
    references: [automation.id],
  }),
}));

export const automationRelations = relations(automation, ({ one, many }) => ({
  automationPosts: many(automationPost),
  user: one(user, {
    fields: [automation.userId],
    references: [user.id],
  }),
  automationActionLogs: many(automationActionLog),
}));

export const sidekickSettingRelations = relations(
  sidekickSetting,
  ({ one }) => ({
    user: one(user, {
      fields: [sidekickSetting.userId],
      references: [user.id],
    }),
  })
);

export const sidekickActionLogRelations = relations(
  sidekickActionLog,
  ({ one }) => ({
    user: one(user, {
      fields: [sidekickActionLog.userId],
      references: [user.id],
    }),
  })
);

export const chatSessionRelations = relations(chatSession, ({ one, many }) => ({
  user: one(user, {
    fields: [chatSession.userId],
    references: [user.id],
  }),
  chatMessages: many(chatMessage),
}));

export const contactTagRelations = relations(contactTag, ({ one }) => ({
  contact: one(contact, {
    fields: [contactTag.contactId],
    references: [contact.id],
  }),
  user: one(user, {
    fields: [contactTag.userId],
    references: [user.id],
  }),
}));

export const userOfferRelations = relations(userOffer, ({ one }) => ({
  user: one(user, {
    fields: [userOffer.userId],
    references: [user.id],
  }),
}));

export const chatMessageRelations = relations(chatMessage, ({ one }) => ({
  chatSession: one(chatSession, {
    fields: [chatMessage.sessionId],
    references: [chatSession.id],
  }),
}));

export const automationActionLogRelations = relations(
  automationActionLog,
  ({ one }) => ({
    user: one(user, {
      fields: [automationActionLog.userId],
      references: [user.id],
    }),
    automation: one(automation, {
      fields: [automationActionLog.automationId],
      references: [automation.id],
    }),
  })
);