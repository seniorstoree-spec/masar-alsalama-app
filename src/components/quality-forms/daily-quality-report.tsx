import React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQualityForm } from "@/hooks/useQualityForm";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Trash2, Plus, Save } from "lucide-react";
import { toast } from "sonner";

// Schema for defect fields - we use numbers to represent percentages or counts
const defectSchema = z.object({
  // حجم القطع
  overSize: z.number().min(0).default(0), // حتى 5%
  underSize: z.number().min(0).default(0), // حتى 5%
  // األوزان
  overWeight: z.number().min(0).default(0), // حتى 5%
  underWeight: z.number().min(0).default(0), // حتى 5%
  // التسوية
  darkColor: z.number().min(0).default(0), // حتى 5%
  lightColor: z.number().min(0).default(0), // حتى 5%
  burntParts: z.number().min(0).default(0), // صفر %
  // النسيج الداخلي
  sunkenProduct: z.number().min(0).default(0), // حتى 3%
  holes: z.number().min(0).default(0), // حتى 3%
  dryProduct: z.number().min(0).default(0), // حتى 3%
  doughyProduct: z.number().min(0).default(0), // حتى 3%
  unflakyProduct: z.number().min(0).default(0), // حتى 3%
  // الطعم
  bitterTaste: z.number().min(0).default(0), // صفر %
  rancidTaste: z.number().min(0).default(0), // صفر %
  // الحشو
  leakedFilling: z.number().min(0).default(0), // حتى 3%
  overFilled: z.number().min(0).default(0), // حتى 3%
  underFilled: z.number().min(0).default(0), // حتى 3%
  noFilling: z.number().min(0).default(0), // صفر %
  // التلميع
  heavyTexture: z.number().min(0).default(0), // حتى 3%
  lightTexture: z.number().min(0).default(0), // حتى 3%
  overGlazed: z.number().min(0).default(0), // حتى 5%
  underGlazed: z.number().min(0).default(0), // حتى 5%
  // المظهر الخارجي
  spotsOnSurface: z.number().min(0).default(0), // حتى 3%
  peeling: z.number().min(0).default(0), // حتى 3%
  cracks: z.number().min(0).default(0), // حتى 3%
  impurities: z.number().min(0).default(0), // صفر %
  // التغليف
  expirationDateIssue: z.number().min(0).default(0), // صفر %
  sealingIssue: z.number().min(0).default(0), // حتى 3%
  printingIssue: z.number().min(0).default(0), // حتى 3%
  // الرائحة
  undesirableOdor: z.number().min(0).default(0), // صفر %
});

const recordSchema = z.object({
  productName: z.string().min(1, "اسم المنتج مطلوب"),
  requiredQuantity: z.number().min(1, "كمية اإلنتاج المطلوبة مطلوبة"),
  sampleQuantity: z.number().min(1, "كمية العينة مطلوبة"),
  operationStage: z.string().min(1, "مرحلة التشغيل مطلوبة"),
  time: z.string().min(1, "الوقت مطلوب"),
  defects: defectSchema,
});

const formSchema = z.object({
  formDate: z.string().min(1, "التاريخ مطلوب"),
  supervisorName: z.string().min(1, "اسم المشرف مطلوب"),
  records: z.array(recordSchema).min(1, "يجب إضافة سجل واحد على الأقل"),
});

type FormValues = z.infer<typeof formSchema>;

const productsList = [
  "كرواسون ساده ميجا", "كرواسون جبنه بيضاء ميجا", "كرواسون شيكوالتة ميجا", "باتيه جبنة بيضاء هالوبينو",
  "باتيه جبنه بيضاء ميجا", "باتيه جبنه رومي ميجا", "بيتزا إيطالي ميجا", "دانش فواكه ميجا", "دانش كريمه ميجا",
  "دانش سكر ميجا", "دانش كريمة دايموند", "دانش فواكه وكريمة ميجا", "دانش شوكوالتة بندق ميجا", "بغاشة ميجا",
  "كرواسون كيندر", "كرواسون فيلد لوز", "كرواسون جبنه رومي", "كرواسون شوكوالته وكريمة تويست", "كرواسون لبنة زعتر",
  "كرواسون شيدر", "كرواسون شيكوالته بندق", "كرواسون سموك بيف", "كرواسون تركى", "كرواسون بسطرمة كيرى",
  "باتيه كيري بسطرمه", "آبل بـــاي", "منقوشة لبنة زعتر", "منقوشة تركي كيري", "منقوشة بيبروني", "منقوشة ايطالي",
  "منقوشة فراخ كريسبي", "منقوشة سجق", "باتيه صيامي سادة", "باتيه صيامي شيكوالتة", "دانش فواكه صيامي",
  "ساندويتش فاهيتا فراخ", "ساندويتش فاهيتا لحمه", "ساندويتش تونة بالمستردة", "ساندويتش سوسيس",
  "ساندويتش جبنه بالفلفل والزيتون", "ساندويتش بسطرمه بالجبنه الشيدر", "ميني ساندويتش", "سينامون كالسيك",
  "سينامون شيكوالتة", "سينامون كراميل", "سينامون تراميسيو", "دونتس مفتوح ميجا شيكوالتة",
  "دونتس مفتوح ميجا ابيض سبرينكيلز", "دونتس فيلد ميجا شيكوالتة", "دونتس شكوالته بندق", "دونتس بينك",
  "دونتس كوتن كاندى", "دونتس فيلد فسدق", "دونتس فيلد كوكيز اند كريم", "دونتس فيلد عجينه بندق", "دونتس فيلد لوتس",
  "دونتس فيلد كوكيز", "دونتس فيلد ترند دبي", "دونتس فيلد كيندر", "دونتس فيلد تشيز كيك راسبيري",
  "دونتس فيلد تشيز ريد فيلفيت", "دونتس شيكوالته ميجا ( صيامي )"
];

