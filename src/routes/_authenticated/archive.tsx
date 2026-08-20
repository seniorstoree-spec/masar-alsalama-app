/**
 * Archive Page Route Component
 */

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, FileDown, FileText, FileSpreadsheet, ArrowUp, ArrowDown, FolderPlus, Plus } from "lucide-react";
import { toast } from "sonner";
import { ArchiveMonthCard, type ArchiveFolder } from "@/components/archive/archive-month-card";
import { useViolations, DASHBOARD_VIOLATIONS_QUERY_KEY } from "@/hooks/use-violations";
import { useSignedUrls } from "@/hooks/use-signed-urls";
import { exportToExcel, exportToPdf } from "@/lib/export-utils";
import type { ColumnDefinition } from "@/types";

type SortKey = "date" | "code" | "severity" | null;
type SortDir = "asc" | "desc";

const SEVERITY_RANK: Record<string, number> = { منخفض: 1, متوسط: 2, عالي: 3, حرج: 4 };

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

export const Route = createFileRoute("/_authenticated/archive")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "الأرشيف — تطبيق تسجيل مخالفات العاملين" },
      { name: "description", content: "أرشيف شهري لتقارير العمال المخالفين مع البحث والفرز والتصفية والتصدير إلى Excel وPDF." },
      { property: "og:title", content: "الأرشيف — تطبيق تسجيل مخالفات العاملين" },
      { property: "og:description", content: "أرشيف شهري لتقارير العمال المخالفين مع البحث والفرز والتصفية والتصدير إلى Excel وPDF." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ArchivePage,
});

const MONTH_AR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const PAGE_SIZE = 20;

const matches = (v: any, q: string) => {
  if (!q) return true;
  const s = q.trim().toLowerCase();
  const fields = [
    v.employees?.name || v.employee_name || "",
    v.employees?.code || v.employee_code || "",
    v.employees?.department || v.employee_department || "",
    v.production_section || "",
  ];
  return fields.some((f) => String(f).toLowerCase().includes(s));
};

