// โมดูลวิเคราะห์ท่าทาง โครงสร้างร่างกาย และการนับครั้ง (Pose Analysis & Rep Counting)

export interface Landmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

export interface BodyVisibilityStatus {
  upperBodyInFrame: boolean; // แขน ศอก มือ
  lowerBodyInFrame: boolean; // สะโพก เข่า เท้า
  handsVisible: boolean;     // มือ
  feetVisible: boolean;      // เท้า
  isReadyForExercise: boolean;
  missingLimbMessage?: string;
}

export interface ExerciseCriteria {
  category: ExerciseCategory;
  title: string;
  primaryTargetText: string;
  returnTargetText: string;
  thresholdDegrees: number;
  instructions: string;
  focusMuscles: string;
  requiredLimbs: string[];
}

export interface FormAnalysisResult {
  feedbackStatus: "waiting" | "ready" | "in_progress" | "correct" | "warning" | "completed";
  message: string;
  subMessage?: string;
  progressPercent: number; // 0 - 100% ของระยะการเคลื่อนไหว
  currentAngle: number;
  targetAngle: number;
  isRepIncremented: boolean;
  isRepFailed: boolean;
  bodyVisibility: BodyVisibilityStatus;
  criteria: ExerciseCriteria;
}

// คำนวณมุม (องศา) ระหว่าง 3 จุด โดยจุด b คือจุดยอดมุม (Vertex)
export function calculateAngle(a: Landmark, b: Landmark, c: Landmark): number {
  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) {
    angle = 360.0 - angle;
  }
  return Math.round(angle);
}

// MediaPipe Pose Landmark Indices
export const POSE_INDEX = {
  NOSE: 0,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
};

export type ExerciseCategory =
  | "squat"
  | "pushup"
  | "shoulder_press"
  | "lunge"
  | "glute_bridge"
  | "hold"
  | "general";

export function detectExerciseCategory(name: string): ExerciseCategory {
  const lower = name.toLowerCase();
  if (lower.includes("squat") || lower.includes("สควอท")) {
    return "squat";
  }
  if (lower.includes("push-up") || lower.includes("pushup") || lower.includes("วิดพื้น")) {
    return "pushup";
  }
  if (lower.includes("bridge") || lower.includes("สะโพก")) {
    return "glute_bridge";
  }
  if (
    lower.includes("shoulder") ||
    lower.includes("lateral") ||
    lower.includes("overhead") ||
    lower.includes("หัวไหล่")
  ) {
    return "shoulder_press";
  }
  if (lower.includes("lunge") || lower.includes("ลันจ์")) {
    return "lunge";
  }
  if (
    lower.includes("plank") ||
    lower.includes("hold") ||
    lower.includes("wall sit") ||
    lower.includes("superman") ||
    lower.includes("ค้าง")
  ) {
    return "hold";
  }
  if (lower.includes("chest press") || lower.includes("ดันอก")) {
    return "pushup"; // ใช้หลักการงอ-เหยียดข้อศอกคล้ายวิดพื้น
  }
  return "squat"; // default ให้เป็น squat เพื่อเน้นความปลอดภัย
}

