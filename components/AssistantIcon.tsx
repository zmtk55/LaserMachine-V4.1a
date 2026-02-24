import React from 'react';

interface AssistantIconProps {
  className?: string;
  variant?: 'solid' | 'outline';
}

export const AssistantIcon: React.FC<AssistantIconProps> = ({ className = '', variant = 'solid' }) => {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={variant === 'outline' ? 2 : 0}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="rabbitGradient" x1="4" y1="5" x2="20" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.8" />
          <stop offset="100%" stopColor="currentColor" />
        </linearGradient>
      </defs>
      
      {/* Ears - Using current color directly */}
      <path 
        d="M6 3C5.44772 3 5 3.44772 5 4V9H7V4C7 3.44772 6.55228 3 6 3Z" 
        fill="currentColor"
      />
      <path 
        d="M18 3C17.4477 3 17 3.44772 17 4V9H19V4C19 3.44772 18.5523 3 18 3Z" 
        fill="currentColor"
      />

      {/* Head - Main Shape */}
      <path 
        fillRule="evenodd" 
        clipRule="evenodd" 
        d="M4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12V17C20 20.3137 17.3137 23 14 23H10C6.68629 23 4 20.3137 4 17V12ZM8.5 13C8.5 12.1716 9.17157 11.5 10 11.5C10.8284 11.5 11.5 12.1716 11.5 13C11.5 13.8284 10.8284 14.5 10 14.5C9.17157 14.5 8.5 13.8284 8.5 13ZM14.5 11.5C13.6716 11.5 13 12.1716 13 13C13 13.8284 13.6716 14.5 14.5 14.5C15.3284 14.5 16 13.8284 16 13C16 12.1716 15.3284 11.5 14.5 11.5ZM12 19C12.8284 19 13.5 18.3284 13.5 17.5C13.5 16.6716 12.8284 16 12 16C11.1716 16 10.5 16.6716 10.5 17.5C10.5 18.3284 11.1716 19 12 19Z" 
        fill={variant === 'solid' ? "currentColor" : "none"}
      />
    </svg>
  );
};

