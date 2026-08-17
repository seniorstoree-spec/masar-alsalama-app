/**
 * DashboardKpiSummary Component
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export interface KpiItem {
  label: string;
  value: string;
  detail: string;
  count: number;
  icon: any;
  color: string;
  bg: string;
  rows: any[];
}

export interface DashboardKpiSummaryProps {
  kpis: KpiItem[];
  onOpenDrill: (title: string, rows: any[]) => void;
}

export function DashboardKpiSummary({ kpis, onOpenDrill }: DashboardKpiSummaryProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">ملخص المؤشرات</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-right w-[46px]"></TableHead>
                <TableHead className="text-right whitespace-nowrap">المؤشر</TableHead>
                <TableHead className="text-right">القيمة</TableHead>
                <TableHead className="text-right whitespace-nowrap">العدد</TableHead>
                <TableHead className="text-right whitespace-nowrap">تفاصيل</TableHead>
                <TableHead className="text-right w-[110px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kpis.map((k) => (
                <TableRow key={k.label} className="hover:bg-muted/40">
                  <TableCell>
                    <div className={`w-9 h-9 rounded-lg ${k.bg} flex items-center justify-center`}>
                      <k.icon className={`w-4 h-4 ${k.color}`} />
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{k.label}</TableCell>
                  <TableCell className="font-semibold break-words max-w-[220px]">{k.value}</TableCell>
                  <TableCell>
                    <span className="inline-flex min-w-8 justify-center rounded-md bg-primary/10 px-2 py-0.5 text-sm font-bold text-primary">
                      {k.count}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground break-words max-w-[200px]">{k.detail}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" onClick={() => onOpenDrill(`${k.label}: ${k.value}`, k.rows)}>
                      عرض ({k.rows.length}) <ChevronLeft className="w-4 h-4 mr-1" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
