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

const recordSchema = z.object({
  productName: z.string().min(1, "مطلوب"),
  time: z.string().min(1, "مطلوب"),
  isConforming: z.enum(["true", "false"]),
  responsible: z.string().min(1, "مطلوب"),
  correctiveAction: z.string().optional(),
  verification: z.string().optional(),
  notes: z.string().optional(),
});

const formSchema = z.object({
  day: z.string().min(1, "مطلوب"),
  date: z.string().min(1, "مطلوب"),
  stage: z.string().min(1, "مطلوب"),
  supervisorName: z.string().min(1, "مطلوب"),
  qualityManager: z.string().min(1, "مطلوب"),
  records: z.array(recordSchema).min(1, "يجب إضافة سجل واحد على الأقل"),
});

export function SiftingForm() {
  const { submitForm, isSubmitting } = useQualityForm("sifting" as QualityFormType);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      day: "",
      date: new Date().toISOString().split("T")[0],
      stage: "",
      supervisorName: "",
      qualityManager: "",
      records: [
        {
          productName: "",
          time: "",
          isConforming: "true",
          responsible: "",
          correctiveAction: "",
          verification: "",
          notes: "",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "records",
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const metadata = {
      formDate: values.date,
      supervisorName: values.supervisorName,
    };
    
    const recordsToSave = values.records.map(record => ({
      ...record,
      day: values.day,
      stage: values.stage,
      qualityManager: values.qualityManager
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
          مراقبة النخل
          <span className="block text-lg font-normal mt-1">( 600 ميكرون )</span>
        </CardTitle>
        <div className="text-center text-sm text-muted-foreground mt-2">
          القسم : المخبوزات | معايير العمل : خالية من اي مواد غريبة وشوائب
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="day"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اليوم</FormLabel>
                    <FormControl>
                      <Input placeholder="اليوم" {...field} />
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
                name="stage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المرحلة</FormLabel>
                    <FormControl>
                      <Input placeholder="المرحلة" {...field} />
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
                    <TableHead className="w-12 text-center whitespace-nowrap">م</TableHead>
                    <TableHead className="min-w-[150px] text-right whitespace-nowrap">اسم المنتج</TableHead>
                    <TableHead className="min-w-[120px] text-right whitespace-nowrap">الوقت</TableHead>
                    <TableHead className="min-w-[150px] text-center whitespace-nowrap">الحالة</TableHead>
                    <TableHead className="min-w-[150px] text-right whitespace-nowrap">المسئول</TableHead>
                    <TableHead className="min-w-[200px] text-right whitespace-nowrap">الفعل التصحيحي ( في حالة الفشل )</TableHead>
                    <TableHead className="min-w-[200px] text-right whitespace-nowrap">التحقق من سلامة و كفاءة عمل المنخل</TableHead>
                    <TableHead className="min-w-[200px] text-right whitespace-nowrap">الملاحظات</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => (
                    <TableRow key={field.id}>
                      <TableCell className="text-center">{index + 1}</TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`records.${index}.productName`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`records.${index}.time`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input type="time" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`records.${index}.isConforming`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  className="flex flex-row justify-center space-x-4 space-x-reverse"
                                >
                                  <FormItem className="flex items-center space-x-1 space-x-reverse space-y-0">
                                    <FormControl>
                                      <RadioGroupItem value="true" />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer">
                                      مطابق √
                                    </FormLabel>
                                  </FormItem>
                                  <FormItem className="flex items-center space-x-1 space-x-reverse space-y-0">
                                    <FormControl>
                                      <RadioGroupItem value="false" />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer text-red-600">
                                      غير مطابق ×
                                    </FormLabel>
                                  </FormItem>
                                </RadioGroup>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`records.${index}.responsible`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`records.${index}.correctiveAction`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`records.${index}.verification`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`records.${index}.notes`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => remove(index)}
                          disabled={fields.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="p-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    append({
                      productName: "",
                      time: "",
                      isConforming: "true",
                      responsible: "",
                      correctiveAction: "",
                      verification: "",
                      notes: "",
                    })
                  }
                  className="w-full"
                >
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة سجل جديد
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
              <FormField
                control={form.control}
                name="supervisorName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رئيس قسم مراقبة الجودة</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="qualityManager"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>مدير الجودة</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "جاري الحفظ..." : "حفظ النموذج"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
