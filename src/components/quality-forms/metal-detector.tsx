import React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQualityForm } from "@/hooks/useQualityForm";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Save } from "lucide-react";

const metalDetectorRecordSchema = z.object({
  time: z.string(),
  machineCode: z.string().optional(),
  ss_pass: z.boolean().default(false),
  ss_fail: z.boolean().default(false),
  nfe_pass: z.boolean().default(false),
  nfe_fail: z.boolean().default(false),
  fe_pass: z.boolean().default(false),
  fe_fail: z.boolean().default(false),
  responsible: z.string().optional(),
  correctiveAction: z.string().optional(),
  verifier: z.string().optional(),
});

const formSchema = z.object({
  date: z.string().min(1, { message: "التاريخ مطلوب" }),
  records: z.array(metalDetectorRecordSchema),
  overallStatus: z.enum(["مطابق", "غير مطابق"]).optional(),
  qualityManagerSignature: z.string().optional(),
  qualityControlHeadSignature: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const defaultTimes = [
  "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", 
  "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM",
  "08:00 PM", "09:00 PM", "10:00 PM", "11:00 PM", "12:00 AM", "01:00 AM", 
  "02:00 AM", "03:00 AM", "04:00 AM", "05:00 AM", "06:00 AM", "07:00 AM"
];

export function MetalDetectorForm() {
  const { submitForm, isSubmitting } = useQualityForm("metal_detector");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      records: defaultTimes.map(time => ({
        time,
        machineCode: "",
        ss_pass: false,
        ss_fail: false,
        nfe_pass: false,
        nfe_fail: false,
        fe_pass: false,
        fe_fail: false,
        responsible: "",
        correctiveAction: "",
        verifier: "",
      })),
      overallStatus: undefined,
      qualityManagerSignature: "",
      qualityControlHeadSignature: "",
    },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "records",
  });

  const onSubmit = async (data: FormValues) => {
    await submitForm(data);
  };

  return (
    <Card className="w-full" dir="rtl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">مراقبة جهاز كاشف المعادن</CardTitle>
        <div className="flex justify-between items-center mt-4 text-sm">
          <div>القسم : المخبوزات</div>
          <div>المرحلة : كاشف المعادن</div>
          <div>الحدود الحرجة Critical Limit :</div>
        </div>
        <div className="flex justify-between items-center mt-2 text-sm font-semibold text-center border p-2 bg-muted/50 rounded-md">
          <div className="flex-1">S.S: 3.5 mm</div>
          <div className="flex-1">NFe: 3.0 mm</div>
          <div className="flex-1">F.E: 2.5 mm</div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>

            <div className="overflow-x-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center w-12" rowSpan={2}>م</TableHead>
                    <TableHead className="text-center min-w-[100px]" rowSpan={2}>الوقت</TableHead>
                    <TableHead className="text-center min-w-[120px]" rowSpan={2}>كود الماكينة</TableHead>
                    <TableHead className="text-center" colSpan={2}>S.S</TableHead>
                    <TableHead className="text-center" colSpan={2}>Nfe</TableHead>
                    <TableHead className="text-center" colSpan={2}>F.E</TableHead>
                    <TableHead className="text-center min-w-[150px]" rowSpan={2}>المسئول</TableHead>
                    <TableHead className="text-center min-w-[200px]" rowSpan={2}>اإلجراء التصحيحي (في حالة الفشل)</TableHead>
                    <TableHead className="text-center min-w-[120px]" rowSpan={2}>المحقق</TableHead>
                  </TableRow>
                  <TableRow>
                    <TableHead className="text-center border-t border-r w-12">√</TableHead>
                    <TableHead className="text-center border-t w-12">×</TableHead>
                    <TableHead className="text-center border-t border-r w-12">√</TableHead>
                    <TableHead className="text-center border-t w-12">×</TableHead>
                    <TableHead className="text-center border-t border-r w-12">√</TableHead>
                    <TableHead className="text-center border-t w-12">×</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => (
                    <TableRow key={field.id}>
                      <TableCell className="text-center font-medium">{index + 1}</TableCell>
                      <TableCell className="text-center p-2">
                        <FormField
                          control={form.control}
                          name={`records.${index}.time`}
                          render={({ field }) => (
                            <FormControl>
                              <Input {...field} className="text-center h-8" readOnly />
                            </FormControl>
                          )}
                        />
                      </TableCell>
                      <TableCell className="p-2">
                        <FormField
                          control={form.control}
                          name={`records.${index}.machineCode`}
                          render={({ field }) => (
                            <FormControl>
                              <Input {...field} className="h-8" />
                            </FormControl>
                          )}
                        />
                      </TableCell>
                      <TableCell className="text-center p-2 border-r">
                        <FormField
                          control={form.control}
                          name={`records.${index}.ss_pass`}
                          render={({ field }) => (
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          )}
                        />
                      </TableCell>
                      <TableCell className="text-center p-2">
                        <FormField
                          control={form.control}
                          name={`records.${index}.ss_fail`}
                          render={({ field }) => (
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          )}
                        />
                      </TableCell>
                      <TableCell className="text-center p-2 border-r">
                        <FormField
                          control={form.control}
                          name={`records.${index}.nfe_pass`}
                          render={({ field }) => (
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          )}
                        />
                      </TableCell>
                      <TableCell className="text-center p-2">
                        <FormField
                          control={form.control}
                          name={`records.${index}.nfe_fail`}
                          render={({ field }) => (
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          )}
                        />
                      </TableCell>
                      <TableCell className="text-center p-2 border-r">
                        <FormField
                          control={form.control}
                          name={`records.${index}.fe_pass`}
                          render={({ field }) => (
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          )}
                        />
                      </TableCell>
                      <TableCell className="text-center p-2">
                        <FormField
                          control={form.control}
                          name={`records.${index}.fe_fail`}
                          render={({ field }) => (
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          )}
                        />
                      </TableCell>
                      <TableCell className="p-2">
                        <FormField
                          control={form.control}
                          name={`records.${index}.responsible`}
                          render={({ field }) => (
                            <FormControl>
                              <Input {...field} className="h-8" />
                            </FormControl>
                          )}
                        />
                      </TableCell>
                      <TableCell className="p-2">
                        <FormField
                          control={form.control}
                          name={`records.${index}.correctiveAction`}
                          render={({ field }) => (
                            <FormControl>
                              <Input {...field} className="h-8" />
                            </FormControl>
                          )}
                        />
                      </TableCell>
                      <TableCell className="p-2">
                        <FormField
                          control={form.control}
                          name={`records.${index}.verifier`}
                          render={({ field }) => (
                            <FormControl>
                              <Input {...field} className="h-8" />
                            </FormControl>
                          )}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 items-center">
              <FormField
                control={form.control}
                name="overallStatus"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>النتيجة النهائية</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-row space-x-4 space-x-reverse"
                      >
                        <FormItem className="flex items-center space-x-2 space-x-reverse">
                          <FormControl>
                            <RadioGroupItem value="مطابق" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            مطابق √
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-x-reverse">
                          <FormControl>
                            <RadioGroupItem value="غير مطابق" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            غير مطابق ×
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="qualityManagerSignature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>مدير الجوده</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="qualityControlHeadSignature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رئيس قسم مراقبة الجوده</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                <Save className="w-4 h-4 ml-2" />
                {isSubmitting ? "جاري الحفظ..." : "حفظ النموذج"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