export function getExerciseCriteria(name: string): ExerciseCriteria {
  const cat = detectExerciseCategory(name);
  switch (cat) {
    case "squat":
      return {
        category: "squat",
        title: "เกณฑ์ตรวจจับท่าสควอท (Squat)",
        primaryTargetText: "ย่อสะโพกมุมเข่า ≤ 95°",
        returnTargetText: "ยืนตรงตัวเหยียดสุด ≥ 155°",
        thresholdDegrees: 95,
        instructions: "ยืนให้กล้องเห็นทั้งตัว ย่อสะโพกลงจนเกจแตะขีดเขียว แล้วดันตัวยืนตรง",
        focusMuscles: "ต้นขา สะโพก และก้น",
        requiredLimbs: ["สะโพกและเข่า", "ปลายเท้า"],
      };
    case "pushup":
      return {
        category: "pushup",
        title: "เกณฑ์ตรวจจับท่าวิดพื้น (Push-up)",
        primaryTargetText: "งอข้อศอกลงลึก ≤ 95°",
        returnTargetText: "ดันแขนเหยียดตรง ≥ 150°",
        thresholdDegrees: 95,
        instructions: "ลดหน้าอกลงให้ข้อศอกงอ 90 องศา แล้วออกแรงดันแขนเหยียดตรง",
        focusMuscles: "หน้าอกและหลังแขน",
        requiredLimbs: ["แขนและข้อศอก", "ลำตัว"],
      };
    case "shoulder_press":
      return {
        category: "shoulder_press",
        title: "เกณฑ์ตรวจจับท่ายกหัวไหล่ (Overhead Press)",
        primaryTargetText: "ยกมือขึ้นเหนือศีรษะแขนเหยียด ≥ 155°",
        returnTargetText: "ลดมือลงเสมอระดับไหล่ ≤ 90°",
        thresholdDegrees: 155,
        instructions: "ดันมือและน้ำหนักขึ้นเหนือศีรษะจริง (ไม่ใช่แกว่งมือ) แล้วลดลงระดับไหล่",
        focusMuscles: "หัวไหล่และแขน",
        requiredLimbs: ["มือเหนือศีรษะ", "ข้อศอกและไหล่"],
      };
    case "lunge":
      return {
        category: "lunge",
        title: "เกณฑ์ตรวจจับท่าลันจ์ (Lunge)",
        primaryTargetText: "ก้าวขาย่อเข่าหน้า ≤ 95°",
        returnTargetText: "ดันตัวกลับมายืนตรง ≥ 155°",
        thresholdDegrees: 95,
        instructions: "ก้าวขอย่อเข่าหน้าลงจนต้นขาขนานพื้น แล้วดันตัวกลับมายืนตรง",
        focusMuscles: "ต้นขา สะโพก และการทรงตัว",
        requiredLimbs: ["ขาหน้าและเข่า", "เท้า"],
      };
    case "glute_bridge":
      return {
        category: "glute_bridge",
        title: "เกณฑ์ตรวจจับท่า Glute Bridge",
        primaryTargetText: "ยกสะโพกขึ้นจนลำตัวตรง ≥ 165°",
        returnTargetText: "ลดสะโพกลงแตะพื้น ≤ 125°",
        thresholdDegrees: 165,
        instructions: "นอนหงายชันเข่า ยกสะโพกขึ้นให้เป็นเส้นตรงกับลำตัวแล้วบีบก้น",
        focusMuscles: "ก้นและสะโพก",
        requiredLimbs: ["สะโพก", "ลำตัว"],
      };
    case "hold":
    default:
      return {
        category: "hold",
        title: "เกณฑ์ตรวจจับท่าค้างเวลา (Isometric Hold)",
        primaryTargetText: "เกร็งลำตัวนิ่งตามเวลา",
        returnTargetText: "ค้างท่าจนแถบเวลาเต็ม 100%",
        thresholdDegrees: 180,
        instructions: "จัดระเบียบร่างกายให้นิ่ง หายใจเข้าออกสม่ำเสมอจนกว่าจะครบเวลา",
        focusMuscles: "แกนกลางลำตัว",
        requiredLimbs: ["ลำตัวตรง", "แขน"],
      };
  }
}

export class ExerciseTracker {
  private category: ExerciseCategory;
  private criteria: ExerciseCriteria;
  private phase: "UP" | "DOWN" | "HOLDING" = "UP";
  private minAngleReached: number = 999;
  private maxAngleReached: number = 0;
  private standingHipY: number | null = null;
  private holdStartTimestamp: number | null = null;
  private holdDurationTargetSeconds: number = 20;
  private lastRepTime: number = 0;

