import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children, defaultTheme = 'light' }) => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('lms-theme');
    return savedTheme || defaultTheme;
  });

  const [effectiveTheme, setEffectiveTheme] = useState('light');

  useEffect(() => {
    const updateEffectiveTheme = () => {
      let newEffectiveTheme = theme;
      const root = document.documentElement;
      root.classList.add('changing-theme');
      root.classList.remove('light', 'dark');
      root.classList.add(newEffectiveTheme);
      
      // Trigger reflow to apply 'changing-theme' class immediately
      void root.offsetHeight;
      
      setTimeout(() => {
        root.classList.remove('changing-theme');
      }, 10);
      setEffectiveTheme(newEffectiveTheme);
    };

    updateEffectiveTheme();
  }, [theme]);

  const handleSetTheme = (newTheme) => {
    const root = document.documentElement;
    root.classList.add('changing-theme');
    
    root.classList.remove('light', 'dark');
    root.classList.add(newTheme);
    
    void root.offsetHeight;
    
    setTimeout(() => {
      root.classList.remove('changing-theme');
    }, 10);
    
    setTheme(newTheme);
    localStorage.setItem('lms-theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme, effectiveTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
