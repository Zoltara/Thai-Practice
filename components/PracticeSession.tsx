import React, { useState } from 'react';
import { Feedback, VocabularyItem } from '../types';
import FeedbackDisplay from './FeedbackDisplay';
import ProgressBar from './ProgressBar';
import VocabularyList from './VocabularyList';
import { SpeakerIcon } from './icons/SpeakerIcon';
import { ListBulletIcon } from './icons/ListBulletIcon';
import { ArrowDownTrayIcon } from './icons/ArrowDownTrayIcon';
import { generateSpeech } from '../services/geminiService';
import { downloadBase64Audio } from '../utils/audio';

interface PracticeSessionProps {
  topic: string;
  currentParagraph: string;
  feedback: Feedback | null;
  isLoading: boolean;
  isAudioLoading: boolean;
  error: string | null;
  userTranslation: string;
  setUserTranslation: (value: string) => void;
  onSubmit: () => void;
  onNext: () => void;
  onListen: () => void;
  progressCount: number;
  totalParagraphs: number;
  dictionary: VocabularyItem[];
  onToggleDictionaryWord: (item: VocabularyItem) => void;
}

const LoadingSpinner: React.FC = () => (
  <div className="absolute inset-0 bg-slate-800 bg-opacity-50 flex items-center justify-center rounded-xl">
    <div className="w-12 h-12 border-4 border-t-cyan-400 border-r-cyan-400 border-b-cyan-400 border-l-transparent rounded-full animate-spin"></div>
  </div>
);

const PracticeSession: React.FC<PracticeSessionProps> = ({
  topic,
  currentParagraph,
  feedback,
  isLoading,
  isAudioLoading,
  error,
  userTranslation,
  setUserTranslation,
  onSubmit,
  onNext,
  onListen,
  progressCount,
  totalParagraphs,
  dictionary,
  onToggleDictionaryWord,
}) => {
  const [showVocabulary, setShowVocabulary] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

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

  const handleDownload = async () => {
    if (!currentParagraph || isDownloading) return;
    setIsDownloading(true);
    try {
      const base64Audio = await generateSpeech(currentParagraph);
      downloadBase64Audio(base64Audio, `thai_practice_${progressCount}.pcm`);
    } catch (e) {
      console.error("Download failed", e);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="relative animate-fade-in">
      <div className="mb-6">
        <ProgressBar current={progressCount} total={totalParagraphs} />
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-sm text-slate-400">Topic</p>
          <h2 className="text-2xl font-semibold text-cyan-400">{topic}</h2>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-base font-medium text-slate-400">
              Thai Paragraph:
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={isDownloading || isLoading || !currentParagraph}
                className="flex items-center gap-2 text-base px-4 py-2 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-slate-100 transition-colors disabled:opacity-50"
                title="Save audio file"
              >
                {isDownloading ? (
                   <span className="w-5 h-5 border-2 border-t-slate-400 border-r-slate-400 border-b-slate-400 border-l-transparent rounded-full animate-spin"></span>
                ) : (
                  <ArrowDownTrayIcon className="w-5 h-5" />
                )}
                <span className="hidden sm:inline">Save</span>
              </button>
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
            <p className="font-thai text-2xl md:text-3xl leading-relaxed tracking-wide text-slate-100">
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
            placeholder="Type what you think it means..."
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
                {isLoading ? 'Loading...' : 'Next Paragraph'}
              </button>
            </div>
          ) : (
            <button
              onClick={onSubmit}
              disabled={isLoading || !userTranslation.trim()}
              className="w-full bg-violet-500 hover:bg-violet-600 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-violet-400 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {isLoading ? 'Checking...' : 'Check My Answer'}
            </button>
          )}
        </div>
      </div>
      
      {isLoading && <LoadingSpinner />}
    </div>
  );
};

export default PracticeSession;