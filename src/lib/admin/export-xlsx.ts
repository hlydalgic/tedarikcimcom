import "server-only";

import * as XLSX from "xlsx";

export function rowsToXlsxBuffer(
  sheetName: string,
  rows: Record<string, unknown>[]
): Buffer {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return Buffer.from(buf);
}
