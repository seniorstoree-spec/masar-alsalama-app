import { z } from "zod";

// Enum for all 12 valid form types
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

// 1. In Process Control (متابعة عوامل التشغيل)
export const inProcessControlRecordSchema = z.object({
  stage: z.string(),
  time: z.string(),
  temperature: z.string().optional(),
  productName: z.string(),
  doughThickness: z.string().optional(),
  concentration: z.string().optional(),
  packagingQuality: z.string().optional(),
});

// 2. Daily Quality Report (تقرير الجودة اليومي)
export const dailyQualityReportRecordSchema = z.object({
  productName: z.string(),
  stage: z.string(),
  time: z.string(),
  defects: z.object({
    size: z.enum(["conforming", "non_conforming"]),
    weight: z.enum(["conforming", "non_conforming"]),
    baking: z.enum(["conforming", "non_conforming"]),
    internalTexture: z.enum(["conforming", "non_conforming"]),
    taste: z.enum(["conforming", "non_conforming"]),
    filling: z.enum(["conforming", "non_conforming"]),
    glazing: z.enum(["conforming", "non_conforming"]),
    appearance: z.enum(["conforming", "non_conforming"]),
    packaging: z.enum(["conforming", "non_conforming"]),
    odor: z.enum(["conforming", "non_conforming"]),
  }),
});

// 3. Baking Temperature (مراقبة درجات حرارة تسوية المنتجات)
export const bakingTemperatureRecordSchema = z.object({
  productName: z.string(),
  time: z.string(),
  machineCode: z.string(),
  coreTemperature: z.number(),
  isConforming: z.boolean(),
  responsible: z.string(),
  correctiveAction: z.string().optional(),
  verifier: z.string().optional(),
});

// 4. Metal Detector (مراقبة جهاز كاشف المعادن)
export const metalDetectorRecordSchema = z.object({
  time: z.string(),
  machineCode: z.string(),
  ssResult: z.boolean(),
  nfeResult: z.boolean(),
  feResult: z.boolean(),
  responsible: z.string(),
  correctiveAction: z.string().optional(),
  verifier: z.string().optional(),
});

// 5. Sifting (مراقبة النخل)
export const siftingRecordSchema = z.object({
  productName: z.string(),
  time: z.string(),
  isConforming: z.boolean(),
  responsible: z.string(),
  correctiveAction: z.string().optional(),
  verification: z.string().optional(),
  notes: z.string().optional(),
});

// 6. Sensory Evaluation (التقييم الحسي للأغذية)
export const sensoryEvaluationRecordSchema = z.object({
  productName: z.string(),
  time: z.string(),
  sampleNumber: z.string(),
  colorScore: z.number().min(0).max(10),
  tasteScore: z.number().min(0).max(10),
  smellScore: z.number().min(0).max(10),
  textureScore: z.number().min(0).max(10),
  generalImpression: z.string(),
  notes: z.string().optional(),
});

// 7. Non Conforming (بيان بالمنتجات غير المطابقة)
export const nonConformingRecordSchema = z.object({
  productName: z.string(),
  productionQuantity: z.number(),
  defectsDiscovered: z.string(),
  defectiveQuantity: z.number(),
  defectPercentage: z.number(),
  rootCause: z.string(),
  correction: z.string(),
  signature: z.string(),
});

// 8. Cleaning (متابعة النظافة والتطهير)
export const cleaningRecordSchema = z.object({
  equipmentName: z.string(),
  equipmentCode: z.string().optional(),
  morningShiftStart: z.boolean(),
  morningShiftEnd: z.boolean(),
  eveningShiftStart: z.boolean(),
  eveningShiftEnd: z.boolean(),
  notes: z.string().optional(),
});

// 9. Food Safety (التحقق من اشتراطات سلامة الغذاء)
export const foodSafetyRecordSchema = z.object({
  checkpoint: z.string(),
  morningShiftStart: z.boolean(),
  morningShiftMid: z.boolean(),
  eveningShiftStart: z.boolean(),
  eveningShiftMid: z.boolean(),
  notes: z.string().optional(),
});

// 10. Final Release (إذن الإفراج عن المنتج التام)
export const finalReleaseRecordSchema = z.object({
  productName: z.string(),
  unit: z.string(),
  quantity: z.number(),
  materialsConform: z.boolean(),
  ccpOprpConform: z.boolean(),
  labResults: z.boolean(),
  labelValidity: z.boolean(),
  customerRequirements: z.boolean(),
  decision: z.string(),
  notes: z.string().optional(),
});

// 11. Weight Monitoring (متابعة أوزان منتجات قسم المخبوزات) - Excludes pages 6-9
export const weightMonitoringRecordSchema = z.object({
  productName: z.string(),
  time: z.string(),
  doughWeight: z.string(),
  afterBakingWeight: z.string(),
  afterFinishingWeight: z.string().optional(),
});

// 12. Additives Weights (مراقبة أوزان المواد المضافة)
export const additivesWeightsRecordSchema = z.object({
  productName: z.string(),
  additiveName: z.string(),
  batchNumber: z.string(),
  time: z.string(),
  actualWeight: z.string(),
  isConforming: z.boolean(),
  responsiblePerson: z.string(),
  correctiveAction: z.string().optional(),
  verifierSignature: z.string().optional(),
});

// Combined schema parser for reading records from the DB securely
export const qualityFormSchemas = {
  in_process_control: inProcessControlRecordSchema,
  daily_quality_report: dailyQualityReportRecordSchema,
  baking_temperature: bakingTemperatureRecordSchema,
  metal_detector: metalDetectorRecordSchema,
  sifting: siftingRecordSchema,
  sensory_evaluation: sensoryEvaluationRecordSchema,
  non_conforming: nonConformingRecordSchema,
  cleaning: cleaningRecordSchema,
  food_safety: foodSafetyRecordSchema,
  final_release: finalReleaseRecordSchema,
  weight_monitoring: weightMonitoringRecordSchema,
  additives_weights: additivesWeightsRecordSchema,
};

// Generic validation function for the application layer
export function validateQualityFormRecord(formType: QualityFormType, data: unknown) {
  const schema = qualityFormSchemas[formType];
  if (!schema) {
    throw new Error(`Schema not found for form type: ${formType}`);
  }
  return schema.parse(data);
}
