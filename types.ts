
export type Language = 'Thai' | 'Hebrew' | 'English';

export interface VocabularyItem {
  word: string; // The foreign word in its native script
  english: string;
  thai?: string; // Optional Thai meaning (used for Hebrew practice)
  phonetic?: string; // Optional pronunciation guide
}

export interface Feedback {
  isCorrect: boolean;
  status?: 'correct' | 'partial' | 'wrong' | 'help';
  feedback: string;
  correctTranslation: string;
  vocabulary: VocabularyItem[];
  isHelpReveal?: boolean;
}

export type PracticeMode = 'reading' | 'speaking' | 'vocabulary';

export interface VocabularyPracticeTarget {
  word: string; // The foreign word in its native script
  phonetic: string;
  english: string;
  thai?: string;
}

export interface PronunciationFeedback {
  score: number;
  feedback: string;
  tips: string;
}

export interface AppSettings {
  volume: number;
  voice: string;
}
