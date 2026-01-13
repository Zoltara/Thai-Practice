
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PronunciationFeedback, VocabularyPracticeTarget, VocabularyItem, AppSettings } from '../types';
import ProgressBar from './ProgressBar';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { SpeakerIcon } from './icons/SpeakerIcon';
import { StopIcon } from './icons/StopIcon';
import { generatePracticeWord, evaluatePronunciation, speakHebrew } from '../services/geminiService';
import { blobToBase64 } from '../utils/audio';
import { stripNiqqud } from '../utils/hebrew';

interface HebrewSpeakingSessionProps {
  topic: string;
  onNext: () => void;
  progressCount: number;
  totalItems: number;
  dictionary: VocabularyItem[];
  onToggleDictionaryWord: (item: VocabularyItem) => void;
  showMarkings: boolean;
  onToggleMarkings: () => void;
  settings: AppSettings;
}

interface BufferItem extends VocabularyPracticeTarget {
}

const HebrewSpeakingSession: React.FC<HebrewSpeakingSessionProps> = ({
  topic,
  onNext,
  progressCount,
  totalItems,
  dictionary,
  onToggleDictionaryWord,
  showMarkings,
  onToggleMarkings,
  settings,
}) => {
  const [currentTarget, setCurrentTarget] = useState<BufferItem | null>(null);
  const [feedback, setFeedback] = useState<(PronunciationFeedback & { isHelpReveal?: boolean }) | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const historyRef = useRef<string[]>([]);
  const lastFetchedIndexRef = useRef<number>(-1);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const nextItemRef = useRef<BufferItem | null>(null);
  const isPreloadingRef = useRef<boolean>(false);

  const preloadNext = useCallback(async () => {
    if (isPreloadingRef.current || progressCount >= totalItems) return;
    isPreloadingRef.current = true;
    try {
      const wordData = await generatePracticeWord(topic, 'Hebrew', historyRef.current);
      nextItemRef.current = { ...wordData };
    } catch (e) {
      console.warn("Preload failed", e);
    } finally {
      isPreloadingRef.current = false;
    }
  }, [topic, progressCount, totalItems]);

  const fetchNewWord = useCallback(async () => {
    if (lastFetchedIndexRef.current === progressCount) return;
    lastFetchedIndexRef.current = progressCount;

    setFeedback(null);
    setError(null);

    if (nextItemRef.current) {
      const item = nextItemRef.current;
      setCurrentTarget(item);
      historyRef.current.push(item.word);
      nextItemRef.current = null;
      preloadNext();
      return;
    }

    setIsProcessing(true);
    try {
      const wordData = await generatePracticeWord(topic, 'Hebrew', historyRef.current);
      historyRef.current.push(wordData.word);
      setCurrentTarget(wordData);

      preloadNext();
    } catch (e: any) {
      setError(`Failed to generate content.`);
      lastFetchedIndexRef.current = -1;
    } finally {
      setIsProcessing(false);
    }
  }, [topic, progressCount, preloadNext]);

  useEffect(() => {
    fetchNewWord();
    return () => {
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [topic, progressCount]);

  const handleListen = async () => {
    if (!currentTarget) return;

    setIsAudioLoading(true);
    try {
      await speakHebrew(currentTarget.word, settings.volume);
    } catch (e: any) { 
      setError("Audio failed. Make sure your browser supports Hebrew speech."); 
    } finally { 
      setIsAudioLoading(false); 
    }
  };

  const handleStartRecording = async () => {
    if (isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const base64 = await blobToBase64(audioBlob);
        
        setIsProcessing(true);
        try {
          const result = await evaluatePronunciation(currentTarget!.word, base64, 'audio/webm', 'Hebrew');
          setFeedback(result);
        } catch (e) {
          setError("Failed to evaluate pronunciation.");
        } finally {
          setIsProcessing(false);
          stream.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      setError("Microphone access denied.");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSkip = () => {
    onNext();
  };

  const displayedWord = (currentTarget && !showMarkings) ? stripNiqqud(currentTarget.word) : currentTarget?.word || '';
  const isSaved = currentTarget && dictionary.some(item => item.word === currentTarget.word);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 50) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="relative animate-fade-in flex flex-col h-full">
      <div className="mb-6 flex-shrink-0"><ProgressBar current={progressCount} total={totalItems} label="Item" /></div>
      
      <div className="flex justify-between items-center mb-6 flex-shrink-0">
        <div>
          <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-violet-500/80">
            Speaking Practice Hebrew
          </p>
          <h2 className="text-xl font-bold text-slate-100 truncate">{topic}</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 px-1.5">
        <div className="flex justify-center gap-3">
          <button 
            onClick={onToggleMarkings} 
            className={`w-10 h-10 md:w-12 md:h-12 rounded-xl border-2 transition-colors flex items-center justify-center ${
              showMarkings ? 'bg-cyan-500 text-slate-900 border-cyan-400' : 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'
            }`}
            title={showMarkings ? "Hide Vowels" : "Show Vowels"}
          >
            <span className="font-hebrew text-2xl md:text-4xl font-bold leading-none">{showMarkings ? 'א' : 'אָ'}</span>
          </button>
          <button onClick={handleListen} disabled={isAudioLoading} className="px-5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 border-2 border-slate-600 flex items-center gap-2 transition-colors">
            {isAudioLoading ? <div className="w-5 h-5 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" /> : <SpeakerIcon className="w-6 h-6 text-slate-200" />}
            <span className="text-xs font-bold uppercase tracking-widest text-slate-300">Listen</span>
          </button>
        </div>

        <div className="text-center flex flex-col justify-center space-y-4 py-4">
          {!currentTarget && !error ? <div className="text-slate-500 animate-pulse">Preparing content...</div> : currentTarget && (
            <>
              <h3 className="text-4xl md:text-6xl font-hebrew font-bold text-slate-100" dir="rtl">{displayedWord}</h3>
              <p className="text-xl md:text-3xl font-black text-cyan-400">{currentTarget.phonetic}</p>
              <div className="space-y-1">
                 <p className="text-lg text-slate-400 whitespace-pre-line">{currentTarget.english}</p>
              </div>
              
              {!feedback && (
                <div className="flex flex-col items-center gap-8 pt-6">
                  <button 
                    onClick={isRecording ? handleStopRecording : handleStartRecording} 
                    disabled={isProcessing} 
                    className={`group flex flex-col items-center gap-3 transition-all duration-300 ${isRecording ? 'scale-110' : 'hover:scale-105 active:scale-95'}`}
                  >
                    <div className={`p-8 rounded-full shadow-2xl transition-all duration-300 ${isRecording ? 'bg-red-500 animate-pulse ring-8 ring-red-500/20' : 'bg-violet-500 hover:bg-violet-600 ring-0 hover:ring-8 hover:ring-violet-500/20'}`}>
                      {isRecording ? <StopIcon className="w-12 h-12 text-white" /> : <MicrophoneIcon className="w-12 h-12 text-white" />}
                    </div>
                    <span className="text-sm text-slate-400 font-black uppercase tracking-widest group-hover:text-slate-200 transition-colors">
                      {isRecording ? 'Stop' : 'Record'}
                    </span>
                  </button>

                  <div className="w-full max-w-[240px]">
                    <button
                      onClick={handleSkip}
                      disabled={isProcessing || isRecording}
                      className="w-full py-2.5 px-4 rounded-xl bg-orange-500/10 text-orange-400 border-2 border-orange-500/30 font-bold text-xs uppercase tracking-widest transition-all hover:bg-orange-500/20 active:bg-orange-500/30 disabled:opacity-30"
                    >
                      Skip Item
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
          {error && <div className="text-red-400 font-medium px-4">{error}</div>}
        </div>

        {feedback && (
          <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-700 animate-fade-in-up">
            <div className={`p-4 rounded-xl border-l-4 ${feedback.isHelpReveal ? 'border-blue-500 bg-blue-900/10' : 'border-violet-500 bg-violet-900/10'}`}>
              <div className="flex justify-between items-start mb-2">
                <h4 className={`text-lg font-black uppercase tracking-wider ${feedback.isHelpReveal ? 'text-blue-400' : 'text-violet-400'}`}>
                  {feedback.isHelpReveal ? 'Maybe Next Time' : 'Pronunciation Result'}
                </h4>
                {!feedback.isHelpReveal && (
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block leading-none mb-1">Score</span>
                    <span className={`text-2xl font-black ${getScoreColor(feedback.score)}`}>{feedback.score}<span className="text-sm opacity-50">/100</span></span>
                  </div>
                )}
              </div>
              <p className="text-slate-300 leading-relaxed whitespace-pre-line">{feedback.feedback}</p>
              {feedback.tips && (
                <div className="mt-3 text-xs text-slate-500 border-t border-slate-800 pt-3 italic whitespace-pre-line">
                  Tip: {feedback.tips}
                </div>
              )}
            </div>
            
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => onToggleDictionaryWord({ word: currentTarget!.word, english: currentTarget!.english, thai: currentTarget!.thai, phonetic: currentTarget!.phonetic })} 
                className={`flex-1 py-4 rounded-xl font-black uppercase tracking-widest transition-all text-sm ${isSaved ? 'bg-amber-500 text-slate-900 border-amber-400 border-2' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
              >
                {isSaved ? 'Saved' : 'Save Word'}
              </button>
              <button 
                onClick={onNext} 
                className="flex-1 py-4 rounded-xl bg-violet-500 hover:bg-violet-600 text-white font-black uppercase tracking-widest transition-all text-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {isProcessing && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center rounded-2xl z-20">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-t-violet-500 border-r-violet-500 border-b-violet-500 border-l-transparent rounded-full animate-spin"></div>
            <span className="text-violet-400 font-bold uppercase tracking-widest text-sm">Analyzing...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default HebrewSpeakingSession;
