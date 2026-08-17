/**
 * ArchiveMonthCard Component
 */

import { FileDown, FileText, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ArchiveFolder {
  key: string;
  year: number;
  month: number;
  rows: any[];
  label: string;
  employeesCount: number;
  topEmp: string;
  topType: string;
}

export interface ArchiveMonthCardProps {
  folder: ArchiveFolder;
  onOpenFolder: () => void;
  onExportBoth: () => void;
  onExportExcel: () => void;
  onExportPdf: () => void;
}

export function ArchiveMonthCard({
  folder,
  onOpenFolder,
  onExportBoth,
  onExportExcel,
  onExportPdf,
}: ArchiveMonthCardProps) {
  return (
    <div className="rounded-lg border p-4 space-y-2 hover:border-primary/50 transition">
      <div className="flex items-center justify-between gap-2">
        <div className="font-semibold">📁 {folder.label}</div>
        <span className="text-xs rounded-md bg-primary/10 text-primary px-2 py-0.5 font-medium shrink-0">
          {folder.rows.length} مخالفة
        </span>
      </div>
      <div className="text-xs text-muted-foreground break-words">عدد العمال: {folder.employeesCount}</div>
      <div className="text-xs text-muted-foreground break-words">أكثر عامل: {folder.topEmp}</div>
      <div className="text-xs text-muted-foreground break-words">أكثر مخالفة: {folder.topType}</div>
      <div className="grid grid-cols-2 gap-2 pt-1">
        <Button size="sm" variant="outline" onClick={onOpenFolder}>
          فتح المجلد
        </Button>
        <Button size="sm" variant="ghost" onClick={onExportBoth}>
          <FileDown className="w-4 h-4 ml-1" /> Excel + PDF
        </Button>
        <Button size="sm" variant="ghost" onClick={onExportExcel}>
          <FileSpreadsheet className="w-4 h-4 ml-1" /> Excel
        </Button>
        <Button size="sm" variant="ghost" onClick={onExportPdf}>
          <FileText className="w-4 h-4 ml-1" /> PDF
        </Button>
      </div>
    </div>
  );
}
