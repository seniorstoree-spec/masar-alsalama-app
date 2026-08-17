/**
 * ProductionSectionsManager Component
 * Popover dialog manager for listing, creating, updating, and deleting production sections.
 */

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Settings2, Plus, Pencil, Trash2, Check, X, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { productionSectionsService } from "@/services/api/production-sections-service";
import { normalizeArabicText } from "@/lib/string-utils";
import type { ProductionSection } from "@/types";

export function ProductionSectionsManager() {
  const qc = useQueryClient();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [search, setSearch] = useState("");

  const { data: sections = [] } = useQuery({
    queryKey: ["production-sections"],
    queryFn: () => productionSectionsService.getProductionSections(),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["production-sections"] });

  const isDuplicate = (name: string, ignoreId?: string | null) => {
    const n = normalizeArabicText(name);
    return sections.some((s: ProductionSection) => normalizeArabicText(s.name) === n && s.id !== ignoreId);
  };

  const add = useMutation({
    mutationFn: (name: string) => productionSectionsService.createProductionSection(name),
    onSuccess: () => { invalidate(); setNewName(""); toast.success("تمت الإضافة"); },
    onError: (e: any) => toast.error(e.message),
  });

  const upd = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => productionSectionsService.updateProductionSection(id, name),
    onSuccess: () => { invalidate(); setEditingId(null); toast.success("تم التعديل"); },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: string) => productionSectionsService.deleteProductionSection(id),
    onSuccess: () => { invalidate(); toast.success("تم الحذف"); },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    const q = normalizeArabicText(search);
    if (!q) return sections;
    return sections.filter((s: ProductionSection) => normalizeArabicText(s.name).includes(q));
  }, [sections, search]);

  const newDup = newName.trim() && isDuplicate(newName);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" size="icon" variant="outline" className="h-9 w-9" title="إدارة الأقسام الإنتاجية">
          <Settings2 className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-3">
          <div className="text-sm font-semibold">إدارة الأقسام الإنتاجية</div>
          <div className="space-y-1">
            <div className="flex gap-2">
              <Input
                placeholder="اسم قسم جديد"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (newName.trim() && !newDup) add.mutate(newName.trim()); } }}
                aria-invalid={!!newDup}
                className={newDup ? "border-destructive" : ""}
              />
              <Button
                type="button"
                size="icon"
                onClick={() => newName.trim() && !newDup && add.mutate(newName.trim())}
                disabled={add.isPending || !newName.trim() || !!newDup}
              >
                {add.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              </Button>
            </div>
            {newDup && <p className="text-xs text-destructive">هذا القسم موجود بالفعل</p>}
          </div>

          <div className="relative">
            <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="ابحث..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-7 h-8 text-sm"
            />
          </div>

          <div className="max-h-60 overflow-auto space-y-1 border rounded-md p-1">
            {filtered.length === 0 ? (
              <div className="text-xs text-muted-foreground p-2 text-center">
                {sections.length === 0 ? "لا توجد أقسام بعد" : "لا نتائج"}
              </div>
            ) : filtered.map((s: ProductionSection) => (
              <div key={s.id} className="flex items-center gap-1 p-1 rounded hover:bg-accent">
                {editingId === s.id ? (
                  <>
                    <Input value={editingName} onChange={(e) => setEditingName(e.target.value)} className="h-8" />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => editingName.trim() && upd.mutate({ id: s.id, name: editingName.trim() })}
                      disabled={!editingName.trim() || isDuplicate(editingName, s.id) || upd.isPending}
                    >
                      <Check className="w-4 h-4 text-emerald-600" />
                    </Button>
                    <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingId(null)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm px-2">{s.name}</span>
                    <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingId(s.id); setEditingName(s.name); }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => { if (confirm("حذف القسم؟")) del.mutate(s.id); }}>
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">إجمالي: {sections.length}</p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
