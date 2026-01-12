
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { VocabularyPracticeTarget, VocabularyItem, AppSettings } from '../types';
import ProgressBar from './ProgressBar';
import { SpeakerIcon } from './icons/SpeakerIcon';
import { generatePracticeWord, generateSpeech, checkWordTranslation } from '../services/geminiService';
import { decode, decodeAudioData } from '../utils/audio';

interface ThaiVocabularySessionProps {
  topic: string;
  onNext: () => void;
  progressCount: number;
  totalItems: number;
  dictionary: VocabularyItem[];
  onToggleDictionaryWord: (item: VocabularyItem) => void;
  settings: AppSettings;
}

interface BufferItem extends VocabularyPracticeTarget {
  audio?: string;
}

const ThaiVocabularySession: React.FC<ThaiVocabularySessionProps> = ({
  topic,
  onNext,
  progressCount,
  totalItems,
  dictionary,
  onToggleDictionaryWord,
  settings,
}) => {
  const [currentTarget, setCurrentTarget] = useState<BufferItem | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; status: 'correct' | 'partial' | 'wrong' | 'help'; feedback: string; correctMeaning: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const historyRef = useRef<string[]>([]);
  const lastFetchedIndexRef = useRef<number>(-1);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextItemRef = useRef<BufferItem | null>(null);
  const isPreloadingRef = useRef<boolean>(false);

  const preloadNext = useCallback(async () => {
    if (isPreloadingRef.current || progressCount >= totalItems) return;
    isPreloadingRef.current = true;
    try {
      const wordData = await generatePracticeWord(topic, 'Thai', historyRef.current);
      const audio = await generateSpeech(wordData.word, 'Thai', settings.voice).catch(() => undefined);
      nextItemRef.current = { ...wordData, audio };
    } catch (e) {
      console.warn("Preload failed", e);
    } finally {
      isPreloadingRef.current = false;
    }
  }, [topic, progressCount, totalItems, settings.voice]);

  const fetchNewWord = useCallback(async () => {
    // Prevent fetching the same item index multiple times (prevents flickering)
    if (lastFetchedIndexRef.current === progressCount) return;
    lastFetchedIndexRef.current = progressCount;

    setFeedback(null);
    setUserAnswer('');
    setError(null);

    // 1. Check if we have a pre-loaded item
    if (nextItemRef.current) {
      const item = nextItemRef.current;
      setCurrentTarget(item);
      historyRef.current.push(item.word);
      nextItemRef.current = null;
      preloadNext();
      return;
    }

    // 2. Otherwise, fetch fresh
    setIsProcessing(true);
    try {
      const wordData = await generatePracticeWord(topic, 'Thai', historyRef.current);
      historyRef.current.push(wordData.word);
      setCurrentTarget(wordData);
      
      generateSpeech(wordData.word, 'Thai', settings.voice).then(audio => {
        setCurrentTarget(prev => prev?.word === wordData.word ? { ...prev, audio } : prev);
      }).catch(() => {});

      preloadNext();
    } catch (e: any) { 
      setError('Failed to generate.'); 
      lastFetchedIndexRef.current = -1; // Allow retry
    } finally { 
      setIsProcessing(false); 
    }
  }, [topic, progressCount, preloadNext, settings.voice]);

  // Only trigger fetch when topic or progress index changes
  useEffect(() => { 
    fetchNewWord(); 
  }, [topic, progressCount]);

  const handleListen = async () => {
    if (!currentTarget) return;

    const playAudio = async (base64: string) => {
      if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') await ctx.resume();
      
      const buf = await decodeAudioData(decode(base64), ctx, 24000, 1);
      const src = ctx.createBufferSource();
      const gainNode = ctx.createGain();
      
      src.buffer = buf;
      gainNode.gain.value = settings.volume;
      
      src.connect(gainNode);
      gainNode.connect(ctx.destination);
      src.start();
    };

    if (currentTarget.audio) {
      try {
        await playAudio(currentTarget.audio);
        return;
      } catch (e) { console.error("Cached play fail", e); }
    }

    setIsAudioLoading(true);
    try {
      const base64 = await generateSpeech(currentTarget.word, 'Thai', settings.voice);
      setCurrentTarget(prev => prev ? { ...prev, audio: base64 } : prev);
      await playAudio(base64);
    } catch (e: any) { setError("Audio failed."); } finally { setIsAudioLoading(false); }
  };

  const handleCheck = async () => {
    if (!userAnswer.trim() || !currentTarget) return;
    setIsProcessing(true);
    try {
      const res = await checkWordTranslation(currentTarget.word, userAnswer, 'Thai');
      setFeedback({ ...res });
    } catch (e: any) { setError('Check failed.'); } finally { setIsProcessing(false); }
  };

  const handleHelp = () => {
    if (!currentTarget) return;
    setFeedback({ 
      isCorrect: false, 
      status: 'help', 
      feedback: "Don't worry, learn this word for next time!", 
      correctMeaning: currentTarget.english 
    });
  };

  const handleSkip = () => {
    onNext();
  };

  const isSaved = currentTarget && dictionary.some(item => item.word === currentTarget.word);

  return (
    <div className="relative animate-fade-in flex flex-col h-full">
      <div className="mb-3 flex-shrink-0"><ProgressBar current={progressCount} total={totalItems} label="Item" /></div>
      <div className="mb-3 flex-shrink-0">
        <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-emerald-500/80">
          Thai Vocab Practice
        </p>
        <h2 className="text-xl font-bold text-slate-100 truncate">{topic}</h2>
      </div>
      <div className="flex justify-center gap-3 mb-4 flex-shrink-0">
        <button onClick={handleListen} disabled={isAudioLoading} className="px-5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 border-2 border-slate-600 flex items-center gap-2">
          {isAudioLoading ? <div className="w-5 h-5 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" /> : <SpeakerIcon className="w-6 h-6 text-slate-300" />}
          <span className="text-xs font-bold uppercase tracking-widest text-slate-300">Listen</span>
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-4 px-1.5">
        <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-700 text-center shadow-inner min-h-[120px] flex flex-col justify-center">
          {!currentTarget && !error ? <div className="text-slate-500 animate-pulse">Preparing...</div> : currentTarget && (
            <>
              <h3 className="text-4xl md:text-6xl font-thai font-bold text-slate-100">{currentTarget.word}</h3>
              <p className="text-xl md:text-3xl font-black text-cyan-400/80 mt-1">{currentTarget.phonetic}</p>
            </>
          )}
          {error && <div className="text-red-400 font-medium px-4">{error}</div>}
        </div>
        
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Meaning:</label>
          <input 
            type="text" 
            value={userAnswer} 
            onChange={(e) => setUserAnswer(e.target.value)} 
            disabled={!!feedback || isProcessing} 
            placeholder="Type meaning in English..." 
            className="w-full bg-slate-700/50 border-2 border-slate-600 rounded-xl p-4 text-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all box-border" 
            onKeyDown={(e) => e.key === 'Enter' && handleCheck()} 
          />
        </div>

        {feedback && (
          <div className={`p-6 rounded-xl border-l-4 animate-fade-in-up ${
            feedback.status === 'help' ? 'border-blue-500 bg-blue-900/10' :
            feedback.status === 'correct' ? 'border-green-500 bg-green-900/10' :
            feedback.status === 'partial' ? 'border-yellow-500 bg-yellow-900/10' : 'border-red-500 bg-red-900/10'
          }`}>
            <div className="flex justify-between items-start mb-2">
              <h4 className={`text-lg font-black uppercase tracking-wider ${
                feedback.status === 'help' ? 'text-blue-400' :
                feedback.status === 'correct' ? 'text-green-400' :
                feedback.status === 'partial' ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {feedback.status === 'help' ? 'Maybe Next Time' : 
                 feedback.status === 'correct' ? 'Excellent' : 
                 feedback.status === 'partial' ? 'Nice try' : 'Wrong'}
              </h4>
              <button 
                onClick={handleListen}
                disabled={isAudioLoading}
                className="text-slate-400 hover:text-cyan-400 p-2 -mt-2 -mr-2 transition-colors disabled:opacity-50"
                title="Listen again"
              >
                {isAudioLoading ? (
                  <div className="w-6 h-6 border-2 border-t-cyan-400 border-transparent rounded-full animate-spin" />
                ) : (
                  <SpeakerIcon className="w-6 h-6" />
                )}
              </button>
            </div>
            <p className="text-slate-200 text-lg mb-4">{feedback.feedback}</p>
            <div className="bg-slate-900/60 p-4 rounded-lg border border-slate-700/50">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Correct Meaning</span>
              <span className="text-xl text-emerald-400 font-bold whitespace-pre-line">{feedback.correctMeaning}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button onClick={() => onToggleDictionaryWord({ word: currentTarget!.word, english: feedback.correctMeaning, phonetic: currentTarget!.phonetic })} className={`py-4 rounded-xl font-bold transition-all ${isSaved ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-slate-200'}`}>{isSaved ? 'Saved' : 'Save'}</button>
              <button onClick={onNext} className="py-4 rounded-xl bg-emerald-500 text-white font-bold">Next</button>
            </div>
          </div>
        )}

        {!feedback && !error && (
          <div className="mt-1 flex flex-col gap-2 flex-shrink-0">
            <div className="grid grid-cols-3 gap-2">
              <button onClick={handleCheck} disabled={isProcessing || !userAnswer.trim()} className="py-3 px-1 rounded-xl bg-emerald-500/40 text-emerald-300 border-2 border-emerald-400 font-bold text-sm transition-all hover:bg-emerald-500/50 hover:border-emerald-300 active:bg-emerald-500/60 disabled:opacity-50">Check</button>
              <button onClick={handleSkip} disabled={isProcessing} className="py-3 px-1 rounded-xl bg-orange-500/20 text-orange-400 border-2 border-orange-500 font-bold text-sm transition-all hover:bg-orange-500/30 hover:border-orange-400 active:bg-orange-500/40 disabled:opacity-50">Skip</button>
              <button onClick={handleHelp} disabled={isProcessing} className="py-3 px-1 rounded-xl bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500 font-bold text-sm transition-all hover:bg-yellow-500/30 hover:border-yellow-400 active:bg-yellow-500/40 disabled:opacity-50">Help</button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <button onClick={() => { lastFetchedIndexRef.current = -1; fetchNewWord(); }} className="mt-6 py-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold transition-all">
          Retry Generation
        </button>
      )}
      
      {isProcessing && <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center rounded-2xl z-20"><div className="w-12 h-12 border-4 border-t-emerald-400 border-transparent rounded-full animate-spin"></div></div>}
    </div>
  );
};

export default ThaiVocabularySession;
