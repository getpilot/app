import { relations } from "drizzle-orm/relations";
import { user, instagramIntegration, account, session, contact, contactTag } from "./schema";

export const instagramIntegrationRelations = relations(instagramIntegration, ({one}) => ({
	user: one(user, {
		fields: [instagramIntegration.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	instagramIntegrations: many(instagramIntegration),
	accounts: many(account),
	sessions: many(session),
	contacts: many(contact),
}));

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const contactRelations = relations(contact, ({one, many}) => ({
	user: one(user, {
		fields: [contact.userId],
		references: [user.id]
	}),
	contactTags: many(contactTag),
}));

export const contactTagRelations = relations(contactTag, ({one}) => ({
	contact: one(contact, {
		fields: [contactTag.contactId],
		references: [contact.id]
	}),
}));