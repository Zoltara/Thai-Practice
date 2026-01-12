
import React from 'react';
import { VocabularyItem, Language } from '../types';
import { StarIcon } from './icons/StarIcon';
import { StarOutlineIcon } from './icons/StarOutlineIcon';

interface VocabularyListProps {
  vocabulary: VocabularyItem[];
  dictionary: VocabularyItem[];
  language?: Language;
  onToggleWord: (item: VocabularyItem) => void;
}

const VocabularyList: React.FC<VocabularyListProps> = ({ vocabulary, dictionary, language = 'Thai', onToggleWord }) => {
  if (!vocabulary || vocabulary.length === 0) return null;

  const isWordInDictionary = (word: string) => dictionary.some(item => item.word === word);
  const langFont = language === 'Thai' ? 'font-thai' : 'font-hebrew';
  const isRTL = language === 'Hebrew';

  return (
    <div className="mt-4 animate-fade-in">
      <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-3">Key Vocabulary</h4>
      <div className="bg-slate-900/50 rounded-lg overflow-hidden border border-slate-700">
        <ul className="divide-y divide-slate-700">
          {vocabulary.map((item, index) => (
            <li key={index} className="flex justify-between items-center p-4 gap-3">
              <div dir={isRTL ? "rtl" : "ltr"} className="text-left w-full">
                <div className="flex flex-wrap items-baseline gap-2 mb-1">
                  <span className={`${langFont} text-slate-200 text-lg md:text-xl font-bold`}>{item.word}</span>
                  {item.phonetic && <span className="text-cyan-400/70 text-xs font-medium">[{item.phonetic}]</span>}
                </div>
                <div className="space-y-1">
                  <div className="text-slate-300 text-sm md:text-base leading-tight whitespace-pre-line">{item.english}</div>
                  {/* Only show secondary Thai translation (green) if we are learning Hebrew. 
                      If learning Thai, the Thai text is already in item.word (white). */}
                  {language === 'Hebrew' && item.thai && (
                    <div className="text-emerald-400/80 font-thai text-sm md:text-base leading-tight">{item.thai}</div>
                  )}
                </div>
              </div>
              <button
                onClick={() => onToggleWord(item)}
                className="text-amber-400 hover:text-amber-300 p-2 rounded-full transition-colors flex-shrink-0"
              >
                {isWordInDictionary(item.word) ? <StarIcon className="w-6 h-6" /> : <StarOutlineIcon className="w-6 h-6" />}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default VocabularyList;
