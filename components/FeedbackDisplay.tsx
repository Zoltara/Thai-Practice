
import React from 'react';
import { Feedback } from '../types';

interface FeedbackDisplayProps {
  feedback: Feedback;
}

const FeedbackDisplay: React.FC<FeedbackDisplayProps> = ({ feedback }) => {
  const { status, feedback: feedbackText, correctTranslation, isHelpReveal } = feedback;

  let borderColor = 'border-slate-500';
  let headerColor = 'text-slate-400';
  let headerText = 'Feedback';

  if (isHelpReveal || status === 'help') {
    borderColor = 'border-blue-500';
    headerColor = 'text-blue-400';
    headerText = 'Maybe Next Time';
  } else if (status === 'correct') {
    borderColor = 'border-green-500';
    headerColor = 'text-green-400';
    headerText = 'Excellent';
  } else if (status === 'partial') {
    borderColor = 'border-orange-500';
    headerColor = 'text-orange-400';
    headerText = 'Nice try';
  } else {
    borderColor = 'border-red-500';
    headerColor = 'text-red-400';
    headerText = 'Wrong answer';
  }

  return (
    <div className={`border-l-4 ${borderColor} bg-slate-900/50 p-4 rounded-r-lg space-y-3 animate-fade-in`}>
      <div className="flex items-center gap-2">
        <h3 className={`text-lg font-black uppercase tracking-wider ${headerColor}`}>
          {headerText}
        </h3>
      </div>
      <p className="text-slate-300 text-base md:text-lg">{feedbackText}</p>
      {correctTranslation && (
         <div className="mt-2 bg-slate-800/40 p-3 rounded-lg border border-slate-700/50">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Meaning</p>
            <p className="text-slate-100 font-bold text-lg md:text-xl whitespace-pre-line">{correctTranslation}</p>
        </div>
      )}
    </div>
  );
};

export default FeedbackDisplay;
