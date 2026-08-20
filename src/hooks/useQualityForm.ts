import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { QualityFormType } from "@/lib/quality-forms-schema";

export function useQualityForm(formType: QualityFormType) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitForm = async (
    metadata: { formDate: string; supervisorName: string },
    records: any[]
  ) => {
    setIsSubmitting(true);
    try {
      // 1. Create form metadata
      const { data: formData, error: formError } = await supabase
        .from("quality_forms")
        .insert({
          form_type: formType,
          form_date: metadata.formDate,
          supervisor_name: metadata.supervisorName,
        })
        .select()
        .single();

      if (formError) throw formError;

      // 2. Insert all records
      const recordsToInsert = records.map((record) => ({
        form_id: formData.id,
        record_data: record,
      }));

      const { error: recordsError } = await supabase
        .from("quality_form_records")
        .insert(recordsToInsert);

      if (recordsError) throw recordsError;

      toast.success("تم حفظ النموذج بنجاح");
      return true;
    } catch (error: any) {
      console.error("Error saving form:", error);
      toast.error("حدث خطأ أثناء حفظ النموذج");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { submitForm, isSubmitting };
}
