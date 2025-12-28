
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Feedback, VocabularyPracticeTarget, PronunciationFeedback, Language } from '../types';

const getAI = () => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const RANDOM_THEMES = [
  "Daily routine and morning habits",
  "At the supermarket buying groceries",
  "Ordering food and drinks at a local restaurant",
  "Talking about family members and home life",
  "Common hobbies like reading, sports, or music",
  "Weather, seasons, and what to wear",
  "Simple directions and getting around the city",
  "Describing your house and furniture",
  "Talking about school, work, or daily tasks",
  "Plans for the weekend and free time",
  "Basic health, feeling well, and visiting a pharmacy",
  "Expressing simple emotions and feelings",
  "Colors, numbers, and telling the time",
  "Common animals and household pets",
  "Traveling by bus, train, or taxi",
  "Buying clothes and shopping for essentials",
  "Meeting new people and basic introductions",
  "A walk in the park or nature",
  "Daily objects found in a kitchen or bedroom",
  "Simple polite phrases and social interactions"
];

export const generateParagraph = async (topic: string, language: Language, previousParagraph?: string): Promise<string> => {
  try {
    const ai = getAI();
    const salt = Math.random().toString(36).substring(7);
    const chosenTheme = (topic.includes("Random") || topic === "Surprise Me")
      ? RANDOM_THEMES[Math.floor(Math.random() * RANDOM_THEMES.length)] 
      : topic;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a ${language} language teacher for absolute beginners. 
      Generate a SHORT (2-3 sentences) paragraph using very common, high-frequency vocabulary.
      
      LANGUAGE: ${language}
      TOPIC: ${chosenTheme}
      RANDOM SEED: ${salt}
      
      CRITICAL INSTRUCTIONS:
      1. Use ONLY the ${language} script.
      2. Use SIMPLE, everyday words that a beginner would learn first.
      3. If Hebrew: You MUST include niqqud (vowel points) to help the learner.
      4. DO NOT include any English translations or phonetic guides in the 'paragraph' field.
      5. The text must be natural but extremely simple.
      ${previousParagraph ? `6. It MUST be different from: ${previousParagraph}` : ''}`,
      config: {
        thinkingConfig: { thinkingBudget: 0 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            paragraph: { type: Type.STRING, description: `The simple paragraph in ${language} script.` },
          },
          required: ["paragraph"],
        },
      },
    });

    const result = JSON.parse(response.text);
    return result.paragraph;
  } catch (error) {
    console.error("Error generating paragraph:", error);
    throw new Error("Could not generate a paragraph.");
  }
};

export const checkTranslation = async (targetText: string, userTranslation: string, language: Language): Promise<Feedback> => {
  try {
    const ai = getAI();
    // Special instruction for Hebrew to include Thai translation on a NEW LINE
    const languageInstruction = language === 'Hebrew' 
      ? `Language: Hebrew. Provide translations in English, followed by a newline character (\n), then the Thai translation.` 
      : `Language: ${language}.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `${languageInstruction}\nTarget Text: "${targetText}"\nStudent's English Translation: "${userTranslation}"\nCheck correctness and extract 3-5 vocab items from the text.`,
      config: {
        thinkingConfig: { thinkingBudget: 0 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isCorrect: { type: Type.BOOLEAN },
            feedback: { type: Type.STRING },
            correctTranslation: { type: Type.STRING, description: "The translation. If Hebrew, put English and Thai on separate lines using \\n." },
            vocabulary: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING, description: `The ${language} word in its native script` },
                  english: { type: Type.STRING, description: `The meaning. If Hebrew, English and Thai must be on separate lines using \\n.` }
                },
                required: ["word", "english"]
              }
            }
          },
          required: ["isCorrect", "feedback", "correctTranslation", "vocabulary"],
        },
      },
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error checking translation:", error);
    throw new Error("Could not get feedback.");
  }
};

