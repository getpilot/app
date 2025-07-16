import { fetchInstagramContacts } from "@/actions/contacts";
import ContactsTable from "@/components/contacts/contacts-table";
import SyncContactsButton from "@/components/contacts/sync-contacts-button";

export default async function ContactsPage() {
  const contacts = await fetchInstagramContacts();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
          <p className="text-muted-foreground mt-2">
            Manage your contacts from connected platforms.
          </p>
        </div>
        <div className="mt-auto">
          <SyncContactsButton />
        </div>
      </div>

      <ContactsTable contacts={contacts} />
    </div>
  );
}