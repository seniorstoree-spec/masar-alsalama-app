import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ClipboardCheck, ThermometerSun, AlertTriangle, ShieldCheck, FileCheck2, Brush, Scale, Droplets } from "lucide-react";

export const Route = createFileRoute("/_authenticated/quality-forms/")({
  component: QualityFormsDashboard,
});

const formsList = [
  {
    id: "in_process_control",
    title: "متابعة عوامل التشغيل وأوزان الخامات",
    description: "نموذج متابعة عوامل التشغيل وأوزان الخامات أثناء العملية الإنتاجية",
    icon: ClipboardCheck,
    color: "text-blue-500",
  },
  {
    id: "daily_quality_report",
    title: "تقرير الجودة اليومي",
    description: "التقرير اليومي لمتابعة جودة المنتجات (أوزان، تسوية، حشو، الخ)",
    icon: FileCheck2,
    color: "text-green-500",
  },
  {
    id: "baking_temperature",
    title: "مراقبة درجات حرارة تسوية المنتجات",
    description: "سجل مراقبة درجات الحرارة لمركز المنتج بعد التسوية",
    icon: ThermometerSun,
    color: "text-orange-500",
  },
  {
    id: "metal_detector",
    title: "مراقبة جهاز كاشف المعادن",
    description: "متابعة كفاءة عمل كاشف المعادن على فترات زمنية",
    icon: ShieldCheck,
    color: "text-gray-600",
  },
  {
    id: "sifting",
    title: "مراقبة النخل",
    description: "التحقق من سلامة وكفاءة عمل المناخل",
    icon: Droplets, // approximate icon for sifting/filtering
    color: "text-teal-500",
  },
  {
    id: "sensory_evaluation",
    title: "التقييم الحسي للأغذية",
    description: "التقييم الحسي لمنتجات المخبوزات والمنتجات الصيامي",
    icon: Brush, // approximate icon for sensory
    color: "text-purple-500",
  },
  {
    id: "non_conforming",
    title: "بيان بالمنتجات غير المطابقة",
    description: "تسجيل المنتجات غير المطابقة للمواصفات",
    icon: AlertTriangle,
    color: "text-red-500",
  },
  {
    id: "cleaning",
    title: "متابعة النظافة والتطهير",
    description: "متابعة أعمال النظافة والتطهير للأدوات والمعدات بالقسم",
    icon: ClipboardCheck,
    color: "text-cyan-500",
  },
  {
    id: "food_safety",
    title: "التحقق من اشتراطات سلامة الغذاء",
    description: "متابعة اشتراطات النظافة الشخصية وبيئة العمل",
    icon: ShieldCheck,
    color: "text-emerald-500",
  },
  {
    id: "weight_monitoring",
    title: "متابعة أوزان منتجات قسم المخبوزات",
    description: "تسجيل أوزان المنتجات قبل وبعد التسوية والفنش",
    icon: Scale,
    color: "text-indigo-500",
  },
  {
    id: "additives_weights",
    title: "مراقبة أوزان المواد المضافة",
    description: "مراقبة الحدود الحرجة لإضافة المواد مثل ملح الليمون والألوان",
    icon: Scale,
    color: "text-violet-500",
  },
  {
    id: "final_release",
    title: "إذن الإفراج عن المنتج التام",
    description: "القرار النهائي للإفراج عن المنتج للعميل أو التخزين",
    icon: FileCheck2,
    color: "text-green-600",
  },
];

function QualityFormsDashboard() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">نماذج الجودة</h1>
        <p className="text-gray-500 mt-1">اختر النموذج المطلوب تعبئته أو مراجعته من القائمة أدناه</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {formsList.map((form) => (
          <Link key={form.id} to={`/quality-forms/${form.id}`} className="block transition-transform hover:-translate-y-1">
            <Card className="h-full hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className={`p-3 rounded-lg bg-gray-50 ${form.color}`}>
                  <form.icon className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-lg leading-tight">{form.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">{form.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
