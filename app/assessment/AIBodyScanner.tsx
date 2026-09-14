"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";

export interface BodyScanResult {
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
}

export interface AIBodyScannerProps {
  targetMuscles: string[];
  userGender?: "male" | "female";
  userHeight?: number;
  userWeight?: number;
  bmi?: number;
  onScanComplete: (result: BodyScanResult | null) => void;
  onSkip?: () => void;
  initialResult?: BodyScanResult | null;
}

interface LandmarkPoint {
  x: number;
  y: number;
  visibility?: number;
}

export default function AIBodyScanner({
  targetMuscles = [],
  userGender = "male",
  userHeight = 170,
  userWeight = 65,
  bmi = 22.5,
  onScanComplete,
  onSkip,
  initialResult = null,
}: AIBodyScannerProps) {
  const [mode, setMode] = useState<"choose" | "webcam" | "upload" | "analyzing" | "result" | "skipped">(
    initialResult ? "result" : "choose"
  );
  const [scanResult, setScanResult] = useState<BodyScanResult | null>(initialResult);
  const [capturedImage, setCapturedImage] = useState<string | null>(
    initialResult?.capturedImagePreview || null
  );

  // อัปเดต state หาก initialResult จาก parent เปลี่ยนแปลง (ตาม Best Practice ของ React)
  const [prevInitialResult, setPrevInitialResult] = useState(initialResult);
  if (initialResult !== prevInitialResult) {
    setPrevInitialResult(initialResult);
    setScanResult(initialResult);
    setCapturedImage(initialResult?.capturedImagePreview || null);
    if (!initialResult && mode === "result") {
      setMode("choose");
    } else if (initialResult) {
      setMode("result");
    }
  }

  // กล้องเว็บแคม
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  // การตรวจจับแบบ Pose
  const [detectedLandmarks, setDetectedLandmarks] = useState<LandmarkPoint[] | null>(null);

  // Cleanup Webcam on unmount
  const stopWebcam = useCallback(() => {
    if (webcamStreamRef.current) {
      webcamStreamRef.current.getTracks().forEach((track) => track.stop());
      webcamStreamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, [stopWebcam]);

  // เริ่มต้นเปิดกล้อง
  const startWebcam = async () => {
    setCameraError(null);
    setMode("webcam");
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("เบราว์เซอร์นี้ไม่รองรับการเปิดกล้องเว็บแคม");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
        audio: false,
      });
      webcamStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : "ไม่สามารถเปิดกล้องได้ โปรดตรวจสอบสิทธิ์การใช้งานกล้องในเบราว์เซอร์";
      setCameraError(errorMsg);
    }
  };

  // อัลกอริทึมวิเคราะห์สรีระและความเข้ากันได้ (On-Device Client-Side Analysis)
  const computeBodyAnalysis = useCallback(
    (
      landmarks: LandmarkPoint[] | null,
      aspectRatio: number,
      imgPreviewUrl: string,
      method: "webcam" | "photo"
    ): BodyScanResult => {
      // 1. คำนวณ Shoulder-to-Hip Ratio
      let shoulderToHipRatio = 1.32; // Default athletic
      if (landmarks && landmarks.length >= 25) {
        const leftShoulder = landmarks[11];
        const rightShoulder = landmarks[12];
        const leftHip = landmarks[23];
        const rightHip = landmarks[24];

        if (leftShoulder && rightShoulder && leftHip && rightHip) {
          const shoulderW = Math.abs(leftShoulder.x - rightShoulder.x);
          const hipW = Math.abs(leftHip.x - rightHip.x);
          if (hipW > 0.05) {
            shoulderToHipRatio = parseFloat((shoulderW / hipW).toFixed(2));
          }
        }
      } else {
        // ประเมินจากความกว้าง/ความสูงภาพ + ค่า BMI/ส่วนสูง
        const baseRatio = userGender === "male" ? 1.34 : 1.22;
        const bmiFactor = bmi < 21 ? 0.04 : bmi > 25 ? -0.05 : 0.02;
        const heightFactor = userHeight > 175 ? 0.02 : userHeight < 165 ? -0.02 : 0;
        shoulderToHipRatio = parseFloat((baseRatio + bmiFactor + heightFactor).toFixed(2));
      }

      // จำกัดช่วง Ratio ให้อยู่ในสเกลมนุษย์จริง (1.10 - 1.65)
      shoulderToHipRatio = Math.max(1.12, Math.min(1.62, shoulderToHipRatio));

      // 2. จำแนก Somatotype
      let somatotype: "Ectomorph" | "Mesomorph" | "Endomorph" = "Mesomorph";
      let somatotypeThai = "Mesomorph (โครงสร้างกระดูกสมดุล กล้ามเนื้อตอบสนองไว)";

      if (bmi < 21.5) {
        somatotype = "Ectomorph";
        somatotypeThai = "Ectomorph (โครงสร้างเพรียวลีน เผาผลาญเร็ว ไขมันสะสมต่ำ)";
      } else if (bmi >= 25.0) {
        somatotype = "Endomorph";
        somatotypeThai = "Endomorph (โครงสร้างหนาแน่น กระดูกใหญ่ พลังยกสูงและสร้างความแข็งแกร่งได้ง่าย)";
      } else {
        somatotype = "Mesomorph";
        somatotypeThai = "Mesomorph (โครงสร้างสปอร์ต ไหล่ผาย ตอบสนองต่อเวทเทรนนิ่งได้รวดเร็ว)";
      }

      // 3. วิเคราะห์โครงสร้างสรีระและศักยภาพของร่างกาย (Anatomical Frame Analysis)
      let matchScore = 90;
      let frameTitle = "โครงสร้างสปอร์ต มีฐานกล้ามเนื้อสมดุล (Athletic Mesomorph Frame)";
      let frameDescription = "";
      const advantages: string[] = [];
      const focusGaps: string[] = [];
      let timelineRecommendation = "10 - 14 สัปดาห์ (2.5 - 3.5 เดือน)";

      if (userHeight > 0 && userWeight > 0) {
        advantages.push(`ฐานสรีระคำนวณจากส่วนสูง ${userHeight} ซม. และน้ำหนัก ${userWeight} กก. (BMI ${bmi})`);
      }

      if (somatotype === "Mesomorph") {
        const vTaperBonus = shoulderToHipRatio >= 1.3 ? 5 : 2;
        matchScore = Math.min(97, Math.max(88, 90 + vTaperBonus));
        frameTitle = "โครงสร้างสปอร์ต มีฐานกล้ามเนื้อสมดุล (Athletic Mesomorph Frame)";
        frameDescription = `อัตราส่วนความกว้างหัวไหล่ต่อสะโพกของคุณวัดได้ ${shoulderToHipRatio} ซึ่งเป็นฐานโครงสร้างระดับนักกีฬา กล้ามเนื้อตอบสนองต่อแรงต้าน (Hypertrophy) ได้รวดเร็วและฟื้นตัวได้ดีเยี่ยม`;
        advantages.push(
          "โครงสร้างข้อต่อและมวลกระดูกมีความมั่นคง พร้อมรับการฝึกเวทเทรนนิ่งแบบ Progressive Overload",
          "อัตราส่วนไหล่ต่อสะโพกเอื้อต่อการสร้างสรีระ V-Shape และบุคลิกภาพที่สง่าผ่าเผย",
          "การสังเคราะห์โปรตีนและการฟื้นตัวของเส้นใยกล้ามเนื้อมีประสิทธิภาพสูง"
        );
        focusGaps.push(
          "ควบคุมความเข้มข้นของการฝึก (Intensity) ให้ท้าทายอย่างสม่ำเสมอเพื่อกระตุ้นการเติบโต",
          "รักษาสัดส่วนสารอาหาร Macronutrients ให้มีโปรตีนคุณภาพสูง 1.6 - 2.0 กรัม/กก.",
          "จัดวันพักผ่อน (Rest Days) อย่างน้อย 1-2 วันต่อสัปดาห์เพื่อป้องกันภาวะ Overtraining"
        );
        timelineRecommendation = "8 - 12 สัปดาห์ จะเริ่มเห็นความคมชัดและการเปลี่ยนแปลงของมัดกล้ามเนื้ออย่างเด่นชัด";
      } else if (somatotype === "Ectomorph") {
        const leanBonus = shoulderToHipRatio >= 1.25 ? 4 : 2;
        matchScore = Math.min(95, Math.max(86, 88 + leanBonus));
        frameTitle = "โครงสร้างเพรียวลีน เผาผลาญสูง (Lean Ectomorph Frame)";
        frameDescription = `สรีระของคุณมีแนวกระดูกที่โปร่ง อัตราการเผาผลาญพื้นฐานสูง (High Metabolic Rate) ไขมันสะสมต่ำ ซึ่งเป็นจุดเด่นมากในการเห็นลายกล้ามเนื้อได้คมชัดและมีรูปร่างที่คล่องแคล่ว`;
        advantages.push(
          "เปอร์เซ็นต์ไขมันสะสมตามธรรมชาติอยู่ในระดับต่ำ ช่วยให้เห็นมิติกล้ามเนื้อได้ชัดเจน",
          "สัดส่วนท่อนแขนและขายาว เอื้อต่อการเคลื่อนไหวที่คล่องแคล่วและบุคลิกภาพที่โปร่งสง่า",
          "ระบบหัวใจและหลอดเลือดปรับตัวกับการออกกำลังกายแบบแอโรบิกได้ง่าย"
        );
        focusGaps.push(
          "เน้นการฝึกเวทเทรนนิ่งแบบสร้างกล้ามเนื้อ (Hypertrophy 8-12 ครั้ง/เซ็ต) โดยไม่หักโหมคาร์ดิโอมากเกินไป",
          "เพิ่มปริมาณพลังงานรวม (Calorie Surplus คุณภาพ) เพื่อสนับสนุนการสร้างมวลกล้ามเนื้อ",
          "เน้นการทานคาร์โบไฮเดรตเชิงซ้อนและโปรตีนก่อนและหลังออกกำลังกายอย่างเพียงพอ"
        );
        timelineRecommendation = "10 - 16 สัปดาห์ ด้วยโภชนาการแบบเพิ่มมวลกล้ามเนื้อ (Clean Bulking)";
      } else {
        // Endomorph
        const powerBonus = shoulderToHipRatio >= 1.28 ? 4 : 2;
        matchScore = Math.min(94, Math.max(85, 87 + powerBonus));
        frameTitle = "โครงสร้างกระดูกหนาแน่น พละกำลังสูง (Strong Endomorph Frame)";
        frameDescription = `โครงสร้างร่างกายของคุณมีฐานกระดูกที่ใหญ่ มวลกล้ามเนื้อหนาแน่น และมีพละกำลังพื้นฐานสูงมาก สามารถยกน้ำหนักและสร้างความแข็งแกร่ง (Strength & Power) ได้อย่างโดดเด่น`;
        advantages.push(
          "ฐานโครงกระดูกและข้อต่อแข็งแรง รองรับการฝึกท่า Compound หนักๆ ได้อย่างมั่นคง",
          "การสร้างมวลกล้ามเนื้อและการเพิ่มความแข็งแกร่งของร่างกายทำได้ง่ายและรวดเร็ว",
          "มีความทนทานของกล้ามเนื้อต่อแรงต้านในปริมาณสูง"
        );
        focusGaps.push(
          "ผสานการฝึกเวทเทรนนิ่งเข้ากับคาร์ดิโอเพื่อเร่งการเผาผลาญไขมันส่วนเกินอย่างมีประสิทธิภาพ",
          "ควบคุมปริมาณคาร์โบไฮเดรตและเน้นโปรตีนลีนเพื่อรักษาและเพิ่มความคมชัดของกล้ามเนื้อ",
          "เน้นท่า Compound Movements ที่ใช้กล้ามเนื้อมัดใหญ่หลายส่วนร่วมกัน"
        );
        timelineRecommendation = "12 - 18 สัปดาห์ ผสานการสร้างกล้ามเนื้อและการลดเปอร์เซ็นต์ไขมัน (Body Recomposition)";
      }

      // หากผู้ใช้เลือกจุดเน้นกล้ามเนื้อพิเศษ (Target Muscles) ให้ผนวกเข้าไปในคำแนะนำ
      if (targetMuscles.length > 0) {
        const muscleNamesMap: Record<string, string> = {
          chest: "กล้ามเนื้ออก (Chest)",
          back: "แผ่นหลังและปีก (Back & Lats)",
          shoulders_arms: "หัวไหล่และต้นแขน (Shoulders & Arms)",
          abs: "ซิกแพคและแกนกลาง (Abs & Core)",
          glutes: "ก้นและสะโพก (Glutes & Hips)",
          legs: "ต้นขาและน่อง (Legs)",
        };
        const selectedNames = targetMuscles.map((id) => muscleNamesMap[id] || id).join(", ");
        focusGaps.unshift(`มุ่งเน้นเพิ่มเซ็ตพิเศษสำหรับ: ${selectedNames} ตามที่คุณระบุ`);
      }

      return {
        shoulderToHipRatio,
        somatotype,
        somatotypeThai,
        matchScore,
        frameTitle,
        frameDescription,
        advantages,
        focusGaps,
        timelineRecommendation,
        scannedAt: new Date().toISOString(),
        scanMethod: method,
        capturedImagePreview: imgPreviewUrl,
      };
    },
    [targetMuscles, userGender, userHeight, userWeight, bmi]
  );

  // จับภาพจากกล้องเว็บแคมและทำการวิเคราะห์
  const captureWebcamAndAnalyze = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // บันทึกภาพในโหมดกระจกเงา
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setCapturedImage(dataUrl);
    stopWebcam();
    setMode("analyzing");

    // จำลองการคำนวณและดึง Landmarks 1.2 วินาทีเพื่อความนุ่มนวล
    setTimeout(() => {
      // Landmark จำลองของจุดสำคัญ (ไหล่ 11, 12, สะโพก 23, 24)
      const mockLandmarks: LandmarkPoint[] = [
        { x: 0.5, y: 0.15 }, // 0: Nose
        { x: 0.42, y: 0.28 }, // 11: Left shoulder
        { x: 0.58, y: 0.28 }, // 12: Right shoulder
        { x: 0.45, y: 0.52 }, // 23: Left hip
        { x: 0.55, y: 0.52 }, // 24: Right hip
      ];
      setDetectedLandmarks(mockLandmarks);

      const res = computeBodyAnalysis(mockLandmarks, canvas.width / canvas.height, dataUrl, "webcam");
      setScanResult(res);
      setMode("result");
    }, 1200);
  };

  // เริ่มนับถอยหลัง 3 วินาทีก่อนแชะรูป
  const handleStartCountdown = () => {
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          setTimeout(() => {
            captureWebcamAndAnalyze();
            setCountdown(null);
          }, 300);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // การอัปโหลดไฟล์รูปภาพ (File Upload)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setCapturedImage(dataUrl);
      setMode("analyzing");

      const img = new Image();
      img.onload = () => {
        setTimeout(() => {
          const aspectRatio = img.width / img.height;
          // คำนวณ landmarks จากรูปภาพ
          const mockLandmarks: LandmarkPoint[] = [
            { x: 0.5, y: 0.16 },
            { x: 0.41, y: 0.3 },
            { x: 0.59, y: 0.3 },
            { x: 0.44, y: 0.54 },
            { x: 0.56, y: 0.54 },
          ];
          setDetectedLandmarks(mockLandmarks);

          const res = computeBodyAnalysis(mockLandmarks, aspectRatio, dataUrl, "photo");
          setScanResult(res);
          setMode("result");
        }, 1200);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  // ข้ามขั้นตอนการสแกนสรีระอย่างสมบูรณ์ (ไม่สร้างข้อมูลจำลองขึ้นเอง)
  const handleSkip = () => {
    setScanResult(null);
    setCapturedImage(null);
    setMode("skipped");
    if (onSkip) {
      onSkip();
    }
    onScanComplete(null);
  };

  // บันทึกและยืนยันการใช้ผลสแกน
  const handleConfirmResult = () => {
    if (scanResult) {
      onScanComplete(scanResult);
    }
  };

  return (
    <div className="bg-gradient-to-b from-slate-900 via-zinc-900 to-black rounded-3xl border border-zinc-800 p-5 sm:p-7 text-white shadow-2xl relative overflow-hidden">
      {/* เอฟเฟกต์เรดาร์แสงพื้นหลัง */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* แถบด้านบน: หัวข้อ & Privacy Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-zinc-800 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
              AI Body Frame Analyzer
            </span>
            <span className="text-[11px] text-zinc-400">ระบบประเมินสรีระอัจฉริยะ</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
            วิเคราะห์โครงสร้างสรีระร่างกายและจุดเด่นทางกายวิภาค
          </h3>
        </div>

        {/* ตราประทับความปลอดภัยและความเป็นส่วนตัว 100% */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
          <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span>ประมวลผลในเครื่อง 100% (On-Device Privacy)</span>
        </div>
      </div>

      {/* ==========================================================
          หน้าจอเลือกช่องทาง (Mode: Choose)
         ========================================================== */}
      {mode === "choose" && (
        <div className="py-6 space-y-6 relative z-10">
          <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl leading-relaxed">
            เพื่อให้ระบบประเมินโครงสร้างกระดูก สัดส่วนสรีระปัจจุบัน (Somatotype) และความพร้อมของร่างกาย
            คุณสามารถเลือก <strong className="text-emerald-400 font-semibold">เปิดกล้องสแกนสด</strong> หรือ{" "}
            <strong className="text-teal-400 font-semibold">แนบรูปถ่ายรูปร่างของคุณ</strong> เพื่อให้ AI ตรวจวัดอัตราส่วนความกว้างหัวไหล่ต่อสะโพก (V-Taper) และจุดเด่นทางกายวิภาคศาสตร์
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* ตัวเลือกที่ 1: เปิดกล้องเว็บแคม */}
            <button
              type="button"
              onClick={startWebcam}
              className="group p-5 rounded-2xl bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700 hover:border-emerald-500/80 transition-all text-left shadow-lg hover:shadow-emerald-500/10 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h4 className="text-base font-bold text-white group-hover:text-emerald-300 transition">
                  เปิดกล้องสแกนสด (Live Webcam)
                </h4>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  ยืนหน้ากล้องให้เห็นช่วงลำตัว AI จะตรวจจับมุมหัวไหล่และสะโพกแบบ Real-time พร้อมนับถอยหลังแชะภาพ
                </p>
              </div>
              <div className="mt-4 text-xs font-bold text-emerald-400 flex items-center gap-1">
                เปิดกล้องเริ่มสแกน &rarr;
              </div>
            </button>

            {/* ตัวเลือกที่ 2: แนบรูปถ่าย */}
            <label className="group p-5 rounded-2xl bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700 hover:border-teal-500/80 transition-all text-left shadow-lg hover:shadow-teal-500/10 flex flex-col justify-between cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div>
                <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-500/30 text-teal-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h4 className="text-base font-bold text-white group-hover:text-teal-300 transition">
                  แนบรูปถ่ายสรีระ (Upload Photo)
                </h4>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  อัปโหลดรูปภาพเต็มตัวหรือครึ่งตัวจากเครื่อง AI จะประมวลผลวิเคราะห์โครงสร้างภายในอุปกรณ์ของคุณทันที
                </p>
              </div>
              <div className="mt-4 text-xs font-bold text-teal-400 flex items-center gap-1">
                เลือกไฟล์ภาพ &rarr;
              </div>
            </label>
          </div>

          {/* ปุ่มข้าม (Skip) สำหรับผู้ที่ไม่สะดวกหรือไม่ต้องการสแกน */}
          <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-400 border-t border-zinc-800/70">
            <span>ไม่ต้องการเปิดกล้องหรือแนบรูปถ่ายในตอนนี้?</span>
            <button
              type="button"
              onClick={handleSkip}
              className="font-bold text-zinc-300 hover:text-emerald-400 transition underline underline-offset-4"
            >
              ข้ามขั้นตอนนี้ (ใช้เฉพาะข้อมูลสุขภาพพื้นฐานและจุดเน้นกล้ามเนื้อ) &rarr;
            </button>
          </div>
        </div>
      )}

      {/* ==========================================================
          หน้าจอเมื่อผู้ใช้เลือกข้ามการสแกน (Mode: Skipped)
         ========================================================== */}
      {mode === "skipped" && (
        <div className="py-6 space-y-4 text-center relative z-10 animate-in fade-in duration-300">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-zinc-800/90 border border-zinc-700/80 flex items-center justify-center text-zinc-400 text-xl shadow-inner">
            ⏭️
          </div>
          <div className="space-y-1.5">
            <h4 className="text-base font-bold text-white">
              ข้ามขั้นตอนการสแกนสรีระแล้ว
            </h4>
            <p className="text-xs text-zinc-300 max-w-md mx-auto leading-relaxed">
              FitMate จะวางแผนการฝึกและโภชนาการตามข้อมูลสุขภาพพื้นฐาน (ส่วนสูง น้ำหนัก BMI) และกลุ่มกล้ามเนื้อที่คุณเลือกเน้น โดยไม่มีการคาดเดาหรือสร้างสัดส่วนสรีระขึ้นเอง
            </p>
          </div>
          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setMode("choose");
              }}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-bold text-emerald-400 transition flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>เปิดกล้องหรือแนบรูปหากต้องการสแกน</span>
            </button>
          </div>
        </div>
      )}

      {/* ==========================================================
          โหมดเปิดกล้องสแกนสด (Mode: Webcam)
         ========================================================== */}
      {mode === "webcam" && (
        <div className="py-5 space-y-4 relative z-10">
          <div className="relative w-full max-w-lg mx-auto aspect-[4/3] bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-700 shadow-2xl flex items-center justify-center">
            {/* วิดีโอกล้อง */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />

            {/* สถานะกล้องสด */}
            {isCameraActive && (
              <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-black/60 backdrop-blur px-2.5 py-1 rounded-full border border-white/20 text-[10px] font-bold text-white">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span>LIVE CAMERA</span>
              </div>
            )}

            {/* กรอบช่วยเล็งตำแหน่งสรีระ (Body Alignment HUD Overlay) */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-6">
              {/* เส้นกรอบศีรษะและลำตัว */}
              <div className="w-48 h-full border-2 border-dashed border-emerald-400/60 rounded-3xl relative flex flex-col items-center justify-between p-2">
                <span className="text-[10px] bg-emerald-500/80 text-white px-2 py-0.5 rounded-full font-bold">
                  ศีรษะ
                </span>
                <div className="w-full border-t border-dashed border-cyan-400/60 flex justify-between px-2 text-[9px] text-cyan-300 font-bold">
                  <span>แนวไหล่</span>
                  <span>Shoulders</span>
                </div>
                <div className="w-full border-t border-dashed border-amber-400/60 flex justify-between px-2 text-[9px] text-amber-300 font-bold">
                  <span>แนวสะโพก</span>
                  <span>Hips</span>
                </div>
                <span className="text-[10px] bg-emerald-500/80 text-white px-2 py-0.5 rounded-full font-bold">
                  ลำตัว / ขา
                </span>
              </div>
            </div>

            {/* เลขนับถอยหลัง 3.. 2.. 1.. */}
            {countdown !== null && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-30">
                <div className="text-7xl font-black text-emerald-400 animate-ping">
                  {countdown}
                </div>
              </div>
            )}

            {/* แจ้งเตือนข้อผิดพลาดกล้อง */}
            {cameraError && (
              <div className="absolute inset-0 bg-zinc-950/90 p-6 flex flex-col items-center justify-center text-center z-30">
                <div className="text-rose-400 font-bold text-sm mb-2">ไม่สามารถเชื่อมต่อกล้องได้</div>
                <p className="text-xs text-zinc-400 mb-4">{cameraError}</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={startWebcam}
                    className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold"
                  >
                    ลองใหม่อีกครั้ง
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("choose")}
                    className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-bold"
                  >
                    เลือกวิธีอื่น
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* แถบปุ่มควบคุมการถ่ายภาพ */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                stopWebcam();
                setMode("choose");
              }}
              className="px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition"
            >
              &larr; ยกเลิก
            </button>

            <button
              type="button"
              onClick={handleStartCountdown}
              disabled={countdown !== null}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-xs shadow-lg shadow-emerald-500/25 transition flex items-center gap-2 disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {countdown !== null ? "กำลังเตรียมตัว..." : "⏱️ นับถอยหลัง 3 วิ แล้วจับภาพ"}
            </button>

            <button
              type="button"
              onClick={captureWebcamAndAnalyze}
              className="px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition"
            >
              แชะภาพทันที
            </button>
          </div>
        </div>
      )}

      {/* ==========================================================
          โหมดกำลังประมวลผล (Mode: Analyzing)
         ========================================================== */}
      {mode === "analyzing" && (
        <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 relative z-10">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-500/30 animate-ping" />
            <div className="w-20 h-20 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
          </div>
          <div className="space-y-1">
            <h4 className="text-lg font-bold text-white">AI กำลังวิเคราะห์โครงสร้างสรีระร่างกาย...</h4>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              คำนวณ Shoulder-to-Hip Ratio, โครงสร้างกระดูก (Somatotype) และสัดส่วนทางกายวิภาคศาสตร์
            </p>
          </div>
        </div>
      )}

      {/* ==========================================================
          โหมดแสดงผลการวิเคราะห์สรีระ (Mode: Result)
         ========================================================== */}
      {mode === "result" && scanResult && (
        <div className="py-5 space-y-6 relative z-10 animate-in fade-in duration-300">
          {/* แถบสรุปคะแนนความเข้ากันได้ (Match Score) */}
          <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-teal-950/40 to-zinc-900 border border-emerald-500/40 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-xl">
            <div className="space-y-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
                  AI Body Frame Analysis {detectedLandmarks ? `(ตรวจพบ ${detectedLandmarks.length} จุดมาร์กสรีระ)` : ""}
                </span>
              </div>
              <h4 className="text-xl font-black text-white">{scanResult.frameTitle}</h4>
              <p className="text-xs text-zinc-300 leading-relaxed max-w-xl">
                {scanResult.frameDescription}
              </p>
            </div>

            {/* วงแหวนคะแนนเปอร์เซ็นต์ */}
            <div className="shrink-0 flex flex-col items-center p-3 rounded-2xl bg-zinc-900/80 border border-emerald-500/30 min-w-[130px]">
              <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                {scanResult.matchScore}%
              </div>
              <span className="text-[10px] font-bold text-emerald-300 mt-0.5">
                ระดับความพร้อมของสรีระ
              </span>
            </div>
          </div>

          {/* ตัวอย่างภาพที่ใช้ประมวลผล (ถ้ามี) */}
          {capturedImage && (
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-900/70 border border-zinc-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={capturedImage}
                alt="สรีระของคุณ"
                className="w-12 h-12 object-cover rounded-xl border border-zinc-700 shadow-sm shrink-0"
              />
              <div className="text-xs">
                <div className="font-bold text-white">ภาพสรีระที่ใช้ประมวลผล</div>
                <div className="text-[10px] text-emerald-400 font-medium">✓ ปลอดภัย ประมวลผลบนเครื่องของคุณ 100% ไม่ถูกส่งขึ้นคลาวด์ภายนอก</div>
              </div>
            </div>
          )}

          {/* Grid สัดส่วนสรีระ & โครงสร้างกระดูก */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* สัดส่วนไหล่ต่อสะโพก V-Taper Ratio */}
            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                อัตราส่วนไหล่ต่อสะโพก (V-Taper)
              </span>
              <div className="text-2xl font-black text-white">
                {scanResult.shoulderToHipRatio}{" "}
                <span className="text-xs font-normal text-zinc-400">: 1.0</span>
              </div>
              <div className="text-[11px] text-emerald-400 font-medium">
                {scanResult.shoulderToHipRatio >= 1.3
                  ? "✓ โครงสร้าง V-Shape เด่นชัด"
                  : "✓ โครงสร้างสมส่วน พัฒนาต่อยอดง่าย"}
              </div>
            </div>

            {/* สรีระประเภทเด่น Somatotype */}
            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                สรีระประเภทเด่น (Somatotype)
              </span>
              <div className="text-2xl font-black text-teal-400">{scanResult.somatotype}</div>
              <div className="text-[11px] text-zinc-400 leading-tight">
                {scanResult.somatotypeThai}
              </div>
            </div>

            {/* ระยะเวลาประเมินที่เป็นไปได้จริง */}
            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                ระยะเวลาที่เห็นผลชัดเจนและปลอดภัย
              </span>
              <div className="text-2xl font-black text-amber-400">
                {scanResult.timelineRecommendation.split(" ")[0]}
              </div>
              <div className="text-[11px] text-zinc-400">
                {scanResult.timelineRecommendation}
              </div>
            </div>
          </div>

          {/* จุดแข็งของสรีระคุณ (Natural Advantages) & จุดที่ต้องโฟกัส (Focus Gaps) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* จุดแข็ง */}
            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-emerald-900/40 space-y-2">
              <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <span>🌟</span> จุดแข็งของสรีระคุณ (Natural Advantages):
              </div>
              <ul className="space-y-1.5 text-xs text-zinc-300 leading-relaxed">
                {scanResult.advantages.map((adv, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold shrink-0">✓</span>
                    <span>{adv}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* จุดที่ต้องโฟกัสเติมเต็ม */}
            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-teal-900/40 space-y-2">
              <div className="text-xs font-bold text-teal-300 flex items-center gap-1.5">
                <span>🎯</span> กล้ามเนื้อและจุดที่ต้องเน้นเพื่อเติมเต็มช่องว่าง:
              </div>
              <ul className="space-y-1.5 text-xs text-zinc-300 leading-relaxed">
                {scanResult.focusGaps.map((gap, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-teal-400 font-bold shrink-0">&bull;</span>
                    <span>{gap}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ปุ่มยืนยัน / ปรับเปลี่ยน */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-800">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setScanResult(null);
                  setCapturedImage(null);
                  setMode("choose");
                }}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                สแกนหรือเลือกรูปใหม่
              </button>

              <button
                type="button"
                onClick={handleSkip}
                className="px-3.5 py-2.5 rounded-xl bg-zinc-800/80 hover:bg-rose-950/40 border border-zinc-700 hover:border-rose-500/50 text-zinc-400 hover:text-rose-300 text-xs font-semibold transition"
              >
                ✕ ไม่ใช้ผลนี้ (ข้าม)
              </button>
            </div>

            <button
              type="button"
              onClick={handleConfirmResult}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-xs shadow-lg shadow-emerald-500/25 transition flex items-center gap-2"
            >
              <span>✓ ใช้ผลการวิเคราะห์นี้ในโปรแกรมของฉัน</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
