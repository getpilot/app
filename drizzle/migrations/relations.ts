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