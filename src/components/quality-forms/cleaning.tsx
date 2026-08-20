import React from "react";
import * as z from "zod";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQualityForm } from "@/hooks/useQualityForm";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Trash2 } from "lucide-react";
import { QualityFormType } from "@/lib/quality-forms-schema";

const statusOptions = [
  { value: "conforming", label: "√", title: "مطابق" },
  { value: "non-conforming", label: "×", title: "غير مطابق" },
  { value: "na", label: "—", title: "لم يتم العمل عليها" }
];

const recordSchema = z.object({
  equipmentName: z.string().min(1, "مطلوب"),
  code: z.string().optional(),
  morningStart: z.enum(["conforming", "non-conforming", "na"]),
  morningEnd: z.enum(["conforming", "non-conforming", "na"]),
  morningNotes: z.string().optional(),
  eveningStart: z.enum(["conforming", "non-conforming", "na"]),
  eveningEnd: z.enum(["conforming", "non-conforming", "na"]),
  eveningNotes: z.string().optional(),
});

const formSchema = z.object({
  day: z.string().min(1, "مطلوب"),
  date: z.string().min(1, "مطلوب"),
  engineerName: z.string().min(1, "مطلوب"),
  records: z.array(recordSchema).min(1, "يجب إضافة سجل واحد على الأقل"),
});

const defaultEquipmentList = [
  "العجانات",
  "الفرادات",
  "ماكينات التكوير",
  "ماكينات التقطيع",
  "ماكينات الحقن",
  "المضارب",
  "القاليات",
  "السخانات",
  "اإلستاندات",
  "أدوات المناولة",
  "الترابيزات",
  "المخمرات",
  "األفران",
  "االيس ميكر",
  "خط التبنيط",
  "خط التشكيل (روندو)",
  "ماكينة تقطيع الفلفل",
  "ماكينة تقطيع الخوخ",
  "ماكينة تقطيع الجبنة",
  "المنخل الكهربي",
  "مكبس العجين",
];

