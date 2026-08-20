import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Plus, Trash2, CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQualityForm } from "@/hooks/useQualityForm";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

const BAKERY_PRODUCTS = [
  "كرواسون ساده",
  "كرواسون جبنه شيدر",
  "كرواسون جبن رومي",
  "كرواسون فيلد لوز",
  "باتيه جبن رومي",
  "باتيه جبنه بيضاء",
  "باتيه هالوبينو",
  "باتيه ساده",
  "بيتزا إيطالي",
  "بغاشة",
  "دانش كريمة",
  "دانش فواكه",
  "دانش سكر",
  "دانش دايموند",
  "دانش فواكهه وكريمة",
  "منقوشة لبنه زعتر",
  "منقوشة تركي كيري",
  "منقوشة سجق",
  "منقوشة إيطالي",
  "منقوشة بيبروني",
  "منقوشة فراخ كريسبي",
  "ابل باي",
  "ميلفيه",
  "باتون ساليه",
  "دونتس مفتوح",
  "دونتس فيلد",
  "سينامون",
  "ساندويتش مقفول",
  "عيش ميني",
];

const recordSchema = z.object({
  productName: z.string().min(1, { message: "مطلوب" }),
  time: z.string().min(1, { message: "مطلوب" }),
  machineCode: z.string().min(1, { message: "مطلوب" }),
  coreTemperature: z.coerce.number({ invalid_type_error: "يجب أن يكون رقمًا" }),
  isConforming: z.enum(["true", "false"], { required_error: "مطلوب" }),
  responsible: z.string().optional(),
  correctiveAction: z.string().optional(),
  verifier: z.string().optional(),
});

const formSchema = z.object({
  formDate: z.date({
    required_error: "تاريخ النموذج مطلوب",
  }),
  supervisorName: z.string().min(2, { message: "اسم المشرف مطلوب" }),
  records: z.array(recordSchema).min(1, { message: "يجب إضافة سجل واحد على الأقل" }),
});

type FormValues = z.infer<typeof formSchema>;

export function BakingTemperatureForm() {
  const { submitForm, isSubmitting } = useQualityForm("baking_temperature");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      formDate: new Date(),
      supervisorName: "",
      records: [
        {
          productName: "",
          time: "",
          machineCode: "",
          coreTemperature: undefined,
          isConforming: undefined,
          responsible: "",
          correctiveAction: "",
          verifier: "",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "records",
  });

  const onSubmit = async (data: FormValues) => {
    const metadata = {
      formDate: format(data.formDate, "yyyy-MM-dd"),
      supervisorName: data.supervisorName,
    };

    const processedRecords = data.records.map((r) => ({
      productName: r.productName,
      time: r.time,
      machineCode: r.machineCode,
      coreTemperature: r.coreTemperature,
      isConforming: r.isConforming === "true",
      responsible: r.responsible,
      correctiveAction: r.correctiveAction,
      verifier: r.verifier,
    }));

    const success = await submitForm(metadata, processedRecords);
    if (success) {
      form.reset({
        formDate: new Date(),
        supervisorName: "",
        records: [
          {
            productName: "",
            time: "",
            machineCode: "",
            coreTemperature: undefined as any,
            isConforming: undefined as any,
            responsible: "",
            correctiveAction: "",
            verifier: "",
          },
        ],
      });
    }
  };

  return (
    <div dir="rtl" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">مراقبة درجات حرارة تسوية المنتجات</h2>
          <p className="text-muted-foreground">
            قسم: المخبوزات | المرحلة: التسوية | الحدود الحرجة: 90º م
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>البيانات الأساسية</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="formDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>التاريخ</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>اختر التاريخ</span>
                            )}
                            <CalendarIcon className="mr-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="supervisorName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم المشرف / مدير الجودة</FormLabel>
                    <FormControl>
                      <Input placeholder="أدخل اسم المشرف" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>سجالت التسوية</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({
                    productName: "",
                    time: "",
                    machineCode: "",
                    coreTemperature: undefined as any,
                    isConforming: undefined as any,
                    responsible: "",
                    correctiveAction: "",
                    verifier: "",
                  })
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                إضافة سجل
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 relative"
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-2 text-destructive"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>

                  <FormField
                    control={form.control}
                    name={`records.${index}.productName`}
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>اسم الصنف</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر الصنف" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {BAKERY_PRODUCTS.map((product) => (
                              <SelectItem key={product} value={product}>
                                {product}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                    name={`records.${index}.machineCode`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>كود الماكينة</FormLabel>
                        <FormControl>
                          <Input placeholder="الكود" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`records.${index}.coreTemperature`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>حرارة المركز (ºم)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="الحرارة" {...field} />
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
                        <FormLabel>النتيجة</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="true">مطابق</SelectItem>
                            <SelectItem value="false">غير مطابق</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`records.${index}.responsible`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>المسئول</FormLabel>
                        <FormControl>
                          <Input placeholder="الاسم" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`records.${index}.correctiveAction`}
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>الإجراء التصحيحي</FormLabel>
                        <FormControl>
                          <Input placeholder="في حالة غير مطابق" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`records.${index}.verifier`}
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>المتحقق</FormLabel>
                        <FormControl>
                          <Input placeholder="اسم المتحقق" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                </div>
              ))}
              {form.formState.errors.records?.root && (
                <p className="text-[0.8rem] font-medium text-destructive">
                  {form.formState.errors.records.root.message}
                </p>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "جاري الحفظ..." : "حفظ السجل"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
