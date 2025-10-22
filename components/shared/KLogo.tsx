import React from 'react';

// FIX: Add style prop to allow inline styles.
export const KLogo: React.FC<{ size?: number; className?: string; style?: React.CSSProperties }> = ({ size = 24, className, style }) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            style={style}
        >
            <path 
                d="M7 4.5C7.23864 7.63608 6.53856 16.8924 7.5 20" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
            />
            <path 
                d="M16.5 5C14.1772 9.07065 10.5 12 10.5 12C10.5 12 13.5 15.5 16 19.5" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
            />
        </svg>
    );
};