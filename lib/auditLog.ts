export interface AuditLogEntry {
  id: string;
  timestamp: string;
  type: "LOGIN" | "OTP_REQUEST" | "PASSWORD_RESET" | "USER_STATUS_CHANGE" | "TEST_EMAIL";
  email: string;
  action: string;
  status: "SUCCESS" | "FAILED";
  details?: string;
}

const globalForLogs = globalThis as unknown as {
  fitmateAuditLogs?: AuditLogEntry[];
};

export const auditLogs: AuditLogEntry[] = globalForLogs.fitmateAuditLogs || [
  {
    id: "log_init_01",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    type: "LOGIN",
    email: "pathomphon7n@gmail.com",
    action: "เข้าสู่ระบบสำเร็จ",
    status: "SUCCESS",
    details: "เข้าสู่ระบบผ่าน Web Browser",
  },
  {
    id: "log_init_02",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    type: "OTP_REQUEST",
    email: "pathomphon7n@gmail.com",
    action: "ร้องขอรหัส OTP สำหรับรีเซ็ตรหัสผ่าน",
    status: "SUCCESS",
    details: "ส่งเมลสำเร็จผ่าน Google SMTP (รหัส OTP ถูกปกปิดเพื่อความปลอดภัย)",
  },
];

globalForLogs.fitmateAuditLogs = auditLogs;

export const addAuditLog = (entry: Omit<AuditLogEntry, "id" | "timestamp">) => {
  const newEntry: AuditLogEntry = {
    id: "log_" + Math.random().toString(36).substring(2, 10),
    timestamp: new Date().toISOString(),
    ...entry,
  };
  auditLogs.unshift(newEntry);
  if (auditLogs.length > 100) {
    auditLogs.pop();
  }
  return newEntry;
};
