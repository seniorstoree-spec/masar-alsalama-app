/**
 * Production Sections API Service
 */

import { supabase } from "@/integrations/supabase/client";
import type { ProductionSection } from "@/types";

export const productionSectionsService = {
  /**
   * Fetches all production sections ordered by name.
   */
  async getProductionSections(): Promise<ProductionSection[]> {
    const { data, error } = await supabase
      .from("production_sections")
      .select("*")
      .order("name");

    if (error) throw error;
    return (data || []) as ProductionSection[];
  },

  /**
   * Adds a new production section.
   */
  async createProductionSection(name: string): Promise<void> {
    const trimmed = name.trim();
    if (!trimmed) throw new Error("الاسم مطلوب");
    const { error } = await supabase.from("production_sections").insert({ name: trimmed });
    if (error) {
      if (error.code === "23505") throw new Error("هذا القسم موجود بالفعل");
      throw error;
    }
  },

  /**
   * Updates an existing production section name.
   */
  async updateProductionSection(id: string, name: string): Promise<void> {
    const trimmed = name.trim();
    if (!trimmed) throw new Error("الاسم مطلوب");
    const { error } = await supabase.from("production_sections").update({ name: trimmed }).eq("id", id);
    if (error) {
      if (error.code === "23505") throw new Error("هذا القسم موجود بالفعل");
      throw error;
    }
  },

  /**
   * Deletes a production section by ID.
   */
  async deleteProductionSection(id: string): Promise<void> {
    const { error } = await supabase.from("production_sections").delete().eq("id", id);
    if (error) throw error;
  },
};
