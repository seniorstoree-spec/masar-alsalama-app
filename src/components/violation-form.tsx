/**
 * ViolationForm Component
 * Form for adding or editing an employee safety/quality violation record.
 * Supports auto-complete search from employee database or manual input,
 * production section popover manager, image upload, and date pickers.
 */

import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Search, X, Upload, Loader2, Image as ImageIcon, Check, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";
import { ProductionSectionsManager } from "@/components/production-sections-manager";
import { useDebounce } from "@/hooks/use-debounce";
import { useMinimalEmployees } from "@/hooks/use-employees";
import { useSaveViolation } from "@/hooks/use-violations";
import { violationsService } from "@/services/api/violations-service";
import { violationTypesService } from "@/services/api/violation-types-service";
import { productionSectionsService } from "@/services/api/production-sections-service";
import type { SeverityLevel, Violation } from "@/types";

const SEVERITIES: SeverityLevel[] = ["منخفض", "متوسط", "عالي", "حرج"];

export interface ViolationFormProps {
  /** Optional existing violation object to edit */
  editing?: Violation | null;
  /** Callback fired after successful submission */
  onSaved?: () => void;
  /** Optional custom footer renderer passing submission state */
  footer?: (submitting: boolean) => React.ReactNode;
}

export function ViolationForm({ editing, onSaved, footer }: ViolationFormProps) {
  const [prodSearch, setProdSearch] = useState("");
  const debouncedProdSearch = useDebounce(prodSearch, 150);

  const [empMode, setEmpMode] = useState<"search" | "manual">("search");
  const [selectedEmpId, setSelectedEmpId] = useState<string>("");
  const [empName, setEmpName] = useState("");
  const [empCode, setEmpCode] = useState("");
  const [empJob, setEmpJob] = useState("");
  const [empDept, setEmpDept] = useState("");
  const [empQuery, setEmpQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [prodSectionOpen, setProdSectionOpen] = useState(false);
  const [prodSection, setProdSection] = useState<string>("");
  const [imagePath, setImagePath] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Queries
  const { data: employees = [] } = useMinimalEmployees();

  const { data: types = [] } = useQuery({
    queryKey: ["violation-types"],
    queryFn: () => violationTypesService.getViolationTypes(),
  });

  const { data: prodSections = [] } = useQuery({
    queryKey: ["production-sections"],
    queryFn: () => productionSectionsService.getProductionSections(),
  });

  // Save Mutation
  const saveMutation = useSaveViolation({
    onSuccess: () => {
      if (!editing) resetAll();
      onSaved?.();
    },
  });

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("الحد الأقصى 5 ميجابايت");
      return;
    }
    setUploading(true);
    try {
      const path = await violationsService.uploadViolationImage(file);
      setImagePath(path);
      const signed = await violationsService.getSignedImageUrl(path);
      setImagePreview(signed);
      toast.success("تم رفع الصورة");
    } catch (e: any) {
      toast.error(e.message || "فشل رفع الصورة");
    } finally {
      setUploading(false);
    }
  };

  const resetAll = () => {
    setEmpMode("search");
    setSelectedEmpId("");
    setEmpName("");
    setEmpCode("");
    setEmpJob("");
    setEmpDept("");
    setEmpQuery("");
    setShowSuggestions(false);
    setProdSection("");
    setImagePath("");
    setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    setFormKey((k) => k + 1);
  };

  useEffect(() => {
    if (editing) {
      if (editing.employee_id && editing.employees) {
        setEmpMode("search");
        setSelectedEmpId(editing.employee_id);
        setEmpName(editing.employees.name || "");
        setEmpCode(editing.employees.code || "");
        setEmpJob(editing.employees.job_title || editing.employee_job_title || "");
        setEmpDept(editing.employees.department || editing.employee_department || "");
      } else {
        setEmpMode("manual");
        setSelectedEmpId("");
        setEmpName(editing.employee_name || "");
        setEmpCode(editing.employee_code || "");
        setEmpJob(editing.employee_job_title || "");
        setEmpDept(editing.employee_department || "");
      }
      setEmpQuery("");
      setShowSuggestions(false);
      setProdSection(editing.production_section || "");
      const initialImage = editing.image_url || "";
      setImagePath(initialImage);
      if (initialImage) {
        violationsService.getSignedImageUrl(initialImage).then(setImagePreview);
      } else {
        setImagePreview("");
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    } else {
      resetAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  const empSuggestions = useMemo(() => {
    const q = empQuery.trim().toLowerCase();
    if (!q) return [];
    return employees
      .filter((e) =>
        (e.name || "").toLowerCase().includes(q) ||
        (e.code || "").toLowerCase().includes(q) ||
        (e.job_title || "").toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [empQuery, employees]);

  const pickEmployee = (e: any) => {
    setSelectedEmpId(e.id);
    setEmpName(e.name || "");
    setEmpCode(e.code || "");
    setEmpJob(e.job_title || "");
    setEmpDept(e.department || "");
    setEmpQuery("");
    setShowSuggestions(false);
  };

  const clearEmployee = () => {
    setSelectedEmpId("");
    setEmpName("");
    setEmpCode("");
    setEmpJob("");
    setEmpDept("");
  };

  const filteredProdSections = useMemo(() => {
    const q = debouncedProdSearch.trim().toLowerCase();
    if (!q) return prodSections;
    return prodSections.filter((s) => (s.name || "").toLowerCase().includes(q));
  }, [prodSections, debouncedProdSearch]);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (!empName.trim()) {
      toast.error("يجب إدخال اسم الموظف");
      return;
    }
    saveMutation.mutate({
      id: editing?.id,
      payload: {
        employee_id: selectedEmpId || null,
        employee_name: empName.trim() || null,
        employee_code: empCode.trim() || null,
        employee_job_title: empJob.trim() || null,
        employee_department: empDept.trim() || null,
        violation_type_id: (fd.get("violation_type_id") as string) || null,
        severity: (fd.get("severity") as SeverityLevel) || "متوسط",
        status: editing?.status || "مفتوحة",
        inspector_name: (fd.get("inspector_name") as string) || null,
        notes: (fd.get("notes") as string) || null,
        image_url: imagePath || null,
        production_section: prodSection || null,
        violation_date: (fd.get("violation_date") as string) || null,
      },
    });
  };

  return (
    <form key={formKey} onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-3 rounded-lg border p-3 bg-muted/30">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">بيانات الموظف</Label>
          <div className="flex gap-1">
            <Button
              type="button"
              size="sm"
              variant={empMode === "search" ? "default" : "outline"}
              onClick={() => setEmpMode("search")}
            >
              بحث
            </Button>
            <Button
              type="button"
              size="sm"
              variant={empMode === "manual" ? "default" : "outline"}
              onClick={() => {
                setEmpMode("manual");
                clearEmployee();
              }}
            >
              إدخال يدوي
            </Button>
          </div>
        </div>

        {empMode === "search" && (
          <div className="relative">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="ابحث بالاسم أو الكود أو المسمى الوظيفي..."
                value={empQuery}
                onChange={(e) => {
                  setEmpQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="pr-9"
              />
            </div>
            {showSuggestions && empSuggestions.length > 0 && (
              <div className="absolute z-50 mt-1 w-full bg-popover border rounded-md shadow-lg max-h-64 overflow-auto">
                {empSuggestions.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => pickEmployee(e)}
                    className="w-full text-right px-3 py-2 hover:bg-accent text-sm border-b last:border-0"
                  >
                    <div className="font-medium">{e.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {e.code} {e.job_title ? `• ${e.job_title}` : ""} {e.department ? `• ${e.department}` : ""}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {showSuggestions && empQuery && empSuggestions.length === 0 && (
              <div className="absolute z-50 mt-1 w-full bg-popover border rounded-md shadow-lg p-3 text-sm text-muted-foreground">
                لا توجد نتائج. استخدم "إدخال يدوي" لإضافة موظف جديد.
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs">
              الاسم {selectedEmpId && <span className="text-emerald-600">✓ من القاعدة</span>}
            </Label>
            <div className="relative">
              <Input
                value={empName}
                onChange={(e) => {
                  setEmpName(e.target.value);
                  if (selectedEmpId) setSelectedEmpId("");
                }}
                required
                readOnly={empMode === "search" && !!selectedEmpId}
              />
              {selectedEmpId && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={clearEmployee}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">الكود</Label>
            <Input
              value={empCode}
              onChange={(e) => {
                setEmpCode(e.target.value);
                if (selectedEmpId) setSelectedEmpId("");
              }}
              readOnly={empMode === "search" && !!selectedEmpId}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">المسمى الوظيفي</Label>
            <Input
              value={empJob}
              onChange={(e) => {
                setEmpJob(e.target.value);
                if (selectedEmpId) setSelectedEmpId("");
              }}
              readOnly={empMode === "search" && !!selectedEmpId}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">القسم</Label>
            <Input
              value={empDept}
              onChange={(e) => {
                setEmpDept(e.target.value);
                if (selectedEmpId) setSelectedEmpId("");
              }}
              readOnly={empMode === "search" && !!selectedEmpId}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>نوع المخالفة</Label>
          <Select name="violation_type_id" defaultValue={editing?.violation_type_id || ""} required>
            <SelectTrigger><SelectValue placeholder="اختر النوع" /></SelectTrigger>
            <SelectContent>
              {types.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>مستوى الخطورة</Label>
          <Select name="severity" defaultValue={editing?.severity || "متوسط"}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {SEVERITIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>مهندس الجودة</Label>
          <Input name="inspector_name" defaultValue={editing?.inspector_name || ""} />
        </div>
        <div className="space-y-2">
          <Label>التاريخ</Label>
          <Input type="date" name="violation_date" defaultValue={editing?.violation_date || new Date().toISOString().slice(0, 10)} />
        </div>
        <div className="space-y-2 col-span-2">
          <Label>القسم الإنتاجي</Label>
          <div className="flex gap-2">
            <Popover open={prodSectionOpen} onOpenChange={setProdSectionOpen}>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" role="combobox" className="flex-1 justify-between font-normal">
                  {prodSection || "اختر القسم الإنتاجي"}
                  <ChevronsUpDown className="w-4 h-4 opacity-50 mr-2" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-[--radix-popover-trigger-width]" align="start">
                <Command shouldFilter={false}>
                  <CommandInput placeholder="ابحث عن قسم..." value={prodSearch} onValueChange={setProdSearch} />
                  <CommandList>
                    <CommandEmpty>لا توجد نتائج</CommandEmpty>
                    <CommandGroup>
                      <CommandItem value="__none" onSelect={() => { setProdSection(""); setProdSectionOpen(false); setProdSearch(""); }}>
                        <Check className={`w-4 h-4 ml-2 ${!prodSection ? "opacity-100" : "opacity-0"}`} />
                        — بدون —
                      </CommandItem>
                      {filteredProdSections.map((s) => (
                        <CommandItem key={s.id} value={s.name} onSelect={() => { setProdSection(s.name); setProdSectionOpen(false); setProdSearch(""); }}>
                          <Check className={`w-4 h-4 ml-2 ${prodSection === s.name ? "opacity-100" : "opacity-0"}`} />
                          {s.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <ProductionSectionsManager />
          </div>
        </div>
        <div className="space-y-2 col-span-2">
          <Label>صورة المخالفة (اختياري)</Label>
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileUpload(f);
              }}
            />
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="w-4 h-4 ml-1 animate-spin" /> : <Upload className="w-4 h-4 ml-1" />}
              {imagePath ? "تغيير الصورة" : "رفع صورة من الجهاز"}
            </Button>
            {imagePath && (
              <Button type="button" size="sm" variant="ghost" onClick={() => { setImagePath(""); setImagePreview(""); if (fileInputRef.current) fileInputRef.current.value = ""; }}>
                <X className="w-4 h-4 ml-1" /> إزالة
              </Button>
            )}
          </div>
          {imagePreview ? (
            <img src={imagePreview} alt="معاينة" className="mt-2 max-h-40 rounded-md border object-contain" />
          ) : imagePath ? (
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <ImageIcon className="w-4 h-4" /> {imagePath}
            </div>
          ) : null}
        </div>
        <div className="space-y-2 col-span-2">
          <Label>ملاحظات</Label>
          <Textarea name="notes" defaultValue={editing?.notes || ""} rows={3} />
        </div>
      </div>

      {footer ? (
        footer(saveMutation.isPending)
      ) : (
        <div className="flex justify-end">
          <Button type="submit" disabled={saveMutation.isPending}>
            {saveMutation.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
            حفظ
          </Button>
        </div>
      )}
    </form>
  );
}
