import { fetchContacts } from "@/actions/contacts";
import ContactsTable from "@/components/contacts/contacts-table";

export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  let contacts = null;
  let hasError = false;
  try {
    contacts = await fetchContacts();
  } catch (error) {
    console.error("Error in ContactsPage:", error);
    hasError = true;
  }

  if (hasError) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold font-heading tracking-tight">Contacts</h1>
          <p className="text-destructive">
            Failed to load contacts. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold font-heading tracking-tight">Contacts</h1>
        <p className="text-muted-foreground mt-2">
          See every lead, track every conversation, never miss a deal again.
        </p>
      </div>

      <ContactsTable contacts={contacts!} />
    </div>
  );
}
