"use client";

import { useState, useEffect, useId } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// รายการโรคประจำตัว
const CHRONIC_DISEASES = [
  { id: "none", label: "ไม่มีโรคประจำตัว" },
  { id: "heart", label: "โรคหัวใจ / หลอดเลือด", isRedFlag: true },
  { id: "hypertension", label: "ความดันโลหิตสูง" },
  { id: "diabetes", label: "เบาหวาน" },
  { id: "kidney", label: "โรคไต" },
  { id: "asthma", label: "หอบหืด / ทางเดินหายใจ" },
  { id: "joints", label: "ข้อต่อ / ข้อเข่าเสื่อม" },
];

// รายการการผ่าตัด / บาดเจ็บที่ผ่านมา
const PAST_INJURIES = [
  { id: "none", label: "ไม่เคยผ่าตัดหรือบาดเจ็บรุนแรง" },
  { id: "knee_surgery", label: "เคยผ่าตัดหัวเข่า / เอ็นข้อเข่า" },
  { id: "spine_disc", label: "หมอนรองกระดูกทับเส้น / ปวดหลังเรื้อรัง" },
  { id: "shoulder_injury", label: "อาการบาดเจ็บข้อต่อหัวไหล่" },
  { id: "ankle_sprain", label: "ข้อเท้าพลิกบ่อย / ข้อเท้าไม่มั่นคง" },
];

// ข้อจำกัดทางร่างกายในการเคลื่อนไหว
const MOVEMENT_LIMITS = [
  { id: "none", label: "เคลื่อนไหวได้ปกติ ไม่มีข้อจำกัด" },
  { id: "knee_pain", label: "งอเข่าลำบาก / ปวดเข่าเวลากระแทก" },
  { id: "back_pain", label: "ก้มหลังลำบาก / ปวดหลังเวลาก้มยกของ" },
  { id: "shoulder_pain", label: "ยกแขนเหนือศีรษะลำบาก / ปวดไหล่" },
  { id: "wrist_pain", label: "ท้าวข้อมือลงพื้นไม่ได้ (เจ็บข้อมือ)" },
];

// อุปกรณ์ที่มี (Multi-select)
const EQUIPMENT_OPTIONS = [
  { id: "bodyweight", label: "ไม่มีอุปกรณ์ (Bodyweight)" },
  { id: "dumbbells", label: "ดัมเบล (Dumbbells)" },
  { id: "resistance_bands", label: "ยางยืดออกกำลังกาย (Resistance Bands)" },
  { id: "gym_machines", label: "เครื่องออกกำลังกายในฟิตเนส / บาร์เบล" },
  { id: "yoga_mat", label: "เสื่อโยคะ / ลูกบอลออกกำลังกาย" },
];

// การแพ้อาหาร (HARD FILTER 100%)
const ALLERGY_OPTIONS = [
  { id: "none", label: "ไม่มีประวัติแพ้อาหาร" },
  { id: "seafood", label: "อาหารทะเล / กุ้ง ปู หอย ปลาหมึก" },
  { id: "peanuts", label: "ถั่วลิสง / ถั่วเปลือกแข็ง" },
  { id: "dairy", label: "นมวัว / น้ำตาลแลคโตส" },
  { id: "gluten", label: "แป้งสาลี / กลูเตน" },
  { id: "egg", label: "ไข่ไก่ / ผลิตภัณฑ์จากไข่" },
  { id: "soy", label: "ถั่วเหลือง / ผลิตภัณฑ์จากถั่วเหลือง" },
];

// อาหารที่ไม่ทาน
const DISLIKED_FOODS = [
  { id: "none", label: "ทานได้ทุกอย่าง" },
  { id: "no_veg", label: "ไม่ทานผัก / ทานผักยาก" },
  { id: "no_red_meat", label: "ไม่ทานเนื้อวัว / เนื้อแดง" },
  { id: "no_poultry", label: "ไม่ทานเนื้อสัตว์ปีก (ไก่/เป็ด)" },
  { id: "no_spicy", label: "ไม่ทานรสเผ็ดจัด" },
];

// อาหารเสริม
const SUPPLEMENTS = [
  { id: "none", label: "ไม่ได้ทานอาหารเสริม" },
  { id: "whey", label: "เวย์โปรตีน / โปรตีนจากพืช" },
  { id: "multivitamin", label: "วิตามินรวม / วิตามินซี" },
  { id: "bcaa", label: "BCAA / กรดอะมิโน" },
  { id: "creatine", label: "ครีเอทีน (Creatine)" },
];

