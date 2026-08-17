/**
 * SectionViolations Route Component
 */

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Search,
  SearchX,
  X,
  ChevronRight,
  ImageOff,
  ArrowUp,
  ArrowDown,
  ChevronsUpDown,
  FileSpreadsheet,
  FileText,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { SectionFolderCard } from "@/components/section-violations/section-folder-card";
import { useViolations, SECTION_VIOLATIONS_QUERY_KEY } from "@/hooks/use-violations";
import { useSignedUrls } from "@/hooks/use-signed-urls";
import { exportToExcel, exportToPdf, downloadFileBlob } from "@/lib/export-utils";
import { normalizeArabicText } from "@/lib/string-utils";
import type { ColumnDefinition } from "@/types";

export const Route = createFileRoute("/_authenticated/section-violations")({
  component: SectionViolations,
});

const UNASSIGNED = "بدون قسم إنتاجي";

const nameOf = (v: any) => v.employees?.name || v.employee_name || "غير محدد";
const codeOf = (v: any) => v.employees?.code || v.employee_code || "—";
const deptOf = (v: any) => v.employees?.department || v.employee_department || "—";
const jobOf = (v: any) => v.employees?.job_title || v.employee_job_title || "—";
const typeOf = (v: any) => v.violation_types?.name || "غير محدد";

const COLUMNS: ColumnDefinition[] = [
  { header: "الاسم", value: nameOf },
  { header: "الكود", value: codeOf },
  { header: "المسمى الوظيفي", value: jobOf },
  { header: "القسم", value: deptOf },
  { header: "القسم الإنتاجي", value: (v) => v.production_section || UNASSIGNED },
  { header: "نوع المخالفة", value: typeOf },
  { header: "الخطورة", value: (v) => v.severity || "—" },
  { header: "التاريخ", value: (v) => v.violation_date || "—" },
  { header: "ملاحظات", value: (v) => v.notes || "—" },
];

type SortKey = "name" | "code" | "job" | "dept" | "type" | "severity" | "date";

const PAGE_SIZE = 20;
const ALL = "__all__";