  constructor(exerciseName: string, holdSeconds = 20) {
    this.category = detectExerciseCategory(exerciseName);
    this.criteria = getExerciseCriteria(exerciseName);
    this.holdDurationTargetSeconds = holdSeconds;
    this.resetState();
  }

  public resetState() {
    this.phase = "UP";
    this.minAngleReached = 999;
    this.maxAngleReached = 0;
    this.standingHipY = null;
    this.holdStartTimestamp = null;
  }

  // ตรวจสอบความพร้อมของอวัยวะในเฟรมกล้อง
  public evaluateVisibility(landmarks: Landmark[]): BodyVisibilityStatus {
    const isVis = (lm?: Landmark, threshold = 0.5) =>
      Boolean(lm && (lm.visibility ?? 0) >= threshold);

    const nose = landmarks[POSE_INDEX.NOSE];
    const leftShoulder = landmarks[POSE_INDEX.LEFT_SHOULDER];
    const rightShoulder = landmarks[POSE_INDEX.RIGHT_SHOULDER];
    const leftElbow = landmarks[POSE_INDEX.LEFT_ELBOW];
    const rightElbow = landmarks[POSE_INDEX.RIGHT_ELBOW];
    const leftWrist = landmarks[POSE_INDEX.LEFT_WRIST];
    const rightWrist = landmarks[POSE_INDEX.RIGHT_WRIST];

    const leftHip = landmarks[POSE_INDEX.LEFT_HIP];
    const rightHip = landmarks[POSE_INDEX.RIGHT_HIP];
    const leftKnee = landmarks[POSE_INDEX.LEFT_KNEE];
    const rightKnee = landmarks[POSE_INDEX.RIGHT_KNEE];
    const leftAnkle = landmarks[POSE_INDEX.LEFT_ANKLE];
    const rightAnkle = landmarks[POSE_INDEX.RIGHT_ANKLE];

    const handsVisible = isVis(leftWrist, 0.45) || isVis(rightWrist, 0.45);
    const feetVisible = isVis(leftAnkle, 0.45) || isVis(rightAnkle, 0.45);

    const upperBodyInFrame =
      (isVis(leftShoulder, 0.45) || isVis(rightShoulder, 0.45)) &&
      (isVis(leftElbow, 0.45) || isVis(rightElbow, 0.45));

    const lowerBodyInFrame =
      (isVis(leftHip, 0.45) || isVis(rightHip, 0.45)) &&
      (isVis(leftKnee, 0.45) || isVis(rightKnee, 0.45)) &&
      feetVisible;

    let isReadyForExercise = true;
    let missingLimbMessage: string | undefined = undefined;

    // ตรวจสอบความต้องการเฉพาะของแต่ละท่า
    if (this.category === "squat" || this.category === "lunge") {
      if (!lowerBodyInFrame) {
        isReadyForExercise = false;
        missingLimbMessage = "กล้องมองไม่เห็นขาและเท้า! กรุณาถอยหลังให้เห็นทั้งตัว (ยกมือจะไม่ถูกนับ)";
      }
    } else if (this.category === "shoulder_press") {
      if (!upperBodyInFrame || !handsVisible) {
        isReadyForExercise = false;
        missingLimbMessage = "กรุณาจัดกล้องให้เห็นแขนและมือชัดเจน เพื่อตรวจจับการยกขึ้นเหนือศีรษะ";
      }
    } else if (this.category === "pushup") {
      if (!upperBodyInFrame && !lowerBodyInFrame) {
        isReadyForExercise = false;
        missingLimbMessage = "กรุณาจัดกล้องให้เห็นตำแหน่งการวิดพื้น";
      }
    } else if (!isVis(nose, 0.4) && !upperBodyInFrame) {
      isReadyForExercise = false;
      missingLimbMessage = "กำลังค้นหาร่างกาย กรุณายืนให้อยู่ในเฟรมกล้อง";
    }

    return {
      upperBodyInFrame,
      lowerBodyInFrame,
      handsVisible,
      feetVisible,
      isReadyForExercise,
      missingLimbMessage,
    };
  }

