"use client";

import React, { useState, useEffect, useRef } from "react";

export interface ExerciseDemoProps {
  exerciseName: string;
  category?: string;
  safetyCue?: string;
  isCompactPiP?: boolean;
  isCompact?: boolean;
  onClose?: () => void;
  onToggleCompact?: () => void;
}

interface MotionConfig {
  title: string;
  categoryName: string;
  targetMuscles: string[];
  tempoText: string;
  breathingInhale: string;
  breathingExhale: string;
  safetyDos: string[];
  safetyDonts: string[];
  animType:
    | "squat"
    | "pushup"
    | "row"
    | "lunge"
    | "shoulder_press"
    | "lateral_raise"
    | "plank"
    | "glute_bridge"
    | "cardio";
}

// ฐานข้อมูลแอนิเมชันและคำแนะนำทางชีวกลศาสตร์ของแต่ละกลุ่มท่า
function getMotionConfig(name: string): MotionConfig {
  const lower = (name || "").toLowerCase();

  if (lower.includes("squat") || lower.includes("สควอท") || lower.includes("ลุกนั่ง") || lower.includes("goblet") || lower.includes("leg press")) {
    return {
      title: "Squat (สควอท)",
      categoryName: "ท่อนล่าง / ขาและสะโพก",
      targetMuscles: ["ต้นขาด้านหน้า (Quads)", "ก้น (Glutes)", "แกนกลางลำตัว"],
      tempoText: "ลงช้าๆ 2-3 วินาที • ดันตัวขึ้น 1 วินาที",
      breathingInhale: "หายใจเข้าลึกๆ ขณะย่อสะโพกลง",
      breathingExhale: "หายใจออกแรงดันส้นเท้าลุกขึ้นยืน",
      safetyDos: [
        "เปิดปลายเท้าเฉียงออก 15-30 องศาตามธรรมชาติ",
        "ทิ้งสะโพกไปข้างหลังเหมือนกำลังนั่งเก้าอี้",
        "ลงให้สะโพกขนานเข่าหรือลึกพอดีโดยหลังยังตรง",
        "ลงน้ำหนักเต็มฝ่าเท้า เน้นที่กึ่งกลางและส้นเท้า",
      ],
      safetyDonts: [
        "ห้ามเข่าบิดหุบเข้าหากัน (Knee Valgus)",
        "ห้ามส้นเท้าลอยขึ้นจากพื้น",
        "ห้ามก้มหลังค่อมจนช่วงอกพับลง",
      ],
      animType: "squat",
    };
  }

  if (
    lower.includes("push-up") ||
    lower.includes("pushup") ||
    lower.includes("วิดพื้น") ||
    lower.includes("chest press") ||
    lower.includes("ดันอก") ||
    lower.includes("bench press")
  ) {
    return {
      title: "Push-up / Chest Press (วิดพื้น / ดันอก)",
      categoryName: "ท่อนบน / อก ไหล่ หลังแขน",
      targetMuscles: ["กล้ามเนื้ออก (Pectoralis)", "หัวไหล่ด้านหน้า", "หลังแขน (Triceps)", "หน้าท้อง"],
      tempoText: "ผ่อนลง 2 วินาที • ดันขึ้นเต็มแรง 1 วินาที",
      breathingInhale: "หายใจเข้าช้าๆ ขณะลดลำตัวลง",
      breathingExhale: "หายใจออกพร้อมดันพื้นขึ้นเหยียดแขน",
      safetyDos: [
        "วางมือห่างกว่าหัวไหล่เล็กน้อย นิ้วมือกางออกมั่นคง",
        "กางข้อศอกทำมุม 45-60 องศากับลำตัว (รูปลูกศร ไม่กางเสมอไหล่)",
        "เกร็งหน้าท้องและก้นให้ลำตัวตรงเป็นแนวระนาบตั้งแต่หัวจรดส้นเท้า",
      ],
      safetyDonts: [
        "ห้ามกางศอก 90 องศาเสมอไหล่ (เสี่ยงหนีบเอ็นหัวไหล่บาดเจ็บ)",
        "ห้ามหลังแอ่นหรือสะโพกย้อยตกพื้น",
        "ห้ามทิ้งศีรษะห้อย มองพื้นเฉียงไปข้างหน้า 1 ฟุต",
      ],
      animType: "pushup",
    };
  }

  if (
    lower.includes("row") ||
    lower.includes("ดึง") ||
    lower.includes("lat") ||
    lower.includes("cobra") ||
    lower.includes("back") ||
    lower.includes("สะบัก") ||
    lower.includes("pull")
  ) {
    return {
      title: "Row & Lat Pull (ดึงหลังและสะบัก)",
      categoryName: "ท่อนบน / หลัง ปีก และบุคลิกภาพ",
      targetMuscles: ["ปีกหลัง (Lats)", "สะบักและหลังกลาง (Rhomboids)", "หน้าแขน (Biceps)"],
      tempoText: "ดึงเข้า 1 วินาที (บีบค้าง 1 วิ) • ผ่อนออก 2 วินาที",
      breathingInhale: "หายใจเข้าขณะผ่อนแขนกลับไปข้างหน้า",
      breathingExhale: "หายใจออกจังหวะดึงข้อศอกไปข้างหลังและบีบสะบัก",
      safetyDos: [
        "ดึงโดยโฟกัสที่ 'ข้อศอก' ให้คิดว่ากำลังศอกถอยหลังชิดลำตัว",
        "บีบกระดูกสะบักสองข้างเข้าหากันแน่นๆ ที่จุดสูงสุด",
        "รักษาแนวกระดูกสันหลังให้ตรง ไม่โก่งงอหลังส่วนล่าง",
      ],
      safetyDonts: [
        "ห้ามใช้แรงเหวี่ยงลำตัวช่วยกระชากน้ำหนัก",
        "ห้ามยักไหล่ขึ้นหาใบหูขณะดึง (ให้กดหัวไหล่ลงต่ำ)",
      ],
      animType: "row",
    };
  }

  if (
    lower.includes("shoulder") ||
    lower.includes("overhead") ||
    lower.includes("ไหล่") ||
    (lower.includes("press") && !lower.includes("bench") && !lower.includes("chest"))
  ) {
    return {
      title: "Overhead Shoulder Press (ดันไหล่เหนือศีรษะ)",
      categoryName: "ท่อนบน / ไหล่และแขน",
      targetMuscles: ["หัวไหล่รอบด้าน (Deltoids)", "หลังแขน (Triceps)", "แกนกลางลำตัว"],
      tempoText: "ดันขึ้น 1 วินาที • ผ่อนลงช้าๆ 2 วินาที",
      breathingInhale: "หายใจเข้าขณะลดดัมเบลลงมาระดับคางหรือใบหู",
      breathingExhale: "หายใจออกขณะดันแขนเหยียดขึ้นเหนือศีรษะ",
      safetyDos: [
        "เกร็งหน้าท้องและบีบก้นแน่นเพื่อป้องกันหลังแอ่น",
        "ดันดัมเบลขึ้นตรงให้แนวแขนอยู่ตรงกับใบหูที่จุดบนสุด",
        "หุบข้อศอกเฉียงไปข้างหน้าเล็กน้อยประมาณ 30 องศา (Scapular plane)",
      ],
      safetyDonts: [
        "ห้ามแอ่นหลังส่วนล่างเพื่อช่วยดันน้ำหนักขึ้น",
        "ห้ามล็อคข้อศอกจนตึงกระแทกที่จุดบนสุด",
      ],
      animType: "shoulder_press",
    };
  }

  if (lower.includes("lateral") || lower.includes("กางแขน") || lower.includes("arm circle") || lower.includes("raise")) {
    return {
      title: "Lateral Raise / Arm Circles (กางแขนสร้างหัวไหล่)",
      categoryName: "ท่อนบน / ไหล่ข้างและข้อต่อ",
      targetMuscles: ["หัวไหล่ด้านข้าง (Lateral Delts)", "สะบักบน"],
      tempoText: "กางขึ้น 1 วินาที • ค้างจังหวะบน • ผ่อนลง 2 วินาที",
      breathingInhale: "หายใจเข้าจังหวะลดแขนลงชิดข้างลำตัว",
      breathingExhale: "หายใจออกจังหวะกางแขนขึ้นระดับขนานพื้น",
      safetyDos: [
        "งอข้อศอกเล็กน้อยเสมอ ไม่เกร็งเหยียดแขนตึง 100%",
        "ยกแขนขึ้นถึงระดับความสูงขนานหัวไหล่",
        "คว่ำฝ่ามือลงหรือเอียงนิ้วก้อยสูงกว่านิ้วโป้งเล็กน้อย",
      ],
      safetyDonts: [
        "ห้ามยกแขนสูงเกินระดับไหล่จนบีบข้อต่อ",
        "ห้ามโยกเอวหรือกระตุกตัวเพื่อเหวี่ยงน้ำหนักขึ้น",
      ],
      animType: "lateral_raise",
    };
  }

  if (lower.includes("lunge") || lower.includes("ลันจ์") || lower.includes("split squat") || lower.includes("step")) {
    return {
      title: "Lunge / Split Squat (ก้าวขาย่อ)",
      categoryName: "ท่อนล่าง / ขา สะโพก และการทรงตัว",
      targetMuscles: ["ต้นขาด้านหน้า (Quads)", "ก้น (Glutes)", "แฮมสตริง (Hamstrings)"],
      tempoText: "ย่อลงช้าๆ 2 วินาที • ถีบตัวกลับ 1 วินาที",
      breathingInhale: "หายใจเข้าขณะย่อเข่าลงตรงๆ",
      breathingExhale: "หายใจออกจังหวะออกแรงดันตัวกลับขึ้นมา",
      safetyDos: [
        "ก้าวขาระยะพอดีให้หัวเข่าหน้าทำมุมประมาณ 90 องศา",
        "ทิ้งน้ำหนักลงตรงกลางลำตัว ลำตัวตั้งตรงอกผาย",
        "กดส้นเท้าหน้าติดพื้นแน่นเพื่อส่งแรงจากกล้ามเนื้อก้น",
      ],
      safetyDonts: [
        "ห้ามให้หัวเข่าหน้าพุ่งล้ำปลายเท้ามากเกินไป",
        "ห้ามให้เข่าหน้าส่ายหรือบิดเข้าด้านใน",
      ],
      animType: "lunge",
    };
  }

  if (
    lower.includes("glute") ||
    lower.includes("bridge") ||
    lower.includes("สะโพก") ||
    lower.includes("hip thrust")
  ) {
    return {
      title: "Glute Bridge (ยกสะโพกบริหารก้น)",
      categoryName: "ท่อนล่าง / ก้นและหลังส่วนล่าง",
      targetMuscles: ["กล้ามเนื้อก้น (Gluteus Maximus)", "หลังต้นขา (Hamstrings)", "แกนกลาง"],
      tempoText: "ยกขึ้น 1 วินาที (บีบค้าง 2 วิ) • ผ่อนลง 2 วินาที",
      breathingInhale: "หายใจเข้าขณะหย่อนสะโพกลงเกือบแตะพื้น",
      breathingExhale: "หายใจออกพร้อมบีบก้นยกสะโพกขึ้นสุด",
      safetyDos: [
        "วางส้นเท้าห่างจากสะโพกในระยะที่เอื้อมปลายนิ้วมือแตะถึง",
        "ดันน้ำหนักผ่านส้นเท้าขึ้นไป ไม่ใช้ปลายเท้าดัน",
        "บีบก้นแน่นที่จุดสูงสุดให้ลำตัวเป็นแนวตรงจากเข่าถึงหัวไหล่",
      ],
      safetyDonts: [
        "ห้ามแอ่นหลังส่วนล่างเกินแนวตรง (Hyper-extension)",
        "ห้ามให้หัวเข่ากางแบะออกหรือหุบชิดกันเกินไป",
      ],
      animType: "glute_bridge",
    };
  }

  if (
    lower.includes("plank") ||
    lower.includes("แพลงก์") ||
    lower.includes("แกนกลาง") ||
    lower.includes("core hold") ||
    lower.includes("crunch") ||
    lower.includes("sit-up") ||
    lower.includes("ซิทอัพ")
  ) {
    return {
      title: "Plank & Core Hold (แพลงก์เกร็งแกนกลาง)",
      categoryName: "แกนกลางลำตัว / หน้าท้องรอบด้าน",
      targetMuscles: ["กล้ามเนื้อหน้าท้องชั้นลึก (Transverse Abdominis)", "สะบัก", "หลังล่าง"],
      tempoText: "เกร็งค้างนิ่งสม่ำเสมอ หายใจเป็นจังหวะต่อเนื่อง",
      breathingInhale: "หายใจเข้าทางจมูกช้าๆ โดยรักษาแรงเกร็งหน้าท้อง",
      breathingExhale: "หายใจออกทางปากยาวๆ แขม่วสะดือเข้าหาแนวกระดูกสันหลัง",
      safetyDos: [
        "วางข้อศอกให้อยู่ตรงกับแนวหัวไหล่พอดี",
        "เกร็งหน้าท้อง ม้วนก้นกบเล็กน้อย (Posterior Pelvic Tilt)",
        "กดข้อศอกดันพื้นขึ้นเพื่อไม่ให้สะบักจม",
      ],
      safetyDonts: [
        "ห้ามกลั้นหายใจเด็ดขาด ให้หายใจเข้าออกสม่ำเสมอ",
        "ห้ามสะโพกย้อยตกพื้น (เสี่ยงปวดหลังล่างเฉียบพลัน)",
        "ห้ามโก่งก้นโด่งสูงเป็นรูปสามเหลี่ยม",
      ],
      animType: "plank",
    };
  }

  // Default: Cardio / Dynamic Movement
  return {
    title: name || "Cardio & Dynamic Motion (การเคลื่อนไหวต่อเนื่อง)",
    categoryName: "คาร์ดิโอ / เผาผลาญไขมันและความคล่องตัว",
    targetMuscles: ["หัวใจและปอด (Cardiovascular)", "กล้ามเนื้อขาทั้งหมด", "แกนกลาง"],
    tempoText: "จังหวะต่อเนื่องสม่ำเสมอ • คุมการลงเท้าให้นุ่มนวล",
    breathingInhale: "หายใจเข้าลึกทางจมูก 2 จังหวะก้าว",
    breathingExhale: "หายใจออกทางปาก 2 จังหวะก้าว",
    safetyDos: [
      "ลงน้ำหนักด้วยจมูกเท้าอย่างนุ่มนวลเพื่อลดแรงกระแทกข้อต่อ",
      "งอข้อเข่าเล็กน้อยเสมอเพื่อรองรับน้ำหนัก",
      "แกว่งแขนให้สอดคล้องกับจังหวะขา ลำตัวตั้งตรง",
    ],
    safetyDonts: [
      "ห้ามลงน้ำหนักกระแทกส้นเท้าเสียงดังลงพื้น",
      "ห้ามกลั้นหายใจขณะเคลื่อนไหวเร็ว",
    ],
    animType: "cardio",
  };
}

