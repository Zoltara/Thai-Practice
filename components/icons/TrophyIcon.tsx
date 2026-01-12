import React from 'react';

export const TrophyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9a9.75 9.75 0 011.056-4.293l3.569-6.578a2.25 2.25 0 013.852 0l3.569 6.578A9.75 9.75 0 0116.5 18.75z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25l-2.625-4.875" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 14.25l2.625-4.875" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-3.75" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 15.75h9" />
  </svg>
);
