import { useState, useEffect, useCallback } from 'react';
import { Product, FontOption, DesignTemplate } from '../types';

const STRAPI_URL = import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337';
const API_TOKEN = import.meta.env.VITE_STRAPI_API_TOKEN;

// Adaptador: Convierte producto de Strapi a tu tipo Product
const adaptStrapiProduct = (strapiProduct: any): Product => {
  const attrs = strapiProduct.attributes;
  
  return {
    id: String(strapiProduct.id),
    name: attrs.name,
    brand: attrs.brand || 'GENERIC',
    category: attrs.category || 'General',
    description: attrs.description || '',
    price: attrs.basePrice,
    colors: attrs.colors?.map((c: any) => ({
      name: c.name,
      hex: c.hexCode,
      priceModifier: c.priceModifier || 0
    })) || [{ name: 'Stainless', hex: '#C4C4C4' }],
    imageUrl: attrs.images?.data?.[0]?.attributes?.url 
      ? `${STRAPI_URL}${attrs.images.data[0].attributes.url}` 
      : '',
    stock: attrs.inStock ? 100 : 0,
    stockThreshold: 5,
  };
};

// Adaptador: Templates
const adaptStrapiTemplates = (strapiProduct: any): DesignTemplate[] => {
  const templates = strapiProduct.attributes?.availableTemplates?.data || [];
  
  return templates.map((t: any) => ({
    id: String(t.id),
    name: t.attributes.name,
    occasion: t.attributes.occasion || 'general',
    preview: t.attributes.name.substring(0, 2).toUpperCase(),
    previewColor: 'stainless',
    texts: t.attributes.texts?.map((text: any) => ({
      content: text.content,
      fontFamily: text.fontFamily || 'Bebas Neue',
      size: text.size || 1,
      yPosition: text.yPosition || 50,
      rotation: text.rotation || 0,
    })) || [],
    isActive: t.attributes.isActive,
    isFavorite: t.attributes.isFavorite || false,
    usageCount: t.attributes.usageCount || 0,
    createdAt: t.attributes.createdAt,
    tags: t.attributes.tags?.data?.map((tag: any) => tag.attributes.name) || [],
  }));
};

// Fetch base
const fetchStrapi = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${STRAPI_URL}/api${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  };
  
  if (API_TOKEN) {
    headers['Authorization'] = `Bearer ${API_TOKEN}`;
  }

  const response = await fetch(url, { ...options, headers });
  
  if (!response.ok) {
    throw new Error(`Strapi API error: ${response.statusText}`);
  }

  return response.json();
};

// Hook para un producto específico con sus templates
export const useStrapiProduct = (productId: string | number | null) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [templates, setTemplates] = useState<DesignTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProduct = useCallback(async () => {
    if (!productId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const { data } = await fetchStrapi(
        `/products/${productId}?populate[colors]=*&populate[availableTemplates][populate][texts]=*&populate[images]=*`
      );
      
      setProduct(adaptStrapiProduct(data));
      setTemplates(adaptStrapiTemplates(data));
    } catch (err) {
      setError('Error cargando producto');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  return { product, templates, isLoading, error, refetch: fetchProduct };
};

// Hook para todos los productos
export const useStrapiProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await fetchStrapi('/products?populate=*&filters[isActive][$eq]=true');
        setProducts(data.map(adaptStrapiProduct));
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return { products, isLoading };
};

// Hook para templates globales
export const useStrapiTemplates = (filters?: { occasion?: string }) => {
  const [templates, setTemplates] = useState<DesignTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const params = new URLSearchParams();
        params.append('populate', '*');
        params.append('filters[isActive][$eq]', 'true');
        
        if (filters?.occasion) {
          params.append('filters[occasion][$eq]', filters.occasion);
        }

        const { data } = await fetchStrapi(`/templates?${params.toString()}`);
        
        setTemplates(data.map((t: any) => ({
          id: String(t.id),
          name: t.attributes.name,
          occasion: t.attributes.occasion || 'general',
          preview: t.attributes.name.substring(0, 2).toUpperCase(),
          texts: t.attributes.texts?.map((text: any) => ({
            content: text.content,
            fontFamily: text.fontFamily || 'Bebas Neue',
            size: text.size || 1,
            yPosition: text.yPosition || 50,
          })) || [],
          isActive: t.attributes.isActive,
          isFavorite: t.attributes.isFavorite || false,
          usageCount: t.attributes.usageCount || 0,
          tags: t.attributes.tags?.data?.map((tag: any) => tag.attributes.name) || [],
        })));
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, [filters?.occasion]);

  return { templates, isLoading };
};

// Hook para fuentes
export const useStrapiFonts = () => {
  const [fonts, setFonts] = useState<FontOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFonts = async () => {
      try {
        const { data } = await fetchStrapi('/fonts?filters[isActive][$eq]=true&pagination[pageSize]=100');
        
        const adaptedFonts = data.map((f: any, idx: number) => ({
          id: f.id || idx + 1,
          name: f.attributes.name,
          cssFamily: f.attributes.cssFamily || f.attributes.name,
          category: f.attributes.category || 'BASICAS',
          fileData: f.attributes.fontFile?.data?.attributes?.url 
            ? `${STRAPI_URL}${f.attributes.fontFile.data.attributes.url}`
            : undefined,
        }));

        setFonts(adaptedFonts);

        // Inyectar fuentes
        adaptedFonts.forEach((font: FontOption) => {
          if (font.fileData && !document.getElementById(`font-${font.id}`)) {
            const style = document.createElement('style');
            style.id = `font-${font.id}`;
            style.textContent = `
              @font-face {
                font-family: '${font.cssFamily}';
                src: url('${font.fileData}') format('truetype');
                font-display: swap;
              }
            `;
            document.head.appendChild(style);
          }
        });
      } catch (err) {
        console.error('Error loading fonts:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadFonts();
  }, []);

  return { fonts, isLoading };
};

// Incrementar uso de template
export const incrementTemplateUsage = async (templateId: string | number) => {
  try {
    const { data } = await fetchStrapi(`/templates/${templateId}`);
    const currentCount = data.attributes?.usageCount || 0;

    await fetchStrapi(`/templates/${templateId}`, {
      method: 'PUT',
      body: JSON.stringify({
        data: { usageCount: currentCount + 1 }
      }),
    });
  } catch (e) {
    console.error('Failed to increment usage:', e);
  }
};

export default useStrapiProduct;
