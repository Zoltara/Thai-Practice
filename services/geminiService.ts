
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Feedback, VocabularyPracticeTarget, PronunciationFeedback, Language } from '../types';

/**
 * Robust JSON extraction from AI responses.
 */
const safeParseJSON = (text: string) => {
  if (!text) throw new Error("Empty response from AI");
  
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  const firstBracket = text.indexOf('[');
  const lastBracket = text.lastIndexOf(']');

  let start = -1;
  let end = -1;

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    start = firstBrace;
    end = lastBrace;
  } else if (firstBracket !== -1) {
    start = firstBracket;
    end = lastBracket;
  }

  if (start === -1 || end === -1 || end <= start) {
    const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
    try {
      return JSON.parse(cleaned);
    } catch (e) {
      console.error("Final JSON Parse Error. Raw text:", text);
      throw new Error("AI response was not in a valid format");
    }
  }

  const jsonString = text.substring(start, end + 1);
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    console.error("Substring JSON Parse Error. Extracted string:", jsonString);
    throw new Error("Failed to parse AI response");
  }
};

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let delay = 1000;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      const status = error?.status || error?.error?.code;
      let errorMessage = error?.message || "";
      
      const isQuotaExceeded = status === 429 || errorMessage.toLowerCase().includes("quota");
      
      if (errorMessage.includes("Requested entity was not found")) {
        if (typeof window !== 'undefined' && (window as any).aistudio?.openSelectKey) {
          (window as any).aistudio.openSelectKey();
        }
      }
      
      if (i === maxRetries - 1 || (!isQuotaExceeded && status !== 500 && status !== 503)) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
  throw new Error("Service is temporarily unavailable. Please try again.");
}

const RANDOM_THEMES = [
  "Daily routine", "At the supermarket", "Ordering food", "Family members", "Hobbies", "Weather", "Directions", "House", "Work tasks", "Socializing", "Health", "Tech", "Nature", "Emotions", "City Life"
];

const SYSTEM_INSTRUCTION = `You are a world-class language tutor for Thai and Hebrew. Beginner level.

CONTENT RULES:
- The 'paragraph' and 'word' fields MUST contain ONLY the target language script (Thai or Hebrew).
- NEVER include English translations or explanations inside the 'paragraph' or 'word' fields. 
- All translations MUST go into 'correctTranslation' or 'english' fields.

CRITICAL - NO REPETITION:
- ABSOLUTELY NEVER generate any content that appears in the exclusion list provided (the EXCLUDE list).
- Each sentence and word MUST be unique and different from all previous items.
- Check thoroughly against the exclusion list before generating any content.

STRICT MODE RULES:
1. Thai mode: Use ONLY Thai and English. NEVER mention Hebrew.
2. Hebrew mode: ALWAYS include English AND Thai translations for EVERYTHING (feedback and meanings).

FORMATTING RULES (IMPORTANT):
- For Hebrew mode: The 'feedback', 'correctTranslation', and 'correctMeaning' fields MUST contain the English version on line 1 and the Thai version on line 2 (separated by \\n). 
- For Thai mode: Use English only for explanations.

HEBREW SCRIPT:
- ALWAYS include Niqqud (vowel points) in ALL Hebrew text.

OUTPUT: Exactly ONE valid JSON object.`;

export const generateParagraph = async (topic: string, language: Language, history: string[]): Promise<{ paragraph: string, phonetic: string }> => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
    const chosenTheme = (topic.includes("Random") || topic === "Surprise Me") ? RANDOM_THEMES[Math.floor(Math.random() * RANDOM_THEMES.length)] : topic;
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate ONE Beginner ${language} sentence about: ${chosenTheme}. EXCLUDE: [${history.slice(-10).join(", ")}].

CRITICAL RULES:
- 'paragraph' field: ONLY ${language} script. NO English. NO translations.
- 'phonetic' field: ONLY romanized pronunciation/transliteration. NO English meaning. NO translations.
- DO NOT include any translations anywhere - the user must guess the meaning.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: { 
            paragraph: { type: Type.STRING },
            phonetic: { type: Type.STRING }
          },
          required: ["paragraph", "phonetic"],
        },
      },
    });
    
    const result = safeParseJSON(response.text);
    
    // Clean up paragraph - language-aware filtering
    let cleanParagraph = result.paragraph
      .split('\n')[0]
      .replace(/\(.*?\)/g, '')
      .replace(/\[.*?\]/g, '')
      .replace(/[a-zA-Z]/g, ''); // Remove any English letters
    
    // Remove the wrong language characters
    if (language === 'Hebrew') {
      cleanParagraph = cleanParagraph.replace(/[\u0E00-\u0E7F]/g, ''); // Remove Thai if Hebrew mode
    } else if (language === 'Thai') {
      cleanParagraph = cleanParagraph.replace(/[\u0590-\u05FF]/g, ''); // Remove Hebrew if Thai mode
    }
    cleanParagraph = cleanParagraph.trim();
    
    // Clean up phonetic - keep only romanization, remove translations
    let cleanPhonetic = result.phonetic
      .split(/[-–—=:\n]/)[0] // Take only the first part before any separator
      .replace(/[\u0590-\u05FF]/g, '') // Remove Hebrew characters
      .replace(/[\u0E00-\u0E7F]/g, '') // Remove Thai characters
      .trim();
    
    return { 
      paragraph: cleanParagraph, 
      phonetic: cleanPhonetic 
    };
  });
};

