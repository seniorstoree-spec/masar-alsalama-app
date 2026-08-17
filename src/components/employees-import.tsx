/**
 * EmployeesImport Component
 * Handles parsing and chunked batch upserting of employee Excel spreadsheets.
 */

import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { employeesService } from "@/services/api/employees-service";
import { normalizeArabicText, cleanCell } from "@/lib/string-utils";
import { EMPLOYEES_QUERY_KEY, EMPLOYEES_MIN_QUERY_KEY, EMPLOYEES_LOOKUP_QUERY_KEY } from "@/hooks/use-employees";

const HEADER_MAP: Record<string, string> = {
  code: "code", الكود: "code", كود: "code", رقم: "code", الرقم: "code", "كود الموظف": "code", "رقم الموظف": "code",
  name: "name", الاسم: "name", اسم: "name", "اسم الموظف": "name", "اسم العامل": "name",
  department: "department", الاداره: "department", اداره: "department", "الاداره العامه": "department",
  section: "section", القسم: "section", قسم: "section",
  sub_section: "sub_section", "القسم الفرعي": "sub_section", "قسم فرعي": "sub_section",
  job_title: "job_title", "المسمي الوظيفي": "job_title", الوظيفه: "job_title", المسمي: "job_title", "الوظيفه الحاليه": "job_title",
  national_id: "national_id", "الرقم القومي": "national_id", "رقم قومي": "national_id",
  category: "category", الفئه: "category", فئه: "category",
  employee_type: "employee_type", النوع: "employee_type", نوع: "employee_type", "نوع الموظف": "employee_type",
};

export function EmployeesImport() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const qc = useQueryClient();

  const handleFile = async (file: File) => {
    setLoading(true);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });

      let best: { headers: string[]; rows: any[][] } | null = null;
      for (const sheetName of wb.SheetNames) {
        const grid: any[][] = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {
          header: 1,
          defval: "",
          raw: false,
          blankrows: false,
        });
        for (let h = 0; h < Math.min(10, grid.length); h++) {
          const keys = grid[h].map((c) => HEADER_MAP[normalizeArabicText(c)] || "");
          if (keys.includes("code") && keys.includes("name")) {
            best = { headers: keys, rows: grid.slice(h + 1) };
            break;
          }
        }
        if (best) break;
      }

      if (!best) throw new Error("لم يتم العثور على أعمدة الكود/الاسم في الملف");

      const mapped = best.rows
        .map((row) => {
          const out: any = {};
          best!.headers.forEach((key, i) => {
            if (key && !out[key]) out[key] = cleanCell(row[i]);
          });
          return out;
        })
        .filter((r) => r.code && r.name);

      if (!mapped.length) throw new Error("لا توجد صفوف صالحة للاستيراد");

      const byCode = new Map<string, any>();
      for (const r of mapped) {
        byCode.set(r.code, {
          code: r.code,
          name: r.name,
          department: r.department || null,
          section: r.section || null,
          sub_section: r.sub_section || null,
          job_title: r.job_title || null,
          national_id: r.national_id || null,
          category: r.category || null,
          employee_type: r.employee_type === "يومي" ? "يومي" : "دائم",
        });
      }
      const records = Array.from(byCode.values());

      const doneCount = await employeesService.upsertEmployeesBatch(records);

      toast.success(`تم استيراد ${doneCount} موظف`);
      qc.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEY });
      qc.invalidateQueries({ queryKey: EMPLOYEES_MIN_QUERY_KEY });
      qc.invalidateQueries({ queryKey: EMPLOYEES_LOOKUP_QUERY_KEY });
    } catch (e: any) {
      toast.error(e.message || "فشل الاستيراد");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
      <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={loading}>
        {loading ? <Loader2 className="w-4 h-4 ml-1 animate-spin" /> : <Upload className="w-4 h-4 ml-1" />}
        {loading ? "جاري الاستيراد..." : "استيراد Excel"}
      </Button>
    </>
  );
}
