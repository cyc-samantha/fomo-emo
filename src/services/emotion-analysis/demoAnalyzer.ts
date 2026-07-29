import type { EmotionAnalysis, EmotionAnalyzer } from "./types";

const disclaimer =
  "This is one possible interpretation, not a fact. Context and words matter too.";

/**
 * Development-only adapter used to exercise the product flow.
 *
 * It does not inspect audio content. Replace it with a validated implementation
 * before user testing, and keep this limitation visible in the UI.
 */
export class DemoEmotionAnalyzer implements EmotionAnalyzer {
  async analyze(input: {
    uri: string;
    durationMillis: number;
  }): Promise<EmotionAnalysis> {
    if (!input.uri) {
      throw new Error("A recording URI is required.");
    }

    if (input.durationMillis < 1_000) {
      return {
        primary: "uncertain",
        confidence: 0.28,
        alternatives: [
          { emotion: "calm", confidence: 0.2 },
          { emotion: "frustrated", confidence: 0.16 },
        ],
        cues: [
          "The sample was very short",
          "Try recording a complete sentence",
        ],
        disclaimer,
      };
    }

    return {
      primary: "calm",
      confidence: 0.64,
      alternatives: [
        { emotion: "happy", confidence: 0.21 },
        { emotion: "uncertain", confidence: 0.15 },
      ],
      cues: ["Steady pace", "Relatively even volume"],
      disclaimer,
    };
  }
}

export const emotionAnalyzer: EmotionAnalyzer = new DemoEmotionAnalyzer();
