/**
 * Violations Page Route Component
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ViolationForm } from "@/components/violation-form";
import { useViolations, useDeleteViolation, VIOLATIONS_QUERY_KEY } from "@/hooks/use-violations";
import { useMinimalEmployees } from "@/hooks/use-employees";
import type { SeverityLevel, Violation } from "@/types";

const SEVERITY_RANK: Record<string, number> = { منخفض: 1, متوسط: 2, عالي: 3, حرج: 4 };
type SortKey = "violation_date" | "code" | "severity";
type SortDir = "asc" | "desc";

export const Route = createFileRoute("/_authenticated/violations")({
  component: ViolationsPage,
});

const severityColor: Record<SeverityLevel, string> = {
  منخفض: "bg-emerald-100 text-emerald-700",
  متوسط: "bg-amber-100 text-amber-700",
  عالي: "bg-orange-100 text-orange-700",
  حرج: "bg-red-100 text-red-700",
};

function ViolationsPage() {
  const [editing, setEditing] = useState<Violation | null>(null);
  const [deptFilter, setDeptFilter] = useState("");
  const [empFilter, setEmpFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("violation_date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Hooks
  const { data: violations = [] } = useViolations(VIOLATIONS_QUERY_KEY);
  const { data: employees = [] } = useMinimalEmployees();
  const deleteMutation = useDeleteViolation();

  const filtered = useMemo(() => {
    const base = violations.filter((v: any) => {
      if (deptFilter && v.employees?.department !== deptFilter) return false;
      if (empFilter && v.employee_id !== empFilter) return false;
      return true;
    });
    const dir = sortDir === "asc" ? 1 : -1;
    return [...base].sort((a: any, b: any) => {
      let av: any, bv: any;
      if (sortKey === "violation_date") {
        av = a.violation_date || "";
        bv = b.violation_date || "";
      } else if (sortKey === "code") {
        av = (a.employees?.code || a.employee_code || "").toString();
        bv = (b.employees?.code || b.employee_code || "").toString();
        return av.localeCompare(bv, "ar", { numeric: true }) * dir;
      } else {
        av = SEVERITY_RANK[a.severity] || 0;
        bv = SEVERITY_RANK[b.severity] || 0;
      }
      return av < bv ? -1 * dir : av > bv ? 1 * dir : 0;
    });
  }, [violations, deptFilter, empFilter, sortKey, sortDir]);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(k);
      setSortDir(k === "violation_date" ? "desc" : "asc");
    }
  };

  const sortIcon = (k: SortKey) =>
    sortKey !== k ? (
      <ArrowUpDown className="w-3 h-3 inline-block mr-1 opacity-50" />
    ) : sortDir === "asc" ? (
      <ArrowUp className="w-3 h-3 inline-block mr-1" />
    ) : (
      <ArrowDown className="w-3 h-3 inline-block mr-1" />
    );

  const departments = Array.from(new Set(employees.map((e) => e.department).filter(Boolean)));

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="المخالفات" subtitle={`إجمالي ${violations.length} مخالفة`} />

      <div className="flex flex-wrap gap-3">
        <Select value={deptFilter || "all"} onValueChange={(v) => setDeptFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="w-48"><SelectValue placeholder="فلتر القسم" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الأقسام</SelectItem>
            {departments.map((d: any) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={empFilter || "all"} onValueChange={(v) => setEmpFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="w-56"><SelectValue placeholder="فلتر الموظف" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الموظفين</SelectItem>
            {employees.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">
                <button type="button" onClick={() => toggleSort("violation_date")} className="inline-flex items-center gap-1 hover:text-foreground">
                  {sortIcon("violation_date")} التاريخ
                </button>
              </TableHead>
              <TableHead className="text-right">
                <button type="button" onClick={() => toggleSort("code")} className="inline-flex items-center gap-1 hover:text-foreground">
                  {sortIcon("code")} الكود
                </button>
              </TableHead>
              <TableHead className="text-right">العامل</TableHead>
              <TableHead className="text-right">القسم</TableHead>
              <TableHead className="text-right">النوع</TableHead>
              <TableHead className="text-right">
                <button type="button" onClick={() => toggleSort("severity")} className="inline-flex items-center gap-1 hover:text-foreground">
                  {sortIcon("severity")} الخطورة
                </button>
              </TableHead>
              <TableHead className="text-right">مهندس الجودة</TableHead>
              <TableHead className="text-right">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">لا توجد مخالفات</TableCell></TableRow>
            ) : filtered.map((v: any) => (
              <TableRow key={v.id}>
                <TableCell className="text-sm">{v.violation_date}</TableCell>
                <TableCell className="text-sm font-mono">{v.employees?.code || v.employee_code || "—"}</TableCell>
                <TableCell className="font-medium">{v.employees?.name || v.employee_name || "—"}</TableCell>
                <TableCell className="text-sm">{v.employees?.department || v.employee_department || "—"}</TableCell>
                <TableCell className="text-sm">{v.violation_types?.name || "—"}</TableCell>
                <TableCell>
                  <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${severityColor[v.severity as SeverityLevel] || ""}`}>
                    {v.severity}
                  </span>
                </TableCell>
                <TableCell className="text-sm">{v.inspector_name || "—"}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setEditing(v)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => { if (confirm("حذف المخالفة؟")) deleteMutation.mutate(v.id); }}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!editing} onOpenChange={(v) => { if (!v) setEditing(null); }}>
        <DialogContent className="max-w-2xl w-[calc(100vw-1rem)] max-h-[92vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader><DialogTitle className="text-base sm:text-lg">تعديل مخالفة</DialogTitle></DialogHeader>
          {editing && <ViolationForm editing={editing} onSaved={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