  public analyze(landmarks: Landmark[]): FormAnalysisResult {
    const now = Date.now();
    const vis = this.evaluateVisibility(landmarks);

    // หากอวัยวะสำคัญที่ต้องใช้ตรวจจับท่านั้นไม่อยู่ในกล้อง ห้ามให้นับเด็ดขาด!
    if (!vis.isReadyForExercise) {
      return {
        feedbackStatus: "warning",
        message: vis.missingLimbMessage || "กรุณาจัดตำแหน่งร่างกายให้อยู่ในกล้อง",
        subMessage:
          this.category === "squat"
            ? "ต้องมองเห็นสะโพก เข่า และเท้าเต็มตัว (การยกมือขึ้นลงจะไม่นับเป็นสควอท)"
            : "จัดมุมกล้องให้มองเห็นอวัยวะที่ใช้ฝึกชัดเจน",
        progressPercent: 0,
        currentAngle: 0,
        targetAngle: this.criteria.thresholdDegrees,
        isRepIncremented: false,
        isRepFailed: false,
        bodyVisibility: vis,
        criteria: this.criteria,
      };
    }

    switch (this.category) {
      case "squat":
        return this.analyzeSquat(landmarks, now, vis);
      case "pushup":
        return this.analyzePushup(landmarks, now, vis);
      case "shoulder_press":
        return this.analyzeShoulderPress(landmarks, now, vis);
      case "lunge":
        return this.analyzeLunge(landmarks, now, vis);
      case "glute_bridge":
        return this.analyzeGluteBridge(landmarks, now, vis);
      case "hold":
      default:
        return this.analyzeHold(landmarks, now, vis);
    }
  }