function SectionViolations() {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [showSug, setShowSug] = useState(false);
  const [fType, setFType] = useState<string>(ALL);
  const [fSeverity, setFSeverity] = useState<string>(ALL);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [downloading, setDownloading] = useState(false);
  const [preview, setPreview] = useState<{ url: string; title: string; row: any } | null>(null);

  const searchWrap = useRef<HTMLDivElement>(null);

  // Queries & Hooks
  const { data: violations = [] } = useViolations(SECTION_VIOLATIONS_QUERY_KEY);

  const groups = useMemo(() => {
    const map: Record<string, any[]> = {};
    violations.forEach((v: any) => {
      const s = (v.production_section || "").trim() || UNASSIGNED;
      (map[s] ||= []).push(v);
    });
    return Object.entries(map)
      .map(([section, rows]) => ({
        section,
        rows,
        employees: new Set(rows.map((r: any) => nameOf(r))).size,
        topType:
          Object.entries(
            rows.reduce((acc: Record<string, number>, r: any) => {
              const t = typeOf(r);
              acc[t] = (acc[t] || 0) + 1;
              return acc;
            }, {}),
          ).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || "—",
      }))
      .sort((a, b) => b.rows.length - a.rows.length);
  }, [violations]);

  const current = groups.find((g) => g.section === openSection) || null;

  const typeOptions = useMemo(
    () => Array.from(new Set((current?.rows || []).map((v: any) => typeOf(v)))).sort((a, b) => a.localeCompare(b, "ar")),
    [current],
  );
  const severityOptions = useMemo(
    () => Array.from(new Set((current?.rows || []).map((v: any) => v.severity).filter(Boolean))),
    [current],
  );

  const suggestions = useMemo(() => {
    const s = normalizeArabicText(q);
    if (!current || s.length < 1) return [] as { label: string; kind: string }[];
    const seen = new Set<string>();
    const out: { label: string; kind: string }[] = [];
    for (const v of current.rows) {
      for (const [label, kind] of [
        [nameOf(v), "اسم"],
        [codeOf(v), "كود"],
        [typeOf(v), "مخالفة"],
      ] as [string, string][]) {
        if (!label || label === "—") continue;
        const key = `${kind}:${label}`;
        if (seen.has(key)) continue;
        if (normalizeArabicText(label).includes(s)) {
          seen.add(key);
          out.push({ label, kind });
        }
      }
      if (out.length > 40) break;
    }
    return out.slice(0, 8);
  }, [current, q]);

  const filtered = useMemo(() => {
    if (!current) return [];
    const terms = normalizeArabicText(q).split(" ").filter(Boolean);
    return current.rows.filter((v: any) => {
      if (fType !== ALL && typeOf(v) !== fType) return false;
      if (fSeverity !== ALL && v.severity !== fSeverity) return false;
      const d = v.violation_date || "";
      if (from && d < from) return false;
      if (to && d > to) return false;
      if (!terms.length) return true;
      const hay = normalizeArabicText([nameOf(v), codeOf(v), typeOf(v), deptOf(v), jobOf(v), v.notes || ""].join(" "));
      return terms.every((t) => hay.includes(t));
    });
  }, [current, q, fType, fSeverity, from, to]);

  const sorted = useMemo(() => {
    const getVal = (v: any) => {
      switch (sortKey) {
        case "name": return nameOf(v);
        case "code": return codeOf(v);
        case "job": return jobOf(v);
        case "dept": return deptOf(v);
        case "type": return typeOf(v);
        case "severity": return v.severity || "";
        default: return v.violation_date || "";
      }
    };
    return [...filtered].sort((a, b) => {
      const r = String(getVal(a)).localeCompare(String(getVal(b)), "ar", { numeric: true });
      return sortDir === "asc" ? r : -r;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const rows = useMemo(
    () => sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [sorted, currentPage],
  );

  const { signedUrls, ensureSignedUrls } = useSignedUrls(rows.map((r: any) => r.image_url));

  useEffect(() => {
    setPage(1);
  }, [openSection, q, fType, fSeverity, from, to, sortKey, sortDir]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (searchWrap.current && !searchWrap.current.contains(e.target as Node)) setShowSug(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const clearFilters = () => {
    setQ("");
    setFType(ALL);
    setFSeverity(ALL);
    setFrom("");
    setTo("");
    setPage(1);
  };

  const toggleSort = (k: SortKey) => {
    if (k === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setSortDir("asc");
    }
  };

  const SortHead = ({ k, label }: { k: SortKey; label: string }) => (
    <th className="p-2 font-semibold">
      <button
        type="button"
        onClick={() => toggleSort(k)}
        className="inline-flex items-center gap-1 hover:text-primary transition"
      >
        {label}
        {sortKey === k ? (
          sortDir === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
        ) : (
          <ChevronsUpDown className="w-3 h-3 opacity-40" />
        )}
      </button>
    </th>
  );

  const downloadImage = async (v: any) => {
    const url = signedUrls[v.image_url];
    if (!url) return;
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const ext = (v.image_url.split(".").pop() || "jpg").split("?")[0];
      downloadFileBlob(blob, `${nameOf(v)}-${codeOf(v)}-${v.violation_date || ""}.${ext}`);
    } catch {
      toast.error("تعذر تحميل الصورة");
    }
  };

  const downloadAllImages = async (list: any[]) => {
    const withImg = list.filter((v: any) => v.image_url);
    if (!withImg.length) return toast.info("لا توجد صور في النتائج الحالية");
    setDownloading(true);
    try {
      const urls = await ensureSignedUrls(withImg.map((v: any) => v.image_url));
      for (const v of withImg) {
        const url = urls[v.image_url];
        if (!url) continue;
        const res = await fetch(url);
        const blob = await res.blob();
        const ext = (v.image_url.split(".").pop() || "jpg").split("?")[0];
        downloadFileBlob(blob, `${nameOf(v)}-${codeOf(v)}-${v.violation_date || ""}.${ext}`);
        await new Promise((r) => setTimeout(r, 250));
      }
      toast.success(`تم تحميل ${withImg.length} صورة`);
    } catch {
      toast.error("تعذر تحميل بعض الصور");
    } finally {
      setDownloading(false);
    }
  };

  const handleExportExcel = async (label: string, list: any[]) => {
    await exportToExcel(
      `مخالفات-${label.replace(/[\\/]/g, "-")}`,
      "مخالفات القسم",
      COLUMNS,
      list,
      [{ header: "يوجد صورة", getValue: (v) => (v.image_url ? "نعم" : "لا") }],
    );
  };

  const handleExportPdf = async (label: string, list: any[]) => {
    const urls = await ensureSignedUrls(list.map((v: any) => v.image_url));
    exportToPdf(
      `مخالفات العمال بالقسم — ${label}`,
      `عدد السجلات: ${list.length}`,
      COLUMNS,
      list,
      {
        getImageUrl: (v) => urls[v.image_url],
        imageHeaderPosition: "first",
      },
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-5" dir="rtl">
      <PageHeader
        title="مخالفات العمال بالقسم"
        subtitle="مجلدات الأقسام الإنتاجية — افتح القسم لعرض مخالفات عماله"
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {groups.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground col-span-full">لا توجد بيانات</div>
        ) : (
          groups.map((g) => (
            <SectionFolderCard
              key={g.section}
              group={g}
              isActive={openSection === g.section}
              onToggle={() => {
                setOpenSection(openSection === g.section ? null : g.section);
                clearFilters();
              }}
              onExportExcel={() => handleExportExcel(g.section, g.rows)}
              onExportPdf={() => handleExportPdf(g.section, g.rows)}
            />
          ))
        )}
      </div>

      {current && (
        <Card>
          <CardHeader className="gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-base flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                {current.section}
                <span className="text-xs font-normal text-muted-foreground">({sorted.length} سجل)</span>
              </CardTitle>
              <div className="flex flex-wrap items-center gap-1">
                <Button size="sm" variant="outline" onClick={() => handleExportExcel(`${current.section}-النتائج`, sorted)}>
                  <FileSpreadsheet className="w-4 h-4 ml-1" /> Excel (كل النتائج)
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleExportPdf(`${current.section}-النتائج`, sorted)}>
                  <FileText className="w-4 h-4 ml-1" /> PDF (كل النتائج)
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleExportExcel(`${current.section}-صفحة-${currentPage}`, rows)}>
                  <FileSpreadsheet className="w-4 h-4 ml-1" /> Excel (الصفحة الحالية)
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleExportPdf(`${current.section}-صفحة-${currentPage}`, rows)}>
                  <FileText className="w-4 h-4 ml-1" /> PDF (الصفحة الحالية)
                </Button>

                <Button size="sm" variant="outline" disabled={downloading} onClick={() => downloadAllImages(sorted)}>
                  <Download className="w-4 h-4 ml-1" /> {downloading ? "جارٍ التحميل..." : "تحميل الصور"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setOpenSection(null)}>
                  إغلاق
                </Button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
              <div className="relative lg:col-span-2" ref={searchWrap}>
                <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setShowSug(true);
                  }}
                  onFocus={() => setShowSug(true)}
                  placeholder="ابحث بالاسم أو الكود أو المخالفة..."
                  className="pr-8"
                />
                {showSug && suggestions.length > 0 && (
                  <div className="absolute z-30 mt-1 w-full rounded-md border bg-popover shadow-md overflow-hidden">
                    {suggestions.map((s) => (
                      <button
                        key={`${s.kind}-${s.label}`}
                        type="button"
                        onClick={() => {
                          setQ(s.label);
                          setShowSug(false);
                        }}
                        className="w-full text-right px-3 py-2 text-sm hover:bg-accent flex items-center justify-between gap-2"
                      >
                        <span className="truncate">{s.label}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0">{s.kind}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">نوع المخالفة</Label>
                <Select value={fType} onValueChange={setFType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>الكل</SelectItem>
                    {typeOptions.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">الخطورة</Label>
                <Select value={fSeverity} onValueChange={setFSeverity}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>الكل</SelectItem>
                    {severityOptions.map((s: string) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">من تاريخ</Label>
                  <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">إلى تاريخ</Label>
                  <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="md:hidden flex flex-wrap items-center gap-2 text-xs">
              <span className="text-muted-foreground">ترتيب حسب:</span>
              {([
                ["date", "التاريخ"],
                ["name", "الاسم"],
                ["code", "الكود"],
                ["type", "النوع"],
                ["severity", "الخطورة"],
              ] as [SortKey, string][]).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => toggleSort(k)}
                  className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 ${
                    sortKey === k ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground"
                  }`}
                >
                  {label}
                  {sortKey === k &&
                    (sortDir === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {rows.length === 0 ? (
              <div className="py-12 flex flex-col items-center gap-3 text-center">
                <SearchX className="w-8 h-8 text-muted-foreground" />
                <div className="text-sm font-medium">لا توجد نتائج مطابقة للبحث أو الفلاتر</div>
                <div className="text-xs text-muted-foreground">
                  جرّب تعديل كلمات البحث أو مسح الفلاتر لعرض كل سجلات القسم ({current.rows.length} سجل)
                </div>
                <Button size="sm" variant="outline" onClick={clearFilters}>
                  <X className="w-4 h-4 ml-1" /> مسح الفلاتر
                </Button>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block max-h-[70vh] overflow-auto rounded-lg border">
                  <table className="w-full text-sm text-right">
                    <thead className="bg-muted/60 sticky top-0">
                      <tr>
                        <th className="p-2 font-semibold">الصورة</th>
                        <SortHead k="name" label="الاسم" />
                        <SortHead k="code" label="الكود" />
                        <SortHead k="job" label="المسمى الوظيفي" />
                        <SortHead k="dept" label="القسم" />
                        <SortHead k="type" label="نوع المخالفة" />
                        <SortHead k="severity" label="الخطورة" />
                        <SortHead k="date" label="التاريخ" />
                        <th className="p-2 font-semibold">ملاحظات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((v: any) => (
                        <tr key={v.id} className="border-t hover:bg-muted/30 align-top">
                          <td className="p-2">
                            {v.image_url && signedUrls[v.image_url] ? (
                              <div className="flex flex-col items-center gap-1">
                                <img
                                  src={signedUrls[v.image_url]}
                                  alt={`صورة مخالفة ${nameOf(v)}`}
                                  loading="lazy"
                                  onClick={() => setPreview({ url: signedUrls[v.image_url], title: `${nameOf(v)} — ${typeOf(v)}`, row: v })}
                                  className="w-12 h-12 object-cover rounded border cursor-zoom-in"
                                />
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6"
                                  title="تحميل الصورة"
                                  onClick={() => downloadImage(v)}
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            ) : (
                              <ImageOff className="w-4 h-4 text-muted-foreground" />
                            )}
                          </td>
                          <td className="p-2 font-medium">{nameOf(v)}</td>
                          <td className="p-2 font-mono text-xs">{codeOf(v)}</td>
                          <td className="p-2">{jobOf(v)}</td>
                          <td className="p-2">{deptOf(v)}</td>
                          <td className="p-2">{typeOf(v)}</td>
                          <td className="p-2">{v.severity}</td>
                          <td className="p-2 whitespace-nowrap">{v.violation_date}</td>
                          <td className="p-2 text-xs text-muted-foreground max-w-[16rem] break-words">{v.notes || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden space-y-2">
                  {rows.map((v: any) => (
                    <div key={v.id} className="rounded-lg border p-3 flex gap-3">
                      {v.image_url && signedUrls[v.image_url] ? (
                        <div className="shrink-0 flex flex-col items-center gap-1">
                          <img
                            src={signedUrls[v.image_url]}
                            alt={`صورة مخالفة ${nameOf(v)}`}
                            loading="lazy"
                            onClick={() => setPreview({ url: signedUrls[v.image_url], title: `${nameOf(v)} — ${typeOf(v)}`, row: v })}
                            className="w-14 h-14 object-cover rounded border cursor-zoom-in"
                          />
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => downloadImage(v)}>
                            <Download className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ) : null}
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-semibold text-sm break-words">{nameOf(v)}</span>
                          <span className="text-[11px] text-muted-foreground shrink-0">{v.violation_date}</span>
                        </div>
                        <div className="text-xs text-muted-foreground break-words">
                          الكود: {codeOf(v)} • القسم: {deptOf(v)}
                        </div>
                        <div className="text-xs break-words">
                          النوع: <span className="font-medium">{typeOf(v)}</span> • الخطورة: {v.severity}
                        </div>
                        {v.notes && <div className="text-xs text-muted-foreground break-words">{v.notes}</div>}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs text-muted-foreground">
                    صفحة {currentPage} من {totalPages} — {sorted.length} سجل
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={currentPage <= 1}
                      onClick={() => setPage(currentPage - 1)}
                    >
                      السابق
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={currentPage >= totalPages}
                      onClick={() => setPage(currentPage + 1)}
                    >
                      التالي
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-3xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-base">{preview?.title}</DialogTitle>
          </DialogHeader>
          {preview && (
            <div className="space-y-3">
              <img src={preview.url} alt={preview.title} className="w-full max-h-[70vh] object-contain rounded-md border" />
              <div className="flex justify-end">
                <Button size="sm" variant="outline" onClick={() => downloadImage(preview.row)}>
                  <Download className="w-4 h-4 ml-1" /> تحميل الصورة
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
