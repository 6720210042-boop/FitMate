"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";

interface UserAccount {
  name: string;
  email: string;
  password: string;
  role?: string;
  status?: string;
  createdAt?: string;
  lastLogin?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
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

    const normalizedInput = identifier.toLowerCase().trim();

    // ตรวจสอบข้อมูลเบื้องต้น
    if (!normalizedInput || !password) {
      setErrorMessage("กรุณากรอกอีเมล/ชื่อผู้ใช้ และรหัสผ่านให้ครบถ้วน");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      let isAuthenticated = false;
      let matchedUser: UserAccount | null = null;

      if (typeof window !== "undefined") {
        // โหลดบัญชีผู้ใช้ทั้งหมดจาก localStorage (fitmate_accounts)
        let accounts: UserAccount[] = [];
        try {
          const stored = localStorage.getItem("fitmate_accounts");
          if (stored) accounts = JSON.parse(stored);
        } catch {
          accounts = [];
        }

        // รับประกันว่าบัญชีแอดมินหลัก adminchin@fitmate.app พร้อมใช้งานเสมอ
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
          });
          localStorage.setItem("fitmate_accounts", JSON.stringify(accounts));
        } else {
          accounts[chinAdminIndex].password = "dogchin123./";
          accounts[chinAdminIndex].role = "admin";
          accounts[chinAdminIndex].status = "active";
          localStorage.setItem("fitmate_accounts", JSON.stringify(accounts));
        }

        // ค้นหาบัญชีด้วยอีเมล หรือ ชื่อผู้ใช้
        const found = accounts.find((a) =>
          a.email.toLowerCase() === normalizedInput ||
          (a.name && a.name.toLowerCase() === normalizedInput)
        );

        if (found) {
          if (found.status === "suspended") {
            setIsLoading(false);
            setErrorMessage("บัญชีของคุณถูกระงับการใช้งานชั่วคราว กรุณาติดต่อผู้ดูแลระบบ");
            return;
          }

          if (found.password === password) {
            matchedUser = found;
            isAuthenticated = true;

            // ตรวจสอบสิทธิ์ว่าเป็นแอดมินหรือไม่
            const isAdmin =
              found.role === "admin" ||
              found.email.toLowerCase() === "adminchin@fitmate.app" ||
              found.email.toLowerCase() === "pathomphon7n@gmail.com";

            // อัปเดตเวลาล็อกอินล่าสุดและบทบาท
            found.lastLogin = new Date().toISOString();
            found.role = isAdmin ? "admin" : (found.role || "user");
            localStorage.setItem("fitmate_accounts", JSON.stringify(accounts));
          } else {
            setIsLoading(false);
            setErrorMessage("รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง");
            return;
          }
        } else {
          setIsLoading(false);
          setErrorMessage("ไม่พบบัญชีผู้ใช้นี้ กรุณาตรวจสอบข้อมูลหรือสมัครสมาชิกใหม่");
          return;
        }
      }

      if (isAuthenticated && matchedUser) {
        setIsLoading(false);
        const isAdmin = matchedUser.role === "admin";

        if (isAdmin) {
          setSuccessMessage("เข้าสู่ระบบสำเร็จ! ยินดีต้อนรับผู้ดูแลระบบ กำลังนำท่านเข้าสู่ระบบ...");
        } else {
          setSuccessMessage("เข้าสู่ระบบสำเร็จ! กำลังนำท่านเข้าสู่ระบบ...");
        }

        let hasAssessment = false;
        if (typeof window !== "undefined") {
          localStorage.setItem(
            "fitmate_user",
            JSON.stringify({
              email: matchedUser.email,
              name: matchedUser.name,
              role: isAdmin ? "admin" : "user",
              loggedIn: true,
            })
          );
          hasAssessment = !!localStorage.getItem("fitmate_assessment");
        }

        setTimeout(() => {
          if (isAdmin) {
            // แอดมินนำทางตรงไปยังหน้าแอดมิน (หรือแดชบอร์ดตามสิทธิ์)
            router.push("/admin");
          } else {
            // ผู้ใช้ทั่วไป หากมีข้อมูลประเมินแล้วไปที่แดชบอร์ด หากยังไม่มีให้ไปทำแบบประเมิน
            router.push(hasAssessment ? "/dashboard" : "/assessment");
          }
        }, 800);
      }
    }, 500);
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-zinc-900 dark:text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden transition-colors duration-200">
      {/* แสงเอฟเฟกต์พื้นหลัง */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-100/70 dark:bg-emerald-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-teal-100/60 dark:bg-teal-900/20 rounded-full blur-3xl pointer-events-none" />

      {/* แถบย้อนกลับหน้าแรก */}
      <div className="w-full max-w-md mb-4 flex items-center justify-between z-10">
        <Link
          href="/"
          className="inline-flex items-center text-xs text-zinc-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition gap-1.5 font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          กลับหน้าหลัก
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <span className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
            FitMate Login
          </span>
        </div>
      </div>

      {/* กล่องการ์ดเข้าสู่ระบบ */}
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-zinc-200/80 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl shadow-zinc-200/50 dark:shadow-slate-950/60 backdrop-blur-xl relative z-10">
        {/* ส่วนหัวของการ์ด */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white font-black text-xl shadow-md shadow-emerald-500/20 mb-2">
            FM
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            เข้าสู่ระบบ <span className="text-emerald-600 dark:text-emerald-400">FitMate</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-slate-400 mt-1">
            เข้าสู่ระบบเพื่อใช้งานตามสิทธิ์ของคุณ (ระบบจะตรวจสอบสิทธิ์อัตโนมัติ)
          </p>
        </div>

        {/* ข้อความแจ้งเตือนข้อผิดพลาด */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300 text-xs flex items-start gap-2">
            <svg className="w-4 h-4 shrink-0 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {/* ข้อความแจ้งเตือนความสำเร็จ */}
        {successMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {/* ฟอร์มกรอกข้อมูล */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              อีเมล หรือ ชื่อผู้ใช้
            </label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="กรอกอีเมลหรือชื่อผู้ใช้ของคุณ"
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
              autoComplete="username"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-slate-300 uppercase tracking-wider">
                รหัสผ่าน
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium transition"
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
                className="w-full pl-4 pr-11 py-2.5 rounded-xl bg-zinc-50 dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition p-1"
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
                className="w-4 h-4 rounded border-zinc-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-xs text-zinc-600 dark:text-slate-400">จดจำฉันไว้ในระบบ</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 transition active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                กำลังเข้าสู่ระบบ...
              </>
            ) : (
              "เข้าสู่ระบบ"
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-slate-800 text-center">
          <p className="text-xs text-zinc-500 dark:text-slate-400">
            ยังไม่มีบัญชี FitMate?{" "}
            <Link
              href="/register"
              className="text-emerald-600 dark:text-emerald-400 font-semibold hover:text-emerald-700 transition"
            >
              สมัครสมาชิกใหม่
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