  // ==============================================================
  // 1. ท่า Squats: ล็อกป้องกันโกง (ต้องมี Hip descent และมุมเข่างอจริง)
  // ==============================================================
  private analyzeSquat(
    landmarks: Landmark[],
    now: number,
    vis: BodyVisibilityStatus
  ): FormAnalysisResult {
    const leftHip = landmarks[POSE_INDEX.LEFT_HIP];
    const leftKnee = landmarks[POSE_INDEX.LEFT_KNEE];
    const leftAnkle = landmarks[POSE_INDEX.LEFT_ANKLE];

    const rightHip = landmarks[POSE_INDEX.RIGHT_HIP];
    const rightKnee = landmarks[POSE_INDEX.RIGHT_KNEE];
    const rightAnkle = landmarks[POSE_INDEX.RIGHT_ANKLE];

    const leftKneeVis = leftKnee?.visibility ?? 0;
    const rightKneeVis = rightKnee?.visibility ?? 0;

    let kneeAngle = 175;
    let currentHipY = 0.5;

    if (leftKneeVis >= rightKneeVis && leftHip && leftKnee && leftAnkle) {
      kneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
      currentHipY = leftHip.y;
    } else if (rightHip && rightKnee && rightAnkle) {
      kneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
      currentHipY = rightHip.y;
    }

    const STAND_ANGLE = 155;
    const SQUAT_DEPTH_TARGET = 95;

    // คำนวณเปอร์เซ็นต์ความลึก (155° -> 0%, 95° -> 100%)
    const progress = Math.min(
      100,
      Math.max(0, Math.round(((STAND_ANGLE - kneeAngle) / (STAND_ANGLE - SQUAT_DEPTH_TARGET)) * 100))
    );

    let isRepIncremented = false;
    let isRepFailed = false;
    let message = "พร้อมฝึก: ยืนตรงแล้วย่อสะโพกลงให้ลึก";
    let subMessage = "เกณฑ์ผ่าน: ย่อจนเกจสีเขียวแตะ 100% แล้วดันตัวขึ้นตรง";
    let status: FormAnalysisResult["feedbackStatus"] = "ready";

    // ติดตามระดับสะโพกตอนยืน
    if (this.phase === "UP" && kneeAngle >= STAND_ANGLE - 5) {
      this.standingHipY = currentHipY;
    }

    // ตรวจสอบการย่อตัวจริง (สะโพกต้องลดระดับลง และเข่างอ)
    if (this.phase === "UP") {
      if (kneeAngle < STAND_ANGLE - 12) {
        this.phase = "DOWN";
        this.minAngleReached = kneeAngle;
        message = "กำลังย่อสะโพกลง... ย่อให้ต้นขาขนานพื้น";
        subMessage = `ความลึก: ${progress}% (เป้าหมาย 100% เข่า ≤ 95°)`;
        status = "in_progress";
      }
    } else if (this.phase === "DOWN") {
      if (kneeAngle < this.minAngleReached) {
        this.minAngleReached = kneeAngle;
      }

      if (kneeAngle <= SQUAT_DEPTH_TARGET) {
        message = "✨ ผ่านเกณฑ์ความลึกแล้ว! ค่อยๆ ดันตัวขึ้นยืนตรง";
        subMessage = `องศาเข่า: ${kneeAngle}° (แตะจุดผ่านเรียบร้อย)`;
        status = "correct";
      } else {
        message = "ย่อสะโพกลงอีกนิดให้ต้นขาขนานพื้น...";
        subMessage = `ความลึกปัจจุบัน: ${progress}% (ต้องการอีกนิด)`;
        status = "in_progress";
      }

      // ตรวจสอบจังหวะดันตัวกลับขึ้นมายืนตรง
      if (kneeAngle >= STAND_ANGLE - 8) {
        if (now - this.lastRepTime > 900) {
          if (this.minAngleReached <= SQUAT_DEPTH_TARGET + 5) {
            // สำเร็จ!
            isRepIncremented = true;
            this.lastRepTime = now;
            message = "สควอทถูกต้องยอดเยี่ยม! นับ 1 ครั้ง";
            subMessage = "ยอดเยี่ยมมาก! ดันตัวขึ้นสุดแล้วลุยครั้งต่อไป";
            status = "correct";
          } else {
            // ย่อไม่ลึกพอ
            isRepFailed = true;
            this.lastRepTime = now;
            message = "ยังย่อไม่ลึกพอ! กรุณาทำใหม่";
            subMessage = `ย่อได้เพียง ${this.minAngleReached}° (เกณฑ์ต้องต่ำกว่า ${SQUAT_DEPTH_TARGET}°)`;
            status = "warning";
          }
        }
        this.phase = "UP";
        this.minAngleReached = 999;
      }
    }

    return {
      feedbackStatus: status,
      message,
      subMessage,
      progressPercent: progress,
      currentAngle: kneeAngle,
      targetAngle: SQUAT_DEPTH_TARGET,
      isRepIncremented,
      isRepFailed,
      bodyVisibility: vis,
      criteria: this.criteria,
    };
  }

