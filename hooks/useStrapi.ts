/**
 * Hook para conectar con Strapi
 */
import { useState, useEffect } from 'react';
import strapiService from '../services/strapiService';

export function useStrapiProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await strapiService.products.getAll();
        if (data && data.length > 0) {
          setProducts(data);
          // Guardar en localStorage como caché
          localStorage.setItem('lm_products_strapi', JSON.stringify(data));
        } else {
          // Si no hay datos, intentar usar caché
          const cached = localStorage.getItem('lm_products_strapi');
          if (cached) {
            setProducts(JSON.parse(cached));
          }
        }
      } catch (err) {
        console.error('Error loading products:', err);
        // Usar caché si hay error
        const cached = localStorage.getItem('lm_products_strapi');
        if (cached) {
          setProducts(JSON.parse(cached));
        }
        setError('Error cargando productos');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  return { products, loading, error };
}

export function useStrapiConfig() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const data = await strapiService.config.get();
        if (data) {
          setConfig(data);
          localStorage.setItem('lm_config_strapi', JSON.stringify(data));
        }
      } catch (err) {
        console.error('Error loading config:', err);
        const cached = localStorage.getItem('lm_config_strapi');
        if (cached) {
          setConfig(JSON.parse(cached));
        }
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  return { config, loading };
}
