// strapi-poc/useStrapiProduct.ts
// Hook para reemplazar el acceso a productos hardcodeados

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
    // Colores mapeados
    colors: attrs.colors?.map((c: any) => ({
      name: c.name,
      hex: c.hexCode,
      priceModifier: c.priceModifier || 0
    })) || [{ name: 'Default', hex: '#C4C4C4' }],
    // Imágenes del producto
    imageUrl: attrs.images?.data?.[0]?.attributes?.url 
      ? `${STRAPI_URL}${attrs.images.data[0].attributes.url}` 
      : '/placeholder-product.png',
    // Stock/config
    stock: attrs.inStock ? 100 : 0,
    stockThreshold: 5,
  };
};

// Adaptador: Templates relacionados al producto
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

// Hook principal
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
      
      const response = await fetch(
        `${STRAPI_URL}/api/products/${productId}?populate[colors]=*&populate[availableTemplates][populate][texts]=*&populate[images]=*&populate[personalizationOptions]=*`,
        {
          headers: {
            ...(API_TOKEN ? { 'Authorization': `Bearer ${API_TOKEN}` } : {}),
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const { data } = await response.json();
      
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

// Hook para listar todos los productos
export const useStrapiProducts = (filters?: { category?: string; brand?: string }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const params = new URLSearchParams();
        params.append('populate', '*');
        params.append('filters[isActive][$eq]', 'true');
        
        if (filters?.category) {
          params.append('filters[category][$eq]', filters.category);
        }
        if (filters?.brand) {
          params.append('filters[brand][$eq]', filters.brand);
        }

        const response = await fetch(
          `${STRAPI_URL}/api/products?${params.toString()}`,
          {
            headers: {
              ...(API_TOKEN ? { 'Authorization': `Bearer ${API_TOKEN}` } : {}),
            },
          }
        );

        const { data } = await response.json();
        setProducts(data.map(adaptStrapiProduct));
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [filters?.category, filters?.brand]);

  return { products, isLoading };
};

// Hook para cargar fuentes desde Strapi
export const useStrapiFonts = () => {
  const [fonts, setFonts] = useState<FontOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFonts = async () => {
      try {
        const response = await fetch(
          `${STRAPI_URL}/api/fonts?filters[isActive][$eq]=true&pagination[pageSize]=100`,
          {
            headers: {
              ...(API_TOKEN ? { 'Authorization': `Bearer ${API_TOKEN}` } : {}),
            },
          }
        );

        const { data } = await response.json();
        
        const adaptedFonts = data.map((f: any, idx: number) => ({
          id: f.id || idx + 1,
          name: f.attributes.name,
          cssFamily: f.attributes.cssFamily || f.attributes.name,
          category: f.attributes.category || 'BASICAS',
          // Si tiene archivo de fuente, crear URL
          fileData: f.attributes.fontFile?.data?.attributes?.url 
            ? `${STRAPI_URL}${f.attributes.fontFile.data.attributes.url}`
            : undefined,
        }));

        setFonts(adaptedFonts);

        // Inyectar fuentes en el documento
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

// Función para incrementar uso de template
export const incrementTemplateUsage = async (templateId: string | number) => {
  try {
    // Primero obtener el valor actual
    const getRes = await fetch(`${STRAPI_URL}/api/templates/${templateId}`);
    const { data } = await getRes.json();
    const currentCount = data.attributes?.usageCount || 0;

    // Actualizar
    await fetch(`${STRAPI_URL}/api/templates/${templateId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(API_TOKEN ? { 'Authorization': `Bearer ${API_TOKEN}` } : {}),
      },
      body: JSON.stringify({
        data: { usageCount: currentCount + 1 }
      }),
    });
  } catch (e) {
    console.error('Failed to increment usage:', e);
  }
};

export default useStrapiProduct;
