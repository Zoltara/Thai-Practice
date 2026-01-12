
import React, { useState } from 'react';
import { XMarkIcon } from './icons/XMarkIcon';
import { Language } from '../types';

interface LanguageReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language | null;
}

const HEBREW_LETTERS = [
  { glyph: 'א', name: 'Alef', sound: 'Silent' },
  { glyph: 'ב', name: 'Bet/Vet', sound: 'B / V' },
  { glyph: 'ג', name: 'Gimel', sound: 'G' },
  { glyph: 'ด', name: 'Dalet', sound: 'D' }, // Note: Dalet is ד, not ด (Thai). Fixing.
  { glyph: 'ה', name: 'He', sound: 'H' },
  { glyph: 'ו', name: 'Vav', sound: 'V / O / U' },
  { glyph: 'ז', name: 'Zayin', sound: 'Z' },
  { glyph: 'ח', name: 'Het', sound: 'Kh' },
  { glyph: 'ט', name: 'Tet', sound: 'T' },
  { glyph: 'י', name: 'Yod', sound: 'Y / I' },
  { glyph: 'כ', name: 'Kaf/Khaf', sound: 'K / Kh' },
  { glyph: 'ล', name: 'Lamed', sound: 'L' }, // Note: Lamed is ל, not ล (Thai). Fixing.
  { glyph: 'ม', name: 'Mem', sound: 'M' }, // Note: Mem is מ, not ม (Thai). Fixing.
  { glyph: 'น', name: 'Nun', sound: 'N' }, // Note: Nun is נ, not น (Thai). Fixing.
  { glyph: 'ס', name: 'Samekh', sound: 'S' },
  { glyph: 'ע', name: 'Ayin', sound: 'Silent' },
  { glyph: 'פ', name: 'Pe/Fe', sound: 'P / F' },
  { glyph: 'צ', name: 'Tsadi', sound: 'Ts' },
  { glyph: 'ק', name: 'Qof', sound: 'Q/K' },
  { glyph: 'ר', name: 'Resh', sound: 'R' },
  { glyph: 'ש', name: 'Shin/Sin', sound: 'Sh / S' },
  { glyph: 'ת', name: 'Tav', sound: 'T' },
];

// Cleaned up version of HEBREW_LETTERS to avoid Thai character mix-ups
const HEBREW_LETTERS_FIXED = [
  { glyph: 'א', name: 'Alef', sound: 'Silent' },
  { glyph: 'ב', name: 'Bet/Vet', sound: 'B / V' },
  { glyph: 'ג', name: 'Gimel', sound: 'G' },
  { glyph: 'ד', name: 'Dalet', sound: 'D' },
  { glyph: 'ה', name: 'He', sound: 'H' },
  { glyph: 'ו', name: 'Vav', sound: 'V / O / U' },
  { glyph: 'ז', name: 'Zayin', sound: 'Z' },
  { glyph: 'ח', name: 'Het', sound: 'Kh' },
  { glyph: 'ט', name: 'Tet', sound: 'T' },
  { glyph: 'י', name: 'Yod', sound: 'Y / I' },
  { glyph: 'כ', name: 'Kaf/Khaf', sound: 'K / Kh' },
  { glyph: 'ל', name: 'Lamed', sound: 'L' },
  { glyph: 'מ', name: 'Mem', sound: 'M' },
  { glyph: 'נ', name: 'Nun', sound: 'N' },
  { glyph: 'ס', name: 'Samekh', sound: 'S' },
  { glyph: 'ע', name: 'Ayin', sound: 'Silent' },
  { glyph: 'פ', name: 'Pe/Fe', sound: 'P / F' },
  { glyph: 'צ', name: 'Tsadi', sound: 'Ts' },
  { glyph: 'ק', name: 'Qof', sound: 'Q/K' },
  { glyph: 'ר', name: 'Resh', sound: 'R' },
  { glyph: 'ש', name: 'Shin/Sin', sound: 'Sh / S' },
  { glyph: 'ת', name: 'Tav', sound: 'T' },
];

