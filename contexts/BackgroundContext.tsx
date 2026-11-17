import React, { createContext, useEffect, useState, ReactNode } from 'react';

type BackgroundContextType = {
  bgUrl: string;
  setBackgroundFromFile: (dataUrl: string) => void;
  setBackgroundFromUrl: (url: string) => void;
  resetBackground: () => void;
  patternOn: boolean;
  setPatternOn: (v: boolean) => void;
  status: string;
};

export const BackgroundContext = createContext<BackgroundContextType>({
  bgUrl: '',
  setBackgroundFromFile: () => {},
  setBackgroundFromUrl: () => {},
  resetBackground: () => {},
  patternOn: true,
  setPatternOn: () => {},
  status: 'Cargando Supabase'
});

export const BackgroundProvider = ({ children, backgroundUrl='', backgroundPatternOn=true, onChange, status='Cargando Supabase' }: { children: ReactNode; backgroundUrl?:string; backgroundPatternOn?:boolean; onChange:(patch:{backgroundUrl?:string;backgroundPatternOn?:boolean})=>void; status?:string }) => {
  const bgUrl=backgroundUrl,patternOn=backgroundPatternOn;
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

      } else {
        console.debug('BackgroundContext: clearing background');
        document.documentElement.style.removeProperty('--app-bg');
        (document.body as HTMLBodyElement).style.backgroundImage = '';
        (document.documentElement as HTMLElement).style.backgroundImage = '';
        document.body.classList.remove('has-app-bg');

      }
    } catch (err) {
      console.error('BackgroundContext: error applying background', err);
    }
  }, [bgUrl]);

  useEffect(() => {
    document.documentElement.style.setProperty('--bg-pattern-on', patternOn ? '1' : '0');

  }, [patternOn]);

  const setBackgroundFromFile = (dataUrl: string) => onChange({backgroundUrl:dataUrl});
  const setBackgroundFromUrl = (url: string) => onChange({backgroundUrl:url});
  const resetBackground = () => onChange({backgroundUrl:''});
  const setPatternOn = (v: boolean) => onChange({backgroundPatternOn:v});

  return (
    <BackgroundContext.Provider value={{ bgUrl, setBackgroundFromFile, setBackgroundFromUrl, resetBackground, patternOn, setPatternOn, status }}>
      {children}
    </BackgroundContext.Provider>
  );
};

export default BackgroundProvider;
