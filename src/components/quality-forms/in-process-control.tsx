import React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQualityForm } from "@/hooks/useQualityForm";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";

const recordSchema = z.object({
  time: z.string().min(1, "مطلوب"),
  stage: z.string().min(1, "مطلوب"),
  product: z.string().min(1, "مطلوب"),
  temperature: z.string().optional(),
  duration: z.string().optional(),
  debrisDate: z.string().optional(),
  percentage: z.string().optional(),
  doughDate: z.string().optional(),
  thickness: z.string().optional(),
  concentration: z.string().optional(),
  validity: z.string().optional(),
  productionDate: z.string().optional(),
  expiryDate: z.string().optional(),
  packagingQuality: z.string().optional(),
  fryerCode: z.string().optional(),
  oilAddedPercentage: z.string().optional(),
  tpmPercentage: z.string().optional(),
});

const formSchema = z.object({
  formDate: z.string().min(1, "مطلوب"),
  supervisorName: z.string().min(1, "مطلوب"),
  managerName: z.string().optional(), // In case they want to record manager separately
  records: z.array(recordSchema).min(1, "يجب إضافة سجل واحد على الأقل"),
});

export function InProcessControlForm() {
  const { submitForm, isSubmitting } = useQualityForm("in_process_control");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      formDate: new Date().toISOString().split('T')[0],
      supervisorName: "",
      managerName: "",
      records: [{ time: "", stage: "", product: "" }],
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
    form.reset({ ...values, records: [{ time: "", stage: "", product: "" }] });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8" dir="rtl">
        <Card>
          <CardHeader>
            <CardTitle>بيانات النموذج</CardTitle>
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
                  <FormLabel>مهندس الجودة</FormLabel>
                  <FormControl>
                    <Input placeholder="اسم مهندس الجودة" {...field} />
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
            <h3 className="text-lg font-medium">متابعة عوامل التشغيل</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ time: "", stage: "", product: "" })}
            >
              <Plus className="w-4 h-4 ml-2" />
              إضافة سجل
            </Button>
          </div>

          {fields.map((field, index) => {
            const currentStage = form.watch(`records.${index}.stage`);

            return (
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
                      name={`records.${index}.stage`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>المرحلة</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="اختر المرحلة" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="العجن">العجن</SelectItem>
                              <SelectItem value="التبنيط">التبنيط</SelectItem>
                              <SelectItem value="الفرد">الفرد</SelectItem>
                              <SelectItem value="التسوية">التسوية</SelectItem>
                              <SelectItem value="التلميع">التلميع</SelectItem>
                              <SelectItem value="التغليف">التغليف</SelectItem>
                              <SelectItem value="التجميد السريع">التجميد السريع</SelectItem>
                              <SelectItem value="القلاية / الزيت">القلاية / الزيت</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`records.${index}.product`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الصنف</FormLabel>
                          <FormControl>
                            <Input placeholder="اسم الصنف" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(currentStage === "العجن" || currentStage === "التسوية" || currentStage === "التجميد السريع") && (
                      <FormField
                        control={form.control}
                        name={`records.${index}.temperature`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>درجة الحرارة</FormLabel>
                            <FormControl>
                              <Input placeholder="درجة الحرارة" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {(currentStage === "العجن" || currentStage === "التسوية") && (
                      <FormField
                        control={form.control}
                        name={`records.${index}.duration`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الوقت (المدة)</FormLabel>
                            <FormControl>
                              <Input placeholder="المدة بالدقائق" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {currentStage === "العجن" && (
                      <FormField
                        control={form.control}
                        name={`records.${index}.debrisDate`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>تاريخ إنتاج الدبري</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {currentStage === "التبنيط" && (
                      <FormField
                        control={form.control}
                        name={`records.${index}.percentage`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>النسبة %</FormLabel>
                            <FormControl>
                              <Input placeholder="%" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {currentStage === "الفرد" && (
                      <>
                        <FormField
                          control={form.control}
                          name={`records.${index}.doughDate`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>تاريخ إنتاج العجين</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`records.${index}.thickness`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>سمك العجين</FormLabel>
                              <FormControl>
                                <Input placeholder="سمك العجين" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}

                    {currentStage === "التلميع" && (
                      <FormField
                        control={form.control}
                        name={`records.${index}.concentration`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>التركيز</FormLabel>
                            <FormControl>
                              <Input placeholder="التركيز %" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {currentStage === "التغليف" && (
                      <>
                        <FormField
                          control={form.control}
                          name={`records.${index}.validity`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>الصلاحية</FormLabel>
                              <FormControl>
                                <Input placeholder="فترة الصلاحية" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`records.${index}.productionDate`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>تاريخ إنتاج</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`records.${index}.expiryDate`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>تاريخ إنتهاء</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`records.${index}.packagingQuality`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>جودة الغلاف (ابعاد - لحام - بيانات)</FormLabel>
                              <FormControl>
                                <Input placeholder="ملاحظات الجودة" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}

                    {currentStage === "القلاية / الزيت" && (
                      <>
                        <FormField
                          control={form.control}
                          name={`records.${index}.fryerCode`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>كود القلاية</FormLabel>
                              <FormControl>
                                <Input placeholder="كود القلاية" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`records.${index}.oilAddedPercentage`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>نسبة الزيت المضافة للتخفيف</FormLabel>
                              <FormControl>
                                <Input placeholder="النسبة" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`records.${index}.tpmPercentage`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>نسبة الـ TPM للزيت</FormLabel>
                              <FormControl>
                                <Input placeholder="النسبة %" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}

                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "جاري الحفظ..." : "حفظ النموذج"}
        </Button>
      </form>
    </Form>
  );
}