export default function AssessmentPage() {
  const router = useRouter();

  // ID สำหรับ Accessibility
  const otherChronicId = useId();
  const otherInjuryId = useId();
  const medicationId = useId();
  const otherAllergyId = useId();
  const otherDislikedId = useId();

  // ขั้นตอนปัจจุบัน (1: ประวัติสุขภาพ & PAR-Q, 2: แผนออกกำลังกาย, 3: โภชนาการ, 4: สรุปผลความปลอดภัย)
  const [step, setStep] = useState<number>(1);

  // --- STEP 1: ข้อมูลสุขภาพ & PAR-Q ---
  const [gender, setGender] = useState<"male" | "female">("male");
  const [birthDate, setBirthDate] = useState<string>("1998-01-01");
  const [age, setAge] = useState<number | "">(26);
  const [height, setHeight] = useState<number | "">(170);
  const [weight, setWeight] = useState<number | "">(65);

  const [chronicDiseases, setChronicDiseases] = useState<string[]>(["none"]);
  const [otherChronic, setOtherChronic] = useState<string>("");

  const [pastInjuries, setPastInjuries] = useState<string[]>(["none"]);
  const [otherInjury, setOtherInjury] = useState<string>("");

  const [regularMedications, setRegularMedications] = useState<string>("");
  const [isPregnantOrNursing, setIsPregnantOrNursing] = useState<boolean>(false);
  const [currentActivityLevel, setCurrentActivityLevel] = useState<string>("occasional");

  // PAR-Q Red Flag Questions (ถ้าตอบ "ใช่" จะเป็นธงแดง)
  const [parqChestPain, setParqChestPain] = useState<boolean>(false);
  const [parqDoctorWarning, setParqDoctorWarning] = useState<boolean>(false);
  const [parqDizziness, setParqDizziness] = useState<boolean>(false);

  // --- STEP 2: แผนและเป้าหมายการออกกำลังกาย (เลือกได้หลายเป้าหมาย) ---
  const [fitnessGoals, setFitnessGoals] = useState<string[]>(["fat_loss"]);
  const [targetDuration, setTargetDuration] = useState<string>("3_months");
  const [workoutIntensity, setWorkoutIntensity] = useState<string>("moderate");
  const [workoutDays, setWorkoutDays] = useState<number>(3);
  const [sessionMinutes, setSessionMinutes] = useState<number>(45);
  const [workoutLocation, setWorkoutLocation] = useState<string>("home");
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>(["bodyweight"]);
  const [movementLimits, setMovementLimits] = useState<string[]>(["none"]);

  // --- STEP 3: พฤติกรรมการกินและโภชนาการ ---
  const [dietType, setDietType] = useState<string>("general");
  const [dislikedFoods, setDislikedFoods] = useState<string[]>(["none"]);
  const [otherDisliked, setOtherDisliked] = useState<string>("");
  const [foodAllergies, setFoodAllergies] = useState<string[]>(["none"]);
  const [otherAllergy, setOtherAllergy] = useState<string>("");
  const [supplements, setSupplements] = useState<string[]>(["none"]);
  const [foodBudget, setFoodBudget] = useState<string>("moderate");
  const [mealsPerDay, setMealsPerDay] = useState<number>(3);

  const [isSaving, setIsSaving] = useState(false);

  const [hasExistingAssessment, setHasExistingAssessment] = useState(false);

  // โหลดข้อมูลเดิมถ้าเคยกรอกไว้แล้ว
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("fitmate_assessment");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          queueMicrotask(() => {
            setHasExistingAssessment(true);
            if (parsed.gender) setGender(parsed.gender);
            if (parsed.birthDate) setBirthDate(parsed.birthDate);
            if (parsed.age) setAge(parsed.age);
            if (parsed.height) setHeight(parsed.height);
            if (parsed.weight) setWeight(parsed.weight);
            if (parsed.chronicDiseases) setChronicDiseases(parsed.chronicDiseases);
            if (parsed.otherChronic) setOtherChronic(parsed.otherChronic);
            if (parsed.pastInjuries) setPastInjuries(parsed.pastInjuries);
            if (parsed.otherInjury) setOtherInjury(parsed.otherInjury);
            if (parsed.regularMedications) setRegularMedications(parsed.regularMedications);
            if (parsed.isPregnantOrNursing !== undefined) setIsPregnantOrNursing(parsed.isPregnantOrNursing);
            if (parsed.currentActivityLevel) setCurrentActivityLevel(parsed.currentActivityLevel);
            if (parsed.parqChestPain !== undefined) setParqChestPain(parsed.parqChestPain);
            if (parsed.parqDoctorWarning !== undefined) setParqDoctorWarning(parsed.parqDoctorWarning);
            if (parsed.parqDizziness !== undefined) setParqDizziness(parsed.parqDizziness);

            if (parsed.fitnessGoals && Array.isArray(parsed.fitnessGoals)) {
              setFitnessGoals(parsed.fitnessGoals);
            } else if (parsed.fitnessGoal) {
              setFitnessGoals([parsed.fitnessGoal]);
            }
            if (parsed.targetDuration) setTargetDuration(parsed.targetDuration);
            if (parsed.workoutIntensity) setWorkoutIntensity(parsed.workoutIntensity);
            if (parsed.workoutDays) setWorkoutDays(parsed.workoutDays);
            if (parsed.sessionMinutes) setSessionMinutes(Math.max(30, parsed.sessionMinutes));
            if (parsed.workoutLocation) setWorkoutLocation(parsed.workoutLocation);
            if (parsed.selectedEquipment) setSelectedEquipment(parsed.selectedEquipment);
            if (parsed.movementLimits) setMovementLimits(parsed.movementLimits);

            if (parsed.dietType) setDietType(parsed.dietType);
            if (parsed.dislikedFoods) setDislikedFoods(parsed.dislikedFoods);
            if (parsed.otherDisliked) setOtherDisliked(parsed.otherDisliked);
            if (parsed.foodAllergies) setFoodAllergies(parsed.foodAllergies);
            if (parsed.otherAllergy) setOtherAllergy(parsed.otherAllergy);
            if (parsed.supplements) setSupplements(parsed.supplements);
            if (parsed.foodBudget) setFoodBudget(parsed.foodBudget);
            if (parsed.mealsPerDay) setMealsPerDay(parsed.mealsPerDay);
          });
        } catch {
          // ignore
        }
      }
    }
  }, []);

  // คำนวณอายุอัตโนมัติจากวันเกิด
  useEffect(() => {
    if (birthDate) {
      const birth = new Date(birthDate);
      const now = new Date();
      let calculatedAge = now.getFullYear() - birth.getFullYear();
      const m = now.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
        calculatedAge--;
      }
      if (calculatedAge > 10 && calculatedAge < 110) {
        queueMicrotask(() => setAge(calculatedAge));
      }
    }
  }, [birthDate]);

  // ตรวจสอบสัญญาณธงแดง (Red Flag) จาก PAR-Q และโรคประจำตัว
  const isRedFlag =
    parqChestPain ||
    parqDoctorWarning ||
    parqDizziness ||
    chronicDiseases.includes("heart");

  // หากมีธงแดง บังคับปรับระดับความหนักไม่ให้เป็นระดับ "จริงจัง"
  useEffect(() => {
    if (isRedFlag && workoutIntensity === "intense") {
      queueMicrotask(() => setWorkoutIntensity("light"));
    }
  }, [isRedFlag, workoutIntensity]);

  // คำนวณ BMI / BMR / TDEE
  const numericHeight = Number(height) || 0;
  const numericWeight = Number(weight) || 0;
  const numericAge = Number(age) || 25;

  const heightInMeters = numericHeight > 0 ? numericHeight / 100 : 0;
  const bmi =
    heightInMeters > 0 && numericWeight > 0
      ? Number((numericWeight / (heightInMeters * heightInMeters)).toFixed(1))
      : 0;

  const getBmiCategory = (val: number) => {
    if (val <= 0) return { text: "รอการกรอกข้อมูล", color: "text-zinc-400", bg: "bg-zinc-100" };
    if (val < 18.5) return { text: "น้ำหนักน้อยกว่าเกณฑ์ (ผอม)", color: "text-amber-600", bg: "bg-amber-50" };
    if (val <= 22.9) return { text: "สมส่วน / สุขภาพดี", color: "text-emerald-600", bg: "bg-emerald-50" };
    if (val <= 24.9) return { text: "น้ำหนักเกินเกณฑ์เล็กน้อย", color: "text-yellow-700", bg: "bg-yellow-50" };
    return { text: "ภาวะน้ำหนักเกิน / เสี่ยงอ้วน", color: "text-rose-600", bg: "bg-rose-50" };
  };
  const bmiStatus = getBmiCategory(bmi);

  // สูตร Mifflin-St Jeor
  const calculateBmr = () => {
    if (numericWeight <= 0 || numericHeight <= 0 || numericAge <= 0) return 0;
    if (gender === "male") {
      return Math.round(10 * numericWeight + 6.25 * numericHeight - 5 * numericAge + 5);
    } else {
      return Math.round(10 * numericWeight + 6.25 * numericHeight - 5 * numericAge - 161);
    }
  };
  const bmr = calculateBmr();

  const activityMultipliers: Record<string, number> = {
    none: 1.2,
    occasional: 1.375,
    regular: 1.55,
  };
  const tdee = Math.round(bmr * (activityMultipliers[currentActivityLevel] || 1.375));

  // ปรับแคลอรี่ตามเป้าหมาย (คำนวณแบบผสมผสานเมื่อเลือกหลายข้อ)
  let calorieAdjustment = 0;
  const isFatLoss = fitnessGoals.includes("fat_loss");
  const isMuscleGain = fitnessGoals.includes("muscle_gain");
  if (isFatLoss && isMuscleGain) {
    calorieAdjustment = -200; // สร้างกล้ามเนื้อควบคู่ลดไขมัน (Body Recomposition)
  } else if (isFatLoss) {
    calorieAdjustment = -450;
  } else if (isMuscleGain) {
    calorieAdjustment = 300;
  }
  const targetCalories = Math.max(1200, tdee + calorieAdjustment);

  // คำนวณโปรตีนเป้าหมาย (1.6 - 2.0g ต่อน้ำหนักตัว)
  const targetProteinGrams = Math.round(
    isMuscleGain ? numericWeight * 2.0 : numericWeight * 1.6
  );

  // ฟังก์ชันสลับการเลือกเป้าหมาย (Multi-select: เลือกได้หลายอัน แต่คงไว้อย่างน้อย 1 ข้อ)
  const toggleFitnessGoal = (id: string) => {
    if (fitnessGoals.includes(id)) {
      if (fitnessGoals.length > 1) {
        setFitnessGoals(fitnessGoals.filter((g) => g !== id));
      }
    } else {
      setFitnessGoals([...fitnessGoals, id]);
    }
  };

  // ฟังก์ชันสลับการเลือกใน Checklist
  const toggleSelection = (
    currentList: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    itemId: string
  ) => {
    if (itemId === "none") {
      setList(["none"]);
      return;
    }
    const filtered = currentList.filter((x) => x !== "none");
    if (filtered.includes(itemId)) {
      const next = filtered.filter((x) => x !== itemId);
      setList(next.length > 0 ? next : ["none"]);
    } else {
      setList([...filtered, itemId]);
    }
  };

  // ฟังก์ชันกรอกข้อมูลตัวอย่างด่วนสำหรับการทดสอบ / เดโม
  const fillQuickDemo = () => {
    setGender("male");
    setBirthDate("1999-05-15");
    setAge(27);
    setHeight(175);
    setWeight(70);
    setChronicDiseases(["none"]);
    setOtherChronic("");
    setPastInjuries(["none"]);
    setOtherInjury("");
    setRegularMedications("");
    setIsPregnantOrNursing(false);
    setCurrentActivityLevel("occasional");
    setParqChestPain(false);
    setParqDoctorWarning(false);
    setParqDizziness(false);
    setFitnessGoals(["fat_loss", "muscle_gain"]);
    setTargetDuration("12_weeks");
    setWorkoutIntensity("moderate");
    setWorkoutDays(3);
    setSessionMinutes(45);
    setWorkoutLocation("home");
    setSelectedEquipment(["bodyweight", "dumbbells"]);
    setMovementLimits(["none"]);
    setDietType("general");
    setDislikedFoods(["none"]);
    setOtherDisliked("");
    setFoodAllergies(["none"]);
    setOtherAllergy("");
    setSupplements(["whey"]);
    setFoodBudget("medium");
    setMealsPerDay(3);
  };

  // บันทึกข้อมูลและไปยังหน้า Dashboard
  const handleCompleteAssessment = () => {
    setIsSaving(true);
    const fullAssessmentData = {
      gender,
      birthDate,
      age: numericAge,
      height: numericHeight,
      weight: numericWeight,
      bmi,
      bmr,
      tdee,
      targetCalories,
      targetProteinGrams,
      chronicDiseases,
      otherChronic,
      pastInjuries,
      otherInjury,
      regularMedications,
      isPregnantOrNursing,
      currentActivityLevel,
      parqChestPain,
      parqDoctorWarning,
      parqDizziness,
      isRedFlag,
      fitnessGoals,
      fitnessGoal: fitnessGoals[0] || "fat_loss",
      targetDuration,
      workoutIntensity,
      workoutDays,
      sessionMinutes,
      workoutLocation,
      selectedEquipment,
      movementLimits,
      dietType,
      dislikedFoods,
      otherDisliked,
      foodAllergies,
      otherAllergy,
      supplements,
      foodBudget,
      mealsPerDay,
      updatedAt: new Date().toISOString(),
    };

    if (typeof window !== "undefined") {
      localStorage.setItem("fitmate_assessment", JSON.stringify(fullAssessmentData));
    }

    setTimeout(() => {
      setIsSaving(false);
      router.push("/dashboard");
    }, 700);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-zinc-900 selection:bg-emerald-500 selection:text-white pb-24 relative">
      {/* แสงเอฟเฟกต์พื้นหลังโทนสว่าง */}
      <div className="absolute top-0 right-10 w-96 h-96 bg-emerald-100/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-5 w-80 h-80 bg-teal-100/50 rounded-full blur-3xl pointer-events-none" />

      {/* แถบนำทางด้านบน */}
      <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 font-black text-white text-base shadow-sm">
              FM
            </div>
            <span className="text-lg font-black tracking-tight text-zinc-900">
              Fit<span className="text-emerald-600">Mate</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {hasExistingAssessment && (
              <Link
                href="/dashboard"
                className="text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition flex items-center gap-1 font-semibold"
              >
                ไปยัง Dashboard ของฉัน
              </Link>
            )}
            <span className="text-xs text-zinc-500 hidden sm:inline">
              ขั้นตอนที่ {step} จาก 4
            </span>
            <Link
              href="/"
              className="text-xs text-zinc-500 hover:text-emerald-600 transition flex items-center gap-1 font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              กลับหน้าหลัก
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-8">
        {/* แถบขั้นตอนความคืบหน้า (Step Progress Bar) */}
        <div className="mb-8">
          <div className="grid grid-cols-4 gap-2 text-center text-[11px] font-bold text-zinc-500 mb-2">
            <span className={step >= 1 ? "text-emerald-600" : ""}>1. สุขภาพ & PAR-Q</span>
            <span className={step >= 2 ? "text-emerald-600" : ""}>2. แผนออกกำลังกาย</span>
            <span className={step >= 3 ? "text-emerald-600" : ""}>3. โภชนาการ</span>
            <span className={step >= 4 ? "text-emerald-600" : ""}>4. สรุปผลความปลอดภัย</span>
          </div>
          <div className="w-full h-2 bg-zinc-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-300 rounded-full"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* ========================================================
            STEP 1: ประวัติสุขภาพ & คำถามคัดกรองความเสี่ยง (PAR-Q)
           ======================================================== */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="text-center mb-6">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                ส่วนที่สำคัญที่สุด
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight mt-1">
                แบบสอบถามประวัติสุขภาพ & การคัดกรองความปลอดภัย
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-zinc-600 max-w-xl mx-auto">
                ข้อมูลเหล่านี้จำเป็นอย่างยิ่งในการคำนวณความหนักของการฝึก คัดกรองท่าอันตราย และวางแผนโภชนาการ
              </p>
            </div>

            {/* กล่องกรอกข้อมูลตัวอย่างด่วน */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs shadow-sm">
              <div className="flex items-center gap-2 text-emerald-900">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-medium">
                  ต้องการทดสอบระบบอย่างรวดเร็วโดยไม่ต้องพิมพ์ทีละช่อง?
                </span>
              </div>
              <button
                type="button"
                onClick={fillQuickDemo}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-sm shrink-0"
              >
                กรอกข้อมูลตัวอย่างด่วน (Quick Demo)
              </button>
            </div>

            {/* ข้อมูลพื้นฐาน */}
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-7 shadow-sm space-y-5">
              <h2 className="text-sm font-bold text-zinc-900 border-b border-zinc-100 pb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                1. ข้อมูลพื้นฐานร่างกาย (คำนวณ BMI / BMR)
              </h2>

              {/* เพศ */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-2">
                  เพศกำเนิด
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setGender("male")}
                    className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition ${
                      gender === "male"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm"
                        : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                    }`}
                  >
                    ชาย (Male)
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender("female")}
                    className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition ${
                      gender === "female"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm"
                        : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                    }`}
                  >
                    หญิง (Female)
                  </button>
                </div>
              </div>

              {/* วันเกิด, ส่วนสูง, น้ำหนัก */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    วันเกิด
                  </label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[11px] text-zinc-400 mt-1">อายุ: {age} ปี</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    ส่วนสูง (ซม.)
                  </label>
                  <input
                    type="number"
                    min="100"
                    max="250"
                    value={height}
                    onChange={(e) => setHeight(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    น้ำหนัก (กก.)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="30"
                    max="250"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Real-time BMI Indicator */}
              {bmi > 0 && (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-zinc-200/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-600 font-semibold">BMI ของคุณ:</span>
                    <span className="font-black text-sm text-zinc-900">{bmi}</span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${bmiStatus.bg} ${bmiStatus.color}`}>
                    {bmiStatus.text}
                  </span>
                </div>
              )}
            </div>

            {/* โรคประจำตัว & ยา */}
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-7 shadow-sm space-y-5">
              <h2 className="text-sm font-bold text-zinc-900 border-b border-zinc-100 pb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                2. โรคประจำตัวและการใช้ยา
              </h2>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-2">
                  โรคประจำตัว (เลือกได้มากกว่า 1 ข้อ)
                </label>
                <div className="flex flex-wrap gap-2">
                  {CHRONIC_DISEASES.map((item) => {
                    const isSelected = chronicDiseases.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleSelection(chronicDiseases, setChronicDiseases, item.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-medium border transition ${
                          isSelected
                            ? item.isRedFlag
                              ? "bg-rose-500 border-rose-600 text-white shadow-sm"
                              : "bg-emerald-500 border-emerald-600 text-white shadow-sm"
                            : "bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-2.5">
                  <label htmlFor={otherChronicId} className="sr-only">โรคประจำตัวอื่นๆ</label>
                  <input
                    id={otherChronicId}
                    type="text"
                    placeholder="ระบุโรคประจำตัวอื่นๆ เพิ่มเติม (ถ้ามี)"
                    value={otherChronic}
                    onChange={(e) => setOtherChronic(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white text-xs text-zinc-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* การผ่าตัด/อาการบาดเจ็บที่ผ่านมา */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-2">
                  การผ่าตัด หรืออาการบาดเจ็บสำคัญที่ผ่านมา
                </label>
                <div className="flex flex-wrap gap-2">
                  {PAST_INJURIES.map((item) => {
                    const isSelected = pastInjuries.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleSelection(pastInjuries, setPastInjuries, item.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-medium border transition ${
                          isSelected
                            ? "bg-teal-600 border-teal-700 text-white shadow-sm"
                            : "bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-2.5">
                  <label htmlFor={otherInjuryId} className="sr-only">อาการบาดเจ็บอื่นๆ</label>
                  <input
                    id={otherInjuryId}
                    type="text"
                    placeholder="ระบุประวัติผ่าตัด/บาดเจ็บอื่นๆ เพิ่มเติม (ถ้ามี)"
                    value={otherInjury}
                    onChange={(e) => setOtherInjury(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white text-xs text-zinc-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* ยาที่ทานประจำ */}
              <div>
                <label htmlFor={medicationId} className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  ยาที่รับประทานประจำ (เช่น ยาลดความดัน, Beta-blocker มีผลต่ออัตราการเต้นหัวใจ)
                </label>
                <input
                  id={medicationId}
                  type="text"
                  placeholder="ระบุชื่อยา หรือพิมพ์ว่า 'ไม่มี'"
                  value={regularMedications}
                  onChange={(e) => setRegularMedications(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white text-xs text-zinc-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* ตั้งครรภ์/ให้นมบุตร (กรณีเพศหญิง) */}
              {gender === "female" && (
                <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-xs flex items-center justify-between">
                  <span className="font-semibold text-purple-900">
                    ปัจจุบันท่านกำลังตั้งครรภ์ หรืออยู่ในช่วงให้นมบุตรหรือไม่?
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPregnantOrNursing(false)}
                      className={`px-3 py-1.5 rounded-lg font-bold ${
                        !isPregnantOrNursing ? "bg-purple-600 text-white" : "bg-white text-purple-700 border border-purple-200"
                      }`}
                    >
                      ไม่ใช่
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPregnantOrNursing(true)}
                      className={`px-3 py-1.5 rounded-lg font-bold ${
                        isPregnantOrNursing ? "bg-purple-600 text-white" : "bg-white text-purple-700 border border-purple-200"
                      }`}
                    >
                      ใช่
                    </button>
                  </div>
                </div>
              )}

              {/* ระดับกิจกรรมปัจจุบัน */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-2">
                  ระดับการออกกำลังกายในปัจจุบัน
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: "none", title: "ไม่ออกกำลังกายเลย", desc: "นั่งทำงานเป็นหลัก" },
                    { id: "occasional", title: "ออกบ้างเป็นครั้งคราว", desc: "สัปดาห์ละ 1-2 ครั้ง" },
                    { id: "regular", title: "ออกกำลังกายสม่ำเสมอ", desc: "สัปดาห์ละ 3 ครั้งขึ้นไป" },
                  ].map((act) => (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => setCurrentActivityLevel(act.id)}
                      className={`p-3 rounded-2xl border text-left transition ${
                        currentActivityLevel === act.id
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-zinc-200 bg-white hover:bg-zinc-50"
                      }`}
                    >
                      <div className="text-xs font-bold text-zinc-900">{act.title}</div>
                      <div className="text-[11px] text-zinc-500 mt-0.5">{act.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* คำถามคัดกรองความเสี่ยง PAR-Q (ธงแดง) */}
            <div className="bg-rose-50/70 border border-rose-200 rounded-3xl p-6 sm:p-7 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-rose-900">
                <svg className="w-5 h-5 text-rose-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h2 className="text-sm font-bold">
                  คำถามคัดกรองความปลอดภัย (PAR-Q Risk Screen)
                </h2>
              </div>
              <p className="text-xs text-rose-800 leading-relaxed">
                โปรดตอบตามความเป็นจริง หากตอบ &ldquo;ใช่&rdquo; ระบบจะจำกัดระดับความหนักไม่ให้เกินขีดอันตราย และแนะนำให้พบแพทย์ก่อนเริ่มโปรแกรม
              </p>

              <div className="space-y-3 pt-2">
                <div className="p-3 rounded-2xl bg-white border border-rose-200/80 flex items-center justify-between text-xs">
                  <span className="text-zinc-800 font-medium pr-2">
                    1. คุณเคยมีอาการแน่นหรือเจ็บหน้าอกขณะออกกำลังกายหรือไม่?
                  </span>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setParqChestPain(false)}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs ${
                        !parqChestPain ? "bg-emerald-500 text-white" : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      ไม่ใช่
                    </button>
                    <button
                      type="button"
                      onClick={() => setParqChestPain(true)}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs ${
                        parqChestPain ? "bg-rose-600 text-white" : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      ใช่
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-white border border-rose-200/80 flex items-center justify-between text-xs">
                  <span className="text-zinc-800 font-medium pr-2">
                    2. แพทย์เคยบอกว่าคุณมีปัญหาเกี่ยวกับหัวใจ และไม่ควรออกแรงหนักหรือไม่?
                  </span>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setParqDoctorWarning(false)}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs ${
                        !parqDoctorWarning ? "bg-emerald-500 text-white" : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      ไม่ใช่
                    </button>
                    <button
                      type="button"
                      onClick={() => setParqDoctorWarning(true)}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs ${
                        parqDoctorWarning ? "bg-rose-600 text-white" : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      ใช่
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-white border border-rose-200/80 flex items-center justify-between text-xs">
                  <span className="text-zinc-800 font-medium pr-2">
                    3. คุณเคยมีอาการหน้ามืด เสียการทรงตัว หรือหมดสติระหว่างออกแรงหรือไม่?
                  </span>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setParqDizziness(false)}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs ${
                        !parqDizziness ? "bg-emerald-500 text-white" : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      ไม่ใช่
                    </button>
                    <button
                      type="button"
                      onClick={() => setParqDizziness(true)}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs ${
                        parqDizziness ? "bg-rose-600 text-white" : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      ใช่
                    </button>
                  </div>
                </div>
              </div>

              {isRedFlag && (
                <div className="p-3 rounded-xl bg-rose-100 border border-rose-300 text-rose-950 text-xs font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping shrink-0" />
                  ระบบตรวจพบสัญญาณความเสี่ยง: จะจำกัดระดับการออกกำลังกายไว้ที่ระดับ &ldquo;เบา - ปานกลาง&rdquo; เท่านั้น
                </div>
              )}
            </div>

            {/* ปุ่มถัดไป */}
            <button
              type="button"
              onClick={() => {
                if (!numericHeight || !numericWeight) {
                  alert("กรุณากรอกส่วนสูงและน้ำหนัก");
                  return;
                }
                setStep(2);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-black text-sm shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 transition flex items-center justify-center gap-2"
            >
              ถัดไป: กำหนดเป้าหมาย & แผนออกกำลังกาย
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        )}

        {/* ========================================================
            STEP 2: แบบสอบถามแผนและเป้าหมายการออกกำลังกาย
           ======================================================== */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="text-center mb-6">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                ขั้นตอนที่ 2
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight mt-1">
                เป้าหมายและแผนการออกกำลังกาย
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-zinc-600 max-w-xl mx-auto">
                ปรับตารางฝึกให้เข้ากับสถานที่ อุปกรณ์จริง และข้อจำกัดทางร่างกายของคุณ
              </p>
            </div>

            <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-7 shadow-sm space-y-6">
              {/* เป้าหมายหลัก (เลือกได้มากกว่า 1 ข้อ) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-zinc-700">
                    เป้าหมายที่คุณต้องการมุ่งเน้น <span className="text-emerald-600 font-normal">(เลือกได้หลายอันตามที่ต้องการ)</span>
                  </label>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    เลือกแล้ว {fitnessGoals.length} ข้อ
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: "fat_loss", title: "ลดน้ำหนัก / ลดไขมัน", desc: "เน้นคุมแคลอรี่และเบิร์นไขมัน" },
                    { id: "muscle_gain", title: "เพิ่มมวลกล้ามเนื้อ", desc: "เน้นเวทเทรนนิ่งสร้างความกระชับ" },
                    { id: "endurance", title: "เพิ่มความฟิต / อึด", desc: "เพิ่มความทนทานระบบหัวใจและปอด" },
                    { id: "rehab", title: "ฟื้นฟูร่างกาย", desc: "กายภาพเบาๆ บรรเทาอาการเมื่อยล้า" },
                    { id: "general_health", title: "สุขภาพทั่วไป", desc: "เคลื่อนไหวร่างกายให้กระฉับกระเฉง" },
                  ].map((goal) => {
                    const isSelected = fitnessGoals.includes(goal.id);
                    return (
                      <button
                        key={goal.id}
                        type="button"
                        onClick={() => toggleFitnessGoal(goal.id)}
                        className={`p-3.5 rounded-2xl border text-left transition relative ${
                          isSelected
                            ? "border-emerald-500 bg-emerald-50/90 shadow-sm ring-1 ring-emerald-500"
                            : "border-zinc-200 bg-white hover:bg-zinc-50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-bold text-zinc-900">{goal.title}</div>
                          <div
                            className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black transition ${
                              isSelected
                                ? "bg-emerald-500 text-white"
                                : "border border-zinc-300 bg-zinc-50 text-transparent"
                            }`}
                          >
                            ✓
                          </div>
                        </div>
                        <div className="text-[11px] text-zinc-500 mt-1 leading-relaxed">{goal.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ระยะเวลาเป้าหมาย (Dropdown) */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  ระยะเวลาที่ตั้งเป้าหมายไว้
                </label>
                <select
                  value={targetDuration}
                  onChange={(e) => setTargetDuration(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white text-xs font-medium text-zinc-900 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="1_month">1 เดือน (เป้าหมายระยะสั้น / ปรับพฤติกรรม)</option>
                  <option value="3_months">3 เดือน (ระยะมาตรฐาน เห็นการเปลี่ยนแปลงชัดเจน)</option>
                  <option value="6_months">6 เดือน (ปรับเปลี่ยนรูปร่างอย่างยั่งยืน)</option>
                  <option value="1_year">มากกว่า 1 ปี (ไลฟ์สไตล์สุขภาพระยะยาว)</option>
                </select>
              </div>

              {/* ระดับความหนัก (พร้อมระบบ Safety Lock ถ้ามีธงแดง) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-zinc-700">
                    ระดับความหนักของการฝึก
                  </label>
                  {isRedFlag && (
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                      ล็อคระดับความหนักตามความปลอดภัย PAR-Q
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* เบา */}
                  <button
                    type="button"
                    onClick={() => setWorkoutIntensity("light")}
                    className={`p-3.5 rounded-2xl border text-left transition ${
                      workoutIntensity === "light"
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-zinc-200 bg-white hover:bg-zinc-50"
                    }`}
                  >
                    <div className="text-xs font-bold text-zinc-900">เบา (Light)</div>
                    <div className="text-[11px] text-zinc-500 mt-1">เดินเร็ว, ยืดเหยียด, บอดี้เวทเบาๆ ไม่หอบ</div>
                  </button>

                  {/* ปานกลาง */}
                  <button
                    type="button"
                    onClick={() => setWorkoutIntensity("moderate")}
                    className={`p-3.5 rounded-2xl border text-left transition ${
                      workoutIntensity === "moderate"
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-zinc-200 bg-white hover:bg-zinc-50"
                    }`}
                  >
                    <div className="text-xs font-bold text-zinc-900">ปานกลาง (Moderate)</div>
                    <div className="text-[11px] text-zinc-500 mt-1">คาร์ดิโอ + เวทเทรนนิ่งเบาๆ หายใจกระชั้นพอพูดคุยได้</div>
                  </button>

                  {/* จริงจัง (ถ้ามีธงแดง จะถูกล็อค) */}
                  <div
                    onClick={() => {
                      if (!isRedFlag) setWorkoutIntensity("intense");
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition relative ${
                      isRedFlag
                        ? "border-zinc-200 bg-zinc-100/70 opacity-60 cursor-not-allowed"
                        : workoutIntensity === "intense"
                        ? "border-emerald-500 bg-emerald-50 cursor-pointer"
                        : "border-zinc-200 bg-white hover:bg-zinc-50 cursor-pointer"
                    }`}
                  >
                    {isRedFlag && (
                      <span className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500 text-white">
                        ถูกล็อค
                      </span>
                    )}
                    <div className="text-xs font-bold text-zinc-900">จริงจัง (Intense)</div>
                    <div className="text-[11px] text-zinc-500 mt-1">
                      {isRedFlag
                        ? "ตรวจพบความเสี่ยงสุขภาพ ไม่อนุญาตให้เลือกแผนหนัก"
                        : "มี Progressive Overload เวทหนัก คาร์ดิโอโซนสูง"}
                    </div>
                  </div>
                </div>
              </div>

              {/* ความถี่และเวลา */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-2">
                    ความถี่ต่อสัปดาห์ (วัน)
                  </label>
                  <div className="flex gap-2">
                    {[2, 3, 4, 5, 6].map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => setWorkoutDays(days)}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition ${
                          workoutDays === days
                            ? "bg-emerald-500 border-emerald-600 text-white"
                            : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                        }`}
                      >
                        {days} วัน
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-zinc-700">
                      เวลาต่อครั้ง (นาที)
                    </label>
                    <span className="text-[11px] text-emerald-600 font-medium">
                      อย่างต่ำ 30 นาที
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {[30, 45, 60, 90].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setSessionMinutes(mins)}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition ${
                          sessionMinutes === mins
                            ? "bg-teal-600 border-teal-700 text-white"
                            : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                        }`}
                      >
                        {mins} นาที
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* สถานที่ออกกำลังกาย */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-2">
                  สถานที่ออกกำลังกายหลัก
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "home", label: "ที่บ้าน (Home)" },
                    { id: "gym", label: "ฟิตเนส (Gym)" },
                    { id: "outdoor", label: "กลางแจ้ง / สวนสาธารณะ" },
                  ].map((loc) => (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => setWorkoutLocation(loc.id)}
                      className={`py-3 px-3 rounded-2xl text-xs font-bold border transition ${
                        workoutLocation === loc.id
                          ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm"
                          : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                      }`}
                    >
                      {loc.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* อุปกรณ์ที่มี (Multi-select) */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-2">
                  อุปกรณ์ที่คุณมี (เลือกได้มากกว่า 1 ข้อ)
                </label>
                <div className="flex flex-wrap gap-2">
                  {EQUIPMENT_OPTIONS.map((eq) => {
                    const isSelected = selectedEquipment.includes(eq.id);
                    return (
                      <button
                        key={eq.id}
                        type="button"
                        onClick={() => toggleSelection(selectedEquipment, setSelectedEquipment, eq.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-medium border transition ${
                          isSelected
                            ? "bg-emerald-500 border-emerald-600 text-white shadow-sm"
                            : "bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                        }`}
                      >
                        {eq.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ข้อจำกัดร่างกาย / ท่าที่ทำไม่ได้ */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-2">
                  ข้อจำกัดร่างกาย หรือท่าที่ทำไม่ได้ (ระบบจะตัดท่าอันตรายออกให้)
                </label>
                <div className="flex flex-wrap gap-2">
                  {MOVEMENT_LIMITS.map((limit) => {
                    const isSelected = movementLimits.includes(limit.id);
                    return (
                      <button
                        key={limit.id}
                        type="button"
                        onClick={() => toggleSelection(movementLimits, setMovementLimits, limit.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-medium border transition ${
                          isSelected
                            ? "bg-amber-500 border-amber-600 text-white shadow-sm"
                            : "bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                        }`}
                      >
                        {limit.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ปุ่มนำทาง */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="py-4 px-6 rounded-2xl border border-zinc-300 bg-white text-zinc-700 font-semibold text-sm hover:bg-zinc-50 transition"
              >
                ย้อนกลับ
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep(3);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="flex-1 py-4 rounded-2xl bg-emerald-500 text-white font-black text-sm shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 transition flex items-center justify-center gap-2"
              >
                ถัดไป: พฤติกรรมการกินและโภชนาการ
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            STEP 3: พฤติกรรมการกินและโภชนาการ (Hard Filter อาหารที่แพ้)
           ======================================================== */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="text-center mb-6">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                ขั้นตอนที่ 3
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight mt-1">
                พฤติกรรมการกินและโภชนาการ
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-zinc-600 max-w-xl mx-auto">
                อาหารที่แพ้จะถูกกรองออก 100% (Hard Filter) ระบบจะไม่แนะนำเมนูที่มีส่วนผสมดังกล่าวเด็ดขาด
              </p>
            </div>

            <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-7 shadow-sm space-y-6">
              {/* รูปแบบการกิน */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-2">
                  รูปแบบการรับประทานอาหาร
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: "general", label: "ทานทุกอย่างทั่วไป" },
                    { id: "clean", label: "เน้นอาหารคลีน / โซเดียมต่ำ" },
                    { id: "vegetarian", label: "มังสวิรัติ (ไม่ทานเนื้อสัตว์)" },
                    { id: "vegan", label: "วีแกน (พืช 100%)" },
                    { id: "keto", label: "คีโตจีนิก (ไขมันสูง แป้งต่ำ)" },
                    { id: "halal", label: "ฮาลาล (Halal)" },
                  ].map((diet) => (
                    <button
                      key={diet.id}
                      type="button"
                      onClick={() => setDietType(diet.id)}
                      className={`py-3 px-3 rounded-2xl text-xs font-bold border transition ${
                        dietType === diet.id
                          ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm"
                          : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                      }`}
                    >
                      {diet.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* อาการแพ้อาหาร (Hard Filter 100%) */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
                <div className="flex items-center gap-2 text-amber-900 mb-2">
                  <svg className="w-4 h-4 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <label className="text-xs font-bold">
                    อาการแพ้อาหาร (Hard Filter: ห้ามแนะนำเด็ดขาด)
                  </label>
                </div>
                <p className="text-[11px] text-amber-800 mb-3">
                  ระบบจะตัดวัตถุดิบและเมนูอาหารที่มีสารก่อภูมิแพ้เหล่านี้ออก 100% ในทุกแผนอาหาร
                </p>

                <div className="flex flex-wrap gap-2">
                  {ALLERGY_OPTIONS.map((item) => {
                    const isSelected = foodAllergies.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleSelection(foodAllergies, setFoodAllergies, item.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
                          isSelected
                            ? "bg-rose-500 border-rose-600 text-white shadow-sm"
                            : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3">
                  <label htmlFor={otherAllergyId} className="sr-only">อาการแพ้อื่นๆ</label>
                  <input
                    id={otherAllergyId}
                    type="text"
                    placeholder="ระบุอาการแพ้อาหารอื่นๆ เพิ่มเติม (เช่น แพ้เห็ด, แพ้ผลไม้เปลือกแข็ง)"
                    value={otherAllergy}
                    onChange={(e) => setOtherAllergy(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white text-xs text-zinc-900 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* อาหารที่ไม่ทาน / ไม่ชอบ */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-2">
                  อาหารที่ไม่ชอบหรือไม่รับประทาน (เลือกได้หลายข้อ)
                </label>
                <div className="flex flex-wrap gap-2">
                  {DISLIKED_FOODS.map((item) => {
                    const isSelected = dislikedFoods.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleSelection(dislikedFoods, setDislikedFoods, item.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-medium border transition ${
                          isSelected
                            ? "bg-teal-600 border-teal-700 text-white shadow-sm"
                            : "bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-2.5">
                  <label htmlFor={otherDislikedId} className="sr-only">อาหารที่ไม่ชอบอื่นๆ</label>
                  <input
                    id={otherDislikedId}
                    type="text"
                    placeholder="ระบุอาหารที่ไม่ทานอื่นๆ เพิ่มเติม (ถ้ามี)"
                    value={otherDisliked}
                    onChange={(e) => setOtherDisliked(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white text-xs text-zinc-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* จำนวนมื้อที่สะดวกกินต่อวัน & งบประมาณ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-2">
                    จำนวนมื้อที่สะดวกรับประทานต่อวัน
                  </label>
                  <div className="flex gap-2">
                    {[2, 3, 4].map((meals) => (
                      <button
                        key={meals}
                        type="button"
                        onClick={() => setMealsPerDay(meals)}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition ${
                          mealsPerDay === meals
                            ? "bg-emerald-500 border-emerald-600 text-white"
                            : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                        }`}
                      >
                        {meals} มื้อ {meals === 2 ? "(IF / งานแน่น)" : ""}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-2">
                    งบประมาณอาหาร / สัปดาห์
                  </label>
                  <select
                    value={foodBudget}
                    onChange={(e) => setFoodBudget(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white text-xs font-medium text-zinc-900 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="economy">ประหยัด (ต่ำกว่า 1,500 บาท / สัปดาห์)</option>
                    <option value="moderate">ปานกลาง (1,500 - 3,000 บาท / สัปดาห์)</option>
                    <option value="flexible">ยืดหยุ่นสูง (&gt; 3,000 บาท / สัปดาห์)</option>
                  </select>
                </div>
              </div>

              {/* อาหารเสริมที่ใช้อยู่ */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-2">
                  อาหารเสริมที่ใช้อยู่ในปัจจุบัน
                </label>
                <div className="flex flex-wrap gap-2">
                  {SUPPLEMENTS.map((item) => {
                    const isSelected = supplements.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleSelection(supplements, setSupplements, item.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-medium border transition ${
                          isSelected
                            ? "bg-purple-600 border-purple-700 text-white shadow-sm"
                            : "bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ปุ่มนำทาง */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setStep(2);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="py-4 px-6 rounded-2xl border border-zinc-300 bg-white text-zinc-700 font-semibold text-sm hover:bg-zinc-50 transition"
              >
                ย้อนกลับ
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep(4);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="flex-1 py-4 rounded-2xl bg-emerald-500 text-white font-black text-sm shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 transition flex items-center justify-center gap-2"
              >
                ดูสรุปผลการวิเคราะห์และความปลอดภัย
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            STEP 4: สรุปผลการประเมิน & การแจ้งเตือนความปลอดภัย (Summary)
           ======================================================== */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 mx-auto flex items-center justify-center mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">
                สรุปผลการประเมินสุขภาพและความปลอดภัย
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-zinc-600 max-w-xl mx-auto">
                ระบบได้วิเคราะห์ข้อมูลของคุณและเตรียมตารางฝึกพร้อมแผนอาหารเฉพาะบุคคลเรียบร้อยแล้ว
              </p>
            </div>

            {/* การแจ้งเตือนธงแดง (Red Flag Alert) */}
            {isRedFlag && (
              <div className="p-4 sm:p-5 rounded-3xl bg-rose-50 border border-rose-200 text-rose-950 shadow-sm space-y-2">
                <div className="flex items-center gap-2 font-black text-sm text-rose-700">
                  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  ตรวจพบสัญญาณความเสี่ยงตามแบบคัดกรอง PAR-Q
                </div>
                <p className="text-xs leading-relaxed text-rose-900">
                  เนื่องจากคุณมีประวัติเกี่ยวกับหัวใจ แน่นหน้าอก หรืออาการวูบ ระบบได้ <strong className="underline">จำกัดระดับความหนักของการออกกำลังกายไว้ที่ระดับเบา-ปานกลาง</strong> เพื่อความปลอดภัยสูงสุดของคุณ และขอแนะนำอย่างยิ่งให้ปรึกษาแพทย์ก่อนเริ่มโปรแกรม
                </p>
              </div>
            )}

            {/* การ์ดสถิติตัวเลขสำคัญ */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-sm">
                <div className="text-[11px] font-semibold text-zinc-500">ค่า BMI</div>
                <div className="text-2xl font-black text-zinc-900 mt-1">{bmi}</div>
                <div className={`text-[10px] font-bold mt-1 px-2 py-0.5 rounded-full inline-block ${bmiStatus.bg} ${bmiStatus.color}`}>
                  {bmiStatus.text}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-sm">
                <div className="text-[11px] font-semibold text-zinc-500">BMR (เผาผลาญพื้นฐาน)</div>
                <div className="text-2xl font-black text-zinc-900 mt-1">{bmr}</div>
                <div className="text-[10px] text-zinc-500 mt-1">kcal / วัน</div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-sm">
                <div className="text-[11px] font-semibold text-zinc-500">TDEE (ใช้พลังงานจริง)</div>
                <div className="text-2xl font-black text-emerald-600 mt-1">{tdee}</div>
                <div className="text-[10px] text-zinc-500 mt-1">kcal / วัน</div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-sm text-emerald-950">
                <div className="text-[11px] font-semibold text-emerald-700">เป้าหมายพลังงานแนะนำ</div>
                <div className="text-2xl font-black text-emerald-600 mt-1">{targetCalories}</div>
                <div className="text-[10px] text-emerald-700 font-medium mt-1">kcal / วัน</div>
              </div>
            </div>

            {/* สรุปข้อกำหนดความปลอดภัยเฉพาะบุคคล */}
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm space-y-4 text-xs">
              <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                เงื่อนไขการปรับแต่งเฉพาะบุคคลของคุณ:
              </h3>

              <div className="space-y-2.5 leading-relaxed text-zinc-600">
                {/* อาหารที่แพ้ Hard filter */}
                <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-950">
                  <strong className="text-teal-800">การคัดกรองสารก่อภูมิแพ้ (Hard Filter 100%):</strong>{" "}
                  {foodAllergies.includes("none")
                    ? "ไม่มีประวัติแพ้อาหาร สามารถทานได้หลากหลายกลุ่มสารอาหาร"
                    : `ห้ามแนะนำเมนูที่มี ${foodAllergies
                        .map((id) => ALLERGY_OPTIONS.find((a) => a.id === id)?.label)
                        .filter(Boolean)
                        .join(", ")} ${otherAllergy ? `และ ${otherAllergy}` : ""} โดยเด็ดขาด`}
                </div>

                {/* ข้อจำกัดร่างกาย */}
                {movementLimits.some((x) => x !== "none") && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950">
                    <strong className="text-amber-800">การคัดกรองท่าฝึกตามข้อจำกัดร่างกาย:</strong>{" "}
                    ตัดท่าที่มีแรงกระแทกสูง หรือท่าที่ก้มงอเสี่ยงเจ็บซ้ำ โดยแทนที่ด้วยท่าปลอดภัยสำหรับ{" "}
                    {movementLimits
                      .map((id) => MOVEMENT_LIMITS.find((m) => m.id === id)?.label)
                      .filter(Boolean)
                      .join(", ")}
                  </div>
                )}

                {/* อุปกรณ์และสถานที่ */}
                <div className="p-3 rounded-xl bg-slate-50 border border-zinc-200 text-zinc-800">
                  <strong>แผนการฝึก:</strong> ออกกำลังกายที่{" "}
                  {workoutLocation === "home" ? "บ้าน" : workoutLocation === "gym" ? "ฟิตเนส" : "กลางแจ้ง"}{" "}
                  สัปดาห์ละ {workoutDays} วัน ครั้งละ {sessionMinutes} นาที โดยใช้อุปกรณ์:{" "}
                  {selectedEquipment
                    .map((id) => EQUIPMENT_OPTIONS.find((e) => e.id === id)?.label)
                    .filter(Boolean)
                    .join(", ")}
                </div>
              </div>
            </div>

            {/* Medical Disclaimer ท้ายแบบสอบถาม */}
            <div className="p-3 rounded-xl bg-zinc-100 text-zinc-600 text-[11px] leading-relaxed text-center">
              <strong>คำเตือนทางการแพทย์:</strong> FitMate เป็นเครื่องมือช่วยวางแผนและไม่ใช่คำแนะนำทางการแพทย์ หากมีอาการผิดปกติระหว่างออกกำลังกาย ให้หยุดทันทีและปรึกษาแพทย์
            </div>

            {/* ปุ่มนำทาง */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setStep(3);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="py-4 px-6 rounded-2xl border border-zinc-300 bg-white text-zinc-700 font-semibold text-sm hover:bg-zinc-50 transition"
              >
                แก้ไขข้อมูล
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleCompleteAssessment}
                className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-sm shadow-xl shadow-emerald-500/20 hover:from-emerald-600 hover:to-teal-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? "กำลังสร้างแดชบอร์ดเฉพาะบุคคล..." : "เข้าสู่ Dashboard แผนการฝึกและโภชนาการของคุณ"}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
