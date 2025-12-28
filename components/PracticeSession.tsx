
import React, { useState } from 'react';
import { Feedback, VocabularyItem, Language } from '../types';
import FeedbackDisplay from './FeedbackDisplay';
import ProgressBar from './ProgressBar';
import VocabularyList from './VocabularyList';
import { SpeakerIcon } from './icons/SpeakerIcon';
import { ListBulletIcon } from './icons/ListBulletIcon';

interface PracticeSessionProps {
  topic: string;
  language: Language;
  currentParagraph: string;
  feedback: Feedback | null;
  isLoading: boolean;
  isAudioLoading: boolean;
  error: string | null;
  userTranslation: string;
  setUserTranslation: (value: string) => void;
  onSubmit: () => void;
  onHelp: () => void;
  onNext: () => void;
  onSkip: () => void;
  onListen: () => void;
  progressCount: number;
  totalParagraphs: number;
  dictionary: VocabularyItem[];
  onToggleDictionaryWord: (item: VocabularyItem) => void;
}

const LoadingSpinner: React.FC = () => (
  <div className="absolute inset-0 bg-slate-800 bg-opacity-50 flex items-center justify-center rounded-xl z-20">
    <div className="w-12 h-12 border-4 border-t-cyan-400 border-r-cyan-400 border-b-cyan-400 border-l-transparent rounded-full animate-spin"></div>
  </div>
);

const PracticeSession: React.FC<PracticeSessionProps> = ({
  topic,
  language,
  currentParagraph,
  feedback,
  isLoading,
  isAudioLoading,
  error,
  userTranslation,
  setUserTranslation,
  onSubmit,
  onHelp,
  onNext,
  onSkip,
  onListen,
  progressCount,
  totalParagraphs,
  dictionary,
  onToggleDictionaryWord,
}) => {
  const [showVocabulary, setShowVocabulary] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!feedback) {
        onSubmit();
      }
    }
  };

  const handleNextParagraph = () => {
    setShowVocabulary(false);
    onNext();
  };

  const isRTL = language === 'Hebrew';
  const langFont = language === 'Thai' ? 'font-thai' : 'font-hebrew';

  return (
    <div className="relative animate-fade-in">
      <div className="mb-6">
        <ProgressBar current={progressCount} total={totalParagraphs} label="Item" />
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-sm text-slate-400">Practice &bull; {language}</p>
          <h2 className="text-2xl font-semibold text-cyan-400">{topic}</h2>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-base font-medium text-slate-400">
              {language} Content:
            </label>
            <div className="flex gap-2">
              <button
                onClick={onListen}
                disabled={isAudioLoading || isLoading || !currentParagraph}
                className="flex items-center gap-2 text-base px-4 py-2 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAudioLoading ? (
                  <span className="w-5 h-5 border-2 border-t-slate-400 border-r-slate-400 border-b-slate-400 border-l-transparent rounded-full animate-spin"></span>
                ) : (
                  <SpeakerIcon className="w-5 h-5" />
                )}
                <span>Listen</span>
              </button>
            </div>
          </div>
          <div className="bg-slate-900/70 p-6 rounded-lg min-h-[140px] flex items-center justify-center text-center">
            <p 
              className={`${langFont} text-2xl md:text-3xl leading-relaxed tracking-wide text-slate-100`}
              dir={isRTL ? "rtl" : "ltr"}
            >
              {currentParagraph || '...'}
            </p>
          </div>
        </div>

        <div>
          <label htmlFor="translation" className="block text-base font-medium text-slate-400 mb-2">
            Your understanding in English:
          </label>
          <textarea
            id="translation"
            value={userTranslation}
            onChange={(e) => setUserTranslation(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type the meaning..."
            rows={3}
            className="w-full bg-slate-700/50 border-2 border-slate-600 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-colors text-slate-200 text-lg disabled:opacity-50"
            disabled={!!feedback || isLoading}
          />
        </div>

        {error && <p className="text-red-400 text-center text-lg">{error}</p>}
        
        {feedback && <FeedbackDisplay feedback={feedback} />}

        {feedback && showVocabulary && (
          <VocabularyList 
            vocabulary={feedback.vocabulary} 
            dictionary={dictionary}
            language={language}
            onToggleWord={onToggleDictionaryWord}
          />
        )}

        <div className="pt-2">
          {feedback ? (
            <div className="flex flex-col sm:flex-row gap-4">
               <button
                onClick={() => setShowVocabulary(!showVocabulary)}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-3 w-full bg-slate-600 hover:bg-slate-500 text-slate-100 font-bold py-4 px-6 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-slate-400 text-lg"
              >
                <ListBulletIcon className="w-6 h-6" />
                <span>{showVocabulary ? 'Hide' : 'View'} Vocabulary</span>
              </button>
              <button
                onClick={handleNextParagraph}
                disabled={isLoading}
                className="flex-1 w-full bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-bold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
              >
                {isLoading ? 'Loading...' : 'Next'}
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={onSkip}
                disabled={isLoading}
                className="px-6 py-4 rounded-lg border-2 border-slate-600 hover:border-slate-500 hover:bg-slate-700/50 text-slate-400 font-bold text-lg transition-all focus:outline-none focus:ring-2 focus:ring-slate-500 disabled:opacity-50"
              >
                Skip
              </button>
              <button
                onClick={onHelp}
                disabled={isLoading}
                className="px-6 py-4 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold text-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 disabled:opacity-50"
              >
                Help me
              </button>
              <button
                onClick={onSubmit}
                disabled={isLoading || !userTranslation.trim()}
                className="flex-grow bg-violet-500 hover:bg-violet-600 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-violet-400 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
              >
                {isLoading ? 'Checking...' : 'Check My Answer'}
              </button>
            </div>
          )}
        </div>
      </div>
      
      {isLoading && <LoadingSpinner />}
    </div>
  );
};

export default PracticeSession;
