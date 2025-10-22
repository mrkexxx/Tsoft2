import type { ReactElement } from 'react';

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
  style: string;
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
  keywords: string;
}

export interface VideoAnalysisResult {
  summary: string;
  scenes: string[];
}
