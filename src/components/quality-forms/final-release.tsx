"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";

import { useQualityForm } from "@/hooks/useQualityForm";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

const PRODUCT_LIST = [
  // Page 18
  "كرواسون سادة ميجا",
  "كرواسون جبنة بيضة ميجا",
  "كرواسون شوكوالته ميجا",
  "باتيه هالوبينو",
  "باتيه جبنة بيضة ميجا",
  "باتيه جبنة رومي ميجا",
  "بيتزا ايطالى ميجا",
  "دانش فواكه ميجا",
  "دانش كريمة ميجا",
  "دانش سكر ميجا",
  "دانيش كريمة دايموند",
  "دانيش فواكه و كريمة",
  "دانيش دايموند شيكوالته بندق",
  "بغاشة ميجا",
  "بايته صيامي ميجا",
  "باتيه صيامي شيكوالته",
  "دانش فواكه صيامي",
  "كرواسون كيندر",
  "كرواسون فيلد لوز",
  "كرواسون جبنه رومى",
  "كرواسون شوكوالته وكريمة تويست",
  "كرواسون لبنة زعتر",
  "كرواسون شيدر",
  "كرواسون شوكوالته بندق",
  "كرواسون سموك بيف",
  "كرواسون بسطرمة كيرى",
  "كرواسون تركى",
  "باتيه جبنه كيرى بسطرمة",
  "آبل بـــــاي",
  "منقوشة لبنه زعتر",
  "منقوشة تركي كيري",
  "منقوشة بيبروني",
  "منقوشة ايطالي",
  "منقوشة فراخ كريسبي",
  "منقوشة سجق",
  // Page 32
  "سندوتش فاهيتا فراخ ميجا",
  "ساندوتش فاهيتا لحمة ميجا",
  "سندوتش تونة ميجا",
  "ساندوتش سوسيس ميجا",
  "ساندوتش جبنة بالفلفل والزيتون ميجا",
  "ساندوتش بسطرمة بالجبنة الشيدر ميجا",
  "ميني ساندوتش ( ساليزون )",
  "سينامون رول ساده",
  "سينامون رول شوكوالتة",
  "سينامون رول كراميل",
  "سينامون رول تيرامسيو",
  "دونتس شوكوالته ميجا",
  "دونتس أبيض بالسبرينكلز ميجا",
  "دونتس شوكوالته بالسبرينكلز ميجا",
  "دونتس فيلد شوكوالتة ميجا",
  "دونتس شوكوالته ميجا ( صيامي )",
  "دونتس شيكوالته بندق",
  "دونتس ريسبيرى بينك",
  "دونتس كوتن كاندى",
  "دونتس فيلد فسدق",
  "دونتس فيلد كوكيز اند كريم",
  "دونتس فيلد عجينة بندق",
  "دونتس فيلد لوتس",
  "دونتس فيلد كوكيز",
  "دونتس فيلد ترند دبى",
  "دونتس فيلد كيندر",
  "دونتس فيلد تشيز كيك راسبيري",
  "دونتس فيلد تشيز ريد فيلفت",
];

const EVALUATION_ITEMS = [
  { id: "materials_conform", label: "جميع الخامات المستخدمة مطابقة" },
  { id: "ccp_oprp_conform", label: "جميع تقارير و نتائج متابعة CCP و OPRP مطابقة" },
  { id: "lab_results_conform", label: "نتائح تحاليل المعمل" },
  { id: "label_pack_conform", label: "مراجعة محتويات بطاقة البيانات و الصالحية و حالة العبوة الظاهرية" },
  { id: "customer_reqs_conform", label: "المنتج مطابق لشروط العميل" },
] as const;

