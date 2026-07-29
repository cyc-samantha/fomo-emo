import { DemoEmotionAnalyzer } from "./demoAnalyzer";

describe("DemoEmotionAnalyzer", () => {
  const analyzer = new DemoEmotionAnalyzer();

  it("returns uncertainty for a sample shorter than one second", async () => {
    const result = await analyzer.analyze({
      uri: "file:///sample.m4a",
      durationMillis: 800,
    });

    expect(result.primary).toBe("uncertain");
    expect(result.confidence).toBeLessThan(0.5);
  });

  it("returns alternatives whose confidence is bounded", async () => {
    const result = await analyzer.analyze({
      uri: "file:///sample.m4a",
      durationMillis: 3_000,
    });

    expect(result.alternatives).toHaveLength(2);
    expect(result.alternatives.every(({ confidence }) => confidence <= 1)).toBe(
      true,
    );
  });

  it("rejects a missing recording URI", async () => {
    await expect(
      analyzer.analyze({ uri: "", durationMillis: 2_000 }),
    ).rejects.toThrow("A recording URI is required.");
  });
});
