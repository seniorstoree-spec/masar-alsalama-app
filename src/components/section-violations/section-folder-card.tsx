/**
 * SectionFolderCard Component
 */

import { Folder, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface SectionGroup {
  section: string;
  rows: any[];
  employees: number;
  topType: string;
}

export interface SectionFolderCardProps {
  group: SectionGroup;
  isActive: boolean;
  onToggle: () => void;
  onExportExcel: () => void;
  onExportPdf: () => void;
}

export function SectionFolderCard({
  group,
  isActive,
  onToggle,
  onExportExcel,
  onExportPdf,
}: SectionFolderCardProps) {
  return (
    <div
      className={`rounded-lg border p-4 transition hover:shadow-sm ${
        isActive ? "border-primary bg-primary/5" : "bg-card"
      }`}
    >
      <button type="button" onClick={onToggle} className="text-right w-full">
        <div className="flex items-center gap-2">
          <Folder className="w-5 h-5 text-primary shrink-0" />
          <span className="font-semibold truncate flex-1">{group.section}</span>
          <span className="text-xs rounded-md bg-primary/10 text-primary px-2 py-0.5 font-medium shrink-0">
            {group.rows.length}
          </span>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          {group.employees} عامل • الأكثر تكراراً: {group.topType}
        </div>
      </button>
      <div className="mt-3 flex gap-1">
        <Button size="sm" variant="ghost" className="text-xs" onClick={onExportExcel}>
          <FileSpreadsheet className="w-3.5 h-3.5 ml-1" /> Excel
        </Button>
        <Button size="sm" variant="ghost" className="text-xs" onClick={onExportPdf}>
          <FileText className="w-3.5 h-3.5 ml-1" /> PDF
        </Button>
      </div>
    </div>
  );
}
