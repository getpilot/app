import { InstagramContact } from "./instagram";

export type ContactColumnFilters = {
  name?: string;
  stage?: string[];
  sentiment?: string[];
}

export interface ContactsTableProps {
  contacts: InstagramContact[];
}

export type ExpandedState = Record<string, boolean>;
export type EditingState = Record<string, boolean>;
export type NotesState = Record<string, string>;
export type UnsavedChangesState = Record<string, boolean>; 