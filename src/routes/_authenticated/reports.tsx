/**
 * Reports Route Component
 */

import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, ArrowUp, ArrowDown, Eye, FileText, FileSpreadsheet } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { useViolations, REPORTS_VIOLATIONS_QUERY_KEY } from "@/hooks/use-violations";
import { violationTypesService } from "@/services/api/violation-types-service";
import { productionSectionsService } from "@/services/api/production-sections-service";
import { exportToExcel, exportToPdf } from "@/lib/export-utils";
import type { ColumnDefinition, SeverityLevel } from "@/types";

export const Route = createFileRoute("/_authenticated/reports")({
  component: ReportsPage,
});

const severityColor: Record<SeverityLevel, string> = {
  منخفض: "bg-emerald-100 text-emerald-700",
  متوسط: "bg-amber-100 text-amber-700",
  عالي: "bg-orange-100 text-orange-700",
  حرج: "bg-red-100 text-red-700",
};

const SEVERITY_RANK: Record<string, number> = { منخفض: 1, متوسط: 2, عالي: 3, حرج: 4 };

type SortKey = "date" | "code" | "severity" | null;
type SortDir = "asc" | "desc";

const COLUMNS: ColumnDefinition[] = [
  { header: "التاريخ", sortKey: "date", value: (v) => v.violation_date || "" },
  { header: "الاسم", value: (v) => v.employees?.name || v.employee_name || "" },
  { header: "الكود", sortKey: "code", value: (v) => v.employees?.code || v.employee_code || "" },
  { header: "المسمى الوظيفي", value: (v) => v.employees?.job_title || v.employee_job_title || "" },
  { header: "القسم", value: (v) => v.employees?.department || v.employee_department || "" },
  { header: "القسم الإنتاجي", value: (v) => v.production_section || "" },
  { header: "نوع المخالفة", value: (v) => v.violation_types?.name || "" },
  { header: "الخطورة", sortKey: "severity", value: (v) => v.severity || "" },
  { header: "الحالة", value: (v) => v.status || "" },
  { header: "مهندس الجودة", value: (v) => v.inspector_name || "" },
  { header: "ملاحظات", value: (v) => v.notes || "" },
];

const AR_MONTHS = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function buildCycles(count = 24) {
  const now = new Date();
  let y = now.getFullYear();
  let m = now.getMonth();
  if (now.getDate() < 15) m -= 1;
  const list: { id: string; label: string; from: string; to: string; current: boolean }[] = [];
  for (let i = 0; i < count; i++) {
    const start = new Date(y, m - i, 15);
    const end = new Date(y, m - i + 1, 15);
    list.push({
      id: fmt(start),
      label: `${AR_MONTHS[start.getMonth()]} ${start.getFullYear()} (15/${start.getMonth() + 1} – 15/${end.getMonth() + 1})`,
      from: fmt(start),
      to: fmt(new Date(end.getFullYear(), end.getMonth(), 14)),
      current: i === 0,
    });
  }
  return list;
}