const THAI_CONSONANTS = [
  { glyph: 'ก', name: 'Ko Kai', class: 'Mid', sound: 'K' },
  { glyph: 'ข', name: 'Kho Khai', class: 'High', sound: 'Kh' },
  { glyph: 'ค', name: 'Kho Khwai', class: 'Low', sound: 'Kh' },
  { glyph: 'ง', name: 'Ngo Ngu', class: 'Low', sound: 'Ng' },
  { glyph: 'จ', name: 'Cho Chan', class: 'Mid', sound: 'Ch' },
  { glyph: 'ฉ', name: 'Cho Ching', class: 'High', sound: 'Ch' },
  { glyph: 'ช', name: 'Cho Chang', class: 'Low', sound: 'Ch' },
  { glyph: 'ซ', name: 'So So', class: 'Low', sound: 'S' },
  { glyph: 'ญ', name: 'Yo Ying', class: 'Low', sound: 'Y' },
  { glyph: 'ด', name: 'Do Dek', class: 'Mid', sound: 'D' },
  { glyph: 'ต', name: 'To Tao', class: 'Mid', sound: 'T' },
  { glyph: 'ถ', name: 'Tho Thung', class: 'High', sound: 'Th' },
  { glyph: 'ท', name: 'Tho Thahan', class: 'Low', sound: 'Th' },
  { glyph: 'น', name: 'No Nu', class: 'Low', sound: 'N' },
  { glyph: 'บ', name: 'Bo Baimai', class: 'Mid', sound: 'B' },
  { glyph: 'ป', name: 'Po Pla', class: 'Mid', sound: 'P' },
  { glyph: 'ผ', name: 'Pho Phueng', class: 'High', sound: 'Ph' },
  { glyph: 'ฝ', name: 'Fo Fa', class: 'High', sound: 'F' },
  { glyph: 'พ', name: 'Pho Phan', class: 'Low', sound: 'Ph' },
  { glyph: 'ฟ', name: 'Fo Fan', class: 'Low', sound: 'F' },
  { glyph: 'ม', name: 'Mo Ma', class: 'Low', sound: 'M' },
  { glyph: 'ย', name: 'Yo Yak', class: 'Low', sound: 'Y' },
  { glyph: 'ร', name: 'Ro Ruea', class: 'Low', sound: 'R' },
  { glyph: 'ล', name: 'Lo Ling', class: 'Low', sound: 'L' },
  { glyph: 'ว', name: 'Wo Waen', class: 'Low', sound: 'W' },
  { glyph: 'ส', name: 'So Suea', class: 'High', sound: 'S' },
  { glyph: 'ห', name: 'Ho Hip', class: 'High', sound: 'H' },
  { glyph: 'อ', name: 'O Ang', class: 'Mid', sound: 'Silent' },
  { glyph: 'ฮ', name: 'Ho Nok-huk', class: 'Low', sound: 'H' },
];

const THAI_VOWELS = [
  { glyph: '-ะ', name: 'Sara A', length: 'Short', sound: 'a' },
  { glyph: '-า', name: 'Sara Aa', length: 'Long', sound: 'aa' },
  { glyph: 'อิ', name: 'Sara I', length: 'Short', sound: 'i' },
  { glyph: 'อี', name: 'Sara Ii', length: 'Long', sound: 'ii' },
  { glyph: 'อุ', name: 'Sara U', length: 'Short', sound: 'u' },
  { glyph: 'อู', name: 'Sara Uu', length: 'Long', sound: 'uu' },
  { glyph: 'เ-ะ', name: 'Sara E', length: 'Short', sound: 'e' },
  { glyph: 'เ-', name: 'Sara Ee', length: 'Long', sound: 'ee' },
  { glyph: 'แ-ะ', name: 'Sara Ae', length: 'Short', sound: 'ae' },
  { glyph: 'แ-', name: 'Sara Aee', length: 'Long', sound: 'aee' },
];

const ToneArrow = ({ type }: { type: 'mid' | 'low' | 'falling' | 'high' | 'rising' }) => {
  const arrows = {
    mid: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M4 12h16" strokeLinecap="round"/></svg>,
    low: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M4 8l16 8" strokeLinecap="round"/></svg>,
    falling: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M4 6c4 0 8 12 16 12" strokeLinecap="round"/></svg>,
    high: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M4 16l16-8" strokeLinecap="round"/></svg>,
    rising: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M4 18c4 0 8-12 16-12" strokeLinecap="round"/></svg>,
  };
  return arrows[type];
};

