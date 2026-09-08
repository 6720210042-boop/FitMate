"use client";

import { useState, useId } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// รายการตัวเลือกโรคประจำตัว / ข้อจำกัดทางร่างกาย
const HEALTH_CONDITIONS = [
  { id: "none", label: "ไม่มีโรคประจำตัว / ข้อจำกัด" },
  { id: "knee", label: "ปวดเข่า / ข้อต่อ (เลี่ยงแรงกระแทก)" },
  { id: "back", label: "ปวดหลัง / หมอนรองกระดูก" },
  { id: "hypertension", label: "ความดันโลหิตสูง" },
  { id: "diabetes", label: "เบาหวาน" },
  { id: "heart", label: "โรคหัวใจ / หลอดเลือด" },
  { id: "asthma", label: "หอบหืด / หายใจเหนื่อยง่าย" },
];

// รายการตัวเลือกการแพ้อาหาร
const FOOD_ALLERGIES = [
  { id: "none", label: "ไม่มีประวัติแพ้อาหาร" },
  { id: "seafood", label: "อาหารทะเล / กุ้ง ปู หอย" },
  { id: "peanuts", label: "ถั่วลิสง / ถั่วเปลือกแข็ง" },
  { id: "dairy", label: "นมวัว / แพ้น้ำตาลแลคโตส" },
  { id: "gluten", label: "แป้งสาลี / กลูเตน" },
  { id: "egg", label: "ไข่ไก่ / ผลิตภัณฑ์จากไข่" },
  { id: "vegetarian", label: "ทานมังสวิรัติ (ไม่ทานเนื้อสัตว์)" },
];

// ระดับกิจกรรม
const ACTIVITY_LEVELS = [
  {
    id: "sedentary",
    multiplier: 1.2,
    title: "ขยับตัวน้อย (Sedentary)",
    desc: "นั่งทำงานโต๊ะเป็นหลัก แทบไม่ได้ออกกำลังกาย",
  },
  {
    id: "light",
    multiplier: 1.375,
    title: "กิจกรรมเบา (Light Activity)",
    desc: "เดินหรือยืนทำงานบ่อย ออกกำลังกายเบาๆ 1-3 วัน/สัปดาห์",
  },
  {
    id: "moderate",
    multiplier: 1.55,
    title: "กิจกรรมปานกลาง (Moderate)",
    desc: "เคลื่อนไหวตัวบ่อย ออกกำลังกายปานกลาง 3-5 วัน/สัปดาห์",
  },
  {
    id: "active",
    multiplier: 1.725,
    title: "กิจกรรมหนัก (Active)",
    desc: "ใช้แรงงาน หรือออกกำลังกายหนัก 6-7 วัน/สัปดาห์",
  },
];

// เป้าหมาย
const FITNESS_GOALS = [
  {
    id: "fat_loss",
    title: "ลดไขมันและกระชับสัดส่วน",
    desc: "เน้นคุมพลังงานติดลบอย่างปลอดภัย เพื่อลดไขมันส่วนเกินอย่างยั่งยืน",
    calorieAdjustment: -400,
  },
  {
    id: "maintenance",
    title: "รักษาน้ำหนักและสุขภาพแข็งแรง",
    desc: "รับพลังงานสมดุลกับที่ใช้ เน้นความฟิตและสุขภาพโดยรวม",
    calorieAdjustment: 0,
  },
  {
    id: "muscle_gain",
    title: "เพิ่มมวลกล้ามเนื้อ",
    desc: "เน้นการฝึกเวทเทรนนิ่ง และพลังงานบวกเล็กน้อยเพื่อสร้างกล้ามเนื้อ",
    calorieAdjustment: 300,
  },
];