function ReportsPage() {
  const [nameQ, setNameQ] = useState("");
  const [codeQ, setCodeQ] = useState("");
  const [deptQ, setDeptQ] = useState("");
  const [typeQ, setTypeQ] = useState("");
  const [prodSectionQ, setProdSectionQ] = useState("");
  const cycles = useMemo(() => buildCycles(), []);
  const [cycleId, setCycleId] = useState<string>(cycles[0]?.id ?? "");
  const cycle = cycles.find((c) => c.id === cycleId) || null;
  const [from, setFrom] = useState(cycles[0]?.from ?? "");
  const [to, setTo] = useState(cycles[0]?.to ?? "");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [previewOpen, setPreviewOpen] = useState(false);

  // Queries
  const { data: violations = [] } = useViolations(REPORTS_VIOLATIONS_QUERY_KEY);

  const { data: types = [] } = useQuery({
    queryKey: ["violation-types"],
    queryFn: () => violationTypesService.getViolationTypes(),
  });

  const { data: prodSections = [] } = useQuery({
    queryKey: ["production-sections"],
    queryFn: () => productionSectionsService.getProductionSections(),
  });

  const applyCycle = (id: string) => {
    setCycleId(id);
    if (id === "all") { setFrom(""); setTo(""); return; }
    const c = cycles.find((x) => x.id === id);
    if (c) { setFrom(c.from); setTo(c.to); }
  };

  const toggleSort = (key: Exclude<SortKey, null>) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir(key === "date" ? "desc" : "asc"); }
  };

  const SortIcon = ({ k }: { k: Exclude<SortKey, null> }) =>
    sortKey !== k ? null : sortDir === "asc" ? <ArrowUp className="w-3 h-3 inline mr-1" /> : <ArrowDown className="w-3 h-3 inline mr-1" />;

  const departments = useMemo(() => {
    const s = new Set<string>();
    violations.forEach((v: any) => {
      const d = v.employees?.department || v.employee_department;
      if (d) s.add(d);
    });
    return Array.from(s);
  }, [violations]);

  const filtered = useMemo(() => {
    const rows = violations.filter((v: any) => {
      const name = (v.employees?.name || v.employee_name || "").toLowerCase();
      const code = (v.employees?.code || v.employee_code || "").toLowerCase();
      const dept = v.employees?.department || v.employee_department || "";
      const typeId = v.violation_type_id || "";
      const prod = v.production_section || "";
      if (nameQ && !name.includes(nameQ.toLowerCase())) return false;
      if (codeQ && !code.includes(codeQ.toLowerCase())) return false;
      if (deptQ && dept !== deptQ) return false;
      if (typeQ && typeId !== typeQ) return false;
      if (prodSectionQ && prod !== prodSectionQ) return false;
      if (from && (v.violation_date || "") < from) return false;
      if (to && (v.violation_date || "") > to) return false;
      return true;
    });
    if (!sortKey) return rows;
    const sorted = [...rows].sort((a: any, b: any) => {
      let av: any, bv: any;
      if (sortKey === "date") { av = a.violation_date || ""; bv = b.violation_date || ""; }
      else if (sortKey === "code") { av = a.employees?.code || a.employee_code || ""; bv = b.employees?.code || b.employee_code || ""; }
      else { av = SEVERITY_RANK[a.severity] || 0; bv = SEVERITY_RANK[b.severity] || 0; }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [violations, nameQ, codeQ, deptQ, typeQ, prodSectionQ, from, to, sortKey, sortDir]);

  const typeName = types.find((t: any) => t.id === typeQ)?.name || "";
  const sortLabel = sortKey
    ? `${COLUMNS.find((c) => c.sortKey === sortKey)?.header} (${sortDir === "asc" ? "تصاعدي" : "تنازلي"})`
    : "بدون فرز";

  const activeFilters = [
    nameQ && { k: "اسم الموظف", v: nameQ },
    codeQ && { k: "الكود", v: codeQ },
    deptQ && { k: "القسم", v: deptQ },
    typeName && { k: "نوع المخالفة", v: typeName },
    prodSectionQ && { k: "القسم الإنتاجي", v: prodSectionQ },
    cycle && { k: "الشهر", v: cycle.label },
    from && { k: "من تاريخ", v: from },
    to && { k: "إلى تاريخ", v: to },
  ].filter(Boolean) as { k: string; v: string }[];

  const rowsOf = (list: any[]) => list.map((v: any) => COLUMNS.map((c) => c.value(v)));
  const buildRows = () => rowsOf(filtered);

  const handleExportXlsx = async (list: any[] = filtered, label = "") => {
    await exportToExcel(
      `تقرير_المخالفات_${label || new Date().toISOString().slice(0, 10)}`,
      "التقرير",
      COLUMNS,
      list,
    );
  };

  const handleExportPdf = (list: any[] = filtered, label = "") => {
    const meta = label
      ? `الشهر: ${label}`
      : activeFilters.map((f) => `${f.k}: ${f.v}`).join(" • ") || "بدون فلاتر";

    exportToPdf(
      "تقرير المخالفات",
      `عدد السجلات: ${list.length} • الفرز: ${sortLabel}<br>الفلاتر: ${meta}`,
      COLUMNS,
      list,
    );
  };

  const clearFilters = () => { setNameQ(""); setCodeQ(""); setDeptQ(""); setTypeQ(""); setProdSectionQ(""); applyCycle(cycles[0]?.id ?? "all"); };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader
        title="التقارير"
        subtitle={`${filtered.length} مخالفة`}
        actions={
          <Button onClick={() => setPreviewOpen(true)}>
            <Eye className="w-4 h-4 ml-1" /> معاينة وتصدير
          </Button>
        }
      />

      <Card>
        <CardContent className="p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">اسم الموظف</Label>
            <Input value={nameQ} onChange={(e) => setNameQ(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">الكود</Label>
            <Input value={codeQ} onChange={(e) => setCodeQ(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">القسم</Label>
            <Select value={deptQ || "all"} onValueChange={(v) => setDeptQ(v === "all" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="كل الأقسام" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الأقسام</SelectItem>
                {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">نوع المخالفة</Label>
            <Select value={typeQ || "all"} onValueChange={(v) => setTypeQ(v === "all" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="كل الأنواع" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الأنواع</SelectItem>
                {types.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">القسم الإنتاجي</Label>
            <Select value={prodSectionQ || "all"} onValueChange={(v) => setProdSectionQ(v === "all" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="كل الأقسام الإنتاجية" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الأقسام الإنتاجية</SelectItem>
                {prodSections.map((s: any) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 col-span-2">
            <Label className="text-xs">الشهر (دورة 15 إلى 15)</Label>
            <Select value={cycleId || "all"} onValueChange={applyCycle}>
              <SelectTrigger><SelectValue placeholder="اختر الشهر" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الفترات</SelectItem>
                {cycles.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.label}{c.current ? " — الحالي" : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">من تاريخ</Label>
            <Input type="date" value={from} onChange={(e) => { setCycleId("all"); setFrom(e.target.value); }} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">إلى تاريخ</Label>
            <Input type="date" value={to} onChange={(e) => { setCycleId("all"); setTo(e.target.value); }} />
          </div>

          <div className="col-span-2 md:col-span-4 lg:col-span-7 flex justify-end">
            <Button variant="ghost" size="sm" onClick={clearFilters}><X className="w-4 h-4 ml-1" /> مسح الفلاتر</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {COLUMNS.map((c) => (
                <TableHead
                  key={c.header}
                  className={`text-right whitespace-nowrap ${c.sortKey ? "cursor-pointer select-none" : ""}`}
                  onClick={c.sortKey ? () => toggleSort(c.sortKey as Exclude<SortKey, null>) : undefined}
                >
                  {c.sortKey && <SortIcon k={c.sortKey as Exclude<SortKey, null>} />}{c.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={COLUMNS.length} className="text-center text-muted-foreground py-8">لا توجد بيانات</TableCell></TableRow>
            ) : filtered.map((v: any) => (
              <TableRow key={v.id}>
                {COLUMNS.map((c) => {
                  const val = c.value(v);
                  if (c.header === "الخطورة") {
                    return (
                      <TableCell key={c.header}>
                        <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${severityColor[val as SeverityLevel] || ""}`}>{val}</span>
                      </TableCell>
                    );
                  }
                  if (c.header === "الحالة") {
                    return <TableCell key={c.header}><Badge variant={val === "مغلقة" ? "secondary" : "default"}>{val}</Badge></TableCell>;
                  }
                  return (
                    <TableCell key={c.header} className={`text-sm ${c.header === "الكود" ? "font-mono" : ""} ${c.header === "الاسم" ? "font-medium" : ""}`}>
                      {val || "—"}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="w-[calc(100vw-1rem)] sm:max-w-4xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>معاينة التصدير</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground mb-1">عدد السجلات</div>
                <div className="font-bold text-lg">{filtered.length}</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground mb-1">الفرز المطبّق</div>
                <div className="font-semibold">{sortLabel}</div>
              </div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground mb-1">الفلاتر المطبّقة</div>
              {activeFilters.length === 0 ? (
                <div className="text-muted-foreground">بدون فلاتر — سيتم تصدير كل السجلات</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {activeFilters.map((f) => (
                    <span key={f.k} className="rounded-md bg-muted px-2 py-1 text-xs">{f.k}: <span className="font-medium">{f.v}</span></span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="text-xs text-muted-foreground mb-1">ترتيب الأعمدة في الملف</div>
              <div className="flex flex-wrap gap-2">
                {COLUMNS.map((c, i) => (
                  <span key={c.header} className="rounded-md border px-2 py-1 text-xs">{i + 1}. {c.header}</span>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground mb-1">أول 5 صفوف</div>
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-xs">
                  <thead className="bg-muted">
                    <tr>{COLUMNS.map((c) => <th key={c.header} className="px-2 py-1 text-right whitespace-nowrap">{c.header}</th>)}</tr>
                  </thead>
                  <tbody>
                    {buildRows().slice(0, 5).map((r, i) => (
                      <tr key={i} className="border-t">
                        {r.map((cell, j) => <td key={j} className="px-2 py-1 whitespace-nowrap">{cell || "—"}</td>)}
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr><td colSpan={COLUMNS.length} className="px-2 py-3 text-center text-muted-foreground">لا توجد بيانات</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 justify-end pt-2 border-t">
              <Button variant="outline" onClick={() => handleExportPdf()} disabled={filtered.length === 0}>
                <FileText className="w-4 h-4 ml-1" /> تصدير PDF
              </Button>
              <Button onClick={() => handleExportXlsx()} disabled={filtered.length === 0}>
                <FileSpreadsheet className="w-4 h-4 ml-1" /> تصدير Excel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
