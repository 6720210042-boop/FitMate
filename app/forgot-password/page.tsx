"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";

export default function ForgotPasswordPage() {
  const router = useRouter();

  // ขั้นตอนการทำงาน: 1 = กรอกอีเมล, 2 = ยืนยัน OTP, 3 = ตั้งรหัสผ่านใหม่, 4 = สำเร็จ
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // ข้อมูลฟอร์ม
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // สถานะการโหลดและข้อความ
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // ตัวนับถอยหลังสำหรับการขอ OTP ใหม่
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 2 && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  // ขั้นตอนที่ 1: ตรวจสอบอีเมลและส่งรหัส OTP ผ่าน Server API จริง
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const normalizedEmail = email.toLowerCase().trim();

    if (!normalizedEmail) {
      setErrorMessage("กรุณากรอกอีเมลของคุณ");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      setErrorMessage("รูปแบบอีเมลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง");
      return;
    }

    // ตรวจสอบกับบัญชีในระบบ
    if (typeof window !== "undefined") {
      let accounts: Array<{ name: string; email: string; password: string }> = [];
      try {
        const stored = localStorage.getItem("fitmate_accounts");
        if (stored) accounts = JSON.parse(stored);
      } catch {
        accounts = [];
      }

      if (accounts.length === 0) {
        accounts = [
          {
            name: "Pathomphon Buanieo",
            email: "pathomphon7n@gmail.com",
            password: "password123",
          },
        ];
        localStorage.setItem("fitmate_accounts", JSON.stringify(accounts));
      }

      const found = accounts.find((a) => a.email === normalizedEmail);
      if (!found) {
        setErrorMessage("ไม่พบบัญชีที่ใช้อีเมลนี้ในระบบ กรุณาตรวจสอบอีเมลหรือสมัครสมาชิกใหม่");
        return;
      }
    }

    setIsLoading(true);

    try {
      // เรียกใช้ API Route ฝั่ง Server เพื่อส่งอีเมลจริง
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsLoading(false);
        setStep(2);
        setCountdown(60);
        setCanResend(false);
        setSuccessMessage(`ระบบได้ส่งรหัสยืนยัน OTP ไปยังอีเมล ${normalizedEmail} แล้ว`);
      } else {
        setIsLoading(false);
        setErrorMessage(data.error || "ไม่สามารถส่งอีเมลได้ กรุณาตรวจสอบการตั้งค่าอีเมล");
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMessage("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง");
    }
  };

  // ขอ OTP ใหม่อีกครั้ง
  const handleResendOtp = async () => {
    if (!canResend) return;
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setCountdown(60);
        setCanResend(false);
        setIsLoading(false);
        setSuccessMessage("ส่งรหัสยืนยัน OTP ใหม่ไปยังอีเมลของคุณเรียบร้อยแล้ว");
      } else {
        setIsLoading(false);
        setErrorMessage(data.error || "ไม่สามารถขอรหัสใหม่ได้ กรุณาลองใหม่อีกครั้ง");
      }
    } catch {
      setIsLoading(false);
      setErrorMessage("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    }
  };

  // ขั้นตอนที่ 2: ตรวจสอบรหัส OTP กับทางเซิร์ฟเวอร์
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const trimmedOtp = otp.trim();
    if (!trimmedOtp || trimmedOtp.length < 6) {
      setErrorMessage("กรุณากรอกรหัส OTP 6 หลักที่ได้รับในอีเมล");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          otp: trimmedOtp,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsLoading(false);
        setSuccessMessage("ยืนยันรหัส OTP ถูกต้อง กรุณาตั้งรหัสผ่านใหม่");
        setStep(3);
      } else {
        setIsLoading(false);
        setErrorMessage(data.error || "รหัส OTP ไม่ถูกต้อง กรุณาตรวจสอบอีเมลอีกครั้ง");
      }
    } catch {
      setIsLoading(false);
      setErrorMessage("เกิดข้อผิดพลาดในการตรวจสอบรหัส OTP กรุณาลองใหม่อีกครั้ง");
    }
  };

  // ขั้นตอนที่ 3: บันทึกรหัสผ่านใหม่ลงฐานข้อมูล
  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!newPassword || !confirmNewPassword) {
      setErrorMessage("กรุณากรอกรหัสผ่านใหม่ให้ครบถ้วน");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage("รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMessage("รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      if (typeof window !== "undefined") {
        const normalizedEmail = email.toLowerCase().trim();
        let accounts: Array<{ name: string; email: string; password: string }> = [];
        try {
          const stored = localStorage.getItem("fitmate_accounts");
          if (stored) accounts = JSON.parse(stored);
        } catch {
          accounts = [];
        }

        if (accounts.length === 0) {
          accounts = [
            {
              name: "Pathomphon Buanieo",
              email: "pathomphon7n@gmail.com",
              password: "password123",
            },
          ];
          localStorage.setItem("fitmate_accounts", JSON.stringify(accounts));
        }

        const accountIndex = accounts.findIndex((a) => a.email === normalizedEmail);
        if (accountIndex === -1) {
          setIsLoading(false);
          setErrorMessage("เกิดข้อผิดพลาด ไม่พบบัญชีผู้ใช้");
          return;
        }

        // อัปเดตรหัสผ่านใหม่
        accounts[accountIndex].password = newPassword;
        localStorage.setItem("fitmate_accounts", JSON.stringify(accounts));

        // ลบ session เก่าออกเพื่อความปลอดภัย
        const currentUserStored = localStorage.getItem("fitmate_user");
        if (currentUserStored) {
          try {
            const cur = JSON.parse(currentUserStored);
            if (cur.email === normalizedEmail) {
              localStorage.removeItem("fitmate_user");
            }
          } catch {
            // ignore
          }
        }
      }

      setIsLoading(false);
      setStep(4);
    }, 500);
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-zinc-900 dark:text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden transition-colors duration-200">
      {/* แสงเอฟเฟกต์พื้นหลัง */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-100/70 dark:bg-emerald-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-teal-100/60 dark:bg-teal-900/20 rounded-full blur-3xl pointer-events-none" />

      {/* แถบย้อนกลับ */}
      <div className="w-full max-w-md mb-4 flex items-center justify-between z-10">
        <Link
          href="/login"
          className="inline-flex items-center text-xs text-zinc-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition gap-1.5 font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          กลับหน้าเข้าสู่ระบบ
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <span className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
            ความปลอดภัยบัญชี
          </span>
        </div>
      </div>

      {/* กล่องการ์ดรีเซ็ตรหัสผ่าน */}
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-zinc-200/80 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl shadow-zinc-200/50 dark:shadow-slate-950/60 backdrop-blur-xl relative z-10">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white font-black text-xl shadow-md shadow-emerald-500/20 mb-2">
            FM
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            รีเซ็ตรหัสผ่าน <span className="text-emerald-600 dark:text-emerald-400">FitMate</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-slate-400 mt-1">
            {step === 1 && "กรอกอีเมลของคุณเพื่อรับรหัสยืนยันความปลอดภัย"}
            {step === 2 && "กรอกรหัสยืนยัน OTP 6 หลักที่ได้รับในกล่องข้อความอีเมล"}
            {step === 3 && "กำหนดรหัสผ่านใหม่สำหรับเข้าสู่ระบบ"}
            {step === 4 && "เปลี่ยนรหัสผ่านเสร็จสมบูรณ์ พร้อมใช้งาน"}
          </p>
        </div>

        {/* ตัวบอกขั้นตอน (Stepper Dots) */}
        {step < 4 && (
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= 1 ? "w-8 bg-emerald-500" : "w-2 bg-zinc-200"}`} />
            <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= 2 ? "w-8 bg-emerald-500" : "w-2 bg-zinc-200"}`} />
            <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= 3 ? "w-8 bg-emerald-500" : "w-2 bg-zinc-200"}`} />
          </div>
        )}

        {/* กล่องแจ้งเตือน Error */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-fadeIn">
            <svg className="w-4 h-4 shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* กล่องแจ้งเตือน Success / Info */}
        {successMessage && step < 4 && (
          <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-fadeIn">
            <svg className="w-4 h-4 shrink-0 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{successMessage}</span>
          </div>
        )}

        {/* ----------------- STEP 1: กรอกอีเมล ----------------- */}
        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                อีเมลที่ลงทะเบียนไว้
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="กรอกอีเมลของคุณ เช่น user@gmail.com"
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-sm text-zinc-900 placeholder-zinc-400 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
                autoComplete="email"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 hover:from-emerald-600 hover:to-teal-700 transition active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  กำลังจัดส่งรหัสไปยังอีเมล...
                </>
              ) : (
                "ขอรหัสยืนยัน OTP"
              )}
            </button>
          </form>
        )}

        {/* ----------------- STEP 2: กรอกรหัส OTP ----------------- */}
        {step === 2 && (
          <div className="space-y-4">
            {/* กล่องแจ้งข้อมูลอีเมลจริง */}
            <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-950 text-xs">
              <div className="flex items-center gap-2 font-bold text-emerald-900 mb-1">
                <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                ส่งรหัส OTP ไปยังกล่องจดหมายแล้ว
              </div>
              <p className="text-[11.5px] text-emerald-800 leading-relaxed">
                กรุณาเปิดตรวจสอบกล่องข้อความ (Inbox หรือ จดหมายขยะ/Spam) ในอีเมล <strong>{email}</strong> แล้วนำรหัสยืนยัน 6 หลักมากรอกยืนยันด้านล่างนี้
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                  รหัสยืนยัน OTP (6 หลักจากอีเมล)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="เช่น 123456"
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-center font-mono text-xl tracking-widest text-zinc-900 placeholder-zinc-400 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-between text-xs text-zinc-500 pt-1">
                <span>ไม่ได้รับรหัส?</span>
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-emerald-600 font-semibold hover:underline"
                  >
                    ขอรหัสใหม่
                  </button>
                ) : (
                  <span>ขอรหัสใหม่ได้ใน ({countdown} วิ)</span>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setOtp("");
                    setErrorMessage("");
                  }}
                  className="w-1/3 py-2.5 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 transition"
                >
                  ย้อนกลับ
                </button>
                <button
                  type="submit"
                  disabled={isLoading || otp.length < 6}
                  className="w-2/3 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm shadow-md shadow-emerald-500/20 hover:from-emerald-600 hover:to-teal-700 transition active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      กำลังตรวจสอบ...
                    </>
                  ) : (
                    "ยืนยันรหัส OTP"
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ----------------- STEP 3: ตั้งรหัสผ่านใหม่ ----------------- */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่านใหม่ของคุณ"
                  className="w-full pl-4 pr-11 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-sm text-zinc-900 placeholder-zinc-400 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition p-1"
                  title={showNewPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                >
                  {showNewPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                ยืนยันรหัสผ่านใหม่อีกครั้ง
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="กรอกยืนยันรหัสผ่านใหม่อีกครั้ง"
                  className="w-full pl-4 pr-11 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-sm text-zinc-900 placeholder-zinc-400 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition p-1"
                  title={showConfirmPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                >
                  {showConfirmPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !newPassword || !confirmNewPassword}
              className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 hover:from-emerald-600 hover:to-teal-700 transition active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  กำลังบันทึกรหัสผ่านใหม่...
                </>
              ) : (
                "บันทึกรหัสผ่านใหม่"
              )}
            </button>
          </form>
        )}

        {/* ----------------- STEP 4: สำเร็จ ----------------- */}
        {step === 4 && (
          <div className="text-center py-4 space-y-4 animate-fadeIn">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900">เปลี่ยนรหัสผ่านสำเร็จ!</h2>
              <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
                รหัสผ่านใหม่ของท่านได้รับการบันทึกเรียบร้อยแล้ว สามารถใช้เข้าสู่ระบบได้ทันที
              </p>
            </div>
            <button
              onClick={() => router.push("/login")}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 hover:from-emerald-600 hover:to-teal-700 transition active:scale-[0.99]"
            >
              เข้าสู่ระบบด้วยรหัสผ่านใหม่
            </button>
          </div>
        )}

        {/* ส่วนท้าย ลิงก์กลับ */}
        <div className="mt-8 pt-5 border-t border-zinc-100 text-center text-xs text-zinc-500">
          นึกรหัสผ่านออกแล้ว?{" "}
          <Link href="/login" className="text-emerald-600 font-bold hover:underline">
            เข้าสู่ระบบที่นี่
          </Link>
        </div>
      </div>
    </main>
  );
}
