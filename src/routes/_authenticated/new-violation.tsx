import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { ViolationForm } from "@/components/violation-form";

export const Route = createFileRoute("/_authenticated/new-violation")({
  component: NewViolationPage,
});

function NewViolationPage() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader title="تسجيل مخالفة" subtitle="إضافة مخالفة جديدة لعامل أو موظف" />
      <Card className="max-w-3xl">
        <CardContent className="p-4 sm:p-6">
          <ViolationForm />
        </CardContent>
      </Card>
    </div>
  );
}
