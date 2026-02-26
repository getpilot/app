import type { InstagramContact } from "@/types/instagram";
import * as XLSX from "xlsx";

type ExportRow = {
  Name: string;
  "Last Message": string;
  "Last Message At": string;
  Stage: string;
  Sentiment: string;
  HRN: string;
  Tags: string;
  "Lead Score": number;
  "Lead Value": number;
  "Next Action": string;
  Notes: string;
};

function contactToRow(c: InstagramContact): ExportRow {
  return {
    Name: c.name ?? "",
    "Last Message": c.lastMessage ?? "",
    "Last Message At": c.timestamp
      ? new Date(c.timestamp).toLocaleString()
      : "",
    Stage: c.stage ?? "",
    Sentiment: c.sentiment ?? "",
    HRN: c.requiresHumanResponse ? "Yes" : "No",
    Tags: (c.tags ?? []).join(", "),
    "Lead Score": c.leadScore ?? 0,
    "Lead Value": c.leadValue ?? 0,
    "Next Action": c.nextAction ?? "",
    Notes: c.notes ?? "",
  };
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportToCSV(contacts: InstagramContact[]) {
  const rows = contacts.map(contactToRow);
  if (rows.length === 0) return;

  const headers = Object.keys(rows[0]) as (keyof ExportRow)[];

  const csvLines = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = String(row[h] ?? "");
          if (val.includes(",") || val.includes('"') || val.includes("\n")) {
            return `"${val.replace(/"/g, '""')}"`;
          }
          return val;
        })
        .join(","),
    ),
  ];

  const blob = new Blob([csvLines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  triggerDownload(
    blob,
    `contacts-${new Date().toISOString().slice(0, 10)}.csv`,
  );
}

export function exportToExcel(contacts: InstagramContact[]) {
  const rows = contacts.map(contactToRow);
  if (rows.length === 0) return;

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Contacts");

  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  triggerDownload(
    blob,
    `contacts-${new Date().toISOString().slice(0, 10)}.xlsx`,
  );
}
