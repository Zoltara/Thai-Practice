
import React, { useState, useRef, useEffect } from 'react';
import { Feedback, VocabularyItem } from '../types';
import ProgressBar from './ProgressBar';
import VocabularyList from './VocabularyList';
import { SpeakerIcon } from './icons/SpeakerIcon';
import { ListBulletIcon } from './icons/ListBulletIcon';
import { stripNiqqud } from '../utils/hebrew';

interface HebrewReadingSessionProps {
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
  showMarkings: boolean;
  onToggleMarkings: () => void;
}

const HebrewReadingSession: React.FC<HebrewReadingSessionProps> = ({
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
  showMarkings,
  onToggleMarkings,
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

  const displayedText = !showMarkings ? stripNiqqud(currentParagraph) : currentParagraph;
  const isHelpState = feedback?.status === 'help' || feedback?.isHelpReveal;
  const showCorrection = feedback && (feedback.status !== 'correct' || isHelpState);

  return (
    <div className="relative animate-fade-in flex flex-col h-full">
      <div className="mb-3 flex-shrink-0">
        <ProgressBar current={progressCount} total={totalParagraphs} label="Item" />
      </div>

      <div className="flex justify-between items-center mb-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-cyan-500/80">Reading Hebrew</p>
          <h2 className="text-lg font-bold text-slate-100 truncate max-w-[200px]">{topic}</h2>
        </div>
      </div>

      <div className="space-y-4 flex-1 overflow-y-auto flex flex-col px-1.5">
        <div>
          <div className="flex flex-col items-center mb-4">
            <div className="flex justify-center gap-3 mt-2">
              <button
                onClick={onToggleMarkings}
                className={`w-10 h-10 md:w-12 md:h-12 rounded-xl transition-all border-2 flex items-center justify-center ${
                    showMarkings ? 'bg-cyan-500 text-slate-900 border-cyan-400' : 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'
                }`}
                title={showMarkings ? 'Hide Vowels' : 'Show Vowels'}
              >
                <span className="font-hebrew text-xl md:text-3xl font-bold leading-none">
                  {showMarkings ? 'א' : 'אָ'}
                </span>
              </button>
              <button
                onClick={onListen}
                disabled={isAudioLoading || isLoading || !currentParagraph}
                className="px-5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors border-2 border-slate-600 flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isAudioLoading ? (
                  <span className="w-4 h-4 border-2 border-t-slate-400 border-r-slate-400 border-b-slate-400 border-l-transparent rounded-full animate-spin"></span>
                ) : (
                  <SpeakerIcon className="w-5 h-5" />
                )}
                <span className="text-xs font-bold uppercase tracking-wider">Listen</span>
              </button>
            </div>
          </div>
          <div className="bg-slate-900/70 p-4 md:p-6 rounded-lg min-h-[120px] flex flex-col items-center justify-center text-center space-y-3">
            <p className="font-hebrew text-2xl md:text-4xl leading-relaxed tracking-wide text-slate-100" dir="rtl">
              {displayedText || '...'}
            </p>
            {currentPhonetic && <p className="text-lg text-cyan-400/80 font-medium italic">{currentPhonetic}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <textarea
            ref={textareaRef}
            value={userTranslation}
            onChange={(e) => setUserTranslation(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your English translation..."
            rows={1}
            className="w-full bg-slate-700/50 border-2 border-slate-600 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-slate-200 text-sm md:text-lg disabled:opacity-50 resize-none overflow-hidden box-border"
            disabled={!!feedback || isLoading}
          />
        </div>

        {error && <p className="text-red-400 text-center text-sm">{error}</p>}
        
        {feedback && (
          <div className={`rounded-xl p-5 border-l-4 animate-fade-in-up ${
            isHelpState ? 'border-blue-500 bg-blue-900/10' :
            feedback.status === 'correct' ? 'border-green-500 bg-green-900/10' :
            feedback.status === 'partial' ? 'border-orange-500 bg-orange-900/10' :
            'border-red-500 bg-red-900/10'
          }`}>
            <div className="flex justify-between items-start mb-2">
              <h3 className={`text-base font-black uppercase tracking-wider ${
                  isHelpState ? 'text-blue-400' :
                  feedback.status === 'correct' ? 'text-green-400' :
                  feedback.status === 'partial' ? 'text-orange-400' : 'text-red-400'
              }`}>
                  {isHelpState ? 'Help' : feedback.status === 'correct' ? 'Excellent' : feedback.status === 'partial' ? 'Nice try' : 'Check answer'}
              </h3>
            </div>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed whitespace-pre-line mb-4">{feedback.feedback}</p>
            
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
          <VocabularyList vocabulary={feedback.vocabulary} dictionary={dictionary} language="Hebrew" onToggleWord={onToggleDictionaryWord} />
        )}

        <div className="pt-2 pb-6 space-y-2">
          {feedback ? (
            <div className="flex gap-2">
               <button onClick={() => setShowVocabulary(!showVocabulary)} className="flex-1 flex items-center justify-center gap-1 bg-slate-600 hover:bg-slate-500 text-slate-100 font-bold py-3 rounded-lg text-xs md:text-base">
                <ListBulletIcon className="w-4 h-4" />
                <span>{showVocabulary ? 'Hide' : 'View'} Vocab</span>
              </button>
              <button onClick={() => { setShowVocabulary(false); onNext(); }} className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-bold py-3 rounded-lg text-xs md:text-base">Next Item</button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              <button onClick={onSubmit} disabled={isLoading || !userTranslation.trim()} className="py-3 rounded-xl bg-emerald-500/60 text-emerald-200 border-2 border-emerald-300 font-bold text-sm transition-all disabled:opacity-50">Check</button>
              <button onClick={onSkip} disabled={isLoading} className="py-3 rounded-xl bg-orange-500/20 text-orange-400 border-2 border-orange-500 font-bold text-sm transition-all">Skip</button>
              <button onClick={onHelp} disabled={isLoading} className="py-3 rounded-xl bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500 font-bold text-sm transition-all">Help</button>
            </div>
          )}
        </div>
      </div>
      
      {isLoading && (
        <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center rounded-xl z-20">
          <div className="w-10 h-10 border-4 border-t-cyan-400 border-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

export default HebrewReadingSession;
