/**
 * Violation Types Route Component
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { violationTypesService } from "@/services/api/violation-types-service";
import type { ViolationType } from "@/types";

export const Route = createFileRoute("/_authenticated/violation-types")({
  component: TypesPage,
});

function TypesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ViolationType | null>(null);

  const { data = [] } = useQuery({
    queryKey: ["violation-types"],
    queryFn: () => violationTypesService.getViolationTypes(),
  });

  const save = useMutation({
    mutationFn: async (payload: Partial<ViolationType>) => {
      if (editing) {
        await violationTypesService.updateViolationType(editing.id, payload);
      } else {
        await violationTypesService.createViolationType(payload);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["violation-types"] });
      toast.success(editing ? "تم التعديل" : "تمت الإضافة");
      setOpen(false);
      setEditing(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: string) => violationTypesService.deleteViolationType(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["violation-types"] });
      toast.success("تم الحذف");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    save.mutate({
      name: String(fd.get("name")),
      description: String(fd.get("description") || ""),
    });
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="أنواع المخالفات"
        subtitle={`${data.length} نوع`}
        actions={
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 ml-1" /> إضافة نوع</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? "تعديل النوع" : "إضافة نوع مخالفة"}</DialogTitle></DialogHeader>
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>الاسم</Label>
                  <Input name="name" defaultValue={editing?.name} required />
                </div>
                <div className="space-y-2">
                  <Label>الوصف</Label>
                  <Textarea name="description" defaultValue={editing?.description || ""} rows={3} />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={save.isPending}>
                    {save.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                    حفظ
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">الاسم</TableHead>
              <TableHead className="text-right">الوصف</TableHead>
              <TableHead className="text-right">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">لا توجد بيانات</TableCell></TableRow>
            ) : data.map((t: any) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{t.description || "—"}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => { setEditing(t); setOpen(true); }}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => { if (confirm("حذف النوع؟")) del.mutate(t.id); }}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
