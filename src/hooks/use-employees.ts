/**
 * Custom React Query hooks for Employees
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { employeesService } from "@/services/api/employees-service";
import type { Employee } from "@/types";
import { toast } from "sonner";

export const EMPLOYEES_QUERY_KEY = ["employees"];
export const EMPLOYEES_MIN_QUERY_KEY = ["employees-min"];
export const EMPLOYEES_LOOKUP_QUERY_KEY = ["employees-lookup"];

/**
 * Hook to fetch full employee list.
 */
export function useEmployees() {
  return useQuery({
    queryKey: EMPLOYEES_QUERY_KEY,
    queryFn: () => employeesService.getEmployees(),
  });
}

/**
 * Hook to fetch minimal employee list for lookups/auto-complete.
 */
export function useMinimalEmployees() {
  return useQuery({
    queryKey: EMPLOYEES_MIN_QUERY_KEY,
    queryFn: () => employeesService.getMinimalEmployees(),
  });
}

/**
 * Hook to save (create or update) an employee.
 */
export function useSaveEmployee(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id?: string; payload: Partial<Employee> }) => {
      if (id) {
        await employeesService.updateEmployee(id, payload);
      } else {
        await employeesService.createEmployee(payload);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_MIN_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_LOOKUP_QUERY_KEY });
      toast.success(variables.id ? "تم التعديل" : "تمت الإضافة");
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "فشلت العملية");
    },
  });
}

/**
 * Hook to delete a single employee.
 */
export function useDeleteEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => employeesService.deleteEmployee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_MIN_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_LOOKUP_QUERY_KEY });
      toast.success("تم الحذف");
    },
    onError: (error: Error) => {
      toast.error(error.message || "فشل الحذف");
    },
  });
}

/**
 * Hook to bulk delete employees.
 */
export function useBulkDeleteEmployees(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => employeesService.bulkDeleteEmployees(ids),
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_MIN_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_LOOKUP_QUERY_KEY });
      toast.success(`تم حذف ${ids.length} موظف`);
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "فشل الحذف الجماعي");
    },
  });
}
