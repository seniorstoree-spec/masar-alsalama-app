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
  { 
    header: "التاريخ", 
    sortKey: "date", 
    value: (v) => {
      const d = v.violation_date;
      if (!d) return "";
      const parts = String(d).split("-");
      if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
      return d;
    }
  },
  { header: "الاسم", value: (v) => v.employees?.name || v.employee_name || "" },
  { header: "الكود", sortKey: "code", value: (v) => v.employees?.code || v.employee_code || "" },
  { header: "المسمى الوظيفي", value: (v) => v.employees?.job_title || v.employee_job_title || "" },
  { header: "القسم", value: (v) => v.employees?.department || v.employee_department || "" },
  { header: "القسم الإنتاجي", value: (v) => v.production_section || "" },
  { header: "نوع المخالفة", value: (v) => v.violation_types?.name || "" },
  { header: "الخطورة", sortKey: "severity", value: (v) => v.severity || "" },
  { header: "مهندس الجودة", value: (v) => v.inspector_name || "" },
  { header: "ملاحظات", value: (v) => v.notes || "" },
];

const AR_MONTHS = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function buildCycles(count = 24) {
  const now = new Date();
  let y = now.getFullYear();
  let m = now.getMonth();

  const out: { id: string; label: string; from: string; to: string; current: boolean }[] = [];

  for (let i = 0; i < count; i++) {
    const curEndMonth = m;
    const curEndYear = y;

    let prevMonth = m - 1;
    let prevYear = y;
    if (prevMonth < 0) {
      prevMonth = 11;
      prevYear--;
    }

    const fromStr = `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}-16`;
    const toStr = `${curEndYear}-${String(curEndMonth + 1).padStart(2, "0")}-15`;

    const label = `دورة 16 ${AR_MONTHS[prevMonth]} — 15 ${AR_MONTHS[curEndMonth]} ${curEndYear}`;
    const today = fmt(now);
    const isCur = today >= fromStr && today <= toStr;

    out.push({
      id: `${fromStr}_${toStr}`,
      label,
      from: fromStr,
      to: toStr,
      current: isCur,
    });

    m--;
    if (m < 0) {
      m = 11;
      y--;
    }
  }

  return out;
}

