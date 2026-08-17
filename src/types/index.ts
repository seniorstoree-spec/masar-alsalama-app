/**
 * Domain Type Definitions for Employee Violation App (مسار السلامة)
 */

export type SeverityLevel = "منخفض" | "متوسط" | "عالي" | "حرج";
export type EmployeeType = "دائم" | "يومي";
export type ViolationStatus = "مفتوحة" | "مغلقة" | string;

export interface Employee {
  id: string;
  name: string;
  code: string;
  department: string | null;
  section: string | null;
  sub_section: string | null;
  job_title: string | null;
  national_id: string | null;
  category: string | null;
  employee_type: EmployeeType;
  created_at?: string;
}

export interface ViolationType {
  id: string;
  name: string;
  description: string | null;
  created_at?: string;
}

export interface ProductionSection {
  id: string;
  name: string;
  created_at?: string;
}

export interface Violation {
  id: string;
  employee_id: string | null;
  employee_name: string | null;
  employee_code: string | null;
  employee_job_title: string | null;
  employee_department: string | null;
  violation_type_id: string | null;
  severity: SeverityLevel;
  status: ViolationStatus;
  inspector_name: string | null;
  notes: string | null;
  image_url: string | null;
  production_section: string | null;
  violation_date: string | null;
  created_at?: string;
  // Joined relation fields
  employees?: Partial<Employee> | null;
  violation_types?: Partial<ViolationType> | null;
}

export interface ViolationFilterParams {
  nameQ?: string;
  codeQ?: string;
  deptQ?: string;
  typeQ?: string;
  prodSectionQ?: string;
  from?: string;
  to?: string;
  status?: string;
}

export interface ReportCycle {
  id: string;
  label: string;
  from: string;
  to: string;
  current: boolean;
}

export interface ColumnDefinition<T = Violation> {
  header: string;
  sortKey?: string;
  value: (item: T) => string;
}
