import { NextResponse } from "next/server";
import { verifyOtp } from "@/lib/otpStore";

export async function POST(request: Request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, error: "กรุณากรอกอีเมลและรหัส OTP ให้ครบถ้วน" },
        { status: 400 }
      );
    }

    const result = verifyOtp(email, otp);

    if (!result.valid) {
      return NextResponse.json(
        { success: false, error: result.error || "รหัส OTP ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "ยืนยันรหัส OTP สำเร็จ",
    });
  } catch (error: any) {
    console.error("[FitMate Verify OTP Error]:", error);
    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาดในการตรวจสอบรหัส OTP" },
      { status: 500 }
    );
  }
}
