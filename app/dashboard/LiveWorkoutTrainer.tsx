"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  ExerciseTracker,
  Landmark,
  POSE_INDEX,
  FormAnalysisResult,
  getExerciseCriteria,
} from "./poseAnalyzer";
import { workoutAudio } from "./workoutAudio";
import ExerciseDemoView from "./ExerciseDemoView";

export interface ExerciseItem {
  name: string;
  sets: string;
  reps: string;
  rest: string;
  tag: string;
  note?: string;
}

interface LiveWorkoutTrainerProps {
  dayTitle: string;
  exercises: ExerciseItem[];
  initialExerciseIndex?: number;
  workoutIntensity?: string;
  onClose: () => void;
  onCompleteExercise?: (exerciseIndex: number) => void;
  onCompleteDay?: () => void;
}

// แยกตัวเลขเซ็ตเป้าหมายให้สอดคล้องกับระดับความหนัก (Workout Intensity)
function parseSets(setsStr: string, intensity?: string): number {
  const matches = setsStr.match(/\d+/g);
  if (!matches || matches.length === 0) return 3;
  if (matches.length >= 2) {
    return intensity === "intense" ? parseInt(matches[1], 10) : parseInt(matches[0], 10);
  }
  return parseInt(matches[0], 10);
}

// แยกตัวเลขจำนวนครั้งเป้าหมายให้สอดคล้องกับข้อความ เช่น "10 ครั้ง (ค้าง 3 วิ)", "8-12 ครั้ง", "ค้าง 20-30 วินาที"
function parseReps(
  repsStr: string,
  intensity?: string
): { target: number; isHold: boolean; holdSeconds?: number; displayText: string } {
  // 1. กรณีท่าค้างเวลา เช่น "ค้าง 20-30 วินาที" หรือ "ค้าง 30-45 วินาที"
  if (repsStr.includes("ค้าง") && repsStr.includes("วินาที")) {
    const secMatches = repsStr.match(/\d+/g);
    if (secMatches) {
      const sec =
        secMatches.length >= 2
          ? intensity === "intense"
            ? parseInt(secMatches[1], 10)
            : Math.round((parseInt(secMatches[0], 10) + parseInt(secMatches[1], 10)) / 2)
          : parseInt(secMatches[0], 10);
      return {
        target: sec,
        isHold: true,
        holdSeconds: sec,
        displayText: `ค้าง ${sec} วินาที`,
      };
    }
  }

  // 2. กรณีท่าที่ระบุช่วงครั้ง เช่น "8-12 ครั้ง" หรือ "12-15 ครั้ง"
  const rangeMatch = repsStr.match(/(\d+)\s*-\s*(\d+)\s*ครั้ง/);
  if (rangeMatch) {
    const minReps = parseInt(rangeMatch[1], 10);
    const maxReps = parseInt(rangeMatch[2], 10);
    let target = minReps;
    if (intensity === "intense") target = maxReps;
    else if (intensity === "moderate") target = Math.round((minReps + maxReps) / 2);
    else target = minReps;

    return {
      target,
      isHold: false,
      displayText: `${target} ครั้ง (จากช่วง ${minReps}-${maxReps} ครั้ง)`,
    };
  }

  // 3. กรณีท่าระบุจำนวนครั้งเดี่ยว เช่น "10 ครั้ง (ค้าง 3 วิ)" หรือ "15 ครั้ง"
  const singleRepMatch = repsStr.match(/(\d+)\s*ครั้ง/);
  if (singleRepMatch) {
    const target = parseInt(singleRepMatch[1], 10);
    return {
      target,
      isHold: false,
      displayText: `${target} ครั้ง`,
    };
  }

  const fallbackMatch = repsStr.match(/\d+/);
  const target = fallbackMatch ? parseInt(fallbackMatch[0], 10) : 10;
  return { target, isHold: false, displayText: `${target} ครั้ง` };
}

