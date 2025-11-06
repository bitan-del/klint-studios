import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useStudio } from './StudioContext';

interface LanguageContextType {
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        // Fallback to StudioContext translation
        const { t } = useStudio();
        return { t };
    }
    return context;
};

interface LanguageProviderProps {
    children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
    const { t } = useStudio();
    
    return (
        <LanguageContext.Provider value={{ t }}>
            {children}
        </LanguageContext.Provider>
    );
};

