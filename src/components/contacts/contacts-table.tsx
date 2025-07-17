"use client";

import * as React from "react";
import {
  InstagramContact,
  updateContactStage,
  updateContactSentiment,
  updateContactNotes,
} from "@/actions/contacts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  FilterFn,
  flexRender,
  getCoreRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  Row,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import {
  ChevronDownIcon,
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  CircleXIcon,
  Columns3Icon,
  EllipsisIcon,
  FilterIcon,
  ListFilterIcon,
  SaveIcon,
  ChevronRight,
  MessageSquareIcon,
  PencilIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import SyncContactsButton from "./sync-contacts-button";

const multiColumnFilterFn: FilterFn<InstagramContact> = (
  row,
  filterValue
) => {
  const searchableRowContent = `${row.original.name}`.toLowerCase();
  const searchTerm = (filterValue ?? "").toLowerCase();
  return searchableRowContent.includes(searchTerm);
};

const stageFilterFn: FilterFn<InstagramContact> = (
  row,
  columnId,
  filterValue: string[]
) => {
  if (!filterValue?.length) return true;
  const stage = row.getValue(columnId) as string | null | undefined;
  return stage ? filterValue.includes(stage) : false;
};

const sentimentFilterFn: FilterFn<InstagramContact> = (
  row,
  columnId,
  filterValue: string[]
) => {
  if (!filterValue?.length) return true;
  const sentiment = row.getValue(columnId) as string | null | undefined;
  return sentiment ? filterValue.includes(sentiment) : false;
};

interface ContactsTableProps {
  contacts: InstagramContact[];
}

export default function ContactsTable({
  contacts: initialContacts,
}: ContactsTableProps) {
  const id = useId();
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const [contacts, setContacts] = useState<InstagramContact[]>([]);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [editingNotes, setEditingNotes] = useState<Record<string, boolean>>({});
  const [notesValues, setNotesValues] = useState<Record<string, string>>({});

  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "name",
      desc: false,
    },
  ]);

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
    setExpandedRows((prev) => ({
      ...prev,
      [rowId]: !prev[rowId],
    }));
  };

  const startEditingNotes = (rowId: string) => {
    setEditingNotes((prev) => ({
      ...prev,
      [rowId]: true,
    }));
  };

  const handleNotesChange = (rowId: string, value: string) => {
    setNotesValues((prev) => ({
      ...prev,
      [rowId]: value,
    }));
  };

  const saveNotes = async (rowId: string) => {
    try {
      const result = await updateContactNotes(rowId, notesValues[rowId] || "");

      if (result.success) {
        setEditingNotes((prev) => ({
          ...prev,
          [rowId]: false,
        }));
        toast.success("Notes saved successfully");
      } else {
        toast.error(result.error || "Failed to save notes");
      }
    } catch (error) {
      toast.error("An error occurred");
      console.error(error);
    }
  };

  const columns: ColumnDef<InstagramContact>[] = [
    {
      id: "expand",
      header: "",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => toggleRowExpanded(row.original.id)}
          aria-label="Expand row"
        >
          <ChevronRight
            size={16}
            className={cn(
              "transition-transform duration-200",
              expandedRows[row.original.id] ? "rotate-90" : ""
            )}
          />
        </Button>
      ),
      size: 28,
      enableSorting: false,
      enableHiding: false,
    },
    // {
    //   id: "select",
    //   header: ({ table }) => (
    //     <Checkbox
    //       checked={
    //         table.getIsAllPageRowsSelected() ||
    //         (table.getIsSomePageRowsSelected() && "indeterminate")
    //       }
    //       onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
    //       aria-label="Select all"
    //     />
    //   ),
    //   cell: ({ row }) => (
    //     <Checkbox
    //       checked={row.getIsSelected()}
    //       onCheckedChange={(value) => row.toggleSelected(!!value)}
    //       aria-label="Select row"
    //     />
    //   ),
    //   size: 28,
    //   enableSorting: false,
    //   enableHiding: false,
    // },
    {
      header: "Name",
      accessorKey: "name",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
      size: 180,
      filterFn: multiColumnFilterFn,
      enableHiding: false,
    },
    {
      header: "Last Message",
      accessorKey: "lastMessage",
      cell: ({ row }) => {
        const message = row.getValue("lastMessage") as
          | string
          | null
          | undefined;
        return (
          <div className="truncate max-w-[200px] text-muted-foreground">
            {message
              ? message.slice(0, 50) + (message.length > 50 ? "..." : "")
              : "No messages"}
          </div>
        );
      },
      size: 220,
    },
    {
      header: "Last Message At",
      accessorKey: "timestamp",
      cell: ({ row }) => {
        const timestamp = row.getValue("timestamp") as
          | string
          | null
          | undefined;
        return (
          <div className="text-muted-foreground text-sm">
            {timestamp
              ? formatDistanceToNow(new Date(timestamp), { addSuffix: true })
              : "Unknown"}
          </div>
        );
      },
      size: 180,
    },
    {
      header: "Stage",
      accessorKey: "stage",
      cell: ({ row }) => {
        const stage = row.original.stage || "neutral";
        const stageStyles = {
          hot: "border-destructive text-destructive bg-background",
          warm: "border-accent text-accent-foreground bg-background",
          cold: "border-primary text-primary bg-background",
          neutral: "border-muted-foreground text-muted-foreground bg-background",
          ghosted: "border-destructive text-destructive bg-background"
        };

        return (
          <Badge 
            variant="outline"
            className={cn(
              "font-medium text-xs",
              stageStyles[stage as keyof typeof stageStyles]
            )}
          >
            {stage}
          </Badge>
        );
      },
      size: 120,
      filterFn: stageFilterFn,
    },
    {
      header: "Sentiment",
      accessorKey: "sentiment",
      cell: ({ row }) => {
        const sentiment = row.original.sentiment || "neutral";
        const sentimentStyles = {
          hot: "border-destructive text-destructive bg-background",
          warm: "border-accent text-accent-foreground bg-background",
          cold: "border-primary text-primary bg-background",
          neutral: "border-muted-foreground text-muted-foreground bg-background",
          ghosted: "border-destructive text-destructive bg-background"
        };

        return (
          <Badge 
            variant="outline"
            className={cn(
              "font-medium text-xs",
              sentimentStyles[sentiment as keyof typeof sentimentStyles]
            )}
          >
            {sentiment}
          </Badge>
        );
      },
      size: 120,
      filterFn: sentimentFilterFn,
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <RowActions
          row={row}
          toggleRowExpanded={toggleRowExpanded}
          startEditingNotes={startEditingNotes}
        />
      ),
      size: 60,
      enableHiding: false,
    },
  ];

  const table = useReactTable({
    data: contacts,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    enableSortingRemoval: false,
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    state: {
      sorting,
      pagination,
      columnFilters,
      columnVisibility,
    },
  });

  const stageColumn = table.getColumn("stage");
  const stageFilterValue = stageColumn?.getFilterValue() as string[] | undefined;
  
  const sentimentColumn = table.getColumn("sentiment");
  const sentimentFilterValue = sentimentColumn?.getFilterValue() as string[] | undefined;

  const uniqueStageValues = useMemo(() => {
    if (!stageColumn) return [];

    const values = Array.from(
      stageColumn.getFacetedUniqueValues().keys()
    ).filter(Boolean) as string[];

    const defaultStages = ["new", "lead", "follow-up", "ghosted"];
    const combinedStages = [...new Set([...values, ...defaultStages])];

    return combinedStages.sort();
  }, [stageColumn]);

  const stageCounts = useMemo(() => {
    if (!stageColumn) return new Map();
    return stageColumn.getFacetedUniqueValues();
  }, [stageColumn]);

  const selectedStages = useMemo(() => {
    return stageFilterValue ?? [];
  }, [stageFilterValue]);

  const handleStageChange = (checked: boolean, value: string) => {
    if (!stageColumn) return;
    
    const filterValue = stageFilterValue ?? [];
    const newFilterValue = [...filterValue];

    if (checked) {
      newFilterValue.push(value);
    } else {
      const index = newFilterValue.indexOf(value);
      if (index > -1) {
        newFilterValue.splice(index, 1);
      }
    }

    stageColumn.setFilterValue(
      newFilterValue.length ? newFilterValue : undefined
    );
  };

  const uniqueSentimentValues = useMemo(() => {
    if (!sentimentColumn) return [];

    const values = Array.from(
      sentimentColumn.getFacetedUniqueValues().keys()
    ).filter(Boolean) as string[];

    const defaultSentiments = ["hot", "warm", "cold", "neutral", "ghosted"];
    const combinedSentiments = [...new Set([...values, ...defaultSentiments])];

    return combinedSentiments.sort();
  }, [sentimentColumn]);

  const sentimentCounts = useMemo(() => {
    if (!sentimentColumn) return new Map();
    return sentimentColumn.getFacetedUniqueValues();
  }, [sentimentColumn]);

  const selectedSentiments = useMemo(() => {
    return sentimentFilterValue ?? [];
  }, [sentimentFilterValue]);

  const handleSentimentChange = (checked: boolean, value: string) => {
    if (!sentimentColumn) return;
    
    const filterValue = sentimentFilterValue ?? [];
    const newFilterValue = [...filterValue];

    if (checked) {
      newFilterValue.push(value);
    } else {
      const index = newFilterValue.indexOf(value);
      if (index > -1) {
        newFilterValue.splice(index, 1);
      }
    }

    sentimentColumn.setFilterValue(
      newFilterValue.length ? newFilterValue : undefined
    );
  };

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-1">
        <div className="flex flex-wrap items-center gap-3">
          {/* Filter by name */}
          <div className="relative">
            <Input
              id={`${id}-input`}
              ref={inputRef}
              className={cn(
                "peer min-w-[240px] ps-9 border-border focus-visible:ring-ring",
                Boolean(table.getColumn("name")?.getFilterValue()) && "pe-9"
              )}
              value={
                (table.getColumn("name")?.getFilterValue() ?? "") as string
              }
              onChange={(e) =>
                table.getColumn("name")?.setFilterValue(e.target.value)
              }
              placeholder="Filter by name..."
              type="text"
              aria-label="Filter by name"
            />
            <div className="text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
              <ListFilterIcon size={16} aria-hidden="true" />
            </div>
            {Boolean(table.getColumn("name")?.getFilterValue()) && (
              <button
                className="text-muted-foreground hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Clear filter"
                onClick={() => {
                  table.getColumn("name")?.setFilterValue("");
                  if (inputRef.current) {
                    inputRef.current.focus();
                  }
                }}
              >
                <CircleXIcon size={16} aria-hidden="true" />
              </button>
            )}
          </div>
          {/* Filter by stage */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="border-border hover:bg-muted hover:text-foreground"
              >
                <FilterIcon
                  className="opacity-60 mr-2"
                  size={16}
                  aria-hidden="true"
                />
                Stage
                {selectedStages.length > 0 && (
                  <span className="text-primary ml-2 text-xs font-medium">
                    ({selectedStages.length})
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto min-w-36 p-3" align="start">
              <div className="space-y-3">
                <div className="text-muted-foreground text-xs font-medium">
                  Filter by Stage
                </div>
                <div className="space-y-3">
                  {uniqueStageValues.map((value, i) => (
                    <div key={value} className="flex items-center gap-2">
                      <Checkbox
                        id={`${id}-stage-${i}`}
                        checked={selectedStages.includes(value)}
                        onCheckedChange={(checked: boolean) =>
                          handleStageChange(checked, value)
                        }
                        className="border-border data-[state=checked]:bg-primary"
                      />
                      <Label
                        htmlFor={`${id}-stage-${i}`}
                        className="flex grow justify-between gap-2 font-normal"
                      >
                        {value}{" "}
                        <span className="text-muted-foreground ms-2 text-xs">
                          {stageCounts.get(value) || 0}
                        </span>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
          {/* Filter by sentiment */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="border-border hover:bg-muted hover:text-foreground"
              >
                <FilterIcon
                  className="opacity-60 mr-2"
                  size={16}
                  aria-hidden="true"
                />
                Sentiment
                {selectedSentiments.length > 0 && (
                  <span className="text-primary ml-2 text-xs font-medium">
                    ({selectedSentiments.length})
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto min-w-36 p-3" align="start">
              <div className="space-y-3">
                <div className="text-muted-foreground text-xs font-medium">
                  Filter by Sentiment
                </div>
                <div className="space-y-3">
                  {uniqueSentimentValues.map((value, i) => (
                    <div key={value} className="flex items-center gap-2">
                      <Checkbox
                        id={`${id}-sentiment-${i}`}
                        checked={selectedSentiments.includes(value)}
                        onCheckedChange={(checked: boolean) =>
                          handleSentimentChange(checked, value)
                        }
                        className="border-border data-[state=checked]:bg-primary"
                      />
                      <Label
                        htmlFor={`${id}-sentiment-${i}`}
                        className="flex grow justify-between gap-2 font-normal"
                      >
                        {value}{" "}
                        <span className="text-muted-foreground ms-2 text-xs">
                          {sentimentCounts.get(value) || 0}
                        </span>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
          {/* Toggle columns visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="border-border hover:bg-muted hover:text-foreground"
              >
                <Columns3Icon
                  className="opacity-60 mr-2"
                  size={16}
                  aria-hidden="true"
                />
                View
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                      onSelect={(event) => event.preventDefault()}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <SyncContactsButton />
      </div>

      {/* Table */}
      <div className="bg-card overflow-hidden rounded-md border border-border shadow-sm">
        <Table className="table-fixed">
          <TableHeader className="bg-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="hover:bg-transparent border-border"
              >
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      style={{ width: `${header.getSize()}px` }}
                      className="h-11 text-foreground/70 font-medium bg-background/75"
                    >
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <div
                          className={cn(
                            header.column.getCanSort() &&
                              "flex h-full cursor-pointer items-center justify-between gap-2 select-none"
                          )}
                          onClick={header.column.getToggleSortingHandler()}
                          onKeyDown={(e) => {
                            if (
                              header.column.getCanSort() &&
                              (e.key === "Enter" || e.key === " ")
                            ) {
                              e.preventDefault();
                              header.column.getToggleSortingHandler()?.(e);
                            }
                          }}
                          tabIndex={header.column.getCanSort() ? 0 : undefined}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {{
                            asc: (
                              <ChevronUpIcon
                                className="shrink-0 opacity-60"
                                size={16}
                                aria-hidden="true"
                              />
                            ),
                            desc: (
                              <ChevronDownIcon
                                className="shrink-0 opacity-60"
                                size={16}
                                aria-hidden="true"
                              />
                            ),
                          }[header.column.getIsSorted() as string] ?? null}
                        </div>
                      ) : (
                        flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <React.Fragment key={row.id}>
                  <TableRow
                    data-state={row.getIsSelected() && "selected"}
                    className="border-border hover:bg-muted/40"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="last:py-0">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  {expandedRows[row.original.id] && (
                    <TableRow className="bg-muted/30">
                      <TableCell
                        colSpan={row.getVisibleCells().length}
                        className="p-0"
                      >
                        <Card className="bg-card shadow-sm py-0 rounded-none border-none">
                          <CardContent className="p-4 space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <MessageSquareIcon
                                  size={18}
                                  className="text-muted-foreground"
                                />
                                <h3 className="text-sm font-medium">Notes</h3>
                              </div>
                              {!editingNotes[row.original.id] ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2"
                                  onClick={() =>
                                    startEditingNotes(row.original.id)
                                  }
                                >
                                  <PencilIcon size={14} className="mr-1" />
                                  Edit
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2"
                                  onClick={() => saveNotes(row.original.id)}
                                >
                                  <SaveIcon size={14} className="mr-1" />
                                  Save
                                </Button>
                              )}
                            </div>

                            {editingNotes[row.original.id] ? (
                              <Textarea
                                value={notesValues[row.original.id] || ""}
                                onChange={(
                                  e: React.ChangeEvent<HTMLTextAreaElement>
                                ) =>
                                  handleNotesChange(
                                    row.original.id,
                                    e.target.value
                                  )
                                }
                                placeholder="Add your personal notes about this contact..."
                                className="min-h-[100px] focus-visible:ring-ring"
                              />
                            ) : (
                              <div className="border text-sm text-muted-foreground p-3 bg-muted/50 rounded-md min-h-[100px] whitespace-pre-wrap">
                                {notesValues[row.original.id] || "No personal notes yet. Click edit to add notes."}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            ) : (
              <TableRow className="border-border">
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="flex flex-col items-center justify-center">
                    <p className="text-sm text-muted-foreground">
                      No contacts found
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      Connect your Instagram account to see your contacts
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {table.getRowModel().rows?.length > 0 && (
        <div className="flex items-center justify-between gap-8 px-1">
          {/* Results per page */}
          <div className="flex items-center gap-3">
            <Label
              htmlFor={id}
              className="max-sm:sr-only text-muted-foreground"
            >
              Rows per page
            </Label>
            <Select
              value={table.getState().pagination.pageSize.toString()}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger
                id={id}
                className="w-fit whitespace-nowrap border-border"
              >
                <SelectValue placeholder="Select rows per page" />
              </SelectTrigger>
              <SelectContent className="[&_*[role=option]]:ps-2 [&_*[role=option]]:pe-8 [&_*[role=option]>span]:start-auto [&_*[role=option]>span]:end-2">
                {[5, 10, 25, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={pageSize.toString()}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Page number information */}
          <div className="text-muted-foreground flex grow justify-end text-sm whitespace-nowrap">
            <p
              className="text-muted-foreground text-sm whitespace-nowrap"
              aria-live="polite"
            >
              <span className="text-foreground font-medium">
                {table.getState().pagination.pageIndex *
                  table.getState().pagination.pageSize +
                  1}
                -
                {Math.min(
                  Math.max(
                    table.getState().pagination.pageIndex *
                      table.getState().pagination.pageSize +
                      table.getState().pagination.pageSize,
                    0
                  ),
                  table.getRowCount()
                )}
              </span>{" "}
              of{" "}
              <span className="text-foreground font-medium">
                {table.getRowCount().toString()}
              </span>
            </p>
          </div>

          {/* Pagination buttons */}
          <div>
            <Pagination>
              <PaginationContent>
                {/* First page button */}
                <PaginationItem>
                  <Button
                    size="icon"
                    variant="outline"
                    className="border-border disabled:opacity-50 disabled:pointer-events-none h-8 w-8"
                    onClick={() => table.firstPage()}
                    disabled={!table.getCanPreviousPage()}
                    aria-label="Go to first page"
                  >
                    <ChevronFirstIcon size={16} aria-hidden="true" />
                  </Button>
                </PaginationItem>
                {/* Previous page button */}
                <PaginationItem>
                  <Button
                    size="icon"
                    variant="outline"
                    className="border-border disabled:opacity-50 disabled:pointer-events-none h-8 w-8"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    aria-label="Go to previous page"
                  >
                    <ChevronLeftIcon size={16} aria-hidden="true" />
                  </Button>
                </PaginationItem>
                {/* Next page button */}
                <PaginationItem>
                  <Button
                    size="icon"
                    variant="outline"
                    className="border-border disabled:opacity-50 disabled:pointer-events-none h-8 w-8"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    aria-label="Go to next page"
                  >
                    <ChevronRightIcon size={16} aria-hidden="true" />
                  </Button>
                </PaginationItem>
                {/* Last page button */}
                <PaginationItem>
                  <Button
                    size="icon"
                    variant="outline"
                    className="border-border disabled:opacity-50 disabled:pointer-events-none h-8 w-8"
                    onClick={() => table.lastPage()}
                    disabled={!table.getCanNextPage()}
                    aria-label="Go to last page"
                  >
                    <ChevronLastIcon size={16} aria-hidden="true" />
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      )}
    </div>
  );
}

function RowActions({
  row,
  toggleRowExpanded,
  startEditingNotes,
}: {
  row: Row<InstagramContact>;
  toggleRowExpanded: (rowId: string) => void;
  startEditingNotes: (rowId: string) => void;
}) {
  const [isPending, setIsPending] = useState(false);

  const handleStageChange = async (stage: string) => {
    try {
      setIsPending(true);
      const result = await updateContactStage(row.original.id, stage);

      if (result.success) {
        toast.success(`Contact stage updated to ${stage}`);
      } else {
        toast.error(result.error || "Failed to update stage");
      }
    } catch (error) {
      toast.error("An error occurred");
      console.error(error);
    } finally {
      setIsPending(false);
    }
  };

  const handleSentimentChange = async (sentiment: string) => {
    try {
      setIsPending(true);
      const result = await updateContactSentiment(row.original.id, sentiment);

      if (result.success) {
        toast.success(`Contact sentiment updated to ${sentiment}`);
      } else {
        toast.error(result.error || "Failed to update sentiment");
      }
    } catch (error) {
      toast.error("An error occurred");
      console.error(error);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex justify-end">
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8 border-border border-dashed hover:border-border hover:bg-muted/40"
            aria-label="Contact actions"
            disabled={isPending}
          >
            <EllipsisIcon
              size={16}
              className="text-muted-foreground"
              aria-hidden="true"
            />
          </Button>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 bg-popover">
        <DropdownMenuGroup>
          <DropdownMenuItem className="cursor-pointer">
            <span>View details</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => {
              toggleRowExpanded(row.original.id);
              startEditingNotes(row.original.id);
            }}
          >
            <span>Add notes</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="cursor-pointer">
              Change stage
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent className="bg-popover">
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => handleStageChange("new")}
                >
                  New
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => handleStageChange("lead")}
                >
                  Lead
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => handleStageChange("follow-up")}
                >
                  Follow-up
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => handleStageChange("ghosted")}
                >
                  Ghosted
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="cursor-pointer">
              Change sentiment
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent className="bg-popover">
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => handleSentimentChange("hot")}
                >
                  Hot
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => handleSentimentChange("warm")}
                >
                  Warm
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => handleSentimentChange("cold")}
                >
                  Cold
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => handleSentimentChange("neutral")}
                >
                  Neutral
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => handleSentimentChange("ghosted")}
                >
                  Ghosted
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}