export const checkTranslation = async (
  targetText: string,
  userTranslation: string,
  language: Language
): Promise<Feedback> => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
    const isHelp = userTranslation === "[REQUEST_HELP_REVEAL_ANSWER]";

    const contents = isHelp
      ? `Provide translation for "${targetText}" in ${language}. For Hebrew mode, include English and Thai versions on separate lines.`
      : `Check student translation for "${targetText}" in ${language}. Student said: "${userTranslation}". For Hebrew, feedback must include English and Thai lines.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isCorrect: { type: Type.BOOLEAN },
            status: { type: Type.STRING, enum: ["correct", "partial", "wrong"] },
            feedback: { type: Type.STRING },
            correctTranslation: { type: Type.STRING },
            vocabulary: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING },
                  phonetic: { type: Type.STRING },
                  english: { type: Type.STRING },
                  thai: { type: Type.STRING }
                },
                required: ["word", "english", "phonetic"]
              }
            }
          },
          required: ["isCorrect", "status", "feedback", "correctTranslation", "vocabulary"]
        }
      }
    });

    return safeParseJSON(response.text);
  });
};

export const checkWordTranslation = async (
  targetWord: string,
  userTranslation: string,
  language: Language
): Promise<{ isCorrect: boolean, status: 'correct' | 'partial' | 'wrong', feedback: string, correctMeaning: string }> => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Evaluate student meaning for "${targetWord}" (${language}). Student input: "${userTranslation}". For Hebrew, respond with English and Thai on separate lines for BOTH feedback and correctMeaning.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isCorrect: { type: Type.BOOLEAN },
            status: { type: Type.STRING, enum: ['correct' , 'partial' , 'wrong'] },
            feedback: { type: Type.STRING },
            correctMeaning: { type: Type.STRING }
          },
          required: ["isCorrect", "status", "feedback", "correctMeaning"]
        }
      }
    });
    return safeParseJSON(response.text);
  });
};

// Hebrew speech using browser's Web Speech API (Gemini TTS doesn't support Hebrew well)
export const speakHebrew = (text: string, volume: number = 1): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('Speech synthesis not supported'));
      return;
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'he-IL';
    utterance.volume = volume;
    utterance.rate = 0.9;
    
    // Try to find a Hebrew voice
    const voices = speechSynthesis.getVoices();
    const hebrewVoice = voices.find(v => v.lang.startsWith('he'));
    if (hebrewVoice) {
      utterance.voice = hebrewVoice;
    }
    
    utterance.onend = () => resolve();
    utterance.onerror = (e) => reject(e);
    
    speechSynthesis.speak(utterance);
  });
};

// Streaming speech generation - plays audio chunks as they arrive for lower latency
export const generateSpeechStream = async (
  text: string, 
  language: Language, 
  voice: string = 'Kore',
  onAudioChunk: (base64: string) => void
): Promise<void> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  
  // Clean text - remove parentheses content and brackets
  let cleanText = text.replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '').trim();
  
  if (!cleanText) throw new Error("No speakable text remaining after cleaning.");

  const stream = await ai.models.generateContentStream({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: cleanText }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
    },
  });

  for await (const chunk of stream) {
    const audioPart = chunk.candidates?.[0]?.content?.parts?.find(
      p => p.inlineData?.mimeType?.startsWith('audio/')
    );
    if (audioPart?.inlineData?.data) {
      onAudioChunk(audioPart.inlineData.data);
    }
  }
};

export const generateSpeech = async (text: string, language: Language, voice: string = 'Kore'): Promise<string> => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
    
    // Clean text - remove parentheses content and brackets
    let cleanText = text.replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '').trim();
    
    // For both languages, just use the cleaned text directly
    // The AI generated it, so it should be valid
    if (!cleanText) throw new Error("No speakable text remaining after cleaning.");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: cleanText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
      },
    });
    
    const candidate = response.candidates?.[0];
    if (!candidate) {
      throw new Error("The voice assistant failed to respond. Please try again.");
    }

    const audioPart = candidate.content?.parts?.find(p => p.inlineData?.mimeType.startsWith('audio/'));
    const audioData = audioPart?.inlineData?.data;

    if (!audioData) {
        const textReason = candidate.content?.parts?.find(p => p.text)?.text;
        if (candidate.finishReason && candidate.finishReason !== 'STOP') {
           throw new Error(`Speech engine refused: ${candidate.finishReason}. The content might be flagged incorrectly.`);
        }
        throw new Error(textReason || "The speech generator could not process this specific text. Try skipping to the next one.");
    }
    return audioData;
  });
};

export const generatePracticeWord = async (topic: string, language: Language, history: string[]): Promise<VocabularyPracticeTarget> => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
    const chosenTheme = (topic.includes("Random") || topic === "Surprise Me") ? RANDOM_THEMES[Math.floor(Math.random() * RANDOM_THEMES.length)] : topic;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate ONE new ${language} word/phrase for: ${chosenTheme}. EXCLUDE: [${history.slice(-10).join(", ")}]. ENSURE NO ENGLISH IS IN THE WORD FIELD.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING },
            phonetic: { type: Type.STRING },
            english: { type: Type.STRING },
            thai: { type: Type.STRING }
          },
          required: ["word", "phonetic", "english"]
        }
      }
    });
    return safeParseJSON(response.text);
  });
};

export const evaluatePronunciation = async (targetWord: string, audioBase64: string, mimeType: string, language: Language): Promise<PronunciationFeedback> => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { mimeType, data: audioBase64 } },
          { text: `Analyze pronunciation of "${targetWord}" in ${language}. Score 0-100. For Hebrew, include English and Thai tips on separate lines.` }
        ]
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            feedback: { type: Type.STRING },
            tips: { type: Type.STRING }
          },
          required: ["score", "feedback", "tips"]
        }
      }
    });
    return safeParseJSON(response.text);
  });
};
