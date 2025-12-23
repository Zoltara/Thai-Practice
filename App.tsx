
import React, { useState, useCallback, useRef, useEffect } from 'react';
import TopicSelector from './components/TopicSelector';
import PracticeSession from './components/PracticeSession';
import SpeakingSession from './components/SpeakingSession';
import SessionComplete from './components/SessionComplete';
import DictionaryView from './components/DictionaryView';
import { Feedback, VocabularyItem, PracticeMode } from './types';
import { generateParagraph, checkTranslation, generateSpeech } from './services/geminiService';
import { BookOpenIcon } from './components/icons/BookOpenIcon';
import { BookmarkIcon } from './components/icons/BookmarkIcon';
import { HomeIcon } from './components/icons/HomeIcon';
import { SESSION_LENGTH } from './constants';
import { decode, decodeAudioData } from './utils/audio';


const App: React.FC = () => {
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
      const savedDictionary = localStorage.getItem('thaiPracticeDictionary');
      if (savedDictionary) {
        setDictionary(JSON.parse(savedDictionary));
      }
    } catch (error) {
      console.error("Could not load dictionary from localStorage:", error);
    }
  }, []);

  const handleToggleDictionaryWord = (item: VocabularyItem) => {
    setDictionary(prevDictionary => {
      const isSaved = prevDictionary.some(word => word.thai === item.thai);
      let newDictionary;
      if (isSaved) {
        newDictionary = prevDictionary.filter(word => word.thai !== item.thai);
      } else {
        newDictionary = [...prevDictionary, item];
      }
      try {
        localStorage.setItem('thaiPracticeDictionary', JSON.stringify(newDictionary));
      } catch (error) {
        console.error("Could not save dictionary to localStorage:", error);
      }
      return newDictionary;
    });
  };

  const handleNewParagraph = useCallback(async (selectedTopic: string) => {
    setIsLoading(true);
    setError(null);
    setFeedback(null);
    setUserTranslation('');
    try {
      const paragraph = await generateParagraph(selectedTopic, currentParagraph);
      setCurrentParagraph(paragraph);
    } catch (e) {
      setError('Failed to generate a new paragraph. Please try again.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [currentParagraph]);

  const handleTopicSelect = (selectedTopic: string, selectedMode: PracticeMode) => {
    setTopic(selectedTopic);
    setMode(selectedMode);
    setProgressCount(1);
    
    if (selectedMode === 'reading') {
      handleNewParagraph(selectedTopic);
    }
  };

  const handleSubmitTranslation = async () => {
    if (!userTranslation.trim() || !topic) return;
    setIsLoading(true);
    setError(null);
    setFeedback(null);
    try {
      const result = await checkTranslation(currentParagraph, userTranslation);
      setFeedback(result);
    } catch (e)
    {
      setError('Failed to get feedback. Please try again.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (topic) {
      const newProgressCount = progressCount + 1;
      setProgressCount(newProgressCount);
      if (newProgressCount <= SESSION_LENGTH && mode === 'reading') {
        handleNewParagraph(topic);
      }
    }
  };

  const handleListen = async () => {
    if (!currentParagraph || isAudioLoading) return;

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

      const base64Audio = await generateSpeech(currentParagraph);
      const audioBytes = decode(base64Audio);
      const audioBuffer = await decodeAudioData(audioBytes, audioContext, 24000, 1);
      
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start();

    } catch (e) {
        setError('Failed to play audio. Please try again.');
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

  const renderContent = () => {
    if (!topic) {
      return <TopicSelector onTopicSelect={handleTopicSelect} />;
    }
    
    if (progressCount > SESSION_LENGTH) {
        return <SessionComplete topic={topic} />;
    }

    if (mode === 'speaking') {
      return (
        <SpeakingSession
          topic={topic}
          onNext={handleNext}
          progressCount={progressCount}
          totalItems={SESSION_LENGTH}
          onToggleDictionaryWord={handleToggleDictionaryWord}
        />
      );
    }

    return (
      <PracticeSession
        topic={topic}
        currentParagraph={currentParagraph}
        feedback={feedback}
        isLoading={isLoading}
        isAudioLoading={isAudioLoading}
        error={error}
        userTranslation={userTranslation}
        setUserTranslation={setUserTranslation}
        onSubmit={handleSubmitTranslation}
        onNext={handleNext}
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
        dictionary={dictionary}
        onClose={() => setIsDictionaryVisible(false)}
        onToggleWord={handleToggleDictionaryWord}
      />
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col p-3 md:p-6 pb-44 md:pb-64 overflow-x-hidden overflow-y-auto">
        <div className="w-full max-w-3xl mx-auto flex flex-col">
          <header className="flex justify-center items-center mb-6 md:mb-10 w-full pt-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-2 md:mb-3">
                <BookOpenIcon className="w-7 h-7 md:w-10 md:h-10 text-cyan-400" />
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-violet-500 text-transparent bg-clip-text whitespace-nowrap">
                  Thai Practice
                </h1>
              </div>
              <p className="text-sm md:text-base text-slate-400">Hone your Thai reading and speaking skills with AI.</p>
            </div>
          </header>

          <main className="bg-slate-800/50 backdrop-blur-sm rounded-xl md:rounded-2xl shadow-2xl shadow-slate-950/50 p-5 md:p-10 border border-slate-700">
            {renderContent()}
          </main>
        </div>
      </div>
      <footer className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-md border-t border-slate-700 z-40">
        <div className="max-w-3xl mx-auto p-4 flex justify-center items-center gap-12">
            {topic && (
                <button 
                    onClick={resetSession}
                    className="flex flex-col items-center justify-center gap-1.5 text-slate-300 hover:text-cyan-400 transition-colors"
                >
                    <HomeIcon className="w-7 h-7" />
                    <span className="text-xs md:text-sm font-medium uppercase tracking-wider">Home</span>
                </button>
            )}
            <button 
                onClick={() => setIsDictionaryVisible(true)}
                className="flex flex-col items-center justify-center gap-1.5 text-slate-300 hover:text-cyan-400 transition-colors"
            >
                <BookmarkIcon className="w-7 h-7" />
                <span className="text-xs md:text-sm font-medium uppercase tracking-wider">Dictionary</span>
            </button>
        </div>
      </footer>
    </>
  );
};

export default App;
