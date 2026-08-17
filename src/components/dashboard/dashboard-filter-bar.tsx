/**
 * DashboardFilterBar Component
 */

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { UserCheck, X } from "lucide-react";

export interface DashboardFilterBarProps {
  nameQ: string;
  setNameQ: (val: string) => void;
  codeQ: string;
  setCodeQ: (val: string) => void;
  deptQ: string;
  setDeptQ: (val: string) => void;
  typeQ: string;
  setTypeQ: (val: string) => void;
  prodSectionQ: string;
  setProdSectionQ: (val: string) => void;
  from: string;
  setFrom: (val: string) => void;
  to: string;
  setTo: (val: string) => void;
  departments: string[];
  types: Array<{ id: string; name: string }>;
  prodSections: Array<{ id: string; name: string }>;
  matchedEmployee: any | null;
  onClearFilters: () => void;
}

export function DashboardFilterBar({
  nameQ,
  setNameQ,
  codeQ,
  setCodeQ,
  deptQ,
  setDeptQ,
  typeQ,
  setTypeQ,
  prodSectionQ,
  setProdSectionQ,
  from,
  setFrom,
  to,
  setTo,
  departments,
  types,
  prodSections,
  matchedEmployee,
  onClearFilters,
}: DashboardFilterBarProps) {
  return (
    <Card>
      <CardContent className="p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">اسم الموظف</Label>
          <Input value={nameQ} onChange={(e) => setNameQ(e.target.value)} placeholder="بحث بالاسم" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">الكود</Label>
          <Input value={codeQ} onChange={(e) => setCodeQ(e.target.value)} placeholder="بحث بالكود" />
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
              {types.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">القسم الإنتاجي</Label>
          <Select value={prodSectionQ || "all"} onValueChange={(v) => setProdSectionQ(v === "all" ? "" : v)}>
            <SelectTrigger><SelectValue placeholder="كل الأقسام الإنتاجية" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الأقسام الإنتاجية</SelectItem>
              {prodSections.map((s) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">من تاريخ</Label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">إلى تاريخ</Label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>

        {matchedEmployee && (
          <div className="col-span-2 md:col-span-4 lg:col-span-7 flex items-center gap-3 rounded-md border bg-muted/40 p-3 text-sm">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <UserCheck className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 grid grid-cols-3 gap-3">
              <div><span className="text-muted-foreground">الاسم:</span> <span className="font-medium">{matchedEmployee.name}</span></div>
              <div><span className="text-muted-foreground">الكود:</span> <span className="font-medium">{matchedEmployee.code}</span></div>
              <div><span className="text-muted-foreground">القسم:</span> <span className="font-medium">{matchedEmployee.department || "—"}</span></div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setNameQ(matchedEmployee.name || "");
                setCodeQ(matchedEmployee.code || "");
                setDeptQ(matchedEmployee.department || "");
              }}
            >
              تطبيق كفلتر
            </Button>
          </div>
        )}

        <div className="col-span-2 md:col-span-4 lg:col-span-7 flex justify-end">
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            <X className="w-4 h-4 ml-1" /> مسح الفلاتر
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