function ReportsPage() {
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("all");
  const [prodSec, setProdSec] = useState("all");
  const [typeId, setTypeId] = useState("all");
  const [severity, setSeverity] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [cycleId, setCycleId] = useState<string>("all");

  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [previewOpen, setPreviewOpen] = useState(false);

  const cycles = useMemo(() => buildCycles(24), []);

  const { data: violations = [] } = useViolations(REPORTS_VIOLATIONS_QUERY_KEY);

  const { data: vTypes = [] } = useQuery({
    queryKey: ["violation-types"],
    queryFn: () => violationTypesService.getViolationTypes(),
  });

  const { data: pSections = [] } = useQuery({
    queryKey: ["production-sections"],
    queryFn: () => productionSectionsService.getProductionSections(),
  });

  const departments = useMemo(() => {
    const s = new Set<string>();
    (violations as any[]).forEach((v) => {
      const d = v.employees?.department || v.employee_department;
      if (d) s.add(d);
    });
    return Array.from(s).sort();
  }, [violations]);

  const applyCycle = (cid: string) => {
    setCycleId(cid);
    if (cid === "all") {
      setFrom("");
      setTo("");
      return;
    }
    const found = cycles.find((c) => c.id === cid);
    if (found) {
      setFrom(found.from);
      setTo(found.to);
    }
  };

  const filtered = useMemo(() => {
    let rows = (violations as any[]).filter((v) => {
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const f = [
          v.employees?.name || v.employee_name || "",
          v.employees?.code || v.employee_code || "",
          v.employees?.department || v.employee_department || "",
          v.production_section || "",
        ];
        if (!f.some((x) => String(x).toLowerCase().includes(q))) return false;
      }

      const d = v.employees?.department || v.employee_department || "";
      if (dept !== "all" && d !== dept) return false;

      if (prodSec !== "all" && (v.production_section || "") !== prodSec) return false;

      if (typeId !== "all" && String(v.violation_type_id) !== typeId) return false;

      if (severity !== "all" && v.severity !== severity) return false;

      const dt = String(v.violation_date || "");
      if (from && dt < from) return false;
      if (to && dt > to) return false;

      return true;
    });

    if (sortKey) {
      rows = [...rows].sort((a, b) => {
        let res = 0;
        if (sortKey === "date") {
          res = String(a.violation_date || "").localeCompare(String(b.violation_date || ""));
        } else if (sortKey === "code") {
          const ca = String(a.employees?.code || a.employee_code || "");
          const cb = String(b.employees?.code || b.employee_code || "");
          res = ca.localeCompare(cb, "ar", { numeric: true });
        } else if (sortKey === "severity") {
          res = (SEVERITY_RANK[a.severity] || 0) - (SEVERITY_RANK[b.severity] || 0);
        }
        return sortDir === "asc" ? res : -res;
      });
    }

    return rows;
  }, [violations, search, dept, prodSec, typeId, severity, from, to, sortKey, sortDir]);

  const toggleSort = (k: Exclude<SortKey, null>) => {
    if (sortKey === k) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(k);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ k }: { k: Exclude<SortKey, null> }) => {
    if (sortKey !== k) return null;
    return sortDir === "asc" ? <ArrowUp className="w-3.5 h-3.5 inline mr-1" /> : <ArrowDown className="w-3.5 h-3.5 inline mr-1" />;
  };

  const clearFilters = () => {
    setSearch("");
    setDept("all");
    setProdSec("all");
    setTypeId("all");
    setSeverity("all");
    setFrom("");
    setTo("");
    setCycleId("all");
    setSortKey("date");
    setSortDir("desc");
  };

  const activeFilters = useMemo(() => {
    const list: { k: string; v: string }[] = [];
    if (search.trim()) list.push({ k: "البحث", v: search.trim() });
    if (dept !== "all") list.push({ k: "القسم", v: dept });
    if (prodSec !== "all") list.push({ k: "القسم الإنتاجي", v: prodSec });
    if (typeId !== "all") {
      const t = vTypes.find((x: any) => String(x.id) === typeId);
      list.push({ k: "نوع المخالفة", v: t?.name || typeId });
    }
    if (severity !== "all") list.push({ k: "الخطورة", v: severity });
    if (from || to) list.push({ k: "الفترة", v: `${from || "بدون بداية"} إلى ${to || "بدون نهاية"}` });
    return list;
  }, [search, dept, prodSec, typeId, severity, from, to, vTypes]);

  const handleExcelExport = () => exportToExcel("تقرير_المخالفات", "المخالفات", COLUMNS, filtered);

  const handlePdfExport = () => {
    const sub = activeFilters.length ? `الفلاتر: ${activeFilters.map((f) => `${f.k}: ${f.v}`).join(" | ")}` : "جميع المخالفات بدون فلاتر";
    exportToPdf("تقرير مخالفات العاملين", sub, COLUMNS, filtered);
  };

  const sortLabel = sortKey
    ? `${sortKey === "date" ? "التاريخ" : sortKey === "code" ? "كود الموظف" : "مستوى الخطورة"} (${sortDir === "asc" ? "تصاعدي" : "تنازلي"})`
    : "بدون فرز";

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader
        title="تقارير المخالفات"
        subtitle={`إجمالي النتائج: ${filtered.length} من أصل ${violations.length} مخالفة`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setPreviewOpen(true)} disabled={filtered.length === 0}>
              <Eye className="w-4 h-4 ml-1" /> معاينة التصدير
            </Button>
            <Button variant="outline" onClick={handleExcelExport} disabled={filtered.length === 0}>
              <FileSpreadsheet className="w-4 h-4 ml-1" /> تصدير Excel
            </Button>
            <Button onClick={handlePdfExport} disabled={filtered.length === 0}>
              <FileText className="w-4 h-4 ml-1" /> طباعة / PDF
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className="pt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
          <div className="space-y-1 col-span-2">
            <Label className="text-xs">بحث سريع (الاسم / الكود / القسم)</Label>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="اكتب الاسم أو الكود أو القسم..." />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">القسم (الإدارة)</Label>
            <Select value={dept} onValueChange={setDept}>
              <SelectTrigger><SelectValue placeholder="الكل" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الأقسام</SelectItem>
                {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">القسم الإنتاجي</Label>
            <Select value={prodSec} onValueChange={setProdSec}>
              <SelectTrigger><SelectValue placeholder="الكل" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الأقسام الإنتاجية</SelectItem>
                {pSections.map((s: any) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">نوع المخالفة</Label>
            <Select value={typeId} onValueChange={setTypeId}>
              <SelectTrigger><SelectValue placeholder="الكل" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الأنواع</SelectItem>
                {vTypes.map((t: any) => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">مستوى الخطورة</Label>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger><SelectValue placeholder="الكل" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل المستويات</SelectItem>
                <SelectItem value="منخفض">منخفض</SelectItem>
                <SelectItem value="متوسط">متوسط</SelectItem>
                <SelectItem value="عالي">عالي</SelectItem>
                <SelectItem value="حرج">حرج</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1 col-span-2">
            <Label className="text-xs">الشهر (دورة 16 إلى 15)</Label>
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
                  return (
                    <TableCell key={c.header} className={`text-sm ${c.header === "الكود" ? "font-mono" : ""} ${c.header === "الاسم" ? "font-medium" : ""} ${c.header === "التاريخ" ? "whitespace-nowrap font-mono" : ""}`}>
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

            <div className="border rounded-md overflow-x-auto max-h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    {COLUMNS.map((c) => (
                      <TableHead key={c.header} className="text-right text-xs whitespace-nowrap">{c.header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.slice(0, 10).map((v: any) => (
                    <TableRow key={v.id}>
                      {COLUMNS.map((c) => (
                        <TableCell key={c.header} className="text-xs whitespace-nowrap">{c.value(v) || "—"}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filtered.length > 10 && (
                <div className="p-2 text-center text-xs text-muted-foreground bg-muted/30">
                  يتم عرض أول 10 سجلات فقط كمعاينة من أصل {filtered.length}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={handleExcelExport}>
                <FileSpreadsheet className="w-4 h-4 ml-1" /> تصدير Excel
              </Button>
              <Button onClick={handlePdfExport}>
                <FileText className="w-4 h-4 ml-1" /> طباعة / PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
