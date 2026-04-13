import OpenAI from "openai";
import { NextResponse } from "next/server";
import { generateMoodJoke } from "@/lib/joke-generator";

type JokeRequest = {
  mood?: string;
};

type PromptType = "gold" | "cozy" | "relatable" | "clever" | "personalized";
type EmotionType =
  | "tired"
  | "overwhelmed"
  | "sad"
  | "frustrated"
  | "happy"
  | "excited"
  | "confused"
  | "bored"
  | "reflective";

type EmotionScore = {
  type: EmotionType;
  intensity: number;
};

type EmotionClassification = {
  emotions: EmotionScore[];
};

type PromptEmotionContext = {
  primaryEmotion?: EmotionScore;
  secondaryEmotion?: EmotionScore;
};

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const validPromptTypes: PromptType[] = [
  "gold",
  "cozy",
  "relatable",
  "clever",
  "personalized"
];

const validEmotionTypes: EmotionType[] = [
  "tired",
  "overwhelmed",
  "sad",
  "frustrated",
  "happy",
  "excited",
  "confused",
  "bored",
  "reflective"
];

function cleanJokeText(text: string) {
  return text
    .trim()
    .replace(/^[`"'“”‘’]+|[`"'“”‘’]+$/g, "")
    .replace(/^\s*[-*•]+\s*/gm, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function isEmotionType(value: string): value is EmotionType {
  return validEmotionTypes.includes(value as EmotionType);
}

function extractJsonObject(text: string): string {
  const cleaned = cleanJokeText(text).replace(/^```json|^```|```$/gm, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1 || end < start) {
    return cleaned;
  }

  return cleaned.slice(start, end + 1);
}

function safeParseEmotionClassification(text: string): EmotionClassification | null {
  try {
    const parsed = JSON.parse(extractJsonObject(text)) as {
      emotions?: Array<{ type?: string; intensity?: number }>;
    };

    if (!Array.isArray(parsed.emotions)) {
      return null;
    }

    const emotions = parsed.emotions
      .map((emotion) => {
        const type = emotion.type?.toLowerCase().trim();
        const intensity = emotion.intensity;

        if (!type || !isEmotionType(type) || typeof intensity !== "number") {
          return null;
        }

        return {
          type,
          intensity: Math.max(0, Math.min(1, intensity))
        };
      })
      .filter((emotion): emotion is EmotionScore => emotion !== null)
      .sort((left, right) => right.intensity - left.intensity)
      .slice(0, 3);

    return { emotions };
  } catch (error) {
    console.error("Emotion JSON parsing failed:", error);
    return null;
  }
}

async function classifyEmotions(input: string): Promise<EmotionClassification> {
  const fallback = { emotions: [] };

  if (!client) {
    return fallback;
  }

  try {
    const response = await client.responses.create({
      model: "gpt-5",
      input: [
        {
          role: "system",
          content: `Analyze the user's emotional state.

Input: ${input}

Detect up to 3 emotions from:
tired, overwhelmed, sad, frustrated, happy, excited, confused, bored, reflective

For each emotion:
- assign an intensity between 0 and 1
- 1 = very strong emotion
- 0.3 = mild

Rules:
- Return ONLY valid JSON
- Max 3 emotions
- Sort by intensity (highest first)

Output format:
{
  "emotions": [
    { "type": "...", "intensity": 0.0 }
  ]
}`
        }
      ]
    });

    const parsed = safeParseEmotionClassification(response.output_text);

    if (!parsed) {
      console.warn("Emotion classification returned invalid JSON. Falling back to empty list.");
      return fallback;
    }

    return parsed;
  } catch (error) {
    console.error("Emotion classification failed:", error);
    return fallback;
  }
}

function selectPromptTypeFromEmotions(classification: EmotionClassification): PromptType {
  const primaryEmotion = classification.emotions[0];

  if (!primaryEmotion) {
    console.log("Selected prompt type: gold (fallback, no classified emotions)");
    return "gold";
  }

  switch (primaryEmotion.type) {
    case "tired":
    case "sad":
      console.log(`Selected prompt type: cozy (primary emotion: ${primaryEmotion.type})`);
      return "cozy";
    case "overwhelmed":
    case "confused":
      console.log(`Selected prompt type: relatable (primary emotion: ${primaryEmotion.type})`);
      return "relatable";
    case "happy":
    case "excited":
      console.log(`Selected prompt type: clever (primary emotion: ${primaryEmotion.type})`);
      return "clever";
    case "reflective":
      console.log(`Selected prompt type: personalized (primary emotion: ${primaryEmotion.type})`);
      return "personalized";
    default:
      console.log(`Selected prompt type: gold (primary emotion: ${primaryEmotion.type})`);
      return "gold";
  }
}

function getPromptEmotionContext(classification: EmotionClassification): PromptEmotionContext {
  const [primaryEmotion, secondaryEmotion] = classification.emotions;

  return {
    primaryEmotion,
    secondaryEmotion
  };
}

function buildEmotionSection({ primaryEmotion, secondaryEmotion }: PromptEmotionContext): string {
  if (!primaryEmotion) {
    return "";
  }

  const lines = [
    "The user feels:",
    `- ${primaryEmotion.type} (intensity: ${primaryEmotion.intensity.toFixed(1)})`
  ];

  if (secondaryEmotion) {
    lines.push(`- ${secondaryEmotion.type} (intensity: ${secondaryEmotion.intensity.toFixed(1)})`);
  }

  return `\n\n${lines.join("\n")}`;
}

function buildIntensityGuidance({ primaryEmotion, secondaryEmotion }: PromptEmotionContext): string {
  if (!primaryEmotion) {
    return "";
  }

  const toneRule =
    primaryEmotion.intensity > 0.8
      ? "- The primary emotion is strong, so use very gentle, comforting humor and avoid strong jokes or sarcasm"
      : primaryEmotion.intensity >= 0.4
        ? "- The emotion intensity is moderate, so use balanced humor that feels supportive with a light joke"
        : "- The emotion intensity is mild, so you can allow slightly more playful or witty humor while staying kind";

  if (!secondaryEmotion) {
    return `\n\nTone guidance:\n${toneRule}\n- Let the primary emotion drive the overall tone`;
  }

  return `\n\nTone guidance:\n${toneRule}\n- Let the primary emotion drive the overall tone\n- Subtly incorporate the secondary emotion as nuance, like the user is ${primaryEmotion.type} but also ${secondaryEmotion.type}`;
}

function getGoldPrompt(input: string, context: PromptEmotionContext) {
  const emotionSection = buildEmotionSection(context);
  const intensityGuidance = buildIntensityGuidance(context);

  return `You are a warm, emotionally intelligent, and witty assistant.

Task:
Generate a short, kind, and relatable joke based on the user's mood.

User mood:
"${input}"${emotionSection}${intensityGuidance}

Guidelines:
- Keep it 1-2 lines maximum
- Make it feel specific to the mood (not generic)
- Use gentle, comforting humor (not sarcasm or harsh jokes)
- Make it relatable to everyday life
- Add a subtle emoji only if it fits naturally

Tone:
- Supportive, soft, slightly playful
- Feels like a friend cheering you up

Avoid:
- Generic jokes
- Internet meme cliches
- Overly dramatic or negative humor

Output:
Return ONLY the joke text (no explanations, no quotes).`;
}

function getCozyPrompt(input: string, context: PromptEmotionContext) {
  const emotionSection = buildEmotionSection(context);
  const intensityGuidance = buildIntensityGuidance(context);

  return `You are a cozy, kind, slightly playful companion.

User mood:
"${input}"${emotionSection}${intensityGuidance}

Task:
Write a soft, comforting, slightly funny line that brings a small smile.

Guidelines:
- Keep it gentle and warm
- Avoid loud or exaggerated humor
- Feel like a quiet, cozy observation
- Optional: one soft emoji

Length:
1-2 lines max

Output:
Only the joke text.`;
}

function getRelatablePrompt(input: string, context: PromptEmotionContext) {
  const emotionSection = buildEmotionSection(context);
  const intensityGuidance = buildIntensityGuidance(context);

  return `You are writing a small, comforting joke that makes someone feel seen.

User mood:
"${input}"${emotionSection}${intensityGuidance}

Instructions:
- Turn this mood into a VERY relatable everyday situation
- Then add a light, humorous twist
- Make the user feel understood first, then amused

Constraints:
- Max 2 lines
- Keep it simple and natural
- No sarcasm or negativity

Style example:
"You're so tired even your coffee needs coffee ☕"

Output:
Only the final joke.`;
}

function getCleverPrompt(input: string, context: PromptEmotionContext) {
  const emotionSection = buildEmotionSection(context);
  const intensityGuidance = buildIntensityGuidance(context);

  return `You are a witty but kind humor writer.

User mood:
"${input}"${emotionSection}${intensityGuidance}

Task:
Create a clever, relatable joke that lightly reflects this mood.

Guidelines:
- Add a small unexpected twist
- Keep it kind and not sarcastic
- Make it feel fresh and slightly clever

Length:
1-2 lines

Output:
Only the joke.`;
}

function getPersonalizedPrompt(input: string, context: PromptEmotionContext) {
  const emotionSection = buildEmotionSection(context);
  const intensityGuidance = buildIntensityGuidance(context);

  return `You are writing a personalized, mood-aware joke.

User input:
"${input}"${emotionSection}${intensityGuidance}

Task:
- Extract the emotional tone from the input
- Reflect it back in a relatable way
- Add a gentle, humorous twist

Guidelines:
- Avoid generic phrasing
- Make it feel like it was written just for this person
- Keep it short and natural

Output:
Only the joke text.`;
}

function buildPrompt(type: string, input: string, emotions: EmotionClassification): string {
  const context = getPromptEmotionContext(emotions);

  switch (type) {
    case "cozy":
      return getCozyPrompt(input, context);
    case "relatable":
      return getRelatablePrompt(input, context);
    case "clever":
      return getCleverPrompt(input, context);
    case "personalized":
      return getPersonalizedPrompt(input, context);
    case "gold":
    default:
      return getGoldPrompt(input, context);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as JokeRequest;
    const mood = body.mood?.trim();

    if (!mood) {
      return NextResponse.json({ error: "Mood is required." }, { status: 400 });
    }

    if (!client) {
      console.error("OpenAI joke generation failed: OPENAI_API_KEY is not configured.");
      return NextResponse.json({ joke: generateMoodJoke(mood).joke });
    }

    try {
      const emotions = await classifyEmotions(mood);
      const promptType = selectPromptTypeFromEmotions(emotions);
      const prompt = buildPrompt(promptType, mood, emotions);

      const response = await client.responses.create({
        model: "gpt-5",
        input: [
          {
            role: "system",
            content: prompt
          }
        ]
      });

      const joke = cleanJokeText(response.output_text);

      if (!joke) {
        console.error("OpenAI joke generation failed: model returned empty output.");
        return NextResponse.json({ joke: generateMoodJoke(mood).joke });
      }

      return NextResponse.json({ joke });
    } catch (error) {
      console.error("OpenAI joke generation failed:", error);
      return NextResponse.json({ joke: generateMoodJoke(mood).joke });
    }
  } catch (error) {
    console.error("Joke route failed:", error);

    return NextResponse.json(
      { error: "Unable to generate a joke right now. Please try again." },
      { status: 500 }
    );
  }
}
