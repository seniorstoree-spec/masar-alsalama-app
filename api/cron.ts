import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export default async function handler(req: any, res: any) {
  // 1. Verify Vercel Cron Secret
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // 2. Calculate "yesterday" boundaries in Egypt time (Africa/Cairo)
    const nowEgypt = new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo" }));
    
    // Subtract 24 hours to get yesterday
    const yesterdayEgypt = new Date(nowEgypt.getTime() - 24 * 60 * 60 * 1000);
    
    // Format as YYYY-MM-DD
    const y = yesterdayEgypt.getFullYear();
    const m = String(yesterdayEgypt.getMonth() + 1).padStart(2, "0");
    const d = String(yesterdayEgypt.getDate()).padStart(2, "0");
    const dateString = `${y}-${m}-${d}`;

    // 3. Initialize Supabase
    const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 4. Fetch Violations for yesterday
    const { data: violations, error } = await supabase
      .from("violations")
      .select("*, employees(id, name, code, department, job_title), violation_types(id, name)")
      .eq("violation_date", dateString);

    if (error) {
      console.error("Supabase Error:", error);
      return res.status(500).json({ error: "Database error", details: error.message });
    }

    // 5. Generate Email HTML
    const resend = new Resend(process.env.RESEND_API_KEY);
    const recipients = process.env.EMAIL_RECIPIENTS ? process.env.EMAIL_RECIPIENTS.split(",") : ["eslam.kamel@elabdfoods.com"];
    
    const count = violations ? violations.length : 0;
    
    const emailHtml = `
      <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">التقرير اليومي للمخالفات - العبد للأغذية</h2>
        <p><strong>تاريخ التقرير (يوم أمس):</strong> ${dateString}</p>
        <p><strong>إجمالي المخالفات المسجلة:</strong> <span style="font-weight: bold; color: ${count > 0 ? '#dc2626' : '#16a34a'};">${count} مخالفة</span></p>
        
        ${count > 0 ? `
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px;">
            <thead>
              <tr style="background-color: #f8fafc; border-bottom: 2px solid #cbd5e1;">
                <th style="padding: 10px; text-align: right; border: 1px solid #e2e8f0;">الكود</th>
                <th style="padding: 10px; text-align: right; border: 1px solid #e2e8f0;">الاسم</th>
                <th style="padding: 10px; text-align: right; border: 1px solid #e2e8f0;">القسم</th>
                <th style="padding: 10px; text-align: right; border: 1px solid #e2e8f0;">نوع المخالفة</th>
                <th style="padding: 10px; text-align: right; border: 1px solid #e2e8f0;">مستوى الخطورة</th>
              </tr>
            </thead>
            <tbody>
              ${violations.map(v => `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 10px; border: 1px solid #e2e8f0;">${v.employees?.code || v.employee_code || "—"}</td>
                  <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">${v.employees?.name || v.employee_name || "—"}</td>
                  <td style="padding: 10px; border: 1px solid #e2e8f0;">${v.employees?.department || v.employee_department || "—"}</td>
                  <td style="padding: 10px; border: 1px solid #e2e8f0;">${v.violation_types?.name || "—"}</td>
                  <td style="padding: 10px; border: 1px solid #e2e8f0;">
                    <span style="color: ${v.severity === 'حرج' ? '#dc2626' : v.severity === 'عالي' ? '#ea580c' : v.severity === 'متوسط' ? '#ca8a04' : '#16a34a'}">
                      ${v.severity || "—"}
                    </span>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        ` : `<p style="color: #64748b; margin-top: 20px; padding: 15px; background-color: #f8fafc; border-radius: 6px; text-align: center;">الحمد لله، لا توجد أي مخالفات مسجلة لتاريخ الأمس.</p>`}
        
        <p style="margin-top: 30px; font-size: 12px; color: #94a3b8; text-align: center;">
          هذه رسالة تلقائية من نظام مسار السلامة - العبد للأغذية. لا تقم بالرد على هذه الرسالة.
        </p>
      </div>
    `;

    // 6. Send Email using Resend
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "مسار السلامة <onboarding@resend.dev>",
      to: recipients,
      subject: `التقرير اليومي للمخالفات - ${dateString}`,
      html: emailHtml,
    });

    if (emailError) {
      console.error("Resend Error:", emailError);
      return res.status(500).json({ error: "Email delivery failed", details: emailError });
    }

    return res.status(200).json({ success: true, count, email_id: emailData?.id });

  } catch (err: any) {
    console.error("Unexpected Error in Cron:", err);
    return res.status(500).json({ error: err.message });
  }
}
