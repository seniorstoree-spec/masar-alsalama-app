import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export default async function handler(req: any, res: any) {
  // 1. Verify Vercel Cron Secret
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // 2. Calculate shift boundaries in Egypt time (Africa/Cairo)
    // The cron runs at 10:00 AM, so we analyze the previous 24h (Yesterday 07:00 AM to Today 07:00 AM)
    const nowEgypt = new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo" }));
    const yesterday = new Date(nowEgypt.getTime() - 24 * 60 * 60 * 1000);
    
    const formatYMD = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };
    
    const yesterdayYMD = formatYMD(yesterday);
    const todayYMD = formatYMD(nowEgypt);
    
    // Morning Shift: Yesterday 07:00 AM to Yesterday 06:59:59 PM
    const morningStart = `${yesterdayYMD}T07:00:00+03:00`;
    const morningEnd = `${yesterdayYMD}T18:59:59.999+03:00`;

    // Night Shift: Yesterday 07:00 PM to Today 06:59:59 AM
    const nightStart = `${yesterdayYMD}T19:00:00+03:00`;
    const nightEnd = `${todayYMD}T06:59:59.999+03:00`;

    // 3. Initialize Supabase
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "https://phgxiramgpfwikitqghn.supabase.co";
    const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_B9Z5RKCPUNk8a-AoLriI5g_c4Z0t1ZL";
    
    if (!supabaseUrl) {
      throw new Error("supabaseUrl is missing.");
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 4. Fetch Violations for the entire 24-hour cycle
    const { data: violations, error } = await supabase
      .from("violations")
      .select("*, employees(id, name, code, department, job_title), violation_types(id, name)")
      .gte("created_at", morningStart)
      .lte("created_at", nightEnd);

    if (error) {
      console.error("Supabase Error:", error);
      return res.status(500).json({ error: "Database error", details: error.message });
    }

    const allViolations = violations || [];
    
    // Categorize violations by shift
    const morningViolations = allViolations.filter(v => {
      const d = new Date(v.created_at).getTime();
      return d >= new Date(morningStart).getTime() && d <= new Date(morningEnd).getTime();
    });
    
    const nightViolations = allViolations.filter(v => {
      const d = new Date(v.created_at).getTime();
      return d >= new Date(nightStart).getTime() && d <= new Date(nightEnd).getTime();
    });

    console.log(`[Cron Debug] Total: ${allViolations.length} | Morning: ${morningViolations.length} | Night: ${nightViolations.length}`);

    // Helper function to generate HTML for a table
    const generateTable = (items: any[]) => {
      if (items.length === 0) {
        return `<p style="color: #64748b; margin-top: 10px; padding: 10px; background-color: #f1f5f9; border-radius: 6px; text-align: center;">لا توجد مخالفات مسجلة خلال هذه الوردية.</p>`;
      }
      return `
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 14px;">
          <thead>
            <tr style="background-color: #e2e8f0; border-bottom: 2px solid #cbd5e1;">
              <th style="padding: 10px; text-align: right; border: 1px solid #cbd5e1;">الكود</th>
              <th style="padding: 10px; text-align: right; border: 1px solid #cbd5e1;">الاسم</th>
              <th style="padding: 10px; text-align: right; border: 1px solid #cbd5e1;">القسم</th>
              <th style="padding: 10px; text-align: right; border: 1px solid #cbd5e1;">نوع المخالفة</th>
              <th style="padding: 10px; text-align: right; border: 1px solid #cbd5e1;">مستوى الخطورة</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(v => `
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
      `;
    };

    // 5. Generate Email HTML
    const resend = new Resend(process.env.RESEND_API_KEY);
    const recipients = process.env.EMAIL_RECIPIENTS ? process.env.EMAIL_RECIPIENTS.split(",") : ["eslamkamel.emk@gmail.com"];
    
    const emailHtml = `
      <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">التقرير اليومي للمخالفات - العبد للأغذية</h2>
        <p><strong>تاريخ التقرير:</strong> ${yesterdayYMD}</p>
        <p><strong>إجمالي المخالفات المسجلة للورديتين:</strong> <span style="font-weight: bold; color: ${allViolations.length > 0 ? '#dc2626' : '#16a34a'};">${allViolations.length} مخالفة</span></p>
        
        <div style="margin-top: 30px;">
          <h3 style="color: #1e40af; margin-bottom: 5px; border-bottom: 1px solid #bfdbfe; display: inline-block;">الوردية الصباحية (7:00 AM - 7:00 PM)</h3>
          ${generateTable(morningViolations)}
        </div>

        <div style="margin-top: 40px;">
          <h3 style="color: #1e40af; margin-bottom: 5px; border-bottom: 1px solid #bfdbfe; display: inline-block;">الوردية المسائية (7:00 PM - 7:00 AM)</h3>
          ${generateTable(nightViolations)}
        </div>
        
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