const operationStages = [
  "بداية التشغيل",
  "منتصف التشغيل",
  "نهاية التشغيل",
  "غير مخططه"
];

export function DailyQualityReportForm() {
  // Use "daily_quality_report" as expected by the prompt
  const { submitForm, isSubmitting } = useQualityForm("daily_quality_report" as any);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      formDate: new Date().toISOString().split('T')[0],
      supervisorName: "",
      records: [
        {
          productName: "",
          requiredQuantity: 0,
          sampleQuantity: 0,
          operationStage: "",
          time: "",
          defects: {
            overSize: 0, underSize: 0, overWeight: 0, underWeight: 0, darkColor: 0, lightColor: 0, burntParts: 0,
            sunkenProduct: 0, holes: 0, dryProduct: 0, doughyProduct: 0, unflakyProduct: 0, bitterTaste: 0, rancidTaste: 0,
            leakedFilling: 0, overFilled: 0, underFilled: 0, noFilling: 0, heavyTexture: 0, lightTexture: 0, overGlazed: 0, underGlazed: 0,
            spotsOnSurface: 0, peeling: 0, cracks: 0, impurities: 0, expirationDateIssue: 0, sealingIssue: 0, printingIssue: 0, undesirableOdor: 0
          }
        }
      ]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "records"
  });

  const onSubmit = async (data: FormValues) => {
    const success = await submitForm(
      { formDate: data.formDate, supervisorName: data.supervisorName },
      data.records
    );
    if (success) {
      form.reset();
    }
  };

  const renderDefectInput = (index: number, fieldName: keyof z.infer<typeof defectSchema>, label: string, limit: string) => {
    return (
      <div className="flex flex-col space-y-1 min-w-[120px]">
        <Label className="text-xs truncate" title={label}>{label}</Label>
        <div className="flex items-center space-x-1 space-x-reverse">
          <Input 
            type="number" 
            min="0"
            className="h-8"
            {...form.register(`records.${index}.defects.${fieldName}`, { valueAsNumber: true })}
          />
        </div>
        <span className="text-[10px] text-muted-foreground">{limit}</span>
      </div>
    );
  };

  return (
    <Card className="w-full border-none shadow-none" dir="rtl">
      <CardHeader>
        <CardTitle className="text-2xl text-center">تقرير الجودة اليومي</CardTitle>
        <CardDescription className="text-center">Daily Quality Report</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/50 p-4 rounded-lg">
            <div className="space-y-2">
              <Label>التاريخ</Label>
              <Input type="date" {...form.register("formDate")} />
              {form.formState.errors.formDate && <span className="text-sm text-destructive">{form.formState.errors.formDate.message}</span>}
            </div>
            <div className="space-y-2">
              <Label>اسم المشرف / مهندس الجودة</Label>
              <Input {...form.register("supervisorName")} placeholder="أدخل الاسم..." />
              {form.formState.errors.supervisorName && <span className="text-sm text-destructive">{form.formState.errors.supervisorName.message}</span>}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">سجالت الفحص</h3>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => append({
                  productName: "",
                  requiredQuantity: 0,
                  sampleQuantity: 0,
                  operationStage: "",
                  time: "",
                  defects: {
                    overSize: 0, underSize: 0, overWeight: 0, underWeight: 0, darkColor: 0, lightColor: 0, burntParts: 0,
                    sunkenProduct: 0, holes: 0, dryProduct: 0, doughyProduct: 0, unflakyProduct: 0, bitterTaste: 0, rancidTaste: 0,
                    leakedFilling: 0, overFilled: 0, underFilled: 0, noFilling: 0, heavyTexture: 0, lightTexture: 0, overGlazed: 0, underGlazed: 0,
                    spotsOnSurface: 0, peeling: 0, cracks: 0, impurities: 0, expirationDateIssue: 0, sealingIssue: 0, printingIssue: 0, undesirableOdor: 0
                  }
                })}
              >
                <Plus className="ml-2 h-4 w-4" /> إضافة سجل
              </Button>
            </div>

            {form.formState.errors.records && <span className="text-sm text-destructive">{form.formState.errors.records.root?.message}</span>}

            <div className="space-y-6">
              {fields.map((field, index) => (
                <Card key={field.id} className="relative overflow-hidden border-primary/20">
                  <div className="absolute top-2 left-2 z-10">
                    <Button 
                      type="button" 
                      variant="destructive" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <CardContent className="p-4 pt-6 space-y-4">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      <div className="space-y-2 lg:col-span-2">
                        <Label>اسم المنتج</Label>
                        <Select onValueChange={(val) => form.setValue(`records.${index}.productName`, val)}>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر المنتج" />
                          </SelectTrigger>
                          <SelectContent>
                            <ScrollArea className="h-60">
                              {productsList.map(p => (
                                <SelectItem key={p} value={p}>{p}</SelectItem>
                              ))}
                            </ScrollArea>
                          </SelectContent>
                        </Select>
                        {form.formState.errors.records?.[index]?.productName && 
                          <span className="text-xs text-destructive">{form.formState.errors.records[index]?.productName?.message}</span>}
                      </div>
                      
                      <div className="space-y-2">
                        <Label>كمية اإلنتاج المطلوبة</Label>
                        <Input type="number" {...form.register(`records.${index}.requiredQuantity`, { valueAsNumber: true })} />
                      </div>

                      <div className="space-y-2">
                        <Label>كمية العينة</Label>
                        <Input type="number" {...form.register(`records.${index}.sampleQuantity`, { valueAsNumber: true })} />
                      </div>

                      <div className="space-y-2">
                        <Label>مرحلة التشغيل</Label>
                        <Select onValueChange={(val) => form.setValue(`records.${index}.operationStage`, val)}>
                          <SelectTrigger>
                            <SelectValue placeholder="المرحلة" />
                          </SelectTrigger>
                          <SelectContent>
                            {operationStages.map(s => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>الساعه (الوقت)</Label>
                        <Input type="time" {...form.register(`records.${index}.time`)} />
                      </div>
                    </div>

                    <Separator />

                    {/* Defects Matrix */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm text-primary">العيوب ونسبها (أدخل العدد أو النسبة)</h4>
                      
                      <ScrollArea className="w-full whitespace-nowrap pb-4">
                        <div className="flex space-x-6 space-x-reverse min-w-max px-1">
                          
                          {/* حجم القطع */}
                          <div className="space-y-2 border-l pl-4 pb-2">
                            <h5 className="text-xs font-bold bg-muted p-1 rounded text-center">حجم القطع</h5>
                            <div className="flex space-x-2 space-x-reverse">
                              {renderDefectInput(index, "overSize", "حجم زائد", "حتى 5%")}
                              {renderDefectInput(index, "underSize", "حجم أقل", "حتى 5%")}
                            </div>
                          </div>

                          {/* األوزان */}
                          <div className="space-y-2 border-l pl-4 pb-2">
                            <h5 className="text-xs font-bold bg-muted p-1 rounded text-center">األوزان</h5>
                            <div className="flex space-x-2 space-x-reverse">
                              {renderDefectInput(index, "overWeight", "وزن زيادة", "حتى 5%")}
                              {renderDefectInput(index, "underWeight", "وزن أقل", "حتى 5%")}
                            </div>
                          </div>

                          {/* التسوية */}
                          <div className="space-y-2 border-l pl-4 pb-2">
                            <h5 className="text-xs font-bold bg-muted p-1 rounded text-center">التسوية</h5>
                            <div className="flex space-x-2 space-x-reverse">
                              {renderDefectInput(index, "darkColor", "لون داكن", "حتى 5%")}
                              {renderDefectInput(index, "lightColor", "لون فاتح", "حتى 5%")}
                              {renderDefectInput(index, "burntParts", "أجزاء محروقة", "صفر %")}
                            </div>
                          </div>

                          {/* النسيج الداخلي */}
                          <div className="space-y-2 border-l pl-4 pb-2">
                            <h5 className="text-xs font-bold bg-muted p-1 rounded text-center">النسيج الداخلي</h5>
                            <div className="flex space-x-2 space-x-reverse">
                              {renderDefectInput(index, "sunkenProduct", "منتج هابط", "حتى 3%")}
                              {renderDefectInput(index, "holes", "فراغات بالقطع", "حتى 3%")}
                              {renderDefectInput(index, "dryProduct", "منتج ناشف", "حتى 3%")}
                              {renderDefectInput(index, "doughyProduct", "منتج معجن", "حتى 3%")}
                              {renderDefectInput(index, "unflakyProduct", "منتج غير مورق", "حتى 3%")}
                            </div>
                          </div>

                          {/* الطعم */}
                          <div className="space-y-2 border-l pl-4 pb-2">
                            <h5 className="text-xs font-bold bg-muted p-1 rounded text-center">الطعم</h5>
                            <div className="flex space-x-2 space-x-reverse">
                              {renderDefectInput(index, "bitterTaste", "طعم مر", "صفر %")}
                              {renderDefectInput(index, "rancidTaste", "طعم متزنخ", "صفر %")}
                            </div>
                          </div>

                          {/* الحشو */}
                          <div className="space-y-2 border-l pl-4 pb-2">
                            <h5 className="text-xs font-bold bg-muted p-1 rounded text-center">الحشو</h5>
                            <div className="flex space-x-2 space-x-reverse">
                              {renderDefectInput(index, "leakedFilling", "خروج حشو", "حتى 3%")}
                              {renderDefectInput(index, "overFilled", "حشو زائد", "حتى 3%")}
                              {renderDefectInput(index, "underFilled", "حشو أقل", "حتى 3%")}
                              {renderDefectInput(index, "noFilling", "بدون حشو", "صفر %")}
                            </div>
                          </div>

                          {/* التلميع */}
                          <div className="space-y-2 border-l pl-4 pb-2">
                            <h5 className="text-xs font-bold bg-muted p-1 rounded text-center">التلميع</h5>
                            <div className="flex space-x-2 space-x-reverse">
                              {renderDefectInput(index, "heavyTexture", "قوام ثقيل", "حتى 3%")}
                              {renderDefectInput(index, "lightTexture", "قوام خفيف", "حتى 3%")}
                              {renderDefectInput(index, "overGlazed", "تلميع زائد", "حتى 5%")}
                              {renderDefectInput(index, "underGlazed", "تلميع أقل", "حتى 5%")}
                            </div>
                          </div>

                          {/* المظهر الخارجي */}
                          <div className="space-y-2 border-l pl-4 pb-2">
                            <h5 className="text-xs font-bold bg-muted p-1 rounded text-center">المظهر الخارجي</h5>
                            <div className="flex space-x-2 space-x-reverse">
                              {renderDefectInput(index, "spotsOnSurface", "بقع على السطح", "حتى 3%")}
                              {renderDefectInput(index, "peeling", "تقشير بالسطح", "حتى 3%")}
                              {renderDefectInput(index, "cracks", "تششق السطح", "حتى 3%")}
                              {renderDefectInput(index, "impurities", "شوائب وغريبة", "صفر %")}
                            </div>
                          </div>

                          {/* التغليف */}
                          <div className="space-y-2 border-l pl-4 pb-2">
                            <h5 className="text-xs font-bold bg-muted p-1 rounded text-center">التغليف</h5>
                            <div className="flex space-x-2 space-x-reverse">
                              {renderDefectInput(index, "expirationDateIssue", "تاريخ الصالحية", "صفر %")}
                              {renderDefectInput(index, "sealingIssue", "اللحام", "حتى 3%")}
                              {renderDefectInput(index, "printingIssue", "الطباعة", "حتى 3%")}
                            </div>
                          </div>

                          {/* الرائحة */}
                          <div className="space-y-2 pl-4 pb-2">
                            <h5 className="text-xs font-bold bg-muted p-1 rounded text-center">الرائحة</h5>
                            <div className="flex space-x-2 space-x-reverse">
                              {renderDefectInput(index, "undesirableOdor", "رائحة غير مرغوبة", "صفر %")}
                            </div>
                          </div>

                        </div>
                        <div className="mt-2 text-xs text-muted-foreground flex items-center">
                          <span className="inline-block w-3 h-3 rounded-full bg-primary/20 ml-2"></span>
                          اسحب لليسار لرؤية باقي الأعمدة
                        </div>
                      </ScrollArea>
                    </div>

                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
              <Save className="ml-2 h-4 w-4" />
              {isSubmitting ? "جاري الحفظ..." : "حفظ التقرير"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
