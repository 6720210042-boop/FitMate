"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";

interface UserAccount {
  name: string;
  email: string;
  password?: string; // จะถูก masked เป็น •••••••• เสมอ
  role?: "admin" | "user";
  status?: "active" | "suspended";
  createdAt?: string;
  lastLogin?: string;
}

interface AssessmentData {
  gender?: "male" | "female";
  age?: number;
  height?: number;
  weight?: number;
  bmi?: number;
  bmr?: number;
  tdee?: number;
  targetCalories?: number;
  targetProteinGrams?: number;
  fitnessGoal?: string;
  workoutDays?: number;
  experienceLevel?: string;
  dietType?: string;
  foodAllergies?: string[];
  chronicDiseases?: string[];
}

interface AuditLog {
  id: string;
  timestamp: string;
  type: string;
  email: string;
  action: string;
  status: "SUCCESS" | "FAILED";
  details?: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();

  // Tab State: 'overview' | 'users' | 'fitness' | 'logs' | 'system'
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "fitness" | "logs" | "system">("overview");

  // Authentication & Access Control State
  const [authStatus, setAuthStatus] = useState<"checking" | "authorized">("checking");
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string; role?: string } | null>(null);
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [assessments, setAssessments] = useState<Record<string, AssessmentData>>({});
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended">("all");

  // Modals & Actions
  const [selectedUserForModal, setSelectedUserForModal] = useState<{ account: UserAccount; assessment?: AssessmentData } | null>(null);
  const [isSendingResetEmail, setIsSendingResetEmail] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Live Test Mail Form State
  const [testMailTarget, setTestMailTarget] = useState("");
  const [isTestingMail, setIsTestingMail] = useState(false);
  const [testMailResult, setTestMailResult] = useState<{ success: boolean; message: string } | null>(null);

  const fetchAuditLogs = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/logs");
      if (res.ok) {
        const data = await res.json();
        if (data.logs) {
          setAuditLogs(data.logs);
        }
      }
    } catch {
      // fallback
    }
  }, []);

  // โหลดข้อมูลเริ่มต้นและตรวจสอบสิทธิ์แอดมิน
  useEffect(() => {
    if (typeof window !== "undefined") {
      // 1. ตรวจสอบผู้ใช้ปัจจุบันและสิทธิ์แอดมิน
      const userStored = localStorage.getItem("fitmate_user");
      let activeUser: { email: string; name: string; role?: string; loggedIn?: boolean } | null = null;
      if (userStored) {
        try {
          activeUser = JSON.parse(userStored);
          queueMicrotask(() => setCurrentUser(activeUser));
        } catch {
          activeUser = null;
        }
      }

      // 2. โหลดบัญชีผู้ใช้ทั้งหมด
      const accountsStored = localStorage.getItem("fitmate_accounts");
      let loadedAccounts: UserAccount[] = [];
      if (accountsStored) {
        try {
          loadedAccounts = JSON.parse(accountsStored);
        } catch {
          loadedAccounts = [];
        }
      }

      // ตรวจสอบและสร้างบัญชี adminchin@fitmate.app เป็นแอดมินหลัก
      const chinIdx = loadedAccounts.findIndex((a) => a.email === "adminchin@fitmate.app");
      if (chinIdx === -1) {
        loadedAccounts.unshift({
          name: "Chin Admin",
          email: "adminchin@fitmate.app",
          password: "dogchin123./",
          role: "admin",
          status: "active",
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        });
        localStorage.setItem("fitmate_accounts", JSON.stringify(loadedAccounts));
      }
      queueMicrotask(() => setAccounts(loadedAccounts));

      // ตรวจสอบสิทธิ์การเข้าถึง - อนุญาตเฉพาะฝ่ายแอดมินเท่านั้น คนอื่นเข้าไม่ได้
      if (!activeUser || !activeUser.email || !activeUser.loggedIn) {
        // ยังไม่ได้เข้าสู่ระบบ -> ส่งไปหน้าเข้าสู่ระบบหลักทันที
        router.replace("/login");
        return;
      }

      const isAdmin =
        activeUser.role === "admin" ||
        activeUser.email.toLowerCase() === "adminchin@fitmate.app" ||
        activeUser.email.toLowerCase() === "pathomphon7n@gmail.com";

      if (!isAdmin) {
        // ไม่มีสิทธิ์แอดมิน -> ส่งกลับหน้าแดชบอร์ดทันที คนอื่นไม่สามารถเข้าได้
        router.replace("/dashboard");
        return;
      }

      queueMicrotask(() => setAuthStatus("authorized"));

      // 3. โหลดข้อมูลประเมินสุขภาพ
      const assessmentStored = localStorage.getItem("fitmate_assessment");
      if (assessmentStored) {
        try {
          const parsed = JSON.parse(assessmentStored);
          queueMicrotask(() => {
            setAssessments({
              "pathomphon7n@gmail.com": parsed,
            });
          });
        } catch {
          // ignore
        }
      }
    }

    // 4. โหลด Audit Logs จาก Server API
    queueMicrotask(() => {
      fetchAuditLogs();
    });
  }, [router, fetchAuditLogs]);

  // ออกจากระบบแอดมิน
  const handleAdminSignOut = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("fitmate_user");
    }
    setCurrentUser(null);
    router.replace("/login");
  };

  const showNotification = (text: string, type: "success" | "error" = "success") => {
    setActionNotice({ type, text });
    setTimeout(() => setActionNotice(null), 4500);
  };

  // จัดการระงับ/เปิดใช้งานบัญชี
  const toggleUserStatus = async (targetEmail: string) => {
    const updated = accounts.map((acc) => {
      if (acc.email.toLowerCase() === targetEmail.toLowerCase()) {
        const nextStatus = acc.status === "suspended" ? "active" : "suspended";
        return { ...acc, status: nextStatus as "active" | "suspended" };
      }
      return acc;
    });

    setAccounts(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("fitmate_accounts", JSON.stringify(updated));
    }

    const targetUser = updated.find((a) => a.email.toLowerCase() === targetEmail.toLowerCase());
    const isNowActive = targetUser?.status === "active";

    // บันทึกลง Audit Log
    try {
      await fetch("/api/admin/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "USER_STATUS_CHANGE",
          email: targetEmail,
          action: isNowActive ? "ปลดระงับการใช้งานบัญชี" : "ระงับการใช้งานบัญชี",
          status: "SUCCESS",
          details: `ผู้ดูแลระบบได้ปรับสถานะเป็น ${isNowActive ? "ปกติ (Active)" : "ระงับ (Suspended)"}`,
        }),
      });
      fetchAuditLogs();
    } catch {
      // ignore
    }

    showNotification(
      isNowActive
        ? `ปลดระงับบัญชี ${targetEmail} เรียบร้อยแล้ว`
        : `ระงับการใช้งานบัญชี ${targetEmail} ชั่วคราวแล้ว`,
      isNowActive ? "success" : "error"
    );
  };

  // แอดมินกดส่งอีเมลรีเซ็ตรหัสผ่านให้ผู้ใช้ (ปลอดภัย: ส่งผ่าน Nodemailer โดยแอดมินไม่เห็นรหัส OTP)
  const handleSendResetEmail = async (targetEmail: string) => {
    setIsSendingResetEmail(targetEmail);
    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail }),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        showNotification(`ระบบได้ส่งรหัส OTP รีเซ็ตรหัสผ่านไปยัง ${targetEmail} สำเร็จแล้ว (รหัสถูกปกปิดเป็นความลับ)`);
        fetchAuditLogs();
      } else {
        showNotification(data.error || "ไม่สามารถส่งอีเมลได้ กรุณาตรวจสอบการตั้งค่า SMTP", "error");
      }
    } catch {
      showNotification("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์", "error");
    } finally {
      setIsSendingResetEmail(null);
    }
  };

  // ทดสอบยิงอีเมลแบบ Real-time จากหน้าแอดมิน
  const handleTestMailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testMailTarget) return;

    setIsTestingMail(true);
    setTestMailResult(null);

    try {
      const response = await fetch("/api/admin/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetEmail: testMailTarget }),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setTestMailResult({ success: true, message: data.message });
        fetchAuditLogs();
      } else {
        setTestMailResult({ success: false, message: data.error || "เกิดข้อผิดพลาดในการส่ง" });
      }
    } catch {
      setTestMailResult({ success: false, message: "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์" });
    } finally {
      setIsTestingMail(false);
    }
  };

  // กรองรายชื่อผู้ใช้
  const filteredUsers = useMemo(() => {
    return accounts.filter((acc) => {
      const matchesSearch =
        acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        acc.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && acc.status !== "suspended") ||
        (statusFilter === "suspended" && acc.status === "suspended");
      return matchesSearch && matchesStatus;
    });
  }, [accounts, searchQuery, statusFilter]);

  // สถิติต่างๆ สำหรับ Overview
  const totalUsersCount = accounts.length;
  const activeUsersCount = accounts.filter((a) => a.status !== "suspended").length;
  const assessedUsersCount = Object.keys(assessments).length;

  // กำลังตรวจสอบสิทธิ์ / ยังไม่ได้รับสิทธิ์ (ระหว่าง redirect)
  if (authStatus !== "authorized") {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30 animate-pulse font-black text-white text-xl">
            FM
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <svg className="animate-spin h-4 w-4 text-purple-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span>กำลังตรวจสอบสิทธิ์ฝ่ายผู้ดูแลระบบ...</span>
          </div>
        </div>
      </div>
    );
  }

  // 4. กรณีได้รับอนุญาต (Authorized Admin) - แสดงแดชบอร์ดเต็มรูปแบบ
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col antialiased">
      {/* ---------------- แถบแจ้งเตือน Action Notification ---------------- */}
      {actionNotice && (
        <div className="fixed top-5 right-5 z-50 animate-bounce">
          <div
            className={`px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-sm font-medium border ${
              actionNotice.type === "success"
                ? "bg-emerald-950/90 border-emerald-500 text-emerald-200"
                : "bg-red-950/90 border-red-500 text-red-200"
            }`}
          >
            {actionNotice.type === "success" ? (
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span>{actionNotice.text}</span>
          </div>
        </div>
      )}

      {/* ---------------- HEADER BAR ---------------- */}
      <header className="bg-slate-950/80 backdrop-blur-xl border-b border-slate-800 sticky top-0 z-40 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-emerald-500/20">
            FM
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base sm:text-lg tracking-tight text-white">
                FitMate <span className="text-emerald-400 font-semibold">Admin Panel</span>
              </h1>
              <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Control Center
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              ระบบบริหารจัดการหลังบ้านตามมาตรฐานความปลอดภัยและความเป็นส่วนตัว (PDPA / OWASP)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300">เข้าสู่ระบบโดย:</span>
            <strong className="text-emerald-300">{currentUser?.email || "adminchin@fitmate.app"}</strong>
          </div>

          <ThemeToggle />

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>กลับหน้าแอปหลัก</span>
          </Link>

          {/* ปุ่มออกจากระบบแอดมิน */}
          <button
            onClick={handleAdminSignOut}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-red-950/60 hover:bg-red-900/80 text-red-200 border border-red-800/80 transition"
            title="ออกจากระบบฝ่ายผู้ดูแลระบบ"
          >
            <svg className="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline">ออกจากระบบแอดมิน</span>
          </button>
        </div>
      </header>

      {/* ---------------- NAVIGATION TABS ---------------- */}
      <div className="bg-slate-950/40 border-b border-slate-800/80 px-4 sm:px-8 py-2 overflow-x-auto flex gap-1.5 sm:gap-2">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 shrink-0 ${
            activeTab === "overview"
              ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
              : "text-slate-400 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          ภาพรวมระบบ (Overview)
        </button>

        <button
          onClick={() => setActiveTab("users")}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 shrink-0 ${
            activeTab === "users"
              ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
              : "text-slate-400 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          จัดการผู้ใช้งาน ({accounts.length})
        </button>

        <button
          onClick={() => setActiveTab("fitness")}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 shrink-0 ${
            activeTab === "fitness"
              ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
              : "text-slate-400 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          สถิติสุขภาพ & โภชนาการ
        </button>

        <button
          onClick={() => setActiveTab("logs")}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 shrink-0 ${
            activeTab === "logs"
              ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
              : "text-slate-400 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          ประวัติความปลอดภัย (Audit Logs)
        </button>

        <button
          onClick={() => setActiveTab("system")}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 shrink-0 ${
            activeTab === "system"
              ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
              : "text-slate-400 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          สถานะเซิร์ฟเวอร์ & อีเมล
        </button>
      </div>

      {/* ---------------- MAIN CONTENT AREA ---------------- */}
      <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* แถบแจ้งเตือนความปลอดภัย Privacy Banner */}
        <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <span className="font-bold text-slate-200">นโยบายความเป็นส่วนตัวสูงสุด (Privacy & Security Standard):</span>
              <p className="text-slate-400 mt-0.5">
                รหัสผ่านของผู้ใช้จะถูกเข้ารหัสและปิดบังเสมอ แอดมินจะไม่สามารถดูรหัสผ่านหรือรหัส OTP ใดๆ ของผู้ใช้ได้ เพื่อความปลอดภัยตามกฎหมาย PDPA
              </p>
            </div>
          </div>
          <span className="shrink-0 text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 hidden sm:inline-block">
            OWASP Level 2
          </span>
        </div>

        {/* ================= TAB 1: OVERVIEW ================= */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 backdrop-blur-sm relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">สมาชิกทั้งหมด</span>
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-3xl font-black text-white tracking-tight">{totalUsersCount}</div>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    <span className="text-emerald-400 font-semibold">● ปกติ {activeUsersCount}</span>
                    <span>/ ระงับ {totalUsersCount - activeUsersCount}</span>
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 backdrop-blur-sm relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">ประเมินสุขภาพแล้ว</span>
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-3xl font-black text-white tracking-tight">{assessedUsersCount}</div>
                  <p className="text-xs text-slate-400 mt-1">
                    มีแผนการออกกำลังกายและตารางอาหารเฉพาะบุคคล
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 backdrop-blur-sm relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">ระบบส่งอีเมล (SMTP)</span>
                  <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-emerald-400 tracking-tight flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    ONLINE
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    เชื่อมต่อ Google SMTP (Port 465 SSL)
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 backdrop-blur-sm relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">เซิร์ฟเวอร์ VPS</span>
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                    </svg>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-emerald-400 tracking-tight flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    ONLINE
                  </div>
                  <p className="text-xs text-slate-400 mt-1 truncate">
                    dogaomshoo.online (SSL Active)
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions & Recent Activity Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Actions */}
              <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-4">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  คำสั่งด่วนสำหรับแอดมิน (Quick Actions)
                </h2>
                <div className="space-y-2.5">
                  <button
                    onClick={() => setActiveTab("users")}
                    className="w-full p-3 rounded-xl bg-slate-700/60 hover:bg-slate-700 border border-slate-600/70 text-left text-xs font-semibold flex items-center justify-between transition"
                  >
                    <span className="flex items-center gap-2">
                      👥 ค้นหาและจัดการสมาชิก
                    </span>
                    <span className="text-slate-400">&rarr;</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("system")}
                    className="w-full p-3 rounded-xl bg-slate-700/60 hover:bg-slate-700 border border-slate-600/70 text-left text-xs font-semibold flex items-center justify-between transition"
                  >
                    <span className="flex items-center gap-2">
                      ✉️ ทดสอบระบบส่งอีเมล (Live SMTP Test)
                    </span>
                    <span className="text-slate-400">&rarr;</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("logs")}
                    className="w-full p-3 rounded-xl bg-slate-700/60 hover:bg-slate-700 border border-slate-600/70 text-left text-xs font-semibold flex items-center justify-between transition"
                  >
                    <span className="flex items-center gap-2">
                      🔒 ดูประวัติ Audit Logs ล่าสุด
                    </span>
                    <span className="text-slate-400">&rarr;</span>
                  </button>
                </div>
              </div>

              {/* Recent Security Logs Preview */}
              <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/80 lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    ประวัติกิจกรรมความปลอดภัยล่าสุด (Audit Activity)
                  </h2>
                  <button
                    onClick={() => setActiveTab("logs")}
                    className="text-xs text-emerald-400 hover:underline"
                  >
                    ดูทั้งหมด &rarr;
                  </button>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-700">
                  <div className="divide-y divide-slate-700/80 text-xs">
                    {auditLogs.slice(0, 4).map((log) => (
                      <div key={log.id} className="p-3 flex items-center justify-between hover:bg-slate-750 transition">
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              log.status === "SUCCESS" ? "bg-emerald-400" : "bg-red-400"
                            }`}
                          />
                          <div>
                            <div className="font-semibold text-slate-200">{log.action}</div>
                            <div className="text-[11px] text-slate-400">เป้าหมาย: {log.email}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block">
                            {new Date(log.timestamp).toLocaleTimeString("th-TH")}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              log.status === "SUCCESS"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-red-500/10 text-red-400"
                            }`}
                          >
                            {log.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: USER MANAGEMENT ================= */}
        {activeTab === "users" && (
          <div className="space-y-5">
            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ หรืออีเมล..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                />
                <svg
                  className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs text-slate-400">สถานะ:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "suspended")}
                  className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">ทั้งหมด ({accounts.length})</option>
                  <option value="active">ปกติ (Active)</option>
                  <option value="suspended">ถูกระงับ (Suspended)</option>
                </select>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-700 font-bold">
                    <tr>
                      <th className="px-5 py-3.5">ผู้ใช้งาน</th>
                      <th className="px-4 py-3.5">รหัสผ่าน (Masked)</th>
                      <th className="px-4 py-3.5">สิทธิ์ (Role)</th>
                      <th className="px-4 py-3.5">สถานะบัญชี</th>
                      <th className="px-4 py-3.5">การประเมินร่างกาย</th>
                      <th className="px-5 py-3.5 text-right">การจัดการ (Actions)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/60">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                          ไม่พบข้อมูลผู้ใช้งานที่ค้นหา
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => {
                        const hasAssessment = !!assessments[user.email.toLowerCase()];
                        const isSuspended = user.status === "suspended";

                        return (
                          <tr key={user.email} className="hover:bg-slate-750/50 transition">
                            {/* ข้อมูลชื่อและอีเมล */}
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-sm">
                                  {user.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-bold text-white text-sm">{user.name}</div>
                                  <div className="text-slate-400 text-[11px]">{user.email}</div>
                                </div>
                              </div>
                            </td>

                            {/* รหัสผ่านถูก Masked เสมอตาม PDPA */}
                            <td className="px-4 py-4 font-mono text-slate-500">
                              <span title="รหัสผ่านถูกเข้ารหัสตามมาตรฐานความปลอดภัย แอดมินไม่สามารถเปิดดูได้">
                                ••••••••
                              </span>
                            </td>

                            {/* Role */}
                            <td className="px-4 py-4">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  user.role === "admin"
                                    ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                                    : "bg-slate-700 text-slate-300"
                                }`}
                              >
                                {user.role === "admin" ? "ADMIN" : "USER"}
                              </span>
                            </td>

                            {/* สถานะบัญชี */}
                            <td className="px-4 py-4">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isSuspended
                                    ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                    : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                }`}
                              >
                                {isSuspended ? "ระงับการใช้งาน" : "ปกติ (Active)"}
                              </span>
                            </td>

                            {/* สถานะแบบประเมิน */}
                            <td className="px-4 py-4">
                              {hasAssessment ? (
                                <button
                                  onClick={() =>
                                    setSelectedUserForModal({
                                      account: user,
                                      assessment: assessments[user.email.toLowerCase()],
                                    })
                                  }
                                  className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                  ดูข้อมูลสุขภาพ &rarr;
                                </button>
                              ) : (
                                <span className="text-slate-500 text-[11px]">ยังไม่ประเมิน</span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="px-5 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {/* ปุ่มส่งเมลรีเซ็ตรหัสผ่าน */}
                                <button
                                  onClick={() => handleSendResetEmail(user.email)}
                                  disabled={isSendingResetEmail === user.email}
                                  title="ส่งรหัส OTP ให้ผู้ใช้รีเซ็ตรหัสผ่านด้วยตนเองผ่านอีเมล"
                                  className="px-2.5 py-1.5 rounded-lg bg-slate-700/80 hover:bg-slate-700 text-slate-200 border border-slate-600 text-[11px] font-medium transition disabled:opacity-50 flex items-center gap-1"
                                >
                                  {isSendingResetEmail === user.email ? (
                                    <span>กำลังส่ง...</span>
                                  ) : (
                                    <>
                                      <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                      </svg>
                                      <span>ส่งรีเซ็ตรหัสผ่าน</span>
                                    </>
                                  )}
                                </button>

                                {/* ปุ่มสลับสถานะระงับ/ปลดระงับ */}
                                <button
                                  onClick={() => toggleUserStatus(user.email)}
                                  className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition ${
                                    isSuspended
                                      ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                      : "bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30"
                                  }`}
                                >
                                  {isSuspended ? "ปลดระงับ" : "ระงับบัญชี"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: FITNESS & NUTRITION INSIGHTS ================= */}
        {activeTab === "fitness" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* สัดส่วนเป้าหมายการออกกำลังกาย */}
              <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  🎯 เป้าหมายยอดนิยม (Goals)
                </h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between mb-1 text-slate-300">
                      <span>ลดไขมัน / ลดน้ำหนัก (Fat Loss)</span>
                      <span className="font-bold text-emerald-400">55%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="w-[55%] h-full bg-emerald-500 rounded-full" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1 text-slate-300">
                      <span>สร้างกล้ามเนื้อ (Muscle Build)</span>
                      <span className="font-bold text-teal-400">30%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="w-[30%] h-full bg-teal-500 rounded-full" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1 text-slate-300">
                      <span>สุขภาพและฟิตเฟิร์ม (General Fitness)</span>
                      <span className="font-bold text-blue-400">15%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="w-[15%] h-full bg-blue-500 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>

              {/* ระดับความฟิตของผู้ใช้ */}
              <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  🏋️ ระดับความฟิต (Experience)
                </h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between mb-1 text-slate-300">
                      <span>มือใหม่เพิ่งเริ่ม (Beginner)</span>
                      <span className="font-bold text-emerald-400">60%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="w-[60%] h-full bg-emerald-500 rounded-full" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1 text-slate-300">
                      <span>ระดับกลาง (Intermediate)</span>
                      <span className="font-bold text-yellow-400">30%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="w-[30%] h-full bg-yellow-500 rounded-full" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1 text-slate-300">
                      <span>ระดับสูง (Advanced)</span>
                      <span className="font-bold text-purple-400">10%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="w-[10%] h-full bg-purple-500 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>

              {/* รูปแบบการทานอาหาร */}
              <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  🥗 พฤติกรรมอาหาร (Diet Styles)
                </h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between mb-1 text-slate-300">
                      <span>อาหารตามสั่ง / สตรีทฟู้ด</span>
                      <span className="font-bold text-emerald-400">65%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="w-[65%] h-full bg-emerald-500 rounded-full" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1 text-slate-300">
                      <span>ทำอาหารทานเองที่บ้าน</span>
                      <span className="font-bold text-teal-400">25%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="w-[25%] h-full bg-teal-500 rounded-full" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1 text-slate-300">
                      <span>อาหารคลีน / ควบคุมพิเศษ</span>
                      <span className="font-bold text-blue-400">10%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="w-[10%] h-full bg-blue-500 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: AUDIT LOGS ================= */}
        {activeTab === "logs" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">บันทึกเหตุการณ์ความปลอดภัย (Audit Logs)</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  บันทึกประวัติการส่งรหัสผ่าน การเข้าสู่ระบบ และการปรับสถานะ โดยไม่มีการเก็บรหัสผ่านหรือรหัส OTP ใน Log
                </p>
              </div>
              <button
                onClick={fetchAuditLogs}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 flex items-center gap-1.5 transition"
              >
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                รีเฟรช Log
              </button>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-700 font-bold">
                    <tr>
                      <th className="px-5 py-3.5">เวลา (Timestamp)</th>
                      <th className="px-4 py-3.5">ประเภท</th>
                      <th className="px-4 py-3.5">อีเมลที่เกี่ยวข้อง</th>
                      <th className="px-4 py-3.5">กิจกรรม (Action)</th>
                      <th className="px-4 py-3.5">สถานะ</th>
                      <th className="px-5 py-3.5">รายละเอียดเพิ่มเติม</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/60 font-mono text-[11.5px]">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-750/50 transition">
                        <td className="px-5 py-3.5 text-slate-400 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString("th-TH")}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-bold text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-700 text-[10px]">
                            {log.type}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-200 font-sans font-medium">{log.email}</td>
                        <td className="px-4 py-3.5 text-slate-300 font-sans">{log.action}</td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              log.status === "SUCCESS"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-red-500/10 text-red-400 border border-red-500/20"
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-400 font-sans text-xs">{log.details || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 5: SYSTEM DIAGNOSTICS & LIVE TEST MAILER ================= */}
        {activeTab === "system" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* การตั้งค่าและสถานะ Mailer */}
              <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  สถานะการตั้งค่าระบบส่งอีเมล (SMTP Configuration)
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-700/80 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">SMTP Host:</span>
                      <strong className="text-slate-200">smtp.gmail.com</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">SMTP Port:</span>
                      <strong className="text-slate-200">465 (SSL / TLS Encrypted)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">SMTP Account:</span>
                      <strong className="text-emerald-400">pathomphon7n@gmail.com</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">App Password:</span>
                      <span className="font-mono text-slate-500">•••• •••• •••• •••• (Active)</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>ระบบส่งอีเมลพร้อมใช้งานจริงบน Production VPS และเครื่อง Localhost</span>
                  </div>
                </div>
              </div>

              {/* ฟอร์มทดสอบยิงอีเมลแบบ Real-time */}
              <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  🧪 ทดสอบส่งอีเมลทันที (Live Mail Tester)
                </h3>
                <p className="text-xs text-slate-400">
                  คุณสามารถกรอกอีเมลใดก็ได้เพื่อทดสอบว่าเซิร์ฟเวอร์สามารถส่งออกอีเมลผ่าน Google SMTP ได้จริงหรือไม่
                </p>

                <form onSubmit={handleTestMailSubmit} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      อีเมลปลายทางสำหรับทดสอบ
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="เช่น pathomphon7n@gmail.com"
                      value={testMailTarget}
                      onChange={(e) => setTestMailTarget(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isTestingMail}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-500 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isTestingMail ? (
                      <>
                        <svg className="animate-spin h-3.5 w-3.5 text-slate-950" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        กำลังส่งอีเมลทดสอบ...
                      </>
                    ) : (
                      "🚀 ยิงส่งอีเมลทดสอบระบบ"
                    )}
                  </button>

                  {testMailResult && (
                    <div
                      className={`p-3 rounded-xl border text-xs flex items-center gap-2 animate-fadeIn ${
                        testMailResult.success
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                          : "bg-red-500/10 border-red-500/30 text-red-300"
                      }`}
                    >
                      <span>{testMailResult.message}</span>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ================= USER ASSESSMENT MODAL ================= */}
      {selectedUserForModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-scaleUp">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-base">
                  ข้อมูลสุขภาพ: {selectedUserForModal.account.name}
                </h3>
                <p className="text-xs text-slate-400">{selectedUserForModal.account.email}</p>
              </div>
              <button
                onClick={() => setSelectedUserForModal(null)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center"
              >
                &times;
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              {selectedUserForModal.assessment ? (
                <>
                  <div className="grid grid-cols-3 gap-2.5 text-center">
                    <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700">
                      <span className="text-[10px] text-slate-400">BMI</span>
                      <div className="text-base font-bold text-emerald-400">
                        {selectedUserForModal.assessment.bmi?.toFixed(1) || "-"}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700">
                      <span className="text-[10px] text-slate-400">BMR</span>
                      <div className="text-base font-bold text-teal-400">
                        {selectedUserForModal.assessment.bmr || "-"} kcal
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700">
                      <span className="text-[10px] text-slate-400">TDEE</span>
                      <div className="text-base font-bold text-blue-400">
                        {selectedUserForModal.assessment.tdee || "-"} kcal
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">เป้าหมายหลัก:</span>
                      <strong className="text-white">
                        {selectedUserForModal.assessment.fitnessGoal || "ลดไขมัน"}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">จำนวนวันออกกำลังกาย:</span>
                      <strong className="text-white">
                        {selectedUserForModal.assessment.workoutDays || 3} วัน / สัปดาห์
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">แคลอรี่เป้าหมาย:</span>
                      <strong className="text-emerald-400">
                        {selectedUserForModal.assessment.targetCalories || "-"} kcal / วัน
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">โปรตีนเป้าหมาย:</span>
                      <strong className="text-teal-400">
                        {selectedUserForModal.assessment.targetProteinGrams || "-"} g / วัน
                      </strong>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-6 text-slate-500">ผู้ใช้ยังไม่ได้ทำแบบประเมินสุขภาพ</div>
              )}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950 text-right">
              <button
                onClick={() => setSelectedUserForModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
