"use client";
"use no memo";

import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type TableOptions,
  useReactTable,
} from "@tanstack/react-table";
import type { InstagramContact } from "@pilot/types/instagram";

type UseContactsReactTableOptions = Omit<
  TableOptions<InstagramContact>,
  | "getCoreRowModel"
  | "getSortedRowModel"
  | "getPaginationRowModel"
  | "getFilteredRowModel"
>;

export function useContactsReactTable(options: UseContactsReactTableOptions) {
  return useReactTable({
    ...options,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });
}

