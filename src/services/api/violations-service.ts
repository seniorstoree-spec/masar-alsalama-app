/**
 * Violation API Service
 * Encapsulates Supabase database operations and storage operations for violations.
 */

import { supabase } from "@/integrations/supabase/client";
import type { Violation } from "@/types";

export const violationsService = {
  /**
   * Fetches all violations joined with employee and violation_type details.
   */
  async getViolations(): Promise<Violation[]> {
    const { data, error } = await supabase
      .from("violations")
      .select("*, employees(id, name, code, department, job_title), violation_types(id, name)")
      .order("violation_date", { ascending: false });

    if (error) throw error;
    return (data || []) as Violation[];
  },

  /**
   * Creates a new violation record.
   */
  async createViolation(payload: Partial<Violation>): Promise<void> {
    const { error } = await supabase.from("violations").insert(payload as any);
    if (error) throw error;
  },

  /**
   * Updates an existing violation record by ID.
   */
  async updateViolation(id: string, payload: Partial<Violation>): Promise<void> {
    const { error } = await supabase.from("violations").update(payload as any).eq("id", id);
    if (error) throw error;
  },

  /**
   * Deletes a violation record by ID.
   */
  async deleteViolation(id: string): Promise<void> {
    const { error } = await supabase.from("violations").delete().eq("id", id);
    if (error) throw error;
  },

  /**
   * Resolves a signed URL for a given storage path or returns the original string if it is an HTTP URL.
   */
  async getSignedImageUrl(path: string, expiresIn = 3600): Promise<string> {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;

    const { data, error } = await supabase.storage
      .from("violation-images")
      .createSignedUrl(path, expiresIn);

    if (error || !data?.signedUrl) return "";
    return data.signedUrl;
  },

  /**
   * Uploads an image file to the violation-images bucket.
   */
  async uploadViolationImage(file: File): Promise<string> {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `violations/${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from("violation-images")
      .upload(path, file, { contentType: file.type });

    if (error) throw error;
    return path;
  },
};
