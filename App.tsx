
import React, { useState, useCallback, useRef, useEffect } from 'react';
import TopicSelector from './components/TopicSelector';
import LanguageSelector from './components/LanguageSelector';
import ThaiReadingSession from './components/ThaiReadingSession';
import HebrewReadingSession from './components/HebrewReadingSession';
import ThaiVocabularySession from './components/ThaiVocabularySession';
import HebrewVocabularySession from './components/HebrewVocabularySession';
import ThaiSpeakingSession from './components/ThaiSpeakingSession';
import HebrewSpeakingSession from './components/HebrewSpeakingSession';
import SessionComplete from './components/SessionComplete';
import DictionaryView from './components/DictionaryView';
import LanguageReferenceModal from './components/LanguageReferenceModal';
import SettingsModal from './components/SettingsModal';
import { Feedback, VocabularyItem, PracticeMode, Language, VocabularyPracticeTarget, AppSettings } from './types';
import { generateParagraph, checkTranslation, generateSpeech, generatePracticeWord } from './services/geminiService';
import { BookOpenIcon } from './components/icons/BookOpenIcon';
import { BookmarkIcon } from './components/icons/BookmarkIcon';
import { HomeIcon } from './components/icons/HomeIcon';
import { InformationCircleIcon } from './components/icons/InformationCircleIcon';
import { AdjustmentsHorizontalIcon } from './components/icons/AdjustmentsHorizontalIcon';
import { SESSION_LENGTH } from './constants';
import { decode, decodeAudioData } from './utils/audio';

