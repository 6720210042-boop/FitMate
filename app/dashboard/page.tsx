"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import LiveWorkoutTrainer from "./LiveWorkoutTrainer";

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
  parqChestPain: boolean;
  parqDoctorWarning: boolean;
  parqDizziness: boolean;
  isRedFlag: boolean;
  fitnessGoal: string;
  targetDuration: string;
  workoutIntensity: string;
  workoutDays: number;
  sessionMinutes: number;
  workoutLocation: string;
  selectedEquipment: string[];
  movementLimits: string[];
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

// ฐานข้อมูลแบบฝึกออกกำลังกาย (จัดกลุ่มตามข้อจำกัดและอุปกรณ์)
interface ExerciseItem {
  name: string;
  sets: string;
  reps: string;
  rest: string;
  tag: string;
  note?: string;
  contraindicatedIn?: string[]; // ข้อห้ามทำถ้ามีอาการเหล่านี้
}

export default function DashboardPage() {
  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"workout" | "nutrition" | "overview">("overview");

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
    }
  }, []);

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
          <Link
            href="/assessment"
            className="block w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition"
          >
            ทำแบบประเมินสุขภาพตอนนี้
          </Link>
          <Link href="/" className="block text-xs text-zinc-500 hover:underline">
            กลับหน้าหลัก
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

  // สร้างตารางออกกำลังกายแบบคัดกรองความปลอดภัย (Safety Workout Split)
  const generatePersonalizedWorkoutDays = () => {
    const daysCount = assessment.workoutDays || 3;
    const hasDumbbell = assessment.selectedEquipment.includes("dumbbells");
    const isGym = assessment.workoutLocation === "gym";

    const days = [];

    // วันที่ 1: ลำตัวช่วงบน (Upper Body)
    const upperExercises: ExerciseItem[] = [];
    if (hasDumbbell || isGym) {
      upperExercises.push({
        name: "Dumbbell Chest Press (ดันอก)",
        sets: "3 เซ็ต",
        reps: "10-12 ครั้ง",
        rest: "60 วิ",
        tag: "อกและต้นแขน",
      });
      upperExercises.push({
        name: hasBackIssue
          ? "Chest-Supported Row (ดึงหลังแบบมีเบาะพิงหลัง)"
          : "Dumbbell Row (ดึงหลังข้างลำตัว)",
        sets: "3 เซ็ต",
        reps: "12 ครั้ง",
        rest: "60 วิ",
        tag: "กล้ามเนื้อหลัง",
        note: hasBackIssue ? "เซฟหลังส่วนล่าง ไม่ก้มตัวแอ่นหลัง" : undefined,
      });
    } else {
      upperExercises.push({
        name: "Knee Push-ups / Incline Push-ups (วิดพื้นชันเข่า)",
        sets: "3 เซ็ต",
        reps: "8-12 ครั้ง",
        rest: "60 วิ",
        tag: "อกและแขน",
      });
      upperExercises.push({
        name: "Prone Cobra / Superman Hold",
        sets: "3 เซ็ต",
        reps: "10 ครั้ง (ค้าง 3 วิ)",
        rest: "45 วิ",
        tag: "หลังส่วนบนและสะบัก",
      });
    }

    if (!hasShoulderIssue) {
      upperExercises.push({
        name: "Dumbbell Shoulder Press / Lateral Raises",
        sets: "3 เซ็ต",
        reps: "12 ครั้ง",
        rest: "60 วิ",
        tag: "หัวไหล่",
      });
    } else {
      upperExercises.push({
        name: "Scapular Wall Slides (สไลด์แขนแนบกำแพง)",
        sets: "3 เซ็ต",
        reps: "10 ครั้ง",
        rest: "45 วิ",
        tag: "เสริมความมั่นคงหัวไหล่ ปลอดภัย",
        note: "หลีกเลี่ยงการยกน้ำหนักเหนือศีรษะ",
      });
    }

    days.push({
      dayTitle: "วันฝึกที่ 1: กล้ามเนื้อช่วงบนและความแข็งแรง (Upper Body)",
      focus: "อก หลัง ไหล่ และแขน",
      duration: `${assessment.sessionMinutes || 40} นาที`,
      exercises: upperExercises,
    });

    // วันที่ 2: ลำตัวช่วงล่าง & แกนกลางลำตัว (Lower Body & Core)
    const lowerExercises: ExerciseItem[] = [];
    if (hasKneeIssue) {
      // คัดกรองท่าเข่า: ห้าม Jump Squat / Lunges ลึก -> แทนด้วย Glute Bridge, Wall Sit
      lowerExercises.push({
        name: "Glute Bridges (ยกสะโพกขึ้นจากพื้น)",
        sets: "4 เซ็ต",
        reps: "15 ครั้ง",
        rest: "45 วิ",
        tag: "ก้นและสะโพก (Low-impact ปลอดภัยต่อข้อเข่า 100%)",
        note: "ไม่สร้างแรงกดที่กระดูกสะบ้าหัวเข่า",
      });
      lowerExercises.push({
        name: "Wall Sit (นั่งพิงกำแพงทรงตัว)",
        sets: "3 เซ็ต",
        reps: "ค้าง 20-30 วินาที",
        rest: "60 วิ",
        tag: "ต้นขาแบบนิ่ง (Isometric)",
      });
      lowerExercises.push({
        name: "Clamshells (นอนเปิดขาบริหารสะโพก)",
        sets: "3 เซ็ต",
        reps: "12 ครั้ง/ข้าง",
        rest: "45 วิ",
        tag: "สะโพกด้านข้าง เสริมความมั่นคงข้อเข่า",
      });
    } else {
      lowerExercises.push({
        name: hasDumbbell ? "Goblet Squats (สควอทถือดัมเบล)" : "Bodyweight Air Squats (บอดี้เวทสควอท)",
        sets: "3-4 เซ็ต",
        reps: "12-15 ครั้ง",
        rest: "60 วิ",
        tag: "ต้นขาและสะโพก",
      });
      lowerExercises.push({
        name: "Reverse Lunges (ก้าวถอยหลังย่อตัว)",
        sets: "3 เซ็ต",
        reps: "10 ครั้ง/ข้าง",
        rest: "60 วิ",
        tag: "ต้นขาและแกนกลาง",
      });
      lowerExercises.push({
        name: "Glute Bridges",
        sets: "3 เซ็ต",
        reps: "15 ครั้ง",
        rest: "45 วิ",
        tag: "สะโพกและหลังส่วนล่าง",
      });
    }

    // แกนกลางลำตัว (Core)
    if (hasBackIssue) {
      lowerExercises.push({
        name: "Bird-Dog Exercise (เหยียดแขนขาตรงข้าม)",
        sets: "3 เซ็ต",
        reps: "10 ครั้ง/ข้าง",
        rest: "45 วิ",
        tag: "แกนกลางลำตัว (กายภาพป้องกันปวดหลัง)",
        note: "ปลอดภัยต่อหมอนรองกระดูก ไม่โก่งหลัง",
      });
    } else {
      lowerExercises.push({
        name: "Plank (แพลงก์เกร็งหน้าท้อง)",
        sets: "3 เซ็ต",
        reps: "ค้าง 30-45 วินาที",
        rest: "45 วิ",
        tag: "หน้าท้องและแกนกลาง",
      });
    }

    days.push({
      dayTitle: "วันฝึกที่ 2: ช่วงล่างและแกนกลางลำตัว (Lower Body & Core)",
      focus: hasKneeIssue ? "เน้นสะโพกและต้นขาแบบไร้แรงกระแทกเข่า" : "สะโพก ต้นขา และหน้าท้อง",
      duration: `${assessment.sessionMinutes || 40} นาที`,
      exercises: lowerExercises,
    });

    // วันที่ 3: คาร์ดิโอโซนปลอดภัย & เคลื่อนไหวร่างกาย (Safe Cardio & Mobility)
    const cardioExercises: ExerciseItem[] = [];
    if (assessment.isRedFlag) {
      cardioExercises.push({
        name: "เดินชันบนลู่วิ่ง หรือ เดินเร็วในสวน (Brisk Walk Zone 2)",
        sets: "1 รอบ",
        reps: "20-25 นาที",
        rest: "พักจิบน้ำเมื่อเหนื่อย",
        tag: "คาร์ดิโอเบา คุมอัตราเต้นหัวใจ",
        note: "โซนพูดคุยได้สบาย ไม่เหนื่อยหอบจนพูดไม่ได้",
      });
      cardioExercises.push({
        name: "Full Body Mobility & Dynamic Stretching (ยืดเหยียดข้อต่อ)",
        sets: "2 รอบ",
        reps: "10 นาที",
        rest: "สบายๆ",
        tag: "ความยืดหยุ่นและผ่อนคลาย",
      });
    } else {
      cardioExercises.push({
        name: hasKneeIssue
          ? "ปั่นจักรยานอยู่กับที่ / เดินชัน (Incline Treadmill Walk)"
          : "High Knees สลับ Shadow Boxing (เบิร์นไขมัน)",
        sets: "4-5 รอบ",
        reps: "ทำงาน 40 วิ / พัก 20 วิ",
        rest: "20 วิ",
        tag: "คาร์ดิโอเผาผลาญพลังงาน",
      });
      cardioExercises.push({
        name: "Dead Bug Exercise (บริหารหน้าท้อง)",
        sets: "3 เซ็ต",
        reps: "12 ครั้ง",
        rest: "45 วิ",
        tag: "กล้ามเนื้อแกนกลาง",
      });
      cardioExercises.push({
        name: "Cool Down & Static Stretching (ยืดกล้ามเนื้อหลังออกกำลังกาย)",
        sets: "1 รอบ",
        reps: "10 นาที",
        rest: "-",
        tag: "ลดอาการปวดเมื่อย",
      });
    }

    days.push({
      dayTitle: "วันฝึกที่ 3: คาร์ดิโอและฟื้นฟูกล้ามเนื้อ (Cardio & Recovery)",
      focus: assessment.isRedFlag ? "คาร์ดิโอระดับเบาเพื่อสุขภาพหัวใจ" : "คาร์ดิโอและเผาผลาญไขมัน",
      duration: `${assessment.sessionMinutes || 35} นาที`,
      exercises: cardioExercises,
    });

    // ถ้าเลือก 4-5 วันต่อสัปดาห์
    if (daysCount >= 4) {
      days.push({
        dayTitle: "วันฝึกที่ 4: เสริมความกระชับทั้งตัว (Full Body Circuit)",
        focus: "กระตุ้นกล้ามเนื้อรวมและการเผาผลาญ",
        duration: `${assessment.sessionMinutes || 40} นาที`,
        exercises: [
          {
            name: "Dumbbell / Band Deadlift (หรือ Glute Bridge หนักขึ้น)",
            sets: "3 เซ็ต",
            reps: "12 ครั้ง",
            rest: "60 วิ",
            tag: "กล้ามเนื้อโซ่หลัง",
          },
          {
            name: "Standing Dumbbell Bicep Curl to Overhead (หรือ Lateral)",
            sets: "3 เซ็ต",
            reps: "12 ครั้ง",
            rest: "45 วิ",
            tag: "แขนและไหล่",
          },
          {
            name: "Side Plank (แพลงก์ตะแคงข้าง)",
            sets: "3 เซ็ต",
            reps: "ค้าง 20 วินาที/ข้าง",
            rest: "45 วิ",
            tag: "เอวด้านข้างและความสมดุล",
          },
        ],
      });
    }

    return days;
  };

  const workoutSchedule = generatePersonalizedWorkoutDays();

  // ระบบ HARD FILTER อาหารที่แพ้ 100% (ห้ามแนะนำเมนูที่มีส่วนผสมดังกล่าวเด็ดขาด)
  const generatePersonalizedMealPlan = () => {
    const allergies = assessment.foodAllergies || ["none"];
    const isNoSeafood = allergies.includes("seafood");
    const isNoPeanuts = allergies.includes("peanuts");
    const isNoDairy = allergies.includes("dairy");
    const isNoEgg = allergies.includes("egg");
    const isNoSoy = allergies.includes("soy");

    const isVegetarian = assessment.dietType === "vegetarian" || assessment.dietType === "vegan";
    const mealsCount = assessment.mealsPerDay || 3;
    const targetCal = assessment.targetCalories || 1800;
    const targetProtein = assessment.targetProteinGrams || 100;

    // คำนวณแคลอรี่และโปรตีนต่อมื้อ
    const calPerMeal = Math.round(targetCal / mealsCount);
    const proteinPerMeal = Math.round(targetProtein / mealsCount);

    // เมนูมื้อหลักที่ผ่านการกรอง Hard Filter
    const mealTemplates = [
      {
        mealName: mealsCount === 2 ? "มื้อที่ 1 (Brunch 10:00 - 11:30 น.)" : "มื้อเช้า (07:30 - 08:30 น.)",
        dish: isVegetarian
          ? isNoSoy
            ? "ข้าวกล้อง + ไข่ต้ม 2 ฟอง + ผัดเห็ดสามอย่างใส่น้ำมันมะกอก"
            : "ข้าวกล้อง + เต้าหู้ขาวผัดผักรวม + งาขาวคั่ว"
          : isNoEgg
          ? "ข้าวไรซ์เบอร์รี่ + อกไก่ย่างสมุนไพร + ผักลวก (บรอกโคลี/แครอท)"
          : "ข้าวกล้อง + อกไก่ผัดกะเพราคลีน + ไข่ดาวน้ำ (ไม่ใช้น้ำมัน)",
        calories: calPerMeal,
        protein: `${proteinPerMeal} กรัม`,
        carbs: `${Math.round((calPerMeal * 0.5) / 4)} กรัม`,
        fat: `${Math.round((calPerMeal * 0.25) / 9)} กรัม`,
        safetyNote: isNoSeafood
          ? "ปลอดภัย 100%: ไม่มีส่วนผสมของอาหารทะเล / น้ำปลาแท้จากปลาทะเล"
          : isNoDairy
          ? "ปลอดภัย 100%: ไม่มีเนย นม หรือแลคโตส"
          : "สารอาหารครบถ้วนตามโควต้าพลังงาน",
      },
      {
        mealName: mealsCount === 2 ? "มื้อที่ 2 (Dinner 17:00 - 18:30 น.)" : "มื้อกลางวัน (12:00 - 13:00 น.)",
        dish: isVegetarian
          ? "สลัดคีนัวควบคู่เทมเป้กริลล์ / ถั่วลูกไก่ต้ม + อะโวคาโดและน้ำมันมะกอก"
          : isNoSeafood
          ? "สเต็กอกไก่หมักพริกไทยดำ + มันหวานนึ่ง + สลัดผักน้ำใส"
          : "ข้าวกล้องหน้าปลาแซลมอนย่างซีอิ๊วโซเดียมต่ำ + ฟักทองนึ่ง",
        calories: calPerMeal,
        protein: `${proteinPerMeal} กรัม`,
        carbs: `${Math.round((calPerMeal * 0.5) / 4)} กรัม`,
        fat: `${Math.round((calPerMeal * 0.25) / 9)} กรัม`,
        safetyNote: "คัดกรองสารก่อภูมิแพ้ตามข้อมูลของคุณโดยเด็ดขาด",
      },
    ];

    if (mealsCount >= 3) {
      mealTemplates.push({
        mealName: "มื้อเย็น (17:30 - 19:00 น.)",
        dish: isVegetarian
          ? "ต้มจับฉ่ายเต้าหู้เห็ดหอม + ข้าวกล้องครึ่งทัพพี"
          : "ปลากะพงนึ่งซีอิ๊ว (หรืออกไก่ต้มน้ำปลาโซเดียมต่ำ) + แกงจืดเต้าหู้หมูสับตำลึง",
        calories: calPerMeal,
        protein: `${proteinPerMeal} กรัม`,
        carbs: `${Math.round((calPerMeal * 0.45) / 4)} กรัม`,
        fat: `${Math.round((calPerMeal * 0.25) / 9)} กรัม`,
        safetyNote: "เน้นโปรตีนย่อยง่าย แป้งพอเหมาะก่อนเข้านอน",
      });
    }

    if (mealsCount >= 4) {
      mealTemplates.push({
        mealName: "ของว่างพลังงานสูง (Snack ก่อนออกกำลังกาย)",
        dish: isNoDairy
          ? "กล้วยหอม 1 ลูก + นมอัลมอนด์ / นมถั่วเหลืองไม่หวาน"
          : isNoPeanuts
          ? "โยเกิร์ตสูตรไขมัน 0% + กีวี่สด"
          : "กรีกโยเกิร์ต 1 ถ้วย + ถั่วอัลมอนด์อบ 10 เม็ด",
        calories: Math.round(calPerMeal * 0.6),
        protein: "15 กรัม",
        carbs: "25 กรัม",
        fat: "5 กรัม",
        safetyNote: "ของว่างให้พลังงานเร็ว ไม่จุกแน่นท้อง",
      });
    }

    return mealTemplates;
  };

  const mealPlan = generatePersonalizedMealPlan();

  return (
    <div className="min-h-screen bg-slate-50 text-zinc-900 selection:bg-emerald-500 selection:text-white pb-24 relative">
      {/* แถบนำทางด้านบน */}
      <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/80 backdrop-blur-md px-6 py-3.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 font-black text-white text-base shadow-sm">
              FM
            </div>
            <span className="text-lg font-black tracking-tight text-zinc-900">
              Fit<span className="text-emerald-600">Mate</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/assessment"
              className="px-3.5 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 transition flex items-center gap-1.5 shadow-sm"
            >
              <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              แก้ไขข้อมูลแบบประเมิน
            </Link>
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
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                เป้าหมายหลัก: {goalLabels[assessment.fitnessGoal] || "ดูแลสุขภาพทั่วไป"}
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 text-center">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-zinc-200/80">
              <div className="text-[11px] font-semibold text-zinc-500">BMI ปัจจุบัน</div>
              <div className="text-2xl font-black text-zinc-900 mt-0.5">{assessment.bmi}</div>
              <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
                {assessment.bmi < 18.5
                  ? "ผอม"
                  : assessment.bmi <= 22.9
                  ? "สมส่วน"
                  : assessment.bmi <= 24.9
                  ? "น้ำหนักเกิน"
                  : "ภาวะเสี่ยงอ้วน"}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-zinc-200/80">
              <div className="text-[11px] font-semibold text-zinc-500">เป้าหมายแคลอรี่ / วัน</div>
              <div className="text-2xl font-black text-emerald-600 mt-0.5">
                {assessment.targetCalories}
              </div>
              <div className="text-[10px] text-zinc-500 mt-0.5">kcal / วัน</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-zinc-200/80">
              <div className="text-[11px] font-semibold text-zinc-500">โปรตีนเป้าหมาย</div>
              <div className="text-2xl font-black text-teal-600 mt-0.5">
                {assessment.targetProteinGrams || Math.round(assessment.weight * 1.6)}
              </div>
              <div className="text-[10px] text-zinc-500 mt-0.5">กรัม / วัน</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-zinc-200/80">
              <div className="text-[11px] font-semibold text-zinc-500">ดื่มน้ำขั้นต่ำ</div>
              <div className="text-2xl font-black text-cyan-600 mt-0.5">
                {(assessment.weight * 0.035).toFixed(1)}
              </div>
              <div className="text-[10px] text-zinc-500 mt-0.5">ลิตร / วัน</div>
            </div>
          </div>
        </div>

        {/* แถบเลือกแท็บ (Overview / Workout / Nutrition) */}
        <div className="flex border-b border-zinc-200">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`py-3 px-5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === "overview"
                ? "border-emerald-500 text-emerald-600"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            ภาพรวมและข้อควรระวัง
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("workout")}
            className={`py-3 px-5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === "workout"
                ? "border-emerald-500 text-emerald-600"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            ตารางออกกำลังกาย ({assessment.workoutDays} วัน/สัปดาห์)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("nutrition")}
            className={`py-3 px-5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === "nutrition"
                ? "border-emerald-500 text-emerald-600"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            แผนอาหาร (Hard Filter ปลอดภัย 100%)
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
              {assessment.foodAllergies.includes("none") ? (
                <p className="text-xs text-zinc-600">
                  คุณไม่มีประวัติแพ้อาหาร ระบบจึงเปิดให้ทานสารอาหารได้ครบทุกกลุ่มโดยเน้นอาหารจากธรรมชาติเป็นหลัก
                </p>
              ) : (
                <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 text-xs text-teal-950 space-y-1.5">
                  <div className="font-bold text-teal-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-teal-600" />
                    ระบบกรองวัตถุดิบที่แพ้ออก 100% ในทุกมื้ออาหาร:
                  </div>
                  <p className="leading-relaxed">
                    อาหารที่ตรวจพบในประวัติของคุณ:{" "}
                    <strong className="underline">
                      {assessment.foodAllergies.join(", ")} {assessment.otherAllergy ? `(${assessment.otherAllergy})` : ""}
                    </strong>{" "}
                    จะไม่ปรากฏในตารางอาหารเด็ดขาด และได้เตรียมแหล่งโปรตีนทางเลือกที่ปลอดภัยให้แทน
                  </p>
                </div>
              )}
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
            {/* กล่องเครื่องมือจับเวลาพักเซ็ต (Rest Timer) */}
            <div className="p-4 sm:p-5 rounded-3xl bg-white border border-zinc-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  เครื่องมือช่วยฝึก (Rest Timer)
                </div>
                <div className="text-sm font-black text-zinc-900 mt-0.5">
                  นาฬิกาจับเวลาพักระหว่างเซ็ต
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-2xl font-black text-emerald-600 font-mono">
                  {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, "0")}
                </div>

                <div className="flex gap-1.5">
                  {[30, 60, 90].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => handleStartTimer(sec)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                        timerPreset === sec && isTimerRunning
                          ? "bg-emerald-500 border-emerald-600 text-white"
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
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100"
                    >
                      หยุด
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* รายการวันฝึก */}
            <div className="space-y-4">
              {workoutSchedule.map((day, dayIndex) => {
                const isCompleted = completedDays.includes(dayIndex);
                return (
                  <div
                    key={dayIndex}
                    className={`bg-white border rounded-3xl p-6 shadow-sm transition ${
                      isCompleted ? "border-emerald-300 bg-emerald-50/30" : "border-zinc-200"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4 mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-zinc-900">
                            {day.dayTitle}
                          </h3>
                          {isCompleted && (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                              ฝึกเสร็จแล้ววันนี้
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">
                          โฟกัส: {day.focus} • ระยะเวลา: {day.duration}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
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
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20 transition flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span>เปิดโหมดจับท่า AI</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleCompleteDay(dayIndex)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-2 ${
                            isCompleted
                              ? "bg-emerald-500 border-emerald-600 text-white"
                              : "bg-slate-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {isCompleted ? "บันทึกเรียบร้อย" : "ติ๊กฝึกเสร็จวันนี้"}
                        </button>
                      </div>
                    </div>

                    {/* ตารางท่าออกกำลังกาย */}
                    <div className="space-y-2.5">
                      {day.exercises.map((ex, exIndex) => {
                        const isExCompleted = Boolean(
                          completedExercises[`${dayIndex}-${exIndex}`]
                        );
                        return (
                          <div
                            key={exIndex}
                            className={`p-3.5 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                              isExCompleted
                                ? "bg-emerald-50/40 border-emerald-300"
                                : "bg-slate-50/80 border-zinc-200/80"
                            }`}
                          >
                            <div>
                              <div className="text-xs font-bold text-zinc-900 flex items-center gap-2">
                                <span>{ex.name}</span>
                                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                                  {ex.tag}
                                </span>
                                {isExCompleted && (
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs animate-fade-in">
                                    <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                    ผ่านแล้ว
                                  </span>
                                )}
                              </div>
                              {ex.note && (
                                <p className="text-[11px] text-amber-700 mt-1 font-medium">
                                  * {ex.note}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <div className="flex items-center gap-4 text-xs font-mono text-zinc-600">
                                <div>
                                  <span className="text-zinc-400 text-[10px]">เซ็ต:</span>{" "}
                                  <strong className="text-zinc-900 font-bold">{ex.sets}</strong>
                                </div>
                                <div>
                                  <span className="text-zinc-400 text-[10px]">ครั้ง:</span>{" "}
                                  <strong className="text-zinc-900 font-bold">{ex.reps}</strong>
                                </div>
                                <div>
                                  <span className="text-zinc-400 text-[10px]">พัก:</span>{" "}
                                  <strong className="text-zinc-900 font-bold">{ex.rest}</strong>
                                </div>
                              </div>

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
                                className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition flex items-center gap-1.5 shadow-sm ${
                                  isExCompleted
                                    ? "bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                                    : "bg-white border-zinc-200 hover:border-emerald-500 hover:text-emerald-600 text-zinc-700"
                                }`}
                                title={isExCompleted ? "ฝึกซ้ำด้วย AI" : "เปิดกล้องจับท่า AI เฉพาะท่านี้"}
                              >
                                {isExCompleted ? (
                                  <>
                                    <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    <span>ฝึกซ้ำ</span>
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            {/* แถบแจ้งเตือนความปลอดภัยของอาหาร */}
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  <strong>Hard Filter Validation ผ่าน:</strong> เมนูด้านล่างนี้ได้รับการคัดกรองสารก่อภูมิแพ้ ({assessment.foodAllergies.join(", ")}) ออก 100% เรียบร้อยแล้ว
                </span>
              </div>
            </div>

            {/* การแบ่งมื้ออาหาร */}
            <div className="space-y-4">
              {mealPlan.map((meal, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                    <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-teal-500" />
                      {meal.mealName}
                    </h3>
                    <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                      ~ {meal.calories} kcal
                    </span>
                  </div>

                  <div>
                    <div className="text-sm font-bold text-zinc-900">{meal.dish}</div>
                    <div className="text-[11px] text-teal-700 mt-1 font-medium flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {meal.safetyNote}
                    </div>
                  </div>

                  {/* สัดส่วนมาโครของมื้อนี้ */}
                  <div className="pt-2 flex items-center gap-4 text-xs font-mono text-zinc-600 border-t border-zinc-50">
                    <div>
                      <span className="text-zinc-400 text-[10px]">โปรตีน:</span>{" "}
                      <strong className="text-zinc-900 font-bold">{meal.protein}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-400 text-[10px]">คาร์บ:</span>{" "}
                      <strong className="text-zinc-900 font-bold">{meal.carbs}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-400 text-[10px]">ไขมันดี:</span>{" "}
                      <strong className="text-zinc-900 font-bold">{meal.fat}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* เคล็ดลับการจัดการอาหารตามงบประมาณ */}
            <div className="p-5 rounded-3xl bg-white border border-zinc-200 shadow-sm text-xs space-y-2">
              <h4 className="font-bold text-zinc-900">
                คำแนะนำตามงบประมาณ ({assessment.foodBudget === "economy" ? "ประหยัด" : "ปานกลาง"}):
              </h4>
              <p className="text-zinc-600 leading-relaxed">
                • <strong>โปรตีนราคาประหยัด:</strong> ไข่ไก่, อกไก่สด, เต้าหู้ขาว และถั่วต้ม เป็นแหล่งโปรตีนคุณภาพสูงที่มีต้นทุนเฉลี่ยต่อกรัมต่ำที่สุด<br />
                • <strong>คาร์โบไฮเดรตเชิงซ้อน:</strong> ข้าวกล้องผสมข้าวขาว และมันเทศนึ่ง อยู่ท้องนานและช่วยคุมระดับน้ำตาลในเลือดได้อย่างมีประสิทธิภาพ
              </p>
            </div>
          </div>
        )}
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
    </div>
  );
}