const formSchema = z.object({
  formDate: z.string().min(1, "مطلوب"),
  supervisorName: z.string().min(1, "مطلوب"),
  storekeeperName: z.string().optional(),
  products: z.array(
    z.object({
      productName: z.string(),
      unit: z.string().default("قطعة"),
      quantity: z.string().optional(),
    })
  ),
  evaluations: z.record(
    z.enum(["مطابق", "غير مطابق", ""])
  ).optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function FinalReleaseForm() {
  const { submitForm, isSubmitting } = useQualityForm("final_release");

  const defaultValues: FormValues = {
    formDate: format(new Date(), "yyyy-MM-dd"),
    supervisorName: "",
    storekeeperName: "",
    products: PRODUCT_LIST.map((p) => ({
      productName: p,
      unit: "قطعة",
      quantity: "",
    })),
    evaluations: EVALUATION_ITEMS.reduce((acc, curr) => {
      acc[curr.id] = "";
      return acc;
    }, {} as Record<string, "مطابق" | "غير مطابق" | "">),
    notes: "",
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "products",
  });

  async function onSubmit(data: FormValues) {
    const filledProducts = data.products.filter(
      (p) => p.quantity && p.quantity.trim() !== ""
    );

    const recordData = {
      products: filledProducts,
      evaluations: data.evaluations,
      storekeeperName: data.storekeeperName,
      notes: data.notes,
    };

    await submitForm(
      { formDate: data.formDate, supervisorName: data.supervisorName },
      [recordData]
    );

    form.reset(defaultValues);
  }

  return (
    <div dir="rtl" className="max-w-5xl mx-auto py-6">
      <Card>
        <CardHeader className="text-center pb-8 border-b">
          <CardTitle className="text-3xl font-bold">إذن الإفراج عن المنتج التام</CardTitle>
          <div className="text-muted-foreground mt-2">قسم : المخبوزات</div>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-muted/30 rounded-lg">
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
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-semibold border-b pb-2">المنتجات</h3>
                <p className="text-sm text-muted-foreground mb-4">أدخل الكمية للمنتجات المطلوبة فقط (الوحدة: قطعة)</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-center space-x-2 space-x-reverse border-b pb-2">
                      <div className="flex-1 text-sm font-medium">
                        {form.watch(`products.${index}.productName`)}
                      </div>
                      <div className="w-24">
                        <FormField
                          control={form.control}
                          name={`products.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input type="number" placeholder="الكمية" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 mt-8">
                <h3 className="text-xl font-semibold border-b pb-2">البنود الواجب توافرها للإفراج عن المنتج وتخزينة</h3>
                <div className="space-y-6">
                  {EVALUATION_ITEMS.map((item) => (
                    <FormField
                      key={item.id}
                      control={form.control}
                      name={`evaluations.${item.id}`}
                      render={({ field }) => (
                        <FormItem className="space-y-3 p-4 bg-muted/20 rounded-md border">
                          <FormLabel className="text-base">{item.label}</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-row space-x-6 space-x-reverse"
                            >
                              <FormItem className="flex items-center space-x-2 space-x-reverse space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="مطابق" />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer">
                                  مطابق
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-2 space-x-reverse space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="غير مطابق" />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer text-destructive">
                                  غير مطابق
                                </FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-6 mt-8 p-4 bg-muted/30 rounded-lg">
                <h3 className="text-xl font-semibold border-b pb-2">القرار والتوقيعات</h3>
                
                <div className="bg-primary/10 p-4 rounded-md text-center text-primary font-medium mb-6">
                  القرار: يتم الإفراج عن المنتج ويسمح له بالخروج للعميل أو التداول أو التخزين
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ملاحظات</FormLabel>
                      <FormControl>
                        <Textarea placeholder="أضف أي ملاحظات هنا..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  <FormField
                    control={form.control}
                    name="supervisorName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>توقيع القائم بالإفراج عن المنتج (الاسم)</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="storekeeperName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>توقيع أمين المخزن / مسئول التوزيع (الاسم)</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-6">
                <Button type="submit" size="lg" disabled={isSubmitting} className="w-full md:w-auto px-8">
                  {isSubmitting ? "جاري الحفظ..." : "حفظ إذن الإفراج"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
