import type { ReactElement } from 'react';

export enum ImageStyle {
  CINEMATIC = 'Điện ảnh',
  ANIMATION = 'Hoạt hình',
  INK_WASH = 'Tranh vẽ thuỷ mặc trung quốc',
  VIETNAMESE_ANTIQUE = 'Vibe cổ họa Việt Nam',
  STICK_FIGURE = 'Người que',
}

export interface GeneratedPrompt {
  sceneName: string;
  sceneDescription: string;
  imagePrompt: string;
  videoPrompt: string;
}

export interface GeneratedImage {
  sceneName: string;
  imageData: string;
}

// FIX: Define and export the HistoryItem interface to resolve the import error in historyService.ts.
export interface HistoryItem {
  id: number;
  timestamp: string;
  script: string;
  style: ImageStyle;
  durationMinutes: number;
  durationSeconds: number;
  prompts: GeneratedPrompt[];
  images: GeneratedImage[];
}

export interface Article {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  tags: string[];
  content: ReactElement;
}

export interface YouTubeSeoResult {
  titles: string[];
  description: string;
  hashtags: string;
  keywords: string;
}