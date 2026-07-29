import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { emotionAnalyzer } from "../../services/emotion-analysis/demoAnalyzer";
import type {
  EmotionAnalysis,
  EmotionKind,
} from "../../services/emotion-analysis/types";

const emotionLabels: Record<EmotionKind, { emoji: string; label: string }> = {
  calm: { emoji: "😌", label: "Calm" },
  happy: { emoji: "🙂", label: "Happy" },
  sad: { emoji: "😔", label: "Sad" },
  frustrated: { emoji: "😣", label: "Frustrated" },
  uncertain: { emoji: "🤔", label: "Not enough information" },
};

type ScreenState = "ready" | "recording" | "analyzing" | "result";

export function EmotionCheckScreen() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 200);
  const [screenState, setScreenState] = useState<ScreenState>("ready");
  const [analysis, setAnalysis] = useState<EmotionAnalysis | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Microphone access is off",
          "You can enable microphone access in iOS Settings when you are ready.",
        );
        return;
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setAnalysis(null);
      setScreenState("recording");
    } catch {
      Alert.alert(
        "Recording did not start",
        "Please check your microphone and try again.",
      );
    }
  }, [recorder]);

  const stopAndAnalyze = useCallback(async () => {
    try {
      const durationMillis = recorderState.durationMillis;
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false });

      if (!recorder.uri) {
        throw new Error("Recording URI was unavailable.");
      }

      setScreenState("analyzing");
      const nextAnalysis = await emotionAnalyzer.analyze({
        uri: recorder.uri,
        durationMillis,
      });
      setAnalysis(nextAnalysis);
      setScreenState("result");
    } catch {
      setScreenState("ready");
      Alert.alert(
        "We could not check that recording",
        "Nothing was saved. Please try again.",
      );
    }
  }, [recorder, recorderState.durationMillis]);

  const reset = useCallback(() => {
    setAnalysis(null);
    setScreenState("ready");
  }, []);

  const seconds = Math.max(0, Math.floor(recorderState.durationMillis / 1_000));

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        accessibilityRole="summary"
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>FOMO EMO</Text>
          <Text style={styles.title}>What might their tone mean?</Text>
          <Text style={styles.subtitle}>
            Record a short sentence. We’ll offer a possibility—not a fact.
          </Text>
        </View>

        {screenState === "result" && analysis ? (
          <ResultCard analysis={analysis} onReset={reset} />
        ) : (
          <View style={styles.recorderCard}>
            <View
              style={[
                styles.micCircle,
                screenState === "recording" && styles.micCircleActive,
              ]}
              accessibilityElementsHidden
            >
              <Text style={styles.micEmoji}>
                {screenState === "recording" ? "●" : "🎙️"}
              </Text>
            </View>

            {screenState === "recording" ? (
              <>
                <Text style={styles.cardTitle}>Listening…</Text>
                <Text style={styles.timer}>{seconds}s</Text>
                <Text style={styles.helper}>
                  A complete sentence gives more context.
                </Text>
                <PrimaryButton
                  label="Stop & check tone"
                  onPress={stopAndAnalyze}
                />
              </>
            ) : screenState === "analyzing" ? (
              <>
                <ActivityIndicator
                  size="large"
                  color="#315C49"
                  accessibilityLabel="Checking the recording"
                />
                <Text style={styles.cardTitle}>Checking patterns…</Text>
                <Text style={styles.helper}>
                  Looking at pace, pitch, and volume.
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.cardTitle}>Ready when you are</Text>
                <Text style={styles.helper}>
                  The demo recording stays on this device and is not uploaded.
                </Text>
                <PrimaryButton
                  label="Start recording"
                  onPress={startRecording}
                />
              </>
            )}
          </View>
        )}

        <View style={styles.notice}>
          <Text style={styles.noticeIcon}>ⓘ</Text>
          <Text style={styles.noticeText}>
            Tone can be ambiguous. Check the words and situation, or ask the
            person when it feels safe.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ResultCard({
  analysis,
  onReset,
}: {
  analysis: EmotionAnalysis;
  onReset: () => void;
}) {
  const primary = emotionLabels[analysis.primary];

  return (
    <View style={styles.resultCard}>
      <Text style={styles.resultOverline}>ONE POSSIBILITY</Text>
      <Text style={styles.resultEmoji}>{primary.emoji}</Text>
      <Text style={styles.resultTitle}>{primary.label}</Text>
      <Text style={styles.confidence}>
        {Math.round(analysis.confidence * 100)}% match in this demo
      </Text>

      <View style={styles.divider} />
      <Text style={styles.sectionTitle}>Cues we would explain</Text>
      {analysis.cues.map((cue) => (
        <Text key={cue} style={styles.cue}>
          • {cue}
        </Text>
      ))}

      <Text style={styles.disclaimer}>{analysis.disclaimer}</Text>
      <PrimaryButton label="Try another recording" onPress={onReset} />
    </View>
  );
}

function PrimaryButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryButton,
        pressed && styles.primaryButtonPressed,
      ]}
    >
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7F3EA",
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 28,
  },
  eyebrow: {
    color: "#587265",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2.4,
    marginBottom: 12,
  },
  title: {
    color: "#17251F",
    fontSize: 36,
    fontWeight: "700",
    letterSpacing: -1.2,
    lineHeight: 42,
    marginBottom: 12,
  },
  subtitle: {
    color: "#506159",
    fontSize: 17,
    lineHeight: 25,
  },
  recorderCard: {
    alignItems: "center",
    backgroundColor: "#FFFCF6",
    borderColor: "#E5DED0",
    borderRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 36,
  },
  micCircle: {
    alignItems: "center",
    backgroundColor: "#DDE9E2",
    borderRadius: 48,
    height: 96,
    justifyContent: "center",
    marginBottom: 24,
    width: 96,
  },
  micCircleActive: {
    backgroundColor: "#F5D7CD",
  },
  micEmoji: {
    color: "#B84C37",
    fontSize: 36,
  },
  cardTitle: {
    color: "#17251F",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  timer: {
    color: "#B84C37",
    fontSize: 32,
    fontVariant: ["tabular-nums"],
    fontWeight: "700",
    marginBottom: 8,
  },
  helper: {
    color: "#68766F",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 28,
    textAlign: "center",
  },
  primaryButton: {
    alignItems: "center",
    alignSelf: "stretch",
    backgroundColor: "#315C49",
    borderRadius: 16,
    minHeight: 56,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  primaryButtonPressed: {
    backgroundColor: "#244536",
    transform: [{ scale: 0.99 }],
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  notice: {
    alignItems: "flex-start",
    flexDirection: "row",
    marginTop: 24,
    paddingHorizontal: 4,
  },
  noticeIcon: {
    color: "#587265",
    fontSize: 18,
    marginRight: 10,
  },
  noticeText: {
    color: "#68766F",
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
  },
  resultCard: {
    backgroundColor: "#FFFCF6",
    borderColor: "#E5DED0",
    borderRadius: 28,
    borderWidth: 1,
    padding: 28,
  },
  resultOverline: {
    color: "#587265",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.8,
    textAlign: "center",
  },
  resultEmoji: {
    fontSize: 64,
    marginBottom: 8,
    marginTop: 20,
    textAlign: "center",
  },
  resultTitle: {
    color: "#17251F",
    fontSize: 30,
    fontWeight: "700",
    textAlign: "center",
  },
  confidence: {
    color: "#68766F",
    fontSize: 14,
    marginTop: 6,
    textAlign: "center",
  },
  divider: {
    backgroundColor: "#E5DED0",
    height: 1,
    marginVertical: 24,
  },
  sectionTitle: {
    color: "#17251F",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 10,
  },
  cue: {
    color: "#506159",
    fontSize: 15,
    lineHeight: 24,
  },
  disclaimer: {
    backgroundColor: "#EEF2EC",
    borderRadius: 12,
    color: "#506159",
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 20,
    marginTop: 24,
    padding: 14,
  },
});
