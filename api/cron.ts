import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export default async function handler(req: any, res: any) {
  // 1. Verify Vercel Cron Secret
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    console.log("[Cron Debug] Starting deep debugging cron job execution...");
    
    // 1.5 Initialize Supabase with Anon Key
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "https://phgxiramgpfwikitqghn.supabase.co";
    const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_B9Z5RKCPUNk8a-AoLriI5g_c4Z0t1ZL";
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase credentials in environment variables.");
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });
    
    // 2. Calculate Yesterday's Date in Cairo Time (UTC+3)
    const now = new Date();
    // Convert current time to UTC, then add 3 hours for Cairo
    const cairoNow = new Date(now.getTime() + (3 * 60 * 60 * 1000));
    
    // Set to yesterday
    const cairoYesterday = new Date(cairoNow);
    cairoYesterday.setDate(cairoYesterday.getDate() - 1);
    
    // Format YYYY-MM-DD
    const yyyy = cairoYesterday.getUTCFullYear();
    const mm = String(cairoYesterday.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(cairoYesterday.getUTCDate()).padStart(2, '0');
    const targetDateString = `${yyyy}-${mm}-${dd}`;
    
    const startOfYesterdayISO = `${targetDateString}T00:00:00.000Z`; // Technically this acts as 00:00 in Supabase if we treat the DB as storing UTC but representing local time, wait, better yet, just use standard offsets.
    
    // Actually, the cleanest way to query "yesterday" given a timezone difference when the database stores timestampz:
    // Start of yesterday (Cairo Time): YYYY-MM-DDT00:00:00+03:00
    // End of yesterday (Cairo Time): YYYY-MM-DDT23:59:59+03:00
    const startOfYesterdayCairo = `${targetDateString}T00:00:00+03:00`;
    const endOfYesterdayCairo = `${targetDateString}T23:59:59+03:00`;

    console.log(`[Cron Debug] Fetching violations for yesterday (Cairo): ${startOfYesterdayCairo} to ${endOfYesterdayCairo}`);
    
    // 3. Fetch Violations via Direct Table Query (RLS disabled via migration)
    const { data: violations, error } = await supabase
      .from("violations")
      .select("*, employees(id, name, code, department, job_title), violation_types(id, name)")
      .gte("created_at", startOfYesterdayCairo)
      .lte("created_at", endOfYesterdayCairo)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Supabase query failed: ${error.message}`);
    }

    const allViolations = violations || [];
    console.log(`[Cron Debug] Total violations fetched for yesterday: ${allViolations.length}`);

    // Helper function to generate HTML for a table
    const generateTable = (items: any[]) => {
      if (items.length === 0) {
        return `<p style="color: #64748b; margin-top: 10px; padding: 15px; background-color: #f8fafc; border-radius: 6px; text-align: center;">لا توجد بيانات مسجلة في أي جدول (Database is completely empty!).</p>`;
      }
      return `
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px;">
          <thead>
            <tr style="background-color: #f8fafc; border-bottom: 2px solid #cbd5e1;">
              <th style="padding: 10px; text-align: right; border: 1px solid #e2e8f0;">الكود</th>
              <th style="padding: 10px; text-align: right; border: 1px solid #e2e8f0;">الاسم</th>
              <th style="padding: 10px; text-align: right; border: 1px solid #e2e8f0;">تاريخ الإنشاء (Raw)</th>
              <th style="padding: 10px; text-align: right; border: 1px solid #e2e8f0;">تاريخ المخالفة (Raw)</th>
              <th style="padding: 10px; text-align: right; border: 1px solid #e2e8f0;">مستوى الخطورة</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(v => `
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px; border: 1px solid #e2e8f0;">${v.employees?.code || v.employee_code || "—"}</td>
                <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">${v.employees?.name || v.employee_name || "—"}</td>
                <td style="padding: 10px; border: 1px solid #e2e8f0;" dir="ltr">${v.created_at || "—"}</td>
                <td style="padding: 10px; border: 1px solid #e2e8f0;" dir="ltr">${v.violation_date || "—"}</td>
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
    const reportDate = targetDateString;
    
    const emailHtml = `
      <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">التقرير اليومي للمخالفات - العبد للأغذية</h2>
        <p><strong>تاريخ التقرير:</strong> ${reportDate}</p>
        <p><strong>إجمالي المخالفات المسجلة:</strong> <span style="font-weight: bold; color: ${allViolations.length > 0 ? '#dc2626' : '#16a34a'};">${allViolations.length} مخالفة</span></p>
        
        ${generateTable(allViolations)}
        
        <p style="margin-top: 30px; font-size: 12px; color: #94a3b8; text-align: center;">
          هذه رسالة تلقائية من نظام مسار السلامة - العبد للأغذية. لا تقم بالرد على هذه الرسالة.
        </p>
      </div>
    `;

    console.log("[Cron Debug] Sending email via Resend...");
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "مسار السلامة <onboarding@resend.dev>",
      to: recipients,
      subject: `تقرير مخالفات يوم ${reportDate}`,
      html: emailHtml,
    });

    if (emailError) {
      throw new Error(`Resend API failed: ${JSON.stringify(emailError)}`);
    }

    console.log("[Cron Debug] Email sent successfully!");
    return res.status(200).json({ success: true, count: allViolations.length, email_id: emailData?.id });

  } catch (err: any) {
    console.error("[Cron Fatal Error]:", err.message || err);
    return res.status(500).json({ error: "Internal Server Error", details: err.message || String(err) });
  }
}
