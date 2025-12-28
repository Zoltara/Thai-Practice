
import React, { useState, useCallback, useRef, useEffect } from 'react';
import TopicSelector from './components/TopicSelector';
import LanguageSelector from './components/LanguageSelector';
import PracticeSession from './components/PracticeSession';
import SpeakingSession from './components/SpeakingSession';
import VocabularySession from './components/VocabularySession';
import SessionComplete from './components/SessionComplete';
import DictionaryView from './components/DictionaryView';
import { Feedback, VocabularyItem, PracticeMode, Language } from './types';
import { generateParagraph, checkTranslation, generateSpeech } from './services/geminiService';
import { BookOpenIcon } from './components/icons/BookOpenIcon';
import { BookmarkIcon } from './components/icons/BookmarkIcon';
import { HomeIcon } from './components/icons/HomeIcon';
import { SESSION_LENGTH } from './constants';
import { decode, decodeAudioData } from './utils/audio';

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language | null>(null);
  const [topic, setTopic] = useState<string | null>(null);
  const [mode, setMode] = useState<PracticeMode>('reading');
  const [currentParagraph, setCurrentParagraph] = useState<string>('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAudioLoading, setIsAudioLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [userTranslation, setUserTranslation] = useState('');
  const [progressCount, setProgressCount] = useState(0);
  const [dictionary, setDictionary] = useState<VocabularyItem[]>([]);
  const [isDictionaryVisible, setIsDictionaryVisible] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

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

  const handleNewParagraph = useCallback(async (selectedTopic: string, selectedLang: Language) => {
    setIsLoading(true);
    setError(null);
    setFeedback(null);
    setUserTranslation('');
    try {
      const paragraph = await generateParagraph(selectedTopic, selectedLang, currentParagraph);
      setCurrentParagraph(paragraph);
    } catch (e) {
      setError('Failed to generate content. Please try again.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [currentParagraph]);

  const handleTopicSelect = (selectedTopic: string, selectedMode: PracticeMode) => {
    if (!language) return;
    setTopic(selectedTopic);
    setMode(selectedMode);
    setProgressCount(1);
    
    if (selectedMode === 'reading') {
      handleNewParagraph(selectedTopic, language);
    }
  };

  const handleSubmitTranslation = async () => {
    if (!userTranslation.trim() || !topic || !language) return;
    setIsLoading(true);
    setError(null);
    setFeedback(null);
    try {
      const result = await checkTranslation(currentParagraph, userTranslation, language);
      setFeedback(result);
    } catch (e) {
      setError('Failed to get feedback. Please try again.');
      console.error(e);
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
        feedback: "No problem! Here is the translation to help you understand."
      });
    } catch (e) {
      setError('Failed to get help. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (topic && language) {
      const newProgressCount = progressCount + 1;
      setProgressCount(newProgressCount);
      if (newProgressCount <= SESSION_LENGTH && mode === 'reading') {
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
    if (!currentParagraph || isAudioLoading || !language) return;

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

      const base64Audio = await generateSpeech(currentParagraph, language);
      const audioBytes = decode(base64Audio);
      const audioBuffer = await decodeAudioData(audioBytes, audioContext, 24000, 1);
      
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start();

    } catch (e) {
        setError('Failed to play audio.');
        console.error(e);
    } finally {
        setIsAudioLoading(false);
    }
  };

  const resetSession = () => {
    setTopic(null);
    setCurrentParagraph('');
    setFeedback(null);
    setIsLoading(false);
    setError(null);
    setUserTranslation('');
    setProgressCount(0);
  };

  const resetLanguage = () => {
    setLanguage(null);
    resetSession();
  }

  const renderContent = () => {
    if (!language) {
      return <LanguageSelector onSelectLanguage={setLanguage} />;
    }

    if (!topic) {
      return <TopicSelector onTopicSelect={handleTopicSelect} language={language} />;
    }
    
    if (progressCount > SESSION_LENGTH) {
        return <SessionComplete topic={topic} language={language} />;
    }

    if (mode === 'speaking') {
      return (
        <SpeakingSession
          topic={topic}
          language={language}
          onNext={handleNext}
          progressCount={progressCount}
          totalItems={SESSION_LENGTH}
          dictionary={dictionary}
          onToggleDictionaryWord={handleToggleDictionaryWord}
        />
      );
    }

    if (mode === 'vocabulary') {
      return (
        <VocabularySession
          topic={topic}
          language={language}
          onNext={handleNext}
          progressCount={progressCount}
          totalItems={SESSION_LENGTH}
          dictionary={dictionary}
          onToggleDictionaryWord={handleToggleDictionaryWord}
        />
      );
    }

    return (
      <PracticeSession
        topic={topic}
        language={language}
        currentParagraph={currentParagraph}
        feedback={feedback}
        isLoading={isLoading}
        isAudioLoading={isAudioLoading}
        error={error}
        userTranslation={userTranslation}
        setUserTranslation={setUserTranslation}
        onSubmit={handleSubmitTranslation}
        onHelp={handleHelp}
        onNext={handleNext}
        onSkip={handleSkip}
        onListen={handleListen}
        progressCount={progressCount}
        totalParagraphs={SESSION_LENGTH}
        dictionary={dictionary}
        onToggleDictionaryWord={handleToggleDictionaryWord}
      />
    );
  };

  return (
    <>
      <DictionaryView 
        isVisible={isDictionaryVisible}
        language={language}
        dictionary={dictionary}
        onClose={() => setIsDictionaryVisible(false)}
        onToggleWord={handleToggleDictionaryWord}
      />
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col p-3 md:p-6 pb-32 md:pb-48 overflow-x-hidden overflow-y-auto">
        <div className="w-full max-w-2xl mx-auto flex flex-col">
          <header className="flex justify-center items-center mb-4 md:mb-6 w-full pt-2">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <BookOpenIcon className="w-6 h-6 md:w-8 md:h-8 text-cyan-400" />
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-violet-500 text-transparent bg-clip-text">
                  Language Practice
                </h1>
              </div>
            </div>
          </header>

          <main className="bg-slate-800/40 backdrop-blur-md rounded-2xl shadow-xl p-4 md:p-8 border border-slate-700/50">
            {renderContent()}
          </main>
        </div>
      </div>
      <footer className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-md border-t border-slate-700/50 z-40">
        <div className="max-w-2xl mx-auto p-3 flex justify-center items-center gap-10">
            <button 
                onClick={resetLanguage}
                className="flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-cyan-400 transition-colors"
            >
                <HomeIcon className="w-6 h-6" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Home</span>
            </button>
            <button 
                onClick={() => setIsDictionaryVisible(true)}
                className="flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-cyan-400 transition-colors"
            >
                <BookmarkIcon className="w-6 h-6" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Saved</span>
            </button>
        </div>
      </footer>
    </>
  );
};

export default App;
