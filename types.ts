
export type Language = 'Thai' | 'Hebrew';

export interface VocabularyItem {
  word: string; // The foreign word in its native script
  english: string;
}

export interface Feedback {
  isCorrect: boolean;
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
}

export interface PronunciationFeedback {
  score: number;
  feedback: string;
  tips: string;
}
