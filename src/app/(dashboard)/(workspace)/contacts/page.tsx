import { fetchInstagramContacts } from "@/actions/contacts";
import ContactsTable from "@/components/contacts/contacts-table";

export const dynamic = 'force-dynamic';

export default async function ContactsPage() {
  const contacts = await fetchInstagramContacts();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
        <p className="text-muted-foreground mt-2">
          Manage your contacts from connected platforms.
        </p>
      </div>

      <ContactsTable contacts={contacts} />
    </div>
  );
}