export default function AssessmentPage() {
  const router = useRouter();
  const otherConditionInputId = useId();
  const otherAllergyInputId = useId();

  // ข้อมูลแบบฟอร์ม
  const [gender, setGender] = useState<"male" | "female">("male");
  const [age, setAge] = useState<number | "">(25);
  const [height, setHeight] = useState<number | "">(170);
  const [weight, setWeight] = useState<number | "">(65);

  // โรคประจำตัว
  const [selectedConditions, setSelectedConditions] = useState<string[]>([
    "none",
  ]);
  const [otherCondition, setOtherCondition] = useState("");

  // การแพ้อาหาร
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([
    "none",
  ]);
  const [otherAllergy, setOtherAllergy] = useState("");

  // ไลฟ์สไตล์และเป้าหมาย
  const [activityLevel, setActivityLevel] = useState("light");
  const [fitnessGoal, setFitnessGoal] = useState("fat_loss");
  const [workoutDays, setWorkoutDays] = useState(3);

  // สถานะผลลัพธ์
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // คำนวณ BMI
  const numericHeight = Number(height) || 0;
  const numericWeight = Number(weight) || 0;
  const numericAge = Number(age) || 20;

  const heightInMeters = numericHeight > 0 ? numericHeight / 100 : 0;
  const bmi =
    heightInMeters > 0 && numericWeight > 0
      ? Number((numericWeight / (heightInMeters * heightInMeters)).toFixed(1))
      : 0;

  // การแปลผล BMI
  const getBmiCategory = (val: number) => {
    if (val <= 0) return { text: "รอการกรอกข้อมูล", color: "text-zinc-400", bg: "bg-zinc-100" };
    if (val < 18.5) return { text: "น้ำหนักน้อยกว่าเกณฑ์ (ผอม)", color: "text-amber-600", bg: "bg-amber-50" };
    if (val <= 22.9) return { text: "สมส่วน / สุขภาพดี", color: "text-emerald-600", bg: "bg-emerald-50" };
    if (val <= 24.9) return { text: "น้ำหนักเกินเกณฑ์เล็กน้อย", color: "text-yellow-700", bg: "bg-yellow-50" };
    return { text: "ภาวะน้ำหนักเกิน / เสี่ยงอ้วน", color: "text-rose-600", bg: "bg-rose-50" };
  };

  const bmiStatus = getBmiCategory(bmi);

  // คำนวณ BMR (Mifflin-St Jeor)
  const calculateBmr = () => {
    if (numericWeight <= 0 || numericHeight <= 0 || numericAge <= 0) return 0;
    if (gender === "male") {
      return Math.round(10 * numericWeight + 6.25 * numericHeight - 5 * numericAge + 5);
    } else {
      return Math.round(10 * numericWeight + 6.25 * numericHeight - 5 * numericAge - 161);
    }
  };

  const bmr = calculateBmr();
  const selectedActivityObj = ACTIVITY_LEVELS.find((a) => a.id === activityLevel) || ACTIVITY_LEVELS[1];
  const tdee = Math.round(bmr * selectedActivityObj.multiplier);
  const selectedGoalObj = FITNESS_GOALS.find((g) => g.id === fitnessGoal) || FITNESS_GOALS[0];
  const targetCalories = Math.max(1200, tdee + selectedGoalObj.calorieAdjustment);

  // จัดการการเลือกโรคประจำตัว
  const handleToggleCondition = (id: string) => {
    if (id === "none") {
      setSelectedConditions(["none"]);
      return;
    }
    const current = selectedConditions.filter((item) => item !== "none");
    if (current.includes(id)) {
      const next = current.filter((item) => item !== id);
      setSelectedConditions(next.length > 0 ? next : ["none"]);
    } else {
      setSelectedConditions([...current, id]);
    }
  };

  // จัดการการเลือกการแพ้อาหาร
  const handleToggleAllergy = (id: string) => {
    if (id === "none") {
      setSelectedAllergies(["none"]);
      return;
    }
    const current = selectedAllergies.filter((item) => item !== "none");
    if (current.includes(id)) {
      const next = current.filter((item) => item !== id);
      setSelectedAllergies(next.length > 0 ? next : ["none"]);
    } else {
      setSelectedAllergies([...current, id]);
    }
  };

  // บันทึกข้อมูล
  const handleSubmitAssessment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!numericAge || !numericHeight || !numericWeight) {
      alert("กรุณากรอกอายุ ส่วนสูง และน้ำหนักให้ครบถ้วน");
      return;
    }

    setIsSaving(true);

    const assessmentResult = {
      gender,
      age: numericAge,
      height: numericHeight,
      weight: numericWeight,
      bmi,
      bmr,
      tdee,
      targetCalories,
      conditions: selectedConditions,
      otherCondition,
      allergies: selectedAllergies,
      otherAllergy,
      activityLevel,
      fitnessGoal,
      workoutDays,
      createdAt: new Date().toISOString(),
    };

    if (typeof window !== "undefined") {
      localStorage.setItem("fitmate_assessment", JSON.stringify(assessmentResult));
    }

    setTimeout(() => {
      setIsSaving(false);
      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-zinc-900 selection:bg-emerald-500 selection:text-white pb-20 relative">
      {/* พื้นหลังแสง Gradient อ่อนๆ */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-100/60 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-10 w-80 h-80 bg-teal-100/50 rounded-full blur-3xl pointer-events-none" />

      {/* แถบนำทางด้านบน */}
      <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-zinc-900 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 font-black text-white text-base shadow-sm">
              FM
            </div>
            <span className="text-lg font-black tracking-tight">
              Fit<span className="text-emerald-600">Mate</span>
            </span>
          </Link>

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
      </header>

      {/* เนื้อหาหลัก */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-10">
        {/* หัวข้อ */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-semibold mb-3">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            แบบประเมินสุขภาพและวิถีชีวิตส่วนบุคคล
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">
            ประเมินร่างกายเพื่อแผนฝึกและโภชนาการที่ใช่
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-zinc-600 max-w-xl mx-auto">
            ข้อมูลของคุณจะถูกนำมาคำนวณอัตราการเผาผลาญ (BMR/TDEE) และคัดกรองท่าฝึกหรือประเภทอาหารที่ปลอดภัยเหมาะสมเฉพาะคุณ
          </p>
        </div>

        {/* ถ้าส่งแบบประเมินแล้ว แสดงหน้าสรุปผลวิเคราะห์ (Results Card) */}
        {isSubmitted ? (
          <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-8 animate-in fade-in zoom-in duration-300">
            <div className="text-center pb-6 border-b border-zinc-100">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 mx-auto flex items-center justify-center mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-zinc-900">
                ผลการวิเคราะห์สุขภาพและพลังงานของคุณ
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                ระบบได้บันทึกข้อมูลเรียบร้อยแล้ว พร้อมนำไปปรับตารางออกกำลังกายของคุณ
              </p>
            </div>

            {/* การ์ดสถิติตัวเลขสำคัญ (BMI, BMR, TDEE, Target Calories) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-4 rounded-2xl bg-slate-50 border border-zinc-200/80">
                <div className="text-[11px] font-semibold text-zinc-500">ค่า BMI</div>
                <div className="text-2xl font-black text-zinc-900 mt-1">{bmi}</div>
                <div className={`text-[10px] font-bold mt-1 px-2 py-0.5 rounded-full inline-block ${bmiStatus.bg} ${bmiStatus.color}`}>
                  {bmiStatus.text}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-zinc-200/80">
                <div className="text-[11px] font-semibold text-zinc-500">อัตราเผาผลาญพื้นฐาน (BMR)</div>
                <div className="text-2xl font-black text-zinc-900 mt-1">{bmr}</div>
                <div className="text-[10px] text-zinc-500 mt-1 font-medium">แคลอรี่ / วัน</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-zinc-200/80">
                <div className="text-[11px] font-semibold text-zinc-500">พลังงานที่ใช้จริง (TDEE)</div>
                <div className="text-2xl font-black text-emerald-600 mt-1">{tdee}</div>
                <div className="text-[10px] text-zinc-500 mt-1 font-medium">แคลอรี่ / วัน</div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950">
                <div className="text-[11px] font-semibold text-emerald-700">เป้าหมายพลังงานที่แนะนำ</div>
                <div className="text-2xl font-black text-emerald-600 mt-1">{targetCalories}</div>
                <div className="text-[10px] text-emerald-700 mt-1 font-medium">
                  {selectedGoalObj.calorieAdjustment < 0
                    ? `ลดลง ${Math.abs(selectedGoalObj.calorieAdjustment)} kcal`
                    : selectedGoalObj.calorieAdjustment > 0
                    ? `เพิ่ม ${selectedGoalObj.calorieAdjustment} kcal`
                    : "สมดุลพลังงาน"}
                </div>
              </div>
            </div>

            {/* ข้อควรระวังและการปรับตารางฝึกเฉพาะบุคคล */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                คำแนะนำและข้อควรระวังตามข้อมูลของคุณ
              </h3>

              <div className="space-y-2.5 text-xs text-zinc-600 leading-relaxed">
                {/* คำแนะนำเรื่องเข่า */}
                {selectedConditions.includes("knee") && (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2.5">
                    <span className="font-bold text-amber-700">คำแนะนำข้อต่อ:</span>
                    <span>เนื่องจากคุณมีอาการปวดเข่า ตารางฝึกจะลดท่าที่มีแรงกระแทกสูง (High-impact) เช่น การกระโดดเชือกหรือวิ่งสปรินต์ โดยแนะนำการเดินชัน ปั่นจักรยาน หรือว่ายน้ำแทน</span>
                  </div>
                )}

                {/* คำแนะนำเรื่องหลัง */}
                {selectedConditions.includes("back") && (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2.5">
                    <span className="font-bold text-amber-700">คำแนะนำกล้ามเนื้อหลัง:</span>
                    <span>ควรระมัดระวังท่าที่ก้มยกน้ำหนักหนัก เช่น Deadlift โดยแนะนำท่าเสริมความแข็งแรงแกนกลางลำตัว (Core Stability) เช่น Bird-Dog หรือ Plank อย่างถูกวิธี</span>
                  </div>
                )}

                {/* คำแนะนำเรื่องความดัน/หัวใจ */}
                {(selectedConditions.includes("hypertension") || selectedConditions.includes("heart")) && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-2.5">
                    <span className="font-bold text-rose-700">คำเตือนสุขภาพ:</span>
                    <span>ควรหลีกเลี่ยงการกลั้นหายใจขณะออกแรง (Valsalva Maneuver) และคุมอัตราการเต้นหัวใจให้อยู่ในโซนคาร์ดิโอเบา-ปานกลาง (Zone 2)</span>
                  </div>
                )}

                {/* คำแนะนำเรื่องอาหาร */}
                {selectedAllergies.length > 0 && !selectedAllergies.includes("none") && (
                  <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 flex items-start gap-2.5">
                    <span className="font-bold text-teal-700">การคัดกรองโภชนาการ:</span>
                    <span>
                      ระบบจะตัดเมนูที่มีส่วนผสมของ{" "}
                      {selectedAllergies
                        .map((id) => FOOD_ALLERGIES.find((f) => f.id === id)?.label)
                        .filter(Boolean)
                        .join(", ")}{" "}
                      ออกจากคำแนะนำสารอาหารหลัก และแนะนำโปรตีนทางเลือกที่ปลอดภัยให้แทน
                    </span>
                  </div>
                )}

                {selectedConditions.includes("none") && selectedAllergies.includes("none") && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                    ร่างกายของคุณไม่มีข้อจำกัดเป็นพิเศษ สามารถฝึกได้ทั้งรูปแบบเวทเทรนนิ่งเพื่อสร้างกล้ามเนื้อและคาร์ดิโอได้อย่างเต็มประสิทธิภาพ โดยเน้นความสม่ำเสมอ {workoutDays} วัน/สัปดาห์
                  </div>
                )}
              </div>
            </div>

            {/* ปุ่มดำเนินการต่อ */}
            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setIsSubmitted(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-zinc-300 bg-white text-zinc-700 font-semibold text-xs sm:text-sm hover:bg-zinc-50 transition"
              >
                แก้ไขข้อมูลแบบประเมิน
              </button>
              <button
                type="button"
                onClick={() => router.push("/")}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 hover:bg-emerald-600 transition"
              >
                เสร็จสิ้นและกลับสู่หน้าหลัก
              </button>
            </div>
          </div>
        ) : (
          /* ฟอร์มแบบสอบถาม */
          <form onSubmit={handleSubmitAssessment} className="space-y-6">
            {/* หมวดที่ 1: ข้อมูลกายภาพพื้นฐาน */}
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-7 shadow-sm">
              <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-zinc-100">
                <div className="w-7 h-7 rounded-lg bg-emerald-100/80 text-emerald-700 flex items-center justify-center text-xs font-black">
                  1
                </div>
                <h2 className="text-base font-bold text-zinc-900">
                  ข้อมูลกายภาพพื้นฐาน
                </h2>
              </div>

              {/* เพศ */}
              <div className="mb-5">
                <label className="block text-xs font-semibold text-zinc-700 mb-2">
                  เพศกำเนิด (จำเป็นต่อการคำนวณอัตราเผาผลาญ BMR)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setGender("male")}
                    className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-2 ${
                      gender === "male"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm"
                        : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    ชาย (Male)
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender("female")}
                    className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-2 ${
                      gender === "female"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm"
                        : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    หญิง (Female)
                  </button>
                </div>
              </div>

              {/* อายุ, ส่วนสูง, น้ำหนัก */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    อายุ (ปี)
                  </label>
                  <input
                    type="number"
                    min="12"
                    max="100"
                    value={age}
                    onChange={(e) => setAge(e.target.value === "" ? "" : Number(e.target.value))}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
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
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* แถบคำนวณ BMI อัตโนมัติ */}
              {bmi > 0 && (
                <div className="mt-4 p-3 rounded-2xl bg-slate-50 border border-zinc-200/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-zinc-600">BMI ปัจจุบันของคุณ:</span>
                    <span className="font-black text-sm text-zinc-900">{bmi}</span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${bmiStatus.bg} ${bmiStatus.color}`}>
                    {bmiStatus.text}
                  </span>
                </div>
              )}
            </div>

            {/* หมวดที่ 2: สุขภาพและข้อจำกัด (โรคประจำตัว + แพ้อาหาร) */}
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-7 shadow-sm">
              <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-zinc-100">
                <div className="w-7 h-7 rounded-lg bg-emerald-100/80 text-emerald-700 flex items-center justify-center text-xs font-black">
                  2
                </div>
                <div>
                  <h2 className="text-base font-bold text-zinc-900">
                    สุขภาพและข้อจำกัดทางกายภาพ
                  </h2>
                  <p className="text-xs text-zinc-500">
                    เลือกได้มากกว่า 1 ข้อ เพื่อให้ระบบปรับความปลอดภัยให้เหมาะสม
                  </p>
                </div>
              </div>

              {/* โรคประจำตัว / ข้อจำกัดการเคลื่อนไหว */}
              <div className="mb-6">
                <label className="block text-xs font-semibold text-zinc-700 mb-2">
                  โรคประจำตัว หรือ บริเวณที่เคยบาดเจ็บ
                </label>
                <div className="flex flex-wrap gap-2">
                  {HEALTH_CONDITIONS.map((cond) => {
                    const isSelected = selectedConditions.includes(cond.id);
                    return (
                      <button
                        key={cond.id}
                        type="button"
                        onClick={() => handleToggleCondition(cond.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-medium border transition ${
                          isSelected
                            ? "bg-emerald-500 border-emerald-600 text-white shadow-sm"
                            : "bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                        }`}
                      >
                        {cond.label}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-2.5">
                  <label htmlFor={otherConditionInputId} className="sr-only">
                    โรคประจำตัวอื่นๆ
                  </label>
                  <input
                    id={otherConditionInputId}
                    type="text"
                    placeholder="ระบุโรคประจำตัวอื่นๆ เพิ่มเติม (ถ้ามี)"
                    value={otherCondition}
                    onChange={(e) => setOtherCondition(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 bg-white text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* การแพ้อาหาร */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-2">
                  ประวัติการแพ้อาหาร หรือประเภทอาหารที่ไม่รับประทาน
                </label>
                <div className="flex flex-wrap gap-2">
                  {FOOD_ALLERGIES.map((allergy) => {
                    const isSelected = selectedAllergies.includes(allergy.id);
                    return (
                      <button
                        key={allergy.id}
                        type="button"
                        onClick={() => handleToggleAllergy(allergy.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-medium border transition ${
                          isSelected
                            ? "bg-teal-500 border-teal-600 text-white shadow-sm"
                            : "bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                        }`}
                      >
                        {allergy.label}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-2.5">
                  <label htmlFor={otherAllergyInputId} className="sr-only">
                    อาหารที่แพ้อื่นๆ
                  </label>
                  <input
                    id={otherAllergyInputId}
                    type="text"
                    placeholder="ระบุอาการแพ้อาหารอื่นๆ เพิ่มเติม (ถ้ามี)"
                    value={otherAllergy}
                    onChange={(e) => setOtherAllergy(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 bg-white text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* หมวดที่ 3: ไลฟ์สไตล์และเป้าหมาย */}
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-7 shadow-sm">
              <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-zinc-100">
                <div className="w-7 h-7 rounded-lg bg-emerald-100/80 text-emerald-700 flex items-center justify-center text-xs font-black">
                  3
                </div>
                <h2 className="text-base font-bold text-zinc-900">
                  กิจกรรมประจำวันและเป้าหมาย
                </h2>
              </div>

              {/* ระดับกิจกรรมประจำวัน */}
              <div className="mb-5">
                <label className="block text-xs font-semibold text-zinc-700 mb-2">
                  กิจกรรมในชีวิตประจำวันทั่วไป (เพื่อหาค่า TDEE)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {ACTIVITY_LEVELS.map((act) => {
                    const isSelected = activityLevel === act.id;
                    return (
                      <div
                        key={act.id}
                        onClick={() => setActivityLevel(act.id)}
                        className={`p-3 rounded-2xl border cursor-pointer transition ${
                          isSelected
                            ? "border-emerald-500 bg-emerald-50/70"
                            : "border-zinc-200 bg-zinc-50/50 hover:bg-zinc-100/60"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-zinc-900">
                            {act.title}
                          </span>
                          <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                            isSelected ? "border-emerald-500 bg-emerald-500" : "border-zinc-300"
                          }`}>
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                          {act.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* เป้าหมายหลัก */}
              <div className="mb-5">
                <label className="block text-xs font-semibold text-zinc-700 mb-2">
                  เป้าหมายที่คุณต้องการมุ่งเน้นในตอนนี้
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {FITNESS_GOALS.map((goal) => {
                    const isSelected = fitnessGoal === goal.id;
                    return (
                      <div
                        key={goal.id}
                        onClick={() => setFitnessGoal(goal.id)}
                        className={`p-3 rounded-2xl border cursor-pointer transition ${
                          isSelected
                            ? "border-emerald-500 bg-emerald-50/70"
                            : "border-zinc-200 bg-zinc-50/50 hover:bg-zinc-100/60"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-zinc-900">
                            {goal.title}
                          </span>
                          <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                            isSelected ? "border-emerald-500 bg-emerald-500" : "border-zinc-300"
                          }`}>
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                          {goal.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* จำนวนวันที่สะดวกออกกำลังกาย */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-2">
                  จำนวนวันที่สะดวกออกกำลังกายต่อสัปดาห์
                </label>
                <div className="flex gap-2">
                  {[2, 3, 4, 5, 6].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setWorkoutDays(days)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition ${
                        workoutDays === days
                          ? "bg-emerald-500 border-emerald-600 text-white shadow-sm"
                          : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                      }`}
                    >
                      {days} วัน
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ปุ่มส่งแบบฟอร์ม */}
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-sm shadow-xl shadow-emerald-500/20 hover:from-emerald-600 hover:to-teal-700 transition active:scale-[0.99] disabled:opacity-50"
            >
              {isSaving ? "กำลังวิเคราะห์และบันทึกข้อมูล..." : "วิเคราะห์สุขภาพและคำนวณแผนของฉัน"}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