  // ==============================================================
  // 2. ท่า Shoulder Press (Overhead): ข้อมือต้องยกสูงกว่าศีรษะจริง!
  // ==============================================================
  private analyzeShoulderPress(
    landmarks: Landmark[],
    now: number,
    vis: BodyVisibilityStatus
  ): FormAnalysisResult {
    const nose = landmarks[POSE_INDEX.NOSE];
    const leftShoulder = landmarks[POSE_INDEX.LEFT_SHOULDER];
    const rightShoulder = landmarks[POSE_INDEX.RIGHT_SHOULDER];
    const leftElbow = landmarks[POSE_INDEX.LEFT_ELBOW];
    const rightElbow = landmarks[POSE_INDEX.RIGHT_ELBOW];
    const leftWrist = landmarks[POSE_INDEX.LEFT_WRIST];
    const rightWrist = landmarks[POSE_INDEX.RIGHT_WRIST];

    const shoulder = leftShoulder || rightShoulder;
    const elbow = leftElbow || rightElbow;
    const wrist = leftWrist || rightWrist;

    let angle = 90;
    if (shoulder && elbow && wrist) {
      angle = calculateAngle(shoulder, elbow, wrist);
    }

    // ตรวจสอบว่าข้อมืออยู่สูงกว่าระดับไหล่/ศีรษะหรือไม่ (Y ค่ายิ่งน้อยแปลว่ายิ่งสูง)
    const isHandsAboveHead =
      (leftWrist && nose && leftWrist.y < nose.y) ||
      (rightWrist && nose && rightWrist.y < nose.y) ||
      (wrist && shoulder && wrist.y < shoulder.y - 0.1);

    const BOTTOM_ANGLE = 85;
    const TOP_TARGET = 155;

    const progress = Math.min(
      100,
      Math.max(0, Math.round(((angle - BOTTOM_ANGLE) / (TOP_TARGET - BOTTOM_ANGLE)) * 100))
    );

    let isRepIncremented = false;
    let isRepFailed = false;
    let message = "พร้อมยก: ตั้งแขนระดับหัวไหล่";
    let subMessage = "เกณฑ์ผ่าน: ดันมือขึ้นเหนือศีรษะให้แขนเหยียดตรง ≥ 155°";
    let status: FormAnalysisResult["feedbackStatus"] = "ready";

    // ป้องกันแค่แกว่งมือที่หน้าอก: ข้อมือต้องดันขึ้นสูงจริง
    if (this.phase === "UP") {
      if (angle > BOTTOM_ANGLE + 20 && isHandsAboveHead) {
        this.phase = "DOWN";
        this.maxAngleReached = angle;
        message = "กำลังดันน้ำหนักขึ้นเหนือศีรษะ...";
        status = "in_progress";
      }
    } else {
      if (angle > this.maxAngleReached) {
        this.maxAngleReached = angle;
      }

      if (angle >= TOP_TARGET && isHandsAboveHead) {
        message = "✨ แขนเหยียดขึ้นสุดเหนือศีรษะแล้ว! ค่อยๆ ลดระดับลง";
        status = "correct";
      }

      if (angle <= BOTTOM_ANGLE + 15) {
        if (now - this.lastRepTime > 900) {
          if (this.maxAngleReached >= TOP_TARGET - 10 && this.maxAngleReached > 0) {
            isRepIncremented = true;
            this.lastRepTime = now;
            message = "ยกหัวไหล่ถูกต้อง! นับ 1 ครั้ง";
            subMessage = "ดีมาก! ลดมือลงเสมอไหล่แล้วยกครั้งต่อไป";
            status = "correct";
          } else {
            isRepFailed = true;
            this.lastRepTime = now;
            message = "ยกไม่สุดแขนเหนือศีรษะ! กรุณาทำใหม่";
            subMessage = "ต้องดันมือขึ้นให้แขนเกือบเหยียดตรงเหนือศีรษะ";
            status = "warning";
          }
        }
        this.phase = "UP";
        this.maxAngleReached = 0;
      }
    }

    return {
      feedbackStatus: status,
      message,
      subMessage,
      progressPercent: progress,
      currentAngle: angle,
      targetAngle: TOP_TARGET,
      isRepIncremented,
      isRepFailed,
      bodyVisibility: vis,
      criteria: this.criteria,
    };
  }