export const checkWordTranslation = async (targetWord: string, userTranslation: string, language: Language): Promise<{ isCorrect: boolean, feedback: string, correctMeaning: string }> => {
  try {
    const ai = getAI();
    const languageInstruction = language === 'Hebrew' 
      ? `Language: Hebrew. Correct meaning should include English, then a newline (\\n), then Thai.` 
      : `Language: ${language}.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `${languageInstruction}\nEvaluate word "${targetWord}" vs English translation "${userTranslation}".`,
      config: {
        thinkingConfig: { thinkingBudget: 0 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isCorrect: { type: Type.BOOLEAN },
            feedback: { type: Type.STRING },
            correctMeaning: { type: Type.STRING, description: `The meaning. If Hebrew, English and Thai on separate lines using \\n.` }
          },
          required: ["isCorrect", "feedback", "correctMeaning"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error checking word translation:", error);
    throw new Error("Could not check word translation.");
  }
};

export const generateSpeech = async (text: string, language: Language): Promise<string> => {
  try {
    const ai = getAI();
    // Puck for Hebrew, Kore for Thai.
    const voiceName = language === 'Thai' ? 'Kore' : 'Puck';
    
    // We use a more explicit instruction to force the model into audio modality.
    const prompt = `Please say the following ${language} text clearly and naturally: ${text}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });
    
    if (!response.candidates || response.candidates.length === 0) {
      throw new Error("The AI model returned no results. This might be due to safety filters or a temporary issue.");
    }

    const candidate = response.candidates[0];
    
    // Defensive check for candidate content
    if (!candidate.content || !candidate.content.parts) {
      // Sometimes responses are blocked for safety reasons (e.g. if the model hallucinates something inappropriate)
      const finishReason = (candidate as any).finishReason || "UNKNOWN";
      throw new Error(`The model failed to generate speech content. Reason: ${finishReason}`);
    }

    // Iterate through all parts to find the inlineData containing audio.
    for (const part of candidate.content.parts) {
      if (part.inlineData && part.inlineData.data) {
        return part.inlineData.data;
      }
    }

    // If we have text but no audio, the model decided to chat instead of speak
    const textPart = candidate.content.parts.find(p => p.text);
    if (textPart) {
      throw new Error(`The model returned text instead of audio: "${textPart.text.substring(0, 50)}..."`);
    }

    throw new Error("The API response did not contain any audio data.");
  } catch (error: any) {
    console.error("Error generating speech:", error);
    // Return a more user-friendly message if possible
    throw new Error(error.message || "Speech generation failed.");
  }
};

export const generatePracticeWord = async (topic: string, language: Language, previousWord?: string): Promise<VocabularyPracticeTarget> => {
  try {
    const ai = getAI();
    const salt = Math.random().toString(36).substring(7);
    const chosenTheme = (topic.includes("Random") || topic === "Surprise Me")
      ? RANDOM_THEMES[Math.floor(Math.random() * RANDOM_THEMES.length)] 
      : topic;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate exactly one unique, high-frequency everyday word or very common phrase in ${language} for the topic: ${chosenTheme}.
      
      CRITICAL: 
      1. Choose words that are essential for basic daily conversation.
      2. The 'word' field MUST be in ${language} script only.
      3. If Hebrew: You MUST include niqqud (vowels) in the 'word' field. Also provide Thai translation in the 'english' field on a separate line using \\n.
      4. Provide a clear phonetic guide in latin characters in the 'phonetic' field.
      
      Random Seed: ${salt}
      ${previousWord ? `MUST be different from: ${previousWord}` : ''}`,
      config: {
        thinkingConfig: { thinkingBudget: 0 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING, description: `The common word in ${language} native script` },
            phonetic: { type: Type.STRING },
            english: { type: Type.STRING, description: `Meaning. If Hebrew, English and Thai on separate lines using \\n.` }
          },
          required: ["word", "phonetic", "english"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error generating practice word:", error);
    throw new Error("Could not generate a word.");
  }
};

export const evaluatePronunciation = async (targetWord: string, audioBase64: string, mimeType: string, language: Language): Promise<PronunciationFeedback> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { mimeType, data: audioBase64 } },
          { text: `Evaluate the pronunciation of the ${language} word: "${targetWord}". Provide specific feedback on tones (if Thai) or vowels/accents (if Hebrew). 
          IMPORTANT: Return the score as an INTEGER between 0 and 100.` }
        ]
      },
      config: {
        thinkingConfig: { thinkingBudget: 0 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER, description: "Pronunciation score from 0 to 100." },
            feedback: { type: Type.STRING },
            tips: { type: Type.STRING }
          },
          required: ["score", "feedback", "tips"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error evaluating pronunciation:", error);
    throw new Error("Pronunciation evaluation failed.");
  }
};
