import { useState, useEffect } from "react";
import { InstagramContact } from "@pilot/types/instagram";
import {
  ColumnFiltersState,
  PaginationState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import {
  EditingState,
  ExpandedState,
  NotesState,
  UnsavedChangesState,
} from "@pilot/types/contact";

export function useContactsTable(initialContacts: InstagramContact[]) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "name",
      desc: false,
    },
  ]);

  const [contacts, setContacts] = useState<InstagramContact[]>(initialContacts);

  const [expandedRows, setExpandedRows] = useState<ExpandedState>({});
  const [editingNotes, setEditingNotes] = useState<EditingState>({});
  const [notesValues, setNotesValues] = useState<NotesState>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] =
    useState<UnsavedChangesState>({});

  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] =
    useState(false);
  const [rowToClose, setRowToClose] = useState<string | null>(null);

  useEffect(() => {
    setContacts(initialContacts);
    const notes: Record<string, string> = {};
    initialContacts.forEach((contact) => {
      if (contact.notes) {
        notes[contact.id] = contact.notes;
      } else {
        notes[contact.id] = "";
      }
    });
    setNotesValues(notes);
  }, [initialContacts]);

  const toggleRowExpanded = (rowId: string) => {
    if (
      expandedRows[rowId] &&
      editingNotes[rowId] &&
      hasUnsavedChanges[rowId]
    ) {
      setRowToClose(rowId);
      setShowUnsavedChangesDialog(true);
      return;
    }

    const wasExpanded = expandedRows[rowId];

    setExpandedRows((prev) => ({
      ...prev,
      [rowId]: !prev[rowId],
    }));

    if (wasExpanded) {
      setHasUnsavedChanges((prev) => ({
        ...prev,
        [rowId]: false,
      }));
    }
  };

  const startEditingNotes = (rowId: string) => {
    setEditingNotes((prev) => ({
      ...prev,
      [rowId]: true,
    }));
  };

  const stopEditingNotes = (rowId: string) => {
    setEditingNotes((prev) => ({
      ...prev,
      [rowId]: false,
    }));

    setHasUnsavedChanges((prev) => ({
      ...prev,
      [rowId]: false,
    }));
  };

  const handleNotesChange = (rowId: string, value: string) => {
    setNotesValues((prev) => ({
      ...prev,
      [rowId]: value,
    }));

    const originalNotes =
      initialContacts.find((c) => c.id === rowId)?.notes || "";
    setHasUnsavedChanges((prev) => ({
      ...prev,
      [rowId]: value !== originalNotes,
    }));
  };

  const confirmCloseRow = () => {
    if (rowToClose) {
      const contact = initialContacts.find((c) => c.id === rowToClose);

      if (contact) {
        setNotesValues((prev) => ({
          ...prev,
          [rowToClose]: contact.notes || "",
        }));
      }

      setEditingNotes((prev) => ({
        ...prev,
        [rowToClose]: false,
      }));

      setHasUnsavedChanges((prev) => ({
        ...prev,
        [rowToClose]: false,
      }));

      setExpandedRows((prev) => ({
        ...prev,
        [rowToClose]: false,
      }));

      setRowToClose(null);
      setShowUnsavedChangesDialog(false);
    }
  };

  return {
    contacts,
    columnFilters,
    setColumnFilters,
    columnVisibility,
    setColumnVisibility,
    pagination,
    setPagination,
    sorting,
    setSorting,

    expandedRows,
    editingNotes,
    notesValues,
    hasUnsavedChanges,

    showUnsavedChangesDialog,
    setShowUnsavedChangesDialog,
    rowToClose,

    toggleRowExpanded,
    startEditingNotes,
    stopEditingNotes,
    handleNotesChange,
    confirmCloseRow,
  };
}
