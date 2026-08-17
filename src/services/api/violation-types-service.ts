/**
 * Violation Types API Service
 */

import { supabase } from "@/integrations/supabase/client";
import type { ViolationType } from "@/types";

export const violationTypesService = {
  /**
   * Fetches all violation types ordered by name.
   */
  async getViolationTypes(): Promise<ViolationType[]> {
    const { data, error } = await supabase
      .from("violation_types")
      .select("*")
      .order("name");

    if (error) throw error;
    return (data || []) as ViolationType[];
  },

  /**
   * Creates a new violation type.
   */
  async createViolationType(payload: Partial<ViolationType>): Promise<void> {
    const { error } = await supabase.from("violation_types").insert(payload as any);
    if (error) throw error;
  },

  /**
   * Updates an existing violation type.
   */
  async updateViolationType(id: string, payload: Partial<ViolationType>): Promise<void> {
    const { error } = await supabase.from("violation_types").update(payload as any).eq("id", id);
    if (error) throw error;
  },

  /**
   * Deletes a violation type by ID.
   */
  async deleteViolationType(id: string): Promise<void> {
    const { error } = await supabase.from("violation_types").delete().eq("id", id);
    if (error) throw error;
  },
};
