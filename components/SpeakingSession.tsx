import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PronunciationFeedback, VocabularyPracticeTarget, VocabularyItem } from '../types';
import ProgressBar from './ProgressBar';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { SpeakerIcon } from './icons/SpeakerIcon';
import { StopIcon } from './icons/StopIcon';
import { ArrowDownTrayIcon } from './icons/ArrowDownTrayIcon';
import { generatePracticeWord, evaluatePronunciation, generateSpeech } from '../services/geminiService';
import { blobToBase64, decode, decodeAudioData, downloadBase64Audio } from '../utils/audio';

interface SpeakingSessionProps {
  topic: string;
  onNext: () => void;
  progressCount: number;
  totalItems: number;
  onToggleDictionaryWord: (item: VocabularyItem) => void;
}

const LoadingSpinner: React.FC = () => (
  <div className="absolute inset-0 bg-slate-800 bg-opacity-50 flex items-center justify-center rounded-xl z-20">
    <div className="w-12 h-12 border-4 border-t-cyan-400 border-r-cyan-400 border-b-cyan-400 border-l-transparent rounded-full animate-spin"></div>
  </div>
);

const SpeakingSession: React.FC<SpeakingSessionProps> = ({
  topic,
  onNext,
  progressCount,
  totalItems,
  onToggleDictionaryWord
}) => {
  const [currentTarget, setCurrentTarget] = useState<VocabularyPracticeTarget | null>(null);
  const [feedback, setFeedback] = useState<PronunciationFeedback | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);

  const fetchNewWord = useCallback(async () => {
    setIsProcessing(true);
    setFeedback(null);
    setError(null);
    try {
      const word = await generatePracticeWord(topic, currentTarget?.thai);
      setCurrentTarget(word);
    } catch (e) {
      setError('Failed to generate a new word.');
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  }, [topic, currentTarget]);

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
      setError('Could not access microphone. Please allow permissions.');
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
      const result = await evaluatePronunciation(currentTarget.thai, base64Audio, 'audio/webm');
      setFeedback(result);
    } catch (e) {
      setError('Failed to evaluate pronunciation. Try again.');
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleListen = async () => {
    if (!currentTarget || isAudioLoading) return;
    setIsAudioLoading(true);
    try {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        const audioContext = audioContextRef.current;
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }

        const base64Audio = await generateSpeech(currentTarget.thai);
        const audioBytes = decode(base64Audio);
        const audioBuffer = await decodeAudioData(audioBytes, audioContext, 24000, 1);
        
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start();
    } catch (e) {
      console.error("Audio playback error", e);
    } finally {
      setIsAudioLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!currentTarget || isDownloading) return;
    setIsDownloading(true);
    try {
      const base64Audio = await generateSpeech(currentTarget.thai);
      downloadBase64Audio(base64Audio, `thai_word_${progressCount}.pcm`);
    } catch (e) {
      console.error("Download failed", e);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleNext = () => {
    onNext();
    fetchNewWord();
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 50) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <div className="relative animate-fade-in">
      <div className="mb-6">
        <ProgressBar current={progressCount} total={totalItems} />
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-sm text-slate-400">Pronunciation Practice</p>
          <h2 className="text-2xl font-semibold text-violet-400">{topic}</h2>
        </div>
      </div>

      <div className="text-center space-y-8 min-h-[350px] flex flex-col justify-center">
        {!currentTarget ? (
           <div className="text-slate-400 text-lg">Loading word...</div>
        ) : (
          <>
            <div className="space-y-3">
              <h3 className="text-6xl md:text-7xl font-thai font-bold text-slate-100">{currentTarget.thai}</h3>
              <p className="text-2xl md:text-3xl font-medium text-cyan-400">{currentTarget.phonetic}</p>
              <p className="text-lg md:text-xl text-slate-400">{currentTarget.english}</p>
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-8 items-center">
              <button
                onClick={handleDownload}
                disabled={isDownloading || isRecording}
                className="flex flex-col items-center gap-3 group"
                title="Save reference audio"
              >
                <div className="p-5 rounded-full bg-slate-700 hover:bg-slate-600 transition-all shadow-lg group-disabled:opacity-50">
                   {isDownloading ? (
                        <div className="w-7 h-7 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                   ) : (
                       <ArrowDownTrayIcon className="w-7 h-7 text-slate-200" />
                   )}
                </div>
                <span className="text-sm text-slate-400 font-semibold">Save</span>
              </button>

              <button
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                disabled={isProcessing || isAudioLoading}
                className={`flex flex-col items-center gap-3 group transition-all transform ${isRecording ? 'scale-110' : 'hover:scale-105'}`}
              >
                <div className={`p-8 rounded-full shadow-xl transition-all ${
                  isRecording ? 'bg-red-500 animate-pulse ring-4 ring-red-500/30' : 'bg-violet-500 hover:bg-violet-600'
                }`}>
                  {isRecording ? (
                    <StopIcon className="w-10 h-10 text-white" />
                  ) : (
                    <MicrophoneIcon className="w-10 h-10 text-white" />
                  )}
                </div>
                <span className="text-sm text-slate-400 font-semibold uppercase tracking-wider">
                  {isRecording ? 'Stop' : 'Record'}
                </span>
              </button>

              <button
                onClick={handleListen}
                disabled={isAudioLoading || isRecording}
                className="flex flex-col items-center gap-3 group"
                title="Listen to pronunciation"
              >
                <div className="p-5 rounded-full bg-slate-700 hover:bg-slate-600 transition-all shadow-lg group-disabled:opacity-50">
                   {isAudioLoading ? (
                        <div className="w-7 h-7 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                   ) : (
                       <SpeakerIcon className="w-7 h-7 text-slate-200" />
                   )}
                </div>
                <span className="text-sm text-slate-400 font-semibold">Listen</span>
              </button>
            </div>

            {/* Error Message */}
            {error && <p className="text-red-400 text-base animate-fade-in">{error}</p>}

            {/* Feedback Section */}
            {feedback && (
              <div className="bg-slate-900/50 rounded-xl p-8 border border-slate-700 animate-fade-in-up">
                <div className="flex flex-col items-center mb-6">
                  <span className="text-slate-400 text-sm uppercase tracking-wider font-bold mb-2">Score</span>
                  <div className={`text-5xl font-extrabold ${getScoreColor(feedback.score)}`}>
                    {feedback.score}/100
                  </div>
                </div>
                
                <div className="text-left space-y-4">
                    <div className="p-4 bg-slate-800/50 rounded-lg border-l-4 border-violet-500">
                        <p className="text-slate-300 text-base md:text-lg">{feedback.feedback}</p>
                    </div>
                    <div className="p-4 bg-slate-800/50 rounded-lg border-l-4 border-cyan-500">
                         <span className="text-xs font-bold text-cyan-400 block mb-1 uppercase tracking-widest">TIP</span>
                        <p className="text-slate-300 text-base md:text-lg">{feedback.tips}</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mt-8">
                    <button
                        onClick={() => onToggleDictionaryWord({ thai: currentTarget.thai, english: currentTarget.english })}
                        className="flex-1 py-4 px-6 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-lg transition-colors"
                    >
                        Save Word
                    </button>
                    <button
                        onClick={handleNext}
                        className="flex-1 py-4 px-6 rounded-lg bg-violet-500 hover:bg-violet-600 text-white font-bold text-lg transition-colors shadow-lg shadow-violet-500/20"
                    >
                        Next Word
                    </button>
                </div>
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