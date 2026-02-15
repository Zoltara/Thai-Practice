
import React from 'react';
import { VocabularyItem, Language } from '../types';
import { BookmarkIcon } from './icons/BookmarkIcon';
import { TrashIcon } from './icons/TrashIcon';
import { XMarkIcon } from './icons/XMarkIcon';

interface DictionaryViewProps {
  isVisible: boolean;
  language: Language | null;
  dictionary: VocabularyItem[];
  onClose: () => void;
  onToggleWord: (item: VocabularyItem) => void;
}

const DictionaryView: React.FC<DictionaryViewProps> = ({
  isVisible,
  language,
  dictionary,
  onClose,
  onToggleWord,
}) => {
  if (!isVisible) {
    return null;
  }

  const langFont = language === 'Thai' ? 'font-thai' : 'font-hebrew';
  const isRTL = language === 'Hebrew';

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dictionary-title"
    >
      <div
        className="bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl border border-slate-700 p-6 flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <BookmarkIcon className="w-7 h-7 text-cyan-400" />
            <h2 id="dictionary-title" className="text-xl md:text-2xl font-bold text-slate-100">Saved Words</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 p-2 -mr-2 rounded-full transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="w-7 h-7" />
          </button>
        </div>

        {dictionary.length === 0 ? (
          <div className="flex-grow flex flex-col items-center justify-center text-center text-slate-400 py-10">
             <BookmarkIcon className="w-14 h-14 mb-4 text-slate-600" />
            <p className="font-semibold text-lg">Empty.</p>
            <p className="text-sm">Save items during practice sessions.</p>
          </div>
        ) : (
          <div className="overflow-y-auto -mx-6 px-6">
            <ul className="divide-y divide-slate-700">
              {dictionary.map((item, index) => (
                <li key={index} className="flex justify-between items-center py-4 gap-4">
                  <div dir={isRTL ? "rtl" : "ltr"} className="text-left w-full">
                    <div className="flex flex-wrap items-baseline gap-2">
                        <span className={`${langFont} text-slate-200 text-lg md:text-xl`}>{item.word}</span>
                        {item.phonetic && (
                            <span className="text-cyan-400/60 text-xs md:text-sm font-medium">[{item.phonetic}]</span>
                        )}
                    </div>
                    <span className="text-slate-400 block text-sm md:text-base whitespace-pre-line">{item.english}</span>
                  </div>
                  <button
                    onClick={() => onToggleWord(item)}
                    className="text-slate-500 hover:text-red-400 p-3 bg-slate-700/30 rounded-xl transition-colors flex-shrink-0"
                    aria-label={`Remove`}
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="mt-6 pt-4 border-t border-slate-700">
            <button 
                onClick={onClose}
                className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-3 rounded-xl transition-colors"
            >
                Done
            </button>
        </div>
      </div>
    </div>
  );
};

export default DictionaryView;
