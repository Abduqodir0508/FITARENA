/**
 * Pose Kinematics and Biometric Skeletal Drawing Utility
 * Computes exact biometric joint angles from live landmarks or simulated frames.
 */

/**
 * Calculates real geometric angle at joint B given three landmarks A, B, C.
 * @param {{x: number, y: number}} A - First point (e.g., Shoulder)
 * @param {{x: number, y: number}} B - Middle joint vertex (e.g., Elbow)
 * @param {{x: number, y: number}} C - Third point (e.g., Wrist)
 * @returns {number} Angle in degrees (0 to 180)
 */
export function calculate3PointAngle(A, B, C) {
  if (!A || !B || !C) return 180;
  const radians = Math.atan2(C.y - B.y, C.x - B.x) - Math.atan2(A.y - B.y, A.x - B.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) {
    angle = 360.0 - angle;
  }
  return Math.round(angle);
}

/**
 * Calculates current joint angle based on exercise type and harmonic cycle progress for AI Demo.
 */
export function calculateDynamicAngle(exercise, cycleProgress) {
  if (exercise === 'pushups') {
    return Math.round(170 - (cycleProgress * 95));
  } else if (exercise === 'squats') {
    return Math.round(175 - (cycleProgress * 95));
  } else {
    return Math.round(160 - (cycleProgress * 75));
  }
}

/**
 * Computes 2D joint coordinates for virtual simulated demo.
 */
export function calculateJointPositions(exercise, progress, cx, cy) {
  let head, shoulder, elbow, wrist, hip, knee, ankle;

  if (exercise === 'pushups') {
    const bodyTilt = (1 - progress) * 20;
    head = { x: cx - 110, y: cy + bodyTilt - 15 };
    shoulder = { x: cx - 80, y: cy + bodyTilt };
    elbow = { x: cx - 50 + (progress * 25), y: cy + bodyTilt + 35 + (progress * 15) };
    wrist = { x: cx - 60, y: cy + 80 };
    hip = { x: cx + 20, y: cy + bodyTilt - 5 };
    knee = { x: cx + 90, y: cy + bodyTilt * 0.7 };
    ankle = { x: cx + 150, y: cy + 65 };
  } else if (exercise === 'squats') {
    const squatDrop = progress * 65;
    head = { x: cx, y: cy - 130 + squatDrop };
    shoulder = { x: cx, y: cy - 90 + squatDrop };
    elbow = { x: cx - 25, y: cy - 50 + squatDrop };
    wrist = { x: cx - 10, y: cy - 30 + squatDrop };
    hip = { x: cx, y: cy - 20 + squatDrop };
    knee = { x: cx + 35, y: cy + 40 + (squatDrop * 0.5) };
    ankle = { x: cx + 15, y: cy + 120 };
  } else {
    const crunchFold = progress * 40;
    head = { x: cx - 40 - crunchFold, y: cy - 30 - crunchFold };
    shoulder = { x: cx - 20 - (crunchFold * 0.5), y: cy };
    elbow = { x: cx - 45, y: cy - 15 };
    wrist = { x: cx - 25, y: cy - 30 };
    hip = { x: cx + 30, y: cy + 20 };
    knee = { x: cx + 70, y: cy - 20 };
    ankle = { x: cx + 110, y: cy + 30 };
  }

  return { head, shoulder, elbow, wrist, hip, knee, ankle };
}

/**
 * Draws real landmarks detected by MediaPipe on top of mirrored webcam feed.
 * Clean, subtle lines directly on the user's actual body only when confidence is high.
 */
export function drawRealPoseLandmarks(ctx, landmarks, width, height, exercise, angle) {
  if (!landmarks || landmarks.length === 0) return;

  // MediaPipe connections pairs
  const connections = [
    [11, 12], // shoulders
    [11, 13], [13, 15], // left arm
    [12, 14], [14, 16], // right arm
    [11, 23], [12, 24], // torso
    [23, 24], // hips
    [23, 25], [25, 27], // left leg
    [24, 26], [26, 28], // right leg
  ];

  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.strokeStyle = angle <= 90 ? "#10b981" : "#06b6d4";

  connections.forEach(([i, j]) => {
    const p1 = landmarks[i];
    const p2 = landmarks[j];
    if (p1 && p2 && (p1.visibility === undefined || p1.visibility > 0.6) && (p2.visibility === undefined || p2.visibility > 0.6)) {
      ctx.beginPath();
      // Mirror x coordinate because video is mirrored
      ctx.moveTo((1 - p1.x) * width, p1.y * height);
      ctx.lineTo((1 - p2.x) * width, p2.y * height);
      ctx.stroke();
    }
  });

  // Draw joints only on valid visible limbs
  landmarks.forEach((pt, idx) => {
    if ([11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28].includes(idx)) {
      if (pt && (pt.visibility === undefined || pt.visibility > 0.6)) {
        const x = (1 - pt.x) * width;
        const y = pt.y * height;
        ctx.beginPath();
        ctx.arc(x, y, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = [13, 14, 25, 26].includes(idx) ? "#10b981" : "#38bdf8";
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
  });
}

/**
 * Draws the cybernetic simulated skeleton strictly for AI Demo mode only.
 */
export function drawSkeletalCanvas(ctx, width, height, exercise, progress, angle) {
  const cx = width / 2;
  const cy = height / 2;

  const { head, shoulder, elbow, wrist, hip, knee, ankle } = calculateJointPositions(exercise, progress, cx, cy);

  const bones = [
    [head, shoulder],
    [shoulder, elbow],
    [elbow, wrist],
    [shoulder, hip],
    [hip, knee],
    [knee, ankle]
  ];

  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.strokeStyle = angle <= 90 ? "#10b981" : "#06b6d4";

  bones.forEach(([p1, p2]) => {
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  });

  const joints = [head, shoulder, elbow, wrist, hip, knee, ankle];
  joints.forEach((pt, idx) => {
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, idx === 0 ? 9 : 6, 0, Math.PI * 2);
    ctx.fillStyle = idx === 2 || idx === 5 ? "#10b981" : "#38bdf8";
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  const targetJoint = exercise === 'squats' ? knee : elbow;
  ctx.beginPath();
  ctx.arc(targetJoint.x, targetJoint.y, 20, 0, (angle / 180) * Math.PI);
  ctx.strokeStyle = "rgba(245, 158, 11, 0.8)";
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.fillStyle = "#f59e0b";
  ctx.font = "bold 13px Inter, monospace";
  ctx.fillText(`${angle}°`, targetJoint.x + 12, targetJoint.y - 8);
}
