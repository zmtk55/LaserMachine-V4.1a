import { useState, useEffect, useCallback } from 'react';

export interface StrapiFont {
  id: number;
  name: string;
  cssFamily: string;
  category: 'DEPORTE' | 'CURSIVA' | 'FONTS_2026' | 'KIDS' | 'BASICAS';
  fontFile: {
    url: string;
    name: string;
    size: number;
    mime: string;
  } | null;
  isActive: boolean;
  displayOrder: number;
  previewText: string;
}

interface UseStrapiFontsReturn {
  fonts: StrapiFont[];
  loading: boolean;
  error: string | null;
  refreshFonts: () => void;
  injectFontStyles: () => void;
}

const STRAPI_URL = import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337';

export function useStrapiFonts(): UseStrapiFontsReturn {
  const [fonts, setFonts] = useState<StrapiFont[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFonts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${STRAPI_URL}/api/fonts?populate=*&sort=displayOrder:asc&filters[isActive][$eq]=true`
      );

      if (!response.ok) {
        throw new Error(`Error fetching fonts: ${response.status}`);
      }

      const data = await response.json();
      
      // Transform Strapi response to clean format
      const transformedFonts: StrapiFont[] = data.data.map((item: any) => ({
        id: item.id,
        name: item.attributes.name,
        cssFamily: item.attributes.cssFamily,
        category: item.attributes.category,
        fontFile: item.attributes.fontFile?.data ? {
          url: `${STRAPI_URL}${item.attributes.fontFile.data.attributes.url}`,
          name: item.attributes.fontFile.data.attributes.name,
          size: item.attributes.fontFile.data.attributes.size,
          mime: item.attributes.fontFile.data.attributes.mime,
        } : null,
        isActive: item.attributes.isActive,
        displayOrder: item.attributes.displayOrder,
        previewText: item.attributes.previewText,
      }));

      setFonts(transformedFonts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error loading fonts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Inject @font-face styles dynamically
  const injectFontStyles = useCallback(() => {
    if (!fonts.length) return;

    // Remove existing font styles
    const existing = document.getElementById('strapi-fonts');
    if (existing) existing.remove();

    const style = document.createElement('style');
    style.id = 'strapi-fonts';

    let css = '';
    fonts.forEach((font) => {
      if (font.fontFile?.url) {
        css += `
          @font-face {
            font-family: '${font.cssFamily}';
            src: url('${font.fontFile.url}') format('truetype');
            font-weight: normal;
            font-style: normal;
            font-display: swap;
          }
          .font-${font.id} { 
            font-family: '${font.cssFamily}', sans-serif !important; 
          }
        `;
      }
    });

    if (css) {
      style.textContent = css;
      document.head.appendChild(style);
    }
  }, [fonts]);

  // Initial fetch
  useEffect(() => {
    fetchFonts();
  }, [fetchFonts]);

  // Inject styles when fonts change
  useEffect(() => {
    injectFontStyles();
  }, [injectFontStyles]);

  return {
    fonts,
    loading,
    error,
    refreshFonts: fetchFonts,
    injectFontStyles,
  };
}