  // ==============================================================
  // 3. ท่าวิดพื้น (Push-ups)
  // ==============================================================
  private analyzePushup(
    landmarks: Landmark[],
    now: number,
    vis: BodyVisibilityStatus
  ): FormAnalysisResult {
    const leftShoulder = landmarks[POSE_INDEX.LEFT_SHOULDER];
    const leftElbow = landmarks[POSE_INDEX.LEFT_ELBOW];
    const leftWrist = landmarks[POSE_INDEX.LEFT_WRIST];

    const rightShoulder = landmarks[POSE_INDEX.RIGHT_SHOULDER];
    const rightElbow = landmarks[POSE_INDEX.RIGHT_ELBOW];
    const rightWrist = landmarks[POSE_INDEX.RIGHT_WRIST];

    let elbowAngle = 160;
    if (leftShoulder && leftElbow && leftWrist) {
      elbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
    } else if (rightShoulder && rightElbow && rightWrist) {
      elbowAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
    }

    const TOP_ANGLE = 150;
    const DOWN_TARGET = 95;

    const progress = Math.min(
      100,
      Math.max(0, Math.round(((TOP_ANGLE - elbowAngle) / (TOP_ANGLE - DOWN_TARGET)) * 100))
    );

    let isRepIncremented = false;
    let isRepFailed = false;
    let message = "พร้อมวิดพื้น: เหยียดแขนตรง เกร็งหน้าท้อง";
    let subMessage = "เกณฑ์ผ่าน: ลดอกลงให้ข้อศอกงอ ≤ 95° แล้วดันตัวขึ้น";
    let status: FormAnalysisResult["feedbackStatus"] = "ready";

    if (this.phase === "UP") {
      if (elbowAngle < TOP_ANGLE - 15) {
        this.phase = "DOWN";
        this.minAngleReached = elbowAngle;
        message = "กำลังลดหน้าอกลง...";
        subMessage = `งอข้อศอกให้ลึกใกล้ 90 องศา`;
        status = "in_progress";
      }
    } else if (this.phase === "DOWN") {
      if (elbowAngle < this.minAngleReached) {
        this.minAngleReached = elbowAngle;
      }

      if (elbowAngle <= DOWN_TARGET) {
        message = "✨ หน้าอกลงลึกได้ระดับสมบูรณ์แบบ! ดันตัวขึ้น";
        status = "correct";
      }

      if (elbowAngle >= TOP_ANGLE - 10) {
        if (now - this.lastRepTime > 900) {
          if (this.minAngleReached <= DOWN_TARGET + 8) {
            isRepIncremented = true;
            this.lastRepTime = now;
            message = "วิดพื้นถูกต้อง! นับ 1 ครั้ง";
            status = "correct";
          } else {
            isRepFailed = true;
            this.lastRepTime = now;
            message = "ลดหน้าอกไม่ลึกพอ! กรุณาทำใหม่";
            subMessage = "งอข้อศอกให้ลึกกว่านี้เพื่อให้กล้ามเนื้ออกทำงานเต็มที่";
            status = "warning";
          }
        }
        this.phase = "UP";
        this.minAngleReached = 999;
      }
    }

    return {
      feedbackStatus: status,
      message,
      subMessage,
      progressPercent: progress,
      currentAngle: elbowAngle,
      targetAngle: DOWN_TARGET,
      isRepIncremented,
      isRepFailed,
      bodyVisibility: vis,
      criteria: this.criteria,
    };
  }

  // ==============================================================
  // 4. ท่า Lunges
  // ==============================================================
  private analyzeLunge(
    landmarks: Landmark[],
    now: number,
    vis: BodyVisibilityStatus
  ): FormAnalysisResult {
    return this.analyzeSquat(landmarks, now, vis);
  }

