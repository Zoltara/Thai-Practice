
import React from 'react';
import { Language, PracticeMode } from '../types';
import { HomeIcon } from './icons/HomeIcon';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { ListBulletIcon } from './icons/ListBulletIcon';
import { SpeakerIcon } from './icons/SpeakerIcon';

interface SessionCompleteProps {
  topic: string;
  language: Language;
  onHome: () => void;
  onStartNewMode: (mode: PracticeMode) => void;
}

const SessionComplete: React.FC<SessionCompleteProps> = ({ topic, language, onHome, onStartNewMode }) => {
  const flag = language === 'Thai' ? '🇹🇭' : '🇮🇱';

  return (
    <div className="text-center animate-fade-in p-4">
      <div className="text-8xl md:text-9xl mb-6 select-none animate-bounce">
        {flag}
      </div>
      <h2 className="text-4xl font-bold text-slate-100 mb-4">Well Done!</h2>
      <p className="text-lg text-slate-300 mb-8">
        You've completed today's {language} session for <span className="font-semibold text-cyan-400">{topic}</span>
      </p>
      
      <div className="mt-12 space-y-6">
        <div>
          <p className="text-slate-400 mb-4 text-sm uppercase tracking-widest font-semibold">Try another mode:</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => onStartNewMode('vocabulary')}
              className="flex flex-col items-center justify-center gap-1.5 py-2.5 px-1 rounded-xl transition-all duration-200 border-2 bg-emerald-500/20 text-emerald-400 border-emerald-500 hover:bg-emerald-500/30 active:scale-[0.98]"
            >
              <ListBulletIcon className="w-5 h-5 md:w-6 md:h-6" />
              <span className="text-sm md:text-lg font-black uppercase">Vocab</span>
            </button>
            <button
              onClick={() => onStartNewMode('reading')}
              className="flex flex-col items-center justify-center gap-1.5 py-2.5 px-1 rounded-xl transition-all duration-200 border-2 bg-cyan-500/20 text-cyan-400 border-cyan-500 hover:bg-cyan-500/30 active:scale-[0.98]"
            >
              <BookOpenIcon className="w-5 h-5 md:w-6 md:h-6" />
              <span className="text-sm md:text-lg font-black uppercase">Read</span>
            </button>
            <button
              onClick={() => onStartNewMode('speaking')}
              className="flex flex-col items-center justify-center gap-1.5 py-2.5 px-1 rounded-xl transition-all duration-200 border-2 bg-violet-500/20 text-violet-400 border-violet-500 hover:bg-violet-500/30 active:scale-[0.98]"
            >
              <SpeakerIcon className="w-5 h-5 md:w-6 md:h-6" />
              <span className="text-sm md:text-lg font-black uppercase">Speak</span>
            </button>
          </div>
        </div>
        
        <button
          onClick={onHome}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-black py-3 px-6 rounded-xl transition-all active:scale-[0.98] text-base md:text-lg uppercase tracking-wider"
        >
          <HomeIcon className="w-5 h-5 md:w-6 md:h-6" />
          Home
        </button>
      </div>
    </div>
  );
};

export default SessionComplete;
