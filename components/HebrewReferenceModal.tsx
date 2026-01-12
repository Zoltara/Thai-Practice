
import React, { useState } from 'react';
import { XMarkIcon } from './icons/XMarkIcon';

interface HebrewReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LETTERS = [
  { glyph: 'א', name: 'Alef', sound: 'Silent/Breath' },
  { glyph: 'ב', name: 'Bet/Vet', sound: 'B / V' },
  { glyph: 'ג', name: 'Gimel', sound: 'G' },
  { glyph: 'ד', name: 'Dalet', sound: 'D' },
  { glyph: 'ה', name: 'He', sound: 'H' },
  { glyph: 'ו', name: 'Vav', sound: 'V / O / U' },
  { glyph: 'ז', name: 'Zayin', sound: 'Z' },
  { glyph: 'ח', name: 'Het', sound: 'Kh (guttural)' },
  { glyph: 'ט', name: 'Tet', sound: 'T' },
  { glyph: 'י', name: 'Yod', sound: 'Y / I' },
  { glyph: 'כ', name: 'Kaf/Khaf', sound: 'K / Kh' },
  { glyph: 'ל', name: 'Lamed', sound: 'L' },
  { glyph: 'מ', name: 'Mem', sound: 'M' },
  { glyph: 'נ', name: 'Nun', sound: 'N' },
  { glyph: 'ס', name: 'Samekh', sound: 'S' },
  { glyph: 'ע', name: 'Ayin', sound: 'Silent/Deep guttural' },
  { glyph: 'פ', name: 'Pe/Fe', sound: 'P / F' },
  { glyph: 'צ', name: 'Tsadi', sound: 'Ts' },
  { glyph: 'ק', name: 'Qof', sound: 'Q/K' },
  { glyph: 'ר', name: 'Resh', sound: 'R' },
  { glyph: 'ש', name: 'Shin/Sin', sound: 'Sh / S' },
  { glyph: 'ת', name: 'Tav', sound: 'T' },
];

const SOFIT_LETTERS = [
  { glyph: 'ך', name: 'Khaf Sofit', base: 'כ' },
  { glyph: 'ם', name: 'Mem Sofit', base: 'מ' },
  { glyph: 'ן', name: 'Nun Sofit', base: 'נ' },
  { glyph: 'ף', name: 'Fe Sofit', base: 'פ' },
  { glyph: 'ץ', name: 'Tsadi Sofit', base: 'צ' },
];

const VOWELS = [
  { glyph: 'אָ', name: 'Kamatz', sound: 'A (as in far)', type: 'Long' },
  { glyph: 'אַ', name: 'Patach', sound: 'A (as in far)', type: 'Short' },
  { glyph: 'אֵ', name: 'Tsere', sound: 'E (as in grey)', type: 'Long' },
  { glyph: 'אֶ', name: 'Segol', sound: 'E (as in bed)', type: 'Short' },
  { glyph: 'אִ', name: 'Hirik', sound: 'I (as in ski)', type: 'Short/Long' },
  { glyph: 'אֹ', name: 'Holam', sound: 'O (as in go)', type: 'Long' },
  { glyph: 'אֻ', name: 'Kubutz', sound: 'U (as in glue)', type: 'Short' },
  { glyph: 'אוּ', name: 'Shuruk', sound: 'U (as in glue)', type: 'Long' },
  { glyph: 'אְ', name: 'Shva', sound: 'Empty/Short E', type: 'Neutral' },
];

const HebrewReferenceModal: React.FC<HebrewReferenceModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'letters' | 'vowels'>('letters');

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-slate-800 w-full max-w-2xl h-[85vh] rounded-3xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
          <div>
            <h2 className="text-2xl font-bold text-slate-100">Hebrew Reference</h2>
            <p className="text-sm text-slate-400">Letters and Niqqud Guide</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"
          >
            <XMarkIcon className="w-8 h-8" />
          </button>
        </div>

        <div className="flex p-2 bg-slate-900/50 gap-2">
          <button
            onClick={() => setActiveTab('letters')}
            className={`flex-1 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all ${
              activeTab === 'letters' ? 'bg-cyan-500 text-slate-900 shadow-lg' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            Aleph-Bet
          </button>
          <button
            onClick={() => setActiveTab('vowels')}
            className={`flex-1 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all ${
              activeTab === 'vowels' ? 'bg-violet-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            Vowels (Niqqud)
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          {activeTab === 'letters' ? (
            <div className="space-y-8 animate-fade-in">
              <section>
                <h3 className="text-xs font-black text-cyan-400 uppercase tracking-widest mb-4">Standard Alphabet</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {LETTERS.map((l) => (
                    <div key={l.glyph} className="bg-slate-900/40 border border-slate-700/50 p-4 rounded-2xl flex flex-col items-center hover:border-cyan-500/50 transition-colors">
                      <span className="font-hebrew text-4xl text-slate-100 mb-1">{l.glyph}</span>
                      <span className="text-sm font-bold text-slate-200">{l.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">/{l.sound}/</span>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-xs font-black text-cyan-400 uppercase tracking-widest mb-4">Final Forms (Sofit)</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {SOFIT_LETTERS.map((l) => (
                    <div key={l.glyph} className="bg-slate-900/40 border border-slate-700/50 p-4 rounded-2xl flex flex-col items-center">
                      <span className="font-hebrew text-4xl text-emerald-400 mb-1">{l.glyph}</span>
                      <span className="text-[10px] font-bold text-slate-300">{l.name}</span>
                      <span className="text-[10px] text-slate-500 uppercase">Base: {l.base}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-violet-500/10 border border-violet-500/20 p-4 rounded-xl mb-6">
                <p className="text-sm text-slate-300 leading-relaxed">
                  Niqqud are vowel points used to indicate pronunciation, as Hebrew letters are primarily consonants. 
                  In this guide, the letter <strong>א</strong> (Alef) is used as a placeholder.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {VOWELS.map((v) => (
                  <div key={v.name} className="bg-slate-900/40 border border-slate-700/50 p-4 rounded-2xl flex items-center gap-4 hover:border-violet-500/50 transition-colors">
                    <div className="bg-slate-800 rounded-lg w-16 h-16 flex items-center justify-center border border-slate-700 shadow-inner">
                      <span className="font-hebrew text-4xl text-slate-100">{v.glyph}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-200">{v.name}</h4>
                      <p className="text-sm text-violet-400">{v.sound}</p>
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">{v.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-700 bg-slate-800/80">
          <button 
            onClick={onClose}
            className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition-all active:scale-[0.98]"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default HebrewReferenceModal;
