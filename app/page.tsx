"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface UserProfile {
  name: string;
  email: string;
  loggedIn: boolean;
}

export default function Home() {
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("fitmate_user");
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch {
          // ignore
        }
      }
    }
  }, []);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("fitmate_user");
      setUser(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-zinc-900 flex flex-col selection:bg-emerald-500 selection:text-white relative overflow-hidden">
      {/* แสงพื้นหลังโทนสว่าง นุ่มนวล */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[360px] bg-gradient-to-b from-emerald-100/60 via-teal-50/40 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* แถบนำทางด้านบน (Navbar โทนสว่าง) */}
      <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 font-black text-white text-xl shadow-md shadow-emerald-500/20">
              FM
            </div>
            <span className="text-xl font-black tracking-tight text-zinc-900">
              Fit<span className="text-emerald-600">Mate</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-zinc-500">เข้าสู่ระบบในชื่อ</p>
                  <p className="text-sm font-semibold text-emerald-600">
                    {user.name}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-zinc-100 border border-zinc-200 text-zinc-700 hover:bg-zinc-200 transition"
                >
                  ออกจากระบบ
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-xs sm:text-sm font-semibold text-zinc-700 hover:text-zinc-950 transition"
                >
                  เข้าสู่ระบบ
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-600 transition"
                >
                  สมัครสมาชิก
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ส่วนต้อนรับและแนะนำเว็บ (Welcome & Hero โทนสว่าง) */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-16 sm:py-24 flex flex-col justify-center items-center text-center relative z-10">
        {/* ป้ายต้อนรับ */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs sm:text-sm font-medium mb-8 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          ยินดีต้อนรับสู่ FitMate • เพื่อนคู่คิดเพื่อสุขภาพที่ดีของคุณ
        </div>

        {/* หัวข้อต้อนรับ */}
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-zinc-950 leading-tight max-w-3xl">
          เริ่มต้นเส้นทางสุขภาพที่ดี{" "}
          <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
            อย่างมั่นใจและยั่งยืน
          </span>
        </h1>

        {/* แนะนำเว็บสั้นๆ */}
        <p className="mt-6 text-base sm:text-lg text-zinc-600 max-w-2xl leading-relaxed">
          FitMate ออกแบบมาเพื่อเป็นผู้ช่วยส่วนตัวในการวางแผนออกกำลังกาย
          คำนวณพลังงานที่เหมาะสมกับร่างกาย และช่วยให้คุณบรรลุเป้าหมายสุขภาพได้อย่างมีความสุข ไม่หักโหม
        </p>

        {/* ปุ่มเริ่มต้น */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          {!user ? (
            <>
              <Link
                href="/register"
                className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm sm:text-base shadow-xl shadow-emerald-500/20 hover:from-emerald-600 hover:to-teal-700 transition active:scale-95"
              >
                สมัครสมาชิกเริ่มต้นใช้งาน
              </Link>
              <Link
                href="/login"
                className="px-8 py-3.5 rounded-xl bg-white border border-zinc-200 text-zinc-800 hover:bg-zinc-50 hover:border-zinc-300 font-semibold text-sm sm:text-base shadow-sm transition"
              >
                เข้าสู่ระบบ
              </Link>
            </>
          ) : (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm shadow-sm">
              สวัสดีคุณ <span className="font-bold">{user.name}</span>! พร้อมเริ่มต้นดูแลสุขภาพไปด้วยกัน
            </div>
          )}
        </div>

        {/* การ์ดแนะนำ 3 จุดเด่นหลักของ FitMate (โทนสว่าง คลีน) */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full">
          <div className="p-6 rounded-2xl border border-zinc-200/80 bg-white shadow-sm hover:shadow-md transition">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-zinc-900 mb-1.5">
              แผนฝึกที่ปรับได้ตามใจ
            </h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              เลือกรูปแบบการออกกำลังกายที่เข้ากับไลฟ์สไตล์ ไม่ว่าจะเป็นสายค่อยเป็นค่อยไปหรือสายเน้นวินัยเข้มข้น
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-zinc-200/80 bg-white shadow-sm hover:shadow-md transition">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 mb-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-zinc-900 mb-1.5">
              โภชนาการที่แม่นยำ
            </h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              ช่วยคำนวณปริมาณพลังงานและสารอาหารที่ร่างกายต้องการจริง เพื่อผลลัพธ์ที่ชัดเจนและสุขภาพที่ดี
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-zinc-200/80 bg-white shadow-sm hover:shadow-md transition">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 mb-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-zinc-900 mb-1.5">
              เครื่องมือช่วยออกกำลังกาย
            </h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              มาพร้อมระบบจับเวลาพักเซ็ตและบันทึกความคืบหน้ารายสัปดาห์ ให้ทุกการฝึกของคุณมีระเบียบและสนุกขึ้น
            </p>
          </div>
        </div>
      </main>

      {/* ท้ายหน้าเว็บ (Footer โทนสว่าง) */}
      <footer className="border-t border-zinc-200 bg-white py-6 text-center text-xs text-zinc-500">
        FitMate &copy; {new Date().getFullYear()} • แพลตฟอร์มเพื่อนคู่คิดเพื่อสุขภาพและการออกกำลังกาย
      </footer>
    </div>
  );
}
