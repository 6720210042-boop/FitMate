"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  // สถานะข้อมูลในฟอร์ม
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    // ตรวจสอบความถูกต้อง
    if (!name || !email || !password) {
      setErrorMessage("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setSuccessMessage("สมัครสมาชิกสำเร็จ! กำลังนำท่านเข้าสู่ระบบ...");

      // บันทึกข้อมูลบัญชีลงใน localStorage
      if (typeof window !== "undefined") {
        const userProfile = {
          name,
          email,
          loggedIn: true,
        };
        localStorage.setItem("fitmate_user", JSON.stringify(userProfile));
      }

      setTimeout(() => {
        router.push("/");
      }, 1200);
    }, 800);
  };

  return (
    <main className="min-h-screen bg-slate-50 text-zinc-900 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* แสงเอฟเฟกต์พื้นหลังโทนสว่าง */}
      <div className="absolute top-10 right-10 w-96 h-96 bg-emerald-100/70 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-teal-100/60 rounded-full blur-3xl pointer-events-none" />

      {/* แถบย้อนกลับ */}
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
        <span className="text-xs text-zinc-500">
          มีบัญชีอยู่แล้ว?{" "}
          <Link
            href="/login"
            className="text-emerald-600 font-medium hover:underline"
          >
            เข้าสู่ระบบ
          </Link>
        </span>
      </div>

      {/* กล่องการ์ดลงทะเบียนโทนสว่าง */}
      <div className="w-full max-w-md bg-white border border-zinc-200/80 rounded-2xl p-6 sm:p-8 shadow-xl shadow-zinc-200/50 backdrop-blur-xl relative z-10">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white font-black text-xl shadow-md shadow-emerald-500/20 mb-2">
            FM
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            สร้างบัญชี <span className="text-emerald-600">FitMate</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            เริ่มต้นวางแผนสุขภาพและฟิตหุ่นอย่างยั่งยืน
          </p>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
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
          <div className="mb-5 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
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

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
              ชื่อผู้ใช้งาน / ชื่อเล่น *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น ชิน, บาส, ท็อป"
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-sm text-zinc-900 placeholder-zinc-400 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
              อีเมล *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-sm text-zinc-900 placeholder-zinc-400 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
              รหัสผ่าน (อย่างน้อย 6 ตัวอักษร) *
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-sm text-zinc-900 placeholder-zinc-400 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
              ยืนยันรหัสผ่าน *
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-sm text-zinc-900 placeholder-zinc-400 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 hover:from-emerald-600 hover:to-teal-700 transition active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                กำลังสร้างบัญชี...
              </>
            ) : (
              "สมัครสมาชิก"
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-zinc-100 text-center">
          <p className="text-xs text-zinc-500">
            มีบัญชีอยู่แล้วใช่ไหม?{" "}
            <Link
              href="/login"
              className="text-emerald-600 font-semibold hover:text-emerald-700 transition"
            >
              เข้าสู่ระบบที่นี่
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
