import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { AccessibilitySettings, FontSize, ContrastMode } from './types';

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  setFontSize: (size: FontSize) => void;
  setContrastMode: (mode: ContrastMode) => void;
  setScreenReaderMode: (enabled: boolean) => void;
}

const DEFAULT_SETTINGS: AccessibilitySettings = {
  fontSize: 'normal',
  contrastMode: 'light',
  screenReaderMode: false,
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const useAccessibility = () => {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error('useAccessibility must be used within AccessibilityProvider');
  return ctx;
};

const FONT_SIZE_MAP: Record<FontSize, string> = {
  normal: '16px',
  large: '20px',
  'extra-large': '24px',
};

export const AccessibilityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    try {
      const stored = localStorage.getItem('pdao_accessibility');
      return stored ? JSON.parse(stored) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  useEffect(() => {
    localStorage.setItem('pdao_accessibility', JSON.stringify(settings));
    const root = document.documentElement;

    // Font size
    root.style.fontSize = FONT_SIZE_MAP[settings.fontSize];

    // Contrast mode
    root.classList.remove('dark', 'high-contrast');
    if (settings.contrastMode === 'dark') {
      root.classList.add('dark');
    } else if (settings.contrastMode === 'high-contrast') {
      root.classList.add('dark', 'high-contrast');
    }

    // Screen reader mode
    if (settings.screenReaderMode) {
      root.setAttribute('data-screen-reader', 'true');
    } else {
      root.removeAttribute('data-screen-reader');
    }
  }, [settings]);

  const setFontSize = (fontSize: FontSize) => setSettings(s => ({ ...s, fontSize }));
  const setContrastMode = (contrastMode: ContrastMode) => setSettings(s => ({ ...s, contrastMode }));
  const setScreenReaderMode = (screenReaderMode: boolean) => setSettings(s => ({ ...s, screenReaderMode }));

  return (
    <AccessibilityContext.Provider value={{ settings, setFontSize, setContrastMode, setScreenReaderMode }}>
      {children}
    </AccessibilityContext.Provider>
  );
};
