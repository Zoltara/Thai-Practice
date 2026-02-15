
import React, { useState } from 'react';
import { TOPICS } from '../constants';
import { PracticeMode, Language } from '../types';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { SpeakerIcon } from './icons/SpeakerIcon';
import { ListBulletIcon } from './icons/ListBulletIcon';

interface TopicSelectorProps {
  onTopicSelect: (topic: string, mode: PracticeMode) => void;
  language: Language;
}

const TopicSelector: React.FC<TopicSelectorProps> = ({ onTopicSelect, language }) => {
  const [customTopic, setCustomTopic] = useState('');
  const [selectedMode, setSelectedMode] = useState<PracticeMode>('vocabulary');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customTopic.trim()) {
      onTopicSelect(customTopic.trim(), selectedMode);
    }
  };

  const getModeStyles = (mode: PracticeMode) => {
    switch (mode) {
      case 'vocabulary':
        return {
          active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500',
          hover: 'hover:border-emerald-500/60 hover:bg-emerald-500/10',
          text: 'text-emerald-400',
          border: 'border-emerald-500/40',
          topicBorder: 'border-emerald-500/30'
        };
      case 'reading':
        return {
          active: 'bg-cyan-500/20 text-cyan-400 border-cyan-500',
          hover: 'hover:border-cyan-500/60 hover:bg-cyan-500/10',
          text: 'text-cyan-400',
          border: 'border-cyan-500/40',
          topicBorder: 'border-cyan-500/30'
        };
      case 'speaking':
        return {
          active: 'bg-violet-500/20 text-violet-400 border-violet-500',
          hover: 'hover:border-violet-500/60 hover:bg-violet-500/10',
          text: 'text-violet-400',
          border: 'border-violet-500/40',
          topicBorder: 'border-violet-500/30'
        };
      default:
        return {
          active: '',
          hover: '',
          text: '',
          border: '',
          topicBorder: ''
        };
    }
  };

  const currentStyles = getModeStyles(selectedMode);

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-4">
        <h2 className="text-xl md:text-2xl font-semibold text-slate-100">Practice {language}</h2>
        <p className="text-[10px] md:text-xs text-slate-400 mt-0.5 uppercase tracking-wider">Select Practice Mode</p>
      </div>

      <div className="grid grid-cols-3 gap-1.5 mb-6">
        <button
          onClick={() => setSelectedMode('vocabulary')}
          className={`flex flex-col md:flex-row items-center justify-center gap-1 md:gap-1.5 py-1.5 md:py-2.5 px-1 rounded-xl transition-all duration-200 border-2 ${
            selectedMode === 'vocabulary' 
              ? getModeStyles('vocabulary').active 
              : 'bg-slate-800/40 text-slate-500 border-slate-700 hover:border-slate-600'
          }`}
        >
          <ListBulletIcon className="w-4 h-4 md:w-5 md:h-5" />
          <span className="text-sm md:text-lg font-black uppercase">Vocab</span>
        </button>
        <button
          onClick={() => setSelectedMode('reading')}
          className={`flex flex-col md:flex-row items-center justify-center gap-1 md:gap-1.5 py-1.5 md:py-2.5 px-1 rounded-xl transition-all duration-200 border-2 ${
            selectedMode === 'reading' 
              ? getModeStyles('reading').active 
              : 'bg-slate-800/40 text-slate-500 border-slate-700 hover:border-slate-600'
          }`}
        >
          <BookOpenIcon className="w-4 h-4 md:w-5 md:h-5" />
          <span className="text-sm md:text-lg font-black uppercase">Read</span>
        </button>
        <button
          onClick={() => setSelectedMode('speaking')}
          className={`flex flex-col md:flex-row items-center justify-center gap-1 md:gap-1.5 py-1.5 md:py-2.5 px-1 rounded-xl transition-all duration-200 border-2 ${
            selectedMode === 'speaking' 
              ? getModeStyles('speaking').active 
              : 'bg-slate-800/40 text-slate-500 border-slate-700 hover:border-slate-600'
          }`}
        >
          <SpeakerIcon className="w-4 h-4 md:w-5 md:h-5" />
          <span className="text-sm md:text-lg font-black uppercase">Speak</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mb-6 space-y-2">
        <label htmlFor="custom-topic" className="block text-[10px] font-semibold text-slate-500 ml-1 uppercase tracking-wider">
          Custom topic:
        </label>
        <div className="flex flex-col gap-2">
          <input
            id="custom-topic"
            type="text"
            value={customTopic}
            onChange={(e) => setCustomTopic(e.target.value)}
            placeholder="e.g., Ordering coffee..."
            className={`w-full bg-slate-700/30 border-2 border-slate-700 rounded-xl p-2.5 md:p-3 focus:outline-none transition-colors text-slate-200 text-base md:text-lg ${
              selectedMode === 'vocabulary' ? 'focus:border-emerald-500' :
              selectedMode === 'reading' ? 'focus:border-cyan-500' : 'focus:border-violet-500'
            }`}
          />
          <button
            type="submit"
            disabled={!customTopic.trim()}
            className={`w-full text-white font-black py-2.5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 text-base md:text-xl uppercase tracking-wider ${
              selectedMode === 'vocabulary' ? 'bg-emerald-500 hover:bg-emerald-600' :
              selectedMode === 'reading' ? 'bg-cyan-500 hover:bg-cyan-600' : 'bg-violet-500 hover:bg-violet-600'
            }`}
          >
            Start Session
          </button>
        </div>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-slate-800" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-slate-800/80 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 backdrop-blur-sm">
            Quick Select
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-2.5">
        <button
          onClick={() => onTopicSelect(selectedMode === 'reading' ? "Random Paragraphs" : "Random Words", selectedMode)}
          className={`flex justify-between items-center bg-slate-700/20 hover:bg-slate-700/40 p-2.5 md:p-3.5 rounded-xl transition-all border-2 shadow-sm ${currentStyles.border} ${currentStyles.hover}`}
        >
          <span className={`font-black text-base md:text-xl ${currentStyles.text}`}>Surprise Me</span>
          <SparklesIcon className={`w-5 h-5 md:w-6 md:h-6 ${currentStyles.text}`} />
        </button>

        {TOPICS.map((topic) => (
          <button
            key={topic}
            onClick={() => onTopicSelect(topic, selectedMode)}
            className={`flex justify-between items-center bg-slate-700/20 p-2.5 md:p-3.5 rounded-xl transition-all border-2 border-transparent shadow-sm border-slate-700/50 ${currentStyles.hover}`}
          >
            <span className="font-bold text-slate-300 text-base md:text-xl truncate mr-2">{topic}</span>
            <ChevronRightIcon className={`w-5 h-5 flex-shrink-0 transition-colors ${currentStyles.text.replace('text-', 'group-hover:text-')}`} />
          </button>
        ))}
      </div>
    </div>
  );
};

export default TopicSelector;
