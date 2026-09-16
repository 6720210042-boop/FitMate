"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import LiveWorkoutTrainer from "./LiveWorkoutTrainer";
import ExerciseDemoView from "./ExerciseDemoView";
import ThemeToggle from "@/components/ThemeToggle";

interface AssessmentData {
  gender: "male" | "female";
  birthDate?: string;
  age: number;
  height: number;
  weight: number;
  bmi: number;
  bmr: number;
  tdee: number;
  targetCalories: number;
  targetProteinGrams: number;
  chronicDiseases: string[];
  otherChronic?: string;
  pastInjuries: string[];
  otherInjury?: string;
  regularMedications?: string;
  isPregnantOrNursing?: boolean;
  currentActivityLevel: string;
  deskHours?: "high" | "medium" | "low";
  sleepHours?: "short" | "optimal" | "long";
  parqChestPain: boolean;
  parqDoctorWarning: boolean;
  parqDizziness: boolean;
  isRedFlag: boolean;
  fitnessGoals?: string[];
  fitnessGoal: string;
  experienceLevel?: "beginner" | "intermediate" | "advanced";
  targetDuration: string;
  workoutIntensity: string;
  workoutDays: number;
  sessionMinutes: number;
  workoutLocation: string;
  selectedEquipment: string[];
  movementLimits: string[];
  physiqueArchetype?: string;
  customPhysiqueName?: string;
  targetMuscles?: string[];
  bodyScanResult?: {
    shoulderToHipRatio: number;
    somatotype: "Ectomorph" | "Mesomorph" | "Endomorph";
    somatotypeThai: string;
    matchScore: number;
    frameTitle: string;
    frameDescription: string;
    advantages: string[];
    focusGaps: string[];
    timelineRecommendation: string;
    scannedAt: string;
    scanMethod: "webcam" | "photo" | "estimated";
    capturedImagePreview?: string;
  } | null;
  eatingStyle?: "street_food" | "home_cook" | "mixed";
  dietType: string;
  dislikedFoods: string[];
  otherDisliked?: string;
  foodAllergies: string[];
  otherAllergy?: string;
  supplements: string[];
  foodBudget: string;
  mealsPerDay: number;
  updatedAt?: string;
}

// ฐานข้อมูลแบบฝึกออกกำลังกาย (จัดกลุ่มตามขั้นตอน ฟอร์มท่า และความปลอดภัย)
interface ExerciseItem {
  name: string;
  phase?: "warmup" | "main" | "cooldown";
  sets: string;
  reps: string;
  rest: string;
  tag: string;
  safetyCue?: string; // ข้อควรระวังและเทคนิคการจัดระเบียบร่างกาย
  note?: string;
  contraindicatedIn?: string[];
  isTargetFocus?: boolean; // ป้ายโฟกัสพิเศษตามกล้ามเนื้อเป้าหมายของผู้ใช้
}

export interface MealOption {
  dish: string;
  category: "ตามสั่ง/นอกบ้าน" | "ทำเองง่ายๆ" | "พร้อมทานสะดวก";
  orderingTip?: string; // เทคนิคสั่งอาหารเลี่ยงโซเดียม/น้ำมัน
  plateRatio: string; // เช่น "ผัก 2 ส่วน + ข้าว 1 ส่วน + โปรตีน 1 ส่วน"
  imageUrl?: string; // URL ภาพถ่ายอาหารความละเอียดสูง
  imageAlt?: string; // คำอธิบายภาพเพื่อ Accessibility และ SEO
}

export interface MealItem {
  mealName: string;
  calories: number;
  protein: string;
  carbs: string;
  fat: string;
  safetyNote: string;
  options: MealOption[];
}

const allergyLabelMap: Record<string, string> = {
  seafood: "อาหารทะเล / กุ้ง / ปลา",
  peanuts: "ถั่วลิสง",
  dairy: "นมวัว / เนย / ผลิตภัณฑ์นม",
  egg: "ไข่ไก่ / ไข่เป็ด",
  soy: "ถั่วเหลือง / ผลิตภัณฑ์จากเต้าหู้",
  none: "ไม่มีประวัติแพ้อาหาร",
};

const dislikeLabelMap: Record<string, string> = {
  pork: "เนื้อหมู",
  poultry: "สัตว์ปีก (ไก่/เป็ด)",
  red_meat: "เนื้อแดง (วัว)",
  seafood: "อาหารทะเล / ปลา / กุ้ง",
  egg: "ไข่ไก่",
  vegetables: "ผักใบเขียว",
  spicy: "อาหารรสเผ็ด",
  none: "ไม่มี (ทานได้ทุกชนิด)",
};

const dietTypeLabelMap: Record<string, string> = {
  normal: "ทั่วไป / โภชนาการสมดุล (Balanced)",
  clean: "อาหารคลีน (Clean Food)",
  keto: "คีโตเจนิก (Ketogenic)",
  halal: "ฮาลาล (Halal ปลอดหมู 100%)",
  vegetarian: "มังสวิรัติ (Vegetarian)",
  vegan: "วีแกน (Vegan 100%)",
};

const eatingStyleLabelMap: Record<string, string> = {
  street_food: "ทานนอกบ้าน / ตามสั่งเป็นหลัก",
  home_cook: "ปรุงอาหารทานเองเป็นหลัก",
  mixed: "ผสมผสาน (ทำเองและซื้อทาน)",
};

const budgetLabelMap: Record<string, string> = {
  economy: "ประหยัดคุ้มค่า (เน้นโปรตีนราคาสบายกระเป๋า)",
  moderate: "ปานกลาง (สมดุลความสะดวกและคุณภาพ)",
  flexible: "ยืดหยุ่น / พรีเมียม (เน้นความสะดวกและวัตถุดิบเกรดสูง)",
};

const supplementLabelMap: Record<string, string> = {
  whey: "เวย์โปรตีน (Whey Protein)",
  creatine: "ครีเอทีน (Creatine Monohydrate)",
  multivitamin: "วิตามินรวม (Multivitamin)",
  fish_oil: "น้ำมันปลา (Fish Oil)",
  none: "ไม่ได้รับประทานอาหารเสริม",
};

