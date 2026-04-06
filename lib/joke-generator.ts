type JokeResult = {
  joke: string;
  moodLabel: string;
};

const moodBuckets = {
  happy: {
    keywords: ["happy", "great", "good", "excited", "joyful", "amazing", "awesome"],
    jokes: [
      "You're so upbeat today, even your to-do list asked if it could come to brunch.",
      "That happy mood is strong. If sunshine had a stand-in, it would probably borrow your schedule.",
      "You're glowing so much today, even your coffee thinks it's just here for emotional support."
    ]
  },
  tired: {
    keywords: ["tired", "sleepy", "exhausted", "drained", "burned out", "worn out"],
    jokes: [
      "You're not tired, you're just running on deluxe battery saver mode.",
      "If yawning burned calories, you'd be the athlete of the week.",
      "Your energy today has one browser tab open, and it's buffering."
    ]
  },
  stressed: {
    keywords: ["stressed", "anxious", "overwhelmed", "frazzled", "tense", "worried"],
    jokes: [
      "Your stress tried to schedule a meeting, but your sense of humor marked it as optional.",
      "Being overwhelmed is just your brain opening 47 tabs and calling it multitasking.",
      "If tension were a sport, at least you'd already be warmed up."
    ]
  },
  sad: {
    keywords: ["sad", "down", "blue", "lonely", "upset", "heartbroken"],
    jokes: [
      "Even cloudy moods deserve a silver lining and maybe a snack the size of optimism.",
      "Feeling blue is rough, but at least blue is a premium color.",
      "Some days are soft and heavy. That just means your feelings came wrapped in a weighted blanket."
    ]
  },
  calm: {
    keywords: ["calm", "peaceful", "content", "relaxed", "balanced", "fine"],
    jokes: [
      "You're so calm today, even your inner monologue is speaking in library voice.",
      "That peaceful energy is powerful. Somewhere, a candle is trying to be more like you.",
      "You're radiating such calm that even your notifications seem too polite to interrupt."
    ]
  },
  silly: {
    keywords: ["silly", "goofy", "playful", "weird", "random", "chaotic"],
    jokes: [
      "You're in such a goofy mood, even your socks are considering improv.",
      "That chaotic sparkle means the universe should probably hide the glitter.",
      "Your vibe today says, 'What if we took this very seriously... but in a funny hat?'"
    ]
  }
} as const;

const defaultJokes = [
  "That mood has layers, like an onion that also tells excellent dad jokes.",
  "Your feelings sound complex, but luckily humor accepts all emotional file formats.",
  "Whatever the vibe is today, at least your sense of humor still showed up in comfy clothes."
];

function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function normalizeMood(input: string) {
  return input.toLowerCase();
}

export function generateMoodJoke(input: string): JokeResult {
  const normalizedInput = normalizeMood(input);

  for (const [moodLabel, config] of Object.entries(moodBuckets)) {
    const matchesMood = config.keywords.some((keyword) => normalizedInput.includes(keyword));

    if (matchesMood) {
      return {
        joke: pickRandom(config.jokes),
        moodLabel
      };
    }
  }

  return {
    joke: pickRandom(defaultJokes),
    moodLabel: "mixed"
  };
}
