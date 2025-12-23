import React from 'react';
import { VocabularyItem } from '../types';
import { BookmarkIcon } from './icons/BookmarkIcon';
import { TrashIcon } from './icons/TrashIcon';
import { XMarkIcon } from './icons/XMarkIcon';

interface DictionaryViewProps {
  isVisible: boolean;
  dictionary: VocabularyItem[];
  onClose: () => void;
  onToggleWord: (item: VocabularyItem) => void;
}

const DictionaryView: React.FC<DictionaryViewProps> = ({
  isVisible,
  dictionary,
  onClose,
  onToggleWord,
}) => {
  if (!isVisible) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dictionary-title"
    >
      <div
        className="bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl border border-slate-700 p-6 flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <BookmarkIcon className="w-7 h-7 text-cyan-400" />
            <h2 id="dictionary-title" className="text-2xl font-bold text-slate-100">My Dictionary</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 p-1 -m-1 rounded-full transition-colors"
            aria-label="Close dictionary"
          >
            <XMarkIcon className="w-8 h-8" />
          </button>
        </div>

        {dictionary.length === 0 ? (
          <div className="flex-grow flex flex-col items-center justify-center text-center text-slate-400">
             <BookmarkIcon className="w-14 h-14 mb-4 text-slate-600" />
            <p className="font-semibold text-lg">Your dictionary is empty.</p>
            <p className="text-base">Save words from vocabulary lists by tapping the star icon.</p>
          </div>
        ) : (
          <div className="overflow-y-auto -mx-6 px-6">
            <ul className="divide-y divide-slate-700">
              {dictionary.map((item, index) => (
                <li key={index} className="flex justify-between items-center py-4 gap-4">
                  <div>
                    <span className="font-thai text-slate-200 text-xl md:text-2xl">{item.thai}</span>
                    <span className="text-slate-400 block text-base md:text-lg">{item.english}</span>
                  </div>
                  <button
                    onClick={() => onToggleWord(item)}
                    className="text-slate-500 hover:text-red-400 p-3 -m-3 rounded-full transition-colors"
                    aria-label={`Remove ${item.thai} from dictionary`}
                  >
                    <TrashIcon className="w-6 h-6" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default DictionaryView;