
import React from 'react';
import { Language } from '../types';

interface LanguageSelectorProps {
  onSelectLanguage: (lang: Language) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ onSelectLanguage }) => {
  return (
    <div className="animate-fade-in text-center space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-100">Select Language</h2>
        <p className="text-slate-400 mt-1">Which language would you like to practice?</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-sm mx-auto">
        <button
          onClick={() => onSelectLanguage('Thai')}
          className="group relative overflow-hidden bg-slate-700/20 border-2 border-slate-700 hover:border-cyan-500 rounded-2xl p-6 transition-all duration-300"
        >
          <div className="flex flex-col items-center gap-3">
            <span className="text-5xl">🇹🇭</span>
            <span className="text-xl font-bold text-slate-200 group-hover:text-cyan-400">Thai</span>
          </div>
        </button>

        <button
          onClick={() => onSelectLanguage('Hebrew')}
          className="group relative overflow-hidden bg-slate-700/20 border-2 border-slate-700 hover:border-cyan-500 rounded-2xl p-6 transition-all duration-300"
        >
          <div className="flex flex-col items-center gap-3">
            <span className="text-5xl">🇮🇱</span>
            <span className="text-xl font-bold text-slate-200 group-hover:text-cyan-400">Hebrew</span>
          </div>
        </button>
      </div>
    </div>
  );
};

export default LanguageSelector;
