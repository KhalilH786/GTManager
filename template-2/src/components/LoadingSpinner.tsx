import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  text?: string;
  className?: string;
}

export default function LoadingSpinner({ 
  size = 'md', 
  color = 'teal-500', 
  text, 
  className = ''
}: LoadingSpinnerProps) {
  // Define size styles
  const sizeStyles = {
    sm: 'h-6 w-6 border-2',
    md: 'h-8 w-8 border-4',
    lg: 'h-12 w-12 border-t-2 border-b-2'
  };

  return (
    <div className={`text-center ${className}`}>
      <div 
        className={`inline-block animate-spin rounded-full ${sizeStyles[size]} border-${color} ${size === 'md' ? 'border-t-transparent' : ''}`}
      ></div>
      {text && <p className="mt-2 text-gray-600">{text}</p>}
    </div>
  );
} 