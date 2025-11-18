"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import { useId, useMemo, useRef } from "react";
import {
  ColumnDef,
  FilterFn,
  flexRender,
  getCoreRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
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
  FilterIcon,
  ListFilterIcon,
  ChevronRight,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
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
import { Checkbox } from "@/components/ui/checkbox";
import SyncContactsButton from "./sync-contacts-button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { InstagramContact } from "@/types/instagram";
import { ContactsTableProps } from "@/types/contact";
import { useContactsTable, useContactActions } from "@/hooks";
import { RowActions } from "./row-actions";
import { ExpandedContactRow } from "./expanded-contact-row";
import { toast } from "sonner";
import TagEditor from "./tag-editor";

const STATUS_BADGE_STYLES: Record<
  | "hot"
  | "warm"
  | "cold"
  | "neutral"
  | "ghosted"
  | "new"
  | "lead"
  | "follow-up"
  | "hrn",
  string
> = {
  hot: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border border-red-500",
  warm: "bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 border border-amber-500",
  cold: "bg-sky-100 dark:bg-sky-900 text-sky-800 dark:text-sky-200 border border-sky-500",
  neutral:
    "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-500",
  ghosted:
    "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-600",
  new: "bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 border border-emerald-500",
  lead: "bg-fuchsia-100 dark:bg-fuchsia-900 text-fuchsia-800 dark:text-fuchsia-200 border border-fuchsia-500",
  "follow-up":
    "bg-violet-100 dark:bg-violet-900 text-violet-800 dark:text-violet-200 border border-violet-500",
  hrn: "bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 border border-orange-500",
};

const nameFilterFn: FilterFn<InstagramContact> = (
  row,
  _columnId,
  filterValue
) => {
  const searchTerm = ((filterValue as string) ?? "").trim().toLowerCase();
  if (!searchTerm) return true;

  const fieldsToSearch = [
    row.original.name,
    row.original.lastMessage,
    row.original.notes,
  ];

  return fieldsToSearch.some((value) =>
    String(value ?? "")
      .toLowerCase()
      .includes(searchTerm)
  );
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

const tagsFilterFn: FilterFn<InstagramContact> = (
  row,
  columnId,
  filterValue: string[]
) => {
  if (!filterValue?.length) return true;
  const tags = row.getValue(columnId) as string[] | null | undefined;
  if (!tags || !tags.length) return false;
  return filterValue.some((tag) => tags.includes(tag));
};

export default function ContactsTable({
  contacts: initialContacts,
}: ContactsTableProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const { handleNotesChange } = useContactActions();

  const {
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
    showUnsavedChangesDialog,
    setShowUnsavedChangesDialog,
    rowToClose,
    toggleRowExpanded,
    startEditingNotes,
    stopEditingNotes,
    handleNotesChange: handleNotesValueChange,
    confirmCloseRow,
  } = useContactsTable(initialContacts);

  const saveAndCloseRow = async () => {
    if (rowToClose) {
      try {
        await handleNotesChange(rowToClose, notesValues[rowToClose] || "");
        toggleRowExpanded(rowToClose);
        setShowUnsavedChangesDialog(false);
        toast.success("Notes saved successfully.");
      } catch (error) {
        console.error("Failed to save notes:", error);
        toast.error("Couldn't save your notes. Try again?");
      }
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
          className="size-8 p-0"
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
    {
      header: "Name",
      accessorKey: "name",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
      size: 180,
      filterFn: nameFilterFn,
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
        const validStage = STATUS_BADGE_STYLES.hasOwnProperty(stage)
          ? stage
          : "neutral";

        return (
          <Badge
            variant="outline"
            className={cn(
              "font-medium text-xs",
              STATUS_BADGE_STYLES[
                validStage as keyof typeof STATUS_BADGE_STYLES
              ]
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
        const validSentiment = STATUS_BADGE_STYLES.hasOwnProperty(sentiment)
          ? sentiment
          : "neutral";

        return (
          <Badge
            variant="outline"
            className={cn(
              "font-medium text-xs",
              STATUS_BADGE_STYLES[
                validSentiment as keyof typeof STATUS_BADGE_STYLES
              ]
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
      header: "HRN",
      accessorKey: "requiresHumanResponse",
      cell: ({ row }) => {
        const requiresHumanResponse = !!row.original.requiresHumanResponse;

        if (!requiresHumanResponse) {
          return (
            <div className="text-xs text-muted-foreground" aria-label="Auto OK">
              Auto
            </div>
          );
        }

        return (
          <Badge
            variant="outline"
            className={cn("font-medium text-xs", STATUS_BADGE_STYLES.hrn)}
          >
            HRN
          </Badge>
        );
      },
      size: 80,
    },
    {
      header: "Tags",
      accessorKey: "tags",
      cell: ({ row }) => {
        const id = row.original.id;
        const tags = row.original.tags ?? [];
        return <TagEditor contactId={id} initialTags={tags} />;
      },
      size: 200,
      filterFn: tagsFilterFn,
    },
    {
      header: "Lead Score",
      accessorKey: "leadScore",
      cell: ({ row }) => {
        const leadScore = row.original.leadScore || 0;
        let scoreColor = "text-muted-foreground";
        if (leadScore >= 75) {
          scoreColor = "text-green-600 font-medium";
        } else if (leadScore >= 50) {
          scoreColor = "text-amber-600 font-medium";
        } else if (leadScore >= 25) {
          scoreColor = "text-orange-500";
        } else {
          scoreColor = "text-muted-foreground";
        }

        return <div className={cn("text-center", scoreColor)}>{leadScore}</div>;
      },
      size: 100,
    },
    {
      header: "Lead Value",
      accessorKey: "leadValue",
      cell: ({ row }) => {
        const leadValue = row.original.leadValue || 0;
        return <div className="text-center">${leadValue}</div>;
      },
      size: 100,
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
  const stageFilterValue = stageColumn?.getFilterValue() as
    | string[]
    | undefined;

  const sentimentColumn = table.getColumn("sentiment");
  const sentimentFilterValue = sentimentColumn?.getFilterValue() as
    | string[]
    | undefined;

  const tagsColumn = table.getColumn("tags");
  const tagsFilterValue = tagsColumn?.getFilterValue() as string[] | undefined;

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

  const uniqueTagValues = useMemo(() => {
    if (!tagsColumn) return [];

    const allTags = new Set<string>();
    contacts.forEach((contact) => {
      if (contact.tags && Array.isArray(contact.tags)) {
        contact.tags.forEach((tag) => {
          if (tag && typeof tag === "string") {
            allTags.add(tag);
          }
        });
      }
    });

    return Array.from(allTags).sort();
  }, [contacts, tagsColumn]);

  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>();
    contacts.forEach((contact) => {
      if (contact.tags && Array.isArray(contact.tags)) {
        contact.tags.forEach((tag) => {
          if (tag && typeof tag === "string") {
            counts.set(tag, (counts.get(tag) || 0) + 1);
          }
        });
      }
    });
    return counts;
  }, [contacts]);

  const selectedTags = useMemo(() => {
    return tagsFilterValue ?? [];
  }, [tagsFilterValue]);

  const handleTagChange = (checked: boolean, value: string) => {
    if (!tagsColumn) return;

    const filterValue = tagsFilterValue ?? [];
    const newFilterValue = [...filterValue];

    if (checked) {
      newFilterValue.push(value);
    } else {
      const index = newFilterValue.indexOf(value);
      if (index > -1) {
        newFilterValue.splice(index, 1);
      }
    }

    tagsColumn.setFilterValue(
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
                  className="opacity-60"
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
                  {uniqueStageValues.length > 0 ? (
                    uniqueStageValues.map((value, i) => (
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
                    ))
                  ) : (
                    <div className="text-muted-foreground text-xs">
                      No stages available
                    </div>
                  )}
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
                  className="opacity-60"
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
                  {uniqueSentimentValues.length > 0 ? (
                    uniqueSentimentValues.map((value, i) => (
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
                    ))
                  ) : (
                    <div className="text-muted-foreground text-xs">
                      No sentiments available
                    </div>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>
          {/* Filter by tags */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="border-border hover:bg-muted hover:text-foreground"
              >
                <FilterIcon
                  className="opacity-60"
                  size={16}
                  aria-hidden="true"
                />
                Tags
                {selectedTags.length > 0 && (
                  <span className="text-primary ml-2 text-xs font-medium">
                    ({selectedTags.length})
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto min-w-36 p-3" align="start">
              <div className="space-y-3">
                <div className="text-muted-foreground text-xs font-medium">
                  Filter by Tags
                </div>
                <div className="space-y-3">
                  {uniqueTagValues.length > 0 ? (
                    uniqueTagValues.map((value, i) => (
                      <div key={value} className="flex items-center gap-2">
                        <Checkbox
                          id={`${id}-tag-${i}`}
                          checked={selectedTags.includes(value)}
                          onCheckedChange={(checked: boolean) =>
                            handleTagChange(checked, value)
                          }
                          className="border-border data-[state=checked]:bg-primary"
                        />
                        <Label
                          htmlFor={`${id}-tag-${i}`}
                          className="flex grow justify-between gap-2 font-normal"
                        >
                          {value}{" "}
                          <span className="text-muted-foreground ms-2 text-xs">
                            {tagCounts.get(value) || 0}
                          </span>
                        </Label>
                      </div>
                    ))
                  ) : (
                    <div className="text-muted-foreground text-xs">
                      No tags available
                    </div>
                  )}
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
                  className="opacity-60"
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
                        <ExpandedContactRow
                          contact={row.original}
                          isEditing={editingNotes[row.original.id]}
                          notesValue={notesValues[row.original.id] || ""}
                          onEditClick={() => startEditingNotes(row.original.id)}
                          onNotesChange={(value) =>
                            handleNotesValueChange(row.original.id, value)
                          }
                          onStopEditing={() =>
                            stopEditingNotes(row.original.id)
                          }
                        />
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
                      No contacts yet
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      Connect Instagram to start tracking your leads
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
                    className="border-border disabled:opacity-50 disabled:pointer-events-none size-8"
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
                    className="border-border disabled:opacity-50 disabled:pointer-events-none size-8"
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
                    className="border-border disabled:opacity-50 disabled:pointer-events-none size-8"
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
                    className="border-border disabled:opacity-50 disabled:pointer-events-none size-8"
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

      {/* Unsaved Changes Dialog */}
      <AlertDialog
        open={showUnsavedChangesDialog}
        onOpenChange={setShowUnsavedChangesDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Wait! You have unsaved notes</AlertDialogTitle>
            <AlertDialogDescription>
              You&apos;ve written some notes but haven&apos;t saved them yet.
              Want to save them before closing?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={confirmCloseRow}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Discard
            </AlertDialogAction>
            <AlertDialogAction onClick={saveAndCloseRow}>
              Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}