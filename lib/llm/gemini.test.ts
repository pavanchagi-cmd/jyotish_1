import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateJson, LlmError, setGeminiClientForTests, type GeminiClient } from "./gemini";
import { horoscopeSchema, kundaliExplanationSchema, toGeminiSchema } from "./schemas";
import { findBannedPhrase, systemInstruction } from "./system";

const good = { title: "A good day to finish pending work", body: "The Moon supports your 6th house.", example: "Example: clear a pending bill." };

function fakeClient(...texts: (string | Error)[]) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- typed so tests can read call args
  const generateContent = vi.fn(async (_req: unknown) => {
    const next = texts.shift();
    if (next instanceof Error) throw next;
    return { text: next, usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 50 } };
  });
  setGeminiClientForTests({ models: { generateContent } } as GeminiClient);
  return generateContent;
}

const req = { tier: "fast" as const, language: "en" as const, instruction: "Write it.", facts: { natalMoonSign: "Leo" }, schema: horoscopeSchema };

describe("generateJson", () => {
  beforeEach(() => {
    process.env.GEMINI_MODEL_FAST = "fast-model";
    process.env.GEMINI_MODEL_DEEP = "deep-model";
    process.env.DATABASE_URL ??= "postgres://unused";
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    setGeminiClientForTests(null);
    vi.restoreAllMocks();
  });

  it("returns validated JSON with token counts and the model used", async () => {
    const gen = fakeClient(JSON.stringify(good));
    const r = await generateJson(req);
    expect(r).toEqual({ data: good, model: "fast-model", tokensIn: 100, tokensOut: 50 });
    const call = gen.mock.calls[0]![0] as { model: string; contents: string; config: Record<string, unknown> };
    expect(call.model).toBe("fast-model");
    expect(call.config.responseMimeType).toBe("application/json");
    expect(call.config.responseJsonSchema).toBeTruthy();
    expect(call.config.systemInstruction).toContain("Reply in English");
    expect(call.contents).toContain('"natalMoonSign":"Leo"');
  });

  it("uses the deep model for deep features", async () => {
    const gen = fakeClient(JSON.stringify(good));
    await generateJson({ ...req, tier: "deep" });
    expect((gen.mock.calls[0]![0] as unknown as { model: string }).model).toBe("deep-model");
  });

  it("retries once after invalid JSON", async () => {
    const gen = fakeClient("not json", JSON.stringify(good));
    expect((await generateJson(req)).data).toEqual(good);
    expect(gen).toHaveBeenCalledTimes(2);
  });

  it("retries once after a schema mismatch or a banned phrase", async () => {
    fakeClient(JSON.stringify({ title: "x" }), JSON.stringify(good));
    expect((await generateJson(req)).data).toEqual(good);
    fakeClient(JSON.stringify({ ...good, body: "Success is guaranteed." }), JSON.stringify(good));
    expect((await generateJson(req)).data).toEqual(good);
  });

  it("gives up after two failures", async () => {
    const gen = fakeClient(new Error("network"), "{}");
    await expect(generateJson(req)).rejects.toBeInstanceOf(LlmError);
    expect(gen).toHaveBeenCalledTimes(2);
  });
});

describe("system instruction", () => {
  it("keeps the spec's rules and sets the language", () => {
    const s = systemInstruction("hi");
    expect(s).toContain("Use ONLY the facts in the JSON provided.");
    expect(s).toContain("Never predict death, accidents, serious illness, divorce or financial ruin.");
    expect(s).toContain("Reply in Hindi.");
    expect(systemInstruction("kn")).toContain("Reply in Kannada.");
  });
  it("finds banned phrases", () => {
    expect(findBannedPhrase({ a: "An accident may happen" })).toBe("accident");
    expect(findBannedPhrase({ a: "Guaranteed results" })).toBe("Guarantee");
    expect(findBannedPhrase({ a: "A calm, steady week" })).toBeNull();
  });
});

describe("schemas", () => {
  it("convert to JSON schema for Gemini", () => {
    const js = toGeminiSchema(kundaliExplanationSchema) as { type: string; required: string[] };
    expect(js.type).toBe("object");
    expect(js.required).toEqual(expect.arrayContaining(["lagna", "moon", "highlights"]));
  });
});
