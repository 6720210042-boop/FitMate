import { NextResponse } from "next/server";
import { auditLogs, addAuditLog } from "@/lib/auditLog";

export async function GET() {
  return NextResponse.json({
    success: true,
    logs: auditLogs,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, email, action, status, details } = body;

    const newLog = addAuditLog({
      type: type || "USER_STATUS_CHANGE",
      email: email || "system",
      action: action || "การกระทำโดยผู้ดูแลระบบ",
      status: status || "SUCCESS",
      details: details || "",
    });

    return NextResponse.json({
      success: true,
      log: newLog,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "ไม่สามารถบันทึก Log ได้" },
      { status: 500 }
    );
  }
}
