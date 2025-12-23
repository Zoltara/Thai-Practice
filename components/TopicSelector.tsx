
import React, { useState } from 'react';
import { TOPICS } from '../constants';
import { PracticeMode } from '../types';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { SpeakerIcon } from './icons/SpeakerIcon';

interface TopicSelectorProps {
  onTopicSelect: (topic: string, mode: PracticeMode) => void;
}

const TopicSelector: React.FC<TopicSelectorProps> = ({ onTopicSelect }) => {
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
        <SparklesIcon className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-violet-400" />
        <h2 className="text-xl md:text-2xl font-semibold text-slate-100">Choose a Topic</h2>
        <p className="text-sm text-slate-400 mt-1">Select your mode and topic to start.</p>
      </div>

      {/* Mode Selector */}
      <div className="flex bg-slate-700/50 p-1.5 rounded-2xl mb-6 md:mb-10 relative">
        <button
          onClick={() => setSelectedMode('reading')}
          className={`flex-1 flex items-center justify-center gap-2 py-4 md:py-6 rounded-xl text-lg md:text-2xl font-bold transition-all duration-200 ${
            selectedMode === 'reading' 
              ? 'bg-slate-600 text-cyan-400 shadow-xl ring-2 ring-slate-500' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpenIcon className="w-6 h-6 md:w-8 md:h-8" />
          Reading
        </button>
        <button
          onClick={() => setSelectedMode('speaking')}
          className={`flex-1 flex items-center justify-center gap-2 py-4 md:py-6 rounded-xl text-lg md:text-2xl font-bold transition-all duration-200 ${
            selectedMode === 'speaking' 
              ? 'bg-slate-600 text-violet-400 shadow-xl ring-2 ring-slate-500' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <SpeakerIcon className="w-6 h-6 md:w-8 md:h-8" />
          Speaking
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mb-4 md:mb-8 space-y-3">
        <label htmlFor="custom-topic" className="block text-sm font-semibold text-slate-400 ml-1">
          Enter your own topic:
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            id="custom-topic"
            type="text"
            value={customTopic}
            onChange={(e) => setCustomTopic(e.target.value)}
            placeholder="e.g., Cooking Thai Food"
            className="flex-grow bg-slate-700/50 border-2 border-slate-600 rounded-xl p-4 md:p-5 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-violet-400 transition-colors text-slate-200 text-lg md:text-xl"
          />
          <button
            type="submit"
            disabled={!customTopic.trim()}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 md:py-5 px-8 md:px-12 rounded-xl transition-all duration-200 transform hover:scale-[1.03] active:scale-95 shadow-lg shadow-emerald-500/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-xl md:text-3xl uppercase tracking-wider"
          >
            Start
          </button>
        </div>
      </form>

      <div className="relative my-6 md:my-10">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-slate-700" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-slate-800/50 px-4 text-xs md:text-sm font-bold uppercase tracking-widest text-slate-500 backdrop-blur-sm">
            Or choose a preset
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
        {TOPICS.map((topic) => (
          <button
            key={topic}
            onClick={() => onTopicSelect(topic, selectedMode)}
            className="flex justify-between items-center bg-slate-700/30 hover:bg-slate-700/60 text-left p-5 md:p-6 rounded-xl transition-all duration-200 ease-in-out transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-opacity-75 border border-slate-700/50 shadow-sm"
          >
            <span className="font-bold text-slate-200 text-lg md:text-xl">{topic}</span>
            <ChevronRightIcon className="w-6 h-6 text-slate-500" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default TopicSelector;
