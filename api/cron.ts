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
    
    // 2. Initialize Supabase
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "https://phgxiramgpfwikitqghn.supabase.co";
    const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_B9Z5RKCPUNk8a-AoLriI5g_c4Z0t1ZL";
    
    if (!supabaseUrl) {
      throw new Error("supabaseUrl is missing.");
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 2.5 Authenticate to bypass RLS
    console.log("[Cron Debug] Attempting to authenticate to bypass RLS...");
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: "seniorstoree@gmail.com",
      password: "Eslam@1986",
    });

    if (authError) {
      console.log("[Cron Debug] Auth failed for seniorstoree, trying eslamkamel...");
      const { error: authError2 } = await supabase.auth.signInWithPassword({
        email: "eslamkamel.emk@gmail.com",
        password: "Eslam@1986",
      });
      if (authError2) {
        console.error("[Cron Debug] Auth failed for both accounts. Continuing anonymously, but RLS might block reads.");
      } else {
        console.log("[Cron Debug] Authenticated successfully with eslamkamel.emk@gmail.com");
      }
    } else {
      console.log("[Cron Debug] Authenticated successfully with seniorstoree@gmail.com");
    }

    // 3. Fallback Query Strategy: Check Multiple Tables
    const tablesToTry = [
      "violations",
      "safety_violations",
      "incidents",
      "inspection_reports",
      "reports"
    ];

    let activeTable = "";
    let recentRecords: any[] = [];
    
    for (const tableName of tablesToTry) {
      console.log(`[Cron Debug] Attempting to fetch from table: ${tableName}...`);
      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) {
        console.log(`[Cron Debug] Table ${tableName} failed or does not exist:`, error.message);
        continue;
      }

      if (data && data.length > 0) {
        console.log(`[Cron Debug] SUCCESS! Found data in table: ${tableName}`);
        activeTable = tableName;
        recentRecords = data;
        break; // Stop checking other tables
      } else {
        console.log(`[Cron Debug] Table ${tableName} is empty.`);
      }
    }

    if (recentRecords.length === 0) {
      console.log("[Cron Debug] ALL attempted tables are empty or failed.");
    } else {
      console.log(`[Cron Debug] Active Table Data (${activeTable}):`, JSON.stringify(recentRecords));
    }

    // 4. Pass the fetched raw data directly to the email template
    const allViolations = recentRecords;
    console.log(`[Cron Debug] Total records to send in email: ${allViolations.length}`);

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
    const reportDate = new Date().toLocaleDateString('en-GB', { timeZone: 'Africa/Cairo' });
    
    const emailHtml = `
      <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">تقرير مخالفات آخر 48 ساعة للتبنيط (Debug)</h2>
        <p><strong>الجدول النشط (Active Table):</strong> <span style="font-weight: bold; color: #2563eb;">${activeTable || "None"}</span></p>
        <p><strong>إجمالي المخالفات المجلوبة:</strong> <span style="font-weight: bold; color: ${allViolations.length > 0 ? '#dc2626' : '#16a34a'};">${allViolations.length} مخالفة</span></p>
        
        ${generateTable(allViolations)}
        
        <h3 style="margin-top: 40px; color: #ef4444;">البيانات الخام (Raw JSON):</h3>
        <pre style="background: #f1f5f9; padding: 15px; border-radius: 6px; overflow-x: auto; font-size: 11px;" dir="ltr">${JSON.stringify(recentRecords, null, 2)}</pre>
        
        <p style="margin-top: 30px; font-size: 12px; color: #94a3b8; text-align: center;">
          هذه رسالة تلقائية من نظام مسار السلامة - العبد للأغذية. لا تقم بالرد على هذه الرسالة.
        </p>
      </div>
    `;

    console.log("[Cron Debug] Sending email via Resend...");
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "مسار السلامة <onboarding@resend.dev>",
      to: recipients,
      subject: `[Debug] تقرير مخالفات يوم ${reportDate}`,
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