const ThaiToneChart = () => (
  <div className="space-y-6 animate-fade-in pb-8">
    <div className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-900/40">
      <table className="w-full text-center border-collapse text-[10px] md:text-xs">
        <thead>
          <tr className="bg-slate-800">
            <th className="p-2 border border-slate-700">Class</th>
            <th className="p-2 border border-slate-700 bg-emerald-900/30 text-emerald-400">Live</th>
            <th className="p-2 border border-slate-700 bg-orange-900/30 text-orange-400" colSpan={2}>Dead</th>
            <th className="p-2 border border-slate-700 bg-slate-800/80">
               <div className="flex flex-col items-center">
                 <span className="font-thai text-3xl leading-none text-slate-100">่</span>
                 <span className="text-[8px] opacity-40 uppercase font-sans tracking-tighter">(1)</span>
               </div>
            </th>
            <th className="p-2 border border-slate-700 bg-slate-800/80">
               <div className="flex flex-col items-center">
                 <span className="font-thai text-3xl leading-none text-slate-100">้</span>
                 <span className="text-[8px] opacity-40 uppercase font-sans tracking-tighter">(2)</span>
               </div>
            </th>
            <th className="p-2 border border-slate-700 bg-slate-800/80">
               <div className="flex flex-col items-center">
                 <span className="font-thai text-3xl leading-none text-slate-100">๊</span>
                 <span className="text-[8px] opacity-40 uppercase font-sans tracking-tighter">(3)</span>
               </div>
            </th>
            <th className="p-2 border border-slate-700 bg-slate-800/80">
               <div className="flex flex-col items-center">
                 <span className="font-thai text-3xl leading-none text-slate-100">๋</span>
                 <span className="text-[8px] opacity-40 uppercase font-sans tracking-tighter">(4)</span>
               </div>
            </th>
          </tr>
          <tr className="bg-slate-800/50">
            <th className="p-1 border border-slate-700"></th>
            <th className="p-1 border border-slate-700"></th>
            <th className="p-1 border border-slate-700 text-[8px] bg-slate-700/30 uppercase tracking-tighter">Short</th>
            <th className="p-1 border border-slate-700 text-[8px] bg-slate-700/30 uppercase tracking-tighter">Long</th>
            <th className="p-1 border border-slate-700" colSpan={4}></th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="p-2 border border-slate-700 font-bold text-amber-500 bg-slate-900/50">Low</td>
            <td className="p-2 border border-slate-700 bg-emerald-500/20 text-emerald-300"><div className="flex flex-col items-center"><ToneArrow type="mid"/><span>Mid</span></div></td>
            <td className="p-2 border border-slate-700 bg-slate-800/50 text-slate-300"><div className="flex flex-col items-center"><ToneArrow type="high"/><span>High</span></div></td>
            <td className="p-2 border border-slate-700 bg-slate-800/50 text-pink-400"><div className="flex flex-col items-center"><ToneArrow type="falling"/><span>Falling</span></div></td>
            <td className="p-2 border border-slate-700 bg-emerald-500/20 text-emerald-300"><div className="flex flex-col items-center"><ToneArrow type="falling"/><span>Falling</span></div></td>
            <td className="p-2 border border-slate-700 bg-emerald-500/20 text-pink-300"><div className="flex flex-col items-center"><ToneArrow type="high"/><span>High</span></div></td>
            <td className="p-2 border border-slate-700 bg-slate-900/50 text-slate-600">-</td>
            <td className="p-2 border border-slate-700 bg-slate-900/50 text-slate-600"><div className="flex flex-col items-center opacity-30"><ToneArrow type="rising"/><span>Rare*</span></div></td>
          </tr>
          <tr>
            <td className="p-2 border border-slate-700 font-bold text-cyan-500 bg-slate-900/50">Middle</td>
            <td className="p-2 border border-slate-700 bg-emerald-500/20 text-emerald-300" rowSpan={2}><div className="flex flex-col items-center"><ToneArrow type="mid"/><span>Mid</span></div></td>
            <td className="p-2 border border-slate-700 bg-slate-800/50 text-slate-300" colSpan={2} rowSpan={2}><div className="flex flex-col items-center text-orange-400"><ToneArrow type="low"/><span>Low</span></div></td>
            <td className="p-2 border border-slate-700 bg-emerald-500/20 text-slate-400"><div className="flex flex-col items-center"><ToneArrow type="low"/><span>Low</span></div></td>
            <td className="p-2 border border-slate-700 bg-emerald-500/20 text-orange-400"><div className="flex flex-col items-center"><ToneArrow type="falling"/><span>Falling</span></div></td>
            <td className="p-2 border border-slate-700 bg-emerald-500/20 text-emerald-300"><div className="flex flex-col items-center"><ToneArrow type="high"/><span>High</span></div></td>
            <td className="p-2 border border-slate-700 bg-emerald-500/20 text-emerald-300"><div className="flex flex-col items-center"><ToneArrow type="rising"/><span>Rising</span></div></td>
          </tr>
          <tr>
            <td className="p-2 border border-slate-700 font-bold text-emerald-500 bg-slate-900/50">High, (ห)</td>
            <td className="p-2 border border-slate-700 bg-emerald-500/20 text-slate-400"><div className="flex flex-col items-center"><ToneArrow type="low"/><span>Low</span></div></td>
            <td className="p-2 border border-slate-700 bg-emerald-500/20 text-orange-400"><div className="flex flex-col items-center"><ToneArrow type="falling"/><span>Falling</span></div></td>
            <td className="p-2 border border-slate-700 bg-slate-900/50 text-slate-600">-</td>
            <td className="p-2 border border-slate-700 bg-slate-900/50 text-slate-600">-</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="p-4 rounded-xl border border-orange-500/30 bg-orange-500/5">
        <h4 className="text-xs font-black uppercase tracking-widest text-orange-400 mb-3">Dead Endings (Stop)</h4>
        <div className="flex flex-wrap gap-2">
          {['ก','ข','ค','ฆ','บ','ป','พ','ภ','ฟ','ด','จ','ต','ถ','ท','ธ','ฎ','ฏ','ฑ','ฒ','ช','ซ','ศ','ษ','ส'].map(g => (
            <span key={g} className="bg-slate-800 text-slate-100 px-2 py-1 rounded border border-slate-700 font-thai text-lg">{g}</span>
          ))}
        </div>
        <p className="text-[10px] text-slate-500 mt-2">Sounds like K, P, or T. Ends abruptly.</p>
      </div>

      <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
        <h4 className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-3">Live Endings (Sonorant)</h4>
        <div className="flex flex-wrap gap-2">
          {['น','ณ','ญ','ร','ล','ฬ','ม','ย','ว','ง'].map(g => (
            <span key={g} className="bg-slate-800 text-slate-100 px-2 py-1 rounded border border-slate-700 font-thai text-lg">{g}</span>
          ))}
        </div>
        <p className="text-[10px] text-slate-500 mt-2">Sounds like N, M, Y, W, NG. Can be sustained.</p>
      </div>
    </div>
  </div>
);

