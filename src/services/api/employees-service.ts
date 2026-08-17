/**
 * Employee API Service
 * Encapsulates database CRUD, search, and Excel batch upsert operations for employees.
 */

import { supabase } from "@/integrations/supabase/client";
import type { Employee } from "@/types";

export const employeesService = {
  /**
   * Fetches all employees ordered alphabetically by name.
   */
  async getEmployees(): Promise<Employee[]> {
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;
    return (data || []) as Employee[];
  },

  /**
   * Fetches lightweight minimal employee list for lookup dropdowns/auto-complete.
   */
  async getMinimalEmployees(): Promise<Pick<Employee, "id" | "name" | "code" | "department" | "job_title">[]> {
    const { data, error } = await supabase
      .from("employees")
      .select("id, name, code, department, job_title")
      .order("name");

    if (error) throw error;
    return (data || []) as any[];
  },

  /**
   * Creates a single employee record.
   */
  async createEmployee(payload: Partial<Employee>): Promise<void> {
    const { error } = await supabase.from("employees").insert(payload as any);
    if (error) throw error;
  },

  /**
   * Updates an employee record by ID.
   */
  async updateEmployee(id: string, payload: Partial<Employee>): Promise<void> {
    const { error } = await supabase.from("employees").update(payload as any).eq("id", id);
    if (error) throw error;
  },

  /**
   * Deletes a single employee record by ID.
   */
  async deleteEmployee(id: string): Promise<void> {
    const { error } = await supabase.from("employees").delete().eq("id", id);
    if (error) throw error;
  },

  /**
   * Bulk deletes multiple employee records by an array of IDs.
   */
  async bulkDeleteEmployees(ids: string[]): Promise<void> {
    const { error } = await supabase.from("employees").delete().in("id", ids);
    if (error) throw error;
  },

  /**
   * Upserts a chunked array of employee records imported from Excel (on conflict code).
   */
  async upsertEmployeesBatch(records: Partial<Employee>[], chunkSize = 300): Promise<number> {
    let completedCount = 0;
    for (let i = 0; i < records.length; i += chunkSize) {
      const chunk = records.slice(i, i + chunkSize);
      const { error } = await supabase.from("employees").upsert(chunk as any, { onConflict: "code" });
      if (error) throw error;
      completedCount += chunk.length;
    }
    return completedCount;
  },
};
