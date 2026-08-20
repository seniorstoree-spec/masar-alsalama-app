import React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQualityForm } from "@/hooks/useQualityForm";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

const recordSchema = z.object({
  productName: z.string().min(1, "مطلوب"),
  additiveName: z.string().min(1, "مطلوب"),
  batchNumber: z.string().min(1, "مطلوب"),
  time: z.string().min(1, "مطلوب"),
  actualWeight: z.string().min(1, "مطلوب"),
  isConforming: z.string().min(1, "مطلوب"),
  responsiblePerson: z.string().optional(),
  correctiveAction: z.string().optional(),
  verifierSignature: z.string().optional(),
});

const formSchema = z.object({
  formDate: z.string().min(1, "مطلوب"),
  supervisorName: z.string().min(1, "مطلوب"),
  managerName: z.string().optional(),
  records: z.array(recordSchema).min(1, "يجب إضافة سجل واحد على الأقل"),
});

export function AdditivesWeightsForm() {
  const { submitForm, isSubmitting } = useQualityForm("additives_weights");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      formDate: new Date().toISOString().split('T')[0],
      supervisorName: "",
      managerName: "",
      records: [{
        productName: "",
        additiveName: "",
        batchNumber: "",
        time: "",
        actualWeight: "",
        isConforming: "",
        responsiblePerson: "",
        correctiveAction: "",
        verifierSignature: ""
      }],
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
      managerName: values.managerName,
    };
    await submitForm(metadata, values.records);
    form.reset({
      ...values,
      records: [{
        productName: "",
        additiveName: "",
        batchNumber: "",
        time: "",
        actualWeight: "",
        isConforming: "",
        responsiblePerson: "",
        correctiveAction: "",
        verifierSignature: ""
      }]
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8" dir="rtl">
        <Card>
          <CardHeader>
            <CardTitle>بيانات النموذج - مراقبة أوزان المواد المضافة</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <FormLabel>رئيس قسم مراقبة الجودة</FormLabel>
                  <FormControl>
                    <Input placeholder="اسم رئيس القسم" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="managerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>مدير الجودة</FormLabel>
                  <FormControl>
                    <Input placeholder="اسم مدير الجودة" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">سجلات المواد المضافة</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({
                productName: "",
                additiveName: "",
                batchNumber: "",
                time: "",
                actualWeight: "",
                isConforming: "",
                responsiblePerson: "",
                correctiveAction: "",
                verifierSignature: ""
              })}
            >
              <Plus className="w-4 h-4 ml-2" />
              إضافة سجل
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
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <FormField
                    control={form.control}
                    name={`records.${index}.productName`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اسم المنتج</FormLabel>
                        <FormControl>
                          <Input placeholder="اسم المنتج" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`records.${index}.additiveName`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اسم المادة المضافة</FormLabel>
                        <FormControl>
                          <Input placeholder="المادة المضافة" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`records.${index}.batchNumber`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>رقم التشغيلة</FormLabel>
                        <FormControl>
                          <Input placeholder="رقم التشغيلة" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <FormField
                    control={form.control}
                    name={`records.${index}.time`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الوقت</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`records.${index}.actualWeight`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الوزن الفعلي (جم)</FormLabel>
                        <FormControl>
                          <Input placeholder="الوزن بالجرام" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`records.${index}.isConforming`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>المطابقة</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر الحالة" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="مطابق">مطابق</SelectItem>
                            <SelectItem value="غير مطابق">غير مطابق</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name={`records.${index}.responsiblePerson`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>المسئول</FormLabel>
                        <FormControl>
                          <Input placeholder="اسم المسئول" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`records.${index}.correctiveAction`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الفعل التصحيحي (في حالة الفشل)</FormLabel>
                        <FormControl>
                          <Input placeholder="الفعل التصحيحي" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`records.${index}.verifierSignature`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>توقيع المحقق</FormLabel>
                        <FormControl>
                          <Input placeholder="توقيع المحقق" {...field} />
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