export function CleaningForm() {
  const { submitForm, isSubmitting } = useQualityForm("cleaning" as QualityFormType);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      day: "",
      date: new Date().toISOString().split("T")[0],
      engineerName: "",
      records: defaultEquipmentList.map(name => ({
        equipmentName: name,
        code: "",
        morningStart: "na",
        morningEnd: "na",
        morningNotes: "",
        eveningStart: "na",
        eveningEnd: "na",
        eveningNotes: "",
      })),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "records",
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const metadata = {
      formDate: values.date,
      supervisorName: values.engineerName,
    };
    
    const recordsToSave = values.records.map(record => ({
      ...record,
      day: values.day,
      engineerName: values.engineerName
    }));

    const success = await submitForm(metadata, recordsToSave);
    if (success) {
      form.reset();
    }
  };

  return (
    <Card className="w-full" dir="rtl">
      <CardHeader>
        <CardTitle className="text-2xl text-center">
          نموذج متابعة النظافة و التطهير بقسم المخبوزات
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <FormField
                control={form.control}
                name="day"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اليوم</FormLabel>
                    <FormControl>
                      <Input placeholder="أدخل اليوم" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
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
                name="engineerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>توقيع مهندس مراقبة الجودة</FormLabel>
                    <FormControl>
                      <Input placeholder="أدخل الاسم" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="overflow-x-auto">
              <Table className="border border-border">
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead rowSpan={2} className="border-l text-center min-w-[50px]">م</TableHead>
                    <TableHead rowSpan={2} className="border-l text-center min-w-[200px]">فحص الأدوات و المعدات</TableHead>
                    <TableHead rowSpan={2} className="border-l text-center min-w-[100px]">الكود</TableHead>
                    <TableHead colSpan={3} className="border-l text-center bg-blue-50/50">وردية صباحية</TableHead>
                    <TableHead colSpan={3} className="border-l text-center bg-purple-50/50">وردية مسائية</TableHead>
                    <TableHead rowSpan={2} className="text-center min-w-[50px]"></TableHead>
                  </TableRow>
                  <TableRow className="bg-muted/50">
                    {/* Morning */}
                    <TableHead className="border-l text-center min-w-[120px] bg-blue-50/30">التحقق من النظافة بداية التشغيل</TableHead>
                    <TableHead className="border-l text-center min-w-[120px] bg-blue-50/30">التحقق من النظافة و التطهير نهاية التشغيل</TableHead>
                    <TableHead className="border-l text-center min-w-[150px] bg-blue-50/30">مالحظات</TableHead>
                    {/* Evening */}
                    <TableHead className="border-l text-center min-w-[120px] bg-purple-50/30">التحقق من النظافة بداية التشغيل</TableHead>
                    <TableHead className="border-l text-center min-w-[120px] bg-purple-50/30">التحقق من النظافة و التطهير نهاية التشغيل</TableHead>
                    <TableHead className="text-center min-w-[150px] bg-purple-50/30">مالحظات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => (
                    <TableRow key={field.id} className="hover:bg-muted/50">
                      <TableCell className="border-l text-center p-2">
                        {index + 1}
                      </TableCell>
                      <TableCell className="border-l p-2">
                        <FormField
                          control={form.control}
                          name={`records.${index}.equipmentName`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell className="border-l p-2">
                        <FormField
                          control={form.control}
                          name={`records.${index}.code`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      
                      {/* Morning */}
                      <TableCell className="border-l p-2 bg-blue-50/10">
                        <FormField
                          control={form.control}
                          name={`records.${index}.morningStart`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  className="flex flex-row justify-center space-x-2 space-x-reverse"
                                >
                                  {statusOptions.map((opt) => (
                                    <div key={opt.value} className="flex items-center" title={opt.title}>
                                      <RadioGroupItem value={opt.value} id={`${field.name}-${opt.value}`} className="peer sr-only" />
                                      <label
                                        htmlFor={`${field.name}-${opt.value}`}
                                        className="flex h-8 w-8 items-center justify-center rounded-md border-2 border-muted bg-popover hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary cursor-pointer text-sm font-bold"
                                      >
                                        {opt.label}
                                      </label>
                                    </div>
                                  ))}
                                </RadioGroup>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell className="border-l p-2 bg-blue-50/10">
                        <FormField
                          control={form.control}
                          name={`records.${index}.morningEnd`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  className="flex flex-row justify-center space-x-2 space-x-reverse"
                                >
                                  {statusOptions.map((opt) => (
                                    <div key={opt.value} className="flex items-center" title={opt.title}>
                                      <RadioGroupItem value={opt.value} id={`${field.name}-${opt.value}`} className="peer sr-only" />
                                      <label
                                        htmlFor={`${field.name}-${opt.value}`}
                                        className="flex h-8 w-8 items-center justify-center rounded-md border-2 border-muted bg-popover hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary cursor-pointer text-sm font-bold"
                                      >
                                        {opt.label}
                                      </label>
                                    </div>
                                  ))}
                                </RadioGroup>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell className="border-l p-2 bg-blue-50/10">
                        <FormField
                          control={form.control}
                          name={`records.${index}.morningNotes`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </TableCell>

                      {/* Evening */}
                      <TableCell className="border-l p-2 bg-purple-50/10">
                        <FormField
                          control={form.control}
                          name={`records.${index}.eveningStart`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  className="flex flex-row justify-center space-x-2 space-x-reverse"
                                >
                                  {statusOptions.map((opt) => (
                                    <div key={opt.value} className="flex items-center" title={opt.title}>
                                      <RadioGroupItem value={opt.value} id={`${field.name}-${opt.value}`} className="peer sr-only" />
                                      <label
                                        htmlFor={`${field.name}-${opt.value}`}
                                        className="flex h-8 w-8 items-center justify-center rounded-md border-2 border-muted bg-popover hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary cursor-pointer text-sm font-bold"
                                      >
                                        {opt.label}
                                      </label>
                                    </div>
                                  ))}
                                </RadioGroup>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell className="border-l p-2 bg-purple-50/10">
                        <FormField
                          control={form.control}
                          name={`records.${index}.eveningEnd`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  className="flex flex-row justify-center space-x-2 space-x-reverse"
                                >
                                  {statusOptions.map((opt) => (
                                    <div key={opt.value} className="flex items-center" title={opt.title}>
                                      <RadioGroupItem value={opt.value} id={`${field.name}-${opt.value}`} className="peer sr-only" />
                                      <label
                                        htmlFor={`${field.name}-${opt.value}`}
                                        className="flex h-8 w-8 items-center justify-center rounded-md border-2 border-muted bg-popover hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary cursor-pointer text-sm font-bold"
                                      >
                                        {opt.label}
                                      </label>
                                    </div>
                                  ))}
                                </RadioGroup>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell className="border-l p-2 bg-purple-50/10">
                        <FormField
                          control={form.control}
                          name={`records.${index}.eveningNotes`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </TableCell>

                      <TableCell className="p-2">
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() => remove(index)}
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-between items-center mt-4 flex-wrap gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  append({
                    equipmentName: "",
                    code: "",
                    morningStart: "na",
                    morningEnd: "na",
                    morningNotes: "",
                    eveningStart: "na",
                    eveningEnd: "na",
                    eveningNotes: "",
                  })
                }
              >
                <Plus className="h-4 w-4 ml-2" />
                إضافة صف
              </Button>

              <div className="flex gap-4 text-sm text-muted-foreground items-center bg-muted/30 p-2 rounded-md">
                <div className="font-semibold ml-2">مفتاح:</div>
                <div className="flex items-center gap-1"><span className="border p-1 rounded min-w-[24px] text-center bg-background font-bold text-black">√</span> مطابق</div>
                <div className="flex items-center gap-1"><span className="border p-1 rounded min-w-[24px] text-center bg-background font-bold text-black">×</span> غير مطابق</div>
                <div className="flex items-center gap-1"><span className="border p-1 rounded min-w-[24px] text-center bg-background font-bold text-black">—</span> لم يتم العمل عليها</div>
              </div>

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
