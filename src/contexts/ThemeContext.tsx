
import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'custom';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  customColors: CustomColors;
  setCustomColors: (colors: CustomColors) => void;
}

interface CustomColors {
  primary: string;
  secondary: string;
  background: string;
  foreground: string;
}

const defaultCustomColors: CustomColors = {
  primary: '#3b82f6',
  secondary: '#64748b',
  background: '#ffffff',
  foreground: '#0f172a'
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('light');
  const [customColors, setCustomColors] = useState<CustomColors>(defaultCustomColors);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    const savedColors = localStorage.getItem('customColors');
    
    if (savedTheme) {
      setTheme(savedTheme);
    }
    
    if (savedColors) {
      setCustomColors(JSON.parse(savedColors));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('custom');
    } else if (theme === 'light') {
      root.classList.remove('dark', 'custom');
    } else if (theme === 'custom') {
      root.classList.add('custom');
      root.classList.remove('dark');
      
      // Apply custom colors
      root.style.setProperty('--primary', customColors.primary);
      root.style.setProperty('--secondary', customColors.secondary);
      root.style.setProperty('--background', customColors.background);
      root.style.setProperty('--foreground', customColors.foreground);
    }
  }, [theme, customColors]);

  const handleSetCustomColors = (colors: CustomColors) => {
    setCustomColors(colors);
    localStorage.setItem('customColors', JSON.stringify(colors));
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      setTheme,
      customColors,
      setCustomColors: handleSetCustomColors
    }}>
      {children}
    </ThemeContext.Provider>
  );
};
