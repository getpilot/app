import { relations } from "drizzle-orm/relations";
import { user, instagramIntegration, account, session } from "./schema";

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