/**
 * Employees Page Route Component
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Search, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { PageHeader } from "@/components/page-header";
import { EmployeesImport } from "@/components/employees-import";
import { useEmployees, useSaveEmployee, useDeleteEmployee, useBulkDeleteEmployees } from "@/hooks/use-employees";
import type { Employee } from "@/types";

export const Route = createFileRoute("/_authenticated/employees")({
  component: EmployeesPage,
});

function EmployeesPage() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Hooks
  const { data = [] } = useEmployees();

  const saveMutation = useSaveEmployee({
    onSuccess: () => {
      setOpen(false);
      setEditing(null);
    },
  });

  const deleteMutation = useDeleteEmployee();

  const bulkDeleteMutation = useBulkDeleteEmployees({
    onSuccess: () => {
      setSelected(new Set());
    },
  });

  const q = search.trim().toLowerCase();
  const filtered = !q ? data : data.filter((e) =>
    [e.name, e.code, e.department, e.section, e.sub_section, e.job_title, e.national_id, e.category]
      .some((v) => (v || "").toString().toLowerCase().includes(q))
  );

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    saveMutation.mutate({
      id: editing?.id,
      payload: {
        name: String(fd.get("name")),
        code: String(fd.get("code")),
        department: String(fd.get("department") || ""),
        section: String(fd.get("section") || ""),
        sub_section: String(fd.get("sub_section") || ""),
        job_title: String(fd.get("job_title") || ""),
        national_id: String(fd.get("national_id") || ""),
        category: String(fd.get("category") || ""),
        employee_type: fd.get("employee_type") as "دائم" | "يومي",
      },
    });
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="الموظفين"
        subtitle={`إجمالي ${data.length} موظف`}
        actions={
          <div className="flex gap-2">
            <EmployeesImport />
            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
              <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 ml-1" /> إضافة موظف</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{editing ? "تعديل موظف" : "إضافة موظف"}</DialogTitle></DialogHeader>
                <form onSubmit={onSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>الاسم</Label>
                      <Input name="name" defaultValue={editing?.name} required />
                    </div>
                    <div className="space-y-2">
                      <Label>الكود</Label>
                      <Input name="code" defaultValue={editing?.code} required />
                    </div>
                    <div className="space-y-2">
                      <Label>الإدارة</Label>
                      <Input name="department" defaultValue={editing?.department || ""} />
                    </div>
                    <div className="space-y-2">
                      <Label>القسم</Label>
                      <Input name="section" defaultValue={editing?.section || ""} />
                    </div>
                    <div className="space-y-2">
                      <Label>القسم الفرعي</Label>
                      <Input name="sub_section" defaultValue={editing?.sub_section || ""} />
                    </div>
                    <div className="space-y-2">
                      <Label>المسمى الوظيفي</Label>
                      <Input name="job_title" defaultValue={editing?.job_title || ""} />
                    </div>
                    <div className="space-y-2">
                      <Label>الرقم القومي</Label>
                      <Input name="national_id" defaultValue={editing?.national_id || ""} />
                    </div>
                    <div className="space-y-2">
                      <Label>الفئة</Label>
                      <Input name="category" defaultValue={editing?.category || ""} />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label>النوع</Label>
                      <Select name="employee_type" defaultValue={editing?.employee_type || "دائم"}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="دائم">دائم</SelectItem>
                          <SelectItem value="يومي">يومي</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={saveMutation.isPending}>
                      {saveMutation.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                      حفظ
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="relative max-w-md flex-1 min-w-[240px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="بحث بالاسم أو الكود أو المسمى الوظيفي أو الإدارة" value={search} onChange={(e) => setSearch(e.target.value)} className="pr-9" />
        </div>
        {selected.size > 0 && (
          <Button
            variant="destructive"
            onClick={() => {
              if (confirm(`حذف ${selected.size} موظف؟ لا يمكن التراجع.`)) {
                bulkDeleteMutation.mutate(Array.from(selected));
              }
            }}
            disabled={bulkDeleteMutation.isPending}
          >
            {bulkDeleteMutation.isPending ? <Loader2 className="w-4 h-4 ml-1 animate-spin" /> : <Trash2 className="w-4 h-4 ml-1" />}
            حذف المحدد ({selected.size})
          </Button>
        )}
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                {(() => {
                  const visible = filtered.slice(0, 200);
                  const allChecked = visible.length > 0 && visible.every((e) => selected.has(e.id));
                  const someChecked = visible.some((e) => selected.has(e.id));
                  return (
                    <Checkbox
                      checked={allChecked ? true : someChecked ? "indeterminate" : false}
                      onCheckedChange={(v) => {
                        const next = new Set(selected);
                        if (v) visible.forEach((e) => next.add(e.id));
                        else visible.forEach((e) => next.delete(e.id));
                        setSelected(next);
                      }}
                      aria-label="تحديد الكل"
                    />
                  );
                })()}
              </TableHead>
              <TableHead className="text-right">الكود</TableHead>
              <TableHead className="text-right">الاسم</TableHead>
              <TableHead className="text-right">الإدارة</TableHead>
              <TableHead className="text-right">القسم</TableHead>
              <TableHead className="text-right">المسمى الوظيفي</TableHead>
              <TableHead className="text-right">الفئة</TableHead>
              <TableHead className="text-right">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">لا توجد بيانات</TableCell></TableRow>
            ) : filtered.slice(0, 200).map((emp) => (
              <TableRow key={emp.id} data-state={selected.has(emp.id) ? "selected" : undefined}>
                <TableCell>
                  <Checkbox
                    checked={selected.has(emp.id)}
                    onCheckedChange={(v) => {
                      const next = new Set(selected);
                      if (v) next.add(emp.id); else next.delete(emp.id);
                      setSelected(next);
                    }}
                    aria-label={`تحديد ${emp.name}`}
                  />
                </TableCell>
                <TableCell><Badge variant="outline">{emp.code}</Badge></TableCell>
                <TableCell className="font-medium">{emp.name}</TableCell>
                <TableCell>{emp.department || "—"}</TableCell>
                <TableCell>{emp.section || "—"}</TableCell>
                <TableCell>{emp.job_title || "—"}</TableCell>
                <TableCell>{emp.category ? <Badge>{emp.category}</Badge> : "—"}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => { setEditing(emp); setOpen(true); }}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => { if (confirm("حذف الموظف؟")) deleteMutation.mutate(emp.id); }}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filtered.length > 200 && (
          <div className="p-3 text-center text-sm text-muted-foreground border-t">
            يتم عرض أول 200 نتيجة من {filtered.length} — استخدم البحث للتصفية
          </div>
        )}
      </Card>
    </div>
  );
}
