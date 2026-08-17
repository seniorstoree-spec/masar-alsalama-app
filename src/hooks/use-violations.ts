/**
 * Custom React Query hooks for Violations
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { violationsService } from "@/services/api/violations-service";
import type { Violation } from "@/types";
import { toast } from "sonner";

export const VIOLATIONS_QUERY_KEY = ["violations"];
export const DASHBOARD_VIOLATIONS_QUERY_KEY = ["dashboard-violations"];
export const SECTION_VIOLATIONS_QUERY_KEY = ["section-violations"];
export const REPORTS_VIOLATIONS_QUERY_KEY = ["reports-violations"];

/**
 * Hook to fetch all violations.
 */
export function useViolations(queryKey = VIOLATIONS_QUERY_KEY) {
  return useQuery({
    queryKey,
    queryFn: () => violationsService.getViolations(),
  });
}

/**
 * Hook to create or update a violation.
 */
export function useSaveViolation(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id?: string; payload: Partial<Violation> }) => {
      if (id) {
        await violationsService.updateViolation(id, payload);
      } else {
        await violationsService.createViolation(payload);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: VIOLATIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_VIOLATIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: SECTION_VIOLATIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: REPORTS_VIOLATIONS_QUERY_KEY });
      toast.success(variables.id ? "تم التعديل" : "تم تسجيل المخالفة");
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "فشلت العملية");
    },
  });
}

/**
 * Hook to delete a violation.
 */
export function useDeleteViolation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => violationsService.deleteViolation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VIOLATIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_VIOLATIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: SECTION_VIOLATIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: REPORTS_VIOLATIONS_QUERY_KEY });
      toast.success("تم الحذف");
    },
    onError: (error: Error) => {
      toast.error(error.message || "فشل الحذف");
    },
  });
}
