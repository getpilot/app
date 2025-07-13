import { fetchInstagramContacts } from "@/actions/contacts";
import ContactsTable from "@/components/contacts/contacts-table";

export default async function ContactsPage() {
  const contacts = await fetchInstagramContacts();

  return (
    <div className="flex flex-col gap-6">
      <ContactsTable contacts={contacts} />
    </div>
  );
}