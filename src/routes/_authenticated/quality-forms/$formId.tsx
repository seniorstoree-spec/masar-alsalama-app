import { createFileRoute, useParams } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { InProcessControlForm } from "@/components/quality-forms/in-process-control";
import { DailyQualityReportForm } from "@/components/quality-forms/daily-quality-report";
import { BakingTemperatureForm } from "@/components/quality-forms/baking-temperature";
import { MetalDetectorForm } from "@/components/quality-forms/metal-detector";
import { SiftingForm } from "@/components/quality-forms/sifting";
import { SensoryEvaluationForm } from "@/components/quality-forms/sensory-evaluation";
import { NonConformingForm } from "@/components/quality-forms/non-conforming";
import { CleaningForm } from "@/components/quality-forms/cleaning";
import { FoodSafetyForm } from "@/components/quality-forms/food-safety";
import { WeightMonitoringForm } from "@/components/quality-forms/weight-monitoring";
import { AdditivesWeightsForm } from "@/components/quality-forms/additives-weights";
import { FinalReleaseForm } from "@/components/quality-forms/final-release";

export const Route = createFileRoute("/_authenticated/quality-forms/$formId")({
  component: QualityFormView,
});

function QualityFormView() {
  const { formId } = useParams({ from: "/_authenticated/quality-forms/$formId" });

  const formTitleMap: Record<string, string> = {
    in_process_control: "متابعة عوامل التشغيل وأوزان الخامات",
    daily_quality_report: "تقرير الجودة اليومي",
    baking_temperature: "مراقبة درجات حرارة تسوية المنتجات",
    metal_detector: "مراقبة جهاز كاشف المعادن",
    sifting: "مراقبة النخل",
    sensory_evaluation: "التقييم الحسي للأغذية",
    non_conforming: "بيان بالمنتجات غير المطابقة",
    cleaning: "متابعة النظافة والتطهير",
    food_safety: "التحقق من اشتراطات سلامة الغذاء",
    weight_monitoring: "متابعة أوزان منتجات قسم المخبوزات",
    additives_weights: "مراقبة أوزان المواد المضافة",
    final_release: "إذن الإفراج عن المنتج التام",
  };

  const title = formTitleMap[formId] || "نموذج جودة";

  const renderForm = () => {
    switch (formId) {
      case "in_process_control": return <InProcessControlForm />;
      case "daily_quality_report": return <DailyQualityReportForm />;
      case "baking_temperature": return <BakingTemperatureForm />;
      case "metal_detector": return <MetalDetectorForm />;
      case "sifting": return <SiftingForm />;
      case "sensory_evaluation": return <SensoryEvaluationForm />;
      case "non_conforming": return <NonConformingForm />;
      case "cleaning": return <CleaningForm />;
      case "food_safety": return <FoodSafetyForm />;
      case "weight_monitoring": return <WeightMonitoringForm />;
      case "additives_weights": return <AdditivesWeightsForm />;
      case "final_release": return <FinalReleaseForm />;
      default: return <p>Form not found.</p>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" dir="rtl">
      <div className="flex items-center gap-4">
        <Link to="/quality-forms">
          <Button variant="outline" size="icon">
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-500 mt-1">تعبئة نموذج: {title}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        {renderForm()}
      </div>
    </div>
  );
}
