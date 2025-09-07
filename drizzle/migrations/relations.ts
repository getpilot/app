import { relations } from "drizzle-orm/relations";
import {
  contact,
  contactTag,
  user,
  account,
  session,
  instagramIntegration,
  userOffer,
  userToneProfile,
  userOfferLink,
  userFaq,
  sidekickActionLog,
  sidekickSetting,
  chatSession,
  chatMessage,
  automation,
  automationActionLog,
} from "./schema";

export const contactTagRelations = relations(contactTag, ({ one }) => ({
  contact: one(contact, {
    fields: [contactTag.contactId],
    references: [contact.id],
  }),
}));

export const contactRelations = relations(contact, ({ one, many }) => ({
  contactTags: many(contactTag),
  user: one(user, {
    fields: [contact.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const userRelations = relations(user, ({ many }) => ({
  accounts: many(account),
  sessions: many(session),
  instagramIntegrations: many(instagramIntegration),
  contacts: many(contact),
  userOffers: many(userOffer),
  userToneProfiles: many(userToneProfile),
  userOfferLinks: many(userOfferLink),
  userFaqs: many(userFaq),
  sidekickActionLogs: many(sidekickActionLog),
  sidekickSettings: many(sidekickSetting),
  chatSessions: many(chatSession),
  automations: many(automation),
  automationActionLogs: many(automationActionLog),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
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

export const userOfferRelations = relations(userOffer, ({ one }) => ({
  user: one(user, {
    fields: [userOffer.userId],
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

export const userOfferLinkRelations = relations(userOfferLink, ({ one }) => ({
  user: one(user, {
    fields: [userOfferLink.userId],
    references: [user.id],
  }),
}));

export const userFaqRelations = relations(userFaq, ({ one }) => ({
  user: one(user, {
    fields: [userFaq.userId],
    references: [user.id],
  }),
}));

export const sidekickActionLogRelations = relations(
  sidekickActionLog,
  ({ one }) => ({
    user: one(user, {
      fields: [sidekickActionLog.userId],
      references: [user.id],
    }),
  })
);

export const sidekickSettingRelations = relations(
  sidekickSetting,
  ({ one }) => ({
    user: one(user, {
      fields: [sidekickSetting.userId],
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

export const chatMessageRelations = relations(chatMessage, ({ one }) => ({
  chatSession: one(chatSession, {
    fields: [chatMessage.sessionId],
    references: [chatSession.id],
  }),
}));

export const automationRelations = relations(automation, ({ one, many }) => ({
  user: one(user, {
    fields: [automation.userId],
    references: [user.id],
  }),
  automationActionLogs: many(automationActionLog),
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