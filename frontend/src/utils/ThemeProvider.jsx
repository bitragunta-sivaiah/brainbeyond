import React, { createContext, useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Laptop } from 'lucide-react';

// Create the context
const ThemeContext = createContext();

// Create the custom hook for theme access
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Create the ThemeProvider component
export const ThemeProvider = ({ children, defaultTheme = 'system' }) => {
  // Retrieve theme from local storage or use the default
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || defaultTheme);

  // Effect to handle the theme change and local storage persistence
  useEffect(() => {
    const root = window.document.documentElement;

    // Check if the theme is 'system' and handle based on media query
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)');
    const systemTheme = prefersDarkMode.matches ? 'dark' : 'light';

    if (theme === 'system') {
      if (systemTheme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    } else if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    localStorage.setItem('theme', theme);

    // Event listener for system theme changes when in 'system' mode
    const mediaQueryListener = (e) => {
      if (theme === 'system') {
        if (e.matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };

    prefersDarkMode.addEventListener('change', mediaQueryListener);

    return () => {
      prefersDarkMode.removeEventListener('change', mediaQueryListener);
    };

  }, [theme]);

  // Return the provider with the theme state and setter function
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

 
