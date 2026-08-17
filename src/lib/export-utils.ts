/**
 * Unified Export Utilities for Excel (.xlsx) and PDF Print Reports
 */

import type { ColumnDefinition } from "@/types";

/**
 * Triggers a browser download for a Blob object.
 */
export function downloadFileBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Helper to escape HTML characters for safe PDF generation.
 */
function escapeHtml(str: string | null | undefined): string {
  return String(str ?? "").replace(
    /[&<>"']/g,
    (match) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[match] as string),
  );
}

/**
 * Exports data to an Excel (.xlsx) file.
 */
export async function exportToExcel<T>(
  filename: string,
  sheetName: string,
  columns: ColumnDefinition<T>[],
  items: T[],
  extraColumns?: { header: string; getValue: (item: T) => string }[],
): Promise<void> {
  const XLSX = await import("xlsx");
  const headers = [
    ...columns.map((col) => col.header),
    ...(extraColumns ? extraColumns.map((col) => col.header) : []),
  ];

  const dataRows = items.map((item) => [
    ...columns.map((col) => col.value(item)),
    ...(extraColumns ? extraColumns.map((col) => col.getValue(item)) : []),
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
  worksheet["!cols"] = headers.map((header) => ({
    wch: Math.max(12, header.length + 4),
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
  XLSX.writeFile(workbook, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
}

/**
 * Generates and opens a printable PDF document window.
 */
export function exportToPdf<T>(
  title: string,
  subtitleMeta: string,
  columns: ColumnDefinition<T>[],
  items: T[],
  options?: {
    getImageUrl?: (item: T) => string | undefined;
    imageHeaderPosition?: "first" | "last";
  },
): void {
  const showImages = Boolean(options?.getImageUrl);
  const imageHeaderPos = options?.imageHeaderPosition || "last";

  const imageTh = showImages ? '<th>الصورة</th>' : '';
  const headCells = columns.map((col) => `<th>${escapeHtml(col.header)}</th>`).join("");
  const tableHead =
    imageHeaderPos === "first"
      ? `<tr>${imageTh}${headCells}</tr>`
      : `<tr>${headCells}${imageTh}</tr>`;

  const tableBody = items
    .map((item) => {
      const dataCells = columns.map((col) => `<td>${escapeHtml(col.value(item))}</td>`).join("");
      if (!showImages) {
        return `<tr>${dataCells}</tr>`;
      }

      const imgUrl = options?.getImageUrl?.(item);
      const imgTd = imgUrl
        ? `<td class="img"><img src="${escapeHtml(imgUrl)}" alt="صورة" /></td>`
        : `<td class="img">—</td>`;

      return imageHeaderPos === "first"
        ? `<tr>${imgTd}${dataCells}</tr>`
        : `<tr>${dataCells}${imgTd}</tr>`;
    })
    .join("");

  const htmlContent = `<!doctype html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: "Cairo", "Segoe UI", Tahoma, sans-serif; padding: 16px; color: #0f172a; direction: rtl; }
    h1 { font-size: 18px; margin: 0 0 4px; }
    .meta { font-size: 11px; color: #475569; margin-bottom: 10px; line-height: 1.5; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; }
    th, td { border: 1px solid #cbd5e1; padding: 4px 6px; text-align: right; vertical-align: top; }
    th { background: #e2e8f0; font-weight: 600; }
    td.img { text-align: center; }
    td.img img { max-width: 90px; max-height: 90px; object-fit: contain; }
    tr { page-break-inside: avoid; }
    @page { size: A4 landscape; margin: 10mm; }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <div class="meta">${subtitleMeta}</div>
  <table>
    <thead>${tableHead}</thead>
    <tbody>${tableBody}</tbody>
  </table>
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 800);
    };
  <\/script>
</body>
</html>`;

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
