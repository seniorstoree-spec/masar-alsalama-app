/**
 * DashboardCharts Component
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from "recharts";

export const CHART_COLORS = [
  "oklch(0.52 0.11 180)",
  "oklch(0.65 0.15 50)",
  "oklch(0.55 0.2 25)",
  "oklch(0.6 0.15 280)",
  "oklch(0.7 0.13 140)",
  "oklch(0.6 0.18 340)",
  "oklch(0.62 0.14 90)",
  "oklch(0.5 0.15 220)",
];

export interface DashboardChartsProps {
  monthData: Array<{ key: string; name: string; value: number }>;
  typeData: Array<{ name: string; value: number }>;
  topEmpData: any[];
  topTypeKeys: string[];
  topEmp: string;
}

export function DashboardCharts({
  monthData,
  typeData,
  topEmpData,
  topTypeKeys,
  topEmp,
}: DashboardChartsProps) {
  return (
    <div className="grid lg:grid-cols-2 gap-4">
      {/* Violations over time */}
      <Card className="min-w-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-base leading-relaxed break-words">المخالفات عبر الوقت</CardTitle>
        </CardHeader>
        <CardContent className="min-w-0 px-2 sm:px-6">
          {monthData.length === 0 ? (
            <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">لا توجد بيانات</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthData} margin={{ top: 8, right: 8, left: 0, bottom: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.01 240)" />
                <XAxis
                  dataKey="name"
                  stroke="oklch(0.5 0.03 240)"
                  fontSize={10}
                  interval="preserveStartEnd"
                  minTickGap={4}
                  angle={-35}
                  textAnchor="end"
                  height={78}
                  tickMargin={6}
                />
                <YAxis stroke="oklch(0.5 0.03 240)" fontSize={12} allowDecimals={false} width={32} />
                <Tooltip />
                <Bar dataKey="value" name="عدد المخالفات" fill="oklch(0.52 0.11 180)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Violation Types Distribution */}
      <Card className="min-w-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-base leading-relaxed break-words">توزيع أنواع المخالفات</CardTitle>
        </CardHeader>
        <CardContent className="min-w-0 px-2 sm:px-6">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={typeData} dataKey="value" nameKey="name" outerRadius="70%" label={({ value }) => value}>
                {typeData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11, lineHeight: "18px" }} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Employees Stacked Bar */}
      <Card className="lg:col-span-2 min-w-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-base leading-relaxed break-words">أكثر العمال مخالفة</CardTitle>
          <p className="text-xs text-muted-foreground mt-1 break-words">
            الاسم والقسم مع توزيع أنواع المخالفات المرتكبة
          </p>
        </CardHeader>
        <CardContent className="min-w-0 px-2 sm:px-6">
          {topEmpData.length === 0 ? (
            <div className="h-[320px] flex items-center justify-center text-sm text-muted-foreground">لا توجد بيانات</div>
          ) : (
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={topEmpData} margin={{ top: 8, right: 8, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.01 240)" />
                <XAxis
                  dataKey="label"
                  stroke="oklch(0.5 0.03 240)"
                  interval={0}
                  height={64}
                  tickLine={false}
                  tick={(props: any) => {
                    const { x, y, payload } = props;
                    const [nm = "", dep = ""] = String(payload.value).split(" — ");
                    const cut = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
                    return (
                      <g transform={`translate(${x},${y + 12})`}>
                        <text textAnchor="middle" fill="oklch(0.35 0.03 240)" fontSize={11} fontWeight={600}>
                          {cut(nm, 14)}
                        </text>
                        <text y={15} textAnchor="middle" fill="oklch(0.55 0.02 240)" fontSize={10}>
                          {cut(dep, 16)}
                        </text>
                      </g>
                    );
                  }}
                />
                <YAxis stroke="oklch(0.5 0.03 240)" fontSize={12} allowDecimals={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const row: any = payload[0].payload;
                    return (
                      <div className="rounded-md border bg-background p-2 text-xs shadow-md space-y-1">
                        <div className="font-semibold">{row.name}</div>
                        <div className="text-muted-foreground">القسم: {row.department}</div>
                        <div className="text-muted-foreground">الإجمالي: {row.total}</div>
                        <div className="pt-1 border-t space-y-0.5">
                          {payload.map((p: any) => (
                            p.value > 0 && (
                              <div key={p.dataKey} className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-sm" style={{ background: p.color }} />
                                <span>{p.dataKey}: {p.value}</span>
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    );
                  }}
                />
                <Legend />
                {topTypeKeys.map((tk, i) => (
                  <Bar
                    key={tk}
                    dataKey={tk}
                    stackId="v"
                    fill={CHART_COLORS[i % CHART_COLORS.length]}
                    radius={i === topTypeKeys.length - 1 ? [6, 6, 0, 0] : [0, 0, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
          <div className="mt-3 text-sm text-muted-foreground">
            أكثر عامل مخالف: <span className="font-semibold text-foreground">{topEmp}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