function ArchivePage() {
  const currentYear = new Date().getFullYear();
  const [drill, setDrill] = useState<{ title: string; rows: any[] } | null>(null);
  const [q, setQ] = useState("");
  const [monthSel, setMonthSel] = useState("all");
  const [yearSel, setYearSel] = useState("all");

  // Custom added month folders
  const [customFolders, setCustomFolders] = useState<string[]>([]);
  const [newMonthSel, setNewMonthSel] = useState("9");
  const [newYearSel, setNewYearSel] = useState(String(currentYear));
  const [addFolderOpen, setAddFolderOpen] = useState(false);

  // Filters inside month folder
  const [dq, setDq] = useState("");
  const [dDept, setDDept] = useState("all");
  const [dType, setDType] = useState("all");
  const [dFrom, setDFrom] = useState("");
  const [dTo, setDTo] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);

  // Hooks
  const { data: violations = [] } = useViolations(DASHBOARD_VIOLATIONS_QUERY_KEY);

  const searched = useMemo(() => (violations as any[]).filter((v) => matches(v, q)), [violations, q]);

  const years = useMemo(() => {
    const s = new Set<string>();
    s.add(String(currentYear));
    (violations as any[]).forEach((v) => {
      const d = String(v.violation_date || "");
      if (d.length >= 4) s.add(d.slice(0, 4));
    });
    return Array.from(s).sort().reverse();
  }, [violations, currentYear]);

  const archive = useMemo(() => {
    const map: Record<string, { key: string; year: number; month: number; rows: any[] }> = {};
    const activeYear = yearSel !== "all" ? Number(yearSel) : currentYear;

    // Pre-populate all 12 months for active year to allow September and any month display
    for (let m = 1; m <= 12; m++) {
      if (monthSel === "all" || monthSel === String(m)) {
        const key = `${activeYear}-${String(m).padStart(2, "0")}`;
        map[key] = { key, year: activeYear, month: m, rows: [] };
      }
    }

    // Populate rows from violations
    searched.forEach((v: any) => {
      const d = String(v.violation_date || "");
      if (d.length < 7) return;
      const y = Number(d.slice(0, 4));
      const m = Number(d.slice(5, 7));
      if (yearSel !== "all" && String(y) !== yearSel) return;
      if (monthSel !== "all" && m !== Number(monthSel)) return;
      const key = `${y}-${String(m).padStart(2, "0")}`;
      if (!map[key]) map[key] = { key, year: y, month: m, rows: [] };
      map[key].rows.push(v);
    });

    // Always include months with rows + custom user added months
    return Object.values(map)
      .filter((f) => f.rows.length > 0 || customFolders.includes(f.key))
      .sort((a, b) => (a.key < b.key ? 1 : -1))
      .map((f): ArchiveFolder => {
        const emps: Record<string, number> = {};
        const types: Record<string, number> = {};
        f.rows.forEach((v: any) => {
          const n = v.employees?.name || v.employee_name || "غير محدد";
          const t = v.violation_types?.name || "غير محدد";
          emps[n] = (emps[n] || 0) + 1;
          types[t] = (types[t] || 0) + 1;
        });
        const topEmpEntry = Object.entries(emps).sort((a, b) => b[1] - a[1])[0];
        const topTypeE = Object.entries(types).sort((a, b) => b[1] - a[1])[0];
        return {
          ...f,
          label: `${MONTH_AR[f.month - 1]}/${f.year}`,
          employeesCount: Object.keys(emps).length,
          topEmp: topEmpEntry ? `${topEmpEntry[0]} (${topEmpEntry[1]})` : "—",
          topType: topTypeE ? `${topTypeE[0]} (${topTypeE[1]})` : "—",
        };
      });
  }, [searched, monthSel, yearSel, customFolders, currentYear]);

  const handleAddFolder = () => {
    const key = `${newYearSel}-${String(newMonthSel).padStart(2, "0")}`;
    if (!customFolders.includes(key)) {
      setCustomFolders((prev) => [...prev, key]);
    }
    toast.success(`تمت إضافة مجلد شهر ${MONTH_AR[Number(newMonthSel) - 1]} ${newYearSel}`);
    setAddFolderOpen(false);
  };

  const openFolder = (title: string, rows: any[]) => {
    setDq("");
    setDDept("all");
    setDType("all");
    setDFrom("");
    setDTo("");
    setSortKey("date");
    setSortDir("desc");
    setPage(1);
    setDrill({ title, rows });
  };

  const drillDepts = useMemo(() => {
    const s = new Set<string>();
    (drill?.rows || []).forEach((v: any) => {
      const d = v.employees?.department || v.employee_department;
      if (d) s.add(d);
    });
    return Array.from(s).sort();
  }, [drill]);

  const drillTypes = useMemo(() => {
    const s = new Set<string>();
    (drill?.rows || []).forEach((v: any) => {
      const t = v.violation_types?.name;
      if (t) s.add(t);
    });
    return Array.from(s).sort();
  }, [drill]);

  const drillRows = useMemo(() => {
    let rows = (drill?.rows || []).filter((v: any) => {
      if (!matches(v, dq)) return false;
      const dept = v.employees?.department || v.employee_department || "";
      if (dDept !== "all" && dept !== dDept) return false;
      if (dType !== "all" && (v.violation_types?.name || "") !== dType) return false;
      const d = String(v.violation_date || "");
      if (dFrom && d < dFrom) return false;
      if (dTo && d > dTo) return false;
      return true;
    });
    if (sortKey) {
      rows = [...rows].sort((a: any, b: any) => {
        let x = 0;
        if (sortKey === "date") x = String(a.violation_date || "").localeCompare(String(b.violation_date || ""));
        else if (sortKey === "code")
          x = String(a.employees?.code || a.employee_code || "").localeCompare(
            String(b.employees?.code || b.employee_code || ""),
            "ar",
            { numeric: true },
          );
        else x = (SEVERITY_RANK[a.severity] || 0) - (SEVERITY_RANK[b.severity] || 0);
        return sortDir === "asc" ? x : -x;
      });
    }
    return rows;
  }, [drill, dq, dDept, dType, dFrom, dTo, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(drillRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pagedRows = drillRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const { signedUrls, ensureSignedUrls } = useSignedUrls(pagedRows.map((v: any) => v.image_url));

  useEffect(() => {
    setPage(1);
  }, [dq, dDept, dType, dFrom, dTo, sortKey, sortDir]);

  const toggleSort = (k: Exclude<SortKey, null>) => {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setSortDir("asc");
    }
  };

  const handleExportExcel = async (label: string, rows: any[]) => {
    const urls = await ensureSignedUrls(rows.map((v: any) => v.image_url));
    await exportToExcel(
      `أرشيف-${label.replace("/", "-")}`,
      "الأرشيف",
      COLUMNS,
      rows,
      [{ header: "رابط الصورة", getValue: (v) => urls[v.image_url] || "" }],
    );
  };

  const handleExportPdf = async (label: string, rows: any[]) => {
    const urls = await ensureSignedUrls(rows.map((v: any) => v.image_url));
    exportToPdf(
      `أرشيف المخالفات — ${label}`,
      `عدد السجلات: ${rows.length}`,
      COLUMNS,
      rows,
      { getImageUrl: (v) => urls[v.image_url] },
    );
  };

  const handleExportBoth = async (label: string, rows: any[]) => {
    await handleExportExcel(label, rows);
    await handleExportPdf(label, rows);
  };

  return (
    <div className="p-4 md:p-6 space-y-6" dir="rtl">
      <PageHeader
        title="الأرشيف"
        subtitle="مجلدات شهرية لتقارير العمال المخالفين"
        actions={
          <Dialog open={addFolderOpen} onOpenChange={setAddFolderOpen}>
            <DialogTrigger asChild>
              <Button>
                <FolderPlus className="w-4 h-4 ml-1" /> إضافة مجلد شهر
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إضافة مجلد شهر للأرشيف</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>الشهر</Label>
                  <Select value={newMonthSel} onValueChange={setNewMonthSel}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MONTH_AR.map((m, i) => (
                        <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>السنة</Label>
                  <Select value={newYearSel} onValueChange={setNewYearSel}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {years.map((y) => (
                        <SelectItem key={y} value={y}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddFolder}>
                  <Plus className="w-4 h-4 ml-1" /> إضافة المجلد
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <Card>
        <CardContent className="pt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <Label className="text-xs">بحث سريع (الاسم / الكود / القسم)</Label>
            <div className="relative mt-1">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="اكتب الاسم أو الكود أو القسم" className="pr-9" />
            </div>
          </div>
          <div>
            <Label className="text-xs">الشهر</Label>
            <Select value={monthSel} onValueChange={setMonthSel}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الشهور</SelectItem>
                {MONTH_AR.map((m, i) => (
                  <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">السنة</Label>
            <Select value={yearSel} onValueChange={setYearSel}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل السنوات</SelectItem>
                {years.map((y) => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">المجلدات الشهرية</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">اضغط على المجلد لعرض محتواه أو تصديره</p>
        </CardHeader>
        <CardContent>
          {archive.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">لا توجد سجلات مؤرشفة</div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {archive.map((f) => (
                <ArchiveMonthCard
                  key={f.key}
                  folder={f}
                  onOpenFolder={() => openFolder(`أرشيف ${f.label}`, f.rows)}
                  onExportBoth={() => handleExportBoth(f.label, f.rows)}
                  onExportExcel={() => handleExportExcel(f.label, f.rows)}
                  onExportPdf={() => handleExportPdf(f.label, f.rows)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {drill && (
        <Card dir="rtl">
          <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
            <div className="min-w-0">
              <CardTitle className="text-base truncate">{drill.title}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                تقرير مفصّل بمخالفات هذا الشهر بالصور ({drillRows.length} من {drill.rows.length} سجل)
              </p>
            </div>
            <Button size="sm" variant="ghost" className="shrink-0" onClick={() => setDrill(null)}>
              إغلاق
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Filters inside month */}
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              <div className="sm:col-span-2">
                <Label className="text-xs">بحث داخل الشهر</Label>
                <div className="relative mt-1">
                  <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input value={dq} onChange={(e) => setDq(e.target.value)} placeholder="الاسم أو الكود أو القسم" className="pr-9" />
                </div>
              </div>
              <div>
                <Label className="text-xs">القسم</Label>
                <Select value={dDept} onValueChange={setDDept}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الأقسام</SelectItem>
                    {drillDepts.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">نوع المخالفة</Label>
                <Select value={dType} onValueChange={setDType}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الأنواع</SelectItem>
                    {drillTypes.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">من</Label>
                  <Input type="date" className="mt-1" value={dFrom} onChange={(e) => setDFrom(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">إلى</Label>
                  <Input type="date" className="mt-1" value={dTo} onChange={(e) => setDTo(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="overflow-auto rounded-md border max-h-[70vh]">
              {/* Desktop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {COLUMNS.map((c) => (
                        <TableHead key={c.header} className="text-right whitespace-nowrap text-[13px]">
                          {c.sortKey ? (
                            <button className="inline-flex items-center gap-1 hover:text-primary" onClick={() => toggleSort(c.sortKey as SortKey)}>
                              {c.header}
                              {sortKey === c.sortKey ? (
                                sortDir === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                              ) : null}
                            </button>
                          ) : (
                            c.header
                          )}
                        </TableHead>
                      ))}
                      <TableHead className="text-right whitespace-nowrap text-[13px]">الصورة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={COLUMNS.length + 1} className="text-center text-muted-foreground py-8">
                          لا توجد بيانات
                        </TableCell>
                      </TableRow>
                    ) : (
                      pagedRows.map((v: any) => (
                        <TableRow key={v.id}>
                          {COLUMNS.map((c) => {
                            const val = c.value(v);
                            if (c.header === "الحالة") {
                              return (
                                <TableCell key={c.header}>
                                  <Badge variant={val === "مغلقة" ? "secondary" : "default"}>{val || "—"}</Badge>
                                </TableCell>
                              );
                            }
                            return (
                              <TableCell
                                key={c.header}
                                className={`text-[13px] whitespace-nowrap ${c.header === "الكود" ? "font-mono" : ""} ${
                                  c.header === "الاسم" ? "font-medium" : ""
                                }`}
                              >
                                {val || "—"}
                              </TableCell>
                            );
                          })}
                          <TableCell>
                            {v.image_url && signedUrls[v.image_url] ? (
                              <a href={signedUrls[v.image_url]} target="_blank" rel="noreferrer">
                                <img
                                  src={signedUrls[v.image_url]}
                                  alt={`صورة مخالفة ${v.employees?.name || v.employee_name || ""}`}
                                  className="w-14 h-14 object-cover rounded border"
                                  loading="lazy"
                                />
                              </a>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y">
                {pagedRows.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">لا توجد بيانات</div>
                ) : (
                  pagedRows.map((v: any) => (
                    <div key={v.id} className="p-3 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-semibold text-sm truncate">{COLUMNS[1].value(v) || "—"}</div>
                          <div className="text-xs text-muted-foreground font-mono">{COLUMNS[2].value(v) || "—"}</div>
                        </div>
                        {v.image_url && signedUrls[v.image_url] ? (
                          <a href={signedUrls[v.image_url]} target="_blank" rel="noreferrer" className="shrink-0">
                            <img
                              src={signedUrls[v.image_url]}
                              alt={`صورة مخالفة ${COLUMNS[1].value(v)}`}
                              className="w-12 h-12 object-cover rounded border"
                              loading="lazy"
                            />
                          </a>
                        ) : null}
                      </div>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                        {COLUMNS.filter((c) => !["الاسم", "الكود", "الحالة"].includes(c.header)).map((c) => (
                          <div key={c.header} className="min-w-0">
                            <span className="text-muted-foreground">{c.header}: </span>
                            <span className="break-words">{c.value(v) || "—"}</span>
                          </div>
                        ))}
                      </div>
                      <Badge variant={v.status === "مغلقة" ? "secondary" : "default"}>{v.status || "—"}</Badge>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Pagination & Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <div className="text-xs text-muted-foreground">
                صفحة {currentPage} من {pageCount} — {drillRows.length} سجل
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>
                  السابق
                </Button>
                <Button size="sm" variant="outline" disabled={currentPage >= pageCount} onClick={() => setPage(currentPage + 1)}>
                  التالي
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => drill && handleExportExcel(`${drill.title.replace("أرشيف ", "")} - المعروض`, pagedRows)}
                >
                  <FileSpreadsheet className="w-4 h-4 ml-1" /> Excel (المعروض)
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => drill && handleExportPdf(`${drill.title.replace("أرشيف ", "")} - المعروض`, pagedRows)}
                >
                  <FileText className="w-4 h-4 ml-1" /> PDF (المعروض)
                </Button>
                <Button size="sm" variant="ghost" onClick={() => drill && handleExportExcel(drill.title.replace("أرشيف ", ""), drillRows)}>
                  <FileSpreadsheet className="w-4 h-4 ml-1" /> Excel (الكل)
                </Button>
                <Button size="sm" variant="ghost" onClick={() => drill && handleExportPdf(drill.title.replace("أرشيف ", ""), drillRows)}>
                  <FileText className="w-4 h-4 ml-1" /> PDF (الكل)
                </Button>
                <Button size="sm" onClick={() => drill && handleExportBoth(drill.title.replace("أرشيف ", ""), drillRows)}>
                  <FileDown className="w-4 h-4 ml-1" /> Excel + PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
