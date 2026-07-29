export const emotionKinds = [
  "calm",
  "happy",
  "sad",
  "frustrated",
  "uncertain",
] as const;

export type EmotionKind = (typeof emotionKinds)[number];

export type EmotionAlternative = {
  emotion: EmotionKind;
  confidence: number;
};

export type EmotionAnalysis = {
  primary: EmotionKind;
  confidence: number;
  alternatives: EmotionAlternative[];
  cues: string[];
  disclaimer: string;
};

export interface EmotionAnalyzer {
  analyze(input: {
    uri: string;
    durationMillis: number;
  }): Promise<EmotionAnalysis>;
}
