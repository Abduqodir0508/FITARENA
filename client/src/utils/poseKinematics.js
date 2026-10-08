/**
 * Pose Kinematics and Biometric Skeletal Drawing Utility
 * Calculates biomechanical angles and renders glowing cyberpunk skeletons onto Canvas.
 */

/**
 * Calculates current joint angle based on exercise type and harmonic cycle progress.
 * @param {'pushups' | 'squats' | 'press'} exercise
 * @param {number} cycleProgress - Float 0.0 to 1.0 (0=top, 1=bottom/deep)
 * @returns {number} angle in degrees
 */
export function calculateDynamicAngle(exercise, cycleProgress) {
  if (exercise === 'pushups') {
    // Elbow angle: 170 deg (extended) -> 75 deg (bottom)
    return Math.round(170 - (cycleProgress * 95));
  } else if (exercise === 'squats') {
    // Knee angle: 175 deg (standing) -> 80 deg (deep squat)
    return Math.round(175 - (cycleProgress * 95));
  } else {
    // Press / Crunches: Torso angle: 160 deg -> 85 deg
    return Math.round(160 - (cycleProgress * 75));
  }
}

/**
 * Computes 2D joint coordinates for skeleton rendering based on exercise & motion progress.
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
    // Press / Crunches
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
 * Draws the cybernetic grid, bones, keypoint joints, and angle HUD onto the 2D canvas context.
 */
export function drawSkeletalCanvas(ctx, width, height, exercise, progress, angle) {
  const cx = width / 2;
  const cy = height / 2;

  // Background radar aesthetic ring
  ctx.strokeStyle = "rgba(16, 185, 129, 0.15)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, 140, 0, Math.PI * 2);
  ctx.stroke();

  // Joint positions
  const { head, shoulder, elbow, wrist, hip, knee, ankle } = calculateJointPositions(exercise, progress, cx, cy);

  // Bones connections
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

  // Joints points
  const joints = [head, shoulder, elbow, wrist, hip, knee, ankle];
  joints.forEach((pt, idx) => {
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, idx === 0 ? 10 : 6, 0, Math.PI * 2);
    ctx.fillStyle = idx === 2 || idx === 5 ? "#10b981" : "#38bdf8";
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  // Angle indicator arc
  const targetJoint = exercise === 'squats' ? knee : elbow;
  ctx.beginPath();
  ctx.arc(targetJoint.x, targetJoint.y, 24, 0, (angle / 180) * Math.PI);
  ctx.strokeStyle = "rgba(245, 158, 11, 0.8)";
  ctx.lineWidth = 3;
  ctx.stroke();

  // Angle text next to joint
  ctx.fillStyle = "#f59e0b";
  ctx.font = "bold 13px Inter, monospace";
  ctx.fillText(`${angle}°`, targetJoint.x + 14, targetJoint.y - 10);
}
