// In-memory OTP storage tied to globalThis so it persists across API requests and module reloads

interface OtpEntry {
  otp: string;
  expiresAt: number;
}

const globalForOtp = globalThis as unknown as {
  otpStore?: Map<string, OtpEntry>;
};

const store = globalForOtp.otpStore || new Map<string, OtpEntry>();
globalForOtp.otpStore = store;

export const setOtp = (email: string, otp: string, ttlMinutes = 10) => {
  const normalizedEmail = email.toLowerCase().trim();
  const expiresAt = Date.now() + ttlMinutes * 60 * 1000;
  store.set(normalizedEmail, { otp, expiresAt });
};

export const verifyOtp = (
  email: string,
  inputOtp: string
): { valid: boolean; error?: string } => {
  const normalizedEmail = email.toLowerCase().trim();
  const entry = store.get(normalizedEmail);

  if (!entry) {
    return {
      valid: false,
      error: "ไม่พบข้อมูลรหัส OTP สำหรับอีเมลนี้ หรือรหัสอาจหมดอายุแล้ว กรุณากดขอรหัสใหม่อีกครั้ง",
    };
  }

  if (Date.now() > entry.expiresAt) {
    store.delete(normalizedEmail);
    return {
      valid: false,
      error: "รหัส OTP หมดอายุแล้ว (อายุการใช้งาน 10 นาที) กรุณากดขอรหัสใหม่อีกครั้ง",
    };
  }

  if (entry.otp !== inputOtp.trim()) {
    return {
      valid: false,
      error: "รหัส OTP ไม่ถูกต้อง กรุณาตรวจสอบรหัสในกล่องข้อความอีเมลของคุณอีกครั้ง",
    };
  }

  // OTP ถูกต้อง ลบออกจาก store ทันทีเพื่อป้องกันการนำรหัสเดิมมาใช้ซ้ำ (One-Time Password)
  store.delete(normalizedEmail);
  return { valid: true };
};