const LanguageReferenceModal: React.FC<LanguageReferenceModalProps> = ({ isOpen, onClose, language }) => {
  const [activeTab, setActiveTab] = useState<'letters' | 'vowels' | 'tones'>('letters');

  if (!isOpen || !language) return null;

  const isHebrew = language === 'Hebrew';

  // Split Thai vowels for paired display
  const shortVowels = THAI_VOWELS.filter(v => v.length === 'Short');
  const longVowels = THAI_VOWELS.filter(v => v.length === 'Long');

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
            <h2 className="text-2xl font-bold text-slate-100">{language} Reference</h2>
            <p className="text-sm text-slate-400">Alphabet and Rules</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors">
            <XMarkIcon className="w-8 h-8" />
          </button>
        </div>

        <div className="flex p-2 bg-slate-900/50 gap-2">
          <button
            onClick={() => setActiveTab('letters')}
            className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase transition-all ${activeTab === 'letters' ? 'bg-cyan-500 text-slate-900 shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            {isHebrew ? 'Aleph-Bet' : 'Consonants'}
          </button>
          <button
            onClick={() => setActiveTab('vowels')}
            className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase transition-all ${activeTab === 'vowels' ? 'bg-violet-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            Vowels
          </button>
          {!isHebrew && (
            <button
              onClick={() => setActiveTab('tones')}
              className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase transition-all ${activeTab === 'tones' ? 'bg-amber-500 text-slate-900 shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}
            >
              Tone Rules
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          {isHebrew ? (
            activeTab === 'letters' ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 animate-fade-in">
                {HEBREW_LETTERS_FIXED.map(l => (
                  <div key={l.glyph} className="bg-slate-900/40 border border-slate-700/50 p-4 rounded-2xl flex flex-col items-center hover:border-cyan-500/50 transition-colors">
                    <span className="font-hebrew text-4xl text-slate-100 mb-1">{l.glyph}</span>
                    <span className="text-xs font-bold text-slate-200">{l.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">/{l.sound}/</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in">
                <p className="text-sm text-slate-400 mb-4 italic">Vowels (Niqqud) are shown with א as a placeholder.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { glyph: 'אָ', name: 'Kamatz', sound: 'A' },
                    { glyph: 'אַ', name: 'Patach', sound: 'A' },
                    { glyph: 'אֵ', name: 'Tsere', sound: 'E' },
                    { glyph: 'אֶ', name: 'Segol', sound: 'E' },
                    { glyph: 'אִ', name: 'Hirik', sound: 'I' },
                    { glyph: 'אֹ', name: 'Holam', sound: 'O' },
                    { glyph: 'אֻ', name: 'Kubutz', sound: 'U' },
                    { glyph: 'אְ', name: 'Shva', sound: 'E/Silent' },
                  ].map(v => (
                    <div key={v.name} className="bg-slate-900/40 border border-slate-700/50 p-3 rounded-xl flex items-center gap-4 hover:border-violet-500/50 transition-colors">
                      <span className="font-hebrew text-3xl text-violet-400">{v.glyph}</span>
                      <div>
                        <div className="font-bold text-slate-200">{v.name}</div>
                        <div className="text-xs text-slate-500 font-mono">Sound: {v.sound}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          ) : (
            <div className="animate-fade-in">
              {activeTab === 'letters' && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {THAI_CONSONANTS.map(c => (
                    <div key={c.glyph} className="bg-slate-900/40 border border-slate-700/50 p-3 rounded-xl flex flex-col items-center hover:border-cyan-500/50 transition-colors">
                      <span className="font-thai text-3xl text-slate-100">{c.glyph}</span>
                      <span className="text-[10px] font-bold text-slate-300 truncate">{c.name}</span>
                      <span className={`text-[8px] uppercase tracking-tighter font-bold ${c.class === 'Mid' ? 'text-cyan-400' : c.class === 'High' ? 'text-emerald-400' : 'text-amber-400'}`}>{c.class}</span>
                      <span className="text-[10px] text-slate-500">/{c.sound}/</span>
                    </div>
                  ))}
                </div>
              )}
              {activeTab === 'vowels' && (
                <div className="flex flex-col gap-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-violet-400 mb-2 text-center border-b border-violet-500/20 pb-1">Short Vowels</h3>
                      <div className="space-y-2">
                        {shortVowels.map(v => (
                          <div key={v.glyph} className="bg-slate-900/40 border border-slate-700/50 p-3 rounded-xl flex flex-col items-center hover:border-violet-500/50 transition-colors">
                            <span className="font-thai text-3xl text-violet-400">{v.glyph}</span>
                            <span className="text-[10px] font-bold text-slate-200">{v.name}</span>
                            <span className="text-[10px] text-violet-300">/{v.sound}/</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-2 text-center border-b border-emerald-500/20 pb-1">Long Vowels</h3>
                      <div className="space-y-2">
                        {longVowels.map(v => (
                          <div key={v.glyph} className="bg-slate-900/40 border border-slate-700/50 p-3 rounded-xl flex flex-col items-center hover:border-emerald-500/50 transition-colors">
                            <span className="font-thai text-3xl text-emerald-400">{v.glyph}</span>
                            <span className="text-[10px] font-bold text-slate-200">{v.name}</span>
                            <span className="text-[10px] text-emerald-300">/{v.sound}/</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'tones' && <ThaiToneChart />}
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

export default LanguageReferenceModal;
