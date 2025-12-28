
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
  const [selectedMode, setSelectedMode] = useState<PracticeMode>('reading');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customTopic.trim()) {
      onTopicSelect(customTopic.trim(), selectedMode);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-4">
        <h2 className="text-xl md:text-2xl font-semibold text-slate-100">Practice {language}</h2>
        <p className="text-xs text-slate-400 mt-0.5">What would you like to improve today?</p>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-6">
        <button
          onClick={() => setSelectedMode('reading')}
          className={`flex items-center justify-center gap-2 py-2.5 md:py-3 px-1 rounded-xl text-xs md:text-sm font-bold transition-all duration-200 border-2 ${
            selectedMode === 'reading' 
              ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.2)]' 
              : 'bg-slate-800/40 text-slate-500 border-slate-700 hover:border-slate-600 hover:text-slate-400'
          }`}
        >
          <BookOpenIcon className="w-4 h-4 md:w-5 md:h-5" />
          <span>Reading</span>
        </button>
        <button
          onClick={() => setSelectedMode('vocabulary')}
          className={`flex items-center justify-center gap-2 py-2.5 md:py-3 px-1 rounded-xl text-xs md:text-sm font-bold transition-all duration-200 border-2 ${
            selectedMode === 'vocabulary' 
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]' 
              : 'bg-slate-800/40 text-slate-500 border-slate-700 hover:border-slate-600 hover:text-slate-400'
          }`}
        >
          <ListBulletIcon className="w-4 h-4 md:w-5 md:h-5" />
          <span>Vocab</span>
        </button>
        <button
          onClick={() => setSelectedMode('speaking')}
          className={`flex items-center justify-center gap-2 py-2.5 md:py-3 px-1 rounded-xl text-xs md:text-sm font-bold transition-all duration-200 border-2 ${
            selectedMode === 'speaking' 
              ? 'bg-violet-500/20 text-violet-400 border-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.2)]' 
              : 'bg-slate-800/40 text-slate-500 border-slate-700 hover:border-slate-600 hover:text-slate-400'
          }`}
        >
          <SpeakerIcon className="w-4 h-4 md:w-5 md:h-5" />
          <span>Speaking</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mb-6 space-y-2">
        <label htmlFor="custom-topic" className="block text-xs font-semibold text-slate-500 ml-1 uppercase tracking-wider">
          Custom topic:
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            id="custom-topic"
            type="text"
            value={customTopic}
            onChange={(e) => setCustomTopic(e.target.value)}
            placeholder="e.g., Ordering coffee..."
            className="flex-grow bg-slate-700/30 border-2 border-slate-700 rounded-xl p-3 md:p-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors text-slate-200 text-base"
          />
          <button
            type="submit"
            disabled={!customTopic.trim()}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-black py-3 px-8 rounded-xl transition-all duration-200 transform active:scale-95 shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-lg uppercase tracking-wider"
          >
            Start
          </button>
        </div>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-slate-800" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-slate-800/80 px-4 text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-500 backdrop-blur-sm">
            Quick Select
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={() => onTopicSelect(selectedMode === 'reading' ? "Random Paragraphs" : "Random Words", selectedMode)}
          className="flex justify-between items-center bg-slate-700/20 hover:bg-slate-700/40 text-left p-4 md:p-5 rounded-xl transition-all duration-200 border-2 border-cyan-500/40 shadow-sm"
        >
          <span className="font-bold text-cyan-400 text-base md:text-lg">Surprise Me</span>
          <SparklesIcon className="w-5 h-5 text-cyan-400" />
        </button>

        {TOPICS.map((topic) => (
          <button
            key={topic}
            onClick={() => onTopicSelect(topic, selectedMode)}
            className="flex justify-between items-center bg-slate-700/20 hover:bg-slate-700/40 text-left p-4 md:p-5 rounded-xl transition-all duration-200 border-2 border-transparent hover:border-slate-600 shadow-sm"
          >
            <span className="font-bold text-slate-300 text-base md:text-lg">{topic}</span>
            <ChevronRightIcon className="w-5 h-5 text-slate-600" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default TopicSelector;
