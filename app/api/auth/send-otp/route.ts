import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { setOtp } from "@/lib/otpStore";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, error: "กรุณาระบุอีเมลที่ถูกต้อง" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // สร้างรหัส OTP สุ่ม 6 หลัก
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // บันทึกรหัส OTP ลง Store บน Server (อายุ 10 นาที)
    setOtp(normalizedEmail, otp, 10);

    // ตรวจสอบการตั้งค่า SMTP จาก Environment Variables
    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
    const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
    const smtpPort = Number(process.env.SMTP_PORT) || 465;
    const smtpFrom = process.env.SMTP_FROM || `FitMate <${smtpUser || "noreply@fitmate.app"}>`;

    if (!smtpUser || !smtpPass) {
      console.warn(`[FitMate Mailer Warning] SMTP_USER or SMTP_PASS is not configured on the server.`);
      console.warn(`[FitMate Mailer Warning] Generated OTP for ${normalizedEmail} is: ${otp}`);
      return NextResponse.json(
        {
          success: false,
          error:
            "เซิร์ฟเวอร์ยังไม่ได้ตั้งค่าบัญชีส่งอีเมล (SMTP_USER / SMTP_PASS) กรุณาเพิ่มการตั้งค่าอีเมลในระบบเพื่อให้ระบบสามารถส่งข้อความจริงไปยัง Gmail ได้",
        },
        { status: 503 }
      );
    }

    // สร้าง Nodemailer Transporter เพื่อส่งอีเมลจริง
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for 587
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const mailHtml = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 540px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="background: linear-gradient(135deg, #10b981 0%, #0d9488 100%); padding: 32px 24px; text-align: center;">
          <div style="display: inline-block; background-color: #ffffff; color: #10b981; font-weight: 900; font-size: 22px; width: 50px; height: 50px; line-height: 50px; border-radius: 14px; margin-bottom: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            FM
          </div>
          <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">FitMate - รีเซ็ตรหัสผ่าน</h1>
          <p style="color: #e6fffa; margin: 6px 0 0 0; font-size: 13px;">ระบบวางแผนสุขภาพและการออกกำลังกายเฉพาะบุคคล</p>
        </div>
        
        <div style="padding: 32px 28px;">
          <p style="color: #334155; font-size: 15px; line-height: 1.6; margin-top: 0;">
            สวัสดีครับ,<br>
            เราได้รับคำขอรีเซ็ตรหัสผ่านสำหรับบัญชี <strong>${normalizedEmail}</strong> ของท่าน กรุณาใช้รหัสยืนยัน OTP ด้านล่างนี้เพื่อดำเนินการตั้งรหัสผ่านใหม่:
          </p>
          
          <div style="text-align: center; margin: 28px 0;">
            <div style="display: inline-block; background-color: #f0fdf4; border: 2px dashed #10b981; border-radius: 12px; padding: 16px 36px;">
              <span style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; color: #047857; letter-spacing: 8px;">
                ${otp}
              </span>
            </div>
            <p style="color: #64748b; font-size: 12px; margin-top: 10px;">
              ⏱️ รหัสนี้มีอายุการใช้งาน <strong>10 นาที</strong>
            </p>
          </div>
          
          <div style="background-color: #f8fafc; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 0 8px 8px 0; margin: 24px 0 0 0;">
            <p style="color: #78350f; font-size: 12px; margin: 0; line-height: 1.5;">
              <strong>ข้อควรระวัง:</strong> หากท่านไม่ได้เป็นผู้ส่งคำขอนี้ กรุณาเพิกเฉยต่ออีเมลฉบับนี้ รหัสผ่านเดิมของท่านจะยังคงปลอดภัยและไม่มีการเปลี่ยนแปลงใดๆ
            </p>
          </div>
        </div>
        
        <div style="background-color: #f1f5f9; padding: 18px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="color: #94a3b8; font-size: 11px; margin: 0;">
            อีเมลฉบับนี้ถูกส่งโดยระบบอัตโนมัติจาก FitMate (https://dogaomshoo.online)<br>
            © 2026 FitMate Personal Health & Workout Planner. All rights reserved.
          </p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: smtpFrom,
      to: normalizedEmail,
      subject: `[FitMate] รหัสยืนยัน OTP สำหรับรีเซ็ตรหัสผ่านของคุณ: ${otp}`,
      html: mailHtml,
    });

    console.log(`[FitMate Mailer] Successfully sent real OTP email to: ${normalizedEmail}`);

    return NextResponse.json({
      success: true,
      message: `ส่งรหัสยืนยันไปยังอีเมล ${normalizedEmail} เรียบร้อยแล้ว กรุณาตรวจสอบกล่องจดหมาย`,
    });
  } catch (error: any) {
    console.error("[FitMate Mailer Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "เกิดข้อผิดพลาดในการส่งอีเมล กรุณาตรวจสอบการตั้งค่าอีเมลของเซิร์ฟเวอร์",
      },
      { status: 500 }
    );
  }
}