interface PreloadItem {
  paragraph?: string;
  word?: string;
  phonetic: string;
  english?: string;
  thai?: string;
  audio?: string;
}

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language | null>(null);
  const [topic, setTopic] = useState<string | null>(null);
  const [mode, setMode] = useState<PracticeMode>('reading');
  const [currentParagraph, setCurrentParagraph] = useState<string>('');
  const [currentPhonetic, setCurrentPhonetic] = useState<string>('');
  const [currentAudio, setCurrentAudio] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAudioLoading, setIsLoadingAudio] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [userTranslation, setUserTranslation] = useState('');
  const [progressCount, setProgressCount] = useState(0);
  const [dictionary, setDictionary] = useState<VocabularyItem[]>([]);
  const [isDictionaryVisible, setIsDictionaryVisible] = useState(false);
  const [isRefVisible, setIsRefVisible] = useState(false);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [showMarkings, setShowMarkings] = useState(false);
  
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('langPracticeSettings');
      return saved ? JSON.parse(saved) : { volume: 0.8, voice: 'Kore' };
    } catch {
      return { volume: 0.8, voice: 'Kore' };
    }
  });

  const historyRef = useRef<string[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextItemRef = useRef<PreloadItem | null>(null);
  const isPreloadingRef = useRef<boolean>(false);

  useEffect(() => {
    localStorage.setItem('langPracticeSettings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    try {
      const savedDictionary = localStorage.getItem('langPracticeDictionary');
      if (savedDictionary) {
        setDictionary(JSON.parse(savedDictionary));
      }
    } catch (error) {
      console.error("Could not load dictionary from localStorage:", error);
    }
  }, []);

  const handleToggleDictionaryWord = (item: VocabularyItem) => {
    setDictionary(prevDictionary => {
      const isSaved = prevDictionary.some(wordItem => wordItem.word === item.word);
      let newDictionary;
      if (isSaved) {
        newDictionary = prevDictionary.filter(wordItem => wordItem.word !== item.word);
      } else {
        newDictionary = [...prevDictionary, item];
      }
      try {
        localStorage.setItem('langPracticeDictionary', JSON.stringify(newDictionary));
      } catch (error) {
        console.error("Could not save dictionary to localStorage:", error);
      }
      return newDictionary;
    });
  };

  const preloadNext = useCallback(async (selectedTopic: string, selectedLang: Language, selectedMode: PracticeMode) => {
    if (isPreloadingRef.current || progressCount >= SESSION_LENGTH) return;
    isPreloadingRef.current = true;
    try {
      if (selectedMode === 'reading') {
        const result = await generateParagraph(selectedTopic, selectedLang, historyRef.current);
        const audio = await generateSpeech(result.paragraph, selectedLang, settings.voice).catch(() => undefined);
        nextItemRef.current = { ...result, audio };
      } else {
        const result = await generatePracticeWord(selectedTopic, selectedLang, historyRef.current);
        const audio = await generateSpeech(result.word, selectedLang, settings.voice).catch(() => undefined);
        nextItemRef.current = { ...result, audio };
      }
    } catch (e) {
      console.warn("Preload failed", e);
    } finally {
      isPreloadingRef.current = false;
    }
  }, [progressCount, settings.voice]);

  const handleNewParagraph = useCallback(async (selectedTopic: string, selectedLang: Language) => {
    setError(null);
    setFeedback(null);
    setUserTranslation('');

    if (nextItemRef.current && nextItemRef.current.paragraph) {
      const item = nextItemRef.current;
      setCurrentParagraph(item.paragraph!);
      setCurrentPhonetic(item.phonetic);
      setCurrentAudio(item.audio || null);
      historyRef.current.push(item.paragraph!);
      nextItemRef.current = null;
      preloadNext(selectedTopic, selectedLang, 'reading');
      return;
    }

    setIsLoading(true);
    try {
      const result = await generateParagraph(selectedTopic, selectedLang, historyRef.current);
      setCurrentParagraph(result.paragraph);
      setCurrentPhonetic(result.phonetic);
      historyRef.current.push(result.paragraph);
      generateSpeech(result.paragraph, selectedLang, settings.voice).then(audio => setCurrentAudio(audio)).catch(() => {});
      preloadNext(selectedTopic, selectedLang, 'reading');
    } catch (e: any) {
      setError(e?.message || "Failed to load content.");
    } finally {
      setIsLoading(false);
    }
  }, [preloadNext, settings.voice]);

  const handleTopicSelect = async (selectedTopic: string, selectedMode: PracticeMode) => {
    if (!language) return;
    setTopic(selectedTopic);
    setMode(selectedMode);
    setProgressCount(1);
    historyRef.current = [];
    nextItemRef.current = null;
    
    if (selectedMode === 'reading') {
      handleNewParagraph(selectedTopic, language);
    } else {
      preloadNext(selectedTopic, language, selectedMode);
    }
  };

  const handleSubmitTranslation = async () => {
    if (!userTranslation.trim() || !topic || !language) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await checkTranslation(currentParagraph, userTranslation, language);
      setFeedback(result);
    } catch (e: any) {
      setError(e?.message || "Check failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleHelp = async () => {
    if (!currentParagraph || !language) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await checkTranslation(currentParagraph, "[REQUEST_HELP_REVEAL_ANSWER]", language);
      setFeedback({
        ...result,
        isCorrect: false,
        isHelpReveal: true,
        feedback: language === 'Hebrew' 
          ? "Learn the translation in English and Thai below." 
          : "Here is the translation to help you understand."
      });
    } catch (e: any) {
      setError(e?.message || "Help unavailable.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (topic && language) {
      const nextCount = progressCount + 1;
      setProgressCount(nextCount);
      if (nextCount <= SESSION_LENGTH && mode === 'reading') {
        handleNewParagraph(topic, language);
      }
    }
  };

  const handleSkip = () => {
    if (topic && language && mode === 'reading') {
      handleNewParagraph(topic, language);
    }
  };

  const handleListen = async () => {
    if (!currentParagraph || !language) return;
    
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

    if (currentAudio) {
      try {
        await playAudio(currentAudio);
        return;
      } catch (e) { console.warn("Cached play fail", e); }
    }

    setIsLoadingAudio(true);
    try {
      const base64 = await generateSpeech(currentParagraph, language, settings.voice);
      setCurrentAudio(base64);
      await playAudio(base64);
    } catch (e) {
        setError("Audio failed.");
    } finally {
        setIsLoadingAudio(false);
    }
  };

  const resetLanguage = () => {
    setLanguage(null);
    setTopic(null);
    setProgressCount(0);
    nextItemRef.current = null;
  }

  const renderContent = () => {
    if (!language) return <LanguageSelector onSelectLanguage={setLanguage} />;
    if (!topic) return <TopicSelector onTopicSelect={handleTopicSelect} language={language} />;
    
    if (progressCount > SESSION_LENGTH) {
        return (
          <SessionComplete 
            topic={topic} 
            language={language}
            onHome={resetLanguage}
            onStartNewMode={(m) => {
                setMode(m);
                setProgressCount(1);
                historyRef.current = [];
                nextItemRef.current = null;
                setFeedback(null);
                if (m === 'reading') handleNewParagraph(topic, language);
                else preloadNext(topic, language, m);
            }}
          />
        );
    }

    const sessionProps = {
      topic,
      onNext: handleNext,
      progressCount,
      totalItems: SESSION_LENGTH,
      dictionary,
      onToggleDictionaryWord: handleToggleDictionaryWord,
      showMarkings,
      onToggleMarkings: () => setShowMarkings(!showMarkings),
      settings, // Pass global settings
    };

    if (mode === 'speaking') {
      return language === 'Thai' ? <ThaiSpeakingSession {...sessionProps} /> : <HebrewSpeakingSession {...sessionProps} />;
    }
    if (mode === 'vocabulary') {
      return language === 'Thai' ? <ThaiVocabularySession {...sessionProps} /> : <HebrewVocabularySession {...sessionProps} />;
    }

    if (language === 'Thai') {
      return (
        <ThaiReadingSession
          {...sessionProps}
          currentParagraph={currentParagraph}
          currentPhonetic={currentPhonetic}
          feedback={feedback}
          isLoading={isLoading}
          isAudioLoading={isAudioLoading}
          error={error}
          userTranslation={userTranslation}
          setUserTranslation={setUserTranslation}
          onSubmit={handleSubmitTranslation}
          onHelp={handleHelp}
          onSkip={handleSkip}
          onListen={handleListen}
          totalParagraphs={SESSION_LENGTH}
        />
      );
    } else {
      return (
        <HebrewReadingSession
          {...sessionProps}
          currentParagraph={currentParagraph}
          currentPhonetic={currentPhonetic}
          feedback={feedback}
          isLoading={isLoading}
          isAudioLoading={isAudioLoading}
          error={error}
          userTranslation={userTranslation}
          setUserTranslation={setUserTranslation}
          onSubmit={handleSubmitTranslation}
          onHelp={handleHelp}
          onSkip={handleSkip}
          onListen={handleListen}
          totalParagraphs={SESSION_LENGTH}
        />
      );
    }
  };

  return (
    <>
      <DictionaryView isVisible={isDictionaryVisible} language={language} dictionary={dictionary} onClose={() => setIsDictionaryVisible(false)} onToggleWord={handleToggleDictionaryWord} />
      <LanguageReferenceModal isOpen={isRefVisible} onClose={() => setIsRefVisible(false)} language={language} />
      <SettingsModal isOpen={isSettingsVisible} onClose={() => setIsSettingsVisible(false)} settings={settings} onSettingsChange={setSettings} />
      
      <div className="h-screen bg-slate-900 text-slate-100 flex flex-col overflow-x-hidden overflow-y-auto pb-24">
        <div className="w-full max-w-2xl mx-auto flex flex-col flex-1 px-3 py-4">
          <header className="flex justify-center mb-4 flex-shrink-0">
            <div className="flex items-center gap-2">
                <BookOpenIcon className="w-6 h-6 text-cyan-400" />
                <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-cyan-400 to-violet-500 text-transparent bg-clip-text">Language Practice</h1>
            </div>
          </header>
          <main className="bg-slate-800/40 backdrop-blur-md rounded-2xl shadow-xl p-4 md:p-6 border border-slate-700/50 flex-1 overflow-y-auto">
            {renderContent()}
          </main>
        </div>
      </div>
      <footer className="fixed bottom-0 left-0 right-0 bg-slate-900/90 border-t border-slate-700/50 z-40">
        <div className="max-w-2xl mx-auto p-3 flex justify-center items-center gap-6 md:gap-10">
            <button onClick={resetLanguage} className="flex flex-col items-center text-slate-400 hover:text-cyan-400"><HomeIcon className="w-6 h-6" /><span className="text-[10px] font-bold uppercase tracking-widest">Home</span></button>
            {language && <button onClick={() => setIsRefVisible(true)} className="flex flex-col items-center text-slate-400 hover:text-cyan-400"><InformationCircleIcon className="w-6 h-6" /><span className="text-[10px] font-bold uppercase tracking-widest">Guide</span></button>}
            <button onClick={() => setIsSettingsVisible(true)} className="flex flex-col items-center text-slate-400 hover:text-cyan-400"><AdjustmentsHorizontalIcon className="w-6 h-6" /><span className="text-[10px] font-bold uppercase tracking-widest">Settings</span></button>
            <button onClick={() => setIsDictionaryVisible(true)} className="flex flex-col items-center text-slate-400 hover:text-cyan-400"><BookmarkIcon className="w-6 h-6" /><span className="text-[10px] font-bold uppercase tracking-widest">Saved</span></button>
        </div>
      </footer>
    </>
  );
};

export default App;
