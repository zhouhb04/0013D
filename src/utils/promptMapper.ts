/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CameraParameters, PromptMapping } from "../types";

export function mapParametersToPrompt(params: CameraParameters): PromptMapping {
  const { horizontalAngle, verticalAngle, distance, digitalZoom } = params;

  // 1. Horizontal mapping (8 directions)
  let horizontalTerm = "frontal";
  let horizontalLabel = "正面视角 (frontal)";

  if (horizontalAngle >= -22.5 && horizontalAngle < 22.5) {
    horizontalTerm = "frontal";
    horizontalLabel = "正面视角 (frontal)";
  } else if (horizontalAngle >= 22.5 && horizontalAngle < 67.5) {
    horizontalTerm = "right quarter";
    horizontalLabel = "右前四分之三偏角 (right quarter)";
  } else if (horizontalAngle >= 67.5 && horizontalAngle < 112.5) {
    horizontalTerm = "right side";
    horizontalLabel = "右侧视图 (right side)";
  } else if (horizontalAngle >= 112.5 && horizontalAngle < 157.5) {
    horizontalTerm = "back-right quarter";
    horizontalLabel = "右后四分之三偏角 (back-right quarter)";
  } else if (horizontalAngle >= 157.5 || horizontalAngle < -157.5) {
    horizontalTerm = "back view";
    horizontalLabel = "背面视图 (back view)";
  } else if (horizontalAngle >= -157.5 && horizontalAngle < -112.5) {
    horizontalTerm = "back-left quarter";
    horizontalLabel = "左后四分之三偏角 (back-left quarter)";
  } else if (horizontalAngle >= -112.5 && horizontalAngle < -67.5) {
    horizontalTerm = "left side";
    horizontalLabel = "左侧视图 (left side)";
  } else if (horizontalAngle >= -67.5 && horizontalAngle < -22.5) {
    horizontalTerm = "left quarter";
    horizontalLabel = "左前四分之三偏角 (left quarter)";
  }

  // 2. Vertical mapping (9 levels)
  let verticalTerm = "eye-level";
  let verticalLabel = "平视视角 (eye-level)";

  if (verticalAngle >= -90 && verticalAngle < -50) {
    verticalTerm = "low-angle";
    verticalLabel = "极低仰拍 (low-angle)";
  } else if (verticalAngle >= -50 && verticalAngle < -20) {
    verticalTerm = "mid-low";
    verticalLabel = "中低度仰拍 (mid-low)";
  } else if (verticalAngle >= -20 && verticalAngle < -10) {
    verticalTerm = "mid-angle";
    verticalLabel = "微仰拍 (mid-angle)";
  } else if (verticalAngle >= -10 && verticalAngle <= 10) {
    verticalTerm = "eye-level";
    verticalLabel = "平视摄影 (eye-level)";
  } else if (verticalAngle > 10 && verticalAngle <= 25) {
    verticalTerm = "high-mid";
    verticalLabel = "微俯拍 (high-mid)";
  } else if (verticalAngle > 25 && verticalAngle <= 45) {
    verticalTerm = "high-angle";
    verticalLabel = "俯角摄影 (high-angle)";
  } else if (verticalAngle > 45 && verticalAngle <= 65) {
    verticalTerm = "steep-mid";
    verticalLabel = "陡峭中俯拍 (steep-mid)";
  } else if (verticalAngle > 65 && verticalAngle <= 80) {
    verticalTerm = "steep-angle";
    verticalLabel = "极陡峭俯拍 (steep-angle)";
  } else if (verticalAngle > 80 && verticalAngle <= 90) {
    verticalTerm = "overhead";
    verticalLabel = "完全鸟瞰 (overhead)";
  }

  // 3. Virtual distance mapping (景别)
  let distanceTerm = "cowboy shot";
  let distanceLabel = "中景 (cowboy shot)";

  if (distance < 3.5) {
    distanceTerm = "close-up";
    distanceLabel = "特写 (close-up)";
  } else if (distance >= 3.5 && distance < 5.5) {
    distanceTerm = "medium close-up";
    distanceLabel = "中特写 (medium close-up)";
  } else if (distance >= 5.5 && distance < 8.0) {
    distanceTerm = "cowboy shot";
    distanceLabel = "牛仔镜头/中景 (cowboy shot)";
  } else {
    distanceTerm = "fullbody shot";
    distanceLabel = "全景全身照 (fullbody shot)";
  }

  // 4. Digital zoom mapping (镜头类型/视场角效果)
  let zoomTerm = "standard";
  let zoomLabel = "标准镜头 (standard)";

  if (digitalZoom >= 0.5 && digitalZoom < 0.8) {
    zoomTerm = "fisheye";
    zoomLabel = "鱼眼镜头 (fisheye)";
  } else if (digitalZoom >= 0.8 && digitalZoom < 1.3) {
    zoomTerm = "wide angle";
    zoomLabel = "广角镜头 (wide angle)";
  } else if (digitalZoom >= 1.3 && digitalZoom < 1.8) {
    zoomTerm = "standard";
    zoomLabel = "标准镜头 (standard)";
  } else if (digitalZoom >= 1.8 && digitalZoom < 2.5) {
    zoomTerm = "telephoto";
    zoomLabel = "长焦镜头 (telephoto)";
  } else if (digitalZoom >= 2.5 && digitalZoom <= 3.0) {
    zoomTerm = "super-telephoto";
    zoomLabel = "超长焦镜头 (super-telephoto)";
  }

  // Generate complete standard prompt
  const fullPrompt = `<sks> [${horizontalTerm}] [${verticalTerm}] [${distanceTerm}] [${zoomTerm}]`;

  return {
    horizontalLabel,
    horizontalTerm,
    verticalLabel,
    verticalTerm,
    distanceLabel,
    distanceTerm,
    zoomLabel,
    zoomTerm,
    fullPrompt,
  };
}
