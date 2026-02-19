import React, { createContext, useEffect, useState, ReactNode } from 'react';

type BackgroundContextType = {
  bgUrl: string;
  setBackgroundFromFile: (dataUrl: string) => void;
  setBackgroundFromUrl: (url: string) => void;
  resetBackground: () => void;
  patternOn: boolean;
  setPatternOn: (v: boolean) => void;
};

export const BackgroundContext = createContext<BackgroundContextType>({
  bgUrl: '',
  setBackgroundFromFile: () => {},
  setBackgroundFromUrl: () => {},
  resetBackground: () => {},
  patternOn: true,
  setPatternOn: () => {}
});

export const BackgroundProvider = ({ children }: { children: ReactNode }) => {
  const [bgUrl, setBgUrl] = useState<string>(() => localStorage.getItem('appBackground') || '');
  const [patternOn, setPatternOnState] = useState<boolean>(() => {
    try { return JSON.parse(localStorage.getItem('bgPatternOn') || 'true'); } catch { return true; }
  });

  useEffect(() => {
    try {
      if (bgUrl) {
        console.debug('BackgroundContext: applying bgUrl', (bgUrl || '').slice?.(0, 120));
        // Store raw URL in CSS variable; CSS uses url(var(--app-bg))
        document.documentElement.style.setProperty('--app-bg', bgUrl);
        // Also apply inline body/background as a defensive fallback
        const esc = (s: string) => s.replace(/"/g, '\\"');
        (document.body as HTMLBodyElement).style.backgroundImage = `url("${esc(bgUrl)}")`;
        (document.body as HTMLBodyElement).style.backgroundSize = 'cover';
        (document.body as HTMLBodyElement).style.backgroundPosition = 'center';
        (document.documentElement as HTMLElement).style.backgroundImage = `url("${esc(bgUrl)}")`;
        (document.documentElement as HTMLElement).style.backgroundSize = 'cover';
        (document.documentElement as HTMLElement).style.backgroundPosition = 'center';
        document.body.classList.add('has-app-bg');
        localStorage.setItem('appBackground', bgUrl);
      } else {
        console.debug('BackgroundContext: clearing background');
        document.documentElement.style.removeProperty('--app-bg');
        (document.body as HTMLBodyElement).style.backgroundImage = '';
        (document.documentElement as HTMLElement).style.backgroundImage = '';
        document.body.classList.remove('has-app-bg');
        localStorage.removeItem('appBackground');
      }
    } catch (err) {
      console.error('BackgroundContext: error applying background', err);
    }
  }, [bgUrl]);

  // If no background is set, apply a small demo SVG background so the glass effect is visible.
  useEffect(() => {
    if (!bgUrl) {
      try {
        const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='1600' height='900'><defs><linearGradient id='g' x1='0' x2='1'><stop offset='0' stop-color='%232b6cff'/><stop offset='1' stop-color='%2318b7a6'/></linearGradient></defs><rect width='100%' height='100%' fill='url(%23g)'/><g fill='%23ffffff' opacity='0.06'><circle cx='200' cy='120' r='180'/><circle cx='1400' cy='700' r='220'/></g></svg>`;
        const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
        console.debug('BackgroundContext: applying demo background');
        setBgUrl(dataUrl);
      } catch (err) {
        console.warn('BackgroundContext: failed to apply demo background', err);
      }
    }
    // run only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--bg-pattern-on', patternOn ? '1' : '0');
    localStorage.setItem('bgPatternOn', JSON.stringify(patternOn));
  }, [patternOn]);

  const setBackgroundFromFile = (dataUrl: string) => setBgUrl(dataUrl);
  const setBackgroundFromUrl = (url: string) => setBgUrl(url);
  const resetBackground = () => setBgUrl('');
  const setPatternOn = (v: boolean) => setPatternOnState(v);

  return (
    <BackgroundContext.Provider value={{ bgUrl, setBackgroundFromFile, setBackgroundFromUrl, resetBackground, patternOn, setPatternOn }}>
      {children}
    </BackgroundContext.Provider>
  );
};

export default BackgroundProvider;
