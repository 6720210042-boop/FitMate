"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const normalizedEmail = email.toLowerCase().trim();

    // ตรวจสอบข้อมูลเบื้องต้น
    if (!normalizedEmail || !password) {
      setErrorMessage("กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      let matchedName = normalizedEmail.split("@")[0];
      let isAuthenticated = false;

      if (typeof window !== "undefined") {
        // ตรวจสอบกับบัญชีที่เคยสมัครไว้ในระบบ (fitmate_accounts)
        let accounts: Array<{
          name: string;
          email: string;
          password: string;
          role?: string;
          status?: string;
          createdAt?: string;
          lastLogin?: string;
        }> = [];
        try {
          const stored = localStorage.getItem("fitmate_accounts");
          if (stored) accounts = JSON.parse(stored);
        } catch {
          accounts = [];
        }

        // รับประกันว่าบัญชี adminchin@fitmate.app พร้อมใช้งานเสมอ
        const chinAdminIndex = accounts.findIndex((a) => a.email === "adminchin@fitmate.app");
        if (chinAdminIndex === -1) {
          accounts.unshift({
            name: "Chin Admin",
            email: "adminchin@fitmate.app",
            password: "dogchin123./",
            role: "admin",
            status: "active",
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
          } as any);
          localStorage.setItem("fitmate_accounts", JSON.stringify(accounts));
        } else {
          accounts[chinAdminIndex].password = "dogchin123./";
          accounts[chinAdminIndex].role = "admin";
          accounts[chinAdminIndex].status = "active";
          localStorage.setItem("fitmate_accounts", JSON.stringify(accounts));
        }

        const found = accounts.find((a) => a.email === normalizedEmail) as any;
        if (found) {
          if (found.status === "suspended") {
            setIsLoading(false);
            setErrorMessage("บัญชีของคุณถูกระงับการใช้งานชั่วคราว กรุณาติดต่อผู้ดูแลระบบ");
            return;
          }

          if (found.password === password) {
            matchedName = found.name;
            isAuthenticated = true;
            // อัปเดต lastLogin
            found.lastLogin = new Date().toISOString();
            if (!found.role) {
              found.role =
                normalizedEmail === "adminchin@fitmate.app" ||
                normalizedEmail === "pathomphon7n@gmail.com" ||
                normalizedEmail.startsWith("admin@")
                  ? "admin"
                  : "user";
            }
            localStorage.setItem("fitmate_accounts", JSON.stringify(accounts));
          } else {
            setIsLoading(false);
            setErrorMessage("รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง");
            return;
          }
        } else {
          setIsLoading(false);
          setErrorMessage("ไม่พบบัญชีผู้ใช้นี้ กรุณาสมัครสมาชิกใหม่ก่อนเข้าใช้งาน");
          return;
        }
      }

      if (isAuthenticated) {
        setIsLoading(false);
        setSuccessMessage("เข้าสู่ระบบสำเร็จ! กำลังนำท่านเข้าสู่ระบบ...");

        let hasAssessment = false;
        if (typeof window !== "undefined") {
          const isAdmin =
            normalizedEmail === "adminchin@fitmate.app" ||
            normalizedEmail === "pathomphon7n@gmail.com" ||
            normalizedEmail.startsWith("admin@");
          localStorage.setItem(
            "fitmate_user",
            JSON.stringify({
              email: normalizedEmail,
              name: matchedName,
              role: isAdmin ? "admin" : "user",
              loggedIn: true,
            })
          );
          hasAssessment = !!localStorage.getItem("fitmate_assessment");
        }

        setTimeout(() => {
          // หากมีข้อมูลประเมินแล้วให้ไปที่แดชบอร์ดทันที หากยังไม่มีให้ไปทำแบบประเมิน
          router.push(hasAssessment ? "/dashboard" : "/assessment");
        }, 1000);
      }
    }, 500);
  };

  return (
    <main className="min-h-screen bg-slate-50 text-zinc-900 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* แสงเอฟเฟกต์พื้นหลังโทนสว่าง */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-100/70 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-teal-100/60 rounded-full blur-3xl pointer-events-none" />

      {/* แถบย้อนกลับหน้าแรก */}
      <div className="w-full max-w-md mb-4 flex items-center justify-between z-10">
        <Link
          href="/"
          className="inline-flex items-center text-xs text-zinc-500 hover:text-emerald-600 transition gap-1.5 font-medium"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          กลับหน้าหลัก
        </Link>
        <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
          FitMate Member
        </span>
      </div>

      {/* กล่องการ์ดเข้าสู่ระบบโทนสว่าง สะอาดตา */}
      <div className="w-full max-w-md bg-white border border-zinc-200/80 rounded-2xl p-6 sm:p-8 shadow-xl shadow-zinc-200/50 backdrop-blur-xl relative z-10">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white font-black text-xl shadow-md shadow-emerald-500/20 mb-2">
            FM
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            เข้าสู่ระบบ <span className="text-emerald-600">FitMate</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            ก้าวต่อไปสู่เป้าหมายสุขภาพและรูปร่างที่ดีขึ้น
          </p>
        </div>

        {/* ข้อความแจ้งเตือนข้อผิดพลาด */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <svg
              className="w-4 h-4 shrink-0 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <svg
              className="w-4 h-4 shrink-0 text-emerald-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>{successMessage}</span>
          </div>
        )}

        {/* ฟอร์มกรอกข้อมูล */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
              อีเมล
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="กรอกอีเมลของคุณ"
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-sm text-zinc-900 placeholder-zinc-400 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
              autoComplete="email"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider">
                รหัสผ่าน
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-emerald-600 hover:text-emerald-700 font-medium transition hover:underline"
              >
                ลืมรหัสผ่าน?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="กรอกรหัสผ่านของคุณ"
                className="w-full pl-4 pr-11 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-sm text-zinc-900 placeholder-zinc-400 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition p-1"
                title={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
              >
                {showPassword ? (
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

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-xs text-zinc-600">จดจำฉันไว้ในระบบ</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 hover:from-emerald-600 hover:to-teal-700 transition active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                กำลังเข้าสู่ระบบ...
              </>
            ) : (
              "เข้าสู่ระบบ"
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-zinc-100 text-center">
          <p className="text-xs text-zinc-500">
            ยังไม่มีบัญชี FitMate?{" "}
            <Link
              href="/register"
              className="text-emerald-600 font-semibold hover:text-emerald-700 transition"
            >
              สมัครสมาชิกใหม่
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