export default function ExerciseDemoView({
  exerciseName,
  safetyCue,
  isCompactPiP = false,
  isCompact = false,
  onClose,
  onToggleCompact,
}: ExerciseDemoProps) {
  const isPiP = isCompactPiP || isCompact;
  const config = getMotionConfig(exerciseName);

  const [animProgress, setAnimProgress] = useState(0); // 0 (start) to 1 (peak inflection)
  const [phase, setPhase] = useState<"eccentric" | "concentric">("eccentric");
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState<number>(1); // 1 or 0.5
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const duration = (config.animType === "plank" ? 4000 : 3000) / speed;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const cycle = (elapsed % duration) / duration; // 0 to 1
      // Smooth sinusoidal oscillation between 0 and 1
      const progress = (1 - Math.cos(cycle * 2 * Math.PI)) / 2;
      setAnimProgress(progress);
      setPhase(cycle < 0.5 ? "eccentric" : "concentric");
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, speed, config.animType]);

  const isEccentric = phase === "eccentric";
  const phaseLabel = isEccentric ? "จังหวะผ่อนน้ำหนัก (Eccentric)" : "จังหวะออกแรงส่งกำลัง (Concentric)";
  const breathGuidance = isEccentric ? config.breathingInhale : config.breathingExhale;

  // Render high-clarity biomechanical SVG stick figure animation without in-canvas text collision
  const renderAnimatedSvg = () => {
    const p = animProgress;

    switch (config.animType) {
      case "squat": {
        const stand = 1 - p; // 1 = standing tall, 0 = bottom squat
        const headY = 36 + (1 - stand) * 26;
        const shoulderY = headY + 18;
        const hipY = shoulderY + 42 + (1 - stand) * 26;
        const hipX = 100 - (1 - stand) * 12; // hip hinge backwards
        const kneeX_L = 84 - (1 - stand) * 6;
        const kneeX_R = 116 + (1 - stand) * 6;
        const kneeY = hipY + 26 + (1 - stand) * 6;
        const footY = 178;
        const quadGlow = 0.15 + (1 - stand) * 0.6;
        const gluteGlow = 0.1 + (1 - stand) * 0.55;

        return (
          <svg viewBox="0 0 200 200" className="w-full h-full">
            {/* Ground Line */}
            <line x1="30" y1={footY} x2="170" y2={footY} stroke="#3f3f46" strokeWidth="2.5" />
            <ellipse cx="100" cy={footY + 2} rx="36" ry="4" fill="#27272a" opacity="0.6" />

            {/* Muscle Glows */}
            <ellipse cx={kneeX_L - 2} cy={(kneeY + hipY) / 2} rx="8" ry="16" fill="#10b981" opacity={quadGlow} style={{ filter: "blur(6px)" }} />
            <ellipse cx={kneeX_R + 2} cy={(kneeY + hipY) / 2} rx="8" ry="16" fill="#10b981" opacity={quadGlow} style={{ filter: "blur(6px)" }} />
            <ellipse cx={hipX - 4} cy={hipY} rx="16" ry="12" fill="#f59e0b" opacity={gluteGlow} style={{ filter: "blur(7px)" }} />

            {/* Legs */}
            <line x1={hipX - 6} y1={hipY} x2={kneeX_L} y2={kneeY} stroke="#22d3ee" strokeWidth="6.5" strokeLinecap="round" />
            <line x1={kneeX_L} y1={kneeY} x2="80" y2={footY - 2} stroke="#22d3ee" strokeWidth="6" strokeLinecap="round" />
            <ellipse cx="78" cy={footY} rx="9" ry="3.5" fill="#22d3ee" opacity="0.8" />

            <line x1={hipX + 6} y1={hipY} x2={kneeX_R} y2={kneeY} stroke="#22d3ee" strokeWidth="6.5" strokeLinecap="round" />
            <line x1={kneeX_R} y1={kneeY} x2="120" y2={footY - 2} stroke="#22d3ee" strokeWidth="6" strokeLinecap="round" />
            <ellipse cx="122" cy={footY} rx="9" ry="3.5" fill="#22d3ee" opacity="0.8" />

            {/* Spine & Torso */}
            <line x1={hipX} y1={hipY} x2={100} y2={shoulderY} stroke="#e11d48" strokeWidth="7.5" strokeLinecap="round" />

            {/* Arms - Guard / Goblet pose */}
            <line x1="94" y1={shoulderY + 6} x2="82" y2={shoulderY + 24} stroke="#38bdf8" strokeWidth="5" strokeLinecap="round" />
            <line x1="82" y1={shoulderY + 24} x2="96" y2={shoulderY + 28} stroke="#38bdf8" strokeWidth="4.5" strokeLinecap="round" />
            <line x1="106" y1={shoulderY + 6} x2="118" y2={shoulderY + 24} stroke="#38bdf8" strokeWidth="5" strokeLinecap="round" />
            <line x1="118" y1={shoulderY + 24} x2="104" y2={shoulderY + 28} stroke="#38bdf8" strokeWidth="4.5" strokeLinecap="round" />

            {/* Joints */}
            <circle cx={kneeX_L} cy={kneeY} r="5" fill="#0f172a" stroke="#22d3ee" strokeWidth="2" />
            <circle cx={kneeX_R} cy={kneeY} r="5" fill="#0f172a" stroke="#22d3ee" strokeWidth="2" />
            <circle cx={hipX} cy={hipY} r="5.5" fill="#0f172a" stroke="#f59e0b" strokeWidth="2" />
            <circle cx="100" cy={shoulderY} r="5" fill="#0f172a" stroke="#e11d48" strokeWidth="2" />

            {/* Head */}
            <circle cx="100" cy={headY} r="14" fill="#0f172a" stroke="#38bdf8" strokeWidth="2.5" />
          </svg>
        );
      }

      case "pushup": {
        const chestY = 108 + p * 32;
        const headY = chestY - 14;
        const elbowX = 72 - p * 12;
        const elbowY = 126 - p * 6;
        const footY = 160;
        const chestGlow = 0.15 + p * 0.6;
        const tricepGlow = 0.1 + (1 - p) * 0.5;

        return (
          <svg viewBox="0 0 200 200" className="w-full h-full">
            {/* Ground Line */}
            <line x1="20" y1={footY + 5} x2="185" y2={footY + 5} stroke="#3f3f46" strokeWidth="2.5" />
            <ellipse cx="100" cy={footY + 8} rx="50" ry="4" fill="#27272a" opacity="0.5" />

            {/* Muscle Glows */}
            <ellipse cx="80" cy={chestY} rx="16" ry="10" fill="#10b981" opacity={chestGlow} style={{ filter: "blur(7px)" }} />
            <ellipse cx={elbowX} cy={elbowY} rx="8" ry="12" fill="#06b6d4" opacity={tricepGlow} style={{ filter: "blur(5px)" }} />

            {/* Rigid Body Line (Torso to Feet) */}
            <line x1="64" y1={chestY - 2} x2="168" y2={footY} stroke="#e11d48" strokeWidth="7.5" strokeLinecap="round" />

            {/* Arm */}
            <line x1="72" y1={chestY + 3} x2={elbowX} y2={elbowY} stroke="#06b6d4" strokeWidth="6" strokeLinecap="round" />
            <line x1={elbowX} y1={elbowY} x2="62" y2={footY - 2} stroke="#06b6d4" strokeWidth="5.5" strokeLinecap="round" />

            {/* Feet & Hand Anchors */}
            <ellipse cx="168" cy={footY} rx="8" ry="3.5" fill="#38bdf8" opacity="0.8" />
            <ellipse cx="62" cy={footY - 2} rx="7" ry="3" fill="#06b6d4" opacity="0.8" />

            {/* Joints */}
            <circle cx={elbowX} cy={elbowY} r="5" fill="#0f172a" stroke="#06b6d4" strokeWidth="2" />
            <circle cx="72" cy={chestY + 3} r="5" fill="#0f172a" stroke="#e11d48" strokeWidth="2" />

            {/* Head */}
            <circle cx="50" cy={headY} r="13" fill="#0f172a" stroke="#38bdf8" strokeWidth="2.5" />
          </svg>
        );
      }

      case "row": {
        const elbowX = 85 + p * 34;
        const elbowY = 114 - p * 16;
        const handX = 58 + p * 10;
        const handY = 124 - p * 22;
        const latGlow = 0.15 + p * 0.65;

        return (
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <line x1="30" y1="180" x2="170" y2="180" stroke="#3f3f46" strokeWidth="2.5" strokeDasharray="4 3" />

            {/* Lat / Back Muscle Glow */}
            <ellipse cx="102" cy="106" rx="18" ry="14" fill="#06b6d4" opacity={latGlow} style={{ filter: "blur(8px)" }} />

            {/* Legs / Lower body */}
            <line x1="112" y1="130" x2="108" y2="156" stroke="#64748b" strokeWidth="6" strokeLinecap="round" />
            <line x1="108" y1="156" x2="120" y2="180" stroke="#64748b" strokeWidth="5.5" strokeLinecap="round" />
            <ellipse cx="118" cy="180" rx="9" ry="3.5" fill="#64748b" opacity="0.7" />

            {/* Torso hinged */}
            <line x1="82" y1="74" x2="112" y2="130" stroke="#e11d48" strokeWidth="7.5" strokeLinecap="round" />

            {/* Arm & Weight */}
            <line x1="88" y1="88" x2={elbowX} y2={elbowY} stroke="#10b981" strokeWidth="6" strokeLinecap="round" />
            <line x1={elbowX} y1={elbowY} x2={handX} y2={handY} stroke="#10b981" strokeWidth="5.5" strokeLinecap="round" />

            {/* Dumbbell */}
            <rect x={handX - 7} y={handY - 7} width="14" height="14" rx="3" fill="#f59e0b" stroke="#fbbf24" strokeWidth="1.5" />

            {/* Joints */}
            <circle cx={elbowX} cy={elbowY} r="5" fill="#0f172a" stroke="#10b981" strokeWidth="2" />
            <circle cx="88" cy="88" r="5" fill="#0f172a" stroke="#e11d48" strokeWidth="2" />

            {/* Head */}
            <circle cx="74" cy="62" r="13" fill="#0f172a" stroke="#38bdf8" strokeWidth="2.5" />
          </svg>
        );
      }

      case "shoulder_press": {
        const handY = 112 - p * 58;
        const elbowY = 114 - p * 28;
        const deltGlow = 0.15 + p * 0.6;

        return (
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <line x1="40" y1="180" x2="160" y2="180" stroke="#3f3f46" strokeWidth="2.5" />
            <ellipse cx="100" cy="182" rx="30" ry="4" fill="#27272a" opacity="0.5" />

            {/* Deltoid Glows */}
            <ellipse cx="78" cy="92" rx="12" ry="10" fill="#10b981" opacity={deltGlow} style={{ filter: "blur(6px)" }} />
            <ellipse cx="122" cy="92" rx="12" ry="10" fill="#10b981" opacity={deltGlow} style={{ filter: "blur(6px)" }} />

            {/* Legs & Torso */}
            <line x1="94" y1="146" x2="88" y2="180" stroke="#64748b" strokeWidth="5.5" strokeLinecap="round" />
            <line x1="106" y1="146" x2="112" y2="180" stroke="#64748b" strokeWidth="5.5" strokeLinecap="round" />
            <line x1="100" y1="84" x2="100" y2="146" stroke="#e11d48" strokeWidth="7.5" strokeLinecap="round" />

            {/* Left Arm & Dumbbell */}
            <line x1="90" y1="92" x2="68" y2={elbowY} stroke="#10b981" strokeWidth="6" strokeLinecap="round" />
            <line x1="68" y1={elbowY} x2="66" y2={handY} stroke="#10b981" strokeWidth="5.5" strokeLinecap="round" />
            <rect x="54" y={handY - 6} width="24" height="10" rx="3" fill="#f59e0b" stroke="#fbbf24" strokeWidth="1.5" />

            {/* Right Arm & Dumbbell */}
            <line x1="110" y1="92" x2="132" y2={elbowY} stroke="#10b981" strokeWidth="6" strokeLinecap="round" />
            <line x1="132" y1={elbowY} x2="134" y2={handY} stroke="#10b981" strokeWidth="5.5" strokeLinecap="round" />
            <rect x="122" y={handY - 6} width="24" height="10" rx="3" fill="#f59e0b" stroke="#fbbf24" strokeWidth="1.5" />

            {/* Joints */}
            <circle cx="68" cy={elbowY} r="5" fill="#0f172a" stroke="#10b981" strokeWidth="2" />
            <circle cx="132" cy={elbowY} r="5" fill="#0f172a" stroke="#10b981" strokeWidth="2" />
            <circle cx="90" cy="92" r="5" fill="#0f172a" stroke="#e11d48" strokeWidth="2" />
            <circle cx="110" cy="92" r="5" fill="#0f172a" stroke="#e11d48" strokeWidth="2" />

            {/* Head */}
            <circle cx="100" cy="66" r="13" fill="#0f172a" stroke="#38bdf8" strokeWidth="2.5" />
          </svg>
        );
      }

      case "lateral_raise": {
        const armAngle = p * 80; // 0 deg (hanging) to 80 deg (parallel to shoulder)
        const rad = (armAngle * Math.PI) / 180;
        const handX_L = 90 - Math.sin(rad) * 45;
        const handY_L = 90 + Math.cos(rad) * 45;
        const handX_R = 110 + Math.sin(rad) * 45;
        const handY_R = 90 + Math.cos(rad) * 45;
        const deltGlow = 0.15 + p * 0.65;

        return (
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <line x1="40" y1="180" x2="160" y2="180" stroke="#3f3f46" strokeWidth="2.5" />
            <ellipse cx="100" cy="182" rx="30" ry="4" fill="#27272a" opacity="0.5" />

            {/* Side Delt Glow */}
            <ellipse cx="76" cy="90" rx="14" ry="10" fill="#06b6d4" opacity={deltGlow} style={{ filter: "blur(6px)" }} />
            <ellipse cx="124" cy="90" rx="14" ry="10" fill="#06b6d4" opacity={deltGlow} style={{ filter: "blur(6px)" }} />

            {/* Legs & Torso */}
            <line x1="95" y1="145" x2="88" y2="180" stroke="#64748b" strokeWidth="5.5" strokeLinecap="round" />
            <line x1="105" y1="145" x2="112" y2="180" stroke="#64748b" strokeWidth="5.5" strokeLinecap="round" />
            <line x1="100" y1="84" x2="100" y2="145" stroke="#e11d48" strokeWidth="7.5" strokeLinecap="round" />

            {/* Left Arm */}
            <line x1="90" y1="90" x2={handX_L} y2={handY_L} stroke="#10b981" strokeWidth="5.5" strokeLinecap="round" />
            <rect x={handX_L - 6} y={handY_L - 6} width="12" height="12" rx="3" fill="#f59e0b" stroke="#fbbf24" strokeWidth="1.5" />

            {/* Right Arm */}
            <line x1="110" y1="90" x2={handX_R} y2={handY_R} stroke="#10b981" strokeWidth="5.5" strokeLinecap="round" />
            <rect x={handX_R - 6} y={handY_R - 6} width="12" height="12" rx="3" fill="#f59e0b" stroke="#fbbf24" strokeWidth="1.5" />

            {/* Shoulder joints */}
            <circle cx="90" cy="90" r="5" fill="#0f172a" stroke="#e11d48" strokeWidth="2" />
            <circle cx="110" cy="90" r="5" fill="#0f172a" stroke="#e11d48" strokeWidth="2" />

            {/* Head */}
            <circle cx="100" cy="65" r="13" fill="#0f172a" stroke="#38bdf8" strokeWidth="2.5" />
          </svg>
        );
      }

      case "lunge": {
        const frontKneeY = 122 + p * 24;
        const backKneeY = 132 + p * 22;
        const hipY = 92 + p * 22;
        const footY = 172;
        const quadGlow = 0.15 + p * 0.55;

        return (
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <line x1="30" y1={footY} x2="175" y2={footY} stroke="#3f3f46" strokeWidth="2.5" />

            {/* Quad Glow on Front Leg */}
            <ellipse cx="88" cy={(frontKneeY + hipY) / 2} rx="8" ry="14" fill="#10b981" opacity={quadGlow} style={{ filter: "blur(6px)" }} />

            {/* Front Leg */}
            <line x1="94" y1={hipY} x2="86" y2={frontKneeY} stroke="#22d3ee" strokeWidth="6.5" strokeLinecap="round" />
            <line x1="86" y1={frontKneeY} x2="80" y2={footY} stroke="#22d3ee" strokeWidth="6" strokeLinecap="round" />
            <ellipse cx="78" cy={footY} rx="9" ry="3.5" fill="#22d3ee" opacity="0.8" />

            {/* Back Leg */}
            <line x1="106" y1={hipY} x2="122" y2={backKneeY} stroke="#64748b" strokeWidth="6.5" strokeLinecap="round" />
            <line x1="122" y1={backKneeY} x2="136" y2={footY} stroke="#64748b" strokeWidth="6" strokeLinecap="round" />
            <ellipse cx="138" cy={footY} rx="8" ry="3.5" fill="#64748b" opacity="0.7" />

            {/* Torso Upright */}
            <line x1="100" y1={hipY} x2="100" y2={hipY - 48} stroke="#e11d48" strokeWidth="7.5" strokeLinecap="round" />

            {/* Arms at sides */}
            <line x1="92" y1={hipY - 36} x2="82" y2={hipY - 15} stroke="#38bdf8" strokeWidth="5" strokeLinecap="round" />
            <line x1="108" y1={hipY - 36} x2="118" y2={hipY - 15} stroke="#38bdf8" strokeWidth="5" strokeLinecap="round" />

            {/* Joints */}
            <circle cx="86" cy={frontKneeY} r="5" fill="#0f172a" stroke="#22d3ee" strokeWidth="2" />
            <circle cx="122" cy={backKneeY} r="5" fill="#0f172a" stroke="#64748b" strokeWidth="2" />
            <circle cx="100" cy={hipY} r="5.5" fill="#0f172a" stroke="#f59e0b" strokeWidth="2" />

            {/* Head */}
            <circle cx="100" cy={hipY - 62} r="13" fill="#0f172a" stroke="#38bdf8" strokeWidth="2.5" />
          </svg>
        );
      }

      case "glute_bridge": {
        const hipY = 145 - p * 38;
        const kneeY = 142;
        const footY = 164;
        const gluteGlow = 0.15 + p * 0.65;

        return (
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <line x1="20" y1={footY + 4} x2="185" y2={footY + 4} stroke="#3f3f46" strokeWidth="2.5" />

            {/* Glute Glow */}
            <ellipse cx="100" cy={hipY + 4} rx="20" ry="12" fill="#f59e0b" opacity={gluteGlow} style={{ filter: "blur(8px)" }} />

            {/* Lower Leg / Feet */}
            <line x1="88" y1={hipY} x2="85" y2={kneeY} stroke="#22d3ee" strokeWidth="6.5" strokeLinecap="round" />
            <line x1="112" y1={hipY} x2="115" y2={kneeY} stroke="#22d3ee" strokeWidth="6.5" strokeLinecap="round" />
            <line x1="85" y1={kneeY} x2="82" y2={footY} stroke="#22d3ee" strokeWidth="6" strokeLinecap="round" />
            <line x1="115" y1={kneeY} x2="118" y2={footY} stroke="#22d3ee" strokeWidth="6" strokeLinecap="round" />
            <ellipse cx="80" cy={footY} rx="9" ry="3.5" fill="#22d3ee" opacity="0.8" />
            <ellipse cx="120" cy={footY} rx="9" ry="3.5" fill="#22d3ee" opacity="0.8" />

            {/* Upper Body (Head & Shoulders on Ground) */}
            <line x1="100" y1={hipY} x2="100" y2={footY - 4} stroke="#e11d48" strokeWidth="7.5" strokeLinecap="round" />
            <circle cx="85" cy={kneeY} r="5" fill="#0f172a" stroke="#22d3ee" strokeWidth="2" />
            <circle cx="115" cy={kneeY} r="5" fill="#0f172a" stroke="#22d3ee" strokeWidth="2" />
            <circle cx="100" cy={hipY} r="5.5" fill="#0f172a" stroke="#f59e0b" strokeWidth="2" />
            <circle cx="100" cy={footY + 12} r="12" fill="#0f172a" stroke="#38bdf8" strokeWidth="2.5" />
          </svg>
        );
      }

      case "plank": {
        const pulse = Math.sin(p * Math.PI * 4) * 1.2;
        const coreGlow = 0.35 + Math.abs(Math.sin(p * Math.PI * 2)) * 0.35;

        return (
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <line x1="20" y1={162} x2="185" y2={162} stroke="#3f3f46" strokeWidth="2.5" />
            <ellipse cx="100" cy={165} rx="60" ry="4" fill="#27272a" opacity="0.4" />

            {/* Core Tension Glow */}
            <ellipse cx="108" cy={128 + pulse} rx="26" ry="12" fill="#10b981" opacity={coreGlow} style={{ filter: "blur(8px)" }} />

            {/* Straight Spine Line from Head to Feet */}
            <line x1="62" y1={122 + pulse} x2="162" y2={158} stroke="#e11d48" strokeWidth="7.5" strokeLinecap="round" />

            {/* Forearms on Floor */}
            <line x1="65" y1={122 + pulse} x2="65" y2={160} stroke="#10b981" strokeWidth="6" strokeLinecap="round" />
            <line x1="42" y1={160} x2="78" y2={160} stroke="#10b981" strokeWidth="5" strokeLinecap="round" />
            <ellipse cx="162" cy="158" rx="8" ry="3.5" fill="#38bdf8" opacity="0.8" />

            {/* Joints */}
            <circle cx="65" cy={122 + pulse} r="5" fill="#0f172a" stroke="#e11d48" strokeWidth="2" />
            <circle cx="65" cy={160} r="4.5" fill="#0f172a" stroke="#10b981" strokeWidth="2" />

            {/* Head */}
            <circle cx="46" cy={110 + pulse} r="13" fill="#0f172a" stroke="#38bdf8" strokeWidth="2.5" />

            {/* Core Tension Indicator Bar */}
            <rect x="76" y="86" width="48" height="5" rx="2.5" fill="#1e293b" />
            <rect x="76" y="86" width={48 * (0.5 + coreGlow * 0.5)} height="5" rx="2.5" fill="#10b981" />
          </svg>
        );
      }

      default: {
        // Cardio / Dynamic Jumping or Running
        const bounce = Math.sin(p * Math.PI * 2) * 8;
        const armSwing = Math.sin(p * Math.PI * 2) * 16;
        const legSwing = Math.sin(p * Math.PI * 2) * 14;

        return (
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <line x1="30" y1={180} x2="170" y2={180} stroke="#3f3f46" strokeWidth="2.5" strokeDasharray="4 3" />
            <ellipse cx="100" cy={182} rx="28" ry="4" fill="#27272a" opacity="0.4" />

            {/* Heart / Cardio Glow */}
            <ellipse cx="100" cy={108 + bounce} rx="18" ry="18" fill="#ef4444" opacity="0.15" style={{ filter: "blur(10px)" }} />

            {/* Legs moving dynamically */}
            <line x1="97" y1={130 + bounce} x2={88 - legSwing} y2={158} stroke="#22d3ee" strokeWidth="6.5" strokeLinecap="round" />
            <ellipse cx={85 - legSwing} cy={161} rx="8" ry="3.5" fill="#22d3ee" opacity="0.8" />
            <line x1="103" y1={130 + bounce} x2={112 + legSwing} y2={158} stroke="#64748b" strokeWidth="6.5" strokeLinecap="round" />
            <ellipse cx={114 + legSwing} cy={161} rx="8" ry="3.5" fill="#64748b" opacity="0.7" />

            {/* Torso */}
            <line x1="100" y1={82 + bounce} x2="100" y2={130 + bounce} stroke="#e11d48" strokeWidth="7.5" strokeLinecap="round" />

            {/* Arms pumping */}
            <line x1="92" y1={94 + bounce} x2={74 + armSwing} y2={116 + bounce} stroke="#38bdf8" strokeWidth="5.5" strokeLinecap="round" />
            <line x1="108" y1={94 + bounce} x2={126 - armSwing} y2={116 + bounce} stroke="#38bdf8" strokeWidth="5.5" strokeLinecap="round" />

            {/* Head */}
            <circle cx="100" cy={64 + bounce} r="13" fill="#0f172a" stroke="#38bdf8" strokeWidth="2.5" />
          </svg>
        );
      }
    }
  };

  // Compact PiP Mode (Floating alongside Camera / Live HUD)
  if (isPiP) {
    return (
      <div className="bg-zinc-950/95 backdrop-blur-md border border-zinc-800 rounded-2xl p-3 text-white shadow-2xl w-full select-none">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-zinc-800/80">
          <div className="min-w-0">
            <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 block truncate">
              {config.categoryName}
            </span>
            <h4 className="text-xs font-bold text-white truncate">{config.title}</h4>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {onToggleCompact && (
              <button
                type="button"
                onClick={onToggleCompact}
                className="p-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition"
                title="ขยายขนาด"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>
            )}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition"
                title="ปิด"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* SVG Graphic */}
        <div className="relative aspect-square w-full bg-zinc-900/90 rounded-xl border border-zinc-800/70 overflow-hidden mb-2.5 flex items-center justify-center">
          {renderAnimatedSvg()}
          {/* Phase Badge */}
          <div className="absolute top-2 left-2 bg-zinc-950/90 px-2 py-0.5 rounded-lg text-[9px] font-semibold text-zinc-300 border border-zinc-700/60 shadow-xs">
            {phaseLabel}
          </div>
        </div>

        {/* Breathing Strip */}
        <div
          className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl border text-[10px] mb-2 transition-colors ${
            phase === "eccentric"
              ? "bg-sky-950/40 border-sky-500/30 text-sky-300"
              : "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
          }`}
        >
          <div className="flex items-center gap-1.5 truncate">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                phase === "eccentric" ? "bg-sky-400 animate-ping" : "bg-emerald-400 animate-ping"
              }`}
            />
            <span className="font-bold truncate">
              {phase === "eccentric" ? "หายใจเข้า (ผ่อน)" : "หายใจออก (ออกแรง)"}
            </span>
          </div>
          <span className="text-zinc-500 font-mono text-[9px] shrink-0">{speed === 0.5 ? "0.5x" : "1x"}</span>
        </div>

        {/* Focus Cue */}
        <div className="text-[10px] bg-zinc-900/70 p-2 rounded-xl border border-zinc-800/80">
          <div className="text-emerald-400 font-bold mb-0.5 text-[9px] uppercase tracking-wide">จุดโฟกัสสำคัญ</div>
          <p className="text-zinc-300 leading-tight line-clamp-2">{safetyCue || config.safetyDos[0]}</p>
        </div>
      </div>
    );
  }

  // Full Modal Mode
  return (
    <div className="bg-zinc-950/98 backdrop-blur-xl border border-zinc-800 rounded-3xl shadow-2xl p-5 sm:p-6 text-white max-w-2xl w-full mx-auto relative animate-in fade-in zoom-in-95 duration-200">
      {/* Header */}
      <div className="flex items-start justify-between pb-4 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 uppercase tracking-wide">
              {config.categoryName}
            </span>
            <span className="text-xs text-zinc-500">คู่มือฟอร์มและการหายใจ</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white">{config.title}</h3>
          <p className="text-xs text-zinc-400 mt-0.5">{config.tempoText}</p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition shrink-0 ml-3"
            title="ปิดหน้าต่าง"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Personalized Safety Cue Banner */}
      {safetyCue && (
        <div className="mt-4 p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-xs flex items-start gap-2.5">
          <svg className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-emerald-200">
            <strong className="font-bold text-white">คำแนะนำเฉพาะคุณ:</strong> {safetyCue}
          </div>
        </div>
      )}

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5">
        {/* Left Column: Animation & Muscle Groups */}
        <div className="flex flex-col gap-3">
          <div className="relative w-full aspect-square bg-zinc-900/90 rounded-2xl border border-zinc-800/80 overflow-hidden flex items-center justify-center">
            {renderAnimatedSvg()}

            {/* Phase Label */}
            <div className="absolute top-3 left-3 bg-zinc-950/85 backdrop-blur px-3 py-1 rounded-xl border border-zinc-700/60 text-[11px] font-semibold text-zinc-200 shadow-md">
              {phaseLabel}
            </div>

            {/* Controls */}
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-zinc-950/80 backdrop-blur p-1 rounded-xl border border-zinc-800">
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition"
              >
                {isPlaying ? "หยุด" : "เล่น"}
              </button>
              <button
                type="button"
                onClick={() => setSpeed(speed === 1 ? 0.5 : 1)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  speed === 0.5
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "bg-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                {speed === 0.5 ? "ช้า 0.5x" : "1x ปกติ"}
              </button>
            </div>
          </div>

          {/* Muscle Groups */}
          <div>
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide mb-1.5">
              กลุ่มกล้ามเนื้อที่ใช้งาน
            </div>
            <div className="flex flex-wrap gap-1.5">
              {config.targetMuscles.map((muscle, idx) => (
                <span
                  key={idx}
                  className="text-[11px] font-medium bg-zinc-800/80 text-zinc-300 border border-zinc-700/60 px-2.5 py-1 rounded-lg"
                >
                  {muscle}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Breathing cues & Safety Dos/Donts */}
        <div className="flex flex-col gap-3">
          {/* Breathing Card */}
          <div
            className={`p-4 rounded-2xl border transition-all duration-300 ${
              isEccentric ? "bg-sky-950/40 border-sky-500/40" : "bg-emerald-950/40 border-emerald-500/40"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className={`w-2 h-2 rounded-full animate-ping ${isEccentric ? "bg-sky-400" : "bg-emerald-400"}`} />
              <span
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  isEccentric ? "text-sky-300" : "text-emerald-300"
                }`}
              >
                {isEccentric ? "หายใจเข้า" : "หายใจออก"}
              </span>
            </div>
            <div className="text-sm font-bold text-white mb-1">{breathGuidance}</div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              {isEccentric
                ? "จังหวะย่อ / ผ่อน — สร้างแรงดันลมในช่องท้องเพื่อพยุงแนวกระดูกสันหลัง"
                : "จังหวะออกแรง — ส่งถ่ายแรงดันผ่านแกนกลางที่เกร็งแน่น ป้องกันอาการหน้ามืด"}
            </p>
          </div>

          {/* Proper Form (Dos) */}
          <div className="bg-zinc-900/60 border border-zinc-800/70 rounded-2xl p-3.5">
            <div className="flex items-center gap-1.5 mb-2.5">
              <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wide">ฟอร์มที่ถูกต้อง</span>
            </div>
            <ul className="space-y-1.5 text-[11px] text-zinc-300 leading-relaxed">
              {config.safetyDos.map((item, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-emerald-400 shrink-0 font-bold mt-0.5">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Caution (Donts) */}
          <div className="bg-rose-950/25 border border-rose-900/35 rounded-2xl p-3.5">
            <div className="flex items-center gap-1.5 mb-2.5">
              <svg className="w-3.5 h-3.5 text-rose-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wide">ข้อควรระวัง</span>
            </div>
            <ul className="space-y-1.5 text-[11px] text-rose-200/85 leading-relaxed">
              {config.safetyDonts.map((item, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-rose-400 shrink-0 font-bold mt-0.5">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
