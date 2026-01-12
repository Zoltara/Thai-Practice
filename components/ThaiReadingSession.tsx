
import React, { useState, useRef, useEffect } from 'react';
import { Feedback, VocabularyItem } from '../types';
import ProgressBar from './ProgressBar';
import VocabularyList from './VocabularyList';
import { SpeakerIcon } from './icons/SpeakerIcon';
import { ListBulletIcon } from './icons/ListBulletIcon';

interface ThaiReadingSessionProps {
  topic: string;
  currentParagraph: string;
  currentPhonetic?: string;
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

const ThaiReadingSession: React.FC<ThaiReadingSessionProps> = ({
  topic,
  currentParagraph,
  currentPhonetic,
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [userTranslation]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!feedback) onSubmit();
    }
  };

  const handleNextParagraph = () => {
    setShowVocabulary(false);
    onNext();
  };

  const isHelpState = feedback?.status === 'help' || feedback?.isHelpReveal;
  const showCorrection = feedback && (feedback.status !== 'correct' || isHelpState);

  return (
    <div className="relative animate-fade-in flex flex-col h-full">
      <div className="mb-3 flex-shrink-0">
        <ProgressBar current={progressCount} total={totalParagraphs} label="Item" />
      </div>

      <div className="flex justify-between items-center mb-3 flex-shrink-0">
        <div>
          <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-cyan-500/80">
            Reading Practice Thai
          </p>
          <h2 className="text-lg md:text-xl font-bold text-slate-100 truncate max-w-[200px] md:max-w-none">{topic}</h2>
        </div>
      </div>

      <div className="space-y-4 flex-1 overflow-y-auto flex flex-col px-1">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs md:text-sm font-medium text-slate-400">
              Thai Content:
            </label>
            <div className="flex gap-2">
              <button
                onClick={onListen}
                disabled={isAudioLoading || isLoading || !currentParagraph}
                className="w-10 h-10 md:w-auto md:min-h-12 md:px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-slate-100 transition-colors border-2 border-slate-600 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Listen"
              >
                {isAudioLoading ? (
                  <span className="w-4 h-4 md:w-5 md:h-5 border-2 border-t-slate-400 border-r-slate-400 border-b-slate-400 border-l-transparent rounded-full animate-spin"></span>
                ) : (
                  <SpeakerIcon className="w-5 h-5 md:w-6 md:h-6" />
                )}
                <span className="hidden md:inline text-sm font-bold uppercase tracking-wider">Listen</span>
              </button>
            </div>
          </div>
          <div className="bg-slate-900/70 p-4 md:p-6 rounded-lg min-h-[120px] md:min-h-[160px] flex flex-col items-center justify-center text-center space-y-3">
            <p className="font-thai text-2xl md:text-4xl leading-relaxed tracking-wide text-slate-100">
              {currentParagraph || '...'}
            </p>
            {currentPhonetic && (
               <p className="text-lg md:text-xl text-cyan-400/80 font-medium italic">
                 {currentPhonetic}
               </p>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 space-y-2">
          <label htmlFor="translation" className="block text-xs md:text-sm font-medium text-slate-400">
            Your understanding in English:
          </label>
          <textarea
            id="translation"
            ref={textareaRef}
            value={userTranslation}
            onChange={(e) => setUserTranslation(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type meaning..."
            rows={1}
            className="w-full bg-slate-700/50 border-2 border-slate-600 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-colors text-slate-200 text-sm md:text-lg disabled:opacity-50 resize-none overflow-hidden box-border"
            disabled={!!feedback || isLoading}
          />
        </div>

        {error && <p className="text-red-400 text-center text-sm md:text-base flex-shrink-0">{error}</p>}
        
        {feedback && (
          <div className={`flex-shrink-0 bg-slate-900/70 rounded-xl p-6 border-l-4 animate-fade-in-up ${
            isHelpState ? 'border-blue-500 bg-blue-900/10' :
            feedback.status === 'correct' ? 'border-green-500 bg-green-900/10' :
            feedback.status === 'partial' ? 'border-orange-500 bg-orange-900/10' :
            'border-red-500 bg-red-900/10'
          }`}>
            <div className="flex justify-between items-start mb-2">
              <h3 className={`text-lg font-black uppercase tracking-wider ${
                isHelpState ? 'text-blue-400' :
                feedback.status === 'correct' ? 'text-green-400' :
                feedback.status === 'partial' ? 'text-orange-400' :
                'text-red-400'
              }`}>
                {isHelpState ? 'Help' : 
                 feedback.status === 'correct' ? 'Excellent' : 
                 feedback.status === 'partial' ? 'Nice try' : 
                 'Check answer'}
              </h3>
            </div>
            
            <div className="text-slate-300 text-sm md:text-base mb-4 whitespace-pre-wrap leading-relaxed">
              {feedback.feedback}
            </div>

            {showCorrection && feedback.correctTranslation && (
              <div className="bg-slate-800/80 p-4 rounded-lg border border-slate-700/50">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Correct Translation</span>
                <p className="text-emerald-400 font-bold text-lg md:text-xl whitespace-pre-line leading-relaxed">
                  {feedback.correctTranslation}
                </p>
              </div>
            )}
          </div>
        )}

        {feedback && showVocabulary && (
          <div className="flex-shrink-0">
          <VocabularyList 
            vocabulary={feedback.vocabulary} 
            dictionary={dictionary}
            language="Thai"
            onToggleWord={onToggleDictionaryWord}
          />
          </div>
        )}

        <div className="pt-2 flex-shrink-0 space-y-2 pb-6">
          {feedback ? (
            <div className="flex flex-row gap-2 w-full flex-nowrap">
               <button
                onClick={() => setShowVocabulary(!showVocabulary)}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-1 bg-slate-600 hover:bg-slate-500 text-slate-100 font-bold py-3 px-1.5 rounded-lg transition-all text-[11px] md:text-base whitespace-nowrap"
              >
                <ListBulletIcon className="w-3.5 h-3.5 md:w-5 md:h-5" />
                <span>{showVocabulary ? 'Hide' : 'View'} Vocab</span>
              </button>
              <button
                onClick={handleNextParagraph}
                disabled={isLoading}
                className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-bold py-3 px-1.5 rounded-lg transition-all text-[11px] md:text-base whitespace-nowrap"
              >
                {isLoading ? 'Loading...' : 'Next Item'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 w-full">
              <button
                onClick={onSubmit}
                disabled={isLoading || !userTranslation.trim()}
                className="py-3 px-1 rounded-xl bg-emerald-500/60 text-emerald-200 border-2 border-emerald-300 font-bold text-sm transition-all hover:bg-emerald-500/70 hover:border-emerald-200 active:bg-emerald-500/80 disabled:opacity-50"
              >
                Check
              </button>
              <button
                onClick={onSkip}
                disabled={isLoading}
                className="py-3 px-1 rounded-xl bg-orange-500/20 text-orange-400 border-2 border-orange-500 font-bold text-sm transition-all hover:bg-orange-500/30 hover:border-orange-400 active:bg-orange-500/40 disabled:opacity-50"
              >
                Skip
              </button>
              <button
                onClick={onHelp}
                disabled={isLoading}
                className="py-3 px-1 rounded-xl bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500 font-bold text-sm transition-all hover:bg-yellow-500/30 hover:border-yellow-400 active:bg-yellow-500/40 disabled:opacity-50"
              >
                Help
              </button>
            </div>
          )}
        </div>
      </div>
      
      {isLoading && <LoadingSpinner />}
    </div>
  );
};

export default ThaiReadingSession;
