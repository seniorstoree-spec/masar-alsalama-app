/**
 * DashboardPeriodSummary Component
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface PeriodOption {
  days: number;
  label: string;
}

export interface DashboardPeriodSummaryProps {
  periods: PeriodOption[];
  periodDays: string;
  setPeriodDays: (val: string) => void;
  periodStart: string;
  periodRowCount: number;
  topPeriodType?: [string, number];
  periodTypeList: [string, number][];
  topPeriodEmp?: [string, number];
  periodEmpList: [string, number][];
}

export function DashboardPeriodSummary({
  periods,
  periodDays,
  setPeriodDays,
  periodStart,
  periodRowCount,
  topPeriodType,
  periodTypeList,
  topPeriodEmp,
  periodEmpList,
}: DashboardPeriodSummaryProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">بحث حسب الفترة الزمنية</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <Label className="text-xs">الفترة</Label>
            <Select value={periodDays} onValueChange={setPeriodDays}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {periods.map((p) => (
                  <SelectItem key={p.days} value={String(p.days)}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2 lg:col-span-3 flex items-end text-xs text-muted-foreground">
            من {periodStart} حتى اليوم — {periodRowCount} مخالفة
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border p-4">
            <div className="text-xs text-muted-foreground mb-1">أكثر مخالفة تكراراً خلال الفترة</div>
            <div className="text-lg font-bold break-words">{topPeriodType?.[0] || "لا توجد بيانات"}</div>
            {topPeriodType && <div className="text-xs text-primary mt-1">تكررت {topPeriodType[1]} مرة</div>}
            <div className="mt-3 space-y-1">
              {periodTypeList.slice(1, 5).map(([n, c]) => (
                <div key={n} className="flex justify-between text-xs text-muted-foreground gap-2">
                  <span className="truncate">{n}</span><span>{c}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-xs text-muted-foreground mb-1">أكثر عامل تكراراً خلال الفترة</div>
            <div className="text-lg font-bold break-words">{topPeriodEmp?.[0] || "لا توجد بيانات"}</div>
            {topPeriodEmp && <div className="text-xs text-primary mt-1">{topPeriodEmp[1]} مخالفة</div>}
            <div className="mt-3 space-y-1">
              {periodEmpList.slice(1, 5).map(([n, c]) => (
                <div key={n} className="flex justify-between text-xs text-muted-foreground gap-2">
                  <span className="truncate">{n}</span><span>{c}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
