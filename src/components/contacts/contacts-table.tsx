"use client";

import { InstagramContact } from "@/actions/contacts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";

interface ContactsTableProps {
  contacts: InstagramContact[];
}

export default function ContactsTable({ contacts }: ContactsTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Last Message</TableHead>
            <TableHead>Last Message At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="h-24 text-center">
                <div className="flex flex-col items-center justify-center">
                  <p className="text-sm text-muted-foreground">
                    No contacts found
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Connect your Instagram account to see your contacts
                  </p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            contacts.map((contact) => (
              <TableRow key={contact.id}>
                <TableCell className="font-medium">{contact.name}</TableCell>
                <TableCell className="truncate">
                  {contact.lastMessage?.slice(0, 50) || "No messages"}
                  {contact.lastMessage && contact.lastMessage.length > 50
                    ? "..."
                    : ""}
                </TableCell>
                <TableCell>
                  {contact.timestamp
                    ? formatDistanceToNow(new Date(contact.timestamp), {
                        addSuffix: true,
                      })
                    : "Unknown"}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}