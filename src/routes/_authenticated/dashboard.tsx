/**
 * Dashboard Route Component
 */

import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, Users, TrendingUp, UserCheck } from "lucide-react";
import { DashboardFilterBar } from "@/components/dashboard/dashboard-filter-bar";
import { DashboardKpiSummary, type KpiItem } from "@/components/dashboard/dashboard-kpi-summary";
import { DashboardPeriodSummary, type PeriodOption } from "@/components/dashboard/dashboard-period-summary";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { useViolations, DASHBOARD_VIOLATIONS_QUERY_KEY } from "@/hooks/use-violations";
import { useMinimalEmployees } from "@/hooks/use-employees";
import { violationTypesService } from "@/services/api/violation-types-service";
import { productionSectionsService } from "@/services/api/production-sections-service";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

const MONTH_AR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

const PERIODS: PeriodOption[] = [
  { days: 1, label: "آخر يوم" },
  { days: 7, label: "آخر أسبوع" },
  { days: 30, label: "آخر شهر" },
  { days: 90, label: "آخر 3 أشهر" },
  { days: 180, label: "آخر 6 أشهر" },
  { days: 365, label: "آخر سنة" },
];

function Dashboard() {
  const [nameQ, setNameQ] = useState("");
  const [codeQ, setCodeQ] = useState("");
  const [deptQ, setDeptQ] = useState("");
  const [typeQ, setTypeQ] = useState("");
  const [prodSectionQ, setProdSectionQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [drill, setDrill] = useState<{ title: string; rows: any[] } | null>(null);
  const [periodDays, setPeriodDays] = useState("30");

  // Queries
  const { data: violations = [] } = useViolations(DASHBOARD_VIOLATIONS_QUERY_KEY);
  const { data: employees = [] } = useMinimalEmployees();

  const { data: types = [] } = useQuery({
    queryKey: ["violation-types"],
    queryFn: () => violationTypesService.getViolationTypes(),
  });

  const { data: prodSections = [] } = useQuery({
    queryKey: ["production-sections"],
    queryFn: () => productionSectionsService.getProductionSections(),
  });

  // Auto-lookup employee from code or name
  const matchedEmployee = useMemo(() => {
    if (codeQ.trim()) {
      const e = employees.find((x: any) => (x.code || "").toLowerCase() === codeQ.trim().toLowerCase());
      if (e) return e;
    }
    if (nameQ.trim()) {
      const e = employees.find((x: any) => (x.name || "").toLowerCase() === nameQ.trim().toLowerCase());
      if (e) return e;
    }
    return null;
  }, [codeQ, nameQ, employees]);

  const departments = useMemo(() => {
    const s = new Set<string>();
    employees.forEach((e: any) => { if (e.department) s.add(e.department); });
    violations.forEach((v: any) => {
      const d = v.employees?.department || v.employee_department;
      if (d) s.add(d);
    });
    return Array.from(s);
  }, [violations, employees]);

  const filtered = useMemo(() => {
    return violations.filter((v: any) => {
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
  }, [violations, nameQ, codeQ, deptQ, typeQ, prodSectionQ, from, to]);

  const total = filtered.length;

  const byEmployee: Record<string, number> = {};
  const byDept: Record<string, number> = {};
  const byType: Record<string, number> = {};
  const empMeta: Record<string, { name: string; department: string; total: number; types: Record<string, number> }> = {};

  filtered.forEach((v: any) => {
    const ename = v.employees?.name || v.employee_name || "غير محدد";
    const edept = v.employees?.department || v.employee_department || "—";
    byEmployee[ename] = (byEmployee[ename] || 0) + 1;
    byDept[edept] = (byDept[edept] || 0) + 1;
    const t = v.violation_types?.name || "غير محدد";
    byType[t] = (byType[t] || 0) + 1;

    if (!empMeta[ename]) empMeta[ename] = { name: ename, department: edept, total: 0, types: {} };
    empMeta[ename].total += 1;
    empMeta[ename].types[t] = (empMeta[ename].types[t] || 0) + 1;
  });

  const topDept = Object.entries(byDept).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
  const typeData = Object.entries(byType).map(([name, value]) => ({ name, value }));

  // Violations over time continuous timeline
  const monthData = useMemo(() => {
    const buckets: Record<string, number> = {};
    filtered.forEach((v: any) => {
      const d = v.violation_date;
      if (!d) return;
      const key = String(d).slice(0, 7);
      if (!/^\d{4}-\d{2}$/.test(key)) return;
      buckets[key] = (buckets[key] || 0) + 1;
    });
    const keys = Object.keys(buckets).sort();
    if (keys.length === 0) return [];
    const [minY, minM] = keys[0].split("-").map(Number);
    const [maxY, maxM] = keys[keys.length - 1].split("-").map(Number);
    const out: { name: string; value: number; key: string }[] = [];
    let y = minY, m = minM;
    while (y < maxY || (y === maxY && m <= maxM)) {
      const key = `${y}-${String(m).padStart(2, "0")}`;
      out.push({ key, name: `${MONTH_AR[m - 1]} ${y}`, value: buckets[key] || 0 });
      m += 1;
      if (m > 12) { m = 1; y += 1; }
    }
    return out;
  }, [filtered]);

  // Top 5 employees stacked bar
  const topEmpList = Object.values(empMeta).sort((a, b) => b.total - a.total).slice(0, 5);
  const topTypeKeys = Array.from(new Set(topEmpList.flatMap((e) => Object.keys(e.types))));
  const topEmpData = topEmpList.map((e) => {
    const row: any = { name: e.name, department: e.department, label: `${e.name} — ${e.department}`, total: e.total };
    topTypeKeys.forEach((tk) => { row[tk] = e.types[tk] || 0; });
    return row;
  });
  const topEmp = topEmpList[0]?.name || "—";
  const topEmpCount = topEmpList[0]?.total || 0;
  const topEmpDept = topEmpList[0]?.department || "—";

  const topTypeEntry = Object.entries(byType).sort((a, b) => b[1] - a[1])[0];
  const topDeptEntry = Object.entries(byDept).sort((a, b) => b[1] - a[1])[0];

  const nameOf = (v: any) => v.employees?.name || v.employee_name || "غير محدد";
  const deptOf = (v: any) => v.employees?.department || v.employee_department || "—";
  const typeOf = (v: any) => v.violation_types?.name || "غير محدد";

  const kpis: KpiItem[] = [
    {
      label: "إجمالي المخالفات",
      value: String(total),
      detail: "كل السجلات ضمن الفلاتر الحالية",
      count: total,
      icon: AlertTriangle, color: "text-primary", bg: "bg-primary/10",
      rows: filtered,
    },
    {
      label: "أكثر عامل مخالف",
      value: topEmp,
      detail: topEmpDept !== "—" ? `القسم: ${topEmpDept}` : "—",
      count: topEmpCount,
      icon: UserCheck, color: "text-sky-600", bg: "bg-sky-50",
      rows: filtered.filter((v: any) => nameOf(v) === topEmp),
    },
    {
      label: "أكثر قسم به مخالفات",
      value: topDeptEntry?.[0] || topDept,
      detail: "إجمالي مخالفات القسم",
      count: topDeptEntry?.[1] || 0,
      icon: Users, color: "text-amber-600", bg: "bg-amber-50",
      rows: filtered.filter((v: any) => deptOf(v) === (topDeptEntry?.[0] || topDept)),
    },
    {
      label: "أكثر مخالفة متكررة",
      value: topTypeEntry?.[0] || "—",
      detail: "عدد مرات التكرار",
      count: topTypeEntry?.[1] || 0,
      icon: TrendingUp, color: "text-rose-600", bg: "bg-rose-50",
      rows: filtered.filter((v: any) => typeOf(v) === topTypeEntry?.[0]),
    },
  ];

  const openDrill = (title: string, rows: any[]) => setDrill({ title, rows });

  const periodStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - (Number(periodDays) - 1));
    return d.toISOString().slice(0, 10);
  }, [periodDays]);

  const periodRows = useMemo(
    () => violations.filter((v: any) => (v.violation_date || "") >= periodStart),
    [violations, periodStart],
  );

  const rank = (list: any[], key: (v: any) => string) => {
    const acc: Record<string, number> = {};
    list.forEach((v) => {
      const k = key(v);
      if (!k) return;
      acc[k] = (acc[k] || 0) + 1;
    });
    return Object.entries(acc).sort((a, b) => b[1] - a[1]) as [string, number][];
  };

  const periodTypeList = useMemo(() => rank(periodRows, (v) => v.violation_types?.name || ""), [periodRows]);
  const periodEmpList = useMemo(
    () => rank(periodRows, (v) => v.employees?.name || v.employee_name || ""),
    [periodRows],
  );

  const clearFilters = () => {
    setNameQ(""); setCodeQ(""); setDeptQ(""); setTypeQ(""); setProdSectionQ(""); setFrom(""); setTo("");
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader title="لوحة التحكم" subtitle="نظرة شاملة على المخالفات والإحصائيات" />

      <DashboardFilterBar
        nameQ={nameQ}
        setNameQ={setNameQ}
        codeQ={codeQ}
        setCodeQ={setCodeQ}
        deptQ={deptQ}
        setDeptQ={setDeptQ}
        typeQ={typeQ}
        setTypeQ={setTypeQ}
        prodSectionQ={prodSectionQ}
        setProdSectionQ={setProdSectionQ}
        from={from}
        setFrom={setFrom}
        to={to}
        setTo={setTo}
        departments={departments}
        types={types}
        prodSections={prodSections}
        matchedEmployee={matchedEmployee}
        onClearFilters={clearFilters}
      />

      <DashboardKpiSummary kpis={kpis} onOpenDrill={openDrill} />

      <DashboardPeriodSummary
        periods={PERIODS}
        periodDays={periodDays}
        setPeriodDays={setPeriodDays}
        periodStart={periodStart}
        periodRowCount={periodRows.length}
        topPeriodType={periodTypeList[0]}
        periodTypeList={periodTypeList}
        topPeriodEmp={periodEmpList[0]}
        periodEmpList={periodEmpList}
      />

      <DashboardCharts
        monthData={monthData}
        typeData={typeData}
        topEmpData={topEmpData}
        topTypeKeys={topTypeKeys}
        topEmp={topEmp}
      />

      <Dialog open={!!drill} onOpenChange={(o) => !o && setDrill(null)}>
        <DialogContent className="w-[calc(100vw-1rem)] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base leading-relaxed">{drill?.title}</DialogTitle>
          </DialogHeader>
          <div className="text-xs text-muted-foreground">{drill?.rows.length || 0} سجل</div>
          <div className="space-y-2">
            {(drill?.rows || []).length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">لا توجد سجلات</div>
            ) : (
              (drill?.rows || []).map((v: any) => (
                <div key={v.id} className="rounded-lg border p-3 text-sm space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold min-w-0 break-words">{nameOf(v)}</span>
                    <span className="text-xs text-muted-foreground shrink-0">{v.violation_date}</span>
                  </div>
                  <div className="text-xs text-muted-foreground break-words">
                    الكود: {v.employees?.code || v.employee_code || "—"} • القسم: {deptOf(v)}
                    {v.production_section ? ` • القسم الإنتاجي: ${v.production_section}` : ""}
                  </div>
                  <div className="text-xs break-words">
                    النوع: <span className="font-medium">{typeOf(v)}</span> • الخطورة: {v.severity}
                  </div>
                  {v.notes && <div className="text-xs text-muted-foreground break-words">ملاحظات: {v.notes}</div>}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
