import React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQualityForm } from "@/hooks/useQualityForm";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";

const recordSchema = z.object({
  product: z.string().min(1, "مطلوب"),
  productionQuantity: z.string().min(1, "مطلوب"),
  defectsDetected: z.string().min(1, "مطلوب"),
  defectiveQuantity: z.string().min(1, "مطلوب"),
  defectivePercentage: z.string().min(1, "مطلوب"),
  rootCause: z.string().min(1, "مطلوب"),
  correction: z.string().min(1, "مطلوب"),
  signature: z.string().min(1, "مطلوب"),
});

const formSchema = z.object({
  formDate: z.string().min(1, "مطلوب"),
  supervisorName: z.string().min(1, "مطلوب"),
  records: z.array(recordSchema).min(1, "يجب إضافة سجل واحد على الأقل"),
});

export function NonConformingForm() {
  const { submitForm, isSubmitting } = useQualityForm("non_conforming");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      formDate: new Date().toISOString().split('T')[0],
      supervisorName: "",
      records: [{ product: "", productionQuantity: "", defectsDetected: "", defectiveQuantity: "", defectivePercentage: "", rootCause: "", correction: "", signature: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "records",
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const metadata = {
      formDate: values.formDate,
      supervisorName: values.supervisorName,
    };
    await submitForm(metadata, values.records);
    form.reset({ ...values, records: [{ product: "", productionQuantity: "", defectsDetected: "", defectiveQuantity: "", defectivePercentage: "", rootCause: "", correction: "", signature: "" }] });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8" dir="rtl">
        <Card>
          <CardHeader>
            <CardTitle>بيان بالمنتجات غير المطابقة</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <FormLabel>المسئول / المشرف</FormLabel>
                  <FormControl>
                    <Input placeholder="اسم المسئول" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">المنتجات غير المطابقة</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ product: "", productionQuantity: "", defectsDetected: "", defectiveQuantity: "", defectivePercentage: "", rootCause: "", correction: "", signature: "" })}
            >
              <Plus className="w-4 h-4 ml-2" />
              إضافة منتج
            </Button>
          </div>

          {fields.map((field, index) => (
            <Card key={field.id} className="relative">
              <CardContent className="pt-6">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 left-2 text-destructive"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name={`records.${index}.product`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>المنتج</FormLabel>
                        <FormControl>
                          <Input placeholder="المنتج" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`records.${index}.productionQuantity`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>كمية الإنتاج</FormLabel>
                        <FormControl>
                          <Input placeholder="كمية الإنتاج" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`records.${index}.defectsDetected`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>العيوب المكتشفه</FormLabel>
                        <FormControl>
                          <Input placeholder="العيوب المكتشفه" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`records.${index}.defectiveQuantity`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>كمية المعيب</FormLabel>
                        <FormControl>
                          <Input placeholder="كمية المعيب" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`records.${index}.defectivePercentage`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>نسبة المعيب %</FormLabel>
                        <FormControl>
                          <Input placeholder="نسبة المعيب %" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`records.${index}.rootCause`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>السبب الجذري</FormLabel>
                        <FormControl>
                          <Input placeholder="السبب الجذري" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`records.${index}.correction`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>التصحيح</FormLabel>
                        <FormControl>
                          <Input placeholder="التصحيح" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`records.${index}.signature`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>التوقيع</FormLabel>
                        <FormControl>
                          <Input placeholder="التوقيع" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "جاري الحفظ..." : "حفظ النموذج"}
        </Button>
      </form>
    </Form>
  );
}
