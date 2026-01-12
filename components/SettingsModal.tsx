
import React, { useState, useRef } from 'react';
import { XMarkIcon } from './icons/XMarkIcon';
import { SpeakerWaveIcon } from './icons/SpeakerWaveIcon';
import { PlayIcon } from './icons/PlayIcon';
import { AppSettings } from '../types';
import { generateSpeech } from '../services/geminiService';
import { decode, decodeAudioData } from '../utils/audio';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
}

const FEMALE_VOICES = [
  { id: 'Kore', name: 'Kore' },
  { id: 'Zephyr', name: 'Zephyr' },
  { id: 'Aoede', name: 'Aoede' },
];

const MALE_VOICES = [
  { id: 'Puck', name: 'Puck' },
  { id: 'Charon', name: 'Charon' },
  { id: 'Fenrir', name: 'Fenrir' },
];

const TEST_SENTENCE = "I will speak the words and sentences for you";

interface VoiceCardProps {
  voice: { id: string; name: string };
  gender: string;
  isActive: boolean;
  isTesting: boolean;
  testingVoiceId: string | null;
  onVoiceChange: (voiceId: string) => void;
  onTestVoice: (voiceId: string, e: React.MouseEvent) => void;
}

const VoiceCard: React.FC<VoiceCardProps> = ({ 
  voice, 
  gender, 
  isActive, 
  isTesting, 
  testingVoiceId, 
  onVoiceChange, 
  onTestVoice 
}) => {
  return (
    <button
      onClick={() => onVoiceChange(voice.id)}
      className={`relative w-full p-2.5 rounded-xl border-2 transition-all text-left flex items-center justify-between group ${
        isActive 
          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-100 ring-2 ring-cyan-500/20' 
          : 'bg-slate-700/40 border-slate-700 text-slate-400 hover:border-slate-600'
      }`}
    >
      <div className="flex flex-col min-w-0">
        <span className="font-bold text-xs md:text-sm truncate">{voice.name}</span>
        <span className="text-[8px] opacity-60 uppercase font-black tracking-wider">{gender}</span>
      </div>
      
      <button
        onClick={(e) => onTestVoice(voice.id, e)}
        disabled={!!testingVoiceId}
        className={`p-1.5 rounded-lg transition-all flex-shrink-0 ml-1 ${
          isTesting 
            ? 'bg-cyan-400 text-slate-900 animate-pulse' 
            : 'bg-slate-800/60 text-slate-400 hover:text-cyan-400 hover:bg-slate-800'
        }`}
        title="Test Voice"
      >
        {isTesting ? (
          <div className="w-3.5 h-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
        ) : (
          <PlayIcon className="w-3.5 h-3.5" />
        )}
      </button>
    </button>
  );
};

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSettingsChange }) => {
  const [testingVoiceId, setTestingVoiceId] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  if (!isOpen) return null;

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ ...settings, volume: parseFloat(e.target.value) });
  };

  const handleVoiceChange = (voiceId: string) => {
    onSettingsChange({ ...settings, voice: voiceId });
  };

  const handleTestVoice = async (voiceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (testingVoiceId) return;

    setTestingVoiceId(voiceId);
    try {
      const base64 = await generateSpeech(TEST_SENTENCE, 'English', voiceId);
      
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') await ctx.resume();

      const buf = await decodeAudioData(decode(base64), ctx, 24000, 1);
      const src = ctx.createBufferSource();
      const gainNode = ctx.createGain();
      
      src.buffer = buf;
      gainNode.gain.value = settings.volume;
      
      src.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      src.onended = () => setTestingVoiceId(null);
      src.start();
    } catch (error) {
      console.error("Test voice failed", error);
      setTestingVoiceId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl border border-slate-700 p-5 flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg md:text-xl font-bold text-slate-100 uppercase tracking-widest">Audio Settings</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Volume Section */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <SpeakerWaveIcon className="w-4 h-4" />
                Master Volume
              </label>
              <span className="text-xs font-bold text-cyan-400">{Math.round(settings.volume * 100)}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              value={settings.volume} 
              onChange={handleVolumeChange}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          {/* Voice Section */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">AI Voice Models</label>
            <div className="grid grid-cols-2 gap-3">
              {/* Female Column */}
              <div className="space-y-2">
                <div className="text-[9px] font-bold text-pink-400/70 uppercase tracking-[0.15em] mb-1 px-1">Female</div>
                {FEMALE_VOICES.map(voice => (
                  <VoiceCard 
                    key={voice.id} 
                    voice={voice} 
                    gender="Female" 
                    isActive={settings.voice === voice.id}
                    isTesting={testingVoiceId === voice.id}
                    testingVoiceId={testingVoiceId}
                    onVoiceChange={handleVoiceChange}
                    onTestVoice={handleTestVoice}
                  />
                ))}
              </div>
              
              {/* Male Column */}
              <div className="space-y-2">
                <div className="text-[9px] font-bold text-blue-400/70 uppercase tracking-[0.15em] mb-1 px-1">Male</div>
                {MALE_VOICES.map(voice => (
                  <VoiceCard 
                    key={voice.id} 
                    voice={voice} 
                    gender="Male" 
                    isActive={settings.voice === voice.id}
                    isTesting={testingVoiceId === voice.id}
                    testingVoiceId={testingVoiceId}
                    onVoiceChange={handleVoiceChange}
                    onTestVoice={handleTestVoice}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <button 
            onClick={onClose}
            className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg active:scale-[0.98] text-sm uppercase tracking-widest"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
