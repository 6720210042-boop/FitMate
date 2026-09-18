import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { addAuditLog } from "@/lib/auditLog";

export async function POST(request: Request) {
  try {
    const { targetEmail } = await request.json();

    if (!targetEmail || typeof targetEmail !== "string") {
      return NextResponse.json(
        { success: false, error: "กรุณาระบุอีเมลปลายทางสำหรับทดสอบ" },
        { status: 400 }
      );
    }

    const normalizedEmail = targetEmail.toLowerCase().trim();

    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
    const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
    const smtpPort = Number(process.env.SMTP_PORT) || 465;
    const smtpFrom = process.env.SMTP_FROM || `FitMate Admin <${smtpUser || "noreply@fitmate.app"}>`;

    if (!smtpUser || !smtpPass) {
      return NextResponse.json(
        {
          success: false,
          error: "เซิร์ฟเวอร์ยังไม่มีการตั้งค่า SMTP_USER / SMTP_PASS ใน Environment",
        },
        { status: 503 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const testHtml = `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #10b981; border-radius: 16px; background-color: #ffffff;">
        <h2 style="color: #059669; margin-top: 0;">🛠️ FitMate - ทดสอบระบบส่งอีเมลสำเร็จ!</h2>
        <p style="color: #334155; line-height: 1.6;">
          อีเมลนี้ถูกส่งจากการทดสอบบน <strong>Admin Dashboard (ระบบจัดการหลังบ้าน)</strong> เพื่อยืนยันว่าระบบเชื่อมต่อกับเซิร์ฟเวอร์ส่งเมลและพร้อมใช้งานได้อย่างสมบูรณ์
        </p>
        <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 12px 16px; border-radius: 0 8px 8px 0; margin: 16px 0;">
          <p style="color: #065f46; font-size: 13px; margin: 0;">
            <strong>สถานะเซิร์ฟเวอร์:</strong> พร้อมใช้งาน (Connected)<br>
            <strong>เวลาที่ส่ง:</strong> ${new Date().toLocaleString("th-TH")}<br>
            <strong>Host:</strong> ${smtpHost}:${smtpPort}
          </p>
        </div>
        <p style="color: #94a3b8; font-size: 11px; margin: 16px 0 0 0;">
          FitMate System Diagnostic Mailer
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: smtpFrom,
      to: normalizedEmail,
      subject: `[FitMate Diagnostic] ทดสอบระบบส่งอีเมลจาก Admin Dashboard (${new Date().toLocaleTimeString("th-TH")})`,
      html: testHtml,
    });

    addAuditLog({
      type: "TEST_EMAIL",
      email: normalizedEmail,
      action: "ทดสอบส่งอีเมลจาก Admin Dashboard",
      status: "SUCCESS",
      details: `ส่งผ่าน ${smtpHost}:${smtpPort}`,
    });

    return NextResponse.json({
      success: true,
      message: `ส่งอีเมลทดสอบไปยัง ${normalizedEmail} สำเร็จเรียบร้อยแล้ว`,
    });
  } catch (error: unknown) {
    console.error("[FitMate Test Email Error]:", error);
    const errorMessage = error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการเชื่อมต่อ SMTP";

    addAuditLog({
      type: "TEST_EMAIL",
      email: "unknown",
      action: "ทดสอบส่งอีเมลจาก Admin Dashboard",
      status: "FAILED",
      details: errorMessage,
    });

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
