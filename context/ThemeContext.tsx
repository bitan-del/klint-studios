import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>(() => {
        // Check localStorage first, default to dark
        const savedTheme = localStorage.getItem('theme') as Theme;
        return savedTheme || 'dark';
    });

    useEffect(() => {
        // Apply theme to document root
        const root = document.documentElement;
        if (theme === 'light') {
            root.classList.add('light-mode');
            root.classList.remove('dark-mode');
        } else {
            root.classList.add('dark-mode');
            root.classList.remove('light-mode');
        }
        // Save to localStorage
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

