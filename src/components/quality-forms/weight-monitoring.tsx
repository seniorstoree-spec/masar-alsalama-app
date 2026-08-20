import React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQualityForm } from "@/hooks/useQualityForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const weightMonitoringRecordSchema = z.object({
  productName: z.string().min(1, "اسم الصنف مطلوب"),
  doughTime: z.string().optional(),
  doughWeight: z.string().optional(),
  bakingTime: z.string().optional(),
  bakingWeight: z.string().optional(),
  finishTime: z.string().optional(),
  finishWeight: z.string().optional(),
});

const weightMonitoringFormSchema = z.object({
  formDate: z.string().min(1, "التاريخ مطلوب"),
  supervisorName: z.string().min(1, "اسم المشرف مطلوب"),
  records: z.array(weightMonitoringRecordSchema).min(1, "يجب إضافة سجل واحد على الأقل"),
});

type WeightMonitoringFormValues = z.infer<typeof weightMonitoringFormSchema>;

const products = [
  "دونتس مفتوح ميجا ( شيكوالته سبرينكلز )",
  "دونتس مفتوح ميجا ( شيكوالتة )",
  "دونتس مفتوح ميجا ( أبيض سبرينكلز )",
  "دونتس فيلد ميجا ( شيكوالتة )",
  "دونتي شيكوالتة بندق",
  "دونتس كوتن كاندي",
  "دونتس بينك",
  "دونتس فيلد ريد فلفيت",
  "دونتس فيلد كوكيز اند كريم",
  "دونتس فيلد عجينة بندق",
  "دونتس فيلد كوكيز",
  "دونتس فيلد لوتس",
  "دونتس فيلد فسدق",
  "دونتس فيلد ترند دبي",
  "دونتس فيلد كيندر",
  "دونتس تشيز كيك راسبيري",
  "ميني ساندوتش",
  "ساندويتش فاهيتا فراخ",
  "ساندويتش فاهيتا لحمه",
  "ساندويتش تونة بالمستردة",
  "ساندويتش سوسيس",
  "ساندويتش جبنه بالفلفل والزيتون",
  "ساندويتش بسطرمه بالجبنه الشيدر",
  "سينامون كالسيك",
  "سينامون شيكوالتة",
  "سينامون كراميل",
  "سينامون تراميسيو",
  "دونتس شيكوالته ميجا ( صيامي )"
];

export function WeightMonitoringForm() {
  const { submitForm, isSubmitting } = useQualityForm("weight_monitoring");

  const form = useForm<WeightMonitoringFormValues>({
    resolver: zodResolver(weightMonitoringFormSchema),
    defaultValues: {
      formDate: new Date().toISOString().split("T")[0],
      supervisorName: "",
      records: [
        {
          productName: "",
          doughTime: "",
          doughWeight: "",
          bakingTime: "",
          bakingWeight: "",
          finishTime: "",
          finishWeight: "",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "records",
  });

  const onSubmit = async (data: WeightMonitoringFormValues) => {
    const success = await submitForm(
      { formDate: data.formDate, supervisorName: data.supervisorName },
      data.records
    );
    if (success) {
      form.reset();
    }
  };

  return (
    <Card className="w-full" dir="rtl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          متابعة أوزان منتجات قسم المخبوزات
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <FormLabel>اسم المشرف / المسئول</FormLabel>
                    <FormControl>
                      <Input placeholder="أدخل اسم المشرف" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px] text-right">الصنف</TableHead>
                    <TableHead className="text-center" colSpan={2}>قطع العجين</TableHead>
                    <TableHead className="text-center" colSpan={2}>بعد التسوية</TableHead>
                    <TableHead className="text-center" colSpan={2}>بعد الفنش / الحشو</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                  <TableRow>
                    <TableHead></TableHead>
                    <TableHead className="text-right">الوقت</TableHead>
                    <TableHead className="text-right">الوزن (جم)</TableHead>
                    <TableHead className="text-right">الوقت</TableHead>
                    <TableHead className="text-right">الوزن (جم)</TableHead>
                    <TableHead className="text-right">الوقت</TableHead>
                    <TableHead className="text-right">الوزن (جم)</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => (
                    <TableRow key={field.id}>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`records.${index}.productName`}
                          render={({ field }) => (
                            <FormItem>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="اختر الصنف" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {products.map((p) => (
                                    <SelectItem key={p} value={p}>
                                      {p}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`records.${index}.doughTime`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input type="time" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`records.${index}.doughWeight`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input type="number" step="0.1" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`records.${index}.bakingTime`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input type="time" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`records.${index}.bakingWeight`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input type="number" step="0.1" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`records.${index}.finishTime`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input type="time" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`records.${index}.finishWeight`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input type="number" step="0.1" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <div className="flex justify-between items-center">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  append({
                    productName: "",
                    doughTime: "",
                    doughWeight: "",
                    bakingTime: "",
                    bakingWeight: "",
                    finishTime: "",
                    finishWeight: "",
                  })
                }
              >
                <Plus className="h-4 w-4 ml-2" />
                إضافة صف
              </Button>
              
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "جاري الحفظ..." : "حفظ النموذج"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
