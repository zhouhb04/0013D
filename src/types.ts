/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CameraParameters {
  horizontalAngle: number; // -180 to 180
  verticalAngle: number;   // -90 to 90
  distance: number;        // 2 to 15 (controls camera distance)
  digitalZoom: number;     // 0.5 to 3.0 (controls field of view)
}

export type ThemeMode = 'light' | 'dark';

export interface CustomApiConfig {
  provider: 'default' | 'gemini' | 'openai' | 'siliconflow' | 'custom_rest';
  apiKey: string;
  endpoint: string;
  model: string;
  customMethod?: string;
  customHeaders?: string;
  customBodyTemplate?: string;
  customResponsePath?: string;
}

export interface PromptMapping {
  horizontalLabel: string;
  horizontalTerm: string;
  verticalLabel: string;
  verticalTerm: string;
  distanceLabel: string;
  distanceTerm: string;
  zoomLabel: string;
  zoomTerm: string;
  fullPrompt: string;
}
