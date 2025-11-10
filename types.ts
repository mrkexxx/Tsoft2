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
  characters: {
    name: string;
    description: string;
  }[];
  scenes: string[];
}

export interface ScriptAnalysisResult {
  analysis: {
    wordCount: number;
    charCount: number;
    sentenceCount: number;
    policyCheck: {
      reuseRisk: string; // e.g., "Low", "Medium", "High" with explanation
      fairUseNotes: string;
      forbiddenWordsFound: string[];
    };
  };
  characters: {
    name: string;
    role: string; // e.g., "Protagonist", "Narrator"
    description: string;
  }[];
  threeActStructure: {
    act1_setup: string;
    act2_confrontation: string;
    act3_resolution: string;
  };
  rewrittenScript: string;
}

export interface SunoPrompt {
  title: string;
  prompt: string;
  lyrics: string;
}