import OpenAI from "openai";
import { NextResponse } from "next/server";
import { generateMoodJoke } from "@/lib/joke-generator";

type JokeRequest = {
  mood?: string;
};

type PromptType = "gold" | "cozy" | "relatable" | "clever" | "personalized";

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

function isPromptType(value: string): value is PromptType {
  return validPromptTypes.includes(value as PromptType);
}

function normalizePromptType(text: string): string {
  return cleanJokeText(text)
    .toLowerCase()
    .replace(/[^a-z]/g, " ")
    .trim()
    .split(/\s+/)[0] ?? "";
}

async function selectPromptType(userInput: string): Promise<PromptType> {
  if (!client) {
    console.log('Selected prompt type: gold (fallback, no OpenAI client)');
    return "gold";
  }

  try {
    const response = await client.responses.create({
      model: "gpt-5",
      input: [
        {
          role: "system",
          content: `Select the best prompt style for generating a joke based on the user's mood.

Input: ${userInput}

Available styles:
- gold: balanced, generally good for any mood
- cozy: for tired, low-energy, or soft moods
- relatable: for overwhelmed, anxious, or stressed moods
- clever: for happy, playful, or upbeat moods
- personalized: for specific or nuanced emotional input

Rules:
- Choose the SINGLE best style
- Output ONLY one word from: gold, cozy, relatable, clever, personalized
- Do not explain your choice`
        }
      ]
    });

    const rawType = response.output_text;
    const normalizedType = normalizePromptType(rawType);

    if (isPromptType(normalizedType)) {
      console.log(`Selected prompt type: ${normalizedType}`);
      return normalizedType;
    }

    console.warn(
      `Invalid prompt type from selector: "${cleanJokeText(rawType)}". Falling back to gold.`
    );
    console.log("Selected prompt type: gold");
    return "gold";
  } catch (error) {
    console.error("Prompt type selection failed:", error);
    console.log("Selected prompt type: gold");
    return "gold";
  }
}

function getGoldPrompt(input: string) {
  return `You are a warm, emotionally intelligent, and witty assistant.

Task:
Generate a short, kind, and relatable joke based on the user's mood.

User mood:
"${input}"

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

function getCozyPrompt(input: string) {
  return `You are a cozy, kind, slightly playful companion.

User mood:
"${input}"

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

function getRelatablePrompt(input: string) {
  return `You are writing a small, comforting joke that makes someone feel seen.

User mood:
"${input}"

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

function getCleverPrompt(input: string) {
  return `You are a witty but kind humor writer.

User mood:
"${input}"

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

function getPersonalizedPrompt(input: string) {
  return `You are writing a personalized, mood-aware joke.

User input:
"${input}"

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

function buildPrompt(type: string, input: string): string {
  switch (type) {
    case "cozy":
      return getCozyPrompt(input);
    case "relatable":
      return getRelatablePrompt(input);
    case "clever":
      return getCleverPrompt(input);
    case "personalized":
      return getPersonalizedPrompt(input);
    case "gold":
    default:
      return getGoldPrompt(input);
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
      const promptType = await selectPromptType(mood);
      const prompt = buildPrompt(promptType, mood);

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
