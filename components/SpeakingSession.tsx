
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PronunciationFeedback, VocabularyPracticeTarget, VocabularyItem, Language } from '../types';
import ProgressBar from './ProgressBar';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { SpeakerIcon } from './icons/SpeakerIcon';
import { StopIcon } from './icons/StopIcon';
import { generatePracticeWord, evaluatePronunciation, generateSpeech } from '../services/geminiService';
import { blobToBase64, decode, decodeAudioData } from '../utils/audio';

interface SpeakingSessionProps {
  topic: string;
  language: Language;
  onNext: () => void;
  progressCount: number;
  totalItems: number;
  dictionary: VocabularyItem[];
  onToggleDictionaryWord: (item: VocabularyItem) => void;
}

const LoadingSpinner: React.FC = () => (
  <div className="absolute inset-0 bg-slate-800 bg-opacity-50 flex items-center justify-center rounded-xl z-20">
    <div className="w-12 h-12 border-4 border-t-cyan-400 border-r-cyan-400 border-b-cyan-400 border-l-transparent rounded-full animate-spin"></div>
  </div>
);

const SpeakingSession: React.FC<SpeakingSessionProps> = ({
  topic,
  language,
  onNext,
  progressCount,
  totalItems,
  dictionary,
  onToggleDictionaryWord
}) => {
  const [currentTarget, setCurrentTarget] = useState<VocabularyPracticeTarget | null>(null);
  const [feedback, setFeedback] = useState<(PronunciationFeedback & { isHelpReveal?: boolean }) | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);

  const fetchNewWord = useCallback(async () => {
    setIsProcessing(true);
    setFeedback(null);
    setError(null);
    try {
      const wordData = await generatePracticeWord(topic, language, currentTarget?.word);
      setCurrentTarget(wordData);
    } catch (e) {
      setError('Failed to generate content.');
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  }, [topic, language, currentTarget]);

  useEffect(() => {
    fetchNewWord();
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        await processAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setError(null);
    } catch (e) {
      setError('Could not access microphone.');
      console.error(e);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    if (!currentTarget) return;
    setIsProcessing(true);
    try {
      const base64Audio = await blobToBase64(audioBlob);
      const result = await evaluatePronunciation(currentTarget.word, base64Audio, 'audio/webm', language);
      setFeedback({ ...result, isHelpReveal: false });
    } catch (e) {
      setError('Evaluation failed.');
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleHelp = () => {
    if (!currentTarget) return;
    setFeedback({
      score: 0,
      isHelpReveal: true,
      feedback: "Don't worry! Try listening to the pronunciation and follow these tips to improve:",
      tips: `Listen closely to the ${language} pronunciation. Focus on the distinct ${language === 'Thai' ? 'tones' : 'syllables'} and flow.`
    });
  };

  const handleSkip = () => {
    fetchNewWord();
  };

  const handleListen = async () => {
    if (!currentTarget || isAudioLoading) return;
    setIsAudioLoading(true);
    setError(null);
    try {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        const audioContext = audioContextRef.current;
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }

        const base64Audio = await generateSpeech(currentTarget.word, language);
        const audioBytes = decode(base64Audio);
        const audioBuffer = await decodeAudioData(audioBytes, audioContext, 24000, 1);
        
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start();
    } catch (e) {
      console.error("Audio playback error", e);
      setError("Speech failed.");
    } finally {
      setIsAudioLoading(false);
    }
  };

  const handleNext = () => {
    onNext();
    fetchNewWord();
  };

  const getScoreColor = (score: number) => {
    const s = score <= 1 ? score * 100 : score;
    if (s >= 80) return 'text-green-400';
    if (s >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const langFont = language === 'Thai' ? 'font-thai' : 'font-hebrew';
  const isRTL = language === 'Hebrew';

  const getHeaderText = () => {
    if (!feedback) return '';
    if (feedback.isHelpReveal) return 'Maybe Next Time';
    const s = feedback.score <= 1 ? feedback.score * 100 : feedback.score;
    return s >= 80 ? 'Excellent!' : 'Good try';
  };

  const getHeaderColorClass = () => {
    if (!feedback) return '';
    if (feedback.isHelpReveal) return 'text-red-500';
    return getScoreColor(feedback.score);
  }

  const isWordSaved = currentTarget ? dictionary.some(item => item.word === currentTarget.word) : false;

  const displayScore = feedback ? Math.round(feedback.score <= 1 ? feedback.score * 100 : feedback.score) : 0;

  return (
    <div className="relative animate-fade-in">
      <div className="mb-6">
        <ProgressBar current={progressCount} total={totalItems} label="Item" />
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-sm text-slate-400">Speak &bull; {language}</p>
          <h2 className="text-2xl font-semibold text-violet-400">{topic}</h2>
        </div>
      </div>

      <div className="text-center space-y-8 min-h-[350px] flex flex-col justify-center">
        {!currentTarget ? (
           <div className="text-slate-400 text-lg">Preparing...</div>
        ) : (
          <>
            <div className="space-y-3">
              <h3 
                className={`text-6xl md:text-7xl ${langFont} font-bold text-slate-100`}
                dir={isRTL ? "rtl" : "ltr"}
              >
                {currentTarget.word}
              </h3>
              <p className="text-2xl md:text-3xl font-medium text-cyan-400">{currentTarget.phonetic}</p>
              <p className="text-lg md:text-xl text-slate-400 whitespace-pre-line">{currentTarget.english}</p>
            </div>

            <div className="flex justify-center gap-12 items-center">
              <button
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                disabled={isProcessing || isAudioLoading}
                className={`flex flex-col items-center gap-3 group transition-all transform ${isRecording ? 'scale-110' : 'hover:scale-105'}`}
              >
                <div className={`p-8 rounded-full shadow-xl transition-all ${
                  isRecording ? 'bg-red-500 animate-pulse ring-4 ring-red-500/30' : 'bg-violet-500 hover:bg-violet-600'
                }`}>
                  {isRecording ? <StopIcon className="w-10 h-10 text-white" /> : <MicrophoneIcon className="w-10 h-10 text-white" />}
                </div>
                <span className="text-sm text-slate-400 font-semibold uppercase tracking-wider">
                  {isRecording ? 'Stop' : 'Record'}
                </span>
              </button>

              <button
                onClick={handleListen}
                disabled={isAudioLoading || isRecording}
                className="flex flex-col items-center gap-3 group"
                title="Listen"
              >
                <div className="p-5 rounded-full bg-slate-700 hover:bg-slate-600 transition-all shadow-lg group-disabled:opacity-50">
                   {isAudioLoading ? <div className="w-7 h-7 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" /> : <SpeakerIcon className="w-7 h-7 text-slate-200" />}
                </div>
                <span className="text-sm text-slate-400 font-semibold uppercase tracking-wider">Listen</span>
              </button>
            </div>

            {error && <p className="text-red-400 text-base animate-fade-in">{error}</p>}

            {feedback ? (
              <div className="bg-slate-900/50 rounded-xl p-8 border border-slate-700 animate-fade-in-up">
                {!feedback.isHelpReveal && feedback.score > 0 && (
                  <div className="flex flex-col items-center mb-6">
                    <span className="text-slate-400 text-sm uppercase tracking-wider font-bold mb-2">Score</span>
                    <div className={`text-5xl font-extrabold ${getScoreColor(feedback.score)}`}>
                      {displayScore}/100
                    </div>
                  </div>
                )}
                
                <div className="text-left space-y-4">
                    <div className={`p-4 bg-slate-800/50 rounded-lg border-l-4 ${feedback.isHelpReveal ? 'border-red-500' : 'border-violet-500'}`}>
                        <h4 className={`text-lg font-bold mb-1 ${getHeaderColorClass()}`}>
                          {getHeaderText()}
                        </h4>
                        <p className="text-slate-300 text-base md:text-lg whitespace-pre-line">{feedback.feedback}</p>
                    </div>
                    <div className="p-4 bg-slate-800/50 rounded-lg border-l-4 border-cyan-500">
                         <span className="text-xs font-bold text-cyan-400 block mb-1 uppercase tracking-widest">TIP</span>
                        <p className="text-slate-300 text-base md:text-lg whitespace-pre-line">{feedback.tips}</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mt-8">
                    <button
                        onClick={() => onToggleDictionaryWord({ word: currentTarget.word, english: currentTarget.english })}
                        className={`flex-1 py-4 px-6 rounded-lg font-bold text-lg transition-all ${
                          isWordSaved ? 'bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/20' : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                        }`}
                    >
                        {isWordSaved ? 'Saved to Dictionary' : 'Save to my Dictionary'}
                    </button>
                    <button
                        onClick={handleNext}
                        className="flex-1 py-4 px-6 rounded-lg bg-violet-500 hover:bg-violet-600 text-white font-bold text-lg transition-colors shadow-lg shadow-violet-500/20"
                    >
                        Next
                    </button>
                </div>
              </div>
            ) : (
              <div className="pt-4 flex justify-center gap-3">
                <button
                  onClick={handleSkip}
                  className="px-6 py-3 rounded-lg border-2 border-slate-700 hover:border-slate-600 hover:bg-slate-700/50 text-slate-400 font-bold text-base transition-all"
                >
                  Skip
                </button>
                <button
                  onClick={handleHelp}
                  className="px-6 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-slate-200 font-bold text-base transition-all"
                >
                  Help me (Show Tips)
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {(isProcessing) && <LoadingSpinner />}
    </div>
  );
};

export default SpeakingSession;
