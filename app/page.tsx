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
          const parsed = JSON.parse(stored);
          queueMicrotask(() => setUser(parsed));
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
            <Link
              href="/assessment"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              แบบประเมินสุขภาพ
            </Link>

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

        {/* คำเตือนทางการแพทย์ (Medical Disclaimer ตามข้อกำหนดเอกสาร) */}
        <div className="mt-8 max-w-2xl mx-auto p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2.5 text-left shadow-sm">
          <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="leading-relaxed">
            <strong className="font-bold text-amber-950">ข้อความสำคัญ:</strong> ข้อมูลและแผนการฝึกใน FitMate จัดทำเพื่อการส่งเสริมสุขภาพทั่วไป <span className="underline font-semibold">ไม่ใช่คำแนะนำทางการแพทย์</span> หากมีโรคประจำตัว เคยผ่าตัด หรือมีอาการบาดเจ็บ ควรปรึกษาแพทย์ก่อนเริ่มโปรแกรม
          </p>
        </div>

        {/* ปุ่มเริ่มต้น */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
          {!user ? (
            <>
              <Link
                href="/assessment"
                className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm sm:text-base shadow-xl shadow-emerald-500/20 hover:from-emerald-600 hover:to-teal-700 transition active:scale-95 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                เริ่มต้นใช้งานฟรี (ทำแบบประเมิน)
              </Link>
              <Link
                href="/register"
                className="px-6 py-3.5 rounded-xl bg-white border border-zinc-200 text-zinc-800 hover:bg-zinc-50 hover:border-zinc-300 font-semibold text-sm sm:text-base shadow-sm transition"
              >
                สมัครสมาชิก
              </Link>
              <Link
                href="/login"
                className="px-6 py-3.5 rounded-xl bg-transparent text-zinc-600 hover:text-zinc-950 font-medium text-sm sm:text-base transition"
              >
                เข้าสู่ระบบ
              </Link>
            </>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="p-3.5 px-5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm shadow-sm">
                สวัสดีคุณ <span className="font-bold">{user.name}</span>!
              </div>
              <Link
                href="/dashboard"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm shadow-md shadow-emerald-500/20 hover:from-emerald-600 hover:to-teal-700 transition flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                ไปที่ Dashboard ของฉัน
              </Link>
              <Link
                href="/assessment"
                className="px-4 py-3 rounded-xl bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 text-xs font-semibold transition"
              >
                แก้ไขแบบประเมินสุขภาพ
              </Link>
            </div>
          )}
        </div>

        {/* การ์ดแนะนำ 3 จุดเด่นหลักของ FitMate (โทนสว่าง คลีน) */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full">
          <div className="p-6 rounded-2xl border border-zinc-200/80 bg-white shadow-sm hover:shadow-md transition">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-zinc-900 mb-1.5">
              คัดกรองความปลอดภัย (PAR-Q)
            </h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              ประเมินความเสี่ยงสุขภาพ ปรับระดับความหนักให้เหมาะกับโรคประจำตัวและข้อจำกัดร่างกาย ไม่ฝืนฝึกหนักเกินตัว
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-zinc-200/80 bg-white shadow-sm hover:shadow-md transition">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 mb-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-zinc-900 mb-1.5">
              Hard Filter อาหารที่แพ้ 100%
            </h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              ระบบคัดกรองวัตถุดิบและเมนูอาหารที่ผู้ใช้แพ้ออกอย่างเด็ดขาด ปลอดภัยจากสารก่อภูมิแพ้ พร้อมคำนวณแคลอรี่แม่นยำ
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-zinc-200/80 bg-white shadow-sm hover:shadow-md transition">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 mb-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-zinc-900 mb-1.5">
              ตารางฝึกปรับตามอุปกรณ์จริง
            </h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              ไม่ว่าคุณจะฝึกที่บ้าน มีแค่ดัมเบลคู่เดียว หรือไปฟิตเนส ระบบจะจัดตารางที่เข้ากับอุปกรณ์และเวลาของคุณจริง
            </p>
          </div>
        </div>

        {/* ตัวอย่างผลลัพธ์และรีวิวผู้ใช้งาน (ตามข้อกำหนดในเอกสารหน้า 1 ข้อ 2) */}
        <div className="mt-16 w-full text-left">
          <div className="text-center mb-8">
            <span className="text-xs font-bold text-emerald-600 tracking-wider uppercase">
              เสียงตอบรับจากผู้ใช้งานจริง
            </span>
            <h2 className="text-2xl font-black text-zinc-900 mt-1">
              ผลลัพธ์สุขภาพที่ยั่งยืนและปลอดภัย
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed italic">
                  &ldquo;มีอาการปวดเข่าเรื้อรัง ระบบของ FitMate ช่วยตัดท่ากระโดดออกทั้งหมด แล้วจัดท่าบอดี้เวทแบบแรงกระแทกต่ำให้ ตอนนี้ออกกำลังกายได้ต่อเนื่อง 2 เดือนไม่เจ็บเข่าเลยครับ&rdquo;
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
                <span className="font-bold text-zinc-900">คุณธนกฤต, 38 ปี</span>
                <span className="text-emerald-600 font-medium">เป้าหมาย: สุขภาพทั่วไป</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed italic">
                  &ldquo;แพ้อาหารทะเลและแพ้นมวัวรุนแรงมาก ชอบที่ระบบตัดเมนูพวกนี้ออกเกลี้ยง 100% และแนะนำแหล่งโปรตีนจากไข่ ไก่ และพืชทดแทนได้ตรงตามสัดส่วนแคลอรี่&rdquo;
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
                <span className="font-bold text-zinc-900">คุณศิริพร, 29 ปี</span>
                <span className="text-emerald-600 font-medium">เป้าหมาย: ลดไขมัน 4 กก.</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed italic">
                  &ldquo;มีเวลาแค่ 3 วันต่อสัปดาห์ และเล่นที่บ้านมีแค่ดัมเบลคู่เดียว แผนที่ให้มาจัดสรรเวลาได้กระชับ 35 นาทีต่อวัน ไม่รู้สึกเหนื่อยล้าหรือเบื่อเลย&rdquo;
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
                <span className="font-bold text-zinc-900">คุณกิตติชัย, 32 ปี</span>
                <span className="text-emerald-600 font-medium">เป้าหมาย: เพิ่มกล้ามเนื้อ</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ท้ายหน้าเว็บ (Footer โทนสว่าง พร้อม Medical Disclaimer สรุปท้ายหน้า) */}
      <footer className="border-t border-zinc-200 bg-white py-8 px-6 text-center text-xs text-zinc-500">
        <div className="max-w-4xl mx-auto space-y-2">
          <p className="text-zinc-600">
            <strong>คำเตือนทางการแพทย์:</strong> ข้อมูลบนเว็บไซต์นี้ไม่ได้ทดแทนการวินิจฉัย การรักษา หรือคำปรึกษาจากแพทย์ผู้เชี่ยวชาญ หากรู้สึกผิดปกติขณะออกกำลังกายให้หยุดทันที
          </p>
          <p>
            FitMate &copy; {new Date().getFullYear()} • แพลตฟอร์มเพื่อนคู่คิดเพื่อสุขภาพและการออกกำลังกายอย่างยั่งยืน
          </p>
        </div>
      </footer>
    </div>
  );
}
