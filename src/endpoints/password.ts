import { OpenAPIRoute, Str } from "chanfana";
import type { Context } from "hono";
import { z } from "zod";

// Word lists for generating passwords
const NOUNS = [
  "apple", "banana", "battery", "beach", "bird", "book", "bottle", "bridge", "button", "camera",
  "candle", "car", "cat", "chair", "clock", "cloud", "coffee", "coin", "computer", "cookie",
  "cup", "desk", "dog", "door", "earth", "egg", "elephant", "envelope", "fire", "fish",
  "flower", "forest", "fork", "guitar", "hammer", "hat", "horse", "house", "island", "jacket",
  "key", "keyboard", "lamp", "leaf", "lemon", "letter", "light", "lion", "map", "moon",
  "mountain", "mouse", "music", "ocean", "orange", "paper", "pencil", "phone", "piano", "picture",
  "pizza", "planet", "plant", "plate", "river", "road", "robot", "rocket", "sandwich", "ship",
  "shoe", "sky", "snake", "snow", "sock", "spoon", "star", "staple", "sun", "table",
  "tea", "tiger", "train", "tree", "truck", "umbrella", "watch", "water", "window", "zebra"
];

const ADJECTIVES = [
  "adorable", "adventurous", "amazing", "ancient", "angry", "anxious", "beautiful", "better", "big", "bitter",
  "blue", "bold", "brave", "bright", "busy", "calm", "careful", "cheerful", "clean", "clever",
  "colorful", "comfortable", "correct", "crazy", "crispy", "curious", "cute", "dark", "deep", "delicious",
  "different", "difficult", "dizzy", "easy", "elegant", "excited", "famous", "fancy", "fast", "fierce",
  "fluffy", "friendly", "funny", "gentle", "giant", "good", "great", "green", "happy", "heavy",
  "helpful", "hot", "huge", "hungry", "important", "impossible", "incredible", "intelligent", "interesting", "jolly",
  "kind", "large", "lazy", "light", "little", "lively", "lonely", "loud", "lovely", "lucky",
  "magnificent", "mysterious", "narrow", "new", "nice", "noisy", "odd", "old", "orange", "peaceful",
  "perfect", "pink", "polite", "poor", "powerful", "pretty", "purple", "quick", "quiet", "rare",
  "red", "rich", "shy", "silent", "silly", "small", "smart", "smooth", "soft", "sour",
  "spicy", "splendid", "strange", "strong", "sunny", "super", "sweet", "tall", "tiny", "warm"
];

// Function to get a cryptographically secure random item from an array
function getSecureRandomItem<T>(array: T[]): T {
  // Create a Uint32Array with a single slot
  const randomBuffer = new Uint32Array(1);
  
  // Fill the buffer with a cryptographically secure random value
  crypto.getRandomValues(randomBuffer);
  
  // Use modulo to get an index within the array bounds
  const index = randomBuffer[0] % array.length;
  
  return array[index];
}

// Function to generate a password using the XKCD method with secure randomness
function generateXkcdPassword(wordCount: number = 4, separator: string = "-"): string {
  const words: string[] = [];
  
  // Ensure we have at least one adjective and one noun
  words.push(getSecureRandomItem(ADJECTIVES));
  words.push(getSecureRandomItem(NOUNS));
  
  // Add remaining words
  for (let i = 2; i < wordCount; i++) {
    // Alternate between adjectives and nouns
    words.push(i % 2 === 0 ? getSecureRandomItem(ADJECTIVES) : getSecureRandomItem(NOUNS));
  }
  
  return words.join(separator);
}

export class Password extends OpenAPIRoute {
  schema = {
    tags: ["Password"],
    summary: "Generate a random password using the XKCD 'correct horse battery staple' technique",
    description: "Creates a memorable password by combining random words, as popularized by XKCD comic #936",
    parameters: {
      wordCount: z.number().int().min(2).max(10).optional().describe("Number of words to include in the password (default: 4)"),
      separator: Str({ example: "-" }).optional().describe("Character to use between words (default: '-')"),
    },
    responses: {
      "200": {
        description: "Generated password",
        content: {
          "application/json": {
            schema: z.object({
              password: z.string(),
              wordCount: z.number(),
              separator: z.string(),
            }),
          },
        },
      },
    },
  };

  async handle(c: Context) {
    // Get parameters from the request
    const wordCount = c.req.query("wordCount") ? parseInt(c.req.query("wordCount") as string, 10) : 4;
    const separator = c.req.query("separator") || "-";
    
    // Validate parameters
    const validWordCount = Math.min(Math.max(wordCount, 2), 10);
    
    // Generate the password
    const password = generateXkcdPassword(validWordCount, separator);
    
    // Log analytics
    c.env.ANALYTICS.writeDataPoint({
      blobs: ["password_generation"],
      indexes: ["password"],
    });
    
    // Return the generated password
    return c.json({
      password,
      wordCount: validWordCount,
      separator,
    });
  }
}
