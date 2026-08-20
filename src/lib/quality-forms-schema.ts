import { z } from "zod";

export const formTypeSchema = z.enum([
  "in_process_control",
  "daily_quality_report",
  "baking_temperature",
  "metal_detector",
  "sifting",
  "sensory_evaluation",
  "non_conforming",
  "cleaning",
  "food_safety",
  "final_release",
  "weight_monitoring",
  "additives_weights",
]);

export type QualityFormType = z.infer<typeof formTypeSchema>;

// Base Record schema that all specific record types will extend (implicitly or explicitly)
export const baseRecordSchema = z.object({
  id: z.string().uuid().optional(),
  created_at: z.string().optional(),
});

// Since each form has totally different structured fields, 
// we will export individual record schemas when we implement each form.
// For now, a generic record type
export const genericRecordSchema = baseRecordSchema.catchall(z.any());

export type GenericRecord = z.infer<typeof genericRecordSchema>;