export default function DashboardPage() {
  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "workout" | "nutrition">("overview");
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string } | null>(null);
  // ตัวเลือกเมนูที่กำลังแสดงในแต่ละมื้อ (index มื้อ -> index ตัวเลือก 0, 1, 2)
  const [selectedMealChoices, setSelectedMealChoices] = useState<Record<number, number>>({});

  // ระบบจับเวลาพักเซ็ต (Rest Timer)
  const [timerSeconds, setTimerSeconds] = useState(60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerPreset, setTimerPreset] = useState(60);

  // สถานะติ๊กออกกำลังกายของแต่ละวัน
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  // สถานะผ่านของแต่ละท่าออกกำลังกาย (key: `${dayIndex}-${exerciseIndex}`)
  const [completedExercises, setCompletedExercises] = useState<Record<string, boolean>>({});

  // โหมดตรวจจับท่าทางด้วย AI (Live AI Workout Mode)
  const [activeAIDay, setActiveAIDay] = useState<{
    dayIndex: number;
    dayTitle: string;
    exercises: ExerciseItem[];
    initialIndex?: number;
  } | null>(null);

  // สลับสถานที่ฝึกของแต่ละวัน (Day Locations: Home, Gym, Outdoor)
  const [dayLocations, setDayLocations] = useState<Record<number, "home" | "gym" | "outdoor">>({});

  // หน้าต่างภาพเคลื่อนไหวสาธิตตัวอย่างท่าออกกำลังกาย (Exercise Demo Modal)
  const [demoExercise, setDemoExercise] = useState<ExerciseItem | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("fitmate_assessment");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          queueMicrotask(() => {
            setAssessment(parsed);
            setIsLoading(false);
          });
        } catch {
          queueMicrotask(() => setIsLoading(false));
        }
      } else {
        queueMicrotask(() => setIsLoading(false));
      }

      const storedDays = localStorage.getItem("fitmate_completed_days");
      if (storedDays) {
        try {
          const parsedDays = JSON.parse(storedDays);
          queueMicrotask(() => setCompletedDays(parsedDays));
        } catch {
          // ignore
        }
      }

      const storedExercises = localStorage.getItem("fitmate_completed_exercises");
      if (storedExercises) {
        try {
          const parsedEx = JSON.parse(storedExercises);
          queueMicrotask(() => setCompletedExercises(parsedEx));
        } catch {
          // ignore
        }
      }

      const storedUser = localStorage.getItem("fitmate_user");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          queueMicrotask(() => setCurrentUser(parsedUser));
        } catch {
          // ignore
        }
      }

      const storedLocations = localStorage.getItem("fitmate_day_locations");
      if (storedLocations) {
        try {
          const parsedLocs = JSON.parse(storedLocations);
          queueMicrotask(() => setDayLocations(parsedLocs));
        } catch {
          // ignore
        }
      }
    }
  }, []);

  // สลับสถานที่ฝึกของวันนั้นๆ (บ้าน / ฟิตเนส / กลางแจ้ง)
  const handleSwitchDayLocation = (dayIndex: number, loc: "home" | "gym" | "outdoor") => {
    const next = { ...dayLocations, [dayIndex]: loc };
    setDayLocations(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("fitmate_day_locations", JSON.stringify(next));
    }
  };

  // จับเวลานับถอยหลัง
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerSeconds]);

  const handleStartTimer = (seconds: number) => {
    setTimerPreset(seconds);
    setTimerSeconds(seconds);
    setIsTimerRunning(true);
  };

  const handleToggleCompleteDay = (dayIndex: number) => {
    let next: number[];
    if (completedDays.includes(dayIndex)) {
      next = completedDays.filter((d) => d !== dayIndex);
    } else {
      next = [...completedDays, dayIndex];
    }
    setCompletedDays(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("fitmate_completed_days", JSON.stringify(next));
    }
  };

  // ติ๊กผ่านท่าอัตโนมัติ และถ้าครบทุกท่าของวันนั้นจะติ๊กผ่านวันให้อัตโนมัติทันที
  const handleCompleteExercise = (
    dayIndex: number,
    exIndex: number,
    dayExercises: ExerciseItem[]
  ) => {
    const key = `${dayIndex}-${exIndex}`;
    const nextEx = { ...completedExercises, [key]: true };
    setCompletedExercises(nextEx);
    if (typeof window !== "undefined") {
      localStorage.setItem("fitmate_completed_exercises", JSON.stringify(nextEx));
    }

    // ตรวจสอบว่าครบทุกท่าของวันนั้นหรือยัง
    const allDone = dayExercises.every(
      (_, idx) => idx === exIndex || nextEx[`${dayIndex}-${idx}`]
    );
    if (allDone && !completedDays.includes(dayIndex)) {
      const nextDays = [...completedDays, dayIndex];
      setCompletedDays(nextDays);
      if (typeof window !== "undefined") {
        localStorage.setItem("fitmate_completed_days", JSON.stringify(nextDays));
      }
    }
  };

  // โหลดข้อมูลแผนตัวอย่างทันทีสำหรับการทดสอบ / พรีเซนต์
  const loadDemoAssessment = () => {
    const demoData: AssessmentData = {
      gender: "male",
      birthDate: "1999-05-15",
      age: 27,
      height: 175,
      weight: 70,
      bmi: 22.9,
      bmr: 1675,
      tdee: 2303,
      targetCalories: 1853,
      targetProteinGrams: 112,
      chronicDiseases: ["none"],
      pastInjuries: ["none"],
      currentActivityLevel: "occasional",
      parqChestPain: false,
      parqDoctorWarning: false,
      parqDizziness: false,
      isRedFlag: false,
      fitnessGoals: ["fat_loss", "muscle_gain"],
      fitnessGoal: "fat_loss",
      targetDuration: "12_weeks",
      workoutIntensity: "moderate",
      workoutDays: 3,
      sessionMinutes: 45,
      workoutLocation: "home",
      selectedEquipment: ["bodyweight", "dumbbells"],
      movementLimits: ["none"],
      targetMuscles: ["chest", "back", "abs"],
      bodyScanResult: null,
      dietType: "general",
      dislikedFoods: ["none"],
      foodAllergies: ["none"],
      supplements: ["whey"],
      foodBudget: "medium",
      mealsPerDay: 3,
      updatedAt: new Date().toISOString(),
    };
    if (typeof window !== "undefined") {
      localStorage.setItem("fitmate_assessment", JSON.stringify(demoData));
    }
    setAssessment(demoData);
  };

  // รีเซ็ตข้อมูลแผนสุขภาพทั้งหมดเพื่อเริ่มใหม่
  const handleResetAllData = () => {
    if (typeof window !== "undefined") {
      const confirmed = window.confirm("คุณต้องการล้างข้อมูลแผนสุขภาพในเครื่องทั้งหมดเพื่อเริ่มต้นใหม่ใช่หรือไม่?");
      if (confirmed) {
        localStorage.removeItem("fitmate_assessment");
        localStorage.removeItem("fitmate_completed_days");
        localStorage.removeItem("fitmate_completed_exercises");
        setAssessment(null);
        setCompletedDays([]);
        setCompletedExercises({});
      }
    }
  };


  // ออกจากระบบ
  const handleLogout = () => {
    if (typeof window !== "undefined") {
      const confirmed = window.confirm("คุณต้องการออกจากระบบใช่หรือไม่?");
      if (confirmed) {
        localStorage.removeItem("fitmate_user");
        window.location.href = "/login";
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-zinc-600 text-sm">
        กำลังโหลดข้อมูลแดชบอร์ด...
      </div>
    );
  }

  // หากยังไม่เคยทำแบบประเมินสุขภาพ
  if (!assessment) {
    return (
      <div className="min-h-screen bg-slate-50 text-zinc-900 flex flex-col justify-center items-center px-4 py-16">
        <div className="max-w-md w-full bg-white border border-zinc-200 rounded-3xl p-8 text-center shadow-sm space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 mx-auto flex items-center justify-center">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-black text-zinc-900">
            ยังไม่พบข้อมูลแบบประเมินสุขภาพ
          </h1>
          <p className="text-xs text-zinc-600 leading-relaxed">
            เพื่อให้ FitMate คำนวณแคลอรี่ที่แม่นยำ และจัดโปรแกรมออกกำลังกายที่ปลอดภัยเฉพาะคุณ กรุณาทำแบบประเมินสุขภาพก่อนเริ่มต้นใช้งาน
          </p>
          <div className="space-y-2.5 pt-2">
            <Link
              href="/assessment"
              className="block w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              ทำแบบประเมินสุขภาพตอนนี้ (4 ขั้นตอน)
            </Link>
            <button
              type="button"
              onClick={loadDemoAssessment}
              className="w-full py-3.5 rounded-xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 font-bold text-sm transition flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>โหลดข้อมูลแผนตัวอย่างด่วน (Quick Demo Plan)</span>
            </button>
          </div>
          <Link href="/" className="block text-xs text-zinc-500 hover:underline pt-2">
            &larr; กลับหน้าหลัก
          </Link>
        </div>
      </div>
    );
  }

  // แปลงเป้าหมายเป็นข้อความ
  const goalLabels: Record<string, string> = {
    fat_loss: "ลดน้ำหนักและลดไขมันส่วนเกิน",
    muscle_gain: "เพิ่มมวลกล้ามเนื้อและกระชับสัดส่วน",
    endurance: "เพิ่มความฟิตและความอึด",
    rehab: "ฟื้นฟูร่างกายและกล้ามเนื้อ",
    general_health: "รักษาน้ำหนักและสุขภาพทั่วไป",
  };

  // ตรวจสอบข้อจำกัดร่างกาย
  const hasKneeIssue =
    assessment.movementLimits.includes("knee_pain") ||
    assessment.pastInjuries.includes("knee_surgery") ||
    assessment.chronicDiseases.includes("joints");

  const hasBackIssue =
    assessment.movementLimits.includes("back_pain") ||
    assessment.pastInjuries.includes("spine_disc");

  const hasShoulderIssue =
    assessment.movementLimits.includes("shoulder_pain") ||
    assessment.pastInjuries.includes("shoulder_injury");

  // คำนวณอัตราการเต้นหัวใจเป้าหมาย (Target Heart Rate Zones) อ้างอิง ACSM / CDC / AHA (HRmax = 220 - Age)
  const userAge = assessment.age || 26;
  const hrMax = Math.max(120, 220 - userAge);
  const thrZones = {
    hrMax,
    zone1: { name: "Zone 1 (Warm up / Active Recovery)", min: Math.round(hrMax * 0.50), max: Math.round(hrMax * 0.60), label: "50-60% HRmax", desc: "วอร์มอัพ คูลดาวน์ และฟื้นฟูกล้ามเนื้อ หายใจปกติ" },
    zone2: { name: "Zone 2 (Moderate Aerobic & Fat Burn)", min: Math.round(hrMax * 0.60), max: Math.round(hrMax * 0.70), label: "60-70% HRmax", desc: "โซนเป้าหมายหลักตามเกณฑ์ WHO/ACSM เผาผลาญไขมันดีเยี่ยม เสริมความแข็งแรงของหัวใจ พูดคุยได้เป็นประโยค" },
    zone3: { name: "Zone 3 (Aerobic Fitness)", min: Math.round(hrMax * 0.70), max: Math.round(hrMax * 0.80), label: "70-80% HRmax", desc: "พัฒนาความจุของปอดและระบบไหลเวียนโลหิต หายใจกระชั้นขึ้น" },
    zone4: { name: "Zone 4 (Vigorous / Anaerobic Threshold)", min: Math.round(hrMax * 0.80), max: Math.round(hrMax * 0.85), label: "80-85% HRmax", desc: "ระดับหนัก เพิ่มสปีดและความทนทานของกล้ามเนื้อ (ควรฝึกแบบช่วงสั้นๆ)" },
  };

  // สร้างตารางออกกำลังกายแบบคัดกรองความปลอดภัย 3 ขั้นตอน พร้อมรองรับการสลับสถานที่รายวันและจุดเน้นกล้ามเนื้อ
  const generatePersonalizedWorkoutDays = (
    currentDayLocations: Record<number, "home" | "gym" | "outdoor"> = {}
  ) => {
    const daysCount = assessment.workoutDays || 3;
    const hasDumbbell = assessment.selectedEquipment.includes("dumbbells");
    const targetMuscles = assessment.targetMuscles || [];
    const needsPostureWarmup =
      assessment.currentActivityLevel === "none" ||
      assessment.movementLimits.includes("shoulder_pain") ||
      assessment.movementLimits.includes("back_pain");
    const userExp: "beginner" | "intermediate" | "advanced" =
      assessment.experienceLevel ||
      (assessment.workoutIntensity === "intense"
        ? "advanced"
        : assessment.currentActivityLevel === "none" || assessment.workoutIntensity === "light"
        ? "beginner"
        : "intermediate");

    const days = [];

    // ==========================================
    // วันที่ 1: กล้ามเนื้อช่วงบนและความแข็งแรง (Upper Body & Posture)
    // ==========================================
    const day1Loc = currentDayLocations[0] || (assessment.workoutLocation as "home" | "gym" | "outdoor") || "home";
    const isGym1 = day1Loc === "gym";
    const isOutdoor1 = day1Loc === "outdoor";
    const isChestFocus = targetMuscles.includes("chest");
    const isBackFocus = targetMuscles.includes("back");
    const isShoulderFocus = targetMuscles.includes("shoulders_arms");
    const isAbsFocus = targetMuscles.includes("abs");

    const day1Exercises: ExerciseItem[] = [];

    // 1. Dynamic Warm-up
    if (needsPostureWarmup) {
      day1Exercises.push({
        name: isOutdoor1
          ? "Outdoor Standing Arm Circles & Torso Rotations (หมุนแขนและบิดลำตัวในสวน)"
          : "Thoracic Spine Rotations & Cat-Cow (คลายกระดูกอกและสันหลัง)",
        phase: "warmup",
        sets: "2 เซ็ต",
        reps: "8-10 รอบ",
        rest: "30 วิ",
        tag: "แก้ออฟฟิศซินโดรม",
        safetyCue: "ขยับอย่างนุ่มนวล หายใจเข้าเงยหน้า หายใจออกโก่งหลัง ไม่กระชากคอ",
      });
      day1Exercises.push({
        name: "Arm Circles & Scapular Squeezes (หมุนแขนและบีบสะบัก)",
        phase: "warmup",
        sets: "2 เซ็ต",
        reps: "12 ครั้ง",
        rest: "30 วิ",
        tag: "เปิดข้อต่อหัวไหล่",
        safetyCue: "กางแขนระดับไหล่ วาดเป็นวงกลมช้าๆ เพื่อหล่อลื่นข้อต่อไหล่",
      });
    } else {
      day1Exercises.push({
        name: "Arm Swings & Overhead Reaches (แกว่งแขนยืดเปิดอก)",
        phase: "warmup",
        sets: "2 เซ็ต",
        reps: "15 ครั้ง",
        rest: "30 วิ",
        tag: "วอร์มอัพข้อต่อไหล่",
        safetyCue: "แกว่งอย่างเป็นธรรมชาติ ยืดอกเปิดกว้าง หายใจเข้าลึกๆ",
      });
      day1Exercises.push({
        name: isOutdoor1
          ? "Walking Lunges with Torso Twist (ก้าวเดินวอร์มอัพยืดลำตัว)"
          : "Inchworm Walkouts (ก้มเดินมือกึ่งยืดหยุ่น)",
        phase: "warmup",
        sets: "2 เซ็ต",
        reps: "6-8 ครั้ง",
        rest: "30 วิ",
        tag: "กระตุ้นกล้ามเนื้อทั่วร่าง",
        safetyCue: "งอเข่าได้เล็กน้อย ก้าวทีละฝ่ามือ ล็อคแกนกลางให้ตรง",
      });
    }

    // 2. Main Working Sets
    // Chest
    if (isGym1) {
      day1Exercises.push({
        name: hasShoulderIssue
          ? "Machine Chest Press (ดันเครื่องแมชชีนเซฟข้อไหล่)"
          : "Incline Dumbbell Bench Press (ดันดัมเบลบนเบาะเอียงสร้างอกบน)",
        phase: "main",
        sets: isChestFocus ? "4 เซ็ต (โฟกัสพิเศษ)" : userExp === "beginner" ? "3 เซ็ต" : "4 เซ็ต",
        reps: "10-12 ครั้ง",
        rest: "60-90 วิ",
        tag: isChestFocus ? "กล้ามเนื้ออก (โฟกัสพิเศษตามเป้าหมาย)" : "กล้ามเนื้ออก (ฟิตเนส)",
        safetyCue: "ปรับเบาะให้แนวแรงอยู่ระดับกึ่งกลางอก ดันขึ้นบีบอก ไม่กางศอกเกิน 90 องศา",
        isTargetFocus: isChestFocus,
        note: isChestFocus ? "เพิ่มจำนวนเซ็ตเพื่อขยายมิติกล้ามเนื้ออกตามหุ่นต้นแบบ" : undefined,
      });
    } else if (isOutdoor1) {
      day1Exercises.push({
        name: hasShoulderIssue
          ? "Park Bench Incline Push-ups (วิดพื้นกับพนักพิงม้านั่งสวน)"
          : userExp === "beginner"
          ? "Park Bench Incline Push-ups (วิดพื้นวางมือบนม้านั่งสวน)"
          : "Park Bench Feet-Elevated Push-ups (วิดพื้นวางเท้าบนม้านั่งสร้างอกบน)",
        phase: "main",
        sets: isChestFocus ? "4 เซ็ต (โฟกัสพิเศษ)" : "3 เซ็ต",
        reps: "10-15 ครั้ง",
        rest: "60 วิ",
        tag: isChestFocus ? "กล้ามเนื้ออก (โฟกัสพิเศษตามเป้าหมาย)" : "อกและแขน (กลางแจ้ง)",
        safetyCue: "ลำตัวเป็นแผ่นตรง แขม่วหน้าท้อง มือวางกว้างกว่าไหล่เล็กน้อย",
        isTargetFocus: isChestFocus,
      });
    } else {
      // Home
      if (hasDumbbell) {
        if (hasShoulderIssue) {
          day1Exercises.push({
            name: "Floor Dumbbell Chest Press (ดันดัมเบลนอนบนพื้น)",
            phase: "main",
            sets: isChestFocus ? "4 เซ็ต (โฟกัสพิเศษ)" : userExp === "beginner" ? "3 เซ็ต" : "4 เซ็ต",
            reps: "10-12 ครั้ง",
            rest: "60-90 วิ",
            tag: isChestFocus ? "กล้ามเนื้ออก (โฟกัสพิเศษตามเป้าหมาย)" : "กล้ามเนื้ออก (เซฟข้อไหล่)",
            safetyCue: "ข้อศอกแตะพื้นเบาๆ ป้องกันข้อต่อหัวไหล่เปิดเกิน 90 องศา",
            isTargetFocus: isChestFocus,
            note: "ปลอดภัยสำหรับผู้ที่มีอาการเจ็บหัวไหล่",
          });
        } else {
          day1Exercises.push({
            name: "Dumbbell Bench / Floor Press (ดันดัมเบลสร้างกล้ามอก)",
            phase: "main",
            sets: isChestFocus ? "4 เซ็ต (โฟกัสพิเศษ)" : userExp === "beginner" ? "3 เซ็ต" : "4 เซ็ต",
            reps: "10-12 ครั้ง",
            rest: "60-90 วิ",
            tag: isChestFocus ? "กล้ามเนื้ออก (โฟกัสพิเศษตามเป้าหมาย)" : "กล้ามเนื้ออกและแขน",
            safetyCue: "ดึงสะบักลงชิดกัน ศอกทำมุมเฉียง 45 องศากับลำตัว ไม่กางข้อศอกเสมอไหล่",
            isTargetFocus: isChestFocus,
          });
        }
      } else {
        day1Exercises.push({
          name: userExp === "beginner"
            ? "Knee Push-ups / Incline Push-ups (วิดพื้นชันเข่า/ดันผนัง)"
            : "Standard Push-ups (วิดพื้นมาตรฐาน)",
          phase: "main",
          sets: isChestFocus ? "4 เซ็ต (โฟกัสพิเศษ)" : "3 เซ็ต",
          reps: userExp === "beginner" ? "8-10 ครั้ง" : "12-15 ครั้ง",
          rest: "60 วิ",
          tag: isChestFocus ? "กล้ามเนื้ออก (โฟกัสพิเศษตามเป้าหมาย)" : "อก แขน และแกนกลาง",
          safetyCue: "เกร็งหน้าท้อง ลำตัวเป็นเส้นตรงจากศีรษะถึงส้นเท้า สะโพกไม่ย้อย",
          isTargetFocus: isChestFocus,
        });
      }
    }

    // Back / Row
    if (isGym1) {
      day1Exercises.push({
        name: "Lat Pulldown (ดึงสายเคเบิลสร้างปีกหลัง V-Taper)",
        phase: "main",
        sets: isBackFocus ? "4 เซ็ต (โฟกัสพิเศษ)" : "3 เซ็ต",
        reps: "10-12 ครั้ง",
        rest: "60-90 วิ",
        tag: isBackFocus ? "หลังและปีก (โฟกัสพิเศษตามเป้าหมาย)" : "ปีกหลัง & V-Shape (ฟิตเนส)",
        safetyCue: "ยืดอก ดึงบาร์ลงมาระดับไหปลาร้า บีบสะบักเข้าหากันแน่นๆ ไม่เอนตัวเหวี่ยง",
        isTargetFocus: isBackFocus,
        note: isBackFocus ? "ท่าหลักในการสร้างปีกหลังตัว V ให้เอวดูคอดลง" : undefined,
      });
    } else if (isOutdoor1) {
      day1Exercises.push({
        name: "Park Bar Underhand Bodyweight Row / Towel Pull (ดึงตัวกับบาร์เตี้ยในสวน)",
        phase: "main",
        sets: isBackFocus ? "4 เซ็ต (โฟกัสพิเศษ)" : "3 เซ็ต",
        reps: "8-12 ครั้ง",
        rest: "60 วิ",
        tag: isBackFocus ? "หลังและปีก (โฟกัสพิเศษตามเป้าหมาย)" : "หลังส่วนบน & สะบัก (กลางแจ้ง)",
        safetyCue: "จับบาร์หรือพาดผ้าขนหนูกับเสา ลำตัวตรง ดึงอกเข้าหาบาร์ บีบสะบักแน่น",
        isTargetFocus: isBackFocus,
      });
    } else {
      // Home
      if (hasDumbbell) {
        day1Exercises.push({
          name: hasBackIssue
            ? "Chest-Supported Row (ดึงหลังแบบอกพิงเบาะเอียง)"
            : "One-Arm Dumbbell Row (ดึงดัมเบลชิดข้างลำตัว)",
          phase: "main",
          sets: isBackFocus ? "4 เซ็ต (โฟกัสพิเศษ)" : "3 เซ็ต",
          reps: "10-12 ครั้ง",
          rest: "60 วิ",
          tag: isBackFocus ? "หลังและปีก (โฟกัสพิเศษตามเป้าหมาย)" : "หลังส่วนบนและปีกหลัง",
          safetyCue: hasBackIssue
            ? "แนบอกกับเบาะตลอดเวลา ขจัดแรงกดที่กระดูกสันหลังส่วนล่าง 100%"
            : "รักษาหลังตรงขนาน ดึงข้อศอกเข้าหาสะโพก ไม่เหวี่ยงลำตัว",
          isTargetFocus: isBackFocus,
          note: hasBackIssue ? "ปรับเซฟหลังส่วนล่าง ป้องกันปวดหลัง" : undefined,
        });
      } else {
        day1Exercises.push({
          name: "Prone Cobra / Towel Lat Pull (นอนคว่ำดึงผ้าขนหนูเกร็งสะบัก)",
          phase: "main",
          sets: isBackFocus ? "4 เซ็ต (โฟกัสพิเศษ)" : "3 เซ็ต",
          reps: "10-12 ครั้ง (ค้าง 2 วิ)",
          rest: "45 วิ",
          tag: isBackFocus ? "หลังและปีก (โฟกัสพิเศษตามเป้าหมาย)" : "หลังส่วนบนและกล้ามเนื้อปรับบุคลิกภาพ",
          safetyCue: "บีบสะบักเข้าหากันแน่นๆ มองลงพื้น ไม่เงยหน้า เพื่อเซฟกระดูกต้นคอ",
          isTargetFocus: isBackFocus,
        });
      }
    }

    // Shoulders & Arms
    if (isGym1) {
      day1Exercises.push({
        name: hasShoulderIssue
          ? "Scapular Cable Pull-Aparts (ดึงเคเบิลกางสะบักฟื้นฟูไหล่)"
          : "Cable Lateral Raises (ดึงสายเคเบิลกางไหล่ข้างสร้างหัวไหล่ทรงสวย)",
        phase: "main",
        sets: isShoulderFocus ? "4 เซ็ต (โฟกัสพิเศษ)" : "3 เซ็ต",
        reps: "12-15 ครั้ง",
        rest: "45-60 วิ",
        tag: isShoulderFocus ? "ไหล่และแขน (โฟกัสพิเศษตามเป้าหมาย)" : "หัวไหล่ด้านข้าง (ฟิตเนส)",
        safetyCue: "ดึงสายเคเบิลขึ้นเสมอไหล่ ข้อศอกงอเล็กน้อย ห้ามยักคอ",
        isTargetFocus: isShoulderFocus,
      });
    } else if (isOutdoor1) {
      day1Exercises.push({
        name: "Park Bench Tricep Dips (ดริปหลังแขนกับม้านั่งสวน)",
        phase: "main",
        sets: isShoulderFocus ? "4 เซ็ต (โฟกัสพิเศษ)" : "3 เซ็ต",
        reps: "10-12 ครั้ง",
        rest: "45 วิ",
        tag: isShoulderFocus ? "ไหล่และแขน (โฟกัสพิเศษตามเป้าหมาย)" : "หลังแขนและไหล่ (กลางแจ้ง)",
        safetyCue: "วางมือบนขอบม้านั่ง หลังชิดม้านั่ง งอศอก 90 องศาแล้วดันตัวขึ้น",
        isTargetFocus: isShoulderFocus,
      });
    } else {
      // Home
      if (hasShoulderIssue) {
        day1Exercises.push({
          name: "Scapular Wall Slides (สไลด์แขนแนบกำแพงฟื้นฟูไหล่)",
          phase: "main",
          sets: "3 เซ็ต",
          reps: "10 ครั้ง",
          rest: "45 วิ",
          tag: "ฟื้นฟูความมั่นคงหัวไหล่",
          safetyCue: "กดหลังและแขนแนบผนัง ขยับช้าๆ ถ้าเจ็บให้ลดระยะการยกแขน",
          note: "หลีกเลี่ยงการยกเวทเหนือศีรษะเด็ดขาด",
        });
      } else {
        day1Exercises.push({
          name: hasDumbbell
            ? "Dumbbell Lateral Raises (กางแขนสร้างหัวไหล่ทรงสวย)"
            : "Water Bottle Lateral Raises (ยกกางแขนต้านแรง)",
          phase: "main",
          sets: isShoulderFocus ? "4 เซ็ต (โฟกัสพิเศษ)" : "3 เซ็ต",
          reps: "12-15 ครั้ง",
          rest: "45-60 วิ",
          tag: isShoulderFocus ? "ไหล่และแขน (โฟกัสพิเศษตามเป้าหมาย)" : "หัวไหล่ด้านข้าง",
          safetyCue: "ยกดัมเบลขึ้นเสมอระดับไหล่ ข้อศอกงอเล็กน้อย ห้ามเหวี่ยงลำตัวหรือยักคอ",
          isTargetFocus: isShoulderFocus,
        });
      }
    }

    // Core
    if (hasBackIssue) {
      day1Exercises.push({
        name: "Bird-Dog Exercise (เหยียดแขนขาตรงข้ามสลับข้าง)",
        phase: "main",
        sets: isAbsFocus ? "4 เซ็ต (โฟกัสพิเศษ)" : "3 เซ็ต",
        reps: "10 ครั้ง/ข้าง",
        rest: "45 วิ",
        tag: isAbsFocus ? "ซิกแพคและแกนกลาง (โฟกัสพิเศษตามเป้าหมาย)" : "แกนกลางลำตัวปลอดภัย (หมอนรองกระดูก)",
        safetyCue: "เกร็งหน้าท้อง ลำตัวขนานพื้น แขนและขาเหยียดเป็นแนวระนาบ ไม่แอ่นหลัง",
        isTargetFocus: isAbsFocus,
        note: "ท่ากายภาพบำบัดมาตรฐานสากล ลดอาการปวดหลัง",
      });
    } else {
      day1Exercises.push({
        name: isOutdoor1
          ? "Park Bench Seated Knee Tucks (ดึงเข่าเกร็งหน้าท้องบนม้านั่ง)"
          : "Forearm Plank (แพลงก์เกร็งหน้าท้อง)",
        phase: "main",
        sets: isAbsFocus ? "4 เซ็ต (โฟกัสพิเศษ)" : "3 เซ็ต",
        reps: isOutdoor1 ? "12-15 ครั้ง" : userExp === "beginner" ? "20-30 วินาที" : "40-60 วินาที",
        rest: "45 วิ",
        tag: isAbsFocus ? "ซิกแพคและแกนกลาง (โฟกัสพิเศษตามเป้าหมาย)" : "แกนกลางและความมั่นคง",
        safetyCue: "เกร็งหน้าท้องและบีบก้น ดันอกห่างพื้น ไม่ทิ้งสะโพกต่ำหรือยกสูงเกินไป",
        isTargetFocus: isAbsFocus,
      });
    }

    // 3. Cool-down & Static Stretching
    day1Exercises.push({
      name: "Doorway Chest & Bicep Stretch (ยืดกล้ามเนื้ออกแนบขอบประตู/ต้นไม้)",
      phase: "cooldown",
      sets: "2 เซ็ต",
      reps: "ข้างละ 30 วินาที",
      rest: "15 วิ",
      tag: "ยืดผ่อนคลายกล้ามเนื้ออก",
      safetyCue: "ก้าวขาไปข้างหน้าเบาๆ จนรู้สึกตึงสบายที่กล้ามเนื้ออก หายใจเข้าออกลึกๆ",
    });
    day1Exercises.push({
      name: "Child's Pose with Lat Reach (ท่าเด็กยืดคลายหลังและปีก)",
      phase: "cooldown",
      sets: "2 เซ็ต",
      reps: "45 วินาที",
      rest: "15 วิ",
      tag: "คลายหลังส่วนบนและสะบัก",
      safetyCue: "หย่อนสะโพกลงชิดส้นเท้า เดินปลายนิ้วไปข้างหน้าเบาๆ ผ่อนคลายกล้ามเนื้อคอและหลัง",
    });

    days.push({
      dayTitle: `วันฝึกที่ 1: กล้ามเนื้อช่วงบนและความแข็งแรง (${day1Loc === "gym" ? "ฟิตเนส" : day1Loc === "outdoor" ? "กลางแจ้ง" : "ที่บ้าน"})`,
      focus: "อก หลัง ไหล่ และแกนกลางลำตัว ปรับสมดุลบุคลิกภาพ",
      duration: `${assessment.sessionMinutes || 40} นาที`,
      exercises: day1Exercises,
    });

    // ==========================================
    // วันที่ 2: กล้ามเนื้อช่วงล่างและสะโพก (Lower Body & Core)
    // ==========================================
    const day2Loc = currentDayLocations[1] || (assessment.workoutLocation as "home" | "gym" | "outdoor") || "home";
    const isGym2 = day2Loc === "gym";
    const isOutdoor2 = day2Loc === "outdoor";
    const isGluteFocus = targetMuscles.includes("glutes");
    const isLegFocus = targetMuscles.includes("legs");

    const day2Exercises: ExerciseItem[] = [];

    // 1. Dynamic Warm-up
    day2Exercises.push({
      name: "Standing Hip Circles & Leg Swings (หมุนข้อสะโพกและแกว่งขา)",
      phase: "warmup",
      sets: "2 เซ็ต",
      reps: "ข้างละ 10-12 ครั้ง",
      rest: "20 วิ",
      tag: "หล่อลื่นข้อสะโพกและข้อเข่า",
      safetyCue: "จับกำแพงหรือพนักพิงทรงตัว แกว่งขาหน้าหลังอย่างนุ่มนวล ไม่สะบัดกระแทก",
    });
    day2Exercises.push({
      name: "Bodyweight Glute Activation Bridges (ยกสะโพกปลุกกล้ามเนื้อก้น)",
      phase: "warmup",
      sets: "2 เซ็ต",
      reps: "12 ครั้ง",
      rest: "30 วิ",
      tag: "เปิดการทำงานกล้ามเนื้อสะโพก",
      safetyCue: "กดส้นเท้าลงพื้น บีบก้นค้างไว้ 1-2 วินาทีที่จุดสูงสุด เพื่อให้กล้ามเนื้อก้นทำงานเต็มที่",
    });

    // 2. Main Working Sets
    if (hasKneeIssue) {
      // เซฟเข่า 100%: ไม่มีกระแทก ไม่งอเข่าลึกเกิน
      day2Exercises.push({
        name: isGym2
          ? "Cable Glute Kickbacks (เตะสายเคเบิลปั้นก้น เซฟเข่า 100%)"
          : "Glute Bridges (ยกสะโพกขึ้นจากพื้น)",
        phase: "main",
        sets: isGluteFocus ? "5 เซ็ต (โฟกัสพิเศษ)" : "4 เซ็ต",
        reps: "12-15 ครั้ง",
        rest: "45 วิ",
        tag: isGluteFocus ? "ก้นและสะโพก (โฟกัสพิเศษตามเป้าหมาย)" : "สะโพกและต้นขาด้านหลัง (Low Impact เซฟเข่า 100%)",
        safetyCue: "ใช้แรงผลักจากส้นเท้า บีบก้นแน่นที่จุดบนสุด ไร้แรงกดทับที่กระดูกสะบ้าหัวเข่า",
        isTargetFocus: isGluteFocus,
        note: "ออกแบบเฉพาะสำหรับผู้มีปัญหาข้อเข่าหรือข้อต่อ",
      });
      day2Exercises.push({
        name: "Wall Sit Isometric Hold (นั่งพิงกำแพง/ต้นไม้เกร็งต้นขา)",
        phase: "main",
        sets: isLegFocus ? "4 เซ็ต (โฟกัสพิเศษ)" : "3 เซ็ต",
        reps: "ค้าง 20-30 วินาที",
        rest: "60 วิ",
        tag: isLegFocus ? "ต้นขาและน่อง (โฟกัสพิเศษตามเป้าหมาย)" : "สร้างความแข็งแรงเอ็นรอบหัวเข่า",
        safetyCue: "หลังแนบกำแพง มุมเข่าไม่เกิน 90 องศา (หรือ 60 องศาตามระดับที่ไม่ปวด) ไม่ให้เข่าเลยปลายเท้า",
        isTargetFocus: isLegFocus,
      });
      day2Exercises.push({
        name: isGym2
          ? "Seated Hip Abduction Machine (กางสะโพกด้วยเครื่องแมชชีน)"
          : "Side-Lying Clamshells (นอนเปิดขาบริหารกล้ามเนื้อก้นมัดกลาง)",
        phase: "main",
        sets: isGluteFocus ? "4 เซ็ต (โฟกัสพิเศษ)" : "3 เซ็ต",
        reps: "12-15 ครั้ง/ข้าง",
        rest: "45 วิ",
        tag: isGluteFocus ? "ก้นและสะโพก (โฟกัสพิเศษตามเป้าหมาย)" : "เสริมความมั่นคงสะบ้าข้อเข่า",
        safetyCue: "ประกบส้นเท้าไว้ เปิดเข่าด้านบนขึ้น ลำตัวไม่เอี้ยวหรือหงายไปด้านหลัง",
        isTargetFocus: isGluteFocus,
      });
    } else {
      // ผู้ฝึกปกติ
      day2Exercises.push({
        name: isOutdoor2
          ? "Park Bench Step-ups & Reverse Lunges (ก้าวขึ้นม้านั่งและก้าวถอยย่อตัวในสวน)"
          : "Reverse Lunges (ก้าวถอยหลังย่อตัว)",
        phase: "main",
        sets: isLegFocus ? "4 เซ็ต (โฟกัสพิเศษ)" : "3 เซ็ต",
        reps: "10 ครั้ง/ข้าง",
        rest: "60 วิ",
        tag: isLegFocus ? "ต้นขาและสะโพก (โฟกัสพิเศษตามเป้าหมาย)" : "ต้นขา สะโพก และการทรงตัว",
        safetyCue: "ก้าวถอยหลังเพื่อลดแรงกดดันที่หัวเข่าด้านหน้า ทิ้งน้ำหนักกึ่งกลาง ลำตัวตั้งตรง",
        isTargetFocus: isLegFocus,
      });
      day2Exercises.push({
        name: hasDumbbell
          ? "Dumbbell Romanian Deadlift (RDL พับสะโพก)"
          : "Single-Leg Glute Bridge (ยกสะโพกขาเดียว)",
        phase: "main",
        sets: isGluteFocus ? "4 เซ็ต (โฟกัสพิเศษ)" : "3 เซ็ต",
        reps: "10-12 ครั้ง",
        rest: "60 วิ",
        tag: isGluteFocus ? "สะโพกและต้นขาหลัง (โฟกัสพิเศษตามเป้าหมาย)" : "ต้นขาด้านหลังและสะโพก (Hamstrings & Glutes)",
        safetyCue: "พับจากข้อพับสะโพก (Hip Hinge) หลังตรงตลอดแนว รู้สึกตึงที่ต้นขาหลังแล้วดึงสะโพกกลับ",
        isTargetFocus: isGluteFocus,
      });
    }

    // Core
    day2Exercises.push({
      name: "Dead Bug Exercise (นอนหงายลดแขนขาสลับข้าง)",
      phase: "main",
      sets: "3 เซ็ต",
      reps: "10-12 ครั้ง",
      rest: "45 วิ",
      tag: "แกนกลางลำตัวชั้นลึก ปลอดภัยต่อหลัง",
      safetyCue: "กดหลังส่วนล่างให้แนบสนิทกับพื้นตลอดการเคลื่อนไหว อย่าให้มีช่องว่างใต้หลัง",
    });

    // 3. Cool-down & Static Stretching
    day2Exercises.push({
      name: "Standing Quad & Hip Flexor Stretch (ยืดกล้ามเนื้อหน้าขาและขาหนีบ)",
      phase: "cooldown",
      sets: "2 เซ็ต",
      reps: "ข้างละ 30 วินาที",
      rest: "15 วิ",
      tag: "ผ่อนคลายกล้ามเนื้อหน้าขา",
      safetyCue: "จับผนังทรงตัว ดึงส้นเท้าชิดก้น ดันสะโพกไปข้างหน้าเบาๆ ลำตัวตรง",
    });
    day2Exercises.push({
      name: "Seated Hamstring & Calf Stretch (ยืดกล้ามเนื้อหลังขาและน่อง)",
      phase: "cooldown",
      sets: "2 เซ็ต",
      reps: "ข้างละ 30 วินาที",
      rest: "15 วิ",
      tag: "ยืดหยุ่นกล้ามเนื้อโซ่หลัง",
      safetyCue: "ก้มพับจากข้อสะโพก ไม่โก่งหลังส่วนบน ปลายเท้ากระดกขึ้นเล็กน้อย",
    });

    days.push({
      dayTitle: `วันฝึกที่ 2: กล้ามเนื้อช่วงล่างและสะโพก (${day2Loc === "gym" ? "ฟิตเนส" : day2Loc === "outdoor" ? "กลางแจ้ง" : "ที่บ้าน"})`,
      focus: hasKneeIssue
        ? "กระชับต้นขาและสะโพกแบบปลอดภัยไร้แรงกระแทกเข่า 100%"
        : "สร้างความแข็งแกร่งต้นขา สะโพก และระบบเผาผลาญ",
      duration: `${assessment.sessionMinutes || 40} นาที`,
      exercises: day2Exercises,
    });

    // ==========================================
    // วันที่ 3: คาร์ดิโอปลอดภัย & ฟื้นฟูสมรรถภาพ (Cardio & Recovery)
    // ==========================================
    const day3Exercises: ExerciseItem[] = [];

    // 1. Dynamic Warm-up
    day3Exercises.push({
      name: "Joint Mobility Flow (หมุนข้อต่อข้อเท้า เข่า สะโพก แขน)",
      phase: "warmup",
      sets: "2 เซ็ต",
      reps: "1-2 นาที",
      rest: "15 วิ",
      tag: "เตรียมพร้อมระบบไหลเวียน",
      safetyCue: "หมุนช้าๆ ควบคุมกล้ามเนื้อ หายใจเข้าออกสม่ำเสมอ",
    });
    day3Exercises.push({
      name: "Low-Impact Step Jacks (ก้าวแตะด้านข้างยกแขนขึ้นลง)",
      phase: "warmup",
      sets: "2 เซ็ต",
      reps: "30 วินาที",
      rest: "20 วิ",
      tag: "เพิ่มอุณหภูมิร่างกายแบบไร้แรงกระแทก",
      safetyCue: "ลงน้ำหนักนุ่มนวล งอเข่ารองรับน้ำหนัก ไม่กระโดดกระแทกพื้น",
    });

    // 2. Main Working Sets
    if (assessment.isRedFlag) {
      day3Exercises.push({
        name: "Zone 2 Brisk Walking (เดินเร็วหรือเดินชันคุมอัตราเต้นหัวใจ)",
        phase: "main",
        sets: "1 รอบต่อเนื่อง",
        reps: "20-25 นาที",
        rest: "พักจิบน้ำตามต้องการ",
        tag: "คาร์ดิโอโซน 2 เพื่อสุขภาพหัวใจ",
        safetyCue: "ระดับความเหนื่อยต้องพูดคุยได้เป็นประโยคสบายๆ (Talk Test) ไม่เหนื่อยหอบ",
        note: "โซนปลอดภัยสูงสุดตามมาตรฐาน ACSM สำหรับผู้เริ่มต้น",
      });
      day3Exercises.push({
        name: "Standing Balance & Deep Core Stabilization (ฝึกการทรงตัวและแกนกลาง)",
        phase: "main",
        sets: "3 เซ็ต",
        reps: "30 วินาที/ข้าง",
        rest: "30 วิ",
        tag: "ระบบประสาทและสมดุลร่างกาย",
        safetyCue: "ตามองจุดนิ่งด้านหน้า เกร็งสะโพกช่วยพยุง มือแตะเก้าอี้ได้หากรู้สึกโคลงเคลง",
      });
    } else {
      if (hasKneeIssue) {
        day3Exercises.push({
          name: "Stationary Cycling / Incline Treadmill Walk (ปั่นจักรยาน/เดินชัน)",
          phase: "main",
          sets: "1 รอบ",
          reps: "20-25 นาที (Zone 2)",
          rest: "สม่ำเสมอ",
          tag: "คาร์ดิโอเบิร์นไขมันไร้แรงกระแทกเข่า",
          safetyCue: "ปรับระดับเบาะนั่งให้พอดี ไม่ให้เข่างอพับเกิน 30 องศาขณะเหยียดบันไดลงสุด",
        });
        day3Exercises.push({
          name: "Shadow Boxing with Torso Rotations (ชกลมกระตุ้นอัตราเต้นหัวใจ)",
          phase: "main",
          sets: "3-4 รอบ",
          reps: "ทำงาน 45 วิ / พัก 20 วิ",
          rest: "20 วิ",
          tag: "เผาผลาญไขมันท่อนบน",
          safetyCue: "ออกหมัดอย่างผ่อนคลาย บิดตัวจากแกนกลางลำตัว ไม่ล็อกข้อศอกตึงเกินไป",
        });
      } else {
        day3Exercises.push({
          name: "Aerobic Intervals (เดินเร็วสลับวิ่งเหยาะ หรือก้าวชิดก้าวแตะ)",
          phase: "main",
          sets: "4-5 รอบ",
          reps: "ทำงาน 45 วิ / พัก 30 วิ",
          rest: "30 วิ",
          tag: "พัฒนาความจุหัวใจและปอด",
          safetyCue: "ลงน้ำหนักด้วยกึ่งกลางฝ่าเท้า ไม่กระแทกส้นเท้าลงพื้นแรง",
        });
        day3Exercises.push({
          name: "Standing High Knee March with Core Twist (ยกเข่าแตะศอกตรงข้าม)",
          phase: "main",
          sets: "3 เซ็ต",
          reps: "12 ครั้ง/ข้าง",
          rest: "30 วิ",
          tag: "เบิร์นไขมันและบริหารหน้าท้อง",
          safetyCue: "ยกเข่าขึ้นแล้วบิดช่วงอก ไม่ก้มคอ เกร็งหน้าท้องทุกครั้งที่ยกขา",
        });
      }
    }

    // 3. Cool-down & Static Stretching
    day3Exercises.push({
      name: "Cat-Cow to Child's Pose Flow (ท่ายืดหลังและผ่อนคลายลมหายใจ)",
      phase: "cooldown",
      sets: "2 เซ็ต",
      reps: "1 นาที",
      rest: "15 วิ",
      tag: "ปรับระบบประสาทให้สงบ (Parasympathetic)",
      safetyCue: "หายใจเข้าลึก 4 วินาที หายใจออกยาว 6 วินาที เพื่อให้อัตราเต้นหัวใจกลับสู่ระดับปกติ",
    });
    day3Exercises.push({
      name: "Supine Spinal Twist (นอนหงายบิดสะโพกยืดคลายเอว)",
      phase: "cooldown",
      sets: "2 เซ็ต",
      reps: "ข้างละ 30 วินาที",
      rest: "15 วิ",
      tag: "คลายหลังส่วนล่างและสะโพก",
      safetyCue: "กางแขนแนบพื้น บิดเข่าไปด้านข้างช้าๆ หัวไหล่ทั้งสองข้างยังคงแนบพื้น",
    });

    days.push({
      dayTitle: "วันฝึกที่ 3: คาร์ดิโอโซนปลอดภัยและฟื้นฟูกล้ามเนื้อ (Cardio & Recovery)",
      focus: assessment.isRedFlag
        ? "คาร์ดิโอระดับเบาเพื่อสุขภาพหัวใจและความดันโลหิต"
        : "คาร์ดิโอโซน 2 เผาผลาญไขมันและยืดหยุ่นกล้ามเนื้อทั่วร่าง",
      duration: `${assessment.sessionMinutes || 35} นาที`,
      exercises: day3Exercises,
    });

    // วันที่ 4: เสริมสร้างความกระชับรวม (ถ้าเลือก 4-5 วัน/สัปดาห์)
    if (daysCount >= 4) {
      const day4Exercises: ExerciseItem[] = [
        {
          name: "Arm Swings & Side Step Mobility",
          phase: "warmup",
          sets: "2 เซ็ต",
          reps: "10 ครั้ง",
          rest: "20 วิ",
          tag: "วอร์มอัพทั่วตัว",
          safetyCue: "เคลื่อนไหวนุ่มนวล สบายๆ",
        },
        {
          name: "Dumbbell / Band Deadlift (หรือ Glute Bridge หนักขึ้น)",
          phase: "main",
          sets: "3 เซ็ต",
          reps: "10-12 ครั้ง",
          rest: "60 วิ",
          tag: "กล้ามเนื้อโซ่หลังและความแข็งแรง",
          safetyCue: "รักษาแนวกระดูกสันหลังตรงตลอดการเคลื่อนไหว พับจากสะโพก",
        },
        {
          name: "Standing Dumbbell Bicep Curl to Shoulder Press",
          phase: "main",
          sets: "3 เซ็ต",
          reps: "10-12 ครั้ง",
          rest: "45-60 วิ",
          tag: "กล้ามเนื้อแขนและไหล่",
          safetyCue: "เกร็งหน้าท้องและบีบก้นแน่น ป้องกันไม่ให้เอวแอ่นขณะยกเวท",
        },
        {
          name: "Side Plank with Knee Support (แพลงก์ข้างงอเข่าพยุง)",
          phase: "main",
          sets: "3 เซ็ต",
          reps: "ค้าง 20-30 วินาที/ข้าง",
          rest: "45 วิ",
          tag: "กล้ามเนื้อเอวด้านข้างและความสมดุล",
          safetyCue: "ข้อศอกอยู่ตรงใต้หัวไหล่พอดี ยกสะโพกขึ้นจนลำตัวตรง",
        },
        {
          name: "Full Body Deep Breathing & Downward Dog Stretch",
          phase: "cooldown",
          sets: "2 เซ็ต",
          reps: "45 วินาที",
          rest: "15 วิ",
          tag: "ยืดเหยียดผ่อนคลายกล้ามเนื้อทั้งตัว",
          safetyCue: "สูดหายใจเข้าออกลึกๆ ผ่อนคลายกล้ามเนื้อทุกส่วน",
        },
      ];

      days.push({
        dayTitle: "วันฝึกที่ 4: ฟังก์ชันและกระชับทั่วเรือนร่าง (Full Body Functional)",
        focus: "เสริมสร้างสมดุล ความแข็งแกร่ง และการเผาผลาญ",
        duration: `${assessment.sessionMinutes || 40} นาที`,
        exercises: day4Exercises,
      });
    }

    return days;
  };

  const workoutSchedule = generatePersonalizedWorkoutDays(dayLocations);

  // ระบบ HARD FILTER อาหารที่แพ้ 100% และคัดกรองตามความชอบ/รูปแบบการทานเฉพาะบุคคล
  const generatePersonalizedMealPlan = (): MealItem[] => {
    const allergies = assessment.foodAllergies || ["none"];
    const otherAllergyText = (assessment.otherAllergy || "").trim().toLowerCase();
    const dislikedList = assessment.dislikedFoods || ["none"];
    const otherDislikedText = (assessment.otherDisliked || "").trim().toLowerCase();

    // 1. ตรวจสอบสารก่อภูมิแพ้ (Hard Filter)
    const isNoSeafood = allergies.includes("seafood") || otherAllergyText.includes("กุ้ง") || otherAllergyText.includes("ปู") || otherAllergyText.includes("หอย") || otherAllergyText.includes("ปลา") || otherAllergyText.includes("หมึก") || otherAllergyText.includes("seafood") || otherAllergyText.includes("shrimp") || otherAllergyText.includes("fish");
    const isNoPeanuts = allergies.includes("peanuts") || otherAllergyText.includes("ถั่ว") || otherAllergyText.includes("peanut");
    const isNoDairy = allergies.includes("dairy") || otherAllergyText.includes("นม") || otherAllergyText.includes("เนย") || otherAllergyText.includes("ชีส") || otherAllergyText.includes("dairy") || otherAllergyText.includes("milk") || otherAllergyText.includes("cheese");
    const isNoEgg = allergies.includes("egg") || otherAllergyText.includes("ไข่") || otherAllergyText.includes("egg");
    const isNoSoy = allergies.includes("soy") || otherAllergyText.includes("ถั่วเหลือง") || otherAllergyText.includes("เต้าหู้") || otherAllergyText.includes("soy") || otherAllergyText.includes("tofu");

    // 2. ตรวจสอบอาหารที่ไม่ชอบหรือไม่ทาน
    const isDislikePork = dislikedList.includes("pork") || otherDislikedText.includes("หมู") || otherDislikedText.includes("pork");
    const isDislikePoultry = dislikedList.includes("poultry") || otherDislikedText.includes("ไก่") || otherDislikedText.includes("เป็ด") || otherDislikedText.includes("chicken");
    const isDislikeRedMeat = dislikedList.includes("red_meat") || otherDislikedText.includes("เนื้อ") || otherDislikedText.includes("วัว") || otherDislikedText.includes("beef");
    const isDislikeSeafood = dislikedList.includes("seafood") || otherDislikedText.includes("กุ้ง") || otherDislikedText.includes("ปลา") || otherDislikedText.includes("ปู") || otherDislikedText.includes("หอย") || otherDislikedText.includes("หมึก") || otherDislikedText.includes("seafood") || otherDislikedText.includes("shrimp") || otherDislikedText.includes("fish");
    const isDislikeEgg = dislikedList.includes("egg") || otherDislikedText.includes("ไข่") || otherDislikedText.includes("egg");
    const isDislikeVeg = dislikedList.includes("vegetables") || otherDislikedText.includes("ผัก") || otherDislikedText.includes("veg");
    const isDislikeSpicy = dislikedList.includes("spicy") || otherDislikedText.includes("เผ็ด") || otherDislikedText.includes("spicy") || otherDislikedText.includes("พริก");

    // รวมเกณฑ์หลีกเลี่ยง (Avoidance criteria)
    const avoidSeafood = isNoSeafood || isDislikeSeafood;
    const avoidEgg = isNoEgg || isDislikeEgg;
    const isHalal = assessment.dietType === "halal";
    const avoidPork = isDislikePork || isHalal; // อาหารฮาลาลต้องปลอดเนื้อหมู 100%
    const avoidPoultry = isDislikePoultry;
    const avoidRedMeat = isDislikeRedMeat;

    // รูปแบบการทาน (Diet Type)
    const isVegetarian = assessment.dietType === "vegetarian" || assessment.dietType === "vegan";
    const isVegan = assessment.dietType === "vegan";
    const isKeto = assessment.dietType === "keto";
    const isClean = assessment.dietType === "clean";

    // วิถีชีวิตและแหล่งอาหาร (Eating Style)
    const eatingStyle = assessment.eatingStyle || "mixed";

    // การคำนวณสารอาหารต่อมื้อ
    const mealsCount = assessment.mealsPerDay || 3;
    const targetCal = assessment.targetCalories || 1800;
    const targetProtein = assessment.targetProteinGrams || 100;

    const calPerMeal = Math.round(targetCal / mealsCount);
    const proteinPerMeal = Math.round(targetProtein / mealsCount);

    // ปรับสัดส่วนคาร์บและไขมันตามรูปแบบไดเอท (เช่น คีโต ลดแป้งต่ำมาก เพิ่มไขมันดี)
    let carbsPerMeal = Math.round((calPerMeal * 0.48) / 4);
    let fatPerMeal = Math.round((calPerMeal * 0.25) / 9);
    if (isKeto) {
      carbsPerMeal = Math.round((calPerMeal * 0.08) / 4);
      fatPerMeal = Math.round((calPerMeal * 0.65) / 9);
    }

    // สรุปข้อความความปลอดภัยและเงื่อนไขที่ตรวจพบ
    const safetyBadges: string[] = [];
    if (avoidSeafood) safetyBadges.push("ปลอดอาหารทะเล/กุ้ง");
    if (avoidEgg) safetyBadges.push("ปลอดไข่");
    if (isNoDairy) safetyBadges.push("ปลอดนม/เนย");
    if (isNoSoy) safetyBadges.push("ปลอดถั่วเหลือง/เต้าหู้");
    if (isNoPeanuts) safetyBadges.push("ปลอดถั่วลิสง");
    if (avoidPork) safetyBadges.push(isHalal ? "ฮาลาล (ปลอดหมู 100%)" : "ปลอดเนื้อหมู");
    if (avoidPoultry) safetyBadges.push("ปลอดสัตว์ปีก/ไก่");
    if (avoidRedMeat) safetyBadges.push("ปลอดเนื้อแดง/วัว");
    if (isDislikeSpicy) safetyBadges.push("สูตรไม่เผ็ด");
    if (isKeto) safetyBadges.push("คีโตเจนิก (คาร์บต่ำพิเศษ)");
    if (isClean) safetyBadges.push("คลีนฟู้ด (โซเดียมต่ำ/ไร้น้ำตาลทราย)");
    if (isVegan) safetyBadges.push("วีแกน (พืช 100%)");

    const finalSafetyNote = safetyBadges.length > 0
      ? `ผ่านการคัดกรองเฉพาะบุคคล: ${safetyBadges.join(" • ")}`
      : "คัดกรองสารอาหารครบถ้วนตามโควต้าพลังงานและสุขภาพของคุณ";

    // ฟังก์ชันจัดเรียงตัวเลือกเมนูตาม Eating Style ของผู้ใช้
    const prioritizeByEatingStyle = (options: MealOption[]): MealOption[] => {
      if (eatingStyle === "street_food") {
        return [
          ...options.filter((o) => o.category === "ตามสั่ง/นอกบ้าน"),
          ...options.filter((o) => o.category !== "ตามสั่ง/นอกบ้าน"),
        ];
      }
      if (eatingStyle === "home_cook") {
        return [
          ...options.filter((o) => o.category === "ทำเองง่ายๆ"),
          ...options.filter((o) => o.category !== "ทำเองง่ายๆ"),
        ];
      }
      return options;
    };

    const meals: MealItem[] = [];

    // ==========================================
    // มื้อที่ 1 (มื้อเช้า หรือ Brunch)
    // ==========================================
    const meal1Title = mealsCount === 2 ? "มื้อที่ 1 (Brunch 10:00 - 11:30 น.)" : "มื้อเช้า (07:30 - 08:30 น.)";

    let m1StreetDish = "ข้าวราดกะเพราอกไก่ชิ้น + ไข่ต้ม (สั่ง: ผัดน้ำมันน้อย ไม่ใส่น้ำตาล)";
    let m1StreetTip = "บอกแม่ค้า: 'ผัดน้ำมันน้อยมาก ไม่ใส่น้ำตาล/ผงชูรส' สั่งไข่ต้มแทนไข่ดาวทอด ประหยัดแคลอรี่ได้ 150 kcal";
    let m1StreetPlate = "แตงกวาผักเคียง 2 ส่วน : ข้าวสวย 1 ทัพพี : อกไก่และไข่ต้ม 1 ส่วน";
    let m1StreetImage = "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80";

    if (isVegetarian || isVegan) {
      if (isNoSoy) {
        m1StreetDish = isVegan
          ? "ข้าวราดเห็ดสามอย่างผัดน้ำมันมะกอก + เมล็ดฟักทองอบ"
          : "ข้าวราดผัดเห็ดสามอย่างใส่น้ำมันมะกอก + ไข่ต้ม 2 ฟอง";
        m1StreetTip = "สั่ง: 'ผัดเห็ดผักรวมน้ำมันน้อย ไม่ใส่น้ำมันหอยแท้ ใช้ซีอิ๊วขาวเห็ดหอมแทน'";
        m1StreetPlate = "เห็ดและผักรวม 2 ส่วน : ข้าวกล้อง 1 ส่วน : โปรตีนจากพืช/ไข่ 1 ส่วน";
        m1StreetImage = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80";
      } else {
        m1StreetDish = isVegan
          ? "ข้าวราดเต้าหู้ขาวผัดกะเพราเห็ดหอม + ถั่วแระต้ม"
          : "ข้าวราดเต้าหู้ขาวผัดกะเพราเห็ดหอม + ไข่ต้ม (สั่งไม่หวาน)";
        m1StreetTip = "สั่ง: 'เต้าหู้ผัดกะเพราน้ำมันน้อย ไม่ใส่น้ำตาลและผงชูรส'";
        m1StreetPlate = "ผักเคียง 2 ส่วน : ข้าวสวย 1 ทัพพี : เต้าหู้ขาว 1 ส่วน";
        m1StreetImage = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80";
      }
    } else {
      // ผู้ทานเนื้อสัตว์
      const proteinChoice = !avoidPoultry ? "อกไก่ชิ้น" : !avoidPork ? "สันในหมู" : "เนื้อวัวไม่ติดมัน/เต้าหู้";
      const cookMethod = isDislikeSpicy ? "ผัดกระเทียมพริกไทยดำสูตรไม่เผ็ด" : "ผัดกะเพรา";
      const eggSide = avoidEgg || isVegan ? "" : " + ไข่ต้ม";

      if (isKeto) {
        m1StreetDish = `เกาเหลา${proteinChoice}น้ำใสพิเศษเนื้อ + ไข่ต้ม 2 ฟอง (ไม่ใส่กระเทียมเจียว ไม่ใส่เส้น)`;
        m1StreetTip = "สั่ง: 'เน้นเนื้อล้วน ผักบุ้งถั่วงอกลวก ไม่ใส่น้ำตาล/ผงชูรส ไม่เจียวกระเทียม' ได้โปรตีนและไขมันดี คาร์บต่ำมาก";
        m1StreetPlate = "ผักใบเขียว 2 ส่วน : ไข่ต้มและอโวคาโด 1 ส่วน : เนื้อสัตว์ล้วน 1 ส่วน";
        m1StreetImage = "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80";
      } else {
        m1StreetDish = `ข้าวราด${cookMethod}${proteinChoice}${eggSide} (สั่ง: ผัดน้ำมันน้อย ไม่ใส่น้ำตาล)`;
        m1StreetTip = `สั่งแม่ค้า: 'ผัดน้ำมันน้อย ไม่หวาน ไม่ชูรส' ${avoidEgg ? "ขอเพิ่มเนื้อสัตว์ทดแทนไข่" : "สั่งไข่ต้มเพื่อเลี่ยงน้ำมันทอด"}`;
        m1StreetPlate = `ผักเคียง 2 ส่วน : ข้าวกล้อง/ข้าวสวย 1 ทัพพี : ${proteinChoice} 1 ส่วน`;
        m1StreetImage = "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80";
      }
    }

    // ตัวเลือกที่ 2: ทำเองง่ายๆ
    let m1HomeDish = "ข้าวไรซ์เบอร์รี่ 1 ทัพพี + อกไก่หมักพริกไทยดำย่าง + บรอกโคลี/แครอทนึ่ง";
    let m1HomeTip = "ใช้กระทะเทฟลอนสเปรย์น้ำมันมะกอกบางๆ ปรุงรสด้วยซีอิ๊วขาวลดโซเดียม 1 ช้อนชา + พริกไทยดำบด";
    let m1HomePlate = "บรอกโคลีและแครอทนึ่ง 2 ส่วน : ข้าวไรซ์เบอร์รี่ 1 ส่วน : อกไก่ย่าง 1 ฝ่ามือ";
    let m1HomeImage = "https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=800&q=80";

    if (isVegetarian || isVegan) {
      if (isNoSoy) {
        m1HomeDish = isVegan
          ? "ข้าวกล้อง + เห็ดย่างสมุนไพร + ถั่วลูกไก่ต้มคลุกน้ำมันมะกอก"
          : "ข้าวกล้อง + เห็ดย่างสมุนไพร + ถั่วลูกไก่ต้ม + ไข่ต้ม 2 ฟอง";
        m1HomeTip = "ต้มถั่วลูกไก่ไว้ล่วงหน้า ใช้น้ำมันมะกอก 1 ช้อนชาคลุกเห็ดก่อนกริลล์";
        m1HomePlate = "สลัดผักและเห็ด 2 ส่วน : ข้าวกล้อง 1 ส่วน : ถั่วลูกไก่ 1 ส่วน";
        m1HomeImage = "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80";
      } else {
        m1HomeDish = "ข้าวกล้อง + เต้าหู้ขาวกริลล์ซอสเทอริยากิโซเดียมต่ำ + บรอกโคลีนึ่ง";
        m1HomeTip = "ซับน้ำจากเต้าหู้ให้แห้ง กริลล์บนกระทะจนผิวเหลืองกรอบ ใส่น้ำซอสเพียง 1 ช้อนโต๊ะ";
        m1HomePlate = "บรอกโคลีนึ่ง 2 ส่วน : ข้าวกล้อง 1 ส่วน : เต้าหู้กริลล์ 1 แผ่นใหญ่";
        m1HomeImage = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80";
      }
    } else {
      const homeMeat = !avoidPoultry ? "อกไก่หมักสมุนไพร" : !avoidPork ? "สันในหมูไร้มัน" : "เนื้อสะโพกวัวไม่ติดมัน";
      if (isKeto) {
        m1HomeDish = `${homeMeat}ย่างกระทะน้ำมันมะกอก + สลัดผักร็อกเก็ตใส่อะโวคาโดครึ่งลูก + ไข่ต้ม 2 ฟอง`;
        m1HomeTip = "ย่างด้วยน้ำมันมะกอก โรยเกลือชมพูและพริกไทยดำ คาร์โบไฮเดรตต่ำมาก ได้ไขมันไม่อิ่มตัวเชิงเดี่ยว";
        m1HomePlate = "ผักสลัด 2 ส่วน : อะโวคาโด 1 ส่วน : เนื้อสัตว์และไข่ 1 ส่วน";
        m1HomeImage = "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80";
      } else {
        m1HomeDish = `ข้าวกล้อง/ไรซ์เบอร์รี่ 1 ทัพพี + ${homeMeat}ย่าง + ผักลวก (ฟักทอง/บรอกโคลี)`;
        m1HomeTip = "หมักเนื้อด้วยเกลือชมพู พริกไทยดำ และซีอิ๊วขาวลดโซเดียม ย่างในหม้อทอดไร้น้ำมัน";
        m1HomePlate = `ผักลวก 2 ส่วน : ข้าวกล้อง 1 ส่วน : ${homeMeat} 1 ส่วน`;
        m1HomeImage = "https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=800&q=80";
      }
    }

    // ตัวเลือกที่ 3: พร้อมทานสะดวก
    let m1QuickDish = "อกไก่นุ่มพร้อมทาน + ข้าวกล้องถ้วย + สลัดผักน้ำใส";
    let m1QuickTip = "ฉีกซองอุ่นเวฟ 1 นาที ทานคู่น้ำสลัดงาญี่ปุ่นน้ำใส (เทเพียงครึ่งซอง เลี่ยงน้ำสลัดครีม)";
    let m1QuickPlate = "สลัดผัก 1 กล่อง (2 ส่วน) : ข้าวกล้อง 1 ถ้วย (1 ส่วน) : อกไก่นุ่ม 1 ชิ้น (1 ส่วน)";
    let m1QuickImage = "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=800&q=80";

    if (isVegetarian || isVegan) {
      m1QuickDish = isNoSoy
        ? (isVegan ? "ข้าวโพดหวานต้ม + ถั่วรวมอบธรรมชาติ + สลัดผักรวมน้ำใส" : "ข้าวโพดหวานต้ม + ไข่ต้มพร้อมทาน 2 ฟอง + สลัดผักรวมน้ำใส")
        : (isVegan ? "ถั่วแระญี่ปุ่นพร้อมทาน + ข้าวกล้องถ้วย + น้ำเต้าหู้สูตรไม่หวาน" : "ถั่วแระญี่ปุ่นพร้อมทาน + ข้าวกล้องถ้วย + นมถั่วเหลืองสูตรไม่หวาน + ไข่ต้ม 1 ฟอง");
      m1QuickTip = "หยิบง่ายในร้านสะดวกซื้อ โปรตีนจากพืช อิ่มท้องเร็ว ปราศจากไขมันทรานส์";
      m1QuickPlate = "สลัดผัก 2 ส่วน : ข้าวกล้อง/ข้าวโพด 1 ส่วน : โปรตีนจากพืช 1 ส่วน";
      m1QuickImage = "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80";
    } else if (avoidPoultry) {
      m1QuickDish = !avoidPork
        ? "หมูย่างพร้อมทานสูตรไขมันต่ำ + ข้าวกล้องถ้วย + สลัดผักสด"
        : "ไข่ตุ๋นโซเดียมต่ำ 2 ถ้วย + ข้าวกล้องถ้วย + ผลไม้สด 1 ส่วน";
      m1QuickTip = "เลือกสูตรโซเดียมต่ำ หลีกเลี่ยงน้ำจิ้มหวาน";
      m1QuickPlate = "ผักสด 2 ส่วน : ข้าวกล้อง 1 ส่วน : โปรตีน 1 ส่วน";
      m1QuickImage = "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80";
    } else if (isKeto) {
      m1QuickDish = "อกไก่นุ่มพร้อมทาน 2 ชิ้น + ไข่ต้ม 2 ฟอง + อัลมอนด์อบธรรมชาติ 1 ซองเล็ก (ไม่มีข้าว)";
      m1QuickTip = "ตัดคาร์บแปรรูปออกทั้งหมด ได้โปรตีนเน้นๆ และไขมันดีจากถั่วเปลือกแข็ง";
      m1QuickPlate = "ผักสลัด 2 ส่วน : อัลมอนด์ 1 ส่วน : อกไก่นุ่มและไข่ต้ม 1 ส่วน";
      m1QuickImage = "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=800&q=80";
    }

    meals.push({
      mealName: meal1Title,
      calories: calPerMeal,
      protein: `${proteinPerMeal} กรัม`,
      carbs: `${carbsPerMeal} กรัม`,
      fat: `${fatPerMeal} กรัม`,
      safetyNote: finalSafetyNote,
      options: prioritizeByEatingStyle([
        { category: "ตามสั่ง/นอกบ้าน", dish: m1StreetDish, orderingTip: m1StreetTip, plateRatio: m1StreetPlate, imageUrl: m1StreetImage, imageAlt: m1StreetDish },
        { category: "ทำเองง่ายๆ", dish: m1HomeDish, orderingTip: m1HomeTip, plateRatio: m1HomePlate, imageUrl: m1HomeImage, imageAlt: m1HomeDish },
        { category: "พร้อมทานสะดวก", dish: m1QuickDish, orderingTip: m1QuickTip, plateRatio: m1QuickPlate, imageUrl: m1QuickImage, imageAlt: m1QuickDish },
      ]),
    });

    // ==========================================
    // มื้อที่ 2 (มื้อกลางวัน หรือ Dinner ของคนทาน 2 มื้อ)
    // ==========================================
    const meal2Title = mealsCount === 2 ? "มื้อที่ 2 (Dinner 17:00 - 18:30 น.)" : "มื้อกลางวัน (12:00 - 13:00 น.)";

    let m2StreetDish = "เกาเหลาไก่ฉีกพิเศษเนื้อ + ข้าวสวย 1 ทัพพี (สั่ง: ไม่ใส่กระเทียมเจียว ไม่ใส่ผงชูรส)";
    let m2StreetTip = "สั่ง: 'ไม่เจียวน้ำมัน ไม่ปรุงน้ำตาลเพิ่ม ซดน้ำซุปเพียงเล็กน้อย' เพื่อคุมโซเดียมไม่ให้บวมน้ำ";
    let m2StreetPlate = "ถั่วงอกและผักเคียง 2 ส่วน : ข้าวสวย 1 ส่วน : เนื้อสัตว์ 1 ส่วน";
    let m2StreetImage = "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80";

    if (isVegetarian || isVegan) {
      m2StreetDish = isNoSoy
        ? "ราดหน้าหมี่ข้าวกล้องผักรวมเห็ดหอม (สั่ง: ใช้น้ำมันน้อย แยกน้ำราด ไม่หวาน)"
        : "ก๋วยเตี๋ยวลุยสวนเต้าหู้เห็ดหอม + น้ำจิ้มรสเปรี้ยวหวานน้อย";
      m2StreetTip = "เน้นผักสดและเห็ด ทานน้ำจิ้มพอแตะรสชาติ หลีกเลี่ยงของทอดเจที่มีน้ำมันแฝงสูง";
      m2StreetPlate = "ผักสดลุยสวน 2 ส่วน : แผ่นแป้งข้าว 1 ส่วน : เต้าหู้/เห็ด 1 ส่วน";
      m2StreetImage = "https://images.unsplash.com/photo-1539136788836-5699e78bfc75?auto=format&fit=crop&w=800&q=80";
    } else {
      if (!avoidSeafood) {
        m2StreetDish = "ข้าวหน้าปลากะพงย่างซีอิ๊วโซเดียมต่ำ + ผักต้มเคียง (สั่งไม่เค็มจัด)";
        m2StreetTip = "สั่งแม่ค้าราดซอสเพียง 1 ช้อนชา เลี่ยงการทานหนังปลาทอดกรอบ";
        m2StreetImage = "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80";
      } else {
        const m2Meat = !avoidPoultry ? "ไก่ฉีก" : !avoidPork ? "หมูสันในล้วน" : "เนื้อวัวตุ๋นไร้มัน";
        m2StreetDish = `เกาเหลา${m2Meat}พิเศษเนื้อ + ข้าวสวย 1 ทัพพี (สั่ง: ไม่ใส่กระเทียมเจียว ไม่ใส่ผงชูรส)`;
        m2StreetImage = "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=800&q=80";
      }
    }

    let m2HomeDish = "สเต็กอกไก่กริลล์พริกไทยดำ + มันเทศนึ่ง 1 หัว + สลัดผักน้ำส้มสายชูหมักแอปเปิ้ล (ACV)";
    let m2HomeTip = "ใช้ความร้อนปานกลาง โรยเกลือเล็กน้อยและโรสแมรี่ ช่วยเพิ่มกลิ่นหอมโดยไม่ต้องพึ่งผงปรุงรสสำเร็จรูป";
    let m2HomePlate = "สลัดผัก 2 ส่วน : มันเทศนึ่ง 1 ส่วน : สเต็ก 1 ชิ้นเต็มฝ่ามือ";
    let m2HomeImage = "https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=800&q=80";

    if (isVegetarian || isVegan) {
      m2HomeDish = isNoSoy
        ? "สลัดควินัวผสมถั่วลูกไก่อบเครื่องเทศ + อะโวคาโดครึ่งลูกและมะเขือเทศราชินี"
        : "เทมเป้อบซอสการ์ลิคเฮิร์บ + ข้าวไรซ์เบอร์รี่ + ผัดผักกวางตุ้งน้ำมันมะกอก";
      m2HomeTip = "ควินัวและเทมเป้เป็นสุดยอดแหล่งโปรตีนพืชที่มีกรดอะมิโนครบถ้วน อิ่มท้องนาน";
      m2HomePlate = "ผักสลัดหลากสี 2 ส่วน : ควินัว/ข้าวไรซ์เบอร์รี่ 1 ส่วน : เทมเป้/ถั่ว 1 ส่วน";
      m2HomeImage = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80";
    } else {
      if (!avoidSeafood) {
        m2HomeDish = "สเต็กปลาแซลมอนหรือปลากะพงย่างกระทะ + มันเทศนึ่ง + หน่อไม้ฝรั่งย่าง";
        m2HomeTip = "ปลาแซลมอนให้กรดไขมันโอเมก้า 3 สูง ย่างบนกระทะโดยใช้น้ำมันปลาธรรมชาติ ไม่ต้องเติมน้ำมันพืช";
        m2HomeImage = "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80";
      } else {
        const meat2 = !avoidPoultry ? "อกไก่" : !avoidPork ? "สันในหมู" : "เนื้อสันในวัว";
        m2HomeDish = `สเต็ก${meat2}กริลล์พริกไทยดำ + มันเทศนึ่ง 1 หัว + สลัดผักสด`;
        m2HomeImage = "https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=800&q=80";
      }
      if (isKeto) {
        m2HomeDish = m2HomeDish.replace("มันเทศนึ่ง 1 หัว", "กะหล่ำดอกบดและสลัดอะโวคาโด");
        m2HomeImage = "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80";
      }
    }

    let m2QuickDish = "สันในไก่ย่างถ่านพร้อมทาน + ข้าวสวยหอมมะลิผสมข้าวกล้อง + น้ำพริกอกไก่คลีน";
    let m2QuickTip = "เลือกเนื้อสัตว์ไม่ติดมัน รสชาติจัดจ้านแต่โซเดียมต่ำ";
    let m2QuickPlate = "ผักสด 2 ส่วน : ข้าวกล้องหรือขนมปัง 1 ส่วน : เนื้อสัตว์ 1 ส่วน";
    let m2QuickImage = "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80";

    if (isVegetarian || isVegan) {
      m2QuickDish = "สลัดโรลผักสดเต้าหู้ + ข้าวโพดหวานนึ่ง + ผลไม้สดตามฤดูกาล (ฝรั่ง/แอปเปิ้ล)";
      m2QuickTip = "แตะน้ำจิ้มบางๆ ไม่จุ่มจนท่วม ได้ทั้งวิตามินและใยอาหารกระตุ้นการขับถ่าย";
      m2QuickPlate = "ผักสดสลัดโรล 2 ส่วน : ข้าวโพด 1 ส่วน : เต้าหู้ 1 ส่วน";
      m2QuickImage = "https://images.unsplash.com/photo-1539136788836-5699e78bfc75?auto=format&fit=crop&w=800&q=80";
    } else if (!avoidSeafood) {
      m2QuickDish = "ทูน่าในน้ำแร่ 1 กระป๋อง + ขนมปังโฮลวีต 2 แผ่น + ผักกาดคอสสด";
      m2QuickTip = "เลือกทูน่า 'ในน้ำแร่' เท่านั้นเพื่อเลี่ยงน้ำมันพืชแปรรูป บีบมะนาวสดเพิ่มรสชาติ";
      m2QuickImage = "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80";
    } else if (avoidPoultry) {
      m2QuickDish = !avoidPork
        ? "สันในหมูย่างจิ้มแจ่วสูตรคลีน + ข้าวกล้องถ้วย + แตงกวาผักสด"
        : "ไข่ต้มพร้อมทาน 3 ฟอง + ข้าวโพดหวานนึ่ง + สลัดผักรวม";
      m2QuickImage = "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80";
    }

    meals.push({
      mealName: meal2Title,
      calories: calPerMeal,
      protein: `${proteinPerMeal} กรัม`,
      carbs: `${carbsPerMeal} กรัม`,
      fat: `${fatPerMeal} กรัม`,
      safetyNote: finalSafetyNote,
      options: prioritizeByEatingStyle([
        { category: "ตามสั่ง/นอกบ้าน", dish: m2StreetDish, orderingTip: m2StreetTip, plateRatio: m2StreetPlate, imageUrl: m2StreetImage, imageAlt: m2StreetDish },
        { category: "ทำเองง่ายๆ", dish: m2HomeDish, orderingTip: m2HomeTip, plateRatio: m2HomePlate, imageUrl: m2HomeImage, imageAlt: m2HomeDish },
        { category: "พร้อมทานสะดวก", dish: m2QuickDish, orderingTip: m2QuickTip, plateRatio: m2QuickPlate, imageUrl: m2QuickImage, imageAlt: m2QuickDish },
      ]),
    });

    // ==========================================
    // มื้อที่ 3 (มื้อเย็น สำหรับผู้ทาน 3 มื้อขึ้นไป)
    // ==========================================
    if (mealsCount >= 3) {
      const meal3Title = "มื้อเย็น (17:30 - 19:00 น.)";

      let m3StreetDish = "แกงจืดเต้าหู้ไก่สับตำลึง/ผักกาดขาว (สั่ง: ไม่ใส่ผงชูรส ไม่ใส่กระเทียมเจียว) + ข้าวกล้องครึ่งทัพพี";
      let m3StreetTip = "มื้อเย็นย่อยง่าย ซดน้ำแกงจืดอุ่นๆ ช่วยให้อยู่ท้อง ซดน้ำแต่พอดีเพื่อเลี่ยงโซเดียมก่อนนอน";
      let m3StreetPlate = "ตำลึงและผักกาดขาว 2 ส่วน : ข้าวกล้องครึ่งทัพพี (1 ส่วน) : โปรตีนย่อยง่าย (1 ส่วน)";
      let m3StreetImage = "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80";

      if (isVegetarian || isVegan) {
        m3StreetDish = "ต้มจับฉ่ายเจเต้าหู้เห็ดหอม (สั่ง: รสอ่อน ไม่หวาน) + ข้าวกล้องครึ่งทัพพี";
        m3StreetTip = "เน้นตักเนื้อผักจับฉ่ายและเต้าหู้ หลีกเลี่ยงการซดน้ำมันที่ลอยอยู่ด้านบน";
        m3StreetPlate = "ผักจับฉ่าย 2 ส่วน : ข้าวกล้องครึ่งทัพพี : เต้าหู้เห็ดหอม 1 ส่วน";
        m3StreetImage = "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80";
      } else {
        const porkAllowed = !avoidPork;
        const meat3Street = porkAllowed ? "หมูสับไร้มัน" : "ไก่สับหรือลูกชิ้นปลาแท้";
        if (isNoSoy) {
          m3StreetDish = isDislikeSpicy
            ? `ต้มซุป${meat3Street}ใส่มันฝรั่งและผักกาดขาว + ข้าวสวยครึ่งทัพพี`
            : `ต้มยำ${meat3Street}น้ำใสใส่เห็ดฟาง (สั่งไม่ใส่นมข้น ไม่หวาน) + ข้าวสวย 1 ทัพพี`;
        } else {
          m3StreetDish = `แกงจืดเต้าหู้${meat3Street}ตำลึง/ผักกาดขาว (สั่ง: ไม่ชูรส ไม่กระเทียมเจียว) + ข้าวกล้องครึ่งทัพพี`;
        }
        m3StreetImage = "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80";
      }

      let m3HomeDish = !avoidSeafood
        ? "ปลากะพงหรือปลานิลนึ่งมะนาวสมุนไพร + ผักกาดขาวลวก + ข้าวกล้องครึ่งทัพพี"
        : "ต้มซุปน่องไก่ไม่ติดหนังใส่มันฝรั่ง มะเขือเทศ และหอมใหญ่ + ข้าวกล้อง";
      let m3HomeTip = "การนึ่งหรือต้มเป็นวิธีปรุงที่ดีที่สุดสำหรับมื้อเย็น ไร้น้ำมันแฝง ร่างกายย่อยและดูดซึมได้ง่าย หลับสบาย";
      let m3HomePlate = "ผักลวกและมะเขือเทศ 2 ส่วน : ข้าวกล้อง 1 ส่วน : เนื้อปลาหรือไก่ 1 ส่วน";
      let m3HomeImage = !avoidSeafood
        ? "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80"
        : "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80";

      if (isVegetarian || isVegan) {
        m3HomeDish = isNoSoy
          ? "แกงเห็ดรวมใส่ฟักทองและใบแมงลัก + ถั่วแระต้ม + ข้าวกล้องครึ่งทัพพี"
          : "เต้าหู้ขาวนึ่งซีอิ๊วเห็ดหอม + คะน้าฮ่องกงลวก + ข้าวกล้องครึ่งทัพพี";
        m3HomeTip = "ใช้ความหวานธรรมชาติจากฟักทองและเห็ดหอม อิ่มสบายท้อง ไม่อึดอัดเวลานอน";
        m3HomePlate = "คะน้า/เห็ดรวม 2 ส่วน : ข้าวกล้อง 1 ส่วน : เต้าหู้ขาว 1 ส่วน";
        m3HomeImage = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80";
      } else if (avoidPoultry && avoidSeafood) {
        m3HomeDish = !avoidPork
          ? "ต้มจืดกระดูกหมูอ่อนตุ๋นยาจีนใส่หัวไชเท้าและเห็ดหอม + ข้าวกล้อง"
          : "เต้าหู้ขาวตุ๋นไข่ขาวและเห็ดหอมโรยต้นหอม + ผักต้มรวม";
        m3HomeImage = "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80";
      }

      let m3QuickDish = avoidEgg
        ? "อกไก่นุ่มฉีก + สลัดผักรวมน้ำสลัดบัลซามิก + ฝรั่งสด 4-5 ชิ้น"
        : "ไข่ตุ๋นพร้อมทานสูตรโซเดียมต่ำ 2 ถ้วย + สลัดผักรวม + มันหวานญี่ปุ่นชิ้นเล็ก";
      let m3QuickTip = "ไข่ตุ๋นและอกไก่นุ่มพร้อมทานให้โปรตีนคุณภาพสูง ย่อยง่าย ไม่รบกวนการนอนหลับ";
      let m3QuickPlate = "สลัดผัก 2 ส่วน : มันหวาน 1 ส่วน : ไข่ตุ๋น/อกไก่ 1 ส่วน";
      let m3QuickImage = avoidEgg
        ? "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80"
        : "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80";

      if (isVegetarian || isVegan) {
        m3QuickDish = "สลัดผักเต้าหู้พร้อมทาน + กล้วยน้ำว้า 1 ลูก + นมอัลมอนด์ไม่หวาน";
        m3QuickTip = "กล้วยน้ำว้ามีโพแทสเซียมและทริปโตเฟน ช่วยผ่อนคลายกล้ามเนื้อและระบบประสาท";
        m3QuickPlate = "สลัดผัก 2 ส่วน : กล้วยน้ำว้า 1 ส่วน : เต้าหู้และนมอัลมอนด์ 1 ส่วน";
        m3QuickImage = "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80";
      }

      meals.push({
        mealName: meal3Title,
        calories: calPerMeal,
        protein: `${proteinPerMeal} กรัม`,
        carbs: `${Math.round(carbsPerMeal * 0.9)} กรัม`,
        fat: `${fatPerMeal} กรัม`,
        safetyNote: finalSafetyNote,
        options: prioritizeByEatingStyle([
          { category: "ตามสั่ง/นอกบ้าน", dish: m3StreetDish, orderingTip: m3StreetTip, plateRatio: m3StreetPlate, imageUrl: m3StreetImage, imageAlt: m3StreetDish },
          { category: "ทำเองง่ายๆ", dish: m3HomeDish, orderingTip: m3HomeTip, plateRatio: m3HomePlate, imageUrl: m3HomeImage, imageAlt: m3HomeDish },
          { category: "พร้อมทานสะดวก", dish: m3QuickDish, orderingTip: m3QuickTip, plateRatio: m3QuickPlate, imageUrl: m3QuickImage, imageAlt: m3QuickDish },
        ]),
      });
    }

    // ==========================================
    // มื้อที่ 4 (ของว่าง Pre/Post Workout สำหรับ 4 มื้อขึ้นไป)
    // ==========================================
    if (mealsCount >= 4) {
      const snackCal = Math.round(calPerMeal * 0.6);
      const snackProtein = Math.max(12, Math.round(proteinPerMeal * 0.6));

      const snackStreetDish = "กล้วยปิ้งไม่ราดน้ำเชื่อม 2 ลูก + นมถั่วเหลือง/นมจืดไม่ใส่น้ำตาล 1 กล่อง";
      const snackStreetTip = "สั่ง: 'ไม่ราดน้ำตาลปี๊บ/กะทิ' ได้คาร์บเชิงเดี่ยวจากธรรมชาติ ดูดซึมเป็นพลังงานออกกำลังกายทันที";
      const snackStreetPlate = "กล้วยปิ้ง (พลังงานพร้อมใช้) + นมจืด/นมถั่วเหลือง (โปรตีน)";
      const snackStreetImage = "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=800&q=80";

      const snackHomeDish = isNoDairy || isVegan
        ? "แอปเปิ้ลเขียวหั่นเสี้ยว 1 ลูก + เนยถั่วอัลมอนด์ 1 ช้อนโต๊ะ (หรือไข่ต้ม 1 ฟอง)"
        : isNoPeanuts
        ? "กรีกโยเกิร์ตแท้ 1 ถ้วย + ผลไม้ตระกูลเบอร์รี่สด"
        : "กรีกโยเกิร์ต 1 ถ้วย + เนยถั่วแท้ 1 ช้อนชา + กล้วยหอมครึ่งลูก";
      const snackHomeTip = "ให้ทั้งโปรตีนและไขมันดี ชะลอความหิว และช่วยซ่อมแซมกล้ามเนื้อหลังฝึก";
      const snackHomePlate = "ผลไม้สด 1 ส่วน : กรีกโยเกิร์ต/ไข่ต้ม 1 ส่วน";
      const snackHomeImage = "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=80";

      const snackQuickDish = isNoDairy || isVegan
        ? "กล้วยหอม 1 ลูก + ถั่วอัลมอนด์อบธรรมชาติ 1 ซองเล็ก (หรือนมอัลมอนด์โปรตีนสูง)"
        : "นมเวย์โปรตีนพร้อมดื่มรสจืด/ช็อกโกแลต (หรือนมโปรตีนสูง 25-30g)";
      const snackQuickTip = "หยิบสะดวก พกพาง่าย ทานก่อนออกกำลังกาย 30-45 นาที หรือทันทีหลังฝึกเสร็จ";
      const snackQuickPlate = "กล้วยหอม 1 ลูก : นมโปรตีนสูง 1 ขวด";
      const snackQuickImage = "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=800&q=80";

      meals.push({
        mealName: "มื้อที่ 4: ของว่างฟื้นฟู (Pre / Post Workout Snack)",
        calories: snackCal,
        protein: `${snackProtein} กรัม`,
        carbs: "24 กรัม",
        fat: "5 กรัม",
        safetyNote: finalSafetyNote,
        options: prioritizeByEatingStyle([
          { category: "ตามสั่ง/นอกบ้าน", dish: snackStreetDish, orderingTip: snackStreetTip, plateRatio: snackStreetPlate, imageUrl: snackStreetImage, imageAlt: snackStreetDish },
          { category: "ทำเองง่ายๆ", dish: snackHomeDish, orderingTip: snackHomeTip, plateRatio: snackHomePlate, imageUrl: snackHomeImage, imageAlt: snackHomeDish },
          { category: "พร้อมทานสะดวก", dish: snackQuickDish, orderingTip: snackQuickTip, plateRatio: snackQuickPlate, imageUrl: snackQuickImage, imageAlt: snackQuickDish },
        ]),
      });
    }

    // ==========================================
    // มื้อที่ 5 (ของว่างยามบ่าย สำหรับ 5 มื้อขึ้นไป)
    // ==========================================
    if (mealsCount >= 5) {
      const snack5Cal = Math.round(calPerMeal * 0.5);
      const snack5Protein = Math.max(10, Math.round(proteinPerMeal * 0.5));

      meals.push({
        mealName: "มื้อที่ 5: ของว่างบ่ายเติมพลังงาน (Afternoon Fuel 15:30 น.)",
        calories: snack5Cal,
        protein: `${snack5Protein} กรัม`,
        carbs: "20 กรัม",
        fat: "4 กรัม",
        safetyNote: finalSafetyNote,
        options: prioritizeByEatingStyle([
          {
            category: "ตามสั่ง/นอกบ้าน",
            dish: "น้ำเต้าหู้ทรงเครื่องหวานน้อย (ใส่ลูกเดือยและถั่วแดง) + ไข่ต้ม 1 ฟอง",
            orderingTip: "สั่ง: 'ไม่ใส่น้ำตาลทราย' หรือหวาน 25% เพื่อคุมอินซูลิน",
            plateRatio: "น้ำเต้าหู้ 1 แก้ว + ธัญพืช 1 ส่วน",
            imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80",
            imageAlt: "น้ำเต้าหู้ทรงเครื่องธัญพืช",
          },
          {
            category: "ทำเองง่ายๆ",
            dish: "สมูทตี้เบอร์รี่รวม + ข้าวโอ๊ต 2 ช้อนโต๊ะ + เมล็ดเจีย 1 ช้อนชา",
            orderingTip: "ปั่นกับน้ำเปล่าหรือนมอัลมอนด์ไม่หวาน ช่วยให้อยู่ท้องนาน",
            plateRatio: "ผลไม้เบอร์รี่ 1 ถ้วย : ข้าวโอ๊ตและเมล็ดเจีย 1 ส่วน",
            imageUrl: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=800&q=80",
            imageAlt: "สมูทตี้เบอร์รี่ข้าวโอ๊ต",
          },
          {
            category: "พร้อมทานสะดวก",
            dish: "ถั่วแระญี่ปุ่นต้มพร้อมทาน 1 ซอง + ชาเขียวมัทฉะปราศจากน้ำตาล",
            orderingTip: "ชาเขียวมีสาร EGCG ช่วยกระตุ้นการเผาผลาญไขมันระหว่างวัน",
            plateRatio: "ถั่วแระญี่ปุ่น 1 ซอง : ชาเขียว 1 ขวด",
            imageUrl: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80",
            imageAlt: "ถั่วแระญี่ปุ่นพร้อมทาน",
          },
        ]),
      });
    }

    // ==========================================
    // มื้อที่ 6 (อาหารเสริมโปรตีนก่อนนอน สำหรับ 6 มื้อ)
    // ==========================================
    if (mealsCount >= 6) {
      const snack6Cal = Math.round(calPerMeal * 0.45);
      const snack6Protein = Math.max(12, Math.round(proteinPerMeal * 0.5));

      meals.push({
        mealName: "มื้อที่ 6: โปรตีนซ่อมแซมก่อนนอน (Bedtime Recovery 21:00 น.)",
        calories: snack6Cal,
        protein: `${snack6Protein} กรัม`,
        carbs: "8 กรัม",
        fat: "3 กรัม",
        safetyNote: finalSafetyNote,
        options: prioritizeByEatingStyle([
          {
            category: "ตามสั่ง/นอกบ้าน",
            dish: "นมอุ่นสูตรไขมัน 0% หรือนมถั่วเหลืองไม่หวาน 1 แก้ว",
            orderingTip: "ดื่มอุ่นๆ ช่วยให้อุณหภูมิแกนกลางร่างกายค่อยๆ ลดลงเพื่อการหลับลึก",
            plateRatio: "นมโปรตีนอุ่น 1 แก้ว",
            imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80",
            imageAlt: "นมอุ่นก่อนนอน",
          },
          {
            category: "ทำเองง่ายๆ",
            dish: isNoDairy || isVegan
              ? "ไข่ขาวลวก 3 ฟอง หรือเต้าหู้อ่อนนึ่งซีอิ๊วขาวเล็กน้อย"
              : "คอตเทจชีส (Cottage Cheese) หรือกรีกโยเกิร์ต 3 ช้อนโต๊ะ โรยอบเชย",
            orderingTip: "เคซีนโปรตีนดูดซึมช้า ปลดปล่อยกรดอะมิโนซ่อมแซมกล้ามเนื้อต่อเนื่องตลอด 7-8 ชั่วโมงที่นอนหลับ",
            plateRatio: "เคซีนโปรตีน/ไข่ขาว 1 ถ้วยเล็ก",
            imageUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=80",
            imageAlt: "กรีกโยเกิร์ตหรือคอตเทจชีส",
          },
          {
            category: "พร้อมทานสะดวก",
            dish: "โปรตีนเชค (Casein หรือ Plant Protein) 1 สกู๊ป ผสมน้ำเปล่า",
            orderingTip: "ชงดื่มก่อนนอน 30 นาที ช่วยลดการสลายตัวของโปรตีนในกล้ามเนื้อ (Anti-Catabolic)",
            plateRatio: "โปรตีนเชค 1 แก้ว",
            imageUrl: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=800&q=80",
            imageAlt: "โปรตีนเชคก่อนนอน",
          },
        ]),
      });
    }

    return meals;
  };

  const mealPlan = generatePersonalizedMealPlan();

  return (
    <div className="min-h-screen bg-slate-50 text-zinc-900 selection:bg-emerald-500 selection:text-white pb-24 relative">
      {/* แถบนำทางด้านบน */}
      <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/80 backdrop-blur-md px-6 py-3.5 print:hidden">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 font-black text-white text-base shadow-sm">
              FM
            </div>
            <span className="text-lg font-black tracking-tight text-zinc-900">
              Fit<span className="text-emerald-600">Mate</span>
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            {currentUser && (
              <span className="hidden md:inline text-xs text-zinc-600 font-medium">
                คุณ <span className="font-bold text-zinc-900">{currentUser.name}</span>
              </span>
            )}

            {/* ปุ่มเข้าสู่ระบบหลังบ้าน (Admin Dashboard) */}
            <Link
              href="/admin"
              className="px-2.5 py-1.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
              title="เข้าสู่ระบบจัดการหลังบ้าน (Admin Dashboard)"
            >
              <svg className="w-3.5 h-3.5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="hidden sm:inline">Admin</span>
            </Link>

            {/* ปุ่มสลับธีม สว่าง / มืด */}
            <ThemeToggle />


            <Link
              href="/assessment"
              className="px-3 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 transition flex items-center gap-1.5 shadow-sm"
            >
              <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span className="hidden sm:inline">แก้ไขข้อมูล</span>
            </Link>

            <button
              type="button"
              onClick={handleResetAllData}
              className="px-2.5 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition"
              title="ล้างข้อมูลแผนเพื่อเริ่มใหม่"
            >
              รีเซ็ต
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="px-2.5 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 hover:text-red-600 text-xs font-semibold transition flex items-center gap-1 shadow-sm"
              title="ออกจากระบบ"
            >
              <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">ออกจากระบบ</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* คำเตือนทางการแพทย์ (Medical Disclaimer ข้อบังคับเอกสารหน้า 3) */}
        <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 shadow-sm">
          <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="leading-relaxed">
            <strong className="font-bold text-amber-950">Medical Disclaimer:</strong> แผนออกกำลังกายและโภชนาการนี้เป็นคำแนะนำทั่วไปเพื่อการดูแลสุขภาพ <span className="underline font-semibold">ไม่ใช่คำแนะนำทางการแพทย์</span> หากมีอาการเจ็บ แน่นหน้าอก เวียนศีรษะ ให้หยุดพักทันทีและควรปรึกษาแพทย์ก่อนเริ่มโปรแกรม
          </div>
        </div>

        {/* แถบแจ้งเตือนธงแดง (Red Flag Safety Alert) */}
        {assessment.isRedFlag && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 text-xs shadow-sm flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 font-black">
              !
            </div>
            <div>
              <div className="font-black text-rose-800 text-sm">
                การจำกัดระดับความหนักตามเกณฑ์ความปลอดภัย PAR-Q
              </div>
              <p className="mt-0.5 leading-relaxed text-rose-900">
                เนื่องจากคุณมีประวัติ/สัญญาณความเสี่ยง (เช่น แน่นหน้าอก, อาการวูบ, หรือโรคหัวใจ) ตารางฝึกด้านล่างถูกปรับให้อยู่ในระดับ <strong>&ldquo;เบา - ปานกลาง (Low-to-Moderate Intensity)&rdquo;</strong> อัตโนมัติ เพื่อป้องกันอันตรายต่อระบบหัวใจและหลอดเลือด
              </p>
            </div>
          </div>
        )}

        {/* สรุปโปรไฟล์และเป้าหมายส่วนตัว (Profile Header Card) */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 pb-5">
            <div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {((assessment.fitnessGoals && assessment.fitnessGoals.length > 0)
                  ? assessment.fitnessGoals
                  : [assessment.fitnessGoal]
                ).map((g) => (
                  <div
                    key={g}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    เป้าหมาย: {goalLabels[g] || g}
                  </div>
                ))}
              </div>
              <h1 className="text-2xl font-black text-zinc-950">
                แดชบอร์ดสุขภาพและแผนประจำวันของคุณ
              </h1>
              <p className="text-xs text-zinc-500 mt-1">
                เพศ: {assessment.gender === "male" ? "ชาย" : "หญิง"} • อายุ: {assessment.age} ปี • น้ำหนัก: {assessment.weight} กก. • ส่วนสูง: {assessment.height} ซม.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/assessment"
                className="px-4 py-2 rounded-xl bg-slate-50 border border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-100 transition"
              >
                อัปเดตน้ำหนัก / ข้อมูลสุขภาพ
              </Link>
            </div>
          </div>

          {/* สถิติตัวเลขพลังงาน 4 ช่อง */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-5 text-center">
            <div className="p-4 rounded-2xl bg-slate-50/90 border border-zinc-200/90 shadow-xs">
              <div className="text-xs font-semibold text-zinc-500">BMI ปัจจุบัน</div>
              <div className="text-2xl font-black text-zinc-900 mt-1">{assessment.bmi}</div>
              <div className="text-xs text-emerald-600 font-bold mt-1">
                {assessment.bmi < 18.5
                  ? "ผอม"
                  : assessment.bmi <= 22.9
                  ? "สมส่วน"
                  : assessment.bmi <= 24.9
                  ? "น้ำหนักเกิน"
                  : "ภาวะเสี่ยงอ้วน"}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/90 border border-zinc-200/90 shadow-xs">
              <div className="text-xs font-semibold text-zinc-500">เป้าหมายแคลอรี่</div>
              <div className="text-2xl font-black text-emerald-600 mt-1">
                {assessment.targetCalories}
              </div>
              <div className="text-xs text-zinc-400 mt-1">kcal / วัน</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/90 border border-zinc-200/90 shadow-xs">
              <div className="text-xs font-semibold text-zinc-500">โปรตีนเป้าหมาย</div>
              <div className="text-2xl font-black text-teal-600 mt-1">
                {assessment.targetProteinGrams || Math.round(assessment.weight * 1.6)}
              </div>
              <div className="text-xs text-zinc-400 mt-1">กรัม / วัน</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/90 border border-zinc-200/90 shadow-xs">
              <div className="text-xs font-semibold text-zinc-500">ดื่มน้ำขั้นต่ำ</div>
              <div className="text-2xl font-black text-cyan-600 mt-1">
                {(assessment.weight * 0.035).toFixed(1)}
              </div>
              <div className="text-xs text-zinc-400 mt-1">ลิตร / วัน</div>
            </div>
          </div>
        </div>

        {/* แถบเลือกแท็บแบบ Pill Navigation ขนาดใหญ่ ชัดเจน ไม่ปวดตา */}
        <div className="flex flex-wrap gap-2 p-1.5 bg-zinc-200/60 rounded-2xl w-fit">
          <button
            type="button"
            onClick={() => setActiveTab("workout")}
            className={`px-5 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2.5 min-h-[44px] ${
              activeTab === "workout"
                ? "bg-white text-emerald-700 shadow-sm border border-zinc-200"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>ตารางออกกำลังกาย</span>
            <span className="text-xs bg-emerald-100/90 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
              {assessment.workoutDays} วัน/สัปดาห์
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("nutrition")}
            className={`px-5 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2.5 min-h-[44px] ${
              activeTab === "nutrition"
                ? "bg-white text-teal-700 shadow-sm border border-zinc-200"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
            <span>แผนโภชนาการ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`px-5 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2.5 min-h-[44px] ${
              activeTab === "overview"
                ? "bg-white text-zinc-900 shadow-sm border border-zinc-200"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>ภาพรวมสุขภาพ</span>
          </button>
        </div>

        {/* ========================================================
            TAB 1: ภาพรวมและข้อควรระวังเฉพาะบุคคล
           ======================================================== */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* กล่อง Hard Filter ตรวจสอบสารก่อภูมิแพ้ */}
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
              <h2 className="text-sm font-bold text-zinc-900 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                การควบคุมความปลอดภัยสารก่อภูมิแพ้ (Allergy Hard Filter)
              </h2>
              {assessment.foodAllergies.includes("none") && !assessment.otherAllergy ? (
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span>ไม่มีประวัติแพ้อาหาร ระบบเปิดรับสารอาหารครบทุกกลุ่มและคัดกรองโภชนาการสมดุล 100%</span>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 text-xs text-teal-950 space-y-1.5">
                  <div className="font-bold text-teal-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-teal-600" />
                    ระบบเปิด Hard Filter กรองสารก่อภูมิแพ้ออก 100% ในทุกเมนู:
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {assessment.foodAllergies.filter((a) => a !== "none").map((a) => (
                      <span key={a} className="px-2.5 py-0.5 rounded-full bg-teal-200/80 text-teal-900 font-medium text-[11px]">
                        {allergyLabelMap[a] || a}
                      </span>
                    ))}
                    {assessment.otherAllergy && (
                      <span className="px-2.5 py-0.5 rounded-full bg-teal-700 text-white font-bold text-[11px]">
                        แพ้เพิ่มเติม: {assessment.otherAllergy}
                      </span>
                    )}
                  </div>
                  <p className="leading-relaxed text-[11px] text-teal-800 pt-1">
                    ✓ ปลอดภัย 100%: เมนูทั้งหมดจะไม่มีส่วนประกอบของวัตถุดิบข้างต้น และจัดเตรียมโปรตีนทางเลือกทดแทนให้อัตโนมัติ
                  </p>
                </div>
              )}
            </div>

            {/* กล่องคัดกรองอาหารที่ไม่ชอบหรือไม่รับประทาน */}
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
              <h2 className="text-sm font-bold text-zinc-900 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                อาหารที่ไม่ชอบหรือไม่รับประทาน (Food Dislikes & Preferences)
              </h2>
              {assessment.dislikedFoods?.includes("none") && !assessment.otherDisliked ? (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-zinc-200 text-xs text-zinc-600 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-zinc-400 shrink-0" />
                  <span>ทานได้ทุกชนิด ไม่มีอาหารที่ไม่ชอบ ทำให้แผนอาหารมีความหลากหลายสูงสุด</span>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-950 space-y-1.5">
                  <div className="font-bold text-rose-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    วัตถุดิบและรสชาติที่ตัดออกจากตารางอาหารตามที่คุณระบุ:
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(assessment.dislikedFoods || []).filter((d) => d !== "none").map((d) => (
                      <span key={d} className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-medium text-[11px]">
                        {dislikeLabelMap[d] || d}
                      </span>
                    ))}
                    {assessment.otherDisliked && (
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-bold text-[11px]">
                        ไม่ทานเพิ่มเติม: {assessment.otherDisliked}
                      </span>
                    )}
                  </div>
                  <p className="leading-relaxed text-[11px] text-rose-800 pt-1">
                    ✓ ปรับแต่งเมนูสำเร็จ: ระบบคัดกรองวัตถุดิบที่ไม่ชอบออก และแทนที่ด้วยแหล่งโปรตีนและผักชนิดที่คุณรับประทานได้
                  </p>
                </div>
              )}
            </div>

            {/* การปรับแต่งโภชนาการส่วนบุคคลแบบองค์รวม */}
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
              <h2 className="text-sm font-bold text-zinc-900 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                โปรไฟล์แผนโภชนาการเฉพาะบุคคล (Personalized Nutrition Settings)
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 border border-zinc-200">
                  <span className="text-[10px] text-zinc-400 font-semibold block uppercase">รูปแบบไดเอท</span>
                  <span className="font-bold text-zinc-900 mt-0.5 block">{dietTypeLabelMap[assessment.dietType] || assessment.dietType}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-zinc-200">
                  <span className="text-[10px] text-zinc-400 font-semibold block uppercase">วิถีชีวิต / สไตล์การกิน</span>
                  <span className="font-bold text-zinc-900 mt-0.5 block">{eatingStyleLabelMap[assessment.eatingStyle || "mixed"] || assessment.eatingStyle}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-zinc-200">
                  <span className="text-[10px] text-zinc-400 font-semibold block uppercase">การแบ่งมื้ออาหาร</span>
                  <span className="font-bold text-zinc-900 mt-0.5 block">{assessment.mealsPerDay || 3} มื้อต่อวัน</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-zinc-200">
                  <span className="text-[10px] text-zinc-400 font-semibold block uppercase">งบประมาณอาหาร</span>
                  <span className="font-bold text-zinc-900 mt-0.5 block">{budgetLabelMap[assessment.foodBudget] || assessment.foodBudget}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-zinc-200 sm:col-span-2">
                  <span className="text-[10px] text-zinc-400 font-semibold block uppercase">อาหารเสริมที่รับประทาน</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(assessment.supplements || ["none"]).map((s) => (
                      <span key={s} className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-semibold border border-emerald-200">
                        {supplementLabelMap[s] || s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ข้อควรระวังในการฝึก */}
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
              <h2 className="text-sm font-bold text-zinc-900 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                การปรับแต่งท่าออกกำลังกายตามข้อจำกัดร่างกาย
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-zinc-200">
                  <div className="font-bold text-zinc-900 mb-1">บริเวณข้อเข่าและข้อต่อ:</div>
                  <p className="text-zinc-600 leading-relaxed">
                    {hasKneeIssue
                      ? "ตรวจพบอาการเจ็บเข่า: ตารางฝึกตัดท่า Jump Squat และ Lunges กระแทกออก ให้ฝึก Wall Sit และ Glute Bridge แทน"
                      : "ข้อเข่าปกติ สามารถฝึกสควอทและลันจ์ตามฟอร์มที่ถูกต้องได้"}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-zinc-200">
                  <div className="font-bold text-zinc-900 mb-1">กล้ามเนื้อหลังส่วนล่าง:</div>
                  <p className="text-zinc-600 leading-relaxed">
                    {hasBackIssue
                      ? "ตรวจพบอาการปวดหลัง: ตัดท่า Deadlift หนักออก เน้นท่า Bird-Dog และ Plank เสริมความมั่นคงแกนกลางลำตัว"
                      : "แผ่นหลังปกติ แนะนำเน้นเกร็งหน้าท้องขณะออกแรงเพื่อเซฟหลังเสมอ"}
                  </p>
                </div>
              </div>
            </div>

            {/* ทางลัดไปแท็บต่างๆ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => setActiveTab("workout")}
                className="p-5 rounded-3xl bg-emerald-500 text-white cursor-pointer hover:bg-emerald-600 transition shadow-lg shadow-emerald-500/20"
              >
                <div className="text-xs font-semibold opacity-90">เริ่มต้นออกกำลังกาย</div>
                <div className="text-lg font-black mt-1">ดูตารางฝึกสัปดาห์นี้ &rarr;</div>
                <p className="text-xs opacity-80 mt-2">
                  {assessment.workoutDays} วันต่อสัปดาห์ • ครั้งละ {assessment.sessionMinutes} นาที
                </p>
              </div>

              <div
                onClick={() => setActiveTab("nutrition")}
                className="p-5 rounded-3xl bg-teal-600 text-white cursor-pointer hover:bg-teal-700 transition shadow-lg shadow-teal-600/20"
              >
                <div className="text-xs font-semibold opacity-90">แผนการกินประจำวัน</div>
                <div className="text-lg font-black mt-1">ดูเมนูอาหารที่ปรับให้ &rarr;</div>
                <p className="text-xs opacity-80 mt-2">
                  {assessment.mealsPerDay} มื้อต่อวัน • แคลอรี่เป้าหมาย {assessment.targetCalories} kcal
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 2: ตารางออกกำลังกายประจำสัปดาห์ (Workout Plan)
           ======================================================== */}
        {activeTab === "workout" && (
          <div className="space-y-6">
            {/* การ์ดสรุปจุดเน้นกล้ามเนื้อและโปรแกรมฝึก (เมื่อข้ามการสแกนสรีระ) หรือผลวิเคราะห์สรีระ (เมื่อสแกนจริง) */}
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-md border border-indigo-800/40 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                      {assessment.bodyScanResult ? "AI Body Structure & Target Muscle Focus" : "Target Muscle Focus & Routine Plan"}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-white mt-1 flex flex-wrap items-center gap-2">
                    <span>
                      {assessment.bodyScanResult
                        ? "ผลวิเคราะห์โครงสร้างร่างกายและจุดเน้นกล้ามเนื้อ"
                        : "จุดเน้นกล้ามเนื้อและโปรแกรมฝึกเฉพาะบุคคล"}
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-300 mt-1">
                    {assessment.bodyScanResult
                      ? "ระบบได้นำข้อมูลสรีระของคุณมาวิเคราะห์ทางกายวิภาคศาสตร์เพื่อวางตารางฝึกเฉพาะส่วนอย่างแม่นยำ"
                      : "ตารางฝึกถูกจัดตามข้อมูลสุขภาพพื้นฐานและมุ่งเน้นเพิ่มจำนวนเซ็ตในกลุ่มกล้ามเนื้อที่คุณเลือกเป็นพิเศษ (ข้ามการสแกนสัดส่วน)"}
                  </p>
                </div>

                {assessment.bodyScanResult ? (
                  <div className="px-4 py-2.5 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 text-center shrink-0">
                    <div className="text-[10px] text-indigo-200">คะแนนความพร้อมสรีระ (Body Readiness Score)</div>
                    <div className="text-2xl font-black text-emerald-400 font-mono mt-0.5">
                      {assessment.bodyScanResult.matchScore}%
                    </div>
                    <div className="text-[10px] text-emerald-300 font-medium">ความพร้อมสูงมาก</div>
                  </div>
                ) : (
                  <Link
                    href="/assessment"
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-semibold text-emerald-300 transition shrink-0 flex items-center gap-2 self-start sm:self-center"
                  >
                    <svg className="w-4 h-4 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>สแกนสรีระด้วยกล้อง</span>
                    <span className="text-zinc-400">&rarr;</span>
                  </Link>
                )}
              </div>

              {/* รายละเอียดสแกนสรีระ (แสดงเฉพาะเมื่อมีผลการสแกนจริงจากกล้องหรือรูปถ่าย) */}
              {assessment.bodyScanResult && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-3">
                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                    <div className="text-[10px] text-zinc-400 uppercase font-semibold">โครงสร้างร่างกาย (Somatotype)</div>
                    <div className="text-sm font-bold text-white mt-1">
                      {assessment.bodyScanResult.somatotypeThai}
                    </div>
                    <div className="text-[11px] text-zinc-300 mt-1">
                      สัดส่วนไหล่ต่อสะโพก: <strong className="text-indigo-300 font-mono">{assessment.bodyScanResult.shoulderToHipRatio}</strong>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                    <div className="text-[10px] text-zinc-400 uppercase font-semibold">จุดเด่นทางโครงสร้าง</div>
                    <div className="text-xs text-emerald-300 font-medium mt-1 leading-relaxed">
                      {assessment.bodyScanResult.advantages?.[0] || "ฐานโครงสร้างแข็งแรงและตอบสนองได้ดี"}
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-1">
                      {assessment.bodyScanResult.timelineRecommendation}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                    <div className="text-[10px] text-zinc-400 uppercase font-semibold">จุดที่ต้องโฟกัสเป็นพิเศษ (Gaps)</div>
                    <div className="text-xs text-amber-300 font-medium mt-1 leading-relaxed">
                      {assessment.bodyScanResult.focusGaps?.[0] || "เน้นเพิ่มความแข็งแรงในมัดกล้ามเนื้อเป้าหมาย"}
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-1 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>วิธีสแกน: {assessment.bodyScanResult.scanMethod === "webcam" ? "กล้องเว็บแคม" : "แนบรูปภาพ"}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* กล้ามเนื้อเป้าหมายที่เลือกไว้ (Target Muscles Tags) */}
              {assessment.targetMuscles && assessment.targetMuscles.length > 0 && (
                <div className="pt-3 border-t border-white/10 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-zinc-300 font-medium flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    <span>มัดกล้ามเนื้อที่โฟกัสในตารางฝึก:</span>
                  </span>
                  {assessment.targetMuscles.map((muscle) => {
                    const muscleLabels: Record<string, string> = {
                      chest: "หน้าอก (Chest)",
                      back: "ปีกและหลัง (Lats & Back)",
                      shoulders_arms: "หัวไหล่และแขน (Shoulders & Arms)",
                      abs: "ซิกแพค & หน้าท้อง (Abs & Core)",
                      glutes: "ก้นและสะโพก (Glutes)",
                      legs: "ต้นขาและน่อง (Quads & Hamstrings)",
                    };
                    return (
                      <span
                        key={muscle}
                        className="px-3 py-1 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-semibold flex items-center gap-1.5"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        <span>{muscleLabels[muscle] || muscle}</span>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* กรอบหลักการ FITT-VP และเป้าหมายระยะเวลาตามเกณฑ์สากล WHO / ACSM */}
            <div className="bg-white border border-zinc-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <h3 className="text-base font-bold text-zinc-900">
                    โครงสร้างโปรแกรมตามหลักการ FITT-VP (ACSM Guidelines)
                  </h3>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  มาตรฐาน WHO &amp; ACSM
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-zinc-200/80">
                  <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">F - ความถี่</div>
                  <div className="text-base font-extrabold text-zinc-900 mt-1">{assessment.workoutDays} วัน / สัปดาห์</div>
                  <div className="text-xs text-emerald-700 font-medium mt-0.5">กระจายวันพักเหมาะสม</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-zinc-200/80">
                  <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">I - ความหนัก</div>
                  <div className="text-base font-extrabold text-emerald-600 mt-1">Zone 2-3 (Moderate)</div>
                  <div className="text-xs text-zinc-500 font-medium mt-0.5">RPE 5-6 เหนื่อยกำลังดี</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-zinc-200/80">
                  <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">T - เวลา</div>
                  <div className="text-base font-extrabold text-teal-600 mt-1">{assessment.sessionMinutes || 40} นาที / ครั้ง</div>
                  <div className="text-xs text-teal-700 font-medium mt-0.5">ตรงตามเกณฑ์สุขภาพสากล</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-zinc-200/80">
                  <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">T - รูปแบบ</div>
                  <div className="text-base font-extrabold text-cyan-600 mt-1">Resistance + Cardio</div>
                  <div className="text-xs text-zinc-500 font-medium mt-0.5">กล้ามเนื้อและปอดหัวใจ</div>
                </div>
              </div>
            </div>

            {/* การ์ดอัตราการเต้นหัวใจเป้าหมาย (Target Heart Rate Zones - THR) */}
            <div className="bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-md border border-teal-800/40 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      Target Heart Rate Zones
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white mt-1">
                    อัตราการเต้นหัวใจเป้าหมายเฉพาะบุคคล (คำนวณจากอายุ {userAge} ปี)
                  </h3>
                  <p className="text-xs text-zinc-300 mt-0.5">
                    เกณฑ์สากล HR<sub>max</sub> = 220 - {userAge} = <strong className="text-white font-mono">{thrZones.hrMax} bpm</strong> (ครั้ง/นาที)
                  </p>
                </div>

                <div className="px-4 py-2.5 rounded-2xl bg-white/10 border border-white/15 text-center shrink-0">
                  <div className="text-xs text-zinc-300">อัตราเต้นหัวใจสูงสุด (HRmax)</div>
                  <div className="text-xl font-bold text-emerald-400 font-mono mt-0.5">
                    {thrZones.hrMax} <span className="text-xs font-normal text-zinc-300">bpm</span>
                  </div>
                </div>
              </div>

              {/* แสดงโซน 1 ถึง 4 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Zone 1 */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-zinc-200">{thrZones.zone1.name}</span>
                    <span className="text-xs font-mono text-zinc-400">{thrZones.zone1.label}</span>
                  </div>
                  <div className="text-lg font-bold text-white font-mono mt-2">
                    {thrZones.zone1.min} - {thrZones.zone1.max} <span className="text-xs font-normal text-zinc-400">bpm</span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    {thrZones.zone1.desc}
                  </p>
                </div>

                {/* Zone 2 (Recommended Highlight) */}
                <div className="p-4 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400/80 relative shadow-lg shadow-emerald-500/10">
                  <span className="absolute -top-2.5 right-3 px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-bold text-xs">
                    โซนแนะนำหลัก
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-emerald-300">{thrZones.zone2.name}</span>
                    <span className="text-xs font-mono text-emerald-300 font-bold">{thrZones.zone2.label}</span>
                  </div>
                  <div className="text-xl font-bold text-emerald-300 font-mono mt-2">
                    {thrZones.zone2.min} - {thrZones.zone2.max} <span className="text-xs font-normal text-emerald-200">bpm</span>
                  </div>
                  <p className="text-xs text-zinc-200 mt-1 leading-relaxed">
                    {thrZones.zone2.desc}
                  </p>
                </div>

                {/* Zone 3 */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-amber-300">{thrZones.zone3.name}</span>
                    <span className="text-xs font-mono text-zinc-400">{thrZones.zone3.label}</span>
                  </div>
                  <div className="text-lg font-bold text-white font-mono mt-2">
                    {thrZones.zone3.min} - {thrZones.zone3.max} <span className="text-xs font-normal text-zinc-400">bpm</span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    {thrZones.zone3.desc}
                  </p>
                </div>

                {/* Zone 4 */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-rose-300">{thrZones.zone4.name}</span>
                    <span className="text-xs font-mono text-zinc-400">{thrZones.zone4.label}</span>
                  </div>
                  <div className="text-lg font-bold text-white font-mono mt-2">
                    {thrZones.zone4.min} - {thrZones.zone4.max} <span className="text-xs font-normal text-zinc-400">bpm</span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    {thrZones.zone4.desc}
                  </p>
                </div>
              </div>
            </div>

            {/* กล่องเครื่องมือจับเวลาพักเซ็ต (Rest Timer) */}
            <div className="p-4 sm:p-5 rounded-3xl bg-white border border-zinc-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  เครื่องมือช่วยฝึก (Rest Timer)
                </div>
                <div className="text-base font-bold text-zinc-900 mt-0.5">
                  นาฬิกาจับเวลาพักระหว่างเซ็ต
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono px-3 py-1 bg-emerald-50 rounded-xl border border-emerald-100">
                  {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, "0")}
                </div>

                <div className="flex items-center gap-2">
                  {[30, 60, 90].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => handleStartTimer(sec)}
                      className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-bold border transition active:scale-[0.98] ${
                        timerPreset === sec && isTimerRunning
                          ? "bg-emerald-600 border-emerald-700 text-white shadow-sm"
                          : "bg-slate-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                      }`}
                    >
                      {sec} วิ
                    </button>
                  ))}
                  {isTimerRunning && (
                    <button
                      type="button"
                      onClick={() => setIsTimerRunning(false)}
                      className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-bold bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 transition active:scale-[0.98]"
                    >
                      หยุด
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* รายการวันฝึก */}
            <div className="space-y-5">
              {workoutSchedule.map((day, dayIndex) => {
                const isCompleted = completedDays.includes(dayIndex);
                const currentLoc = dayLocations[dayIndex] || (assessment.workoutLocation as "home" | "gym" | "outdoor") || "home";
                return (
                  <div
                    key={dayIndex}
                    className={`bg-white border rounded-3xl p-5 sm:p-7 shadow-sm transition ${
                      isCompleted ? "border-emerald-300 bg-emerald-50/20" : "border-zinc-200"
                    }`}
                  >
                    {/* สวิตช์สลับสถานที่ฝึกประจำวัน (บ้าน / ฟิตเนส / กลางแจ้ง) */}
                    <div className="mb-5 pb-4 border-b border-zinc-100 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="text-sm font-semibold text-zinc-700 flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>สถานที่ฝึกวันนี้:</span>
                        </span>
                        <div className="inline-flex rounded-2xl p-1 bg-zinc-100 border border-zinc-200">
                          <button
                            type="button"
                            onClick={() => handleSwitchDayLocation(dayIndex, "home")}
                            className={`min-h-[40px] px-4 py-1.5 rounded-xl text-sm font-bold transition flex items-center gap-1.5 ${
                              currentLoc === "home"
                                ? "bg-white text-emerald-800 shadow-xs border border-zinc-200"
                                : "text-zinc-600 hover:text-zinc-900"
                            }`}
                          >
                            <span>ที่บ้าน</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSwitchDayLocation(dayIndex, "gym")}
                            className={`min-h-[40px] px-4 py-1.5 rounded-xl text-sm font-bold transition flex items-center gap-1.5 ${
                              currentLoc === "gym"
                                ? "bg-white text-teal-800 shadow-xs border border-zinc-200"
                                : "text-zinc-600 hover:text-zinc-900"
                            }`}
                          >
                            <span>ฟิตเนส</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSwitchDayLocation(dayIndex, "outdoor")}
                            className={`min-h-[40px] px-4 py-1.5 rounded-xl text-sm font-bold transition flex items-center gap-1.5 ${
                              currentLoc === "outdoor"
                                ? "bg-white text-emerald-800 shadow-xs border border-zinc-200"
                                : "text-zinc-600 hover:text-zinc-900"
                            }`}
                          >
                            <span>กลางแจ้ง / สวน</span>
                          </button>
                        </div>
                      </div>

                      <div className="text-xs text-zinc-500">
                        * ปรับสถานที่ได้อิสระ ท่าและอุปกรณ์จะปรับให้สอดคล้องทันที
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-5 mb-5">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <h3 className="text-lg font-bold text-zinc-900">
                            {day.dayTitle}
                          </h3>
                          {isCompleted && (
                            <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                              <span>ฝึกเสร็จแล้ว</span>
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-zinc-600 mt-1">
                          โฟกัส: <strong>{day.focus}</strong> • ระยะเวลา: <strong>{day.duration}</strong>
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveAIDay({
                              dayIndex,
                              dayTitle: day.dayTitle,
                              exercises: day.exercises,
                              initialIndex: 0,
                            })
                          }
                          className="min-h-[44px] px-5 py-2.5 rounded-2xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition flex items-center gap-2 active:scale-[0.98]"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span>เริ่มฝึกทั้งวันด้วย AI</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleCompleteDay(dayIndex)}
                          className={`min-h-[44px] px-5 py-2.5 rounded-2xl text-sm font-bold border transition flex items-center gap-2 active:scale-[0.98] ${
                            isCompleted
                              ? "bg-emerald-600 border-emerald-700 text-white"
                              : "bg-slate-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>{isCompleted ? "บันทึกเรียบร้อย" : "ติ๊กฝึกเสร็จวันนี้"}</span>
                        </button>
                      </div>
                    </div>

                    {/* ตารางท่าออกกำลังกาย (Clean, Breathable Cards with >=44px buttons) */}
                    <div className="space-y-3.5">
                      {day.exercises.map((ex, exIndex) => {
                        const isExCompleted = Boolean(
                          completedExercises[`${dayIndex}-${exIndex}`]
                        );
                        return (
                          <div
                            key={exIndex}
                            className={`p-4 sm:p-5 rounded-2xl border transition space-y-3 ${
                              isExCompleted
                                ? "bg-emerald-50/40 border-emerald-300"
                                : "bg-slate-50/60 border-zinc-200 hover:border-zinc-300"
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                              <div className="flex flex-wrap items-center gap-2">
                                {ex.phase === "warmup" && (
                                  <span className="text-xs font-bold text-amber-800 bg-amber-100/90 px-2.5 py-0.5 rounded-md shrink-0">
                                    Warm-up
                                  </span>
                                )}
                                {ex.phase === "main" && (
                                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-md shrink-0">
                                    ท่าหลัก
                                  </span>
                                )}
                                {ex.phase === "cooldown" && (
                                  <span className="text-xs font-bold text-sky-800 bg-sky-100/90 px-2.5 py-0.5 rounded-md shrink-0">
                                    Cool-down
                                  </span>
                                )}
                                <h4 className="text-base font-bold text-zinc-900">
                                  {ex.name}
                                </h4>
                                <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full">
                                  {ex.tag}
                                </span>
                                {ex.isTargetFocus && (
                                  <span className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-300 px-2.5 py-0.5 rounded-full shrink-0">
                                    โฟกัสเฉพาะส่วน
                                  </span>
                                )}
                                {isExCompleted && (
                                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                                    <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                    ผ่านแล้ว
                                  </span>
                                )}
                              </div>

                              {/* สถิติ เซ็ต / ครั้ง / พัก ชัดเจนอ่านง่าย */}
                              <div className="flex items-center gap-2 text-xs font-mono text-zinc-700">
                                <div className="px-2.5 py-1 bg-white border border-zinc-200 rounded-lg">
                                  <span className="text-zinc-400 font-sans mr-1">เซ็ต:</span>
                                  <strong className="text-zinc-900 font-bold">{ex.sets}</strong>
                                </div>
                                <div className="px-2.5 py-1 bg-white border border-zinc-200 rounded-lg">
                                  <span className="text-zinc-400 font-sans mr-1">ครั้ง:</span>
                                  <strong className="text-zinc-900 font-bold">{ex.reps}</strong>
                                </div>
                                <div className="px-2.5 py-1 bg-white border border-zinc-200 rounded-lg">
                                  <span className="text-zinc-400 font-sans mr-1">พัก:</span>
                                  <strong className="text-zinc-900 font-bold">{ex.rest}</strong>
                                </div>
                              </div>
                            </div>

                            {/* จุดโฟกัสความปลอดภัย */}
                            {ex.safetyCue && (
                              <div className="text-xs text-emerald-900 bg-emerald-50 border border-emerald-200/70 rounded-xl px-3 py-2 flex items-start gap-2 leading-relaxed">
                                <svg className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span><strong>คำแนะนำความปลอดภัย:</strong> {ex.safetyCue}</span>
                              </div>
                            )}

                            {ex.note && (
                              <p className="text-xs text-amber-800 font-medium">
                                * {ex.note}
                              </p>
                            )}

                            {/* แถวปุ่มปฏิบัติการ (Touch targets >= 44px) */}
                            <div className="pt-1 flex flex-wrap items-center gap-2.5 sm:justify-end">
                              <button
                                type="button"
                                onClick={() => setDemoExercise(ex)}
                                className="min-h-[44px] px-4 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-semibold transition flex items-center justify-center gap-2 shadow-xs active:scale-[0.98]"
                                title="ดูตัวอย่างภาพเคลื่อนไหวและฟอร์มท่าที่ถูกต้อง"
                              >
                                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>ดูตัวอย่างท่า</span>
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  setActiveAIDay({
                                    dayIndex,
                                    dayTitle: day.dayTitle,
                                    exercises: day.exercises,
                                    initialIndex: exIndex,
                                  })
                                }
                                className={`min-h-[44px] px-5 py-2.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] ${
                                  isExCompleted
                                    ? "bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100"
                                    : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/10"
                                }`}
                                title={isExCompleted ? "ฝึกซ้ำด้วย AI" : "เปิดกล้องจับท่า AI เฉพาะท่านี้"}
                              >
                                {isExCompleted ? (
                                  <>
                                    <svg className="w-4 h-4 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    <span>ฝึกซ้ำ</span>
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    <span>ฝึกด้วย AI</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 3: แผนโภชนาการและตัวอย่างมื้ออาหาร (Hard Filter)
           ======================================================== */}
        {activeTab === "nutrition" && (
          <div className="space-y-6">
            {/* แถบแจ้งเตือนความปลอดภัยของอาหารและการคัดกรองเฉพาะบุคคล */}
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-bold text-emerald-900">
                    Hard Filter Validation ผ่าน 100%: ระบบปรับแต่งอาหารตามข้อมูลของคุณเรียบร้อยแล้ว
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 font-bold text-[10px]">
                    {dietTypeLabelMap[assessment.dietType] || assessment.dietType}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-white border border-emerald-200 text-emerald-800 font-semibold text-[10px]">
                    {assessment.mealsPerDay || 3} มื้อ/วัน
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-white border border-emerald-200 text-emerald-800 font-semibold text-[10px]">
                    {eatingStyleLabelMap[assessment.eatingStyle || "mixed"]?.split(" ")[0]}
                  </span>
                </div>
              </div>

              {/* สรุปรายการที่กรองออก */}
              <div className="text-[11px] text-emerald-800 flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 border-t border-emerald-200/60">
                <div>
                  <strong>สารก่อภูมิแพ้ที่คัดออก:</strong>{" "}
                  {assessment.foodAllergies.includes("none") && !assessment.otherAllergy
                    ? "ไม่มีประวัติแพ้"
                    : `${assessment.foodAllergies.filter(a => a !== "none").map(a => allergyLabelMap[a] || a).join(", ")}${assessment.otherAllergy ? ` (${assessment.otherAllergy})` : ""}`}
                </div>
                {(!assessment.dislikedFoods?.includes("none") || assessment.otherDisliked) && (
                  <div>
                    <strong>อาหารที่ไม่รับประทานที่ตัดออก:</strong>{" "}
                    {`${(assessment.dislikedFoods || []).filter(d => d !== "none").map(d => dislikeLabelMap[d] || d).join(", ")}${assessment.otherDisliked ? ` (${assessment.otherDisliked})` : ""}`}
                  </div>
                )}
              </div>
            </div>

            {/* โมเดลจานอาหารสุขภาพ (Harvard Healthy Eating Plate & Thai MOPH 2:1:1 Model) */}
            <div className="bg-white border border-zinc-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    สัดส่วนจานสุขภาพตามมาตรฐานโลก (Harvard Healthy Eating Plate &amp; กรมอนามัย 2:1:1)
                  </h3>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    หลักการจัดจานอาหารในแต่ละมื้อเพื่อควบคุมพลังงานและรักษาระดับน้ำตาลในเลือดให้คงที่
                  </p>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  Harvard T.H. Chan &amp; MOPH
                </span>
              </div>

              {/* กราฟิกสัดส่วนจาน 50% : 25% : 25% */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-900">ผักและผลไม้หลากสี</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-black text-[10px]">
                        50% (2 ส่วน)
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-800/90 mt-2 leading-relaxed">
                      เน้นผักใบเขียว บรอกโคลี มะเขือเทศ แครอท (ใยอาหารสูง วิตามิน แร่ธาตุ และชะลอการดูดซึมน้ำตาล)
                    </p>
                  </div>
                  <div className="text-[10px] font-semibold text-emerald-700 mt-3 pt-2 border-t border-emerald-200/60">
                    ✓ เติมเต็มกระเพาะโดยไม่เพิ่มแคลอรี่ส่วนเกิน
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-950">คาร์โบไฮเดรตเชิงซ้อน</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-600 text-white font-black text-[10px]">
                        25% (1 ส่วน)
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-900/90 mt-2 leading-relaxed">
                      ข้าวกล้อง ข้าวไรซ์เบอร์รี่ มันเทศ ฟักทอง หรือข้าวโอ๊ต (Whole Grains ไม่ขัดสี)
                    </p>
                  </div>
                  <div className="text-[10px] font-semibold text-amber-800 mt-3 pt-2 border-t border-amber-200/60">
                    ✓ ให้พลังงานสม่ำเสมอ ค่าดัชนีน้ำตาลต่ำ (Low GI)
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-teal-950">โปรตีนคุณภาพดี</span>
                      <span className="px-2 py-0.5 rounded-full bg-teal-600 text-white font-black text-[10px]">
                        25% (1 ส่วน)
                      </span>
                    </div>
                    <p className="text-[11px] text-teal-900/90 mt-2 leading-relaxed">
                      อกไก่ ปลาทะเล/ปลาน้ำจืด ไข่ไก่ เต้าหู้ขาว ถั่วเมล็ดแห้ง (ไขมันอิ่มตัวต่ำ)
                    </p>
                  </div>
                  <div className="text-[10px] font-semibold text-teal-800 mt-3 pt-2 border-t border-teal-200/60">
                    ✓ เสริมสร้างกล้ามเนื้อและรักษาอัตราเผาผลาญ
                  </div>
                </div>
              </div>
            </div>

            {/* กรอบเพดานสารอาหารสำคัญตามเกณฑ์ WHO & ISSN (Micronutrient & Intake Limits) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-white border border-zinc-200 shadow-sm">
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">WHO 2023 Target</div>
                <div className="text-base font-black text-rose-600 mt-0.5">&lt; 2,000 มก.</div>
                <div className="text-[11px] font-bold text-zinc-800 mt-0.5">โซเดียม / วัน</div>
                <p className="text-[10px] text-zinc-500 mt-1 leading-tight">
                  เกลือ &lt; 1 ช้อนชา เพื่อป้องกันความดันและไต
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-zinc-200 shadow-sm">
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">WHO &amp; กรมอนามัย</div>
                <div className="text-base font-black text-amber-600 mt-0.5">&le; 25 กรัม</div>
                <div className="text-[11px] font-bold text-zinc-800 mt-0.5">น้ำตาลอิสระ / วัน</div>
                <p className="text-[10px] text-zinc-500 mt-1 leading-tight">
                  ไม่เกิน 6 ช้อนชา ป้องกันไขมันสะสมในตับ
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-zinc-200 shadow-sm">
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Dietary Fiber</div>
                <div className="text-base font-black text-emerald-600 mt-0.5">25 - 35 กรัม</div>
                <div className="text-[11px] font-bold text-zinc-800 mt-0.5">ใยอาหาร / วัน</div>
                <p className="text-[10px] text-zinc-500 mt-1 leading-tight">
                  ช่วยระบบขับถ่ายและลดการดูดซึมคอเลสเตอรอล
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-zinc-200 shadow-sm">
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">ISSN Consensus</div>
                <div className="text-base font-black text-teal-600 mt-0.5">25 - 40 กรัม</div>
                <div className="text-[11px] font-bold text-zinc-800 mt-0.5">โปรตีนต่อมื้อ</div>
                <p className="text-[10px] text-zinc-500 mt-1 leading-tight">
                  กระตุ้น Muscle Protein Synthesis สูงสุด
                </p>
              </div>
            </div>

            {/* การแบ่งมื้ออาหาร พร้อมตัวเลือกยืดหยุ่นตามชีวิตจริง */}
            <div className="space-y-6">
              {mealPlan.map((meal, idx) => {
                const currentOptIdx = selectedMealChoices[idx] ?? 0;
                const activeOption = meal.options[currentOptIdx] || meal.options[0];

                return (
                  <div
                    key={idx}
                    className="bg-white border border-zinc-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5 hover:shadow-md transition-shadow"
                  >
                    {/* Header ของแต่ละมื้อ */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3.5">
                      <div>
                        <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          {meal.mealName}
                        </h3>
                        <div className="text-[11px] text-teal-700 mt-0.5 font-medium flex items-center gap-1">
                          <svg className="w-3.5 h-3.5 text-teal-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {meal.safetyNote}
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-3 py-1 rounded-full shrink-0 self-start sm:self-auto">
                        เป้าหมายพลังงาน ~ {meal.calories} kcal
                      </span>
                    </div>

                    {/* ตัวเลือกสไตล์อาหาร 3 ทางเลือก พร้อมรูปภาพ Thumbnail แสดงหน้าตาอาหาร */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                          เลือกสไตล์อาหารสำหรับมื้อนี้:
                        </span>
                        <span className="text-[11px] text-emerald-600 font-medium">
                          คลิกเพื่อสลับดูภาพและวิธีปรุง
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {meal.options.map((opt, optIdx) => {
                          const isSelected = currentOptIdx === optIdx;
                          return (
                            <button
                              key={optIdx}
                              type="button"
                              onClick={() =>
                                setSelectedMealChoices((prev) => ({
                                  ...prev,
                                  [idx]: optIdx,
                                }))
                              }
                              className={`p-2.5 rounded-2xl text-left transition flex items-center gap-3 active:scale-[0.98] border ${
                                isSelected
                                  ? "bg-emerald-50/90 border-emerald-500 text-emerald-950 shadow-sm ring-2 ring-emerald-500/20"
                                  : "bg-slate-50/80 hover:bg-slate-100/90 border-zinc-200/80 text-zinc-700"
                              }`}
                            >
                              <img
                                src={opt.imageUrl || "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=120&q=80"}
                                alt={opt.dish}
                                className="w-12 h-12 rounded-xl object-cover shrink-0 border border-zinc-200/80 shadow-2xs"
                                loading="lazy"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=120&q=80";
                                }}
                              />
                              <div className="min-w-0 flex-1">
                                <span className="text-xs font-bold block truncate text-zinc-900">
                                  {opt.category === "ตามสั่ง/นอกบ้าน"
                                    ? "นอกบ้าน / ตามสั่ง"
                                    : opt.category === "ทำเองง่ายๆ"
                                    ? "ทำเอง (สูตร 2:1:1)"
                                    : "พร้อมทานสะดวก"}
                                </span>
                                <span className="text-[11px] text-zinc-500 block truncate mt-0.5">
                                  {opt.dish}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* การ์ดนำเสนอเมนูแนะนำหลักที่เลือก (Featured Active Meal Card) */}
                    <div className="rounded-3xl bg-slate-50/90 border border-zinc-200 overflow-hidden shadow-2xs">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
                        {/* ฝั่งภาพถ่ายอาหารความละเอียดสูงขนาดใหญ่ */}
                        <div className="md:col-span-5 relative min-h-[220px] sm:min-h-[250px] md:min-h-[280px] bg-slate-200 overflow-hidden group">
                          <img
                            src={activeOption.imageUrl || "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800&q=80"}
                            alt={activeOption.imageAlt || activeOption.dish}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800&q=80";
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-black/20 pointer-events-none" />
                          <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold bg-white/95 text-emerald-900 shadow-md backdrop-blur-md">
                            {activeOption.category}
                          </span>
                          <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-black/70 text-white backdrop-blur-md border border-white/10">
                            โควต้า ~{meal.calories} kcal
                          </span>
                        </div>

                        {/* ฝั่งรายละเอียด เมนู / เทคนิค / สัดส่วนจาน / มาโคร */}
                        <div className="md:col-span-7 p-5 sm:p-6 flex flex-col justify-between space-y-4">
                          <div className="space-y-3">
                            <h4 className="text-base sm:text-lg font-black text-zinc-900 leading-snug">
                              {activeOption.dish}
                            </h4>

                            {activeOption.orderingTip && (
                              <div className="text-xs text-zinc-700 bg-white border border-zinc-200 rounded-2xl p-3.5 flex items-start gap-2.5 leading-relaxed shadow-xs">
                                <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                                <div>
                                  <strong className="text-zinc-900 font-bold">เทคนิคการสั่ง / ปรุง:</strong>{" "}
                                  <span className="text-zinc-600">{activeOption.orderingTip}</span>
                                </div>
                              </div>
                            )}

                            <div className="text-xs text-teal-950 bg-teal-50/90 border border-teal-200/80 rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5">
                              <svg className="w-4 h-4 text-teal-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                              </svg>
                              <div>
                                <strong className="font-bold text-teal-900">สัดส่วนจานสุขภาพ 2:1:1:</strong>{" "}
                                <span className="font-medium text-teal-800">{activeOption.plateRatio}</span>
                              </div>
                            </div>
                          </div>

                          {/* สัดส่วนมาโครสารอาหาร (Macronutrient Badges) */}
                          <div className="pt-3 border-t border-zinc-200/70 flex flex-wrap items-center gap-3 text-xs font-mono">
                            <div className="px-3 py-1 rounded-xl bg-white border border-zinc-200 flex items-center gap-1.5 shadow-2xs">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              <span className="text-zinc-500 text-[10px]">โปรตีน:</span>
                              <strong className="text-zinc-900 font-bold">{meal.protein}</strong>
                            </div>
                            <div className="px-3 py-1 rounded-xl bg-white border border-zinc-200 flex items-center gap-1.5 shadow-2xs">
                              <span className="w-2 h-2 rounded-full bg-amber-500" />
                              <span className="text-zinc-500 text-[10px]">คาร์บ:</span>
                              <strong className="text-zinc-900 font-bold">{meal.carbs}</strong>
                            </div>
                            <div className="px-3 py-1 rounded-xl bg-white border border-zinc-200 flex items-center gap-1.5 shadow-2xs">
                              <span className="w-2 h-2 rounded-full bg-sky-500" />
                              <span className="text-zinc-500 text-[10px]">ไขมันดี:</span>
                              <strong className="text-zinc-900 font-bold">{meal.fat}</strong>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* เคล็ดลับการจัดการอาหารตามงบประมาณ */}
            <div className="p-5 rounded-3xl bg-white border border-zinc-200 shadow-sm text-xs space-y-3">
              <h4 className="font-bold text-zinc-900 flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                กลยุทธ์การจัดการอาหารตามงบประมาณ ({budgetLabelMap[assessment.foodBudget] || assessment.foodBudget}):
              </h4>
              {assessment.foodBudget === "economy" ? (
                <div className="text-zinc-600 leading-relaxed space-y-1.5">
                  <p>• <strong>โปรตีนคุ้มค่าราคาประหยัด:</strong> ไข่ไก่ยกแผง, อกไก่แช่แข็งยกกิโล, เต้าหู้ขาวก้อนละ 15 บาท, และถั่วเหลือง/ถั่วเขียวต้ม ให้โปรตีนสูงในราคาเฉลี่ยไม่เกิน 30-45 บาทต่อมื้อ</p>
                  <p>• <strong>คาร์โบไฮเดรตเชิงซ้อน:</strong> ซื้อข้าวกล้องผสมข้าวขาวและฟักทอง/มันเทศไทยตามตลาดสด ช่วยประหยัดค่าใช้จ่ายได้มากกว่า 50% เมื่อเทียบกับการซื้ออาหารสำเร็จรูป</p>
                </div>
              ) : assessment.foodBudget === "flexible" ? (
                <div className="text-zinc-600 leading-relaxed space-y-1.5">
                  <p>• <strong>โปรตีนและไขมันดีระดับพรีเมียม:</strong> แซลมอนนอร์เวย์, เนื้อสันในเกรดนำเข้า, ปลาหิมะ, อะโวคาโด และน้ำมันมะกอก Extra Virgin คุณภาพสูง เพื่อสารอาหารและกรดไขมันโอเมก้า 3 สูงสุด</p>
                  <p>• <strong>ความสะดวกสบายสูงสุด:</strong> สามารถเลือกสั่งบริการ Clean Food Delivery หรือ Meal Prep รายสัปดาห์ที่มีการคำนวณแคลอรี่และสารอาหารครบถ้วนเพื่อประหยัดเวลาเตรียมอาหาร</p>
                </div>
              ) : (
                <div className="text-zinc-600 leading-relaxed space-y-1.5">
                  <p>• <strong>สมดุลความสะดวกและคุณภาพ:</strong> เลือกซื้อเนื้อสัตว์สด เช่น สันในหมูไร้มัน อกไก่สด และปลากะพง/ปลาทับทิม ควบคู่กับสลัดกล่องและอกไก่นุ่มพร้อมทานในวันที่ไม่มีเวลาปรุงอาหาร</p>
                  <p>• <strong>คาร์โบไฮเดรตหลากหลาย:</strong> สลับระหว่างข้าวไรซ์เบอร์รี่ ขนมปังโฮลวีตแท้ 100% และมันเทศญี่ปุ่นนึ่ง ให้ความอร่อยและคุมระดับน้ำตาลได้ดีเยี่ยม</p>
                </div>
              )}
            </div>

            {/* คำแนะนำการรับประทานอาหารเสริมตามเวลาที่เหมาะสม (Personalized Supplement Guide) */}
            {assessment.supplements && !assessment.supplements.includes("none") && assessment.supplements.length > 0 && (
              <div className="p-5 rounded-3xl bg-white border border-zinc-200 shadow-sm text-xs space-y-3">
                <h4 className="font-bold text-zinc-900 flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  ตารางเวลาและข้อแนะนำการรับประทานอาหารเสริมของคุณ (Optimal Supplement Timing):
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {assessment.supplements.includes("whey") && (
                    <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                      <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        เวย์โปรตีน (Whey Protein):
                      </div>
                      <p className="text-zinc-600 text-[11px] leading-relaxed">
                        • <strong>เวลาที่เหมาะสม:</strong> ดื่ม 1 สกู๊ป (โปรตีน 24-27g) ทันทีหลังฝึกเสร็จภายใน 30-45 นาที หรือใช้เสริมในมื้อที่โปรตีนจากอาหารหลักไม่ถึงเกณฑ์
                      </p>
                    </div>
                  )}
                  {assessment.supplements.includes("creatine") && (
                    <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-200 space-y-1">
                      <div className="font-bold text-teal-950 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                        ครีเอทีน (Creatine Monohydrate):
                      </div>
                      <p className="text-zinc-600 text-[11px] leading-relaxed">
                        • <strong>เวลาที่เหมาะสม:</strong> ทานวันละ 3-5 กรัม สม่ำเสมอทุกวันในเวลาเดิม (แนะนำพร้อมมื้ออาหารหรือโปรตีนเชค) ช่วยเพิ่มพละกำลัง ATP ในกล้ามเนื้อ
                      </p>
                    </div>
                  )}
                  {assessment.supplements.includes("multivitamin") && (
                    <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1">
                      <div className="font-bold text-amber-950 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                        วิตามินรวม (Multivitamin):
                      </div>
                      <p className="text-zinc-600 text-[11px] leading-relaxed">
                        • <strong>เวลาที่เหมาะสม:</strong> ทาน 1 เม็ดหลังอาหารมื้อแรกของวัน เพื่อให้วิตามินที่ละลายในไขมัน (A, D, E, K) ดูดซึมได้ดีที่สุด
                      </p>
                    </div>
                  )}
                  {assessment.supplements.includes("fish_oil") && (
                    <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-1">
                      <div className="font-bold text-sky-950 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
                        น้ำมันปลา (Fish Oil / Omega-3):
                      </div>
                      <p className="text-zinc-600 text-[11px] leading-relaxed">
                        • <strong>เวลาที่เหมาะสม:</strong> ทาน 1,000 - 2,000 mg พร้อมมื้ออาหารหลัก ช่วยลดการอักเสบ บำรุงข้อต่อ และการทำงานของหลอดเลือดหัวใจ
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* แถบรับรองความปลอดภัยเฉพาะบุคคล (Personalized Safety Guarantee) */}
        <section className="bg-white border border-zinc-200 rounded-3xl p-5 sm:p-6 shadow-sm print:mt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0 text-emerald-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900">
                  ระบบคัดกรองความปลอดภัยและการปรับแต่งแผนเฉพาะบุคคล
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
                  ตารางออกกำลังกายและแผนอาหารทั้งหมดถูกปรับจูนอัตโนมัติตามสมรรถภาพร่างกาย ข้อจำกัดการเคลื่อนไหว และสารก่อภูมิแพ้ของคุณ เพื่อประสิทธิผลและความปลอดภัยสูงสุด
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                ✓ Personal Safety Verified
              </span>
            </div>
          </div>
        </section>
      </main>

      {/* โมดอลจับท่าทางด้วย AI แบบเรียลไทม์ (Live AI Workout Trainer) */}
      {activeAIDay && (
        <LiveWorkoutTrainer
          dayTitle={activeAIDay.dayTitle}
          exercises={activeAIDay.exercises}
          initialExerciseIndex={activeAIDay.initialIndex || 0}
          workoutIntensity={assessment.workoutIntensity}
          onClose={() => setActiveAIDay(null)}
          onCompleteExercise={(exIdx) => {
            handleCompleteExercise(
              activeAIDay.dayIndex,
              exIdx,
              activeAIDay.exercises
            );
          }}
          onCompleteDay={() => {
            if (!completedDays.includes(activeAIDay.dayIndex)) {
              handleToggleCompleteDay(activeAIDay.dayIndex);
            }
          }}
        />
      )}

      {/* โมดอลแสดงภาพเคลื่อนไหวสาธิตท่าทางและการจัดระเบียบร่างกาย (Exercise Demo Modal) */}
      {demoExercise && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in overflow-y-auto"
          onClick={() => setDemoExercise(null)}
        >
          <div
            className="max-w-2xl w-full max-h-[92vh] overflow-y-auto rounded-3xl my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <ExerciseDemoView
              exerciseName={demoExercise.name}
              safetyCue={demoExercise.safetyCue}
              isCompact={false}
              onClose={() => setDemoExercise(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
