import React, { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQualityForm } from "@/hooks/useQualityForm";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Save, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const CATEGORIES = {
  general: "منتجات المخبوزات",
  fasting: "منتجات قسم المخبوزات (صيامي)",
  cinnamon_donuts: "منتجات السينامون والساندويتشات والدونتس",
} as const;

const PRODUCTS_MAP = {
  general: [
    "دانش كريمه", "دانش فواكه", "دانش سكر", "دانش كريمة دايموند", "دانش دايموند شيكوالته بندق",
    "دانش فواكه و كريمة", "بيتزا إيطالي", "كرواسون ساده", "كرواسون جبنه بيضاء", "كرواسون جبن رومي",
    "كرواسون شيكوالتة", "كرواسون نوتيال", "كرواسون فيلد لوز", "كرواسون كيندر", "كرواسون شوكوالته وكريمة تويست",
    "بغاشة", "باتيه جبنه بيضاء", "باتيه جبن رومي", "باتيه جبن كيري بسطرمه", "باتيه هالوبيمو",
    "كرواسون لبنة زعتر", "كرواسون شيدر", "كرواسون سموك بيف", "كرواسون بسطرمة كيرى", "كرواسون تركى",
    "منقوشة تركي كيري", "منقوشة لبنه زعتر", "منقوشة سجق", "منقوشة ايطالي", "منقوشة بيبروني",
    "منقوشة فراخ كريسبي", "آبل بــــاي"
  ],
  fasting: [
    "باتيه صيامي ساده", "باتيه صيامي شيكوالتة", "دونتس شيكوالتة صيامي", "دانش فواكه صيامي"
  ],
  cinnamon_donuts: [
    "سينامون ( كالسيك - شيكوالتة )", "سينامون ( كراميل - ترامسيو )", "ساندويتش ( جبنه بيضاء بالزيتون - تونة بالمستردة )",
    "ساندويتش ( فاهيتا فراخ - فاهيتا لحمه - سوسيس )", "ساندويتش ( بسطرمه بالشيدر )", "ميني ساندويتش (فلمنك - جبن يوناني - تونة - سوسيس)",
    "ميني ساندويتش (بانيه - تركي مدخن - شاورما فراخ )", "دونتس شيكوالتة", "دونتس شيكوالتة بالـ سبرينكلز",
    "دونتس أبيض بالـ سبرينكلز", "دونتس فيلد شيكوالتة", "دونتس شيكوالتة بندق", "دونتس رسبيري بينك",
    "دونتس كوتن كاندي", "دونتس فيلد فسدق", "دونتس فيلد كوكيز اند كريم", "دونتس فيلد عجينة بندق",
    "دونتس فيلد لوتس", "دونتس فيلد كوكيز", "دونتس فيلد ترند دبي", "دونتس فيلد تشيز ريد فلفيت",
    "دونتس فيلد كيندر", "دونتس فيلد تشيز كيك راسبيري"
  ]
};

const evaluationSchema = z.object({
  productName: z.string(),
  time: z.string().optional(),
  sampleNumber: z.string().optional(),
  color: z.union([z.number().min(0).max(10), z.nan()]).optional().or(z.string().transform(v => v === "" ? undefined : Number(v))),
  taste: z.union([z.number().min(0).max(10), z.nan()]).optional().or(z.string().transform(v => v === "" ? undefined : Number(v))),
  smell: z.union([z.number().min(0).max(10), z.nan()]).optional().or(z.string().transform(v => v === "" ? undefined : Number(v))),
  texture: z.union([z.number().min(0).max(10), z.nan()]).optional().or(z.string().transform(v => v === "" ? undefined : Number(v))),
  generalImpression: z.union([z.number().min(0).max(10), z.nan()]).optional().or(z.string().transform(v => v === "" ? undefined : Number(v))),
  notes: z.string().optional(),
});

const formSchema = z.object({
  formDate: z.string().min(1, { message: "التاريخ مطلوب" }),
  supervisorName: z.string().min(1, { message: "اسم القائم بالفحص مطلوب" }),
  sampleType: z.enum(["daily", "new"], { required_error: "برجاء اختيار نوع العينة" }),
  category: z.enum(["general", "fasting", "cinnamon_donuts"]),
  evaluations: z.array(evaluationSchema),
});

type FormValues = z.infer<typeof formSchema>;

