import React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

const STATUS_OPTIONS = ["مطابق", "غير مطابق", "لم يتم العمل عليها"] as const;

const recordSchema = z.object({
  category: z.string(),
  element: z.string(),
  morning_start_status: z.enum(STATUS_OPTIONS).optional(),
  morning_start_notes: z.string().optional(),
  morning_mid_status: z.enum(STATUS_OPTIONS).optional(),
  morning_mid_notes: z.string().optional(),
  evening_start_status: z.enum(STATUS_OPTIONS).optional(),
  evening_start_notes: z.string().optional(),
  evening_mid_status: z.enum(STATUS_OPTIONS).optional(),
  evening_mid_notes: z.string().optional(),
});

const formSchema = z.object({
  formDate: z.string().min(1, "التاريخ مطلوب"),
  supervisorName: z.string().min(1, "اسم المهندس مطلوب"),
  records: z.array(recordSchema),
});

type FormValues = z.infer<typeof formSchema>;

const INITIAL_RECORDS = [
  { category: "GHP", element: "نظافة األظافر" },
  { category: "GHP", element: "سالمة و نظافة المالبس" },
  { category: "GHP", element: "إرتداء مهمات الوقاية" },
  { category: "GHP", element: "عدم إرتداء مخالفات" },
  { category: "GHP", element: "سالمة األيدي و عدم وجود إصابات" },
  { category: "GHP", element: "التحقق من نظافة األيدي و التطهير" },
  { category: "Pest Control", element: "التحقق من عمل المصائد الضوئية" },
  { category: "Pest Control", element: "التحقق من عمل الستائر الهوائية" },
  { category: "Pest Control", element: "عدم وجود آفات" },
  { category: "التحقق من نظافة بيئة العمل", element: "التحقق من نظافة الحوائط و األرضيات" },
  { category: "التحقق من نظافة بيئة العمل", element: "التحقق من نظافة بالوعات الصرف و أحواض الغسيل" },
  { category: "التحقق من نظافة بيئة العمل", element: "عدم وجود مخلفات إنتاج" },
  { category: "التحقق من نظافة بيئة العمل", element: "التحقق من نظافة األبواب و النوافذ" },
  { category: "التحقق من سالمة صالة اإلنتاج صحياً", element: "سالمة الحوائط و األرضيات و األسقف و عدم وجود تكسيرات" }
].map(item => ({
  ...item,
  morning_start_status: "مطابق" as const,
  morning_start_notes: "",
  morning_mid_status: "مطابق" as const,
  morning_mid_notes: "",
  evening_start_status: "مطابق" as const,
  evening_start_notes: "",
  evening_mid_status: "مطابق" as const,
  evening_mid_notes: "",
}));

export function FoodSafetyForm() {
  const { submitForm, isSubmitting } = useQualityForm("food_safety");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      formDate: format(new Date(), "yyyy-MM-dd"),
      supervisorName: "",
      records: INITIAL_RECORDS,
    },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "records",
  });

  const onSubmit = async (data: FormValues) => {
    const success = await submitForm(
      {
        formDate: data.formDate,
        supervisorName: data.supervisorName,
      },
      data.records
    );

    if (success) {
      form.reset({
        ...data,
        records: INITIAL_RECORDS,
      });
    }
  };

  return (
    <Card className="w-full" dir="rtl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          نموذج متابعة التحقق من اشتراطات سالمة الغذاء بقسم المخبوزات
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
                    <FormLabel>توقيع مهندس مراقبة الجودة (االسم)</FormLabel>
                    <FormControl>
                      <Input placeholder="أدخل اسم المهندس" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right w-12 border-l">م</TableHead>
                    <TableHead className="text-right min-w-[200px] border-l">عناصر التحقق</TableHead>
                    <TableHead className="text-center border-l bg-slate-50" colSpan={4}>وردية صباحية</TableHead>
                    <TableHead className="text-center bg-slate-50" colSpan={4}>وردية مسائية</TableHead>
                  </TableRow>
                  <TableRow>
                    <TableHead className="border-l"></TableHead>
                    <TableHead className="border-l"></TableHead>
                    
                    {/* Morning */}
                    <TableHead className="text-right border-l bg-slate-50/50 min-w-[120px]">التحقق بداية التشغيل</TableHead>
                    <TableHead className="text-right border-l bg-slate-50/50 min-w-[150px]">مالحظات</TableHead>
                    <TableHead className="text-right border-l bg-slate-50/50 min-w-[120px]">التحقق منتصف التشغيل</TableHead>
                    <TableHead className="text-right border-l bg-slate-50/50 min-w-[150px]">مالحظات</TableHead>
                    
                    {/* Evening */}
                    <TableHead className="text-right border-l bg-slate-50/50 min-w-[120px]">التحقق بداية التشغيل</TableHead>
                    <TableHead className="text-right border-l bg-slate-50/50 min-w-[150px]">مالحظات</TableHead>
                    <TableHead className="text-right border-l bg-slate-50/50 min-w-[120px]">التحقق منتصف التشغيل</TableHead>
                    <TableHead className="text-right bg-slate-50/50 min-w-[150px]">مالحظات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => (
                    <React.Fragment key={field.id}>
                      {(index === 0 || fields[index - 1].category !== field.category) && (
                        <TableRow className="bg-slate-100 hover:bg-slate-100">
                          <TableCell colSpan={10} className="font-bold text-center border-y">
                            {field.category}
                          </TableCell>
                        </TableRow>
                      )}
                      <TableRow>
                        <TableCell className="border-l">{index + 1}</TableCell>
                        <TableCell className="border-l font-medium">{field.element}</TableCell>
                        
                        {/* Morning Start */}
                        <TableCell className="border-l">
                          <FormField
                            control={form.control}
                            name={`records.${index}.morning_start_status`}
                            render={({ field }) => (
                              <FormItem>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="اختر" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {STATUS_OPTIONS.map((status) => (
                                      <SelectItem key={status} value={status}>
                                        {status}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell className="border-l">
                          <FormField
                            control={form.control}
                            name={`records.${index}.morning_start_notes`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        
                        {/* Morning Mid */}
                        <TableCell className="border-l">
                          <FormField
                            control={form.control}
                            name={`records.${index}.morning_mid_status`}
                            render={({ field }) => (
                              <FormItem>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="اختر" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {STATUS_OPTIONS.map((status) => (
                                      <SelectItem key={status} value={status}>
                                        {status}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell className="border-l">
                          <FormField
                            control={form.control}
                            name={`records.${index}.morning_mid_notes`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </TableCell>

                        {/* Evening Start */}
                        <TableCell className="border-l">
                          <FormField
                            control={form.control}
                            name={`records.${index}.evening_start_status`}
                            render={({ field }) => (
                              <FormItem>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="اختر" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {STATUS_OPTIONS.map((status) => (
                                      <SelectItem key={status} value={status}>
                                        {status}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell className="border-l">
                          <FormField
                            control={form.control}
                            name={`records.${index}.evening_start_notes`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </TableCell>

                        {/* Evening Mid */}
                        <TableCell className="border-l">
                          <FormField
                            control={form.control}
                            name={`records.${index}.evening_mid_status`}
                            render={({ field }) => (
                              <FormItem>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="اختر" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {STATUS_OPTIONS.map((status) => (
                                      <SelectItem key={status} value={status}>
                                        {status}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`records.${index}.evening_mid_notes`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end">
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
