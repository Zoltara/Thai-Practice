
import React from 'react';
import { Feedback } from '../types';

interface FeedbackDisplayProps {
  feedback: Feedback;
}

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const FeedbackDisplay: React.FC<FeedbackDisplayProps> = ({ feedback }) => {
  const { isCorrect, feedback: feedbackText, correctTranslation, isHelpReveal } = feedback;

  const borderColor = isCorrect ? 'border-green-500/50' : (isHelpReveal ? 'border-red-500/50' : 'border-yellow-500/50');
  const headerColor = isCorrect ? 'text-green-400' : (isHelpReveal ? 'text-red-500' : 'text-yellow-400');
  const Icon = isCorrect ? CheckIcon : XCircleIcon;

  const getHeaderText = () => {
    if (isCorrect) return 'Excellent!';
    if (isHelpReveal) return 'Maybe Next Time';
    return 'Good try';
  };

  return (
    <div className={`border-l-4 ${borderColor} bg-slate-900/50 p-4 rounded-r-lg space-y-3 animate-fade-in`}>
      <div className="flex items-center gap-2">
        <Icon className={`w-6 h-6 ${headerColor}`} />
        <h3 className={`text-lg font-semibold ${headerColor}`}>
          {getHeaderText()}
        </h3>
      </div>
      <p className="text-slate-300">{feedbackText}</p>
      {!isCorrect && (
         <div className="mt-2">
            <p className="text-sm font-medium text-slate-400">Correct translation:</p>
            <p className="text-slate-200 font-medium whitespace-pre-line">{correctTranslation}</p>
        </div>
      )}
    </div>
  );
};

export default FeedbackDisplay;