  // ==============================================================
  // 5. ท่า Glute Bridges
  // ==============================================================
  private analyzeGluteBridge(
    landmarks: Landmark[],
    now: number,
    vis: BodyVisibilityStatus
  ): FormAnalysisResult {
    const shoulder = landmarks[POSE_INDEX.LEFT_SHOULDER] || landmarks[POSE_INDEX.RIGHT_SHOULDER];
    const hip = landmarks[POSE_INDEX.LEFT_HIP] || landmarks[POSE_INDEX.RIGHT_HIP];
    const knee = landmarks[POSE_INDEX.LEFT_KNEE] || landmarks[POSE_INDEX.RIGHT_KNEE];

    let angle = 120;
    if (shoulder && hip && knee) {
      angle = calculateAngle(shoulder, hip, knee);
    }

    const REST_ANGLE = 125;
    const BRIDGE_TARGET = 165;

    const progress = Math.min(
      100,
      Math.max(0, Math.round(((angle - REST_ANGLE) / (BRIDGE_TARGET - REST_ANGLE)) * 100))
    );

    let isRepIncremented = false;
    let isRepFailed = false;
    let message = "พร้อมยกสะโพก: นอนหงายชันเข่า";
    const subMessage = "เกณฑ์ผ่าน: ยกสะโพกขึ้นจนลำตัวตรง ≥ 165° บีบก้น";
    let status: FormAnalysisResult["feedbackStatus"] = "ready";

    if (this.phase === "UP") {
      if (angle > REST_ANGLE + 15) {
        this.phase = "DOWN"; // กำลังยกขึ้น
        this.maxAngleReached = angle;
        status = "in_progress";
      }
    } else {
      if (angle > this.maxAngleReached) {
        this.maxAngleReached = angle;
      }
      if (angle >= BRIDGE_TARGET) {
        message = "✨ ยกสะโพกได้ระดับสวยงาม! ค่อยๆ ลดตัวลง";
        status = "correct";
      }
      if (angle <= REST_ANGLE + 10) {
        if (now - this.lastRepTime > 900) {
          if (this.maxAngleReached >= BRIDGE_TARGET - 8) {
            isRepIncremented = true;
            this.lastRepTime = now;
            message = "ยกสะโพกถูกต้อง! นับ 1 ครั้ง";
            status = "correct";
          } else {
            isRepFailed = true;
            this.lastRepTime = now;
            message = "ยกสะโพกขึ้นไม่สุด! กรุณาทำใหม่";
            status = "warning";
          }
        }
        this.phase = "UP";
        this.maxAngleReached = 0;
      }
    }

    return {
      feedbackStatus: status,
      message,
      subMessage,
      progressPercent: progress,
      currentAngle: angle,
      targetAngle: BRIDGE_TARGET,
      isRepIncremented,
      isRepFailed,
      bodyVisibility: vis,
      criteria: this.criteria,
    };
  }

  // ==============================================================
  // 6. ท่าค้างเวลา (Isometric Holds เช่น Plank, Wall Sit, Superman)
  // ==============================================================
  private analyzeHold(
    landmarks: Landmark[],
    now: number,
    vis: BodyVisibilityStatus
  ): FormAnalysisResult {
    if (!this.holdStartTimestamp) {
      this.holdStartTimestamp = now;
    }

    const elapsedSeconds = Math.floor((now - this.holdStartTimestamp) / 1000);
    const progress = Math.min(
      100,
      Math.round((elapsedSeconds / this.holdDurationTargetSeconds) * 100)
    );

    let isRepIncremented = false;
    let message = `กำลังค้างท่า... ${elapsedSeconds} / ${this.holdDurationTargetSeconds} วินาที`;
    let subMessage = `เกณฑ์ผ่าน: ค้างท่านิ่งให้ครบ ${this.holdDurationTargetSeconds} วินาที`;
    let status: FormAnalysisResult["feedbackStatus"] = "in_progress";

    if (elapsedSeconds >= this.holdDurationTargetSeconds) {
      isRepIncremented = true;
      this.holdStartTimestamp = now;
      message = "ค้างท่าครบตามกำหนดแล้ว! นับ 1 เซ็ต/ครั้ง";
      subMessage = "ยอดเยี่ยมมาก! ผ่อนคลายกล้ามเนื้อได้";
      status = "correct";
    }

    return {
      feedbackStatus: status,
      message,
      subMessage,
      progressPercent: progress,
      currentAngle: 180,
      targetAngle: 180,
      isRepIncremented,
      isRepFailed: false,
      bodyVisibility: vis,
      criteria: this.criteria,
    };
  }
}