export function SensoryEvaluationForm() {
  const { submitForm, isSubmitting } = useQualityForm("sensory_evaluation");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      formDate: new Date().toISOString().split("T")[0],
      supervisorName: "",
      sampleType: "daily",
      category: "general",
      evaluations: PRODUCTS_MAP.general.map(p => ({
        productName: p,
        time: "",
        sampleNumber: "",
        notes: "",
      })),
    },
  });

  const { fields, replace } = useFieldArray({
    name: "evaluations",
    control: form.control,
  });

  const selectedCategory = form.watch("category");

  useEffect(() => {
    // When category changes, update the evaluations array
    const products = PRODUCTS_MAP[selectedCategory];
    replace(products.map(p => ({
      productName: p,
      time: "",
      sampleNumber: "",
      notes: "",
    })));
  }, [selectedCategory, replace]);

  const onSubmit = async (values: FormValues) => {
    const records = values.evaluations
      .filter(ev => ev.time || ev.sampleNumber || typeof ev.color === 'number' || typeof ev.taste === 'number' || typeof ev.smell === 'number' || typeof ev.texture === 'number' || typeof ev.generalImpression === 'number' || ev.notes)
      .map(ev => ({
        product_name: ev.productName,
        time: ev.time,
        sample_number: ev.sampleNumber,
        color: ev.color,
        taste: ev.taste,
        smell: ev.smell,
        texture: ev.texture,
        general_impression: ev.generalImpression,
        notes: ev.notes,
        sample_type: values.sampleType,
        category: CATEGORIES[values.category],
      }));
      
    if (records.length === 0) {
      form.setError("root", { message: "برجاء إدخال تقييم واحد على الأقل" });
      return;
    }

    const success = await submitForm(
      { formDate: values.formDate, supervisorName: values.supervisorName },
      records
    );

    if (success) {
      form.reset({
        ...values,
        evaluations: PRODUCTS_MAP[values.category].map(p => ({
          productName: p,
          time: "",
          sampleNumber: "",
          notes: "",
        }))
      });
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle>التقييم الحسي للأغذية</CardTitle>
          <CardDescription>
            إدارة تأكيد الجودة - نموذج التقييم الحسي
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {form.formState.errors.root && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>خطأ</AlertTitle>
                  <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <FormField
                  control={form.control}
                  name="formDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>التاريخ</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="supervisorName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>القائم بالفحص</FormLabel>
                      <FormControl>
                        <Input placeholder="اسم القائم بالفحص" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sampleType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>نوع العينة</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-row space-x-4 space-x-reverse"
                        >
                          <FormItem className="flex items-center space-x-2 space-x-reverse space-y-0">
                            <FormControl>
                              <RadioGroupItem value="daily" />
                            </FormControl>
                            <FormLabel className="font-normal">منتج يومى</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-x-reverse space-y-0">
                            <FormControl>
                              <RadioGroupItem value="new" />
                            </FormControl>
                            <FormLabel className="font-normal">عينة جديدة</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>فئة المنتجات</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الفئة" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(CATEGORIES).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="bg-muted p-4 rounded-lg flex gap-6 text-sm">
                <div><strong>دليل التقييم (MATRIX):</strong></div>
                <div>مرفوض: 0-4</div>
                <div>مقبول: 5-6</div>
                <div>جيد: 7-8</div>
                <div>جيد جداً: 9</div>
                <div>ممتاز: 10</div>
              </div>

              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px] text-center">م</TableHead>
                      <TableHead className="min-w-[200px]">اسم الصنف</TableHead>
                      <TableHead className="w-[100px]">الوقت</TableHead>
                      <TableHead className="w-[100px]">رقم العينة</TableHead>
                      <TableHead className="w-[80px]">اللون</TableHead>
                      <TableHead className="w-[80px]">الطعم</TableHead>
                      <TableHead className="w-[80px]">الرائحة</TableHead>
                      <TableHead className="w-[80px]">القوام</TableHead>
                      <TableHead className="w-[100px]">اإلنطباع العام</TableHead>
                      <TableHead className="min-w-[150px]">المالحظات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => (
                      <TableRow key={field.id}>
                        <TableCell className="text-center">{index + 1}</TableCell>
                        <TableCell className="font-medium text-sm">
                          {field.productName}
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`evaluations.${index}.time`}
                            render={({ field }) => (
                              <Input type="time" className="h-8 px-2" {...field} />
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`evaluations.${index}.sampleNumber`}
                            render={({ field }) => (
                              <Input className="h-8 px-2" {...field} />
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`evaluations.${index}.color`}
                            render={({ field }) => (
                              <Input type="number" min="0" max="10" className="h-8 px-2 text-center" {...field} />
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`evaluations.${index}.taste`}
                            render={({ field }) => (
                              <Input type="number" min="0" max="10" className="h-8 px-2 text-center" {...field} />
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`evaluations.${index}.smell`}
                            render={({ field }) => (
                              <Input type="number" min="0" max="10" className="h-8 px-2 text-center" {...field} />
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`evaluations.${index}.texture`}
                            render={({ field }) => (
                              <Input type="number" min="0" max="10" className="h-8 px-2 text-center" {...field} />
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`evaluations.${index}.generalImpression`}
                            render={({ field }) => (
                              <Input type="number" min="0" max="10" className="h-8 px-2 text-center" {...field} />
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`evaluations.${index}.notes`}
                            render={({ field }) => (
                              <Input className="h-8 px-2" {...field} />
                            )}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
                  <Save className="w-4 h-4 ml-2" />
                  {isSubmitting ? "جاري الحفظ..." : "حفظ التقييم"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

export default SensoryEvaluationForm;