export default function LiveWorkoutTrainer({
  dayTitle,
  exercises,
  initialExerciseIndex = 0,
  workoutIntensity = "moderate",
  onClose,
  onCompleteExercise,
  onCompleteDay,
}: LiveWorkoutTrainerProps) {
  const [exerciseIndex, setExerciseIndex] = useState(initialExerciseIndex);
  const currentExercise = exercises[exerciseIndex] || exercises[0];

  const parsedPlan = parseReps(currentExercise?.reps || "10 ครั้ง", workoutIntensity);
  const totalSets = parseSets(currentExercise?.sets || "3 เซ็ต", workoutIntensity);
  const targetReps = parsedPlan.target;

  const [currentSet, setCurrentSet] = useState(1);
  const [currentReps, setCurrentReps] = useState(0);

  // สถานะกล้องและ MediaPipe
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  // หน้าต่างสาธิตท่าเคลื่อนไหวเคียงข้างกล้อง (Side-by-side Demo PiP)
  const [showDemoPiP, setShowDemoPiP] = useState(true);

  // การวิเคราะห์ฟอร์มแบบเรียลไทม์
  const trackerRef = useRef<ExerciseTracker | null>(null);
  const initialCriteria = getExerciseCriteria(currentExercise?.name || "");
  const [feedback, setFeedback] = useState<FormAnalysisResult>({
    feedbackStatus: "waiting",
    message: "กำลังเชื่อมต่อกล้องและเปิดระบบ AI...",
    subMessage: "กรุณายืนให้เห็นอวัยวะที่ใช้ฝึกอย่างชัดเจน",
    progressPercent: 0,
    currentAngle: 0,
    targetAngle: initialCriteria.thresholdDegrees,
    isRepIncremented: false,
    isRepFailed: false,
    bodyVisibility: {
      upperBodyInFrame: false,
      lowerBodyInFrame: false,
      handsVisible: false,
      feetVisible: false,
      isReadyForExercise: false,
    },
    criteria: initialCriteria,
  });

  // สถานะพัก 20 วินาที (Rest Timer)
  const [isResting, setIsResting] = useState(false);
  const [restSecondsLeft, setRestSecondsLeft] = useState(20);
  const restTimerRef = useRef<NodeJS.Timeout | null>(null);

  // สถานะจบโปรแกรมฝึกทั้งหมด
  const [isDayCompleted, setIsDayCompleted] = useState(false);

  // นับถอยหลังเตรียมตัว 3 วินาทีก่อนเริ่มเซ็ต
  const [getReadyCountdown, setGetReadyCountdown] = useState<number | null>(null);

  // เริ่มต้น Tracker สำหรับท่านั้นๆ
  useEffect(() => {
    if (currentExercise) {
      trackerRef.current = new ExerciseTracker(
        currentExercise.name,
        parsedPlan.isHold ? parsedPlan.holdSeconds : 20
      );
    }
  }, [currentExercise, parsedPlan.isHold, parsedPlan.holdSeconds]);

  // สลับเสียง Mute
  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    workoutAudio.setMuted(next);
  };

  // จัดการการเปลี่ยนเซ็ต หรือเปลี่ยนท่าเมื่อพักครบ
  const advanceAfterRest = useCallback(() => {
    setIsResting(false);
    if (restTimerRef.current) clearInterval(restTimerRef.current);

    if (currentSet < totalSets) {
      // ยังมีเซ็ตเหลือในท่าเดิม
      setCurrentSet((prev) => prev + 1);
      setCurrentReps(0);
      trackerRef.current?.resetState();

      // นับถอยหลังเตรียมตัว 3 วินาที
      setGetReadyCountdown(3);
    } else {
      // จบครบทุกเซ็ตของท่านั้นแล้ว! ติ๊กถูกผ่านท่านั้นทันทีอัตโนมัติ
      if (onCompleteExercise) {
        onCompleteExercise(exerciseIndex);
      }

      if (exerciseIndex < exercises.length - 1) {
        // เปลี่ยนไปท่าถัดไปในตารางฝึกของวันนี้อัตโนมัติ
        const nextIdx = exerciseIndex + 1;
        setExerciseIndex(nextIdx);
        setCurrentSet(1);
        setCurrentReps(0);
        trackerRef.current?.resetState();

        setGetReadyCountdown(4);
      } else {
        // ทำครบทุกท่าของวันนั้นแล้ว! ติ๊กผ่านวันอัตโนมัติ
        setIsDayCompleted(true);
        workoutAudio.playCompleted();
        if (onCompleteDay) {
          onCompleteDay();
        }
      }
    }
  }, [currentSet, totalSets, exerciseIndex, exercises.length, onCompleteExercise, onCompleteDay]);

  // การนับถอยหลังระหว่างพักเซ็ต 20 วินาที
  useEffect(() => {
    if (isResting) {
      restTimerRef.current = setInterval(() => {
        setRestSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(restTimerRef.current!);
            advanceAfterRest();
            return 0;
          }
          if (prev <= 4) {
            workoutAudio.playTick();
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (restTimerRef.current) clearInterval(restTimerRef.current);
    };
  }, [isResting, advanceAfterRest]);

  // นับถอยหลังเตรียมตัว (Get Ready Countdown)
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (getReadyCountdown !== null) {
      if (getReadyCountdown > 1) {
        timer = setTimeout(() => {
          setGetReadyCountdown((prev) => (prev !== null ? prev - 1 : null));
          workoutAudio.playTick();
        }, 1000);
      } else if (getReadyCountdown === 1) {
        timer = setTimeout(() => {
          setGetReadyCountdown(null);
          workoutAudio.playGo();
        }, 1000);
      }
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [getReadyCountdown]);

  // เมื่อทำครบตามจำนวน Reps เป้าหมายในเซ็ตนั้น -> เข้าสู่โหมดพัก 20 วิ
  const triggerRestPeriod = useCallback(() => {
    setIsResting(true);
    setRestSecondsLeft(20);
    workoutAudio.playCompleted();

    // หากเซ็ตนี้เป็นเซ็ตสุดท้ายของท่า ให้ติ๊กผ่านท่านั้นล่วงหน้าทันที
    if (currentSet >= totalSets && onCompleteExercise) {
      onCompleteExercise(exerciseIndex);
    }
  }, [currentSet, totalSets, exerciseIndex, onCompleteExercise]);

  // วาดโครงกระดูกและประมวลผลท่าทาง
  const handlePoseResults = useCallback(
    (results: { poseLandmarks?: Landmark[] }) => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // โหมดกระจกเงา (Mirror mode)
      ctx.scale(-1, 1);
      ctx.translate(-canvas.width, 0);

      // วาดเฟรมวิดีโอ
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      if (results.poseLandmarks && results.poseLandmarks.length > 0) {
        const landmarks = results.poseLandmarks;

        // วาดจุดเชื่อมต่อข้อต่อ (Skeleton Connections)
        const connections = [
          [POSE_INDEX.LEFT_SHOULDER, POSE_INDEX.RIGHT_SHOULDER],
          [POSE_INDEX.LEFT_SHOULDER, POSE_INDEX.LEFT_ELBOW],
          [POSE_INDEX.LEFT_ELBOW, POSE_INDEX.LEFT_WRIST],
          [POSE_INDEX.RIGHT_SHOULDER, POSE_INDEX.RIGHT_ELBOW],
          [POSE_INDEX.RIGHT_ELBOW, POSE_INDEX.RIGHT_WRIST],
          [POSE_INDEX.LEFT_SHOULDER, POSE_INDEX.LEFT_HIP],
          [POSE_INDEX.RIGHT_SHOULDER, POSE_INDEX.RIGHT_HIP],
          [POSE_INDEX.LEFT_HIP, POSE_INDEX.RIGHT_HIP],
          [POSE_INDEX.LEFT_HIP, POSE_INDEX.LEFT_KNEE],
          [POSE_INDEX.LEFT_KNEE, POSE_INDEX.LEFT_ANKLE],
          [POSE_INDEX.RIGHT_HIP, POSE_INDEX.RIGHT_KNEE],
          [POSE_INDEX.RIGHT_KNEE, POSE_INDEX.RIGHT_ANKLE],
        ];

        ctx.lineWidth = 4;
        ctx.strokeStyle = "#10b981"; // เขียว Emerald
        connections.forEach(([i, j]) => {
          const pt1 = landmarks[i];
          const pt2 = landmarks[j];
          if (pt1 && pt2 && (pt1.visibility ?? 1) > 0.45 && (pt2.visibility ?? 1) > 0.45) {
            ctx.beginPath();
            ctx.moveTo(pt1.x * canvas.width, pt1.y * canvas.height);
            ctx.lineTo(pt2.x * canvas.width, pt2.y * canvas.height);
            ctx.stroke();
          }
        });

        // วาดจุดข้อต่อ (Joints)
        landmarks.forEach((lm) => {
          if ((lm.visibility ?? 1) > 0.45) {
            ctx.beginPath();
            ctx.arc(lm.x * canvas.width, lm.y * canvas.height, 6, 0, 2 * Math.PI);
            ctx.fillStyle = "#38bdf8"; // ฟ้าเรืองแสง
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = "#ffffff";
            ctx.stroke();
          }
        });

        // ส่งให้ PoseTracker วิเคราะห์เฉพาะเมื่อไม่ได้อยู่ในช่วงพัก หรือช่วงเตรียมตัว
        if (!isResting && getReadyCountdown === null && trackerRef.current) {
          const res = trackerRef.current.analyze(landmarks);
          setFeedback(res);

          // เมื่อทำท่าถูกต้องและนับครั้งเพิ่ม
          if (res.isRepIncremented) {
            workoutAudio.playSuccessRep();
            setCurrentReps((prev) => {
              const next = prev + 1;
              if (next >= targetReps) {
                // จบเซ็ตนี้แล้ว -> เข้าสู่ช่วงพัก 20 วิ
                setTimeout(() => triggerRestPeriod(), 400);
              }
              return next;
            });
          }

          // เมื่อทำท่าผิดหรือไม่ผ่านเกณฑ์
          if (res.isRepFailed) {
            workoutAudio.playFormWarning();
          }
        }
      }

      ctx.restore();
    },
    [isResting, getReadyCountdown, targetReps, triggerRestPeriod]
  );

  // โหลด MediaPipe Pose และเชื่อมต่อ Webcam
  useEffect(() => {
    interface PoseEngine {
      setOptions: (opts: Record<string, unknown>) => void;
      onResults: (cb: (results: { poseLandmarks?: Landmark[] }) => void) => void;
      send: (data: { image: HTMLVideoElement }) => Promise<void>;
      close: () => void;
    }

    interface CameraEngine {
      start: () => Promise<void>;
      stop: () => void;
    }

    let cameraInstance: CameraEngine | null = null;
    let poseInstance: PoseEngine | null = null;
    let isCancelled = false;

    // ฟังก์ชันโหลด External Script แบบ Asynchronous
    const loadScript = (src: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve();
          return;
        }
        const script = document.createElement("script");
        script.src = src;
        script.crossOrigin = "anonymous";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load script ${src}`));
        document.body.appendChild(script);
      });
    };

    const initMediaPipe = async () => {
      try {
        setCameraReady(false);
        setCameraError(null);

        // 1. โหลด MediaPipe Pose & Camera Utils จาก CDN
        await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js");
        await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js");

        if (isCancelled) return;

        const win = window as unknown as {
          Pose: new (opts: { locateFile: (file: string) => string }) => PoseEngine;
          Camera: new (
            el: HTMLVideoElement,
            opts: { onFrame: () => Promise<void>; width: number; height: number }
          ) => CameraEngine;
        };

        if (!win.Pose || !win.Camera) {
          throw new Error("ไม่สามารถโหลดไลบรารีตรวจจับโครงกระดูกได้");
        }

        // 2. สร้างอินสแตนซ์ Pose
        const pose = new win.Pose({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
        });

        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        pose.onResults(handlePoseResults);
        poseInstance = pose;

        // 3. เริ่มต้น Webcam
        if (videoRef.current) {
          const camera = new win.Camera(videoRef.current, {
            onFrame: async () => {
              if (videoRef.current && poseInstance && !isCancelled) {
                await poseInstance.send({ image: videoRef.current });
              }
            },
            width: 640,
            height: 480,
          });

          await camera.start();
          cameraInstance = camera;
          setCameraReady(true);
        }
      } catch (err: unknown) {
        console.error("Camera / MediaPipe init error:", err);
        const errMsg = err instanceof Error ? err.message : "ไม่สามารถเปิดกล้องได้";
        setCameraError(
          `${errMsg}. กรุณาตรวจสอบการอนุญาตใช้งานกล้อง (Camera Permission) ในเบราว์เซอร์`
        );
      }
    };

    initMediaPipe();

    return () => {
      isCancelled = true;
      if (cameraInstance) {
        try {
          cameraInstance.stop();
        } catch {
          // ignore
        }
      }
      if (poseInstance) {
        try {
          poseInstance.close();
        } catch {
          // ignore
        }
      }
    };
  }, [handlePoseResults]);

  // ฟังก์ชันช่วยเหลือสำหรับทดสอบจำลอง (Simulation) กรณีไม่มีกล้อง
  const handleSimulateRep = (isCorrect: boolean) => {
    if (isCorrect) {
      workoutAudio.playSuccessRep();
      setFeedback((prev) => ({
        ...prev,
        feedbackStatus: "correct",
        message: "ถูกต้องยอดเยี่ยม! นับ 1 ครั้ง",
        subMessage: "ฟอร์มสวยมาก ทำต่อไปให้ครบเซ็ต",
        progressPercent: 100,
        isRepIncremented: true,
        isRepFailed: false,
      }));
      setCurrentReps((prev) => {
        const next = prev + 1;
        if (next >= targetReps) {
          setTimeout(() => triggerRestPeriod(), 400);
        }
        return next;
      });
    } else {
      workoutAudio.playFormWarning();
      setFeedback((prev) => ({
        ...prev,
        feedbackStatus: "warning",
        message: "ยังทำไม่ถึงเกณฑ์! กรุณาทำใหม่",
        subMessage: prev.criteria.instructions,
        progressPercent: 55,
        isRepIncremented: false,
        isRepFailed: true,
      }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 text-white flex flex-col font-sans overflow-hidden">
      {/* ซ่อนวิดีโอดิบ เราใช้ Canvas แสดงผลแทนเพื่อการ Flip กระจกและวาด Skeleton */}
      <video ref={videoRef} className="hidden" playsInline muted autoPlay />

      {/* ==============================================================
          แถบ Header ด้านบน (ชื่อวันฝึก, ท่าปัจจุบัน, เกณฑ์, ปุ่มออกจากโหมด)
         ============================================================== */}
      <header className="px-5 py-3.5 bg-zinc-900/90 backdrop-blur border-b border-zinc-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-black">
            AI
          </div>
          <div>
            <div className="text-[11px] text-zinc-400 font-medium">{dayTitle}</div>
            <div className="text-sm font-black text-white flex items-center gap-2">
              <span>{currentExercise?.name}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {currentExercise?.tag}
              </span>
            </div>
          </div>
        </div>

        {/* ไอคอนสถานะการตรวจจับอวัยวะ (Body Limb Status Indicators) */}
        <div className="hidden md:flex items-center gap-2 bg-zinc-800/80 px-3 py-1.5 rounded-2xl border border-zinc-700/60 text-xs">
          <span className="text-zinc-400 font-bold text-[11px] mr-1">สถานะกล้อง:</span>

          {/* มือและแขน */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-bold text-[11px] transition ${
              feedback.bodyVisibility.handsVisible
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${feedback.bodyVisibility.handsVisible ? "bg-emerald-400" : "bg-rose-400"}`} />
            <span>มือและแขน:</span>
            <span>{feedback.bodyVisibility.handsVisible ? "ตรวจพบ" : "หลุดเฟรม"}</span>
          </div>

          {/* ขาและเท้า */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-bold text-[11px] transition ${
              feedback.bodyVisibility.feetVisible
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${feedback.bodyVisibility.feetVisible ? "bg-emerald-400" : "bg-rose-400"}`} />
            <span>ขาและเท้า:</span>
            <span>{feedback.bodyVisibility.feetVisible ? "ตรวจพบ" : "หลุดเฟรม"}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* ปุ่ม Mute / Unmute */}
          <button
            type="button"
            onClick={handleToggleMute}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition"
            title={isMuted ? "เปิดเสียง" : "ปิดเสียง"}
          >
            {isMuted ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            )}
          </button>

          {/* ปุ่มเปิด/ปิด ตัวอย่างท่าสาธิตข้างกล้อง (Demo PiP Toggle) */}
          <button
            type="button"
            onClick={() => setShowDemoPiP(!showDemoPiP)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
              showDemoPiP
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white"
            }`}
            title="เปิด/ปิด จอตัวอย่างท่าสาธิตข้างกล้อง"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="hidden sm:inline">
              {showDemoPiP ? "ซ่อนตัวอย่างท่า" : "ดูตัวอย่างท่าสาธิต"}
            </span>
          </button>

          {/* สลับท่าด้วยตนเอง (Manual Skip) */}
          {exerciseIndex < exercises.length - 1 && (
            <button
              type="button"
              onClick={() => {
                if (onCompleteExercise) onCompleteExercise(exerciseIndex);
                setExerciseIndex((prev) => prev + 1);
                setCurrentSet(1);
                setCurrentReps(0);
                trackerRef.current?.resetState();
              }}
              className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300 border border-zinc-700 transition"
            >
              ข้ามไปท่าถัดไป &rarr;
            </button>
          )}

          {/* ปุ่มปิด Modal */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition"
            title="ออกจากโหมดฝึก"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </header>

      {/* ==============================================================
          พื้นที่แสดงผลหลัก: Canvas กล้อง + HUD Overlays
         ============================================================== */}
      <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
        {/* Canvas แสดงผลกล้องและ Skeleton */}
        <canvas ref={canvasRef} className="max-w-full max-h-full object-contain rounded-2xl" />

        {/* กรณีกล้องติดปัญหา Permission หรืออุปกรณ์ไม่มีกล้อง */}
        {cameraError && (
          <div className="absolute inset-0 z-30 bg-zinc-950/90 backdrop-blur p-6 flex flex-col items-center justify-center text-center max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-3xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">ไม่สามารถเข้าถึงกล้องเว็บแคมได้</h3>
            <p className="text-xs text-zinc-400 leading-relaxed mb-6">{cameraError}</p>
            <div className="space-y-2 w-full">
              <button
                type="button"
                onClick={() => setCameraError(null)}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-lg transition"
              >
                ลองเชื่อมต่อกล้องใหม่อีกครั้ง
              </button>
              <button
                type="button"
                onClick={() => {
                  setCameraError(null);
                  setCameraReady(true);
                }}
                className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition"
              >
                เปิดโหมดทดสอบจำลอง (Simulation Mode)
              </button>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {!cameraReady && !cameraError && (
          <div className="absolute inset-0 z-20 bg-zinc-950 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
            <div className="text-sm font-bold text-white">กำลังเปิดกล้องและเชื่อมต่อ AI Pose Detection...</div>
            <p className="text-xs text-zinc-400 mt-1">กรุณากดอนุญาตให้สิทธิ์การใช้งานกล้องในเบราว์เซอร์</p>
          </div>
        )}

        {/* HUD ด้านซ้ายบน: การนับเซ็ต และนับครั้ง */}
        <div className="absolute top-5 left-5 z-20 flex flex-col gap-3">
          {/* การ์ดเซ็ต */}
          <div className="p-4 rounded-2xl bg-zinc-900/85 backdrop-blur border border-zinc-800 shadow-xl min-w-[150px]">
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              เซ็ตปัจจุบัน
            </div>
            <div className="text-2xl font-black text-white mt-0.5">
              {currentSet} <span className="text-sm text-zinc-500 font-medium">/ {totalSets}</span>
            </div>
          </div>

          {/* การ์ดจำนวนครั้ง (Reps Counter) */}
          <div className="p-4 rounded-2xl bg-zinc-900/85 backdrop-blur border border-zinc-800 shadow-xl min-w-[150px]">
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              {parsedPlan.isHold ? "เวลาที่ค้างได้" : "จำนวนครั้ง (REPS)"}
            </div>
            <div className="text-4xl font-black text-emerald-400 mt-0.5">
              {currentReps}{" "}
              <span className="text-lg text-zinc-500 font-medium">/ {targetReps}</span>
            </div>
            <div className="text-[10px] text-zinc-400 mt-1 font-mono">{parsedPlan.displayText}</div>
          </div>

          {/* ปุ่มจำลองสำหรับทดสอบ (Simulation Controls) */}
          <div className="p-3 rounded-2xl bg-zinc-900/70 backdrop-blur border border-zinc-800/60 text-[10px] text-zinc-400 space-y-1.5 max-w-[160px]">
            <div className="font-bold text-zinc-300">ทดสอบจำลอง (Test):</div>
            <button
              type="button"
              onClick={() => handleSimulateRep(true)}
              className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] transition shadow"
            >
              +1 ครั้ง (ผ่านเกณฑ์)
            </button>
            <button
              type="button"
              onClick={() => handleSimulateRep(false)}
              className="w-full py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] transition shadow"
            >
              ทดสอบท่าผิด (ไม่ผ่าน)
            </button>
          </div>
        </div>

        {/* HUD ตรงกลางบน: การ์ดแสดงเกณฑ์การผ่านของท่านั้นอย่างชัดเจน (ตามคำขอ) */}
        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-20 max-w-md w-full px-4 hidden sm:block">
          <div className="p-3.5 rounded-2xl bg-zinc-900/85 backdrop-blur border border-zinc-700/70 shadow-xl text-center space-y-1">
            <div className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <h4 className="text-xs font-black text-emerald-300 tracking-wide">
                {feedback.criteria.title}
              </h4>
            </div>
            <div className="text-xs font-bold text-white">
              จุดผ่านเกณฑ์: <span className="text-emerald-400">{feedback.criteria.primaryTargetText}</span>{" "}
              &bull; คืนตัว: <span className="text-teal-300">{feedback.criteria.returnTargetText}</span>
            </div>
            <div className="text-[11px] text-zinc-400 leading-tight">
              {feedback.criteria.instructions}
            </div>
          </div>
        </div>

        {/* HUD ด้านขวา: แถบวัดความลึกและจุดเกณฑ์ผ่าน (Target Threshold Gauge) */}
        <div className="absolute top-5 right-5 z-20 flex flex-col items-center">
          <div className="p-4 rounded-2xl bg-zinc-900/85 backdrop-blur border border-zinc-800 shadow-xl flex flex-col items-center w-28">
            <div className="text-[10px] font-bold text-zinc-400 mb-2">เกจวัดความลึก</div>

            {/* แถบ Progress แนวตั้ง พร้อมมาร์กเกอร์จุดผ่าน */}
            <div className="relative w-6 h-48 bg-zinc-800 rounded-full overflow-hidden flex flex-col-reverse p-0.5 border border-zinc-700">
              {/* เส้นมาร์กเกอร์จุดผ่าน (Target Marker Line) */}
              <div
                className="absolute w-full h-[3px] bg-white shadow-[0_0_8px_#ffffff] z-10"
                style={{ bottom: "85%" }}
                title="จุดผ่านเกณฑ์ 100%"
              />

              {/* สีของแถบเมื่อแตะถึงจุดผ่าน */}
              <div
                className={`w-full rounded-full transition-all duration-150 ${
                  feedback.progressPercent >= 90
                    ? "bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,1)]"
                    : feedback.progressPercent >= 50
                    ? "bg-amber-400"
                    : "bg-teal-500"
                }`}
                style={{ height: `${feedback.progressPercent}%` }}
              />
            </div>

            {/* ข้อความสถานะเมื่อแตะจุดผ่าน */}
            <div className="text-xs font-black font-mono mt-2 text-white flex items-center gap-1">
              <span>{feedback.progressPercent}%</span>
              {feedback.progressPercent >= 90 && (
                <span className="text-[9px] text-emerald-400 font-bold">✓ ผ่าน</span>
              )}
            </div>

            {feedback.currentAngle > 0 && (
              <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                {feedback.currentAngle}°
              </div>
            )}
          </div>
        </div>

        {/* HUD ตรงกลางล่าง: กล่องแจ้งเตือนความถูกต้องของท่า (Real-time Form Feedback) */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-11/12 max-w-xl">
          <div
            className={`p-4 rounded-3xl backdrop-blur-md border shadow-2xl transition-all duration-300 text-center ${
              feedback.feedbackStatus === "correct"
                ? "bg-emerald-950/85 border-emerald-500 text-emerald-100 ring-2 ring-emerald-500/40 animate-pulse"
                : feedback.feedbackStatus === "warning"
                ? "bg-rose-950/90 border-rose-500 text-rose-100 ring-2 ring-rose-500/50"
                : "bg-zinc-900/85 border-zinc-700 text-zinc-100"
            }`}
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              {feedback.feedbackStatus === "correct" && (
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              )}
              {feedback.feedbackStatus === "warning" && (
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              )}
              <h3 className="text-base sm:text-lg font-black tracking-wide">
                {feedback.message}
              </h3>
            </div>
            {feedback.subMessage && (
              <p className="text-xs text-zinc-300 font-medium opacity-90">
                {feedback.subMessage}
              </p>
            )}
          </div>
        </div>

        {/* หน้าต่างภาพเคลื่อนไหวสาธิตท่าคู่กับกล้อง (Side-by-side Live Demo PiP) */}
        {showDemoPiP && currentExercise && (
          <div className="absolute bottom-28 right-4 sm:right-6 z-30 max-w-[280px] animate-in fade-in slide-in-from-right-4 duration-200">
            <ExerciseDemoView
              exerciseName={currentExercise.name}
              isCompactPiP={true}
              onClose={() => setShowDemoPiP(false)}
            />
          </div>
        )}

        {/* ==============================================================
            COUNTDOWN OVERLAY: เตรียมตัว 3 วินาทีก่อนเริ่มเซ็ต
           ============================================================== */}
        {getReadyCountdown !== null && (
          <div className="absolute inset-0 z-40 bg-zinc-950/80 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in">
            <div className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-2">
              เซ็ตที่ {currentSet} • ท่า {currentExercise?.name}
            </div>
            <div className="text-8xl font-black text-white font-mono animate-bounce">
              {getReadyCountdown}
            </div>
            <div className="text-sm font-bold text-zinc-300 mt-4">
              เตรียมจัดระเบียบร่างกายให้พร้อม!
            </div>
          </div>
        )}

        {/* ==============================================================
            REST OVERLAY: พักระหว่างเซ็ต 20 วินาทีอัตโนมัติ (ตามคำขอ)
           ============================================================== */}
        {isResting && (
          <div className="absolute inset-0 z-40 bg-zinc-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                REST TIMER • พักฟื้นกล้ามเนื้อระหว่างเซ็ต
              </div>

              <div>
                <h2 className="text-xl font-black text-white">
                  จบเซ็ตที่ {currentSet} เรียบร้อยแล้ว!
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  สูดลมหายใจลึกๆ จิบน้ำ และเตรียมตัวสำหรับเซ็ตหรือท่าถัดไป
                </p>
              </div>

              {/* วงกลมนับถอยหลัง 20 วินาที */}
              <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="72"
                    cy="72"
                    r="60"
                    className="text-zinc-800"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                  />
                  <circle
                    cx="72"
                    cy="72"
                    r="60"
                    className="text-emerald-500 transition-all duration-1000"
                    strokeWidth="8"
                    strokeDasharray={377}
                    strokeDashoffset={377 - (377 * restSecondsLeft) / 20}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-4xl font-black font-mono text-white">
                    {restSecondsLeft}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-bold">วินาที</span>
                </div>
              </div>

              {/* ปุ่มควบคุมช่วงพัก */}
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setRestSecondsLeft((prev) => prev + 10)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 border border-zinc-700 transition"
                >
                  +10 วิ (ขอพักต่อ)
                </button>
                <button
                  type="button"
                  onClick={advanceAfterRest}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 transition"
                >
                  ข้ามการพัก &rarr;
                </button>
              </div>

              {/* ข้อความบอกท่า/เซ็ตถัดไป */}
              <div className="text-xs text-zinc-400 border-t border-zinc-800/80 pt-4">
                {currentSet < totalSets ? (
                  <span>
                    ถัดไป: <strong>เซ็ตที่ {currentSet + 1}</strong> ของท่า {currentExercise?.name}
                  </span>
                ) : exerciseIndex < exercises.length - 1 ? (
                  <span>
                    ถัดไป: ท่าใหม่ <strong>{exercises[exerciseIndex + 1]?.name}</strong>
                  </span>
                ) : (
                  <span>ถัดไป: เสร็จสิ้นโปรแกรมทั้งหมดของวันนี้!</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==============================================================
            DAY COMPLETED OVERLAY: ฝึกครบทุกท่าของวันแล้ว
           ============================================================== */}
        {isDayCompleted && (
          <div className="absolute inset-0 z-50 bg-zinc-950/95 backdrop-blur-lg flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <div className="max-w-md w-full bg-zinc-900 border border-emerald-500/40 rounded-3xl p-8 shadow-2xl space-y-6">
              <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <div>
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">
                  MISSION ACCOMPLISHED
                </span>
                <h2 className="text-2xl font-black text-white mt-1">
                  ยินดีด้วย! คุณฝึกเสร็จสมบูรณ์แล้ว
                </h2>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  คุณออกกำลังกายครบทุกเซ็ตและทุกท่าตามเกณฑ์ที่ AI ตรวจจับเรียบร้อยแล้ว ระบบได้ติ๊กบันทึกการฝึกของวันนี้ให้คุณอัตโนมัติ
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-800/60 border border-zinc-700/60 text-xs text-zinc-300 space-y-1">
                <div className="flex justify-between">
                  <span className="text-zinc-400">วันฝึก:</span>
                  <span className="font-bold text-white">{dayTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">จำนวนท่าที่ผ่าน:</span>
                  <span className="font-bold text-emerald-400">{exercises.length} ท่า</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">สถานะ:</span>
                  <span className="font-bold text-emerald-400">บันทึกอัตโนมัติ 100%</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-lg shadow-emerald-500/30 transition"
              >
                กลับสู่หน้าแดชบอร์ด
